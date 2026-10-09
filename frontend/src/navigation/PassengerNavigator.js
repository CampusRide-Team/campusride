import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Passenger Screens
import PassengerHome from '../screens/passenger/PassengerHome';
import RideHistoryScreen from '../screens/passenger/RideHistoryScreen';
import SafetyCenterScreen from '../screens/passenger/SafetyCenterScreen';
import ProfileScreen from '../screens/passenger/ProfileScreen';
import EditProfileScreen from '../screens/passenger/EditProfileScreen';
import HelpSupportScreen from '../screens/passenger/HelpSupportScreen';
import SettingsScreen from '../screens/passenger/SettingsScreen';
import AddLocationScreen from '../screens/passenger/AddLocationScreen';
import TrustedContactsScreen from '../screens/passenger/TrustedContactsScreen';
import ScheduledRidesScreen from '../screens/passenger/ScheduledRidesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 1. Tab Navigator for Primary Persistent Destinations
const PassengerTabs = () => {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { theme } = useTheme();
  const { colors } = theme;
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabBarHeight = 56 + bottomInset;

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: isTabBarVisible
          ? {
              backgroundColor: colors.brand.baseBackground,
              borderTopColor: colors.border.subtle,
              borderTopWidth: 1,
              height: tabBarHeight,
              paddingBottom: bottomInset,
              paddingTop: 6,
              elevation: 0,
              shadowColor: colors.text.primary,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0,
              shadowRadius: 0,
            }
          : {
              display: 'none',
            },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: typography.weight.medium,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ActivityTab') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'SafetyTab') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        options={{ title: 'Home' }}
        children={(props) => (
          <PassengerHome
            {...props}
            onLogout={logout}
            onToggleTabBar={(visible) => setIsTabBarVisible(visible)}
          />
        )}
      />
      <Tab.Screen
        name="ActivityTab"
        options={{ title: 'Rides' }}
        children={(props) => (
          <RideHistoryScreen
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
        children={(props) => <SafetyCenterScreen {...props} />}
      />
      <Tab.Screen
        name="ProfileTab"
        options={{ title: 'Profile' }}
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
      <Stack.Screen name="AddLocation" component={AddLocationScreen} />
      <Stack.Screen name="TrustedContacts" component={TrustedContactsScreen} />
      <Stack.Screen name="ScheduledRides" component={ScheduledRidesScreen} />
    </Stack.Navigator>
  );
};

export default PassengerNavigator;
