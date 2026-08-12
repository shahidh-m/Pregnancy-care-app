// SettingsScreen — Theme, Language, Emergency Hardware Trigger, and Account Settings
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';

export const SettingsScreen: React.FC = () => {
  const { mode, setMode, colors } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  const [volumeTriggerEnabled, setVolumeTriggerEnabled] = useState(false);

  const handleVolumeToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        t('settings.emergencyTrigger'),
        t('settings.requiresDevBuild'),
        [{ text: t('common.ok') }]
      );
    }
    setVolumeTriggerEnabled(value);
  };

  const handleSignOut = () => {
    Alert.alert(
      t('settings.signOut'),
      t('settings.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.signOut'), style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>

        {/* Theme Settings */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.theme')}</Text>
          <View style={styles.optionRow}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor: mode === m ? colors.primary : colors.inputBackground,
                    borderColor: mode === m ? colors.primary : colors.inputBorder,
                  },
                ]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.themeChipText, { color: mode === m ? colors.white : colors.text }]}>
                  {t(`settings.theme${m.charAt(0).toUpperCase() + m.slice(1)}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Language Settings */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.language')}</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.themeChip,
                {
                  backgroundColor: language === 'en' ? colors.primary : colors.inputBackground,
                  borderColor: language === 'en' ? colors.primary : colors.inputBorder,
                },
              ]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.themeChipText, { color: language === 'en' ? colors.white : colors.text }]}>
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeChip,
                {
                  backgroundColor: language === 'ta' ? colors.primary : colors.inputBackground,
                  borderColor: language === 'ta' ? colors.primary : colors.inputBorder,
                },
              ]}
              onPress={() => setLanguage('ta')}
            >
              <Text style={[styles.themeChipText, { color: language === 'ta' ? colors.white : colors.text }]}>
                தமிழ் (Tamil)
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Physical SOS Trigger Settings */}
        <Card variant="default" style={styles.sectionCard}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>
                {t('settings.emergencyTrigger')}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                {t('settings.volumeButtonDesc')}
              </Text>
            </View>
            <Switch
              value={volumeTriggerEnabled}
              onValueChange={handleVolumeToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </Card>

        {/* Account & Sign Out */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.account')}</Text>
          <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>{user?.email || 'Demo Mode User'}</Text>
          <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: colors.error + '15' }]} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={[styles.signOutText, { color: colors.error }]}>{t('settings.signOut')}</Text>
          </TouchableOpacity>
        </Card>

        <Text style={[styles.versionText, { color: colors.textTertiary }]}>Version 1.0.0 (Expo Managed)</Text>
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
  sectionCard: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  settingDesc: {
    ...Typography.caption,
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeChip: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeChipText: {
    ...Typography.labelSmall,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountEmail: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  signOutBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: {
    ...Typography.button,
  },
  versionText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
