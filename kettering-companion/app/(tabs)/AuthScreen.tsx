// app/screens/AuthScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ActionCodeSettings,
    isSignInWithEmailLink,
    sendSignInLinkToEmail,
    signInWithEmailLink,
} from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');

  // Firebase email link settings
  const actionCodeSettings: ActionCodeSettings = {
    url: 'https://kettering-connect.firebaseapp.com', // replace with your real domain or deep link
    handleCodeInApp: true,
  };

  // Send sign-in link to email
  const handleSendLink = async () => {
    if (!email) return Alert.alert('Please enter an email.');
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      await AsyncStorage.setItem('emailForSignIn', email);
      Alert.alert('Email sent!', 'Check your inbox for the sign-in link.');
      setEmail('');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error sending email link', e.message);
    }
  };

  // Handle sign-in when the user opens the link
  const handleSignInWithLink = async () => {
    try {
      const link = window?.location?.href;
      if (link && isSignInWithEmailLink(auth, link)) {
        const storedEmail = await AsyncStorage.getItem('emailForSignIn');
        if (!storedEmail) return Alert.alert('No email stored for sign-in.');
        const result = await signInWithEmailLink(auth, storedEmail, link);
        Alert.alert(`Signed in as ${result.user.email}`);
        await AsyncStorage.removeItem('emailForSignIn');
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error signing in with link', e.message);
    }
  };

  useEffect(() => {
    handleSignInWithLink();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kettering Companion</Text>

      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleSendLink}>
        <Text style={styles.buttonText}>Send Sign-In Link</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 10, width: '100%', marginBottom: 20 },
  button: { backgroundColor: '#4BA3C7', padding: 14, borderRadius: 12, width: '100%' },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
