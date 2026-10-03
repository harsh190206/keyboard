import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { updatePassword as firebaseUpdatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export default function UpdatePasswordScreen() {
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Passwords Don't Match", 'Please make sure both passwords are the same.');
            return;
        }
        if (!phone) {
            Alert.alert('Error', 'Phone number not found. Please go back and try again.');
            return;
        }

        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                // This should not happen if the user just verified via OTP.
                throw new Error("No authenticated user found. Please restart the password reset process.");
            }

            console.log(`[UpdatePassword] Starting password update for user: ${currentUser.uid}`);

            // Step 1: Update the password in Firebase Authentication.
            await firebaseUpdatePassword(currentUser, newPassword);
            console.log('[UpdatePassword] Successfully updated password in Firebase Auth.');

            // Step 2: Touch the user's Firestore profile. The password itself lives only in Firebase Auth.
            try {
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    updatedAt: new Date(),
                });
                console.log('[UpdatePassword] Updated user profile timestamp in Firestore.');
            } catch (e) {
                console.warn('[UpdatePassword] Could not update user profile in Firestore, but Auth password was changed.', e);
            }

            // Step 3: Sign the user out and redirect to the sign-in page.
            await auth.signOut();
            Alert.alert(
                'Password Updated',
                'Your password has been successfully updated. Please sign in with your new password.',
                [{ text: 'OK', onPress: () => router.replace('/sign-in') }]
            );

        } catch (e: any) {
            console.error('[UpdatePassword] Error:', JSON.stringify(e, null, 2));
            let message = 'An error occurred while updating your password. Please try again.';
            if (e.code === 'auth/requires-recent-login') {
                message = 'For your security, please sign in again before changing your password.';
            }
            Alert.alert('Update Failed', `${message} (Code: ${e.code})`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                            source={require('@/assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.appName}>CoolCalc</Text>
                    </View>

                    <Text style={styles.title}>Set New Password</Text>
                    <Text style={styles.subtitle}>Create a new password for your account associated with +91{phone}</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="New password (min 6 characters)"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                        returnKeyType="next"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm new password"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        returnKeyType="done"
                    />
                    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleUpdatePassword} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Update Password'}</Text>
                    </TouchableOpacity>
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
        marginBottom: 24,
        paddingVertical: 20,
    },
    logo: {
        width: Math.min(width * 0.15, 80),
        height: Math.min(width * 0.15, 80),
        marginBottom: 8,
    },
    appName: {
        fontSize: Math.min(width * 0.06, 24),
        fontWeight: '900',
        color: '#000000',
    },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12 },
    button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center' },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontWeight: '700' },
});
