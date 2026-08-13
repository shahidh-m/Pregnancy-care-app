// CompanionEmergencyModal — Full screen high-priority SOS emergency alert overlay
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Animated, Easing, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { EmergencyAlertPayload, subscribeToEmergencyAlerts, respondToEmergencyAlert, stopEmergencySirenAudio } from '../services/companionSOS';
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
  }, [user?.connectedMotherId, user?.pairingCode]);

  // Pulsing siren animation
  useEffect(() => {
    if (activeAlert && activeAlert.status === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
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

  const handleCallDoctor = () => {
    const phone = activeAlert.primaryDoctor?.phone || '108';
    Linking.openURL(`tel:${phone}`);
  };

  const handleRespond = async () => {
    setIsResponding(true);
    const responderName = user?.name || (user?.relationship ? `${user.relationship.toUpperCase()} (${user.name || 'Family'})` : 'Companion');
    await respondToEmergencyAlert(activeAlert.alertId, responderName);
    stopEmergencySirenAudio();
    setIsResponding(false);
    setActiveAlert(null);
  };

  const isAlreadyResponded = activeAlert.status === 'responded';

  return (
    <Modal visible={!!activeAlert} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: '#0F172A' }]}>
        {/* Siren Banner */}
        <View style={[styles.topSirenBanner, { backgroundColor: isAlreadyResponded ? '#059669' : '#DC2626' }]}>
          <Animated.View style={[styles.sirenIconCircle, { transform: [{ scale: pulseAnim }], backgroundColor: isAlreadyResponded ? '#047857' : '#991B1B' }]}>
            <Ionicons name={isAlreadyResponded ? "checkmark-circle" : "warning"} size={48} color="#FFFFFF" />
          </Animated.View>
          <Text style={styles.sirenText}>
            {isAlreadyResponded ? 'RESPONSE REGISTERED!' : 'PREGNANCY EMERGENCY SOS!'}
          </Text>
          <Text style={styles.sirenSub}>
            {isAlreadyResponded
              ? `${activeAlert.responderName || 'Companion'} is responding to this alert!`
              : 'Immediate Assistance Required • Siren Alarm Active'}
          </Text>
        </View>

        {/* Content Scroll View */}
        <ScrollView contentContainerStyle={styles.content}>
          {/* Mother Info Card */}
          <View style={styles.card}>
            <View style={styles.motherRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="female" size={32} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>PREGNANT MOTHER</Text>
                <Text style={styles.motherName}>{activeAlert.motherName || 'Anitha (Mom)'}</Text>
                <Text style={styles.trimesterBadge}>Trimester {activeAlert.trimester || 2} • High Priority</Text>
              </View>
            </View>
          </View>

          {/* GPS Location Box */}
          <View style={styles.card}>
            <View style={styles.locHeader}>
              <Ionicons name="location" size={24} color="#EF4444" />
              <Text style={styles.cardTitle}>Live GPS Pinpoint Location</Text>
            </View>
            <Text style={styles.addressText}>{activeAlert.address || 'Sholinganallur, Chennai, Tamil Nadu'}</Text>
            <Text style={styles.coordsText}>
              Coordinates: {activeAlert.latitude?.toFixed(4)}, {activeAlert.longitude?.toFixed(4)}
            </Text>

            <TouchableOpacity style={styles.navButton} onPress={handleNavigate} activeOpacity={0.8}>
              <Ionicons name="navigate" size={20} color="#FFFFFF" />
              <Text style={styles.navBtnText}>NAVIGATE VIA GOOGLE MAPS</Text>
            </TouchableOpacity>
          </View>

          {/* Vitals Overview Card */}
          {activeAlert.vitalsSummary ? (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="pulse" size={22} color="#38BDF8" />
                <Text style={styles.cardTitle}>Latest Medical Vitals Overview</Text>
              </View>

              <View style={styles.vitalsGrid}>
                <View style={styles.vitalBox}>
                  <Text style={styles.vitalVal}>
                    {activeAlert.vitalsSummary.bpSystolic || 120}/{activeAlert.vitalsSummary.bpDiastolic || 80}
                  </Text>
                  <Text style={styles.vitalSub}>Blood Pressure</Text>
                </View>

                {activeAlert.vitalsSummary.bloodSugarMgDl ? (
                  <View style={styles.vitalBox}>
                    <Text style={styles.vitalVal}>{activeAlert.vitalsSummary.bloodSugarMgDl} mg/dL</Text>
                    <Text style={styles.vitalSub}>Blood Sugar</Text>
                  </View>
                ) : null}

                <View style={styles.vitalBox}>
                  <Text style={styles.vitalVal}>{activeAlert.vitalsSummary.weightKg || 62.0} kg</Text>
                  <Text style={styles.vitalSub}>Current Weight</Text>
                </View>
              </View>

              {activeAlert.vitalsSummary.recentSymptoms && activeAlert.vitalsSummary.recentSymptoms.length > 0 ? (
                <View style={styles.symptomsRow}>
                  <Text style={styles.symptomTitle}>Reported Symptoms: </Text>
                  <Text style={styles.symptomList}>
                    {activeAlert.vitalsSummary.recentSymptoms.join(', ')}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Primary Doctor Card */}
          {activeAlert.primaryDoctor ? (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="medical" size={22} color="#10B981" />
                <Text style={styles.cardTitle}>Primary Delivery Doctor</Text>
              </View>

              <Text style={styles.docName}>{activeAlert.primaryDoctor.name}</Text>
              <Text style={styles.docSpecialty}>
                {activeAlert.primaryDoctor.specialty} • {activeAlert.primaryDoctor.hospital}
              </Text>

              <TouchableOpacity style={styles.callDocBtn} onPress={handleCallDoctor} activeOpacity={0.8}>
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.callDocText}>CALL DOCTOR ({activeAlert.primaryDoctor.phone})</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Latest Lab Report Highlight */}
          {activeAlert.latestReport ? (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="document-text" size={22} color="#F59E0B" />
                <Text style={styles.cardTitle}>Latest Medical Report</Text>
              </View>

              <Text style={styles.reportTitle}>{activeAlert.latestReport.title}</Text>
              <Text style={styles.reportParams}>{activeAlert.latestReport.keyParameters}</Text>
            </View>
          ) : null}

          {/* Primary Action Button */}
          {!isAlreadyResponded && (
            <TouchableOpacity
              style={[styles.comingButton, isResponding && { opacity: 0.6 }]}
              onPress={handleRespond}
              disabled={isResponding}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={26} color="#FFFFFF" />
              <Text style={styles.comingBtnText}>I AM RESPONDING NOW</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  topSirenBanner: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  sirenIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sirenText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  sirenSub: {
    fontSize: 13,
    color: '#FEE2E2',
    marginTop: 2,
    textAlign: 'center',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  motherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  motherName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trimesterBadge: {
    fontSize: 12,
    color: '#F87171',
    fontWeight: '600',
    marginTop: 2,
  },
  locHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 12,
  },
  navButton: {
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  vitalBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  vitalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#38BDF8',
  },
  vitalSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  symptomsRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  symptomTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F43F5E',
  },
  symptomList: {
    fontSize: 12,
    color: '#E2E8F0',
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  docSpecialty: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
  },
  callDocBtn: {
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  callDocText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  reportParams: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
  },
  comingButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  comingBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

