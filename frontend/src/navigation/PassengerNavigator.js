import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

// Existing Passenger Screens
import PassengerHome from '../screens/passenger/PassengerHome';
import RideBooking from '../screens/passenger/RideBooking';
import AlertScreen from '../screens/passenger/AlertScreen';
import ProfileScreen from '../screens/passenger/ProfileScreen';
import EditProfileScreen from '../screens/passenger/EditProfileScreen';
import HelpSupportScreen from '../screens/passenger/HelpSupportScreen';
import SettingsScreen from '../screens/passenger/SettingsScreen';

import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 1. Tab Navigator for Primary Persistent Destinations
const PassengerTabs = () => {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.surface.base,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: typography.size.caption,
          fontWeight: typography.weight.medium,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'ActivityTab') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'SafetyTab') {
            iconName = focused ? 'shield-checkmark' : 'shield-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        options={{ title: 'Ride' }}
        children={(props) => <PassengerHome {...props} onLogout={logout} />}
      />
      <Tab.Screen
        name="ActivityTab"
        options={{ title: 'Activity' }}
        children={(props) => (
          <RideBooking
            {...props}
            onNavigate={(target) => {
              if (target === 'home') props.navigation.navigate('HomeTab');
            }}
          />
        )}
      />
      <Tab.Screen
        name="SafetyTab"
        options={{ title: 'Safety' }}
        children={(props) => <AlertScreen {...props} />}
      />
      <Tab.Screen
        name="ProfileTab"
        options={{ title: 'Account' }}
        children={(props) => <ProfileScreen {...props} onLogout={logout} />}
      />
    </Tab.Navigator>
  );
};

// 2. Root Passenger Stack encompassing Tabs + Modals/Subscreens
export const PassengerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PassengerMainTabs" component={PassengerTabs} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default PassengerNavigator;
