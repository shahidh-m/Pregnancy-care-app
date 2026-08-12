// AppNavigator — Bottom Tab Navigator + Stack Navigators with Persistent Floating SOS Button & Companion Emergency Modal
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SOSButton } from '../components/SOSButton';
import { CompanionEmergencyModal } from '../components/CompanionEmergencyModal';
import { getLocalContacts } from '../services/storage';
import { triggerEmergencySOS } from '../services/emergencySOS';
import { triggerCompanionEmergencyAlert } from '../services/companionSOS';
import { useAuth } from '../contexts/AuthContext';
import { calculatePregnancyInfo } from '../utils/pregnancy';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { TrackScreen } from '../screens/track/TrackScreen';
import { HealthLogScreen } from '../screens/track/HealthLogScreen';
import { HealthTrendsScreen } from '../screens/track/HealthTrendsScreen';
import { RemindersScreen } from '../screens/track/RemindersScreen';
import { DietLogScreen } from '../screens/track/DietLogScreen';

import { CareScreen } from '../screens/care/CareScreen';
import { ReportReaderScreen } from '../screens/care/ReportReaderScreen';
import { HospitalLocatorScreen } from '../screens/care/HospitalLocatorScreen';
import { SchemeStatusScreen } from '../screens/care/SchemeStatusScreen';
import { DoctorCheckupScreen } from '../screens/care/DoctorCheckupScreen';

import { FamilyDashboardScreen } from '../screens/family/FamilyDashboardScreen';
import { EmergencyContactsScreen } from '../screens/family/EmergencyContactsScreen';
import { CompanionDashboardScreen } from '../screens/family/CompanionDashboardScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stacks for each tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="HealthLog" component={HealthLogScreen} />
    <Stack.Screen name="DietLog" component={DietLogScreen} />
    <Stack.Screen name="DoctorCheckup" component={DoctorCheckupScreen} />
    <Stack.Screen name="ReportReader" component={ReportReaderScreen} />
    <Stack.Screen name="HospitalLocator" component={HospitalLocatorScreen} />
  </Stack.Navigator>
);

const TrackStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TrackMain" component={TrackScreen} />
    <Stack.Screen name="HealthLog" component={HealthLogScreen} />
    <Stack.Screen name="DietLog" component={DietLogScreen} />
    <Stack.Screen name="HealthTrends" component={HealthTrendsScreen} />
    <Stack.Screen name="Reminders" component={RemindersScreen} />
  </Stack.Navigator>
);

const CareStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CareMain" component={CareScreen} />
    <Stack.Screen name="DoctorCheckup" component={DoctorCheckupScreen} />
    <Stack.Screen name="ReportReader" component={ReportReaderScreen} />
    <Stack.Screen name="HospitalLocator" component={HospitalLocatorScreen} />
    <Stack.Screen name="SchemeStatus" component={SchemeStatusScreen} />
  </Stack.Navigator>
);

const FamilyStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FamilyMain" component={FamilyDashboardScreen} />
    <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
  </Stack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [contactCount, setContactCount] = useState(0);

  const pregInfo = calculatePregnancyInfo(user?.dueDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString());

  useEffect(() => {
    loadContacts();
    const interval = setInterval(loadContacts, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadContacts = async () => {
    const list = await getLocalContacts();
    setContactCount(list.length);
  };

  const handleSOSTrigger = async () => {
    const result = await triggerEmergencySOS(pregInfo.trimester);

    // Also trigger companion network alert
    await triggerCompanionEmergencyAlert(
      user?.pairingCode || 'PREG-849201',
      user?.name || 'Anitha (Mom)',
      pregInfo.trimester,
      result.location
    );

    if (result.success) {
      Alert.alert(t('sos.sent'), `Alert dispatched to companion devices & ${result.notifiedCount} SMS contact(s).`);
    } else {
      Alert.alert('SOS Dispatched', 'Companion Network Alert broadcasting in real-time!');
    }
  };

  // If user is a Companion (logged in under "For Her" mode)
  if (user?.role === 'companion') {
    return (
      <View style={styles.container}>
        <CompanionDashboardScreen />
        <CompanionEmergencyModal />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.icon,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarLabel: t('tabs.home'),
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Track"
          component={TrackStack}
          options={{
            tabBarLabel: t('tabs.track'),
            tabBarIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Care"
          component={CareStack}
          options={{
            tabBarLabel: t('tabs.care'),
            tabBarIcon: ({ color, size }) => <Ionicons name="medical-outline" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Family"
          component={FamilyStack}
          options={{
            tabBarLabel: t('tabs.family'),
            tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          }}
        />
      </Tab.Navigator>

      {/* Root-Level Persistent Floating SOS Button */}
      <SOSButton contactCount={contactCount} onTrigger={handleSOSTrigger} />

      {/* Root-Level Companion Emergency Alert Listener */}
      <CompanionEmergencyModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

