// CompanionEmergencyModal — Full screen high-priority SOS emergency alert overlay
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Animated, Easing, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { EmergencyAlertPayload, subscribeToEmergencyAlerts, respondToEmergencyAlert } from '../services/companionSOS';
import { Typography, Spacing, BorderRadius } from '../theme';

export const CompanionEmergencyModal: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState<EmergencyAlertPayload | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    // Listen for incoming alerts matching the paired mother or local test alert
    const code = user?.connectedMotherId || user?.pairingCode || 'PREG-DEMO';
    const unsubscribe = subscribeToEmergencyAlerts(code, (alert) => {
      setActiveAlert(alert);
    });

    return () => unsubscribe();
  }, [user]);

  // Pulsing siren animation
  useEffect(() => {
    if (activeAlert) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [activeAlert]);

  if (!activeAlert) return null;

  const handleNavigate = () => {
    const lat = activeAlert.latitude || 12.9716;
    const lon = activeAlert.longitude || 80.245;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    Linking.openURL(url);
  };

  const handleRespond = async () => {
    setIsResponding(true);
    const responderName = user?.name || user?.relationship ? `${user.relationship?.toUpperCase()} (${user.name || 'Family'})` : 'Companion';
    await respondToEmergencyAlert(activeAlert.alertId, responderName);
    Vibration.cancel();
    setIsResponding(false);
    setActiveAlert(null);
  };

  return (
    <Modal visible={!!activeAlert} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: '#111827' }]}>
        {/* Siren Banner */}
        <View style={styles.topSirenBanner}>
          <Animated.View style={[styles.sirenIconCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="warning" size={48} color="#FFFFFF" />
          </Animated.View>
          <Text style={styles.sirenText}>PREGNANCY SOS ALERT!</Text>
          <Text style={styles.sirenSub}>Immediate Assistance Required</Text>
        </View>

        {/* Info Container */}
        <View style={styles.content}>
          <View style={styles.motherCard}>
            <View style={styles.motherRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="female" size={32} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.motherLabel}>ALERT FROM</Text>
                <Text style={styles.motherName}>{activeAlert.motherName || 'Anitha (Mom)'}</Text>
                <Text style={styles.trimesterBadge}>Trimester {activeAlert.trimester || 2} • High Priority</Text>
              </View>
            </View>
          </View>

          {/* Location Box */}
          <View style={styles.locationBox}>
            <View style={styles.locHeader}>
              <Ionicons name="location" size={24} color="#EF4444" />
              <Text style={styles.locTitle}>Live Location</Text>
            </View>
            <Text style={styles.addressText}>{activeAlert.address || 'Location pinpointed via GPS'}</Text>
            <Text style={styles.coordsText}>
              Lat: {activeAlert.latitude?.toFixed(4)}, Lon: {activeAlert.longitude?.toFixed(4)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {/* Navigate Button */}
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNavigate}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={24} color="#FFFFFF" />
              <Text style={styles.navBtnText}>NAVIGATE</Text>
            </TouchableOpacity>

            {/* I am coming Button */}
            <TouchableOpacity
              style={[styles.comingButton, isResponding && { opacity: 0.6 }]}
              onPress={handleRespond}
              disabled={isResponding}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.comingBtnText}>I AM COMING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  topSirenBanner: {
    backgroundColor: '#DC2626',
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  sirenIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#991B1B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sirenText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  sirenSub: {
    fontSize: 14,
    color: '#FEE2E2',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-around',
  },
  motherCard: {
    backgroundColor: '#1F2937',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#374151',
  },
  motherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  motherLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  motherName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trimesterBadge: {
    fontSize: 13,
    color: '#F87171',
    fontWeight: '600',
    marginTop: 2,
  },
  locationBox: {
    backgroundColor: '#1F2937',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#374151',
  },
  locHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressText: {
    fontSize: 15,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionRow: {
    gap: Spacing.md,
  },
  navButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  comingButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  comingBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
