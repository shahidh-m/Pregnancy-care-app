import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { hydrateUserDataFromFirestore, syncAllToFirestore } from '../services/firestoreSync';

export type UserRole = 'mother' | 'companion';
export type RelationshipType = 'husband' | 'mother' | 'father' | 'sister' | 'doctor' | 'friend' | 'other';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  relationship?: RelationshipType;
  dueDate: string; // ISO date string for mother
  pairingCode: string; // 6-digit code generated for mother
  connectedMotherId?: string; // code or UID of paired mother for companion
  connectedMotherName?: string;
  language: string;
  createdAt: string;
  isDemo: boolean;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  signInDemo: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  completeOnboarding: (profile: Partial<UserProfile>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  pairCompanion: (code: string, relationship: RelationshipType, motherName?: string) => Promise<boolean>;
}

const PROFILE_STORAGE_KEY = '@pregnancy_care_profile';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isOnboarded: false,
  signInDemo: () => {},
  signInWithGoogle: async () => {},
  signOut: () => {},
  completeOnboarding: () => {},
  updateProfile: () => {},
  pairCompanion: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const generatePairingCode = (): string => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return `PREG-${code.substring(0, 3)}-${code.substring(3)}`;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  // Sync profile document to Firestore Cloud
  const saveProfileToFirestore = async (profile: UserProfile) => {
    if (!profile.uid || profile.isDemo || !db) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      await setDoc(userRef, {
        ...profile,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.log('Failed to push profile to Firestore:', e);
    }
  };

  // Load persisted auth state & hydrate cloud records
  useEffect(() => {
    const load = async () => {
      try {
        const profileJson = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (profileJson) {
          const profile = JSON.parse(profileJson) as UserProfile;
          if (!profile.pairingCode) {
            profile.pairingCode = generatePairingCode();
          }
          if (!profile.role) {
            profile.role = 'mother';
          }
          setUser(profile);
          setIsOnboarded(true);

          // Background hydration from Firestore cloud for existing user
          if (!profile.isDemo) {
            hydrateUserDataFromFirestore(profile.uid);
          }
        }
      } catch (e) {
        // no saved auth
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const signInDemo = () => {
    const demoUser: UserProfile = {
      uid: 'demo_user_' + Date.now(),
      name: '',
      email: 'demo@pregnancycare.app',
      role: 'mother',
      dueDate: '',
      pairingCode: generatePairingCode(),
      language: 'en',
      createdAt: new Date().toISOString(),
      isDemo: true,
    };
    setUser(demoUser);
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      // Check if user profile already exists in Firestore
      let existingProfile: Partial<UserProfile> = {};
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            existingProfile = userDoc.data() as UserProfile;
          }
        } catch (e) {
          console.log('Firestore fetch user profile doc fallback');
        }
      }

      const googleUser: UserProfile = {
        uid: fbUser.uid,
        name: existingProfile.name || fbUser.displayName || 'Mom',
        email: fbUser.email || existingProfile.email || '',
        role: existingProfile.role || 'mother',
        dueDate: existingProfile.dueDate || '',
        pairingCode: existingProfile.pairingCode || generatePairingCode(),
        language: existingProfile.language || 'en',
        createdAt: existingProfile.createdAt || new Date().toISOString(),
        isDemo: false,
      };

      setUser(googleUser);
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(googleUser));
      await saveProfileToFirestore(googleUser);

      // Hydrate all health logs, emergency contacts, checkups, reports & reminders from Firestore cloud!
      await hydrateUserDataFromFirestore(googleUser.uid);
      if (googleUser.dueDate) {
        setIsOnboarded(true);
      }
    } catch (error: any) {
      console.error('Firebase Google Auth Error:', error);
      if (Platform.OS === 'web') {
        throw error;
      } else {
        // Fallback gracefully to demo mode on native mobile Expo Go
        signInDemo();
      }
    }
  };

  const signOut = async () => {
    const currentUid = user?.uid;
    setUser(null);
    setIsOnboarded(false);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // signOut error ignore
    }
    try {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (e) {
      // cleanup failed silently
    }
  };

  const completeOnboarding = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      ...profile,
      pairingCode: user.pairingCode || generatePairingCode(),
    };
    setUser(updatedUser);
    setIsOnboarded(true);
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedUser));
      await saveProfileToFirestore(updatedUser);
      await syncAllToFirestore(updatedUser.uid);
    } catch (e) {
      // persist failed
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedUser));
      await saveProfileToFirestore(updatedUser);
    } catch (e) {
      // persist failed
    }
  };

  const pairCompanion = async (code: string, relationship: RelationshipType, motherName: string = 'Anitha (Mom)'): Promise<boolean> => {
    if (!user) return false;
    const formattedCode = code.trim().toUpperCase();
    const updatedUser: UserProfile = {
      ...user,
      role: 'companion',
      relationship,
      connectedMotherId: formattedCode,
      connectedMotherName: motherName,
    };
    setUser(updatedUser);
    setIsOnboarded(true);
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedUser));
      await saveProfileToFirestore(updatedUser);
      // Save link in local storage bridge for P2P companion network demo
      await AsyncStorage.setItem('@companion_linked_mother', JSON.stringify({
        code: formattedCode,
        motherName,
        linkedAt: new Date().toISOString(),
      }));
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isOnboarded, signInDemo, signInWithGoogle, signOut, completeOnboarding, updateProfile, pairCompanion }}>
      {children}
    </AuthContext.Provider>
  );
};


