// Firestore Sync Engine — Offline-first sync logic
import { doc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { getLocalHealthLogs, EmergencyContact } from './storage';

export const syncHealthLogsToFirestore = async (userId: string): Promise<boolean> => {
  if (!userId || userId.startsWith('demo_user_')) {
    return false; // Skip sync in demo mode or without valid user
  }

  try {
    const logs = await getLocalHealthLogs();
    const unsyncedLogs = logs.filter(l => !l.synced);

    if (unsyncedLogs.length === 0) return true;

    for (const log of unsyncedLogs) {
      const logRef = doc(db, 'users', userId, 'healthLogs', log.id);
      await setDoc(logRef, {
        ...log,
        synced: true,
        syncedAt: new Date().toISOString(),
      }, { merge: true });
      log.synced = true;
    }

    // Update local storage with synced flag
    const updatedLogs = logs.map(l => ({
      ...l,
      synced: true,
    }));
    await AsyncStorage.setItem('@pregnancy_health_logs', JSON.stringify(updatedLogs));

    return true;
  } catch (e) {
    console.log('Firestore sync postponed (offline or auth issue):', e);
    return false;
  }
};

export const syncContactsToFirestore = async (userId: string, contacts: EmergencyContact[]): Promise<boolean> => {
  if (!userId || userId.startsWith('demo_user_')) {
    return false;
  }

  try {
    for (const contact of contacts) {
      const contactRef = doc(db, 'users', userId, 'emergencyContacts', contact.id);
      await setDoc(contactRef, {
        ...contact,
        synced: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
    return true;
  } catch (e) {
    console.log('Firestore contacts sync error:', e);
    return false;
  }
};
