// DoctorCheckupScreen — Primary Delivery Doctors (Max 2) + Occasional Specialist Visit Logger
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, SafeAreaView, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';
import {
  DoctorCheckupItem,
  PrimaryDoctorProfile,
  DoctorType,
  SpecialistType,
  getLocalCheckups,
  saveDoctorCheckup,
  deleteDoctorCheckup,
  getPrimaryDoctors,
  savePrimaryDoctor,
  deletePrimaryDoctor,
} from '../../services/checkupStorage';
import { formatDate } from '../../utils/pregnancy';

const SPECIALIST_CATEGORIES: SpecialistType[] = [
  'Obstetrician & Gynecologist',
  'Fetal Scan Specialist',
  'Endocrinologist (Sugar)',
  'Dietitian / Nutritionist',
  'Other Specialist',
];

export const DoctorCheckupScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [checkups, setCheckups] = useState<DoctorCheckupItem[]>([]);
  const [primaryDoctors, setPrimaryDoctors] = useState<PrimaryDoctorProfile[]>([]);
  
  // Modals
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [primaryModalVisible, setPrimaryModalVisible] = useState(false);

  // Checkup Form State
  const [doctorType, setDoctorType] = useState<DoctorType>('primary');
  const [specialistCategory, setSpecialistCategory] = useState<SpecialistType>('Obstetrician & Gynecologist');
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [babyHeartbeatBpm, setBabyHeartbeatBpm] = useState('');
  const [ultrasoundNotes, setUltrasoundNotes] = useState('');
  const [doctorAdvice, setDoctorAdvice] = useState('');
  const [prescriptionInput, setPrescriptionInput] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');

  // Primary Doctor Add Form
  const [pName, setPName] = useState('');
  const [pSpecialty, setPSpecialty] = useState('Senior Obstetrician & Gynecologist');
  const [pHospital, setPHospital] = useState('');
  const [pPhone, setPPhone] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const checkupList = await getLocalCheckups();
    const pDocs = await getPrimaryDoctors();
    setCheckups(checkupList);
    setPrimaryDoctors(pDocs);
  };

  const openLogModal = () => {
    // If primary doctors exist, prefill first primary doctor
    if (primaryDoctors.length > 0) {
      setDoctorName(primaryDoctors[0].name);
      setHospitalName(primaryDoctors[0].hospitalName);
    }
    setLogModalVisible(true);
  };

  const handleSaveCheckup = async () => {
    if (!doctorName.trim() || !hospitalName.trim()) {
      Alert.alert('Required Fields', 'Please enter Doctor Name and Hospital Name.');
      return;
    }

    await saveDoctorCheckup({
      doctorName: doctorName.trim(),
      hospitalName: hospitalName.trim(),
      doctorType,
      specialistCategory: doctorType === 'occasional' ? specialistCategory : 'Obstetrician & Gynecologist',
      visitDate: visitDate || new Date().toISOString(),
      trimester: 2,
      bpSystolic: bpSystolic ? parseInt(bpSystolic, 10) : undefined,
      bpDiastolic: bpDiastolic ? parseInt(bpDiastolic, 10) : undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      babyHeartbeatBpm: babyHeartbeatBpm ? parseInt(babyHeartbeatBpm, 10) : undefined,
      ultrasoundNotes: ultrasoundNotes.trim() || undefined,
      doctorAdvice: doctorAdvice.trim() || undefined,
      prescriptions: prescriptionInput ? prescriptionInput.split(',').map(s => s.trim()) : undefined,
      nextVisitDate: nextVisitDate ? new Date(nextVisitDate).toISOString() : undefined,
    });

    setLogModalVisible(false);
    resetCheckupForm();
    loadData();
  };

  const resetCheckupForm = () => {
    setDoctorType('primary');
    setSpecialistCategory('Obstetrician & Gynecologist');
    setDoctorName('');
    setHospitalName('');
    setBpSystolic('');
    setBpDiastolic('');
    setWeightKg('');
    setBabyHeartbeatBpm('');
    setUltrasoundNotes('');
    setDoctorAdvice('');
    setPrescriptionInput('');
    setNextVisitDate('');
  };

  const handleSavePrimaryDoctor = async () => {
    if (!pName.trim() || !pHospital.trim()) {
      Alert.alert('Required Fields', 'Please enter Doctor Name and Hospital.');
      return;
    }

    const res = await savePrimaryDoctor({
      name: pName.trim(),
      specialty: pSpecialty.trim(),
      hospitalName: pHospital.trim(),
      phone: pPhone.trim() || '108',
      isMainDeliveryDoctor: true,
    });

    if (!res.success) {
      Alert.alert('Doctor Limit Reached', res.error);
      return;
    }

    setPrimaryModalVisible(false);
    setPName('');
    setPHospital('');
    setPPhone('');
    loadData();
  };

  const handleDeletePrimary = (id: string) => {
    Alert.alert('Delete Primary Doctor', 'Remove this doctor from primary list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePrimaryDoctor(id);
          loadData();
        },
      },
    ]);
  };

  const handleDeleteCheckup = (id: string) => {
    Alert.alert('Delete Record', 'Are you sure you want to remove this visit record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDoctorCheckup(id);
          loadData();
        },
      },
    ]);
  };

  const handleCallDoctor = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const upcomingCheckup = checkups.find(c => c.nextVisitDate && new Date(c.nextVisitDate).getTime() > Date.now());

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Doctor Checkup Tracker</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Primary delivery doctor & occasional visits</Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={openLogModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Primary Delivery Doctor Header Card (Max 2) */}
        <View style={styles.primaryDocHeader}>
          <View style={styles.primaryDocTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Primary Regular Doctor ({primaryDoctors.length}/2)</Text>
            {primaryDoctors.length < 2 && (
              <TouchableOpacity onPress={() => setPrimaryModalVisible(true)} style={styles.addPrimaryBtn}>
                <Ionicons name="person-add" size={16} color={colors.primary} />
                <Text style={[styles.addPrimaryText, { color: colors.primary }]}>+ Add Regular Doctor</Text>
              </TouchableOpacity>
            )}
          </View>

          {primaryDoctors.length === 0 ? (
            <Card variant="outlined" style={styles.noPrimaryCard}>
              <Text style={[styles.noPrimaryText, { color: colors.textSecondary }]}>
                No primary regular doctor added yet. Tap above to pin your main delivery doctor!
              </Text>
            </Card>
          ) : (
            primaryDoctors.map((pdoc) => (
              <Card key={pdoc.id} variant="elevated" style={styles.primaryDocCard}>
                <View style={styles.pdocRow}>
                  <View style={[styles.pdocIconCircle, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="medical" size={26} color={colors.success} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.mainBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.mainBadgeText, { color: colors.success }]}>PRIMARY DELIVERY DOCTOR</Text>
                      </View>
                    </View>
                    <Text style={[styles.pdocName, { color: colors.text }]}>{pdoc.name}</Text>
                    <Text style={[styles.pdocSpecialty, { color: colors.textSecondary }]}>{pdoc.specialty}</Text>
                    <Text style={[styles.pdocHosp, { color: colors.textSecondary }]}>📍 {pdoc.hospitalName}</Text>
                  </View>

                  <View style={styles.pdocActions}>
                    <TouchableOpacity
                      style={[styles.callBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleCallDoctor(pdoc.phone)}
                    >
                      <Ionicons name="call" size={16} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePrimary(pdoc.id)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Upcoming Checkup Reminder */}
        {upcomingCheckup ? (
          <Card variant="elevated" style={[styles.upcomingCard, { backgroundColor: colors.primaryLight }]}>
            <View style={styles.upcomingRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                <Ionicons name="calendar" size={22} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.upcomingLabel, { color: colors.primary }]}>NEXT UPCOMING CHECKUP</Text>
                <Text style={[styles.upcomingDoctor, { color: colors.text }]}>{upcomingCheckup.doctorName}</Text>
                <Text style={[styles.upcomingDate, { color: colors.textSecondary }]}>
                  {formatDate(upcomingCheckup.nextVisitDate!)} • {upcomingCheckup.hospitalName}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* Visit History Section */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.md }]}>
          Checkup History ({checkups.length})
        </Text>

        {checkups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color={colors.placeholder} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No checkup records saved yet.</Text>
            <TouchableOpacity style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]} onPress={openLogModal}>
              <Text style={{ color: colors.white, fontWeight: '700' }}>Log First Checkup</Text>
            </TouchableOpacity>
          </View>
        ) : (
          checkups.map((item) => (
            <Card key={item.id} variant="default" style={styles.checkupCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.doctorInfo}>
                  <View style={styles.typeBadgeRow}>
                    <View
                      style={[
                        styles.docTypeBadge,
                        { backgroundColor: item.doctorType === 'primary' ? colors.success + '15' : '#8B5CF615' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.docTypeBadgeText,
                          { color: item.doctorType === 'primary' ? colors.success : '#8B5CF6' },
                        ]}
                      >
                        {item.doctorType === 'primary' ? 'REGULAR PRIMARY DOCTOR' : item.specialistCategory || 'OCCASIONAL VISIT'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.docName, { color: colors.text }]}>{item.doctorName}</Text>
                  <Text style={[styles.hospName, { color: colors.textSecondary }]}>{item.hospitalName}</Text>
                </View>

                <View style={styles.dateBadge}>
                  <Text style={[styles.dateText, { color: colors.primary }]}>{formatDate(item.visitDate)}</Text>
                  <TouchableOpacity onPress={() => handleDeleteCheckup(item.id)} style={{ marginLeft: 8 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Vitals Grid */}
              <View style={[styles.vitalsGrid, { backgroundColor: colors.inputBackground }]}>
                {item.bpSystolic ? (
                  <View style={styles.vitalBox}>
                    <Text style={[styles.vitalVal, { color: colors.text }]}>{item.bpSystolic}/{item.bpDiastolic}</Text>
                    <Text style={[styles.vitalSub, { color: colors.textSecondary }]}>BP (mmHg)</Text>
                  </View>
                ) : null}

                {item.weightKg ? (
                  <View style={styles.vitalBox}>
                    <Text style={[styles.vitalVal, { color: colors.text }]}>{item.weightKg} kg</Text>
                    <Text style={[styles.vitalSub, { color: colors.textSecondary }]}>Weight</Text>
                  </View>
                ) : null}

                {item.babyHeartbeatBpm ? (
                  <View style={styles.vitalBox}>
                    <Text style={[styles.vitalVal, { color: '#EC4899' }]}>{item.babyHeartbeatBpm} bpm</Text>
                    <Text style={[styles.vitalSub, { color: colors.textSecondary }]}>Heartbeat</Text>
                  </View>
                ) : null}
              </View>

              {/* Scan Notes */}
              {item.ultrasoundNotes ? (
                <View style={styles.notesBox}>
                  <Ionicons name="images-outline" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notesTitle, { color: colors.primary }]}>Ultrasound / Scan Observations</Text>
                    <Text style={[styles.notesContent, { color: colors.text }]}>{item.ultrasoundNotes}</Text>
                  </View>
                </View>
              ) : null}

              {/* Doctor Advice */}
              {item.doctorAdvice ? (
                <View style={styles.notesBox}>
                  <Ionicons name="medical-outline" size={18} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notesTitle, { color: '#059669' }]}>Doctor Advice & Treatment</Text>
                    <Text style={[styles.notesContent, { color: colors.text }]}>{item.doctorAdvice}</Text>
                  </View>
                </View>
              ) : null}

              {/* Prescriptions */}
              {item.prescriptions && item.prescriptions.length > 0 ? (
                <View style={styles.rxContainer}>
                  <Text style={[styles.rxTitle, { color: colors.textSecondary }]}>PRESCRIBED MEDICINES</Text>
                  <View style={styles.rxChipRow}>
                    {item.prescriptions.map((med, idx) => (
                      <View key={idx} style={[styles.rxChip, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="fitness" size={12} color={colors.primary} />
                        <Text style={[styles.rxText, { color: colors.primary }]}>{med}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal 1: Add/Edit Primary Doctor */}
      <Modal visible={primaryModalVisible} animationType="slide" transparent onRequestClose={() => setPrimaryModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Primary Regular Doctor</Text>
              <TouchableOpacity onPress={() => setPrimaryModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Doctor Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="e.g. Dr. Savitha Lakshmi"
                  placeholderTextColor={colors.placeholder}
                  value={pName}
                  onChangeText={setPName}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Specialty / Designation</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="e.g. Senior Gynecologist & Obstetrician"
                  placeholderTextColor={colors.placeholder}
                  value={pSpecialty}
                  onChangeText={setPSpecialty}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Hospital / Clinic Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="e.g. Kasturba Gandhi Hospital"
                  placeholderTextColor={colors.placeholder}
                  value={pHospital}
                  onChangeText={setPHospital}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Doctor Phone Number</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="044-28441011"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.placeholder}
                  value={pPhone}
                  onChangeText={setPPhone}
                />
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSavePrimaryDoctor}>
                <Text style={[styles.saveBtnText, { color: colors.white }]}>Save Primary Doctor Profile</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Log Checkup Visit */}
      <Modal visible={logModalVisible} animationType="slide" transparent onRequestClose={() => setLogModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Log Doctor Visit Entry</Text>
              <TouchableOpacity onPress={() => setLogModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {/* Doctor Category Selector */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Checkup Type</Text>
                <View style={styles.typeToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: doctorType === 'primary' ? colors.success + '20' : colors.inputBackground,
                        borderColor: doctorType === 'primary' ? colors.success : colors.inputBorder,
                      },
                    ]}
                    onPress={() => setDoctorType('primary')}
                  >
                    <Ionicons name="medical" size={16} color={doctorType === 'primary' ? colors.success : colors.textSecondary} />
                    <Text style={[styles.typeChipText, { color: doctorType === 'primary' ? colors.success : colors.text }]}>
                      Regular Primary Doctor
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: doctorType === 'occasional' ? '#8B5CF620' : colors.inputBackground,
                        borderColor: doctorType === 'occasional' ? '#8B5CF6' : colors.inputBorder,
                      },
                    ]}
                    onPress={() => setDoctorType('occasional')}
                  >
                    <Ionicons name="people" size={16} color={doctorType === 'occasional' ? '#8B5CF6' : colors.textSecondary} />
                    <Text style={[styles.typeChipText, { color: doctorType === 'occasional' ? '#8B5CF6' : colors.text }]}>
                      Occasional Specialist
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Specialist Category if Occasional */}
              {doctorType === 'occasional' && (
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Specialist Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specScroll}>
                    {SPECIALIST_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.specPill,
                          {
                            backgroundColor: specialistCategory === cat ? '#8B5CF6' : colors.inputBackground,
                            borderColor: specialistCategory === cat ? '#8B5CF6' : colors.inputBorder,
                          },
                        ]}
                        onPress={() => setSpecialistCategory(cat)}
                      >
                        <Text style={[styles.specPillText, { color: specialistCategory === cat ? colors.white : colors.text }]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Select from Primary Doctors Quick Pill */}
              {primaryDoctors.length > 0 && doctorType === 'primary' && (
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Quick Select Primary Doctor</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {primaryDoctors.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.quickDocChip, { backgroundColor: colors.primaryLight }]}
                        onPress={() => {
                          setDoctorName(p.name);
                          setHospitalName(p.hospitalName);
                        }}
                      >
                        <Text style={{ ...Typography.caption, color: colors.primary, fontWeight: '700' }}>{p.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Doctor Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="e.g. Dr. Savitha Lakshmi"
                  placeholderTextColor={colors.placeholder}
                  value={doctorName}
                  onChangeText={setDoctorName}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Hospital / Clinic Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="e.g. Apollo / Government Maternity PHC"
                  placeholderTextColor={colors.placeholder}
                  value={hospitalName}
                  onChangeText={setHospitalName}
                />
              </View>

              {/* Vitals Inputs */}
              <View style={styles.rowFields}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>BP Systolic</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="118"
                    keyboardType="number-pad"
                    value={bpSystolic}
                    onChangeText={setBpSystolic}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>BP Diastolic</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="76"
                    keyboardType="number-pad"
                    value={bpDiastolic}
                    onChangeText={setBpDiastolic}
                  />
                </View>
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Weight (kg)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="61.5"
                    keyboardType="numeric"
                    value={weightKg}
                    onChangeText={setWeightKg}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Baby Heartbeat (bpm)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="144"
                    keyboardType="number-pad"
                    value={babyHeartbeatBpm}
                    onChangeText={setBabyHeartbeatBpm}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Ultrasound / Scan Observations</Text>
                <TextInput
                  style={[styles.textInput, { height: 70, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="e.g. Growth normal, placenta posterior..."
                  multiline
                  value={ultrasoundNotes}
                  onChangeText={setUltrasoundNotes}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Doctor Advice & Prescriptions</Text>
                <TextInput
                  style={[styles.textInput, { height: 60, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="e.g. Continue Iron tablets, drink 3L water..."
                  multiline
                  value={doctorAdvice}
                  onChangeText={setDoctorAdvice}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Prescribed Medicines (comma separated)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="e.g. Autrin Iron, Shelcal 500 Calcium"
                  value={prescriptionInput}
                  onChangeText={setPrescriptionInput}
                />
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveCheckup}>
                <Text style={[styles.saveBtnText, { color: colors.white }]}>Save Checkup Record</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  title: {
    ...Typography.h2,
  },
  subtitle: {
    ...Typography.bodySmall,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  primaryDocHeader: {
    marginBottom: Spacing.lg,
  },
  primaryDocTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
  },
  addPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addPrimaryText: {
    ...Typography.buttonSmall,
  },
  noPrimaryCard: {
    padding: Spacing.md,
  },
  noPrimaryText: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
  },
  primaryDocCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pdocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pdocIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  mainBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  mainBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '800',
  },
  pdocName: {
    ...Typography.h4,
  },
  pdocSpecialty: {
    ...Typography.caption,
  },
  pdocHosp: {
    ...Typography.caption,
    fontSize: 11,
  },
  pdocActions: {
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingLabel: {
    ...Typography.caption,
    fontWeight: '800',
    fontSize: 10,
  },
  upcomingDoctor: {
    ...Typography.h4,
  },
  upcomingDate: {
    ...Typography.caption,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    ...Typography.body,
    marginVertical: Spacing.md,
  },
  emptyAddBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  checkupCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  doctorInfo: {
    flex: 1,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  docTypeBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  docTypeBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '800',
  },
  docName: {
    ...Typography.h4,
  },
  hospName: {
    ...Typography.caption,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  vitalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  vitalBox: {
    alignItems: 'center',
  },
  vitalVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  vitalSub: {
    ...Typography.caption,
    fontSize: 10,
  },
  notesBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  notesTitle: {
    ...Typography.caption,
    fontWeight: '700',
  },
  notesContent: {
    ...Typography.bodySmall,
  },
  rxContainer: {
    marginTop: Spacing.xs,
  },
  rxTitle: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  rxChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  rxChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  rxText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
  },
  field: {
    marginBottom: Spacing.md,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  typeChipText: {
    ...Typography.buttonSmall,
  },
  specScroll: {
    gap: Spacing.xs,
  },
  specPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  specPillText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  quickDocChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  rowFields: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  fieldLabel: {
    ...Typography.label,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
  },
  saveBtn: {
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  saveBtnText: {
    ...Typography.button,
  },
});
