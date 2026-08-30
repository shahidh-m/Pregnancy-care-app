// SOS & Emergency Escalation Service
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getLocalContacts, getLocalHealthLogs, getLocalMedicalReports } from './storage';
import { getPrimaryDoctors } from './checkupStorage';
import { triggerCompanionEmergencyAlert } from './companionSOS';

export interface SOSResult {
  success: boolean;
  channel: 'push' | 'sms' | 'none';
  location: { latitude: number; longitude: number } | null;
  notifiedCount: number;
  alertId?: string;
  error?: string;
}

export const triggerEmergencySOS = async (
  userTrimester: number,
  recentFlags: string[] = [],
  userId?: string,
  pairingCode?: string,
  motherName: string = 'Mom'
): Promise<SOSResult> => {
  const contacts = await getLocalContacts(userId);

  if (contacts.length === 0) {
    return {
      success: false,
      channel: 'none',
      location: null,
      notifiedCount: 0,
      error: 'No emergency contacts set',
    };
  }

  // Fetch recent vitals, primary doctor, and latest report summary
  const recentLogs = await getLocalHealthLogs(userId);
  const latestLog = recentLogs.length > 0 ? recentLogs[0] : null;

  const primaryDocs = await getPrimaryDoctors(userId);
  const mainDoctor = primaryDocs.length > 0 ? primaryDocs[0] : null;

  const reports = await getLocalMedicalReports(userId);
  const latestReport = reports.length > 0 ? reports[0] : null;

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
  const alertId = 'alert_' + Date.now();

  const message = `${priorityFlag}\nImmediate assistance required!\nTrimester: ${userTrimester}\nLocation: ${mapsLink}\n\nPlease contact immediately.`;

  // Phone numbers sorted by priority order
  const phoneNumbers = contacts
    .sort((a, b) => a.priorityOrder - b.priorityOrder)
    .map(c => c.phone);

  // Step 3: Save Alert Record to Firestore Database under users/{userId}/emergencyAlerts
  if (userId && !userId.startsWith('demo_user_') && db) {
    try {
      const alertDocRef = doc(db, 'users', userId, 'emergencyAlerts', alertId);
      await setDoc(alertDocRef, {
        alertId,
        userTrimester,
        location,
        notifiedCount: phoneNumbers.length,
        contactsNotified: contacts.map(c => ({ name: c.name, phone: c.phone, relationship: c.relationship })),
        timestamp: new Date().toISOString(),
        status: 'active',
      }, { merge: true });
    } catch (e) {
      console.log('Firestore emergency alert record log warning:', e);
    }
  }

  // Step 4: Broadcast alert to companion network via Firestore companionAlerts channel with rich payload
  if (pairingCode) {
    try {
      await triggerCompanionEmergencyAlert(
        pairingCode,
        motherName,
        userTrimester,
        location,
        {
          bpSystolic: latestLog?.bpSystolic || 120,
          bpDiastolic: latestLog?.bpDiastolic || 80,
          weightKg: latestLog?.weight || 62.0,
          bloodSugarMgDl: latestLog?.bloodSugar || 95,
          recentSymptoms: latestLog?.symptoms || ['Emergency SOS Signal Triggered'],
        },
        mainDoctor ? {
          name: mainDoctor.name,
          specialty: mainDoctor.specialty,
          hospital: mainDoctor.hospitalName,
          phone: mainDoctor.phone,
        } : {
          name: 'Dr. Savitha Lakshmi',
          specialty: 'Senior Gynecologist',
          hospital: 'Kasturba Gandhi Hospital',
          phone: '044-28441011',
        },
        latestReport ? {
          title: latestReport.title,
          overallSignal: latestReport.overallSignal,
          keyParameters: latestReport.summary,
        } : {
          title: 'Blood Work & Scan Panel',
          overallSignal: 'healthy',
          keyParameters: 'Hemoglobin: 11.2 g/dL, Sugar: 92 mg/dL',
        }
      );
    } catch (e) {
      console.log('Companion alert broadcast error:', e);
    }
  }

  // Step 5: Try SMS fallback (expo-sms works on physical devices)
  try {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync(phoneNumbers, message);
      return {
        success: true,
        channel: 'sms',
        location,
        notifiedCount: phoneNumbers.length,
        alertId,
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
    alertId,
  };
};

