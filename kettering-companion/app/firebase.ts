import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCzRS_YIvD7SUNL49C62IDkFfC0uHCox_Q", //This will be taken out later, hardcoding is BAD
    authDomain: "kettering-connect.firebaseapp.com",
    projectId: "kettering-connect",
    storageBucket: "kettering-connect.firebasestorage.app",
    messagingSenderId: "537697026527",
    appId: "1:537697026527:web:16ce548dac36519dfc846a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = AsyncStorage;