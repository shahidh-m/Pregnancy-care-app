// Storage service for User Scheme Profile, PICME Registration details & Milestone Checklist
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSchemeProfile } from '../types/scheme';
import { DEFAULT_USER_SCHEME_PROFILE } from './schemeEngine';

const SCHEME_PROFILE_STORAGE_KEY = '@pregnancy_care_scheme_profile';

/**
 * Load user scheme profile from local storage
 */
export const getStoredSchemeProfile = async (): Promise<UserSchemeProfile> => {
  try {
    const json = await AsyncStorage.getItem(SCHEME_PROFILE_STORAGE_KEY);
    if (json) {
      const parsed = JSON.parse(json) as UserSchemeProfile;
      return {
        ...DEFAULT_USER_SCHEME_PROFILE,
        ...parsed,
        completedMilestoneIds: parsed.completedMilestoneIds || [],
        checkedDocumentIds: parsed.checkedDocumentIds || [],
      };
    }
  } catch (e) {
    console.error('Failed to load scheme profile:', e);
  }
  return DEFAULT_USER_SCHEME_PROFILE;
};

/**
 * Save updated user scheme profile
 */
export const saveStoredSchemeProfile = async (profile: UserSchemeProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(SCHEME_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save scheme profile:', e);
  }
};

/**
 * Toggle completed status of a milestone ID
 */
export const toggleMilestoneCompletion = async (milestoneId: string): Promise<UserSchemeProfile> => {
  const profile = await getStoredSchemeProfile();
  const completed = profile.completedMilestoneIds || [];
  const exists = completed.includes(milestoneId);

  const updatedIds = exists
    ? completed.filter(id => id !== milestoneId)
    : [...completed, milestoneId];

  const updatedProfile: UserSchemeProfile = {
    ...profile,
    completedMilestoneIds: updatedIds,
  };

  await saveStoredSchemeProfile(updatedProfile);
  return updatedProfile;
};

/**
 * Toggle checked document checklist item
 */
export const toggleDocumentChecklist = async (docId: string): Promise<UserSchemeProfile> => {
  const profile = await getStoredSchemeProfile();
  const checked = profile.checkedDocumentIds || [];
  const exists = checked.includes(docId);

  const updatedIds = exists
    ? checked.filter(id => id !== docId)
    : [...checked, docId];

  const updatedProfile: UserSchemeProfile = {
    ...profile,
    checkedDocumentIds: updatedIds,
  };

  await saveStoredSchemeProfile(updatedProfile);
  return updatedProfile;
};

/**
 * Save PICME RCH ID and Village Health Nurse (VHN) contact details
 */
export const savePicmeDetails = async (
  picmeRchId: string,
  vhnName: string,
  vhnPhone: string,
  phcCenter: string
): Promise<UserSchemeProfile> => {
  const profile = await getStoredSchemeProfile();
  const updatedProfile: UserSchemeProfile = {
    ...profile,
    picmeRchId,
    vhnName,
    vhnPhone,
    phcCenter,
  };
  await saveStoredSchemeProfile(updatedProfile);
  return updatedProfile;
};
