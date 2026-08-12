// Companion Emergency Service — Firestore real-time snapshot listener + local event bus
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
}

const STORAGE_KEY_ACTIVE_ALERT = '@companion_active_emergency';

type AlertListener = (alert: EmergencyAlertPayload | null) => void;
const alertListeners: Set<AlertListener> = new Set();

export const subscribeToEmergencyAlerts = (pairingCode: string, callback: AlertListener) => {
  alertListeners.add(callback);

  // Initial check from local storage for offline P2P simulation mode
  checkLocalActiveAlert().then(localAlert => {
    if (localAlert) {
      callback(localAlert);
    }
  });

  // Cloud Firestore listener if connected
  let unsubscribeFirestore = () => {};
  try {
    if (db && pairingCode) {
      const alertRef = doc(db, 'companionAlerts', pairingCode.toUpperCase());
      unsubscribeFirestore = onSnapshot(alertRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as EmergencyAlertPayload;
          if (data.status === 'active') {
            triggerCompanionVibration();
            callback(data);
          } else {
            callback(null);
          }
        } else {
          callback(null);
        }
      }, (err) => {
        console.log('Cloud snapshot listener offline/unauthenticated fallback');
      });
    }
  } catch (e) {
    console.log('Firestore listener setup error:', e);
  }

  // Periodic poll of local storage to sync offline simulation events across tabs/contexts
  const interval = setInterval(async () => {
    const alert = await checkLocalActiveAlert();
    callback(alert);
  }, 2000);

  return () => {
    alertListeners.delete(callback);
    unsubscribeFirestore();
    clearInterval(interval);
  };
};

export const checkLocalActiveAlert = async (): Promise<EmergencyAlertPayload | null> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_ALERT);
    if (!json) return null;
    const alert = JSON.parse(json) as EmergencyAlertPayload;
    return alert.status === 'active' ? alert : null;
  } catch (e) {
    return null;
  }
};

export const triggerCompanionEmergencyAlert = async (
  pairingCode: string,
  motherName: string,
  trimester: number,
  location: { latitude: number; longitude: number } | null
): Promise<EmergencyAlertPayload> => {
  const alertPayload: EmergencyAlertPayload = {
    alertId: 'alert_' + Date.now(),
    motherId: pairingCode.toUpperCase(),
    motherName,
    trimester,
    latitude: location?.latitude ?? 12.9716, // Default fallback Chennai/Bengaluru area lat
    longitude: location?.longitude ?? 80.245,
    address: 'Sholinganallur, Chennai, Tamil Nadu',
    timestamp: new Date().toISOString(),
    status: 'active',
  };

  // 1. Save locally for instant offline P2P companion alert modal
  await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_ALERT, JSON.stringify(alertPayload));

  // 2. Publish to Firestore Cloud if online
  try {
    if (db) {
      const alertRef = doc(db, 'companionAlerts', pairingCode.toUpperCase());
      await setDoc(alertRef, alertPayload, { merge: true });
    }
  } catch (e) {
    console.log('Firestore emergency trigger postponed (offline):', e);
  }

  triggerCompanionVibration();
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
      await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_ALERT, JSON.stringify(updated));

      // Also publish update to Cloud Firestore
      if (db && alert.motherId) {
        const alertRef = doc(db, 'companionAlerts', alert.motherId);
        await setDoc(alertRef, updated, { merge: true });
      }

      Vibration.cancel();
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

export const clearActiveEmergencyAlert = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_ALERT);
  Vibration.cancel();
};

export const triggerCompanionVibration = () => {
  // Continuous emergency vibration pattern: 500ms vibrate, 300ms pause, repeat
  const PATTERN = [500, 300, 500, 300, 1000];
  Vibration.vibrate(PATTERN, true);
};
