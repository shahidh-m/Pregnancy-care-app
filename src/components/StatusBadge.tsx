// StatusBadge — visual signal for health status
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { BorderRadius, Spacing } from '../theme';
import { Typography } from '../theme/typography';

export type StatusLevel = 'healthy' | 'good' | 'concerned' | 'critical';

interface StatusBadgeProps {
  status: StatusLevel;
  size?: 'small' | 'medium' | 'large';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const statusColor = {
    healthy: colors.healthy,
    good: colors.good,
    concerned: colors.concerned,
    critical: colors.critical,
  }[status];

  const labelKey = {
    healthy: 'reportReader.healthy',
    good: 'reportReader.good',
    concerned: 'reportReader.concerned',
    critical: 'reportReader.critical',
  }[status];

  const sizeStyles = {
    small: { paddingH: Spacing.sm, paddingV: Spacing.xs, fontSize: Typography.labelSmall.fontSize },
    medium: { paddingH: Spacing.md, paddingV: Spacing.sm, fontSize: Typography.label.fontSize },
    large: { paddingH: Spacing.lg, paddingV: Spacing.md, fontSize: Typography.labelLarge.fontSize },
  }[size];

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: statusColor + '18',
        borderColor: statusColor + '40',
        paddingHorizontal: sizeStyles.paddingH,
        paddingVertical: sizeStyles.paddingV,
      },
    ]}>
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <Text style={[styles.label, { color: statusColor, fontSize: sizeStyles.fontSize }]}>
        {t(labelKey)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontWeight: '600',
  },
});
