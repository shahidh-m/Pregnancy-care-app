// Emergency Contacts Management Screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { getLocalContacts, saveLocalContacts, EmergencyContact, addLocalContact, deleteLocalContact } from '../../services/storage';
import { syncContactsToFirestore } from '../../services/firestoreSync';

export const EmergencyContactsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState<EmergencyContact['relationship']>('husband');
  const [hospitalName, setHospitalName] = useState('');
  const [priorityOrder, setPriorityOrder] = useState('1');

  useEffect(() => {
    loadContacts();
  }, [user?.uid]);

  const loadContacts = async () => {
    const list = await getLocalContacts(user?.uid);
    setContacts(list);
  };

  const copyCodeToClipboard = () => {
    Alert.alert('Companion Link Code', `Share this code with your family member: ${user?.pairingCode || 'PREG-849201'}`);
  };

  const openAddModal = () => {
    setEditingContact(null);
    setName('');
    setPhone('');
    setRelationship('husband');
    setHospitalName('');
    setPriorityOrder(String(contacts.length + 1));
    setModalVisible(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setRelationship(contact.relationship);
    setHospitalName(contact.hospitalName || '');
    setPriorityOrder(String(contact.priorityOrder));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please enter both name and phone number.');
      return;
    }

    const order = parseInt(priorityOrder, 10) || 1;
    let updatedContactsList: EmergencyContact[] = [];

    if (editingContact) {
      // Update existing
      updatedContactsList = contacts.map(c => 
        c.id === editingContact.id 
          ? { ...c, name: name.trim(), phone: phone.trim(), relationship, hospitalName: hospitalName.trim() || undefined, priorityOrder: order }
          : c
      ).sort((a, b) => a.priorityOrder - b.priorityOrder);
      await saveLocalContacts(updatedContactsList, user?.uid);
    } else {
      // Add new
      const newContact = await addLocalContact({
        name: name.trim(),
        phone: phone.trim(),
        relationship,
        hospitalName: hospitalName.trim() || undefined,
        priorityOrder: order,
      }, user?.uid);
      updatedContactsList = [...contacts, newContact].sort((a, b) => a.priorityOrder - b.priorityOrder);
    }

    setContacts(updatedContactsList);

    // Sync updated list to Cloud Firestore Database
    if (user?.uid) {
      await syncContactsToFirestore(user.uid, updatedContactsList);
    }

    setModalVisible(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      t('family.deleteConfirm'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteLocalContact(id, user?.uid);
            const remaining = contacts.filter(c => c.id !== id);
            setContacts(remaining);
            if (user?.uid) {
              await syncContactsToFirestore(user.uid, remaining);
            }
          },
        },
      ]
    );
  };

  const relationshipsList: EmergencyContact['relationship'][] = [
    'doctor', 'husband', 'mother', 'father', 'friend', 'other'
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('family.emergencyContacts')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {contacts.length === 0 ? t('family.minContactWarning') : `${contacts.length} saved contact(s)`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Companion Network Link Code Banner */}
      <Card variant="elevated" style={{ marginHorizontal: Spacing.xl, marginBottom: Spacing.md, padding: Spacing.md, backgroundColor: colors.primaryLight }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <Ionicons name="wifi" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...Typography.caption, fontWeight: '700', color: colors.primary }}>COMPANION NETWORK LINK CODE</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: 2 }}>{user?.pairingCode || 'PREG-849201'}</Text>
            <Text style={{ ...Typography.caption, fontSize: 11, color: colors.textSecondary }}>
              Family members can enter this code in their app to receive loud full-screen emergency alerts!
            </Text>
          </View>
          <TouchableOpacity onPress={copyCodeToClipboard} style={{ padding: 8, backgroundColor: colors.primary, borderRadius: BorderRadius.md }}>
            <Ionicons name="copy-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </Card>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('family.noContacts')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>{t('family.addFirstContact')}</Text>
          <TouchableOpacity
            style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
            onPress={openAddModal}
          >
            <Text style={{ color: colors.white, fontWeight: '600' }}>{t('family.addContact')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <Card variant="default" style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <View style={[styles.badge, { backgroundColor: item.relationship === 'doctor' ? colors.error + '20' : colors.primaryLight }]}>
                  <Text style={[styles.badgeText, { color: item.relationship === 'doctor' ? colors.error : colors.primary }]}>
                    #{item.priorityOrder} • {t(`relationships.${item.relationship}`)}
                  </Text>
                </View>
                <View style={styles.actionIcons}>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                    <Ionicons name="pencil" size={18} color={colors.icon} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
              <View style={styles.contactDetailRow}>
                <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.contactDetailText, { color: colors.textSecondary }]}>{item.phone}</Text>
              </View>

              {item.hospitalName ? (
                <View style={styles.contactDetailRow}>
                  <Ionicons name="medical-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.contactDetailText, { color: colors.textSecondary }]}>{item.hospitalName}</Text>
                </View>
              ) : null}
            </Card>
          )}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingContact ? t('family.editContact') : t('family.addContact')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {/* Name */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('family.name')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Dr. Priya / Ramesh"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              {/* Phone */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('family.phone')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="+91 9876543210"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              {/* Relationship Picker */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('family.relationship')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {relationshipsList.map(rel => (
                    <TouchableOpacity
                      key={rel}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: relationship === rel ? colors.primary : colors.inputBackground,
                          borderColor: relationship === rel ? colors.primary : colors.inputBorder,
                        },
                      ]}
                      onPress={() => setRelationship(rel)}
                    >
                      <Text style={[styles.chipText, { color: relationship === rel ? colors.white : colors.text }]}>
                        {t(`relationships.${rel}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Hospital Name (if Doctor) */}
              {relationship === 'doctor' && (
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('family.hospitalName')}</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                    value={hospitalName}
                    onChangeText={setHospitalName}
                    placeholder="e.g. Apollo / Government PHC"
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
              )}

              {/* Priority Order */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('family.priorityOrder')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={priorityOrder}
                  onChangeText={setPriorityOrder}
                  keyboardType="number-pad"
                  placeholder="1 (Highest)"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={[styles.saveBtnText, { color: colors.white }]}>{t('family.save')}</Text>
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
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  contactCard: {
    marginBottom: Spacing.md,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  actionIcons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  iconBtn: {
    padding: 4,
  },
  contactName: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  contactDetailText: {
    ...Typography.bodySmall,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  emptyText: {
    ...Typography.h3,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  emptyAddBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '85%',
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
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  chipText: {
    ...Typography.labelSmall,
  },
  saveBtn: {
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  saveBtnText: {
    ...Typography.button,
  },
});
