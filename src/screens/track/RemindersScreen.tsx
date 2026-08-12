// RemindersScreen — Medicine, Water, Appointment Reminders
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, SafeAreaView, Switch } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { getLocalReminders, saveLocalReminders, ReminderItem } from '../../services/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const RemindersScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [hasPermission, setHasPermission] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderItem['type']>('medicine');
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    loadReminders();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadReminders = async () => {
    const list = await getLocalReminders();
    if (list.length === 0) {
      // Default sample reminders
      const defaults: ReminderItem[] = [
        { id: '1', type: 'medicine', title: 'Folic Acid Tablet', time: '09:00', recurring: true, active: true },
        { id: '2', type: 'water', title: 'Hydration Break (8 glasses)', time: '11:00', recurring: true, active: true },
        { id: '3', type: 'appointment', title: 'Dr. Priya Checkup', time: '16:00', recurring: false, active: true },
      ];
      await saveLocalReminders(defaults);
      setReminders(defaults);
    } else {
      setReminders(list);
    }
  };

  const toggleActive = async (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setReminders(updated);
    await saveLocalReminders(updated);
  };

  const handleAdd = async () => {
    if (!title.trim()) return;
    const newRem: ReminderItem = {
      id: 'rem_' + Date.now(),
      type,
      title: title.trim(),
      time,
      recurring: true,
      active: true,
    };
    const updated = [...reminders, newRem];
    setReminders(updated);
    await saveLocalReminders(updated);
    setTitle('');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('reminders.title')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {!hasPermission && (
        <View style={[styles.permissionBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <Text style={[styles.permissionText, { color: colors.text }]}>{t('reminders.permissionDenied')}</Text>
        </View>
      )}

      <FlatList
        data={reminders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card variant="default" style={styles.reminderCard}>
            <View style={styles.cardRow}>
              <View style={[styles.typeIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons
                  name={item.type === 'medicine' ? 'medkit' : item.type === 'water' ? 'water' : 'calendar'}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.remTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.remTime, { color: colors.textSecondary }]}>{item.time} • {t(`reminders.${item.type}`)}</Text>
              </View>
              <Switch
                value={item.active}
                onValueChange={() => toggleActive(item.id)}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </Card>
        )}
      />

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('reminders.add')}</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Reminder Title (e.g. Iron Tablet)"
              placeholderTextColor={colors.placeholder}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Time (e.g. 09:30)"
              placeholderTextColor={colors.placeholder}
              value={time}
              onChangeText={setTime}
            />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
              <Text style={{ color: colors.white, fontWeight: '600' }}>{t('common.save')}</Text>
            </TouchableOpacity>
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
    padding: Spacing.lg,
  },
  title: {
    ...Typography.h2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  permissionText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  reminderCard: {
    marginBottom: Spacing.xs,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remTitle: {
    ...Typography.labelLarge,
  },
  remTime: {
    ...Typography.caption,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
  },
  modalTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  saveBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
});
