// SymptomChips — multi-select symptom picker
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Spacing, BorderRadius } from '../theme';
import { Typography } from '../theme/typography';

const SYMPTOM_KEYS = [
  'nausea', 'headache', 'swelling', 'backPain', 'fatigue',
  'cramps', 'dizziness', 'heartburn', 'insomnia', 'none',
] as const;

interface SymptomChipsProps {
  selected: string[];
  onToggle: (symptom: string) => void;
}

export const SymptomChips: React.FC<SymptomChipsProps> = ({ selected, onToggle }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleToggle = (symptom: string) => {
    if (symptom === 'none') {
      // If "none" is selected, deselect everything else
      onToggle('none');
    } else {
      // If selecting a symptom, remove "none" if it was selected
      onToggle(symptom);
    }
  };

  return (
    <View style={styles.container}>
      {SYMPTOM_KEYS.map(key => {
        const isSelected = selected.includes(key);
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primaryLight : colors.inputBackground,
                borderColor: isSelected ? colors.primary : colors.inputBorder,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
            onPress={() => handleToggle(key)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.chipText,
              { color: isSelected ? colors.primary : colors.textSecondary },
            ]}>
              {t(`symptoms.${key}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    ...Typography.label,
  },
});
