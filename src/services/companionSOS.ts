// Companion Emergency Service — Firestore real-time snapshot listener + Audio Siren synthesizer
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Vibration } from 'react-native';

export interface EmergencyAlertPayload {
  alertId: string;
  motherId: string;
  motherName: string;
  relationship?: string;
  trimester: number;
  latitude: number | null;
  longitude: number | null;
  address?: string;
  timestamp: string;
  status: 'active' | 'responded' | 'resolved';
  responderName?: string;
  respondedAt?: string;
  vitalsSummary?: {
    bpSystolic?: number;
    bpDiastolic?: number;
    weightKg?: number;
    bloodSugarMgDl?: number;
    recentSymptoms?: string[];
  };
  primaryDoctor?: {
    name: string;
    specialty?: string;
    hospital?: string;
    phone: string;
  };
  latestReport?: {
    title: string;
    overallSignal: 'healthy' | 'good' | 'concerned' | 'critical';
    keyParameters?: string;
  };
}

const STORAGE_KEY_ACTIVE_ALERT = '@companion_active_emergency';

type AlertListener = (alert: EmergencyAlertPayload | null) => void;
const alertListeners: Set<AlertListener> = new Set();

let audioCtx: any = null;
let sirenInterval: any = null;

export const startEmergencySirenAudio = () => {
  try {
    triggerCompanionVibration();
    if (typeof window !== 'undefined' && ((window as any).AudioContext || (window as any).webkitAudioContext)) {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!audioCtx) {
        audioCtx = new AudioCtx();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      if (sirenInterval) clearInterval(sirenInterval);

      let highFreq = true;
      sirenInterval = setInterval(() => {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(highFreq ? 880 : 660, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start();
          osc.stop(audioCtx.currentTime + 0.35);
          highFreq = !highFreq;
        } catch (e) {
          // audio play error fallback
        }
      }, 400);
    }
  } catch (e) {
    console.log('Audio siren synth setup warning:', e);
  }
};

export const stopEmergencySirenAudio = () => {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  Vibration.cancel();
};

export const subscribeToEmergencyAlerts = (pairingCode: string, callback: AlertListener) => {
  alertListeners.add(callback);

  // Initial check from local storage (only trigger if status is active and not expired)
  checkLocalActiveAlert().then(localAlert => {
    if (localAlert && localAlert.status === 'active') {
      startEmergencySirenAudio();
      callback(localAlert);
    } else {
      stopEmergencySirenAudio();
      callback(null);
    }
  });

  // Cloud Firestore real-time listener
  let unsubscribeFirestore = () => {};
  try {
    if (db && pairingCode) {
      const alertRef = doc(db, 'companionAlerts', pairingCode.toUpperCase());
      unsubscribeFirestore = onSnapshot(alertRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as EmergencyAlertPayload;
          if (data.status === 'active') {
            startEmergencySirenAudio();
            callback(data);
          } else {
            stopEmergencySirenAudio();
            callback(null); // Do not pop up modal for resolved/responded alerts
          }
        } else {
          stopEmergencySirenAudio();
          callback(null);
        }
      }, (err) => {
        console.log('Cloud snapshot listener offline/fallback');
      });
    }
  } catch (e) {
    console.log('Firestore listener setup error:', e);
  }

  // Periodic poll of local storage to sync offline events
  const interval = setInterval(async () => {
    const alert = await checkLocalActiveAlert();
    if (alert && alert.status === 'active') {
      callback(alert);
    } else {
      callback(null);
    }
  }, 3000);

  return () => {
    alertListeners.delete(callback);
    unsubscribeFirestore();
    clearInterval(interval);
    stopEmergencySirenAudio();
  };
};

