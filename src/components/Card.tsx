// Card — reusable themed card component
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, Spacing } from '../theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof Spacing;
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default', padding = 'lg' }) => {
  const { colors } = useTheme();

  const variantStyle: ViewStyle = {};
  if (variant === 'default' || variant === 'elevated') {
    Object.assign(variantStyle, {
      backgroundColor: colors.card,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: variant === 'elevated' ? 4 : 2 },
      shadowOpacity: variant === 'elevated' ? 0.15 : 0.08,
      shadowRadius: variant === 'elevated' ? 12 : 6,
      elevation: variant === 'elevated' ? 6 : 3,
    });
  } else if (variant === 'outlined') {
    Object.assign(variantStyle, {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    });
  }

  return <View style={[styles.base, { padding: Spacing[padding] }, variantStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
