// CareScreen — Care Tab Hub (Report Reader, Hospital Locator, Scheme Status)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';

export const CareScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('care.title')}</Text>

        <TouchableOpacity onPress={() => navigation.navigate('DoctorCheckup')} activeOpacity={0.8}>
          <Card variant="elevated" style={styles.careCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="medical-outline" size={28} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Doctor Checkup Tracker</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Track visit notes, scan observations, prescriptions & next visit reminders</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ReportReader')} activeOpacity={0.8}>
          <Card variant="elevated" style={styles.careCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="document-text-outline" size={28} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('care.reportReader')}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Scan lab reports for simple, plain-language explanations & status</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('HospitalLocator')} activeOpacity={0.8}>
          <Card variant="elevated" style={styles.careCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="location-outline" size={28} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('care.hospitalLocator')}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Find nearby PHCs, maternity centers & CEmONC emergency hubs</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SchemeStatus')} activeOpacity={0.8}>
          <Card variant="elevated" style={styles.careCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="ribbon-outline" size={28} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('care.schemeStatus')}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Track PICME RCH ID and Dr. Muthulakshmi benefit installments</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>
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
    gap: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  careCard: {
    padding: Spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
});