export const checkLocalActiveAlert = async (): Promise<EmergencyAlertPayload | null> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_ALERT);
    if (!json) return null;
    const alert = JSON.parse(json) as EmergencyAlertPayload;

    // Auto-expire alerts after 15 minutes or if already responded/resolved
    const isExpired = alert.timestamp ? (Date.now() - new Date(alert.timestamp).getTime() > 15 * 60 * 1000) : false;
    if (alert.status !== 'active' || isExpired) {
      await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_ALERT);
      return null;
    }
    return alert;
  } catch (e) {
    return null;
  }
};

export const triggerCompanionEmergencyAlert = async (
  pairingCode: string,
  motherName: string,
  trimester: number,
  location: { latitude: number; longitude: number } | null,
  vitalsSummary?: EmergencyAlertPayload['vitalsSummary'],
  primaryDoctor?: EmergencyAlertPayload['primaryDoctor'],
  latestReport?: EmergencyAlertPayload['latestReport']
): Promise<EmergencyAlertPayload> => {
  const alertPayload: EmergencyAlertPayload = {
    alertId: 'alert_' + Date.now(),
    motherId: pairingCode.toUpperCase(),
    motherName,
    trimester,
    latitude: location?.latitude ?? 12.9716, // Default fallback Chennai area lat
    longitude: location?.longitude ?? 80.245,
    address: 'Sholinganallur, Chennai, Tamil Nadu',
    timestamp: new Date().toISOString(),
    status: 'active',
    vitalsSummary: {
      bpSystolic: vitalsSummary?.bpSystolic || 120,
      bpDiastolic: vitalsSummary?.bpDiastolic || 80,
      weightKg: vitalsSummary?.weightKg || 62.0,
      bloodSugarMgDl: vitalsSummary?.bloodSugarMgDl || 95,
      recentSymptoms: vitalsSummary?.recentSymptoms && vitalsSummary.recentSymptoms.length > 0 ? vitalsSummary.recentSymptoms : ['Emergency SOS Signal Triggered'],
    },
    primaryDoctor: primaryDoctor || {
      name: 'Dr. Savitha Lakshmi',
      specialty: 'Senior Gynecologist',
      hospital: 'Kasturba Gandhi Hospital',
      phone: '044-28441011',
    },
    latestReport: latestReport || {
      title: 'Blood Work & Scan Panel',
      overallSignal: 'healthy',
      keyParameters: 'Hemoglobin: 11.2 g/dL, Sugar: 92 mg/dL',
    },
  };

  // 1. Save locally
  await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_ALERT, JSON.stringify(alertPayload));

  // 2. Publish to Firestore Cloud
  try {
    if (db) {
      const alertRef = doc(db, 'companionAlerts', pairingCode.toUpperCase());
      await setDoc(alertRef, alertPayload, { merge: true });
    }
  } catch (e) {
    console.log('Firestore emergency trigger error:', e);
  }

  startEmergencySirenAudio();
  return alertPayload;
};

export const respondToEmergencyAlert = async (alertId: string, responderName: string): Promise<boolean> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_ALERT);
    if (json) {
      const alert = JSON.parse(json) as EmergencyAlertPayload;
      const updated: EmergencyAlertPayload = {
        ...alert,
        status: 'responded',
        responderName,
        respondedAt: new Date().toISOString(),
      };
      await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_ALERT);

      // Also publish update to Cloud Firestore
      if (db && alert.motherId) {
        const alertRef = doc(db, 'companionAlerts', alert.motherId);
        await setDoc(alertRef, updated, { merge: true });
      }

      stopEmergencySirenAudio();
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

export const clearActiveEmergencyAlert = async (pairingCode?: string): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_ALERT);
  if (db && pairingCode) {
    try {
      const alertRef = doc(db, 'companionAlerts', pairingCode.toUpperCase());
      await setDoc(alertRef, { status: 'resolved' }, { merge: true });
    } catch (e) {
      // clear error ignore
    }
  }
  stopEmergencySirenAudio();
};

export const triggerCompanionVibration = () => {
  const PATTERN = [500, 300, 500, 300, 1000];
  Vibration.vibrate(PATTERN, true);
};

