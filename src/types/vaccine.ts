// Vaccine types & interfaces for Pregnancy Vaccine Tracker feature

export type VaccineCategory = 'mandatory' | 'recommended' | 'approved';

export type VaccineAvailability = 'phc_free' | 'govt_hospital' | 'private' | 'both';

export type VaccineTrimester = 1 | 2 | 3 | 'any';

export interface VaccineDose {
  id: string;
  vaccineId: string;
  doseNumber: number;
  label: string;
  labelTa: string;
  weekStart: number;       // Earliest pregnancy week to administer
  weekEnd: number;         // Latest pregnancy week to administer
  trimester: VaccineTrimester;
  description: string;
  descriptionTa: string;
  specialCondition?: string;  // e.g., "4 weeks after Td-1"
  specialConditionTa?: string;
}

export interface PregnancyVaccine {
  id: string;
  name: string;
  nameTa: string;
  fullName: string;
  fullNameTa: string;
  category: VaccineCategory;
  availability: VaccineAvailability;
  purpose: string;
  purposeTa: string;
  importantNote?: string;
  importantNoteTa?: string;
  protectsAgainst: string[];
  protectsAgainstTa: string[];
  sideEffects: string[];
  sideEffectsTa: string[];
  contraindications?: string;
  contraindicationsTa?: string;
  source: string;            // Official source (e.g., "NIS / UIP", "FOGSI")
  doses: VaccineDose[];
  isFreeAtPHC: boolean;
}

export interface ContraindicatedVaccine {
  id: string;
  name: string;
  nameTa: string;
  type: string;
  typeTa: string;
  reason: string;
  reasonTa: string;
}

export interface VaccineTrackerProfile {
  completedDoseIds: string[];
  previousTdWithin3Years: boolean;  // Affects whether Td booster is needed
  tdapPreference: boolean;          // Whether user opts for Tdap (recommended)
}
