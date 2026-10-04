import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const firebaseConfig = {
    apiKey: "AIzaSyCjkegIcOf_PSqdISXd6MmE3COPxks5Iaw",
    authDomain: "enzocoolcal-ddf39.firebaseapp.com",
    projectId: "enzocoolcal-ddf39",
    storageBucket: "enzocoolcal-ddf39.firebasestorage.app",
    messagingSenderId: "464695118320",
    appId: "1:464695118320:web:92f9fad175d57341c83535",
};

// Initialize modular SDK
let app;
let auth;

if (getApps().length === 0) {
    // First time initialization
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with platform-specific persistence
    if (Platform.OS === 'web') {
        // Web uses browser localStorage persistence
        auth = initializeAuth(app, {
            persistence: browserLocalPersistence
        });
    } else {
        // React Native (iOS/Android) uses AsyncStorage persistence
        // This ensures user stays logged in after app restart
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    }
} else {
    // App already initialized (hot reload case)
    app = getApp();
    auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;