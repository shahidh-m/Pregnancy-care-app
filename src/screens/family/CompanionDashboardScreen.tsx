// CompanionDashboardScreen — Interface for family members connected in "For Her" mode
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { triggerCompanionEmergencyAlert } from '../../services/companionSOS';

export const CompanionDashboardScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const [motherVitals, setMotherVitals] = useState({
    bp: '120/80 mmHg',
    weight: '62 kg',
    lastCheckup: '2 days ago',
    healthStatus: 'Optimal',
  });

  const handleTestAlert = async () => {
    Alert.alert(
      'Trigger Emergency Test',
      'This will send a simulated Emergency SOS Alert to all connected devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger Now',
          style: 'destructive',
          onPress: async () => {
            await triggerCompanionEmergencyAlert(
              user?.connectedMotherId || 'PREG-DEMO',
              user?.connectedMotherName || 'Anitha (Mom)',
              2,
              { latitude: 12.9716, longitude: 80.245 }
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Companion Network</Text>
            <Text style={[styles.title, { color: colors.text }]}>{user?.name || 'Caregiver'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}
            onPress={signOut}
          >
            <Ionicons name="people" size={16} color={colors.primary} />
            <Text style={[styles.roleText, { color: colors.primary }]}>{user?.relationship?.toUpperCase() || 'FAMILY'}</Text>
          </TouchableOpacity>
        </View>

        {/* Linked Mother Status Card */}
        <Card variant="elevated" style={styles.linkedCard}>
          <View style={styles.linkedRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="heart" size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkedLabel, { color: colors.textSecondary }]}>CONNECTED MOTHER</Text>
              <Text style={[styles.linkedName, { color: colors.text }]}>{user?.connectedMotherName || 'Anitha Kumar'}</Text>
              <Text style={[styles.linkedCode, { color: colors.primary }]}>Code: {user?.connectedMotherId || 'PREG-849201'}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: colors.success + '15' }]}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.success }]}>LINKED</Text>
            </View>
          </View>
        </Card>

        {/* SOS Emergency Test Action */}
        <TouchableOpacity
          style={[styles.sosTestCard, { backgroundColor: colors.error }]}
          onPress={handleTestAlert}
          activeOpacity={0.8}
        >
          <Ionicons name="warning" size={28} color={colors.white} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={[styles.sosTestTitle, { color: colors.white }]}>Test Companion SOS Alarm</Text>
            <Text style={[styles.sosTestSub, { color: colors.white + 'DD' }]}>
              Simulates a full-screen emergency alert siren with navigation & response
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        {/* Mother's Live Vitals Summary */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mother's Latest Vitals</Text>
        <View style={styles.gridContainer}>
          <Card variant="default" style={styles.gridCard}>
            <Ionicons name="heart-circle" size={24} color="#EC4899" />
            <Text style={[styles.gridVal, { color: colors.text }]}>{motherVitals.bp}</Text>
            <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Blood Pressure</Text>
          </Card>

          <Card variant="default" style={styles.gridCard}>
            <Ionicons name="scale" size={24} color="#8B5CF6" />
            <Text style={[styles.gridVal, { color: colors.text }]}>{motherVitals.weight}</Text>
            <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Current Weight</Text>
          </Card>

          <Card variant="default" style={styles.gridCard}>
            <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
            <Text style={[styles.gridVal, { color: colors.text }]}>{motherVitals.lastCheckup}</Text>
            <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Last Checkup</Text>
          </Card>

          <Card variant="default" style={styles.gridCard}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={[styles.gridVal, { color: colors.success }]}>{motherVitals.healthStatus}</Text>
            <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Health Score</Text>
          </Card>
        </View>

        {/* Emergency Preparedness Instructions */}
        <Card variant="outlined" style={styles.guideCard}>
          <Text style={[styles.guideTitle, { color: colors.text }]}>Companion Emergency Guidelines</Text>
          <View style={styles.guideStep}>
            <Text style={[styles.stepNum, { color: colors.primary }]}>1</Text>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Keep app notifications and sound turned ON.
            </Text>
          </View>
          <View style={styles.guideStep}>
            <Text style={[styles.stepNum, { color: colors.primary }]}>2</Text>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              When SOS rings, tap "I AM COMING" to notify her instantly.
            </Text>
          </View>
          <View style={styles.guideStep}>
            <Text style={[styles.stepNum, { color: colors.primary }]}>3</Text>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Use the "NAVIGATE" button for turn-by-turn directions to her GPS position.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    ...Typography.caption,
  },
  title: {
    ...Typography.h2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  linkedCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkedLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  linkedName: {
    ...Typography.h3,
  },
  linkedCode: {
    ...Typography.caption,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '800',
    fontSize: 10,
  },
  sosTestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
  },
  sosTestTitle: {
    ...Typography.labelLarge,
    fontWeight: '800',
  },
  sosTestSub: {
    ...Typography.caption,
    fontSize: 11,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  gridCard: {
    width: '47%',
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  gridVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  gridLabel: {
    ...Typography.caption,
  },
  guideCard: {
    padding: Spacing.lg,
  },
  guideTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '800',
  },
  stepText: {
    ...Typography.bodySmall,
    flex: 1,
  },
});
