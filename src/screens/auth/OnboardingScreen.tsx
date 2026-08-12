// OnboardingScreen — First login setup: Role ("Myself" vs "For Her"), Name, Due Date / Pair Code, Language
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth, UserRole, RelationshipType } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { formatDate } from '../../utils/pregnancy';

const RELATIONSHIPS: { key: RelationshipType; label: string; icon: string }[] = [
  { key: 'husband', label: 'Husband / Partner', icon: 'heart' },
  { key: 'mother', label: 'Mother', icon: 'woman' },
  { key: 'father', label: 'Father', icon: 'man' },
  { key: 'sister', label: 'Sister / Family', icon: 'people' },
  { key: 'doctor', label: 'Doctor / Nurse', icon: 'medical' },
  { key: 'friend', label: 'Friend / Neighbor', icon: 'person' },
];

export const OnboardingScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user, completeOnboarding, pairCompanion } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const [role, setRole] = useState<UserRole>('mother');
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('husband');
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [motherNameInput, setMotherNameInput] = useState('');
  
  // Default due date to roughly 6 months from now
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      setError(t('onboarding.namePlaceholder'));
      return;
    }

    if (role === 'mother') {
      completeOnboarding({
        name: name.trim(),
        role: 'mother',
        dueDate: dueDate.toISOString(),
        language,
      });
    } else {
      if (!pairingCodeInput.trim()) {
        setError('Please enter Mother\'s 6-digit connection code (e.g. PREG-123)');
        return;
      }
      const success = await pairCompanion(
        pairingCodeInput.trim(),
        relationship,
        motherNameInput.trim() || 'Expecting Mother'
      );
      if (success) {
        completeOnboarding({
          name: name.trim(),
          role: 'companion',
          relationship,
          connectedMotherId: pairingCodeInput.trim().toUpperCase(),
          connectedMotherName: motherNameInput.trim() || 'Expecting Mother',
          language,
        });
      } else {
        Alert.alert('Pairing Error', 'Unable to pair with code. Please double check the code.');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="sparkles" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('onboarding.subtitle')}</Text>
        </View>

        <Card variant="elevated" style={styles.card}>
          {/* Category / Role Selector */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Who is this app for?</Text>
            <View style={styles.roleToggleRow}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: role === 'mother' ? colors.primaryLight : colors.inputBackground,
                    borderColor: role === 'mother' ? colors.primary : colors.inputBorder,
                  },
                ]}
                onPress={() => setRole('mother')}
                activeOpacity={0.8}
              >
                <Ionicons name="female" size={24} color={role === 'mother' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.roleTitle, { color: role === 'mother' ? colors.primary : colors.text }]}>Myself</Text>
                <Text style={[styles.roleSub, { color: colors.textSecondary }]}>Expecting Mother</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: role === 'companion' ? colors.primaryLight : colors.inputBackground,
                    borderColor: role === 'companion' ? colors.primary : colors.inputBorder,
                  },
                ]}
                onPress={() => setRole('companion')}
                activeOpacity={0.8}
              >
                <Ionicons name="people" size={24} color={role === 'companion' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.roleTitle, { color: role === 'companion' ? colors.primary : colors.text }]}>For Her</Text>
                <Text style={[styles.roleSub, { color: colors.textSecondary }]}>Husband / Family</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Your Full Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: error ? colors.error : colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder={role === 'mother' ? "e.g. Anitha Kumar" : "e.g. Ramesh Kumar"}
              placeholderTextColor={colors.placeholder}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
            />
            {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
          </View>

          {/* Mother-Specific Fields */}
          {role === 'mother' ? (
            <>
              {/* Due Date Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('onboarding.dueDateLabel')}</Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(dueDate.toISOString())}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    maximumDate={new Date(Date.now() + 280 * 24 * 60 * 60 * 1000)}
                    onChange={handleDateChange}
                  />
                )}
              </View>

              {/* Display Pairing Code for Mother */}
              <View style={[styles.codeBanner, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="link" size={20} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.codeBannerTitle, { color: colors.primary }]}>Your Companion Link Code</Text>
                  <Text style={[styles.codeBannerCode, { color: colors.primary }]}>{user?.pairingCode || 'PREG-583192'}</Text>
                  <Text style={[styles.codeBannerSub, { color: colors.textSecondary }]}>
                    Family members can enter this code in "For Her" mode to receive direct SOS alerts!
                  </Text>
                </View>
              </View>
            </>
          ) : (
            /* Companion-Specific Fields */
            <>
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Your Relationship to Her</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relScroll}>
                  {RELATIONSHIPS.map((rel) => (
                    <TouchableOpacity
                      key={rel.key}
                      style={[
                        styles.relChip,
                        {
                          backgroundColor: relationship === rel.key ? colors.primary : colors.inputBackground,
                          borderColor: relationship === rel.key ? colors.primary : colors.inputBorder,
                        },
                      ]}
                      onPress={() => setRelationship(rel.key)}
                    >
                      <Ionicons name={rel.icon as any} size={16} color={relationship === rel.key ? colors.white : colors.textSecondary} />
                      <Text style={[styles.relText, { color: relationship === rel.key ? colors.white : colors.text }]}>
                        {rel.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Mother's Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="e.g. Anitha (Wife / Daughter)"
                  placeholderTextColor={colors.placeholder}
                  value={motherNameInput}
                  onChangeText={setMotherNameInput}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Mother's Connection Code</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text, fontWeight: '700', letterSpacing: 2 }]}
                  placeholder="e.g. PREG-583192"
                  placeholderTextColor={colors.placeholder}
                  value={pairingCodeInput}
                  onChangeText={setPairingCodeInput}
                  autoCapitalize="characters"
                />
                <Text style={[styles.hintText, { color: colors.textTertiary }]}>
                  Ask her to open her app and check her "Companion Link Code".
                </Text>
              </View>
            </>
          )}

          {/* Language Preference */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('onboarding.languageLabel')}</Text>
            <View style={styles.langToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.langOption,
                  {
                    backgroundColor: language === 'en' ? colors.primary : colors.inputBackground,
                    borderColor: language === 'en' ? colors.primary : colors.inputBorder,
                  },
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langText, { color: language === 'en' ? colors.white : colors.text }]}>
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.langOption,
                  {
                    backgroundColor: language === 'ta' ? colors.primary : colors.inputBackground,
                    borderColor: language === 'ta' ? colors.primary : colors.inputBorder,
                  },
                ]}
                onPress={() => setLanguage('ta')}
              >
                <Text style={[styles.langText, { color: language === 'ta' ? colors.white : colors.text }]}>
                  தமிழ் (Tamil)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueBtnText, { color: colors.white }]}>{t('onboarding.continue')}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
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
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  card: {
    padding: Spacing.xl,
  },
  fieldGroup: {
    marginBottom: Spacing.xl,
  },
  roleToggleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  roleCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  roleTitle: {
    ...Typography.labelLarge,
    marginTop: Spacing.xs,
  },
  roleSub: {
    ...Typography.caption,
    fontSize: 11,
  },
  label: {
    ...Typography.labelLarge,
    marginBottom: Spacing.sm,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  dateButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  dateText: {
    fontSize: 16,
  },
  codeBanner: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  codeBannerTitle: {
    ...Typography.caption,
    fontWeight: '700',
  },
  codeBannerCode: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    marginVertical: 2,
  },
  codeBannerSub: {
    ...Typography.caption,
    fontSize: 11,
  },
  relScroll: {
    gap: Spacing.sm,
  },
  relChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  relText: {
    ...Typography.buttonSmall,
  },
  hintText: {
    ...Typography.caption,
    marginTop: 4,
  },
  errorText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  langToggleContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  langOption: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langText: {
    ...Typography.button,
  },
  continueButton: {
    height: 54,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  continueBtnText: {
    ...Typography.buttonLarge,
  },
});

