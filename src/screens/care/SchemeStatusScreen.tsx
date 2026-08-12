// SchemeStatusScreen — PICME Registration & Dr. Muthulakshmi Maternity Scheme tracker
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';

export const SchemeStatusScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('scheme.title')}</Text>

        {/* Demo Notice */}
        <View style={[styles.demoNoticeBox, { backgroundColor: colors.info + '15', borderColor: colors.info + '40' }]}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={[styles.demoNoticeText, { color: colors.info }]}>{t('scheme.demoNotice')}</Text>
        </View>

        {/* PICME Registration Card */}
        <Card variant="elevated" style={styles.schemeCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.schemeName, { color: colors.text }]}>{t('scheme.picme')}</Text>
              <Text style={[styles.schemeSub, { color: colors.textSecondary }]}>RCH ID: 1298-4567-8901</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.healthy + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: colors.healthy }]}>{t('scheme.registered')}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderTopColor: colors.borderLight }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>VHN / ANM Contact:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>Sister Selvi (PHC Sholinganallur)</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Registration Date:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>12 March 2026</Text>
          </View>
        </Card>

        {/* Dr. Muthulakshmi Scheme Card */}
        <Card variant="elevated" style={styles.schemeCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="ribbon" size={24} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.schemeName, { color: colors.text }]}>{t('scheme.muthulakshmi')}</Text>
              <Text style={[styles.schemeSub, { color: colors.textSecondary }]}>Total Benefit: ₹18,000</Text>
            </View>
          </View>

          {/* Timeline steps */}
          <View style={styles.timeline}>
            <View style={styles.timelineStep}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Instalment 1 (₹4,000 + Nutrition Kit)</Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>Completed upon ANC registration before 12th week</Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <Ionicons name="ellipse-outline" size={20} color={colors.primary} />
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Instalment 2 (₹4,000 + Nutrition Kit)</Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>Eligible after completing 4th month ANC</Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.textTertiary }]}>Instalment 3 (₹4,000)</Text>
                <Text style={[styles.stepDesc, { color: colors.textTertiary }]}>Upon institutional delivery in Government hospital</Text>
              </View>
            </View>
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
  title: {
    ...Typography.h2,
    marginBottom: Spacing.md,
  },
  demoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  demoNoticeText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  schemeCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schemeName: {
    ...Typography.labelLarge,
  },
  schemeSub: {
    ...Typography.caption,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
  },
  detailLabel: {
    ...Typography.bodySmall,
  },
  detailValue: {
    ...Typography.labelSmall,
  },
  timeline: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.label,
  },
  stepDesc: {
    ...Typography.caption,
    marginTop: 2,
  },
});
