// FamilyDashboardScreen — Family Tab hub (Emergency Contacts + Shared Summary View)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { getLocalContacts, EmergencyContact, getLocalHealthLogs, HealthLogEntry } from '../../services/storage';
import { calculatePregnancyInfo } from '../../utils/pregnancy';

export const FamilyDashboardScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [latestLog, setLatestLog] = useState<HealthLogEntry | null>(null);

  const pregInfo = calculatePregnancyInfo(user?.dueDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString());

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const list = await getLocalContacts();
    setContacts(list);
    const logs = await getLocalHealthLogs();
    if (logs.length > 0) setLatestLog(logs[0]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('family.title')}</Text>

        {/* Manage Emergency Contacts Button / Banner */}
        <TouchableOpacity onPress={() => navigation.navigate('EmergencyContacts')} activeOpacity={0.8}>
          <Card variant="elevated" style={styles.actionCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.sosButton + '15' }]}>
                <Ionicons name="shield-checkmark" size={28} color={colors.sosButton} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('family.emergencyContacts')}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  {contacts.length === 0 ? t('family.addFirstContact') : `${contacts.length} priority contact(s) configured for SOS`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Shared Family Summary Card */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('family.familyDashboard')}</Text>
        <Card variant="default" style={styles.summaryCard}>
          <View style={styles.motherHeader}>
            <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={[styles.motherName, { color: colors.text }]}>{user?.name || 'Mother'}</Text>
              <Text style={[styles.motherWeek, { color: colors.textSecondary }]}>
                Week {pregInfo.currentWeek}, Day {pregInfo.currentDay} ({t('home.trimester', { number: pregInfo.trimester })})
              </Text>
            </View>
            <StatusBadge status={latestLog?.mood === 'unwell' ? 'concerned' : 'healthy'} size="small" />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Last Vitals Summary */}
          {latestLog ? (
            <View style={styles.vitalsGrid}>
              <View style={styles.vitalItem}>
                <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>{t('healthLog.weight')}</Text>
                <Text style={[styles.vitalVal, { color: colors.text }]}>{latestLog.weight} kg</Text>
              </View>

              <View style={styles.vitalItem}>
                <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>Blood Pressure</Text>
                <Text style={[styles.vitalVal, { color: colors.text }]}>{latestLog.bpSystolic}/{latestLog.bpDiastolic}</Text>
              </View>

              <View style={styles.vitalItem}>
                <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>{t('healthLog.mood')}</Text>
                <Text style={[styles.vitalVal, { color: colors.text }]}>{latestLog.mood.toUpperCase()}</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.noLogText, { color: colors.textSecondary }]}>No recent vitals logged</Text>
          )}
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
  title: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    ...Typography.h4,
  },
  cardSub: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.lg,
  },
  motherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  motherName: {
    ...Typography.labelLarge,
  },
  motherWeek: {
    ...Typography.caption,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  vitalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vitalItem: {
    alignItems: 'center',
  },
  vitalLabel: {
    ...Typography.caption,
  },
  vitalVal: {
    ...Typography.labelLarge,
    marginTop: 2,
  },
  noLogText: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
