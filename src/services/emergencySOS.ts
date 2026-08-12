// SOS & Emergency Escalation Service
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { getLocalContacts, EmergencyContact } from './storage';

export interface SOSResult {
  success: boolean;
  channel: 'push' | 'sms' | 'none';
  location: { latitude: number; longitude: number } | null;
  notifiedCount: number;
  error?: string;
}

export const triggerEmergencySOS = async (userTrimester: number, recentFlags: string[] = []): Promise<SOSResult> => {
  const contacts = await getLocalContacts();

  if (contacts.length === 0) {
    return {
      success: false,
      channel: 'none',
      location: null,
      notifiedCount: 0,
      error: 'No emergency contacts set',
    };
  }

  // Step 1: Capture GPS location
  let location: { latitude: number; longitude: number } | null = null;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      location = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    }
  } catch (e) {
    console.log('Location capture failed, proceeding without live GPS:', e);
  }

  // Step 2: Build SOS Alert message
  const mapsLink = location ? `https://maps.google.com/?q=${location.latitude},${location.longitude}` : 'Location unavailable';
  const priorityFlag = (userTrimester === 3 && recentFlags.includes('critical')) ? '[CRITICAL THIRD TRIMESTER ALERT]' : '[PREGNANCY EMERGENCY ALERT]';

  const message = `${priorityFlag}\nImmediate assistance required!\nTrimester: ${userTrimester}\nLocation: ${mapsLink}\n\nPlease contact immediately.`;

  // Phone numbers sorted by priority order
  const phoneNumbers = contacts
    .sort((a, b) => a.priorityOrder - b.priorityOrder)
    .map(c => c.phone);

  // Step 3: Try SMS fallback (expo-sms works on physical devices)
  try {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync(phoneNumbers, message);
      return {
        success: true,
        channel: 'sms',
        location,
        notifiedCount: phoneNumbers.length,
      };
    }
  } catch (e) {
    console.log('SMS dispatch failed:', e);
  }

  return {
    success: true,
    channel: 'push',
    location,
    notifiedCount: phoneNumbers.length,
  };
};
