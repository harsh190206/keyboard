import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions } from 'react-native';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaVerifierModalHandle } from '@/components/FirebaseRecaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { query, collection, where, getDocs, limit } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '@/firebase';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/AuthProvider';
import { useStorageContext } from '@/hooks/StorageProvider';

export default function SignInScreen() {
    const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModalHandle>(null);
    const [mode, setMode] = useState<'login' | 'otp'>('login');
    const [phone, setPhone] = useState('');
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { enableGuestMode, getGuestInputs, clearGuestInputs, disableGuestMode } = useAuth();
    const { restoreFromGuestInputs } = useStorageContext();

    // Handle continue without signin
    const handleContinueWithoutSignin = async () => {
        await enableGuestMode();
        router.replace('/(tabs)' as any);
    };

    // Handle phone number input - only numbers, max 10 digits
    const handlePhoneChange = (text: string) => {
        const numericText = text.replace(/[^0-9]/g, '');
        if (numericText.length <= 10) {
            setPhone(numericText);
        }
    };

    // Handle OTP input - only numbers, max 6 digits
    const handleOTPChange = (text: string) => {
        const numericText = text.replace(/[^0-9]/g, '');
        if (numericText.length <= 6) {
            setCode(numericText);
        }
    };

    // Send OTP if user exists
    const sendOTPForLogin = async () => {
        setLoading(true);
        try {
            if (phone.length !== 10) {
                Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number.');
                setLoading(false);
                return;
            }

            const fullPhoneNumber = `+91${phone}`;
            console.log(`[SignIn] Checking for existing user with phone: ${fullPhoneNumber}`);

            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('phone', '==', fullPhoneNumber), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error('[SignIn] Error: No user found with this phone number.');
                Alert.alert('Account Not Found', 'No account is associated with this phone number. Please sign up first.');
                setLoading(false);
                return;
            }

            console.log('[SignIn] User found. Sending OTP via WebView...');
            
            // Use the new requestOTP method which handles reCAPTCHA in WebView
            const id = await recaptchaVerifier.current?.requestOTP(fullPhoneNumber);
            
            if (id) {
                setVerificationId(id);
                setMode('otp');
                Alert.alert('OTP Sent', 'A verification code has been sent to your phone number.');
            } else {
                throw new Error('Failed to get verification ID');
            }

        } catch (e: any) {
            console.error('[SignIn] Send OTP Error:', e);
            console.error('[SignIn] Error code:', e?.code);
            console.error('[SignIn] Error message:', e?.message);
            
            const errorCode = e?.code || 'unknown';
            const errorMessage = e?.message || 'Unknown error occurred';
            Alert.alert(
                'Error Sending OTP', 
                `${errorMessage}\n\nError Code: ${errorCode}`
            );
        } finally {
            setLoading(false);
        }
    };

    // Confirm OTP and sign in
    const confirmOTPForLogin = async () => {
        setLoading(true);
        try {
            if (!verificationId) {
                Alert.alert('Verification Error', 'Could not verify phone number. Please try sending the OTP again.');
                setLoading(false);
                return;
            }
            if (code.length !== 6) {
                Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP.');
                setLoading(false);
                return;
            }

            console.log('[SignIn] Verifying OTP using React Native Firebase...');
            
            // Create credential and sign in using the MAIN APP's Firebase auth
            const credential = PhoneAuthProvider.credential(verificationId, code);
            const userCredential = await signInWithCredential(auth, credential);
            
            console.log('[SignIn] ✅ Sign-in successful! UID:', userCredential.user.uid);

            // Restore guest inputs if available
            const guestInputs = await getGuestInputs();
            if (guestInputs) {
                console.log('[SignIn] Restoring guest inputs after signin');
                restoreFromGuestInputs(guestInputs);
                await clearGuestInputs();
            }

            // Disable guest mode since user is now logged in
            await disableGuestMode();

            console.log('[SignIn] Navigating to cold room.');
            router.replace('/(tabs)' as any);

        } catch (e: any) {
            console.error('[SignIn] OTP Verification Failed:', e);
            console.error('[SignIn] Error code:', e?.code);
            console.error('[SignIn] Error message:', e?.message);
            
            let title = 'Sign-In Failed';
            let message = e?.message || 'An unexpected error occurred. Please try again.';

            switch (e?.code) {
                case 'auth/invalid-verification-code':
                    title = 'Invalid OTP';
                    message = 'The OTP you entered is incorrect. Please try again.';
                    break;
                case 'auth/code-expired':
                    title = 'OTP Expired';
                    message = 'The OTP has expired. Please request a new one.';
                    break;
                default:
                    message = `${e?.message || 'Unknown error'}\n\nError Code: ${e?.code || 'unknown'}`;
            }
            Alert.alert(title, message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={firebaseConfig as any}
                attemptInvisibleVerification
            />
            <KeyboardAvoidingView 
                behavior={Platform.select({ ios: 'padding', android: 'height' })} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.select({ ios: 0, android: 20 })}
            >
                <ScrollView 
                    contentContainerStyle={styles.content} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.logoContainer}>
                        <Image 
                            source={require('@/assets/images/output_450x255.jpg')} 
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.appName}>CoolCalc</Text>
                    </View>
                    
                    <Text style={styles.title}>
                        {mode === 'login' ? 'Welcome back' : 'Verify Phone'}
                    </Text>

                    {mode === 'login' ? (
                        <>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Phone number (10 digits)" 
                                placeholderTextColor="#6b7280"
                                keyboardType="number-pad" 
                                value={phone} 
                                onChangeText={handlePhoneChange}
                                maxLength={10}
                                returnKeyType="done"
                            />
                            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={sendOTPForLogin} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.subtitle}>Enter the OTP sent to +91{phone}</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Enter 6-digit OTP" 
                                placeholderTextColor="#6b7280"
                                keyboardType="number-pad" 
                                value={code} 
                                onChangeText={handleOTPChange}
                                maxLength={6}
                                returnKeyType="done"
                            />
                            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={confirmOTPForLogin} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify & Sign In'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.link} onPress={() => setMode('login')}>
                                <Text style={styles.linkText}>← Back to phone number</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {mode === 'login' && (
                        <TouchableOpacity style={styles.link} onPress={() => router.replace('/sign-up' as any)}>
                            <Text style={styles.linkText}>New here? Create account</Text>
                        </TouchableOpacity>
                    )}

                    {mode === 'login' && (
                        <TouchableOpacity style={styles.guestLink} onPress={handleContinueWithoutSignin}>
                            <Text style={styles.guestLinkText}>Continue without signing in</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { 
        padding: 16, 
        flexGrow: 1, 
        justifyContent: 'center',
        minHeight: '100%',
        paddingBottom: 50,
    },
    logoContainer: { 
        alignItems: 'center', 
        marginBottom: 30,
        paddingVertical: 26,
    },
    logo: { 
        width: Math.min(width * 0.66, 264), 
        height: Math.min(width * 0.66 * (255 / 450), 150), 
        maxWidth: 264,
        maxHeight: 150,
        marginBottom: 14,
        borderRadius: 16,
        overflow: 'hidden',
    },
    appName: { 
        fontSize: Math.min(width * 0.088, 33), 
        fontWeight: '900', 
        color: '#0f172a', 
        letterSpacing: 0.55,
        textTransform: 'uppercase',
    },
    title: { fontSize: 26, fontWeight: '800', marginBottom: 14, textAlign: 'center', color: '#111827' },
    subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 12 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12 },
    button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center' },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontWeight: '700' },
    link: { marginTop: 12, alignItems: 'center' },
    linkText: { color: '#2563eb', fontWeight: '600' },
    guestLink: { marginTop: 20, alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
    guestLinkText: { color: '#6b7280', fontWeight: '500', fontSize: 14 },
});
