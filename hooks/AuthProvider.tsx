import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as fbSignOut, reauthenticateWithCredential, PhoneAuthProvider } from 'firebase/auth';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
    saveUserProfileToStorage, 
    getUserProfileFromStorage, 
    clearUserProfileFromStorage, 
    isCachedProfileValid,
    type StoredUserProfile 
} from '@/utils/userStorage';

const GUEST_MODE_KEY = 'enzo_guest_mode';
const GUEST_INPUTS_KEY = 'enzo_guest_inputs';

type UserProfile = {
    uid: string;
    name: string;
    email: string;
    city: string;
    company: string;
    phone: string;
    userType: string;
    createdAt: any;
    updatedAt: any;
};

type GuestInputs = {
    roomData?: any;
    productData?: any;
    miscData?: any;
};

type AuthContextValue = {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    // Helper function to get display name with fallback
    getUserDisplayName: () => string;
    // Guest mode support
    isGuestMode: boolean;
    enableGuestMode: () => Promise<void>;
    disableGuestMode: () => Promise<void>;
    // Guest inputs management
    saveGuestInputs: (inputs: GuestInputs) => Promise<void>;
    getGuestInputs: () => Promise<GuestInputs | null>;
    clearGuestInputs: () => Promise<void>;
    // Delete user account
    deleteUserAccount: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuestMode, setIsGuestMode] = useState(false);

    // Helper function to get display name with fallback
    const getUserDisplayName = (): string => {
        if (userProfile?.name) {
            return userProfile.name;
        }
        return 'User'; // Default fallback name
    };

    // Guest mode functions
    const enableGuestMode = async () => {
        try {
            await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
            setIsGuestMode(true);
            console.log('[AuthProvider] Guest mode enabled');
        } catch (error) {
            console.error('[AuthProvider] Failed to enable guest mode:', error);
        }
    };

    const disableGuestMode = async () => {
        try {
            await AsyncStorage.removeItem(GUEST_MODE_KEY);
            setIsGuestMode(false);
            console.log('[AuthProvider] Guest mode disabled');
        } catch (error) {
            console.error('[AuthProvider] Failed to disable guest mode:', error);
        }
    };

    // Guest inputs management
    const saveGuestInputs = async (inputs: GuestInputs) => {
        try {
            await AsyncStorage.setItem(GUEST_INPUTS_KEY, JSON.stringify(inputs));
            console.log('[AuthProvider] Guest inputs saved');
        } catch (error) {
            console.error('[AuthProvider] Failed to save guest inputs:', error);
        }
    };

    const getGuestInputs = async (): Promise<GuestInputs | null> => {
        try {
            const stored = await AsyncStorage.getItem(GUEST_INPUTS_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
            return null;
        } catch (error) {
            console.error('[AuthProvider] Failed to get guest inputs:', error);
            return null;
        }
    };

    const clearGuestInputs = async () => {
        try {
            await AsyncStorage.removeItem(GUEST_INPUTS_KEY);
            console.log('[AuthProvider] Guest inputs cleared');
        } catch (error) {
            console.error('[AuthProvider] Failed to clear guest inputs:', error);
        }
    };

    // Delete user account
    const deleteUserAccount = async (): Promise<boolean> => {
        try {
            if (!user) {
                console.error('[AuthProvider] No user to delete');
                return false;
            }

            console.log('[AuthProvider] Starting account deletion process...');

            // First, try to delete without re-authentication
            try {
                // Delete the user's saved calculations (one doc per type: `${uid}_${type}`).
                // Missing docs are rejected by rules, so ignore individual failures.
                const calculationTypes = ['cold_room', 'blast_freezer', 'freezer_room'];
                await Promise.allSettled(
                    calculationTypes.map((type) => deleteDoc(doc(db, 'user_calculations', `${user.uid}_${type}`)))
                );
                console.log('[AuthProvider] User calculations deleted from Firestore');

                // Delete user document from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                await deleteDoc(userDocRef);
                console.log('[AuthProvider] User document deleted from Firestore');

                // Delete user from Firebase Auth
                await user.delete();
                console.log('[AuthProvider] User deleted from Firebase Auth');

                // Clear local storage
                await clearUserProfileFromStorage();
                await disableGuestMode();
                await clearGuestInputs();

                return true;
            } catch (deleteError: any) {
                // If deletion fails due to requires-recent-login, the user needs to sign out and back in
                if (deleteError?.code === 'auth/requires-recent-login') {
                    console.error('[AuthProvider] Account deletion requires recent login');
                    throw new Error('For security reasons, please sign out and sign back in, then try deleting your account again.');
                }
                throw deleteError;
            }
        } catch (error: any) {
            console.error('[AuthProvider] Failed to delete user account:', error);
            throw error;
        }
    };

    // Check guest mode on mount
    useEffect(() => {
        const checkGuestMode = async () => {
            try {
                const guestMode = await AsyncStorage.getItem(GUEST_MODE_KEY);
                if (guestMode === 'true') {
                    setIsGuestMode(true);
                    console.log('[AuthProvider] Guest mode restored from storage');
                }
            } catch (error) {
                console.error('[AuthProvider] Failed to check guest mode:', error);
            }
        };
        checkGuestMode();
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            
            if (u) {
                console.log('[AuthProvider] User authenticated, fetching profile...');
                
                // First, try to load from local storage for immediate display
                const cachedProfile = await getUserProfileFromStorage();
                if (cachedProfile && isCachedProfileValid(cachedProfile)) {
                    console.log('[AuthProvider] Using valid cached profile');
                    setUserProfile({
                        uid: cachedProfile.uid,
                        name: cachedProfile.name,
                        email: cachedProfile.email,
                        city: cachedProfile.city,
                        company: cachedProfile.company,
                        phone: cachedProfile.phone,
                        userType: cachedProfile.userType,
                        createdAt: null, // Not stored in cache
                        updatedAt: null  // Not stored in cache
                    });
                }
                
                // Then, try to fetch fresh data from Firestore
                try {
                    console.log('[AuthProvider] Fetching fresh user profile from Firestore for UID:', u.uid);
                    const userDocRef = doc(db, 'users', u.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const rawData = userDoc.data();
                        const profileData: UserProfile = {
                            uid: rawData.uid ?? u.uid,
                            name: rawData.name ?? '',
                            email: rawData.email ?? '',
                            city: rawData.city ?? '',
                            company: rawData.company ?? '',
                            phone: rawData.phone ?? (u.phoneNumber || ''),
                            userType: rawData.userType ?? 'end_user',
                            createdAt: rawData.createdAt ?? null,
                            updatedAt: rawData.updatedAt ?? null,
                        };
                        console.log('[AuthProvider] Fresh user profile loaded from Firestore:', {
                            name: profileData.name,
                            email: profileData.email,
                            city: profileData.city,
                            company: profileData.company,
                            userType: profileData.userType
                        });
                        
                        setUserProfile(profileData);
                        
                        // Save to local storage for offline use
                        await saveUserProfileToStorage({
                            uid: profileData.uid,
                            name: profileData.name,
                            email: profileData.email,
                            city: profileData.city,
                            company: profileData.company,
                            phone: profileData.phone,
                            userType: profileData.userType,
                            cachedAt: Date.now()
                        });
                    } else {
                        console.warn('[AuthProvider] User document not found in Firestore for UID:', u.uid);
                        // Keep cached profile if available, otherwise set to null
                        if (!cachedProfile) {
                            setUserProfile(null);
                        }
                    }
                } catch (error) {
                    console.error('[AuthProvider] Failed to fetch user profile from Firestore:', error);
                    console.log('[AuthProvider] Using cached profile or falling back to defaults');
                    
                    // If we don't have cached data and Firestore fails, use a minimal profile
                    if (!cachedProfile) {
                        console.warn('[AuthProvider] No cached profile available, creating minimal profile');
                        setUserProfile({
                            uid: u.uid,
                            name: 'User', // Default name for offline users
                            email: u.email || '',
                            city: '',
                            company: '',
                            phone: u.phoneNumber || '',
                            userType: 'end_user',
                            createdAt: null,
                            updatedAt: null
                        });
                    }
                }
            } else {
                console.log('[AuthProvider] User signed out, clearing profile');
                setUserProfile(null);
                await clearUserProfileFromStorage();
            }
            
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const signOut = async () => {
        await clearUserProfileFromStorage();
        await disableGuestMode();
        await fbSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            userProfile, 
            loading, 
            signOut, 
            getUserDisplayName,
            isGuestMode,
            enableGuestMode,
            disableGuestMode,
            saveGuestInputs,
            getGuestInputs,
            clearGuestInputs,
            deleteUserAccount
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
