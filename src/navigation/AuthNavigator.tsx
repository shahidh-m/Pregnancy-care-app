// AuthNavigator — Handles Login and Onboarding stack flow
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { useAuth } from '../contexts/AuthContext';

const Stack = createNativeStackNavigator();

export const AuthNavigator: React.FC = () => {
  const { user, isOnboarded } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : !isOnboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : null}
    </Stack.Navigator>
  );
};
