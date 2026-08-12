// TrackScreen — Hub for Health Log, Diet Log, Trends, and Reminders
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';

export const TrackScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('track.title')}</Text>

        <TouchableOpacity onPress={() => navigation.navigate('HealthLog')} activeOpacity={0.8}>
          <Card variant="elevated" style={styles.trackCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="fitness" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('track.healthLog')}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Record daily weight, BP, blood sugar, mood & symptoms</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('DietLog')} activeOpacity={0.8}>
          <Card variant="elevated" style={styles.trackCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="nutrition" size={28} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('track.dietLog')}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Track calories, protein & iron with barcode search & Tamil food table</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('HealthTrends')} activeOpacity={0.8}>
          <Card variant="elevated" style={styles.trackCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="stats-chart" size={28} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('track.trends')}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>View progress line charts for weight and blood pressure over time</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Reminders')} activeOpacity={0.8}>
          <Card variant="elevated" style={styles.trackCard}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="alarm" size={28} color="#DB2777" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('track.reminders')}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Schedule local notifications for medicine, water & appointments</Text>
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
  trackCard: {
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
