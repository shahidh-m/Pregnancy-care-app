// Firebase configuration with active project credentials
import { initializeApp, getApps } from 'firebase/app';
// @ts-expect-error - getReactNativePersistence is provided in the react-native entry point of firebase/auth
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCNIH8E5wRl3wJNkSvXA9It4WMUo-TQ5KM",
  authDomain: "pregnancy-care-app-781bc.firebaseapp.com",
  projectId: "pregnancy-care-app-781bc",
  storageBucket: "pregnancy-care-app-781bc.firebasestorage.app",
  messagingSenderId: "861526621059",
  appId: "1:861526621059:web:30eaa88232021117f854b6",
  measurementId: "G-TTY92F19Z2"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export auth & firestore instances with AsyncStorage persistence for React Native
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export default app;


