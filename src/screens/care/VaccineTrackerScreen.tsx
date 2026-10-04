// VaccineTrackerScreen — Pregnancy Vaccine Schedule Tracker with Timeline, Checklist & Medical Disclaimer
// Data sourced from: NIS (National Immunization Schedule), UIP, FOGSI, WHO — verified as of 2026
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePregnancyInfo } from '../../utils/pregnancy';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  PregnancyVaccine,
  VaccineDose,
  ContraindicatedVaccine,
  VaccineTrackerProfile,
} from '../../types/vaccine';

// Import vaccine data
import vaccineData from '../../data/vaccineSchedule.json';

const STORAGE_KEY = '@vaccine_tracker_profile';

// Theme-aware category configuration
const getCategoryConfig = (isDark: boolean) => ({
  mandatory: {
    icon: 'shield-checkmark',
    bgColor: isDark ? '#064E3B70' : '#D1FAE5',
    color: isDark ? '#6EE7B7' : '#059669',
    label: 'Mandatory (Govt)',
    labelTa: 'கட்டாயம் (அரசு)',
  },
  recommended: {
    icon: 'star',
    bgColor: isDark ? '#1E3A8A70' : '#DBEAFE',
    color: isDark ? '#93C5FD' : '#2563EB',
    label: 'Recommended (FOGSI)',
    labelTa: 'பரிந்துரைக்கப்பட்டது (FOGSI)',
  },
  approved: {
    icon: 'checkmark-circle',
    bgColor: isDark ? '#78350F70' : '#FEF3C7',
    color: isDark ? '#FDE68A' : '#D97706',
    label: 'Govt Approved',
    labelTa: 'அரசு அனுமதி',
  },
});

const AVAILABILITY_LABELS = {
  phc_free: { en: '🏥 FREE at all PHCs', ta: '🏥 அனைத்து PHC-களிலும் இலவசம்' },
  govt_hospital: { en: '🏛️ Government Hospitals', ta: '🏛️ அரசு மருத்துவமனைகள்' },
  private: { en: '🏨 Private Hospitals', ta: '🏨 தனியார் மருத்துவமனைகள்' },
  both: { en: '🏥 Govt & Private Hospitals', ta: '🏥 அரசு & தனியார் மருத்துவமனைகள்' },
} as const;

