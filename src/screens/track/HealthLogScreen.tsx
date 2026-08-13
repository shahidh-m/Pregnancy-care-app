// HealthLogScreen — Daily Vitals Form (Weight, BP, Sugar, Mood, Symptoms)
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { EmojiPicker } from '../../components/EmojiPicker';
import { SymptomChips } from '../../components/SymptomChips';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { saveLocalHealthLog } from '../../services/storage';
import { syncHealthLogsToFirestore } from '../../services/firestoreSync';
import { getTodayISO } from '../../utils/pregnancy';

export const HealthLogScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [weight, setWeight] = useState('65.0');
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [bloodSugar, setBloodSugar] = useState('');
  const [mood, setMood] = useState('good');
  const [symptoms, setSymptoms] = useState<string[]>(['none']);
  const [saving, setSaving] = useState(false);

  const toggleSymptom = (symptom: string) => {
    if (symptom === 'none') {
      setSymptoms(['none']);
    } else {
      const filtered = symptoms.filter(s => s !== 'none');
      if (filtered.includes(symptom)) {
        const next = filtered.filter(s => s !== symptom);
        setSymptoms(next.length === 0 ? ['none'] : next);
      } else {
        setSymptoms([...filtered, symptom]);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const logEntry = {
        date: getTodayISO(),
        weight: parseFloat(weight) || 60,
        bpSystolic: parseInt(bpSystolic, 10) || 120,
        bpDiastolic: parseInt(bpDiastolic, 10) || 80,
        bloodSugar: bloodSugar ? parseInt(bloodSugar, 10) : undefined,
        mood,
        symptoms,
      };

      await saveLocalHealthLog(logEntry, user?.uid);

      // Trigger background sync if user logged in
      if (user?.uid) {
        syncHealthLogsToFirestore(user.uid);
      }

      Alert.alert(t('healthLog.saved'), '', [
        { text: t('common.ok'), onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert(t('healthLog.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('healthLog.title')}</Text>

        {/* Vitals Form Card */}
        <Card variant="elevated" style={styles.formCard}>
          {/* Weight */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('healthLog.weight')}</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                onPress={() => setWeight(w => (Math.max(30, parseFloat(w) - 0.5)).toFixed(1))}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <TextInput
                style={[styles.numInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                onPress={() => setWeight(w => (parseFloat(w) + 0.5).toFixed(1))}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Blood Pressure */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Blood Pressure (Systolic / Diastolic)</Text>
            <View style={styles.bpRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t('healthLog.bpSystolic')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={bpSystolic}
                  onChangeText={setBpSystolic}
                  keyboardType="number-pad"
                  placeholder="120"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
              <Text style={[styles.bpSlash, { color: colors.textTertiary }]}>/</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t('healthLog.bpDiastolic')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={bpDiastolic}
                  onChangeText={setBpDiastolic}
                  keyboardType="number-pad"
                  placeholder="80"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>
          </View>

          {/* Blood Sugar (Optional) */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('healthLog.bloodSugar')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              value={bloodSugar}
              onChangeText={setBloodSugar}
              keyboardType="number-pad"
              placeholder="e.g. 95 (Fasting/PP)"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          {/* Mood */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('healthLog.mood')}</Text>
            <EmojiPicker selected={mood} onSelect={setMood} />
          </View>

          {/* Symptoms */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('healthLog.symptoms')}</Text>
            <SymptomChips selected={symptoms} onToggle={toggleSymptom} />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, { color: colors.white }]}>{t('healthLog.save')}</Text>
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
    padding: Spacing.lg,
  },
  pageTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  formCard: {
    padding: Spacing.xl,
  },
  fieldGroup: {
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    ...Typography.labelLarge,
    marginBottom: Spacing.sm,
  },
  subLabel: {
    ...Typography.caption,
    marginBottom: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bpSlash: {
    fontSize: 24,
    fontWeight: '300',
    marginTop: 18,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  saveButton: {
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveBtnText: {
    ...Typography.button,
  },
});
