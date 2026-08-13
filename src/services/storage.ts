// Local storage helper for health logs, diet logs, emergency contacts, reminders
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HealthLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  weight: number; // in kg
  bpSystolic: number;
  bpDiastolic: number;
  bloodSugar?: number; // in mg/dL
  mood: string;
  symptoms: string[];
  synced: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: 'doctor' | 'husband' | 'mother' | 'father' | 'friend' | 'other';
  hospitalName?: string;
  priorityOrder: number;
  synced: boolean;
}

export interface ReminderItem {
  id: string;
  type: 'medicine' | 'water' | 'appointment' | 'exercise';
  title: string;
  time: string; // HH:mm format
  recurring: boolean;
  active: boolean;
  notificationId?: string;
}

export interface SavedMedicalReport {
  id: string;
  title: string;
  category: 'Blood Test' | 'Ultrasound Scan' | 'Urine Test' | 'Glucose Test' | 'Other Report';
  date: string;
  overallSignal: 'healthy' | 'good' | 'concerned' | 'critical';
  summary: string;
  matchedTerms: any[];
  synced: boolean;
  createdAt: string;
}

const getStorageKey = (baseKey: string, userId?: string): string => {
  if (userId && userId.trim().length > 0) {
    return `@pregnancy_user_${userId}_${baseKey}`;
  }
  return `@pregnancy_${baseKey}`;
};

// Health Logs
export const getLocalHealthLogs = async (userId?: string): Promise<HealthLogEntry[]> => {
  try {
    const key = getStorageKey('health_logs', userId);
    const json = await AsyncStorage.getItem(key);
    if (!json && userId) {
      // Fallback check on global key for migration
      const legacyJson = await AsyncStorage.getItem('@pregnancy_health_logs');
      return legacyJson ? JSON.parse(legacyJson) : [];
    }
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to fetch health logs', e);
    return [];
  }
};

export const saveLocalHealthLogs = async (logs: HealthLogEntry[], userId?: string): Promise<void> => {
  const key = getStorageKey('health_logs', userId);
  await AsyncStorage.setItem(key, JSON.stringify(logs));
};

export const saveLocalHealthLog = async (entry: Omit<HealthLogEntry, 'id' | 'timestamp' | 'synced'>, userId?: string): Promise<HealthLogEntry> => {
  const logs = await getLocalHealthLogs(userId);
  const newEntry: HealthLogEntry = {
    ...entry,
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    synced: false,
  };
  const updated = [newEntry, ...logs];
  await saveLocalHealthLogs(updated, userId);
  return newEntry;
};

// Emergency Contacts
export const getLocalContacts = async (userId?: string): Promise<EmergencyContact[]> => {
  try {
    const key = getStorageKey('emergency_contacts', userId);
    const json = await AsyncStorage.getItem(key);
    if (!json && userId) {
      const legacyJson = await AsyncStorage.getItem('@pregnancy_emergency_contacts');
      return legacyJson ? JSON.parse(legacyJson) : [];
    }
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to fetch contacts', e);
    return [];
  }
};

export const saveLocalContacts = async (contacts: EmergencyContact[], userId?: string): Promise<void> => {
  const key = getStorageKey('emergency_contacts', userId);
  await AsyncStorage.setItem(key, JSON.stringify(contacts));
};

export const addLocalContact = async (contact: Omit<EmergencyContact, 'id' | 'synced'>, userId?: string): Promise<EmergencyContact> => {
  const contacts = await getLocalContacts(userId);
  const newContact: EmergencyContact = {
    ...contact,
    id: 'contact_' + Date.now(),
    synced: false,
  };
  const updated = [...contacts, newContact].sort((a, b) => a.priorityOrder - b.priorityOrder);
  await saveLocalContacts(updated, userId);
  return newContact;
};

export const deleteLocalContact = async (id: string, userId?: string): Promise<void> => {
  const contacts = await getLocalContacts(userId);
  const updated = contacts.filter(c => c.id !== id);
  await saveLocalContacts(updated, userId);
};

// Reminders
export const getLocalReminders = async (userId?: string): Promise<ReminderItem[]> => {
  try {
    const key = getStorageKey('reminders', userId);
    const json = await AsyncStorage.getItem(key);
    if (!json && userId) {
      const legacyJson = await AsyncStorage.getItem('@pregnancy_reminders');
      return legacyJson ? JSON.parse(legacyJson) : [];
    }
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to fetch reminders', e);
    return [];
  }
};

export const saveLocalReminders = async (reminders: ReminderItem[], userId?: string): Promise<void> => {
  const key = getStorageKey('reminders', userId);
  await AsyncStorage.setItem(key, JSON.stringify(reminders));
};

// Medical Reports Storage
export const getLocalMedicalReports = async (userId?: string): Promise<SavedMedicalReport[]> => {
  try {
    const key = getStorageKey('medical_reports', userId);
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to fetch medical reports', e);
    return [];
  }
};

export const saveLocalMedicalReports = async (reports: SavedMedicalReport[], userId?: string): Promise<void> => {
  const key = getStorageKey('medical_reports', userId);
  await AsyncStorage.setItem(key, JSON.stringify(reports));
};

export const saveLocalMedicalReport = async (report: Omit<SavedMedicalReport, 'id' | 'createdAt' | 'synced'>, userId?: string): Promise<SavedMedicalReport> => {
  const reports = await getLocalMedicalReports(userId);
  const newReport: SavedMedicalReport = {
    ...report,
    id: 'report_' + Date.now(),
    createdAt: new Date().toISOString(),
    synced: false,
  };
  const updated = [newReport, ...reports];
  await saveLocalMedicalReports(updated, userId);
  return newReport;
};

export const deleteLocalMedicalReport = async (id: string, userId?: string): Promise<void> => {
  const reports = await getLocalMedicalReports(userId);
  const updated = reports.filter(r => r.id !== id);
  await saveLocalMedicalReports(updated, userId);
};

