// SchemeProfileModal — Profile setup drawer for configuring eligibility rules & local VHN details
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { UserSchemeProfile } from '../types/scheme';
import { Card } from './Card';
import { Typography, Spacing, BorderRadius } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  userProfile: UserSchemeProfile;
  onSaveProfile: (updatedProfile: UserSchemeProfile) => void;
}

export const SchemeProfileModal: React.FC<Props> = ({
  visible,
  onClose,
  userProfile,
  onSaveProfile,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [pregnancyOrder, setPregnancyOrder] = useState<number>(userProfile.pregnancyOrder || 1);
  const [isSecondChildGirl, setIsSecondChildGirl] = useState<boolean>(!!userProfile.isSecondChildGirl);
  const [category, setCategory] = useState<'general' | 'bpl_nfsa'>(
    userProfile.category === 'general' ? 'general' : 'bpl_nfsa'
  );
  const [isGovtEmployee, setIsGovtEmployee] = useState<boolean>(!!userProfile.isGovtEmployee);
  const [deliveryHospitalType, setDeliveryHospitalType] = useState<'govt' | 'private'>(
    userProfile.deliveryHospitalType === 'private' ? 'private' : 'govt'
  );
  const [picmeRchId, setPicmeRchId] = useState<string>(userProfile.picmeRchId || '');
  const [vhnName, setVhnName] = useState<string>(userProfile.vhnName || '');
  const [vhnPhone, setVhnPhone] = useState<string>(userProfile.vhnPhone || '');
  const [phcCenter, setPhcCenter] = useState<string>(userProfile.phcCenter || '');

  useEffect(() => {
    setPregnancyOrder(userProfile.pregnancyOrder || 1);
    setIsSecondChildGirl(!!userProfile.isSecondChildGirl);
    setCategory(userProfile.category === 'general' ? 'general' : 'bpl_nfsa');
    setIsGovtEmployee(!!userProfile.isGovtEmployee);
    setDeliveryHospitalType(userProfile.deliveryHospitalType === 'private' ? 'private' : 'govt');
    setPicmeRchId(userProfile.picmeRchId || '');
    setVhnName(userProfile.vhnName || '');
    setVhnPhone(userProfile.vhnPhone || '');
    setPhcCenter(userProfile.phcCenter || '');
  }, [userProfile, visible]);

  const handleSave = () => {
    onSaveProfile({
      ...userProfile,
      pregnancyOrder,
      isSecondChildGirl,
      category,
      isGovtEmployee,
      deliveryHospitalType,
      picmeRchId,
      vhnName,
      vhnPhone,
      phcCenter,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('scheme.editProfile')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            {/* Pregnancy Order Selection */}
            <Card variant="outlined" style={styles.cardSection}>
              <Text style={[styles.label, { color: colors.text }]}>{t('scheme.pregnancyOrder')}</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  onPress={() => setPregnancyOrder(1)}
                  style={[
                    styles.optionBtn,
                    { borderColor: pregnancyOrder === 1 ? colors.primary : colors.border },
                    pregnancyOrder === 1 && { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.optionText, { color: pregnancyOrder === 1 ? colors.primary : colors.text }]}>
                    {t('scheme.firstPregnancy')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPregnancyOrder(2)}
                  style={[
                    styles.optionBtn,
                    { borderColor: pregnancyOrder === 2 ? colors.primary : colors.border },
                    pregnancyOrder === 2 && { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.optionText, { color: pregnancyOrder === 2 ? colors.primary : colors.text }]}>
                    {t('scheme.secondPregnancy')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPregnancyOrder(3)}
                  style={[
                    styles.optionBtn,
                    { borderColor: pregnancyOrder === 3 ? colors.primary : colors.border },
                    pregnancyOrder === 3 && { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.optionText, { color: pregnancyOrder === 3 ? colors.primary : colors.text }]}>
                    {t('scheme.thirdPregnancy')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* If 2nd Pregnancy: Girl Child Toggle */}
            {pregnancyOrder === 2 && (
              <Card variant="outlined" style={styles.cardSection}>
                <Text style={[styles.label, { color: colors.text }]}>{t('scheme.secondChildGender')}</Text>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    onPress={() => setIsSecondChildGirl(true)}
                    style={[
                      styles.optionBtn,
                      { borderColor: isSecondChildGirl ? colors.primary : colors.border },
                      isSecondChildGirl && { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: isSecondChildGirl ? colors.primary : colors.text }]}>
                      {t('scheme.girlChild')} (₹6k PMMVY Bonus)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsSecondChildGirl(false)}
                    style={[
                      styles.optionBtn,
                      { borderColor: !isSecondChildGirl ? colors.primary : colors.border },
                      !isSecondChildGirl && { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: !isSecondChildGirl ? colors.primary : colors.text }]}>
                      {t('scheme.boyChild')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {/* Socio-Economic Category */}
            <Card variant="outlined" style={styles.cardSection}>
              <Text style={[styles.label, { color: colors.text }]}>{t('scheme.category')}</Text>
              <View style={styles.columnOptions}>
                <TouchableOpacity
                  onPress={() => setCategory('bpl_nfsa')}
                  style={[
                    styles.fullOptionBtn,
                    { borderColor: category === 'bpl_nfsa' ? colors.primary : colors.border },
                    category === 'bpl_nfsa' && { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Ionicons name="card-outline" size={20} color={category === 'bpl_nfsa' ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.optionText, { color: category === 'bpl_nfsa' ? colors.primary : colors.text }]}>
                    {t('scheme.bplNfsa')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCategory('general')}
                  style={[
                    styles.fullOptionBtn,
                    { borderColor: category === 'general' ? colors.primary : colors.border },
                    category === 'general' && { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Ionicons name="person-outline" size={20} color={category === 'general' ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.optionText, { color: category === 'general' ? colors.primary : colors.text }]}>
                    {t('scheme.general')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Govt Employee Switch */}
            <Card variant="outlined" style={styles.cardSection}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>{t('scheme.govtEmployee')}</Text>
                  <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                    Excludes from PMMVY cash transfer
                  </Text>
                </View>
                <Switch
                  value={isGovtEmployee}
                  onValueChange={setIsGovtEmployee}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={isGovtEmployee ? colors.primary : '#FFF'}
                />
              </View>
            </Card>

            {/* Delivery Facility Preference */}
            <Card variant="outlined" style={styles.cardSection}>
              <Text style={[styles.label, { color: colors.text }]}>{t('scheme.deliveryPreference')}</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  onPress={() => setDeliveryHospitalType('govt')}
                  style={[
                    styles.optionBtn,
                    { borderColor: deliveryHospitalType === 'govt' ? colors.primary : colors.border },
                    deliveryHospitalType === 'govt' && { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.optionText, { color: deliveryHospitalType === 'govt' ? colors.primary : colors.text }]}>
                    {t('scheme.govtHospital')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDeliveryHospitalType('private')}
                  style={[
                    styles.optionBtn,
                    { borderColor: deliveryHospitalType === 'private' ? colors.primary : colors.border },
                    deliveryHospitalType === 'private' && { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.optionText, { color: deliveryHospitalType === 'private' ? colors.primary : colors.text }]}>
                    {t('scheme.privateHospital')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* PICME RCH ID & VHN Details Inputs */}
            <Card variant="outlined" style={styles.cardSection}>
              <Text style={[styles.label, { color: colors.text }]}>{t('scheme.vhnContact')}</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('scheme.rchIdLabel')}</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                  placeholder="e.g. 1298-4567-8901"
                  placeholderTextColor={colors.textTertiary}
                  value={picmeRchId}
                  onChangeText={setPicmeRchId}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('scheme.vhnName')}</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                  placeholder="e.g. Sister Selvi"
                  placeholderTextColor={colors.textTertiary}
                  value={vhnName}
                  onChangeText={setVhnName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('scheme.vhnPhone')}</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                  placeholder="e.g. 9840123456"
                  placeholderTextColor={colors.textTertiary}
                  value={vhnPhone}
                  onChangeText={setVhnPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('scheme.phcCenter')}</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                  placeholder="e.g. PHC Sholinganallur"
                  placeholderTextColor={colors.textTertiary}
                  value={phcCenter}
                  onChangeText={setPhcCenter}
                />
              </View>
            </Card>

            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark-sharp" size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>{t('scheme.saveProfile')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.h3,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  scrollBody: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  cardSection: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  label: {
    ...Typography.labelLarge,
  },
  subLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionBtn: {
    flex: 1,
    minWidth: 100,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    ...Typography.labelSmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  columnOptions: {
    gap: Spacing.sm,
  },
  fullOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    ...Typography.bodySmall,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  saveBtnText: {
    color: '#FFF',
    ...Typography.labelLarge,
  },
});
