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

const STORAGE_KEYS = {
  HEALTH_LOGS: '@pregnancy_health_logs',
  DIET_LOGS: '@pregnancy_diet_logs',
  CONTACTS: '@pregnancy_emergency_contacts',
  REMINDERS: '@pregnancy_reminders',
};

// Health Logs
export const getLocalHealthLogs = async (): Promise<HealthLogEntry[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_LOGS);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to fetch health logs', e);
    return [];
  }
};

export const saveLocalHealthLog = async (entry: Omit<HealthLogEntry, 'id' | 'timestamp' | 'synced'>): Promise<HealthLogEntry> => {
  const logs = await getLocalHealthLogs();
  const newEntry: HealthLogEntry = {
    ...entry,
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    synced: false,
  };
  const updated = [newEntry, ...logs];
  await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_LOGS, JSON.stringify(updated));
  return newEntry;
};

// Emergency Contacts
export const getLocalContacts = async (): Promise<EmergencyContact[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to fetch contacts', e);
    return [];
  }
};

export const saveLocalContacts = async (contacts: EmergencyContact[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
};

export const addLocalContact = async (contact: Omit<EmergencyContact, 'id' | 'synced'>): Promise<EmergencyContact> => {
  const contacts = await getLocalContacts();
  const newContact: EmergencyContact = {
    ...contact,
    id: 'contact_' + Date.now(),
    synced: false,
  };
  const updated = [...contacts, newContact].sort((a, b) => a.priorityOrder - b.priorityOrder);
  await saveLocalContacts(updated);
  return newContact;
};

export const deleteLocalContact = async (id: string): Promise<void> => {
  const contacts = await getLocalContacts();
  const updated = contacts.filter(c => c.id !== id);
  await saveLocalContacts(updated);
};

// Reminders
export const getLocalReminders = async (): Promise<ReminderItem[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to fetch reminders', e);
    return [];
  }
};

export const saveLocalReminders = async (reminders: ReminderItem[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
};
