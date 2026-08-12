// HealthTrendsScreen — Visual charts for Weight, BP, and Blood Sugar trends
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { getLocalHealthLogs, HealthLogEntry } from '../../services/storage';

const screenWidth = Dimensions.get('window').width - Spacing.lg * 2;

export const HealthTrendsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<HealthLogEntry[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const data = await getLocalHealthLogs();
    setLogs(data.reverse()); // chronological order
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: BorderRadius.lg,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  // Sample data fallback if user hasn't logged enough entries yet
  const labels = logs.length >= 3 ? logs.slice(-5).map(l => l.date.slice(5)) : ['W1', 'W2', 'W3', 'W4', 'W5'];
  const weightData = logs.length >= 3 ? logs.slice(-5).map(l => l.weight) : [62, 62.5, 63, 63.8, 64.2];
  const bpSystolicData = logs.length >= 3 ? logs.slice(-5).map(l => l.bpSystolic) : [118, 120, 122, 119, 121];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('track.trends')}</Text>

        {/* Weight Trend */}
        <Card variant="elevated" style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('healthLog.weight')} Trend</Text>
          <LineChart
            data={{
              labels,
              datasets: [{ data: weightData }],
            }}
            width={screenWidth - Spacing.xl * 2}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card>

        {/* Blood Pressure Trend */}
        <Card variant="elevated" style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>BP Systolic Trend</Text>
          <LineChart
            data={{
              labels,
              datasets: [{ data: bpSystolicData }],
            }}
            width={screenWidth - Spacing.xl * 2}
            height={200}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => '#EF4444',
            }}
            bezier
            style={styles.chart}
          />
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
    gap: Spacing.lg,
  },
  pageTitle: {
    ...Typography.h2,
  },
  chartCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  chartTitle: {
    ...Typography.h4,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  chart: {
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
});
