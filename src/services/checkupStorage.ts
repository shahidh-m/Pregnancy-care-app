// Doctor Checkup Storage — Primary Delivery Doctors (Max 2) + Occasional Specialists & Visit Logs
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DoctorType = 'primary' | 'occasional';
export type SpecialistType = 'Obstetrician & Gynecologist' | 'Fetal Scan Specialist' | 'Endocrinologist (Sugar)' | 'Dietitian / Nutritionist' | 'Other Specialist';

export interface PrimaryDoctorProfile {
  id: string;
  name: string;
  specialty: string;
  hospitalName: string;
  phone: string;
  isMainDeliveryDoctor: boolean;
  notes?: string;
}

export interface DoctorCheckupItem {
  id: string;
  doctorName: string;
  hospitalName: string;
  doctorType: DoctorType; // 'primary' (regular delivery doc) vs 'occasional'
  specialistCategory?: SpecialistType;
  visitDate: string; // ISO string
  visitTime?: string;
  trimester: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  weightKg?: number;
  babyHeartbeatBpm?: number;
  ultrasoundNotes?: string;
  doctorAdvice?: string;
  prescriptions?: string[];
  nextVisitDate?: string;
  createdAt: string;
}

const STORAGE_KEY_CHECKUPS = '@pregnancy_doctor_checkups';
const STORAGE_KEY_PRIMARY_DOCTORS = '@pregnancy_primary_doctors';

const DEFAULT_PRIMARY_DOCTORS: PrimaryDoctorProfile[] = [
  {
    id: 'pdoc_1',
    name: 'Dr. Savitha Lakshmi',
    specialty: 'Senior Obstetrician & Gynecologist',
    hospitalName: 'Kasturba Gandhi Maternity Hospital',
    phone: '044-28441011',
    isMainDeliveryDoctor: true,
    notes: 'Main primary doctor for monthly checkups and delivery.',
  },
];

const DEFAULT_SAMPLE_CHECKUPS: DoctorCheckupItem[] = [
  {
    id: 'ck_1',
    doctorName: 'Dr. Savitha Lakshmi',
    hospitalName: 'Kasturba Gandhi Maternity Hospital',
    doctorType: 'primary',
    specialistCategory: 'Obstetrician & Gynecologist',
    visitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    trimester: 2,
    bpSystolic: 118,
    bpDiastolic: 76,
    weightKg: 61.5,
    babyHeartbeatBpm: 144,
    ultrasoundNotes: 'Anatomy Scan: Fetal growth normal, placenta posterior, amniotic fluid index optimal (12cm).',
    doctorAdvice: 'Continue Folic Acid & Iron supplement daily. Drink 3L water.',
    prescriptions: ['Autrin Iron Tablets', 'Shelcal 500 Calcium'],
    nextVisitDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

// Primary Doctor Storage
export const getPrimaryDoctors = async (): Promise<PrimaryDoctorProfile[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_PRIMARY_DOCTORS);
    if (json) return JSON.parse(json);
    await AsyncStorage.setItem(STORAGE_KEY_PRIMARY_DOCTORS, JSON.stringify(DEFAULT_PRIMARY_DOCTORS));
    return DEFAULT_PRIMARY_DOCTORS;
  } catch (e) {
    return DEFAULT_PRIMARY_DOCTORS;
  }
};

export const savePrimaryDoctor = async (doc: Omit<PrimaryDoctorProfile, 'id'>): Promise<{ success: boolean; doctor?: PrimaryDoctorProfile; error?: string }> => {
  const current = await getPrimaryDoctors();
  if (current.length >= 2) {
    return { success: false, error: 'Maximum 2 Primary Doctors allowed. Please delete or replace an existing doctor.' };
  }

  const newDoc: PrimaryDoctorProfile = {
    ...doc,
    id: 'pdoc_' + Date.now(),
  };
  const updated = [...current, newDoc];
  await AsyncStorage.setItem(STORAGE_KEY_PRIMARY_DOCTORS, JSON.stringify(updated));
  return { success: true, doctor: newDoc };
};

export const deletePrimaryDoctor = async (id: string): Promise<void> => {
  const current = await getPrimaryDoctors();
  const updated = current.filter(d => d.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY_PRIMARY_DOCTORS, JSON.stringify(updated));
};

// Checkup Items Storage
export const getLocalCheckups = async (): Promise<DoctorCheckupItem[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_CHECKUPS);
    if (json) {
      return JSON.parse(json);
    }
    await AsyncStorage.setItem(STORAGE_KEY_CHECKUPS, JSON.stringify(DEFAULT_SAMPLE_CHECKUPS));
    return DEFAULT_SAMPLE_CHECKUPS;
  } catch (e) {
    return DEFAULT_SAMPLE_CHECKUPS;
  }
};

export const saveDoctorCheckup = async (item: Omit<DoctorCheckupItem, 'id' | 'createdAt'>): Promise<DoctorCheckupItem> => {
  const checkups = await getLocalCheckups();
  const newItem: DoctorCheckupItem = {
    ...item,
    id: 'checkup_' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  const updated = [newItem, ...checkups].sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  await AsyncStorage.setItem(STORAGE_KEY_CHECKUPS, JSON.stringify(updated));
  return newItem;
};

export const deleteDoctorCheckup = async (id: string): Promise<void> => {
  const checkups = await getLocalCheckups();
  const updated = checkups.filter(c => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY_CHECKUPS, JSON.stringify(updated));
};

