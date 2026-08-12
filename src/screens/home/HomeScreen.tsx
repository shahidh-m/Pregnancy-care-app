// HomeScreen — Today's summary, week calculator, health score, quick actions
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { calculatePregnancyInfo } from '../../utils/pregnancy';
import { calculateHealthScore, HealthScoreResult } from '../../services/healthScore';
import { getLocalHealthLogs } from '../../services/storage';

export const HomeScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const [healthScore, setHealthScore] = useState<HealthScoreResult>({ score: 85, status: 'good', factors: [] });
  const [logCount, setLogCount] = useState(0);

  const pregInfo = calculatePregnancyInfo(user?.dueDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString());

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    const logs = await getLocalHealthLogs();
    setLogCount(logs.length);
    const scoreRes = calculateHealthScore(logs);
    setHealthScore(scoreRes);
  };

  const weekItem = pregInfo.weekData;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {user?.name ? t('home.greeting', { name: user.name }) : t('home.greetingDefault')}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>{t('app.name')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.gearButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Today's Pregnancy Progress Card */}
        <Card variant="elevated" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.weekTitle, { color: colors.primary }]}>
                {t('home.weekTitle', { week: pregInfo.currentWeek, day: pregInfo.currentDay })}
              </Text>
              <Text style={[styles.trimesterText, { color: colors.textSecondary }]}>
                {t('home.trimester', { number: pregInfo.trimester })} • {t('home.daysRemaining', { days: pregInfo.daysRemaining })}
              </Text>
            </View>
            <View style={[styles.weekBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.weekBadgeText, { color: colors.primary }]}>W{pregInfo.currentWeek}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarTrack, { backgroundColor: colors.borderLight }]}>
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: colors.primary, width: `${pregInfo.progressPercent}%` },
              ]}
            />
          </View>

          {/* Baby Size Comparison */}
          {weekItem && (
            <View style={[styles.babySizeBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="sparkles-outline" size={24} color={colors.primary} style={styles.babyIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.babySizeText, { color: colors.text }]}>
                  {t('home.babySize', { size: language === 'ta' ? weekItem.sizeTamil : weekItem.size })}
                </Text>
                <Text style={[styles.babyDetail, { color: colors.textSecondary }]}>
                  Length: {weekItem.length} | Weight: {weekItem.weight}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Health Score & Summary Card */}
        <Card variant="default" style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View>
              <Text style={[styles.cardSectionTitle, { color: colors.text }]}>{t('home.healthScore')}</Text>
              <Text style={[styles.cardSubText, { color: colors.textSecondary }]}>{t('healthScore.description')}</Text>
            </View>
            <StatusBadge status={healthScore.status} size="medium" />
          </View>

          <View style={styles.scoreGaugeRow}>
            <View style={styles.scoreNumberBox}>
              <Text style={[styles.scoreNumber, { color: colors.primary }]}>{healthScore.score}</Text>
              <Text style={[styles.scoreTotal, { color: colors.textTertiary }]}>/100</Text>
            </View>
            <View style={styles.scoreFactorsList}>
              {healthScore.factors.map((f: string, i: number) => (
                <View key={i} style={styles.factorRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                  <Text style={[styles.factorText, { color: colors.textSecondary }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* Quick Actions Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.quickActions')}</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('HealthLog')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="fitness-outline" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.gridText, { color: colors.text }]}>{t('home.logHealth')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('DietLog')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="nutrition-outline" size={24} color="#D97706" />
            </View>
            <Text style={[styles.gridText, { color: colors.text }]}>{t('home.logDiet')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('ReportReader')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="document-text-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={[styles.gridText, { color: colors.text }]}>{t('home.viewReports')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('HospitalLocator')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="location-outline" size={24} color="#DC2626" />
            </View>
            <Text style={[styles.gridText, { color: colors.text }]}>{t('care.hospitalLocator')}</Text>
          </TouchableOpacity>
        </View>

        {/* Tip of the Day */}
        {weekItem && (
          <Card variant="outlined" style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb-outline" size={20} color={colors.warning} />
              <Text style={[styles.tipTitle, { color: colors.text }]}>{t('home.tipOfDay')}</Text>
            </View>
            <Text style={[styles.tipBody, { color: colors.textSecondary }]}>
              {language === 'ta' ? weekItem.tipTamil : weekItem.tip}
            </Text>
          </Card>
        )}
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
    paddingBottom: 90, // Leave room for floating SOS
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.bodySmall,
  },
  title: {
    ...Typography.h2,
  },
  gearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  weekTitle: {
    ...Typography.h2,
  },
  trimesterText: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  weekBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  weekBadgeText: {
    ...Typography.label,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  babySizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  babyIcon: {
    marginRight: Spacing.md,
  },
  babySizeText: {
    ...Typography.labelLarge,
  },
  babyDetail: {
    ...Typography.caption,
    marginTop: 2,
  },
  scoreCard: {
    marginBottom: Spacing.xl,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardSectionTitle: {
    ...Typography.h4,
  },
  cardSubText: {
    ...Typography.caption,
  },
  scoreGaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreNumberBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: Spacing.xl,
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: '800',
  },
  scoreTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreFactorsList: {
    flex: 1,
    gap: Spacing.xs,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  factorText: {
    ...Typography.caption,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  gridItem: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  gridIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  gridText: {
    ...Typography.label,
  },
  tipCard: {
    padding: Spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tipTitle: {
    ...Typography.labelLarge,
  },
  tipBody: {
    ...Typography.bodySmall,
  },
});
