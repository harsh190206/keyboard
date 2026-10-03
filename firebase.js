import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const firebaseConfig = {
    apiKey: "AIzaSyDJ48xdhE7vzpvLZki4xpmlPs_npWQ3yqg",
    authDomain: "enzocoolcal.firebaseapp.com",
    projectId: "enzocoolcal",
    storageBucket: "enzocoolcal.firebasestorage.app",
    messagingSenderId: "1038545137524",
    appId: "1:1038545137524:web:9bd6993787d5b57b5c0621",
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