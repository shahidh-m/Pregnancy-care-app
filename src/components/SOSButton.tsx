// SOS Button — persistent floating emergency button
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Spacing, BorderRadius } from '../theme';
import { Typography } from '../theme/typography';

interface SOSButtonProps {
  contactCount: number;
  onTrigger: () => void;
  size?: 'small' | 'large';
}

export const SOSButton: React.FC<SOSButtonProps> = ({ contactCount, onTrigger, size = 'small' }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = contactCount === 0;

  // Pulse animation
  React.useEffect(() => {
    if (!isDisabled) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isDisabled]);

  const handlePress = () => {
    if (isDisabled) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onTrigger();
  };

  const buttonSize = size === 'large' ? 72 : 56;
  const iconSize = size === 'large' ? 32 : 24;

  return (
    <>
      <Animated.View style={[
        styles.container,
        { transform: [{ scale: pulseAnim }] },
      ]}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: isDisabled ? colors.textTertiary : colors.sosButton,
              shadowColor: isDisabled ? 'transparent' : colors.sosButton,
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
          disabled={isDisabled}
        >
          <Ionicons name="warning" size={iconSize} color={colors.white} />
          <Text style={[styles.label, { fontSize: size === 'large' ? 13 : 10 }]}>SOS</Text>
        </TouchableOpacity>
        {isDisabled && (
          <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.tooltipText, { color: colors.textSecondary }]}>
              {t('sos.noContacts')}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setShowConfirm(false)}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIcon, { backgroundColor: colors.sosButton + '15' }]}>
              <Ionicons name="warning" size={40} color={colors.sosButton} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('sos.confirm')}</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{t('sos.confirmMessage')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('sos.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.sosButton }]}
                onPress={handleConfirm}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>{t('sos.send')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 78,
    right: Spacing.lg,
    zIndex: 1000,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 1,
  },
  tooltip: {
    position: 'absolute',
    right: 64,
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    width: 150,
  },
  tooltipText: {
    ...Typography.caption,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  modal: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...Typography.button,
  },
});
