// EmojiPicker — simple mood selector for health log
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Spacing, BorderRadius } from '../theme';
import { Typography } from '../theme/typography';

const MOODS = [
  { key: 'great', emoji: '😊' },
  { key: 'good', emoji: '🙂' },
  { key: 'okay', emoji: '😐' },
  { key: 'tired', emoji: '😴' },
  { key: 'unwell', emoji: '🤢' },
] as const;

interface EmojiPickerProps {
  selected: string | null;
  onSelect: (mood: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ selected, onSelect }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {MOODS.map(mood => {
        const isSelected = selected === mood.key;
        return (
          <TouchableOpacity
            key={mood.key}
            style={[
              styles.moodButton,
              {
                backgroundColor: isSelected ? colors.primaryLight : colors.inputBackground,
                borderColor: isSelected ? colors.primary : colors.inputBorder,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
            onPress={() => onSelect(mood.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={[styles.label, { color: isSelected ? colors.primary : colors.textSecondary }]}>
              {t(`moods.${mood.key}`)}
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
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  emoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.labelSmall,
    textAlign: 'center',
  },
});
