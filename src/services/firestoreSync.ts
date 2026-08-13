// Firestore Sync Engine — Bi-directional sync & complete user account hydration
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';
import {
  getLocalHealthLogs,
  saveLocalHealthLogs,
  getLocalContacts,
  saveLocalContacts,
  getLocalReminders,
  saveLocalReminders,
  getLocalMedicalReports,
  saveLocalMedicalReports,
  HealthLogEntry,
  EmergencyContact,
  ReminderItem,
  SavedMedicalReport
} from './storage';
import {
  getLocalCheckups,
  saveLocalCheckups,
  getPrimaryDoctors,
  savePrimaryDoctors,
  DoctorCheckupItem,
  PrimaryDoctorProfile
} from './checkupStorage';

/**
 * Hydrates all user data from Firebase Firestore down to local AsyncStorage.
 * Called automatically upon login/re-login to restore previous user records!
 */
export const hydrateUserDataFromFirestore = async (userId: string): Promise<boolean> => {
  if (!userId || userId.startsWith('demo_user_') || !db) {
    return false;
  }

  try {
    // 1. Health Logs
    const healthLogsRef = collection(db, 'users', userId, 'healthLogs');
    const healthSnap = await getDocs(healthLogsRef);
    if (!healthSnap.empty) {
      const logs: HealthLogEntry[] = healthSnap.docs.map(doc => ({
        ...(doc.data() as HealthLogEntry),
        id: doc.id,
        synced: true,
      }));
      if (logs.length > 0) {
        await saveLocalHealthLogs(logs, userId);
      }
    }

    // 2. Emergency Contacts
    const contactsRef = collection(db, 'users', userId, 'emergencyContacts');
    const contactsSnap = await getDocs(contactsRef);
    if (!contactsSnap.empty) {
      const contacts: EmergencyContact[] = contactsSnap.docs.map(doc => ({
        ...(doc.data() as EmergencyContact),
        id: doc.id,
        synced: true,
      }));
      if (contacts.length > 0) {
        await saveLocalContacts(contacts, userId);
      }
    }

    // 3. Primary Doctors
    const pdocRef = collection(db, 'users', userId, 'primaryDoctors');
    const pdocSnap = await getDocs(pdocRef);
    if (!pdocSnap.empty) {
      const docs: PrimaryDoctorProfile[] = pdocSnap.docs.map(doc => ({
        ...(doc.data() as PrimaryDoctorProfile),
        id: doc.id,
      }));
      if (docs.length > 0) {
        await savePrimaryDoctors(docs, userId);
      }
    }

    // 4. Doctor Checkups
    const checkupsRef = collection(db, 'users', userId, 'checkups');
    const checkupsSnap = await getDocs(checkupsRef);
    if (!checkupsSnap.empty) {
      const checkups: DoctorCheckupItem[] = checkupsSnap.docs.map(doc => ({
        ...(doc.data() as DoctorCheckupItem),
        id: doc.id,
      }));
      if (checkups.length > 0) {
        await saveLocalCheckups(checkups, userId);
      }
    }

    // 5. Medical Reports
    const reportsRef = collection(db, 'users', userId, 'medicalReports');
    const reportsSnap = await getDocs(reportsRef);
    if (!reportsSnap.empty) {
      const reports: SavedMedicalReport[] = reportsSnap.docs.map(doc => ({
        ...(doc.data() as SavedMedicalReport),
        id: doc.id,
        synced: true,
      }));
      if (reports.length > 0) {
        await saveLocalMedicalReports(reports, userId);
      }
    }

    // 6. Reminders
    const remindersRef = collection(db, 'users', userId, 'reminders');
    const remindersSnap = await getDocs(remindersRef);
    if (!remindersSnap.empty) {
      const reminders: ReminderItem[] = remindersSnap.docs.map(doc => ({
        ...(doc.data() as ReminderItem),
        id: doc.id,
      }));
      if (reminders.length > 0) {
        await saveLocalReminders(reminders, userId);
      }
    }

    return true;
  } catch (e) {
    console.log('Firestore hydration warning (offline or first login):', e);
    return false;
  }
};

/**
 * Pushes unsynced local data up to Firebase Firestore.
 */
export const syncHealthLogsToFirestore = async (userId: string): Promise<boolean> => {
  if (!userId || userId.startsWith('demo_user_') || !db) {
    return false;
  }

  try {
    const logs = await getLocalHealthLogs(userId);
    const unsyncedLogs = logs.filter(l => !l.synced);

    for (const log of unsyncedLogs) {
      const logRef = doc(db, 'users', userId, 'healthLogs', log.id);
      await setDoc(logRef, {
        ...log,
        synced: true,
        syncedAt: new Date().toISOString(),
      }, { merge: true });
      log.synced = true;
    }

    if (unsyncedLogs.length > 0) {
      await saveLocalHealthLogs(logs, userId);
    }
    return true;
  } catch (e) {
    console.log('Firestore health log sync error:', e);
    return false;
  }
};

export const syncContactsToFirestore = async (userId: string, contacts?: EmergencyContact[]): Promise<boolean> => {
  if (!userId || userId.startsWith('demo_user_') || !db) {
    return false;
  }

  try {
    const contactsToSync = contacts || await getLocalContacts(userId);
    for (const contact of contactsToSync) {
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

export const syncCheckupsToFirestore = async (userId: string): Promise<boolean> => {
  if (!userId || userId.startsWith('demo_user_') || !db) {
    return false;
  }

  try {
    const checkups = await getLocalCheckups(userId);
    for (const checkup of checkups) {
      const ref = doc(db, 'users', userId, 'checkups', checkup.id);
      await setDoc(ref, {
        ...checkup,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    const pdocs = await getPrimaryDoctors(userId);
    for (const pdoc of pdocs) {
      const ref = doc(db, 'users', userId, 'primaryDoctors', pdoc.id);
      await setDoc(ref, pdoc, { merge: true });
    }
    return true;
  } catch (e) {
    console.log('Firestore checkups sync error:', e);
    return false;
  }
};

export const syncReportsToFirestore = async (userId: string): Promise<boolean> => {
  if (!userId || userId.startsWith('demo_user_') || !db) {
    return false;
  }

  try {
    const reports = await getLocalMedicalReports(userId);
    for (const report of reports) {
      const ref = doc(db, 'users', userId, 'medicalReports', report.id);
      await setDoc(ref, {
        ...report,
        synced: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
    return true;
  } catch (e) {
    console.log('Firestore reports sync error:', e);
    return false;
  }
};

/**
 * Triggers a complete sync of all local components to Firestore
 */
export const syncAllToFirestore = async (userId: string): Promise<void> => {
  if (!userId || userId.startsWith('demo_user_')) return;
  await Promise.allSettled([
    syncHealthLogsToFirestore(userId),
    syncContactsToFirestore(userId),
    syncCheckupsToFirestore(userId),
    syncReportsToFirestore(userId),
  ]);
};

