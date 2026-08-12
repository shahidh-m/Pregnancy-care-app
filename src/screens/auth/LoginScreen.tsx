// LoginScreen — Google Sign-In with Demo Mode fallback
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';

export const LoginScreen: React.FC = () => {
  const { colors } = useTheme();
  const { signInDemo, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.log('LoginScreen error:', error);
      if (error?.code === 'auth/popup-blocked') {
        setErrorMessage('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
      } else if (error?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please try again.');
      } else if (error?.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not authorized in Firebase Console (add localhost in Firebase Auth settings).');
      } else {
        setErrorMessage(error?.message || t('auth.signInFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    signInDemo();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Hero Illustration / Icon */}
        <View style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="heart" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.welcome')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('auth.subtitle')}</Text>
        </View>

        {/* Action Card */}
        <Card variant="elevated" style={styles.card}>
          {errorMessage && (
            <View style={[styles.errorBanner, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={22} color="#4285F4" style={styles.btnIcon} />
                <Text style={[styles.googleBtnText, { color: colors.text }]}>{t('auth.signInGoogle')}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.demoButton, { backgroundColor: colors.primaryLight }]}
            onPress={handleDemoSignIn}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle-outline" size={22} color={colors.primary} style={styles.btnIcon} />
            <Text style={[styles.demoBtnText, { color: colors.primary }]}>{t('auth.demoMode')}</Text>
          </TouchableOpacity>

          <Text style={[styles.demoNotice, { color: colors.textTertiary }]}>
            {t('auth.demoNotice')}
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xxl,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  card: {
    padding: Spacing.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    height: 52,
  },
  btnIcon: {
    marginRight: Spacing.md,
  },
  googleBtnText: {
    ...Typography.button,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.caption,
    marginHorizontal: Spacing.md,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    height: 52,
  },
  demoBtnText: {
    ...Typography.button,
  },
  demoNotice: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
