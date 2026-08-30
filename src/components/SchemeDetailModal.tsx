// SchemeDetailModal — Detailed scheme breakdown, document checklist, milestone timeline, apply guide & helplines
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { GovernmentScheme, UserSchemeProfile, SchemeEvaluationResult } from '../types/scheme';
import { Card } from './Card';
import { Typography, Spacing, BorderRadius } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  evaluationResult: SchemeEvaluationResult | null;
  userProfile: UserSchemeProfile;
  onToggleMilestone: (milestoneId: string) => void;
  onToggleDocument: (docId: string) => void;
}

export const SchemeDetailModal: React.FC<Props> = ({
  visible,
  onClose,
  evaluationResult,
  userProfile,
  onToggleMilestone,
  onToggleDocument,
}) => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';

  if (!evaluationResult) return null;

  const { scheme, status, estimatedBenefit, matchReasons, missingRequirements } = evaluationResult;
  const completedMilestoneIds = userProfile.completedMilestoneIds || [];
  const checkedDocIds = userProfile.checkedDocumentIds || [];

  const handleCallHelpline = () => {
    if (scheme.helplineNumber) {
      Linking.openURL(`tel:${scheme.helplineNumber}`);
    }
  };

  const handleOpenPortal = () => {
    if (scheme.officialPortalUrl) {
      Linking.openURL(scheme.officialPortalUrl);
    }
  };

  const getStatusBadge = () => {
    if (status === 'eligible') {
      return (
        <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text style={[styles.badgeText, { color: '#059669' }]}>{t('scheme.likelyEligible')}</Text>
        </View>
      );
    }
    if (status === 'conditional') {
      return (
        <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="alert-circle" size={16} color="#D97706" />
          <Text style={[styles.badgeText, { color: '#D97706' }]}>{t('scheme.conditional')}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
        <Ionicons name="close-circle" size={16} color="#DC2626" />
        <Text style={[styles.badgeText, { color: '#DC2626' }]}>{t('scheme.ineligible')}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={{ flex: 1, paddingRight: Spacing.sm }}>
              <Text style={[styles.schemeTitle, { color: colors.text }]}>
                {isTamil ? scheme.nativeName || scheme.name : scheme.name}
              </Text>
              <Text style={[styles.scopeText, { color: colors.textSecondary }]}>
                {scheme.scope === 'tamil_nadu' ? 'Tamil Nadu State Scheme' : 'National Scheme'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            {/* Status Banner */}
            <View style={styles.statusRow}>
              {getStatusBadge()}
              {estimatedBenefit > 0 && (
                <Text style={[styles.benefitHighlight, { color: colors.primary }]}>
                  ₹{estimatedBenefit.toLocaleString('en-IN')}
                </Text>
              )}
            </View>

            {/* Non-claiming Disclaimer */}
            <View style={[styles.disclaimerBox, { backgroundColor: colors.info + '15', borderColor: colors.info + '40' }]}>
              <Ionicons name="shield-checkmark" size={18} color={colors.info} />
              <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                {t('scheme.disclaimerText')}
              </Text>
            </View>

            {/* Overview */}
            <Card variant="outlined" style={styles.sectionCard}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Overview</Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {isTamil ? scheme.overviewTa : scheme.overview}
              </Text>
            </Card>

            {/* Eligibility Evaluation Details */}
            <Card variant="outlined" style={styles.sectionCard}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Eligibility Analysis</Text>

              {matchReasons.map((reason, idx) => (
                <View key={`match-${idx}`} style={styles.reasonRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
                  <Text style={[styles.reasonText, { color: colors.text }]}>{reason}</Text>
                </View>
              ))}

              {missingRequirements.map((req, idx) => (
                <View key={`req-${idx}`} style={styles.reasonRow}>
                  <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
                  <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{req}</Text>
                </View>
              ))}
            </Card>

            {/* Milestones & Installment Schedule */}
            <Card variant="outlined" style={styles.sectionCard}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Milestones & Installments
              </Text>

              {scheme.milestones.map((m, idx) => {
                const isCompleted = completedMilestoneIds.includes(m.id);
                return (
                  <View key={m.id} style={[styles.milestoneItem, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                    <TouchableOpacity
                      onPress={() => onToggleMilestone(m.id)}
                      style={styles.milestoneHeaderRow}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isCompleted ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isCompleted ? colors.primary : colors.textTertiary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.milestoneTitle, { color: isCompleted ? colors.textSecondary : colors.text, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>
                          {isTamil ? m.titleTa : m.title}
                        </Text>
                        <Text style={[styles.milestoneWeek, { color: colors.primary }]}>
                          Week {m.weekTrigger} Milestone
                        </Text>
                      </View>
                      {m.benefitAmount ? (
                        <Text style={[styles.milestoneAmount, { color: colors.text }]}>
                          +₹{m.benefitAmount.toLocaleString('en-IN')}
                        </Text>
                      ) : null}
                    </TouchableOpacity>

                    <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]}>
                      {isTamil ? m.descriptionTa : m.description}
                    </Text>

                    {m.benefitItems && m.benefitItems.length > 0 && (
                      <View style={styles.itemsList}>
                        {m.benefitItems.map((item, i) => (
                          <View key={i} style={styles.itemPill}>
                            <Ionicons name="gift-outline" size={14} color={colors.primary} />
                            <Text style={[styles.itemPillText, { color: colors.primary }]}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </Card>

            {/* Required Documents Checklist */}
            <Card variant="outlined" style={styles.sectionCard}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                {t('scheme.requiredDocs')}
              </Text>
              {scheme.requiredDocuments.map(doc => {
                const isChecked = checkedDocIds.includes(doc.id);
                return (
                  <TouchableOpacity
                    key={doc.id}
                    onPress={() => onToggleDocument(doc.id)}
                    style={styles.docRow}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isChecked ? '#059669' : colors.textTertiary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.docName, { color: colors.text }]}>
                        {isTamil ? doc.nameTa : doc.name}
                      </Text>
                      <Text style={[styles.docDesc, { color: colors.textSecondary }]}>
                        {isTamil ? doc.descriptionTa : doc.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card>

            {/* Step-by-Step How to Apply */}
            <Card variant="outlined" style={styles.sectionCard}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                {t('scheme.howToApply')}
              </Text>
              {(isTamil ? scheme.applyInstructionsTa : scheme.applyInstructions).map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.stepNumberText, { color: colors.primary }]}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                </View>
              ))}
            </Card>

            {/* Helpline & Official Link Action Buttons */}
            <View style={styles.actionButtonsRow}>
              {scheme.helplineNumber && (
                <TouchableOpacity
                  onPress={handleCallHelpline}
                  style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                >
                  <Ionicons name="call" size={18} color="#FFF" />
                  <Text style={styles.actionBtnText}>{t('scheme.officialHelpline')} ({scheme.helplineNumber})</Text>
                </TouchableOpacity>
              )}

              {scheme.officialPortalUrl && (
                <TouchableOpacity
                  onPress={handleOpenPortal}
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="globe-outline" size={18} color="#FFF" />
                  <Text style={styles.actionBtnText}>{t('scheme.visitPortal')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  schemeTitle: {
    ...Typography.h3,
  },
  scopeText: {
    ...Typography.caption,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollBody: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  badgeText: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  benefitHighlight: {
    ...Typography.h3,
    fontWeight: '800',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  disclaimerText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  sectionCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeading: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  bodyText: {
    ...Typography.body,
    lineHeight: 20,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reasonText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  milestoneItem: {
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  milestoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  milestoneTitle: {
    ...Typography.labelLarge,
  },
  milestoneWeek: {
    ...Typography.caption,
    fontWeight: '600',
  },
  milestoneAmount: {
    ...Typography.labelLarge,
    fontWeight: '700',
  },
  milestoneDesc: {
    ...Typography.bodySmall,
    marginLeft: 36,
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginLeft: 36,
    marginTop: 4,
  },
  itemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  itemPillText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  docName: {
    ...Typography.label,
  },
  docDesc: {
    ...Typography.caption,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  stepText: {
    ...Typography.bodySmall,
    flex: 1,
    lineHeight: 18,
  },
  actionButtonsRow: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  actionBtnText: {
    color: '#FFF',
    ...Typography.labelLarge,
  },
});
