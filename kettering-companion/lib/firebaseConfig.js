import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: "AIzaSyCzRS_YIvD7SUNL49C62IDkFfC0uHCox_Q", //This will be taken out later, hardcoding is BAD
    authDomain: "kettering-connect.firebaseapp.com",
    projectId: "kettering-connect",
    storageBucket: "kettering-connect.firebasestorage.app",
    messagingSenderId: "537697026527",
    appId: "1:537697026527:web:16ce548dac36519dfc846a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const functions = getFunctions(app);

let auth;

if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

const db = getFirestore(app);

export { app, auth, db, functions };

