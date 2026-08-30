// SchemeStatusScreen — Government Scheme Knowledge Base + Eligibility Rule Engine + Pregnancy Timeline Reminder System
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePregnancyInfo } from '../../utils/pregnancy';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';
import {
  ALL_GOVERNMENT_SCHEMES,
  evaluateSchemeEligibility,
  calculateTotalPotentialBenefits,
  getTimelineActionItems,
} from '../../services/schemeEngine';
import {
  getStoredSchemeProfile,
  saveStoredSchemeProfile,
  toggleMilestoneCompletion,
  toggleDocumentChecklist,
} from '../../services/schemeStorage';
import {
  UserSchemeProfile,
  SchemeEvaluationResult,
  TimelineActionItem,
} from '../../types/scheme';
import { SchemeDetailModal } from '../../components/SchemeDetailModal';
import { SchemeProfileModal } from '../../components/SchemeProfileModal';

export const SchemeStatusScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'action' | 'eligible' | 'timeline'>('all');
  const [userProfile, setUserProfile] = useState<UserSchemeProfile | null>(null);

  // Modals state
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<SchemeEvaluationResult | null>(null);

  const defaultDueDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const pregInfo = calculatePregnancyInfo(user?.dueDate || defaultDueDate);

  useEffect(() => {
    loadSchemeData();
  }, []);

  const loadSchemeData = async () => {
    const storedProfile = await getStoredSchemeProfile();
    setUserProfile(storedProfile);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchemeData();
    setRefreshing(false);
  };

  const handleSaveProfile = async (updated: UserSchemeProfile) => {
    setUserProfile(updated);
    await saveStoredSchemeProfile(updated);
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    const updated = await toggleMilestoneCompletion(milestoneId);
    setUserProfile(updated);
    if (selectedEvaluation) {
      const updatedEval = evaluateSchemeEligibility(
        selectedEvaluation.scheme,
        updated,
        pregInfo.currentWeek,
        user?.dueDate || defaultDueDate
      );
      setSelectedEvaluation(updatedEval);
    }
  };

  const handleToggleDocument = async (docId: string) => {
    const updated = await toggleDocumentChecklist(docId);
    setUserProfile(updated);
  };

  const handleOpenDetail = (schemeEval: SchemeEvaluationResult) => {
    setSelectedEvaluation(schemeEval);
    setDetailModalVisible(true);
  };

  const evaluations: SchemeEvaluationResult[] = useMemo(() => {
    if (!userProfile) return [];
    return ALL_GOVERNMENT_SCHEMES.map(scheme =>
      evaluateSchemeEligibility(scheme, userProfile, pregInfo.currentWeek, user?.dueDate || defaultDueDate)
    );
  }, [userProfile, pregInfo.currentWeek, user?.dueDate]);

  const totalBenefits = useMemo(() => {
    if (!userProfile) return { totalCash: 0, totalInKindCount: 0 };
    return calculateTotalPotentialBenefits(ALL_GOVERNMENT_SCHEMES, userProfile, pregInfo.currentWeek);
  }, [userProfile, pregInfo.currentWeek]);

  const timelineItems: TimelineActionItem[] = useMemo(() => {
    if (!userProfile) return [];
    return getTimelineActionItems(
      ALL_GOVERNMENT_SCHEMES,
      userProfile,
      pregInfo.currentWeek,
      user?.dueDate || defaultDueDate
    );
  }, [userProfile, pregInfo.currentWeek, user?.dueDate]);

  const pendingActionItems = useMemo(() => {
    return timelineItems.filter(item => !item.isCompleted);
  }, [timelineItems]);

  const nearestUrgentAction = pendingActionItems[0] || null;

  if (!userProfile) return null;

  const filteredEvaluations = evaluations.filter(ev => {
    if (activeTab === 'eligible') return ev.status === 'eligible';
    if (activeTab === 'action') return ev.nextMilestone !== null && !userProfile.completedMilestoneIds.includes(ev.nextMilestone.id);
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Header Title & Config Button */}
        <View style={styles.topHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>{t('scheme.title')}</Text>
            <Text style={[styles.screenSub, { color: colors.textSecondary }]}>{t('scheme.subtitle')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setProfileModalVisible(true)}
            style={[styles.configBtn, { backgroundColor: colors.primaryLight }]}
          >
            <Ionicons name="options-outline" size={20} color={colors.primary} />
            <Text style={[styles.configBtnText, { color: colors.primary }]}>{t('common.edit')}</Text>
          </TouchableOpacity>
        </View>

        {/* Benefits Summary Banner Card */}
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('scheme.potentialBenefits')}
              </Text>
              <Text style={[styles.summaryAmount, { color: colors.primary }]}>
                ₹{totalBenefits.totalCash.toLocaleString('en-IN')}
              </Text>
              {totalBenefits.totalInKindCount > 0 && (
                <View style={styles.kitPill}>
                  <Ionicons name="gift" size={14} color="#D97706" />
                  <Text style={styles.kitPillText}>+ {totalBenefits.totalInKindCount} {t('scheme.nutritionKits')}</Text>
                </View>
              )}
            </View>

            <View style={[styles.weekBadgeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.weekBadgeText, { color: colors.text }]}>Week {pregInfo.currentWeek}</Text>
              <Text style={[styles.trimesterText, { color: colors.textSecondary }]}>Trimester {pregInfo.trimester}</Text>
            </View>
          </View>

          {/* PICME RCH Bar */}
          <View style={[styles.picmeRow, { borderTopColor: colors.borderLight }]}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={[styles.picmeLabel, { color: colors.textSecondary }]}>{t('scheme.rchIdLabel')}:</Text>
            <Text style={[styles.picmeValue, { color: colors.text }]}>
              {userProfile.picmeRchId ? userProfile.picmeRchId : 'Not Set (Tap Edit to enter)'}
            </Text>
          </View>
        </Card>

        {/* Disclaimer Alert Box */}
        <View style={[styles.disclaimerBox, { backgroundColor: colors.info + '12', borderColor: colors.info + '30' }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.info} />
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            {t('scheme.disclaimerText')}
          </Text>
        </View>

        {/* Nearest Urgent Timeline Reminder Banner */}
        {nearestUrgentAction && (
          <TouchableOpacity
            onPress={() => {
              const targetEval = evaluations.find(e => e.scheme.id === nearestUrgentAction.schemeId);
              if (targetEval) handleOpenDetail(targetEval);
            }}
            activeOpacity={0.8}
          >
            <Card variant="elevated" style={[styles.urgentCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <View style={styles.urgentHeader}>
                <View style={styles.urgentBadge}>
                  <Ionicons name="time" size={14} color="#B45309" />
                  <Text style={styles.urgentBadgeText}>
                    {nearestUrgentAction.isOverdue ? t('scheme.overdue') : t('scheme.actionNeeded')}
                  </Text>
                </View>
                <Text style={styles.urgentDate}>Due: {nearestUrgentAction.dueDate}</Text>
              </View>

              <Text style={styles.urgentTitle}>
                {isTamil ? nearestUrgentAction.milestone.titleTa : nearestUrgentAction.milestone.title}
              </Text>
              <Text style={styles.urgentSchemeName}>{nearestUrgentAction.schemeName}</Text>

              <View style={styles.urgentActionRow}>
                <Text style={styles.urgentActionText}>
                  Action: {(isTamil ? nearestUrgentAction.milestone.requiredActionsTa : nearestUrgentAction.milestone.requiredActions)[0]}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#B45309" />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Segmented Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            style={[styles.tabPill, activeTab === 'all' && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.tabPillText, { color: activeTab === 'all' ? '#FFF' : colors.text }]}>
              {t('scheme.allSchemes')} ({evaluations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('action')}
            style={[styles.tabPill, activeTab === 'action' && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.tabPillText, { color: activeTab === 'action' ? '#FFF' : colors.text }]}>
              {t('scheme.actionNeeded')} ({pendingActionItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('eligible')}
            style={[styles.tabPill, activeTab === 'eligible' && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.tabPillText, { color: activeTab === 'eligible' ? '#FFF' : colors.text }]}>
              {t('scheme.eligibleOnly')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('timeline')}
            style={[styles.tabPill, activeTab === 'timeline' && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.tabPillText, { color: activeTab === 'timeline' ? '#FFF' : colors.text }]}>
              {t('scheme.timelineView')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Tab View 1: Timeline View */}
        {activeTab === 'timeline' ? (
          <View style={styles.timelineList}>
            {timelineItems.map((item, idx) => (
              <Card key={`${item.schemeId}-${item.milestone.id}-${idx}`} variant="outlined" style={styles.timelineCard}>
                <View style={styles.timelineCardHeader}>
                  <TouchableOpacity onPress={() => handleToggleMilestone(item.milestone.id)}>
                    <Ionicons
                      name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={item.isCompleted ? '#059669' : colors.textTertiary}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.timelineItemTitle, { color: item.isCompleted ? colors.textSecondary : colors.text, textDecorationLine: item.isCompleted ? 'line-through' : 'none' }]}>
                      {isTamil ? item.milestone.titleTa : item.milestone.title}
                    </Text>
                    <Text style={[styles.timelineItemSub, { color: colors.textSecondary }]}>
                      {item.schemeName} • Week {item.milestone.weekTrigger}
                    </Text>
                  </View>
                  <Text style={[styles.timelineDueDate, { color: item.isOverdue ? '#DC2626' : colors.primary }]}>
                    {item.dueDate}
                  </Text>
                </View>

                {item.benefitAmount ? (
                  <View style={styles.benefitRow}>
                    <Ionicons name="cash-outline" size={16} color="#059669" />
                    <Text style={[styles.benefitRowText, { color: '#059669' }]}>
                      +₹{item.benefitAmount.toLocaleString('en-IN')} Cash Benefit
                    </Text>
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        ) : (
          /* Tab View 2: Scheme List Cards */
          <View style={styles.schemesList}>
            {filteredEvaluations.map(ev => {
              const { scheme, status, estimatedBenefit, completedMilestonesCount, totalMilestonesCount, nextMilestone } = ev;
              const isEligible = status === 'eligible';
              const isConditional = status === 'conditional';

              return (
                <Card key={scheme.id} variant="elevated" style={styles.schemeCard}>
                  {/* Card Top Row */}
                  <View style={styles.schemeHeader}>
                    <View style={[styles.schemeIconCircle, { backgroundColor: isEligible ? '#D1FAE5' : isConditional ? '#FEF3C7' : '#FEE2E2' }]}>
                      <Ionicons
                        name={scheme.scope === 'tamil_nadu' ? 'ribbon' : 'flag'}
                        size={24}
                        color={isEligible ? '#059669' : isConditional ? '#D97706' : '#DC2626'}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.schemeCardName, { color: colors.text }]}>
                        {isTamil ? scheme.nativeName || scheme.name : scheme.name}
                      </Text>
                      <Text style={[styles.schemeBenefitSummary, { color: colors.textSecondary }]}>
                        {isTamil ? scheme.benefitsSummaryTa : scheme.benefitsSummary}
                      </Text>
                    </View>
                  </View>

                  {/* Status & Progress Bar */}
                  <View style={styles.progressRow}>
                    <View style={[styles.statusTag, { backgroundColor: isEligible ? '#D1FAE5' : isConditional ? '#FEF3C7' : '#FEE2E2' }]}>
                      <Text style={[styles.statusTagText, { color: isEligible ? '#059669' : isConditional ? '#D97706' : '#DC2626' }]}>
                        {isEligible ? t('scheme.likelyEligible') : isConditional ? t('scheme.conditional') : t('scheme.ineligible')}
                      </Text>
                    </View>

                    <Text style={[styles.milestoneCounterText, { color: colors.textSecondary }]}>
                      {completedMilestonesCount}/{totalMilestonesCount} {t('scheme.completed')}
                    </Text>
                  </View>

                  {/* Next Milestone Action Callout */}
                  {nextMilestone && (
                    <View style={[styles.nextMilestoneBox, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                      <Ionicons name="radio-button-on" size={16} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.nextMilestoneLabel, { color: colors.primary }]}>
                          Next Required Milestone (Week {nextMilestone.weekTrigger})
                        </Text>
                        <Text style={[styles.nextMilestoneTitle, { color: colors.text }]}>
                          {isTamil ? nextMilestone.titleTa : nextMilestone.title}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Details Button */}
                  <TouchableOpacity
                    onPress={() => handleOpenDetail(ev)}
                    style={[styles.detailsBtn, { borderColor: colors.border }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.detailsBtnText, { color: colors.primary }]}>{t('scheme.viewDetails')}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        )}

        {/* Local VHN Contact Card */}
        <Card variant="outlined" style={styles.vhnCard}>
          <View style={styles.vhnHeader}>
            <View style={[styles.vhnIcon, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="call" size={20} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.vhnTitle, { color: colors.text }]}>Local Health Nurse (VHN / ANM)</Text>
              <Text style={[styles.vhnSub, { color: colors.textSecondary }]}>
                {userProfile.vhnName ? userProfile.vhnName : 'Sister Contact (Not Set)'} • {userProfile.phcCenter || 'PHC Center'}
              </Text>
            </View>
            {userProfile.vhnPhone ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${userProfile.vhnPhone}`)}
                style={[styles.callBtn, { backgroundColor: '#10B981' }]}
              >
                <Ionicons name="call-sharp" size={16} color="#FFF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </Card>
      </ScrollView>

      {/* Scheme Detail Breakdown Modal */}
      <SchemeDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        evaluationResult={selectedEvaluation}
        userProfile={userProfile}
        onToggleMilestone={handleToggleMilestone}
        onToggleDocument={handleToggleDocument}
      />

      {/* Profile Configuration Modal */}
      <SchemeProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
      />
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
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    ...Typography.h2,
  },
  screenSub: {
    ...Typography.caption,
    marginTop: 2,
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  configBtnText: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  summaryCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...Typography.bodySmall,
  },
  summaryAmount: {
    ...Typography.h1,
    fontWeight: '900',
  },
  kitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  kitPillText: {
    ...Typography.caption,
    color: '#D97706',
    fontWeight: '700',
  },
  weekBadgeBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  weekBadgeText: {
    ...Typography.labelLarge,
    fontWeight: '800',
  },
  trimesterText: {
    ...Typography.caption,
  },
  picmeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.xs,
  },
  picmeLabel: {
    ...Typography.caption,
  },
  picmeValue: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  disclaimerText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 16,
  },
  urgentCard: {
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentBadgeText: {
    ...Typography.caption,
    color: '#B45309',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  urgentDate: {
    ...Typography.caption,
    color: '#B45309',
    fontWeight: '700',
  },
  urgentTitle: {
    ...Typography.h4,
    color: '#78350F',
  },
  urgentSchemeName: {
    ...Typography.caption,
    color: '#92400E',
  },
  urgentActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  urgentActionText: {
    ...Typography.bodySmall,
    color: '#B45309',
    fontWeight: '600',
    flex: 1,
  },
  tabScroll: {
    gap: Spacing.sm,
  },
  tabPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabPillText: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  schemesList: {
    gap: Spacing.lg,
  },
  schemeCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  schemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  schemeIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schemeCardName: {
    ...Typography.labelLarge,
  },
  schemeBenefitSummary: {
    ...Typography.caption,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusTagText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  milestoneCounterText: {
    ...Typography.caption,
  },
  nextMilestoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  nextMilestoneLabel: {
    ...Typography.caption,
    fontWeight: '700',
  },
  nextMilestoneTitle: {
    ...Typography.labelSmall,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  detailsBtnText: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  timelineList: {
    gap: Spacing.md,
  },
  timelineCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timelineItemTitle: {
    ...Typography.label,
  },
  timelineItemSub: {
    ...Typography.caption,
  },
  timelineDueDate: {
    ...Typography.caption,
    fontWeight: '700',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginLeft: 36,
  },
  benefitRowText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  vhnCard: {
    padding: Spacing.md,
  },
  vhnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  vhnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vhnTitle: {
    ...Typography.label,
  },
  vhnSub: {
    ...Typography.caption,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
