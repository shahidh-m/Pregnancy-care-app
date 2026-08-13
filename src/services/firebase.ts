// Firebase configuration with active project credentials
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

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

// Export auth & firestore instances
export const auth = getAuth(app);

export const db = getFirestore(app);
export default app;