export const VaccineTrackerScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';
  const { user } = useAuth();

  const categoryConfig = useMemo(() => getCategoryConfig(isDark), [isDark]);

  const [activeTab, setActiveTab] = useState<'schedule' | 'timeline' | 'avoid'>('schedule');
  const [selectedVaccine, setSelectedVaccine] = useState<PregnancyVaccine | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [profile, setProfile] = useState<VaccineTrackerProfile>({
    completedDoseIds: [],
    previousTdWithin3Years: false,
    tdapPreference: false,
  });

  const defaultDueDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const pregInfo = calculatePregnancyInfo(user?.dueDate || defaultDueDate);

  const vaccines: PregnancyVaccine[] = vaccineData.vaccines as PregnancyVaccine[];
  const contraindicatedVaccines: ContraindicatedVaccine[] = vaccineData.contraindicatedVaccines as ContraindicatedVaccine[];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setProfile(JSON.parse(stored));
    } catch {}
  };

  const toggleDoseCompletion = useCallback(async (doseId: string) => {
    setProfile(prev => {
      const newCompleted = prev.completedDoseIds.includes(doseId)
        ? prev.completedDoseIds.filter(id => id !== doseId)
        : [...prev.completedDoseIds, doseId];
      const updated = { ...prev, completedDoseIds: newCompleted };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  // Build timeline items sorted by week
  const timelineItems = useMemo(() => {
    const items: { vaccine: PregnancyVaccine; dose: VaccineDose; isCompleted: boolean; isCurrentWindow: boolean; isPast: boolean }[] = [];
    vaccines.forEach(vaccine => {
      vaccine.doses.forEach(dose => {
        const isCompleted = profile.completedDoseIds.includes(dose.id);
        const isCurrentWindow = pregInfo.currentWeek >= dose.weekStart && pregInfo.currentWeek <= dose.weekEnd;
        const isPast = pregInfo.currentWeek > dose.weekEnd;
        items.push({ vaccine, dose, isCompleted, isCurrentWindow, isPast });
      });
    });
    return items.sort((a, b) => a.dose.weekStart - b.dose.weekStart);
  }, [vaccines, profile.completedDoseIds, pregInfo.currentWeek]);

  const completedCount = profile.completedDoseIds.length;
  const totalDoses = timelineItems.length;
  const urgentDoses = timelineItems.filter(item => item.isCurrentWindow && !item.isCompleted);

  const openVaccineDetail = (vaccine: PregnancyVaccine) => {
    setSelectedVaccine(vaccine);
    setDetailModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              {isTamil ? 'தடுப்பூசி அட்டவணை' : 'Vaccine Schedule'}
            </Text>
            <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
              {isTamil
                ? 'கர்ப்பகால தடுப்பூசி கண்காணிப்பு & நினைவூட்டல்'
                : 'Pregnancy vaccination tracker & reminders'}
            </Text>
          </View>
          <View style={[styles.weekBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
            <Text style={[styles.weekBadgeText, { color: colors.primary }]}>
              {isTamil ? `வாரம் ${pregInfo.currentWeek}` : `Week ${pregInfo.currentWeek}`}
            </Text>
          </View>
        </View>

        {/* Progress Summary Card */}
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.progressCircle, { borderColor: completedCount === totalDoses ? (isDark ? '#4FB3A0' : '#059669') : colors.primary }]}>
              <Text style={[styles.progressNumber, { color: completedCount === totalDoses ? (isDark ? '#4FB3A0' : '#059669') : colors.primary }]}>
                {completedCount}/{totalDoses}
              </Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                {isTamil ? 'முடிந்தது' : 'Completed'}
              </Text>
            </View>

            <View style={styles.summaryInfo}>
              {urgentDoses.length > 0 ? (
                <View style={[styles.urgentPill, { backgroundColor: isDark ? '#78350F60' : '#FEF3C7' }]}>
                  <Ionicons name="alert-circle" size={16} color={isDark ? '#FDBA74' : '#D97706'} />
                  <Text style={[styles.urgentPillText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                    {urgentDoses.length} {isTamil ? 'தடுப்பூசி இந்த வாரம் எடுக்க வேண்டும்' : 'vaccine(s) due this window'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.urgentPill, { backgroundColor: isDark ? '#064E3B60' : '#D1FAE5' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={isDark ? '#6EE7B7' : '#059669'} />
                  <Text style={[styles.urgentPillText, { color: isDark ? '#6EE7B7' : '#059669' }]}>
                    {isTamil ? 'இப்போதைக்கு அனைத்தும் நிறைவு' : 'All up to date for now'}
                  </Text>
                </View>
              )}

              {/* Legend pills */}
              <View style={styles.legendRow}>
                <View style={[styles.legendPill, { backgroundColor: categoryConfig.mandatory.bgColor }]}>
                  <View style={[styles.legendDot, { backgroundColor: categoryConfig.mandatory.color }]} />
                  <Text style={[styles.legendText, { color: categoryConfig.mandatory.color }]}>
                    {isTamil ? 'கட்டாயம்' : 'Mandatory'}
                  </Text>
                </View>
                <View style={[styles.legendPill, { backgroundColor: categoryConfig.recommended.bgColor }]}>
                  <View style={[styles.legendDot, { backgroundColor: categoryConfig.recommended.color }]} />
                  <Text style={[styles.legendText, { color: categoryConfig.recommended.color }]}>
                    {isTamil ? 'பரிந்துரை' : 'Recommended'}
                  </Text>
                </View>
                <View style={[styles.legendPill, { backgroundColor: categoryConfig.approved.bgColor }]}>
                  <View style={[styles.legendDot, { backgroundColor: categoryConfig.approved.color }]} />
                  <Text style={[styles.legendText, { color: categoryConfig.approved.color }]}>
                    {isTamil ? 'அனுமதி' : 'Approved'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* ⚠️ MEDICAL DISCLAIMER BOX */}
        <View style={[styles.disclaimerBox, { backgroundColor: isDark ? '#450A0A60' : '#FEF2F2', borderColor: isDark ? '#991B1B' : '#FECACA' }]}>
          <View style={styles.disclaimerHeader}>
            <Ionicons name="warning" size={20} color={isDark ? '#FCA5A5' : '#DC2626'} />
            <Text style={[styles.disclaimerTitle, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
              {isTamil ? 'மருத்துவ பொறுப்புத் துறப்பு' : 'Medical Disclaimer'}
            </Text>
          </View>
          <Text style={[styles.disclaimerText, { color: isDark ? '#FECACA' : '#7F1D1D' }]}>
            {isTamil ? vaccineData.disclaimer.ta : vaccineData.disclaimer.en}
          </Text>
        </View>

        {/* 🏥 PHC / Sugaathara Maiyam Note */}
        <View style={[styles.phcNoteBox, { backgroundColor: isDark ? '#1E3A8A50' : '#EFF6FF', borderColor: isDark ? '#1D4ED8' : '#BFDBFE' }]}>
          <View style={styles.phcNoteHeader}>
            <Ionicons name="medkit" size={18} color={isDark ? '#93C5FD' : '#2563EB'} />
            <Text style={[styles.phcNoteTitle, { color: isDark ? '#93C5FD' : '#2563EB' }]}>
              {isTamil ? 'அருகிலுள்ள ஆரம்ப சுகாதார நிலையம் (PHC)' : 'Nearest Primary Health Centre (PHC)'}
            </Text>
          </View>
          <Text style={[styles.phcNoteText, { color: isDark ? '#DBEAFE' : '#1E3A5F' }]}>
            {isTamil ? vaccineData.phcNote.ta : vaccineData.phcNote.en}
          </Text>
          <Text style={[styles.phcTamilName, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
            ஆரம்ப சுகாதார நிலையம் (Aaramba Sugaathara Nilayam / Primary Health Centre)
          </Text>
        </View>

        {/* Tab Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {[
            { key: 'schedule' as const, label: isTamil ? 'தடுப்பூசிகள்' : 'Vaccines', icon: 'medkit-outline' },
            { key: 'timeline' as const, label: isTamil ? 'காலக்கோடு' : 'Timeline', icon: 'git-branch-outline' },
            { key: 'avoid' as const, label: isTamil ? 'தவிர்க்க வேண்டியவை' : 'Avoid', icon: 'close-circle-outline' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabPill,
                activeTab === tab.key
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? '#FFF' : colors.text}
              />
              <Text style={[styles.tabPillText, { color: activeTab === tab.key ? '#FFF' : colors.text }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TAB: Vaccine Schedule Cards */}
        {activeTab === 'schedule' && (
          <View style={styles.vaccineList}>
            {vaccines.map(vaccine => {
              const config = categoryConfig[vaccine.category];
              const completedDoses = vaccine.doses.filter(d => profile.completedDoseIds.includes(d.id)).length;
              const allDone = completedDoses === vaccine.doses.length;

              return (
                <Card key={vaccine.id} variant="elevated" style={styles.vaccineCard}>
                  {/* Header */}
                  <View style={styles.vaccineHeader}>
                    <View style={[styles.vaccineIcon, { backgroundColor: config.bgColor }]}>
                      <Ionicons name={config.icon as any} size={24} color={config.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.vaccineName, { color: colors.text }]}>
                        {isTamil ? vaccine.nameTa : vaccine.name}
                      </Text>
                      <View style={[styles.categoryTag, { backgroundColor: config.bgColor }]}>
                        <Text style={[styles.categoryTagText, { color: config.color }]}>
                          {isTamil ? config.labelTa : config.label}
                        </Text>
                      </View>
                    </View>
                    {allDone && (
                      <View style={styles.completeBadge}>
                        <Ionicons name="checkmark-done-circle" size={28} color={isDark ? '#4FB3A0' : '#059669'} />
                      </View>
                    )}
                  </View>

                  {/* Purpose */}
                  <Text style={[styles.vaccinePurpose, { color: colors.textSecondary }]}>
                    {isTamil ? vaccine.purposeTa : vaccine.purpose}
                  </Text>

                  {/* Availability Tag */}
                  <View style={[styles.availabilityRow, { backgroundColor: vaccine.isFreeAtPHC ? (isDark ? '#064E3B50' : '#ECFDF5') : colors.surface }]}>
                    <Text style={[styles.availabilityText, { color: vaccine.isFreeAtPHC ? (isDark ? '#6EE7B7' : '#059669') : colors.textSecondary }]}>
                      {isTamil
                        ? AVAILABILITY_LABELS[vaccine.availability].ta
                        : AVAILABILITY_LABELS[vaccine.availability].en}
                    </Text>
                  </View>

                  {/* Dose Checklist */}
                  <View style={styles.doseList}>
                    {vaccine.doses.map(dose => {
                      const isDone = profile.completedDoseIds.includes(dose.id);
                      const isCurrentWindow = pregInfo.currentWeek >= dose.weekStart && pregInfo.currentWeek <= dose.weekEnd;
                      const isPast = pregInfo.currentWeek > dose.weekEnd && !isDone;

                      return (
                        <TouchableOpacity
                          key={dose.id}
                          onPress={() => toggleDoseCompletion(dose.id)}
                          style={[
                            styles.doseItem,
                            {
                              backgroundColor: isDone
                                ? (isDark ? '#064E3B40' : '#ECFDF5')
                                : isCurrentWindow
                                ? (isDark ? '#451A0360' : '#FFF7ED')
                                : colors.surface,
                              borderColor: isDone
                                ? (isDark ? '#059669' : '#A7F3D0')
                                : isCurrentWindow
                                ? (isDark ? '#EA580C' : '#FED7AA')
                                : colors.borderLight,
                            },
                          ]}
                        >
                          <Ionicons
                            name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                            size={22}
                            color={isDone ? (isDark ? '#6EE7B7' : '#059669') : isCurrentWindow ? (isDark ? '#FDBA74' : '#EA580C') : colors.textTertiary}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={[
                              styles.doseLabel,
                              {
                                color: isDone
                                  ? (isDark ? '#6EE7B7' : '#065F46')
                                  : isCurrentWindow
                                  ? (isDark ? '#FDBA74' : '#9A3412')
                                  : colors.text,
                                textDecorationLine: isDone ? 'line-through' : 'none',
                              },
                            ]}>
                              {isTamil ? dose.labelTa : dose.label}
                            </Text>
                            <Text style={[
                              styles.doseWeek,
                              {
                                color: isDone
                                  ? (isDark ? '#A7F3D0' : '#047857')
                                  : isCurrentWindow
                                  ? (isDark ? '#FFEDD5' : '#C2410C')
                                  : colors.textSecondary,
                              },
                            ]}>
                              {isTamil
                                ? `வாரம் ${dose.weekStart}–${dose.weekEnd} | ${dose.trimester === 'any' ? 'எந்த மூன்று மாதமும்' : `${dose.trimester}ம் மூன்று மாதம்`}`
                                : `Week ${dose.weekStart}–${dose.weekEnd} | ${dose.trimester === 'any' ? 'Any Trimester' : `Trimester ${dose.trimester}`}`}
                            </Text>
                            {dose.specialCondition && (
                              <Text style={[styles.doseCondition, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                                ⚡ {isTamil ? dose.specialConditionTa : dose.specialCondition}
                              </Text>
                            )}
                            {isCurrentWindow && !isDone && (
                              <View style={[styles.currentWindowBadge, { backgroundColor: isDark ? '#78350F70' : '#FFF7ED' }]}>
                                <Ionicons name="time" size={12} color={isDark ? '#FDBA74' : '#EA580C'} />
                                <Text style={[styles.currentWindowText, { color: isDark ? '#FDBA74' : '#EA580C' }]}>
                                  {isTamil ? 'இப்போது எடுக்கக்கூடிய நேரம்!' : 'Currently in vaccination window!'}
                                </Text>
                              </View>
                            )}
                            {isPast && (
                              <View style={[styles.currentWindowBadge, { backgroundColor: isDark ? '#450A0A70' : '#FEE2E2' }]}>
                                <Ionicons name="alert-circle" size={12} color={isDark ? '#FCA5A5' : '#DC2626'} />
                                <Text style={[styles.currentWindowText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                                  {isTamil ? 'காலக்கெடு கடந்தது — மருத்துவரிடம் கேளுங்கள்' : 'Window passed — consult your doctor'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Detail Button */}
                  <TouchableOpacity
                    onPress={() => openVaccineDetail(vaccine)}
                    style={[styles.detailBtn, { borderColor: colors.border }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                    <Text style={[styles.detailBtnText, { color: colors.primary }]}>
                      {isTamil ? 'முழு விவரங்கள் & பக்கவிளைவுகள்' : 'Full Details & Side Effects'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        )}

        {/* TAB: Timeline View */}
        {activeTab === 'timeline' && (
          <View style={styles.timelineContainer}>
            {/* Visual Timeline */}
            {timelineItems.map((item, idx) => {
              const config = categoryConfig[item.vaccine.category];
              const isLast = idx === timelineItems.length - 1;

              return (
                <View key={`${item.dose.id}-${idx}`} style={styles.timelineRow}>
                  {/* Left timeline bar */}
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      {
                        backgroundColor: item.isCompleted
                          ? (isDark ? '#4FB3A0' : '#059669')
                          : item.isCurrentWindow
                          ? (isDark ? '#F97316' : '#EA580C')
                          : item.isPast
                          ? (isDark ? '#EF4444' : '#DC2626')
                          : colors.textTertiary,
                      },
                    ]}>
                      {item.isCompleted && (
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      )}
                    </View>
                    {!isLast && (
                      <View style={[
                        styles.timelineLine,
                        {
                          backgroundColor: item.isCompleted ? (isDark ? '#059669' : '#A7F3D0') : colors.borderLight,
                        },
                      ]} />
                    )}
                  </View>

                  {/* Right content */}
                  <TouchableOpacity
                    onPress={() => toggleDoseCompletion(item.dose.id)}
                    style={[
                      styles.timelineCard,
                      {
                        backgroundColor: item.isCompleted
                          ? (isDark ? '#064E3B40' : '#ECFDF5')
                          : item.isCurrentWindow
                          ? (isDark ? '#451A0360' : '#FFF7ED')
                          : colors.card,
                        borderColor: item.isCompleted
                          ? (isDark ? '#059669' : '#A7F3D0')
                          : item.isCurrentWindow
                          ? (isDark ? '#EA580C' : '#FED7AA')
                          : colors.borderLight,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.timelineCardTop}>
                      <View style={[styles.weekRangeBadge, { backgroundColor: config.bgColor }]}>
                        <Text style={[styles.weekRangeText, { color: config.color }]}>
                          {isTamil ? `வாரம் ${item.dose.weekStart}–${item.dose.weekEnd}` : `Week ${item.dose.weekStart}–${item.dose.weekEnd}`}
                        </Text>
                      </View>
                      <View style={[styles.categoryDot, { backgroundColor: config.color }]} />
                    </View>

                    <Text style={[
                      styles.timelineItemTitle,
                      {
                        color: item.isCompleted
                          ? (isDark ? '#6EE7B7' : '#065F46')
                          : item.isCurrentWindow
                          ? (isDark ? '#FDBA74' : '#9A3412')
                          : colors.text,
                        textDecorationLine: item.isCompleted ? 'line-through' : 'none',
                      },
                    ]}>
                      {isTamil ? item.dose.labelTa : item.dose.label}
                    </Text>

                    <Text style={[
                      styles.timelineItemVaccine,
                      {
                        color: item.isCurrentWindow
                          ? (isDark ? '#FED7AA' : '#C2410C')
                          : colors.textSecondary,
                      },
                    ]}>
                      {isTamil ? item.vaccine.nameTa : item.vaccine.name}
                    </Text>

                    <Text style={[
                      styles.timelineItemDesc,
                      {
                        color: item.isCurrentWindow
                          ? (isDark ? '#FFEDD5' : '#7C2D12')
                          : colors.textSecondary,
                      },
                    ]} numberOfLines={2}>
                      {isTamil ? item.dose.descriptionTa : item.dose.description}
                    </Text>

                    {item.isCurrentWindow && !item.isCompleted && (
                      <View style={[styles.timelineUrgentBadge, { backgroundColor: isDark ? '#78350F70' : '#FEF3C7' }]}>
                        <Ionicons name="time" size={14} color={isDark ? '#FDE68A' : '#D97706'} />
                        <Text style={[styles.timelineUrgentText, { color: isDark ? '#FDE68A' : '#D97706' }]}>
                          {isTamil ? 'இப்போது எடுக்க வேண்டிய நேரம்' : 'Due now — in current window'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB: Contraindicated Vaccines */}
        {activeTab === 'avoid' && (
          <View style={styles.avoidList}>
            <Card variant="elevated" style={[styles.avoidHeader, { backgroundColor: isDark ? '#450A0A60' : '#FEF2F2', borderColor: isDark ? '#991B1B' : '#FECACA' }]}>
              <View style={styles.avoidHeaderRow}>
                <Ionicons name="warning" size={22} color={isDark ? '#FCA5A5' : '#DC2626'} />
                <Text style={[styles.avoidHeaderTitle, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
                  {isTamil
                    ? 'கர்ப்ப காலத்தில் எடுக்கக்கூடாத தடுப்பூசிகள்'
                    : 'Vaccines NOT Safe During Pregnancy'}
                </Text>
              </View>
              <Text style={[styles.avoidHeaderDesc, { color: isDark ? '#FECACA' : '#7F1D1D' }]}>
                {isTamil
                  ? 'நேரடி (Live) தடுப்பூசிகள் கர்ப்ப காலத்தில் பொதுவாக முரண்பாடானவை. கருத்தரிப்பதற்கு முன் அல்லது பிரசவத்திற்குப் பிறகு இவற்றை எடுக்கவும்.'
                  : 'Live vaccines are generally contraindicated during pregnancy. Get these before conception or after delivery.'}
              </Text>
            </Card>

            {contraindicatedVaccines.map(cv => (
              <Card key={cv.id} variant="outlined" style={styles.avoidCard}>
                <View style={styles.avoidCardHeader}>
                  <View style={[styles.avoidIcon, { backgroundColor: isDark ? '#450A0A70' : '#FEE2E2' }]}>
                    <Ionicons name="close-circle" size={22} color={isDark ? '#FCA5A5' : '#DC2626'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.avoidName, { color: colors.text }]}>
                      {isTamil ? cv.nameTa : cv.name}
                    </Text>
                    <View style={[styles.avoidTypeBadge, { backgroundColor: isDark ? '#450A0A70' : '#FEE2E2' }]}>
                      <Text style={[styles.avoidTypeText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                        {isTamil ? cv.typeTa : cv.type}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.avoidReason, { color: colors.textSecondary }]}>
                  {isTamil ? cv.reasonTa : cv.reason}
                </Text>
              </Card>
            ))}
          </View>
        )}

        {/* Sources */}
        <View style={[styles.sourcesBox, { borderColor: colors.borderLight }]}>
          <Text style={[styles.sourcesTitle, { color: colors.textSecondary }]}>
            {isTamil ? '📚 தகவல் ஆதாரங்கள்:' : '📚 Sources:'}
          </Text>
          {(vaccineData.sources as string[]).map((src, i) => (
            <Text key={i} style={[styles.sourceItem, { color: colors.textTertiary }]}>
              • {src}
            </Text>
          ))}
          <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
            {isTamil ? `கடைசியாக புதுப்பிக்கப்பட்டது: ${vaccineData.lastUpdated}` : `Last updated: ${vaccineData.lastUpdated}`}
          </Text>
        </View>
      </ScrollView>

      {/* Vaccine Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <SafeAreaView style={{ flex: 1 }}>
              {selectedVaccine && (
                <ScrollView contentContainerStyle={styles.modalContent}>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>
                        {isTamil ? selectedVaccine.nameTa : selectedVaccine.name}
                      </Text>
                      <Text style={[styles.modalFullName, { color: colors.textSecondary }]}>
                        {isTamil ? selectedVaccine.fullNameTa : selectedVaccine.fullName}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                      <Ionicons name="close-circle" size={30} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>

                  {/* Category & Source */}
                  <View style={styles.modalTagRow}>
                    <View style={[styles.categoryTag, { backgroundColor: categoryConfig[selectedVaccine.category].bgColor }]}>
                      <Text style={[styles.categoryTagText, { color: categoryConfig[selectedVaccine.category].color }]}>
                        {isTamil
                          ? categoryConfig[selectedVaccine.category].labelTa
                          : categoryConfig[selectedVaccine.category].label}
                      </Text>
                    </View>
                    <Text style={[styles.sourceText, { color: colors.textTertiary }]}>
                      {selectedVaccine.source}
                    </Text>
                  </View>

                  {/* Purpose */}
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                      {isTamil ? '🎯 நோக்கம்' : '🎯 Purpose'}
                    </Text>
                    <Text style={[styles.modalSectionBody, { color: colors.textSecondary }]}>
                      {isTamil ? selectedVaccine.purposeTa : selectedVaccine.purpose}
                    </Text>
                  </View>

                  {/* Important Note */}
                  {selectedVaccine.importantNote && (
                    <View style={[styles.importantNoteBox, { backgroundColor: isDark ? '#451A0360' : '#FFF7ED', borderColor: isDark ? '#EA580C' : '#FED7AA' }]}>
                      <Ionicons name="bulb" size={18} color={isDark ? '#FBBF24' : '#D97706'} />
                      <Text style={[styles.importantNoteText, { color: isDark ? '#FDBA74' : '#92400E' }]}>
                        {isTamil ? selectedVaccine.importantNoteTa : selectedVaccine.importantNote}
                      </Text>
                    </View>
                  )}

                  {/* Protects Against */}
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                      {isTamil ? '🛡️ இதிலிருந்து பாதுகாக்கிறது' : '🛡️ Protects Against'}
                    </Text>
                    {(isTamil ? selectedVaccine.protectsAgainstTa : selectedVaccine.protectsAgainst).map((item, i) => (
                      <View key={i} style={styles.listItem}>
                        <Ionicons name="checkmark-circle" size={16} color={isDark ? '#4FB3A0' : '#059669'} />
                        <Text style={[styles.listItemText, { color: colors.textSecondary }]}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Side Effects */}
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                      {isTamil ? '💊 சாத்தியமான பக்கவிளைவுகள்' : '💊 Possible Side Effects'}
                    </Text>
                    {(isTamil ? selectedVaccine.sideEffectsTa : selectedVaccine.sideEffects).map((item, i) => (
                      <View key={i} style={styles.listItem}>
                        <Ionicons name="ellipse" size={8} color={colors.textTertiary} />
                        <Text style={[styles.listItemText, { color: colors.textSecondary }]}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Contraindications */}
                  {selectedVaccine.contraindications && (
                    <View style={[styles.contraindicationBox, { backgroundColor: isDark ? '#450A0A60' : '#FEF2F2', borderColor: isDark ? '#991B1B' : '#FECACA' }]}>
                      <Ionicons name="warning" size={16} color={isDark ? '#FCA5A5' : '#DC2626'} />
                      <Text style={[styles.contraindicationText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
                        {isTamil ? selectedVaccine.contraindicationsTa : selectedVaccine.contraindications}
                      </Text>
                    </View>
                  )}

                  {/* Dose Schedule in Detail */}
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                      {isTamil ? '📅 தவணை அட்டவணை' : '📅 Dose Schedule'}
                    </Text>
                    {selectedVaccine.doses.map(dose => (
                      <View key={dose.id} style={[styles.modalDoseCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                        <Text style={[styles.modalDoseLabel, { color: colors.text }]}>
                          {isTamil ? dose.labelTa : dose.label}
                        </Text>
                        <Text style={[styles.modalDoseWeek, { color: colors.primary }]}>
                          {isTamil
                            ? `வாரம் ${dose.weekStart}–${dose.weekEnd}`
                            : `Week ${dose.weekStart}–${dose.weekEnd}`}
                        </Text>
                        <Text style={[styles.modalDoseDesc, { color: colors.textSecondary }]}>
                          {isTamil ? dose.descriptionTa : dose.description}
                        </Text>
                        {dose.specialCondition && (
                          <Text style={[styles.modalDoseCondition, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                            ⚡ {isTamil ? dose.specialConditionTa : dose.specialCondition}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Where to Get */}
                  <View style={[styles.whereToGet, { backgroundColor: isDark ? '#1E3A8A50' : '#EFF6FF', borderColor: isDark ? '#1D4ED8' : '#BFDBFE' }]}>
                    <Ionicons name="location" size={18} color={isDark ? '#93C5FD' : '#2563EB'} />
                    <Text style={[styles.whereToGetText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
                      {isTamil
                        ? AVAILABILITY_LABELS[selectedVaccine.availability].ta
                        : AVAILABILITY_LABELS[selectedVaccine.availability].en}
                    </Text>
                  </View>
                </ScrollView>
              )}
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 100 },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  screenTitle: { ...Typography.h2 },
  screenSub: { ...Typography.caption, marginTop: 2 },
  weekBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1 },
  weekBadgeText: { ...Typography.labelSmall, fontWeight: '800' },

  // Summary
  summaryCard: { padding: Spacing.lg, gap: Spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  progressCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  progressNumber: { ...Typography.h3, fontWeight: '900' },
  progressLabel: { ...Typography.caption, fontSize: 10 },
  summaryInfo: { flex: 1, gap: Spacing.sm },
  urgentPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.sm },
  urgentPillText: { ...Typography.caption, fontWeight: '700', flex: 1 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  legendPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...Typography.caption, fontSize: 10, fontWeight: '700' },

  // Disclaimer
  disclaimerBox: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.xs },
  disclaimerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  disclaimerTitle: { ...Typography.labelSmall, fontWeight: '800' },
  disclaimerText: { ...Typography.caption, lineHeight: 18 },

  // PHC Note
  phcNoteBox: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.xs },
  phcNoteHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  phcNoteTitle: { ...Typography.labelSmall, fontWeight: '700' },
  phcNoteText: { ...Typography.caption, lineHeight: 18 },
  phcTamilName: { ...Typography.caption, fontWeight: '700', fontStyle: 'italic', marginTop: 4 },

  // Tabs
  tabRow: { gap: Spacing.sm },
  tabPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  tabPillText: { ...Typography.labelSmall, fontWeight: '700' },

  // Vaccine Cards
  vaccineList: { gap: Spacing.lg },
  vaccineCard: { padding: Spacing.lg, gap: Spacing.md },
  vaccineHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  vaccineIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  vaccineName: { ...Typography.labelLarge, marginBottom: 4 },
  categoryTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  categoryTagText: { ...Typography.caption, fontWeight: '700', fontSize: 10 },
  completeBadge: {},
  vaccinePurpose: { ...Typography.bodySmall, lineHeight: 20 },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.sm },
  availabilityText: { ...Typography.caption, fontWeight: '600' },

  // Dose Checklist
  doseList: { gap: Spacing.sm },
  doseItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  doseLabel: { ...Typography.labelSmall, fontWeight: '600' },
  doseWeek: { ...Typography.caption, marginTop: 2 },
  doseCondition: { ...Typography.caption, fontWeight: '600', marginTop: 4 },
  currentWindowBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm, marginTop: 4, alignSelf: 'flex-start' },
  currentWindowText: { ...Typography.caption, fontSize: 10, fontWeight: '700' },

  // Detail Button
  detailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.xs },
  detailBtnText: { ...Typography.labelSmall, fontWeight: '700' },

  // Timeline
  timelineContainer: { gap: 0 },
  timelineRow: { flexDirection: 'row', minHeight: 120 },
  timelineLeft: { width: 32, alignItems: 'center' },
  timelineDot: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  timelineLine: { width: 2, flex: 1, marginTop: -2 },
  timelineCard: { flex: 1, marginLeft: Spacing.sm, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.xs },
  timelineCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekRangeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  weekRangeText: { ...Typography.caption, fontWeight: '700', fontSize: 10 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  timelineItemTitle: { ...Typography.labelSmall, fontWeight: '600' },
  timelineItemVaccine: { ...Typography.caption, fontSize: 10 },
  timelineItemDesc: { ...Typography.caption, lineHeight: 16 },
  timelineUrgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm, alignSelf: 'flex-start', marginTop: 4 },
  timelineUrgentText: { ...Typography.caption, fontSize: 10, fontWeight: '700' },

  // Avoid Tab
  avoidList: { gap: Spacing.md },
  avoidHeader: { padding: Spacing.lg, gap: Spacing.sm, borderWidth: 1 },
  avoidHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avoidHeaderTitle: { ...Typography.labelLarge, fontWeight: '700', flex: 1 },
  avoidHeaderDesc: { ...Typography.bodySmall, lineHeight: 20 },
  avoidCard: { padding: Spacing.md, gap: Spacing.sm },
  avoidCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avoidIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avoidName: { ...Typography.labelSmall, fontWeight: '700' },
  avoidTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: 2 },
  avoidTypeText: { ...Typography.caption, fontWeight: '700', fontSize: 10 },
  avoidReason: { ...Typography.bodySmall, lineHeight: 20 },

  // Sources
  sourcesBox: { borderTopWidth: 1, paddingTop: Spacing.md, gap: 4 },
  sourcesTitle: { ...Typography.labelSmall, fontWeight: '700' },
  sourceItem: { ...Typography.caption, lineHeight: 16 },
  lastUpdated: { ...Typography.caption, fontStyle: 'italic', marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', flex: 1 },
  modalContent: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  modalTitle: { ...Typography.h3 },
  modalFullName: { ...Typography.caption, marginTop: 2 },
  modalTagRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  sourceText: { ...Typography.caption, fontSize: 10 },

  // Modal Sections
  modalSection: { gap: Spacing.sm },
  modalSectionTitle: { ...Typography.labelLarge, fontWeight: '700' },
  modalSectionBody: { ...Typography.bodySmall, lineHeight: 22 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  listItemText: { ...Typography.bodySmall, flex: 1 },
  importantNoteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  importantNoteText: { ...Typography.caption, flex: 1, lineHeight: 18 },
  contraindicationBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  contraindicationText: { ...Typography.caption, flex: 1, lineHeight: 18, fontWeight: '600' },

  // Modal Dose
  modalDoseCard: { padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: 4 },
  modalDoseLabel: { ...Typography.labelSmall, fontWeight: '700' },
  modalDoseWeek: { ...Typography.caption, fontWeight: '700' },
  modalDoseDesc: { ...Typography.caption, lineHeight: 18 },
  modalDoseCondition: { ...Typography.caption, fontWeight: '600' },

  // Where to Get
  whereToGet: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  whereToGetText: { ...Typography.labelSmall, fontWeight: '600', flex: 1 },
});
