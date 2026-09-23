import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

// Existing Driver Screens
import DriverHome from '../screens/driver/DriverHome';
import ActiveRequests from '../screens/driver/ActiveRequests';
import DriverNavigation from '../screens/driver/DriverNavigation';
import TripSummary from '../screens/driver/TripSummary';
import DriverProfile from '../screens/driver/DriverProfile';
import RideHistory from '../screens/driver/RideHistory';
import DriverNotis from '../screens/driver/DriverNotis';
import DriverSupport from '../screens/driver/DriverSupport';
import EditDriverProfile from '../screens/driver/EditDriverProfile';
import DriverSettings from '../screens/driver/DriverSettings';

import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 1. Driver Operational Tabs
const DriverTabs = ({ navigation }) => {
  const { user: authUser, logout } = useAuth();
  const [driverProfileData, setDriverProfileData] = useState(null);

  useEffect(() => {
    if (authUser) {
      const rawAvatarUrl = authUser.avatarUri || authUser.avatarUrl || authUser.avatar || null;
      setDriverProfileData({
        fullName: authUser.fullName,
        email: authUser.email,
        rating: authUser.rating || 5.0,
        totalTrips: authUser.totalTrips || 0,
        tripsToday: authUser.tripsToday || 0,
        isApproved: authUser.isApproved,
        avatarUri: rawAvatarUrl ? `${rawAvatarUrl}?cb=${Date.now()}` : null,
      });
    }
  }, [authUser]);

  return (
    <Tab.Navigator
      initialRouteName="DriverHomeTab"
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
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'DriverHomeTab') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'RequestsTab') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'DriverProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DriverHomeTab"
        options={{ title: 'Drive' }}
        children={(props) => (
          <DriverHome
            {...props}
            driverData={driverProfileData}
            onLogout={logout}
            onViewRequests={() => navigation.navigate('ActiveRequests')}
            onChangeTab={(targetTab) => {
              if (targetTab === 'trips') navigation.navigate('ActiveRequests');
              if (targetTab === 'profile') props.navigation.navigate('DriverProfileTab');
            }}
          />
        )}
      />
      <Tab.Screen
        name="RequestsTab"
        options={{ title: 'Requests' }}
        children={(props) => (
          <ActiveRequests
            {...props}
            onBack={() => props.navigation.navigate('DriverHomeTab')}
            onAcceptRide={(acceptedPassenger) => {
              navigation.navigate('DriverNavigation', { passenger: acceptedPassenger });
            }}
            onChangeTab={(targetTab) => {
              if (targetTab === 'home') props.navigation.navigate('DriverHomeTab');
              if (targetTab === 'profile') props.navigation.navigate('DriverProfileTab');
            }}
          />
        )}
      />
      <Tab.Screen
        name="DriverProfileTab"
        options={{ title: 'Profile' }}
        children={(props) => (
          <DriverProfile
            {...props}
            driverData={driverProfileData}
            onLogout={logout}
            onNavigate={(targetTab) => {
              if (targetTab === 'home') props.navigation.navigate('DriverHomeTab');
              if (targetTab === 'active-requests') navigation.navigate('ActiveRequests');
              if (targetTab === 'ride-history') navigation.navigate('RideHistory');
              if (targetTab === 'notifications') navigation.navigate('DriverNotis');
              if (targetTab === 'help-support') navigation.navigate('DriverSupport');
              if (targetTab === 'settings') navigation.navigate('EditDriverProfile');
              if (targetTab === 'app-settings') navigation.navigate('DriverSettings');
            }}
          />
        )}
      />
    </Tab.Navigator>
  );
};

// 2. Driver Root Stack including active trip navigation
export const DriverNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverMainTabs" component={DriverTabs} />
      <Stack.Screen name="ActiveRequests" component={ActiveRequestsWrapper} />
      <Stack.Screen name="DriverNavigation" component={DriverNavigationWrapper} />
      <Stack.Screen name="TripSummary" component={TripSummaryWrapper} />
      <Stack.Screen name="RideHistory" component={RideHistory} />
      <Stack.Screen name="DriverNotis" component={DriverNotis} />
      <Stack.Screen name="DriverSupport" component={DriverSupport} />
      <Stack.Screen name="EditDriverProfile" component={EditDriverProfile} />
      <Stack.Screen name="DriverSettings" component={DriverSettings} />
    </Stack.Navigator>
  );
};

// Screen wrappers for prop-based legacy driver screens
const ActiveRequestsWrapper = ({ navigation }) => {
  return (
    <ActiveRequests
      onBack={() => navigation.goBack()}
      onAcceptRide={(passenger) => {
        navigation.navigate('DriverNavigation', { passenger });
      }}
      onChangeTab={(tab) => {
        if (tab === 'home') navigation.navigate('DriverMainTabs', { screen: 'DriverHomeTab' });
      }}
    />
  );
};

const DriverNavigationWrapper = ({ route, navigation }) => {
  const passenger = route.params?.passenger;

  const handleFinishTrip = () => {
    const dynamicTripPayload = {
      driverName: 'Driver',
      pickupLocation: passenger?.pickupLocation || 'Campus Pickup',
      destinationLocation: passenger?.dropoffLocation || 'Campus Destination',
      durationText: '12 minutes',
      distanceText: '4.2 km',
    };
    navigation.navigate('TripSummary', { tripData: dynamicTripPayload });
  };

  return (
    <DriverNavigation
      passenger={passenger}
      rideData={passenger}
      onBack={() => navigation.goBack()}
      onTripCompleted={handleFinishTrip}
      onArrive={handleFinishTrip}
      onCancelNoPenalty={() => navigation.navigate('DriverMainTabs', { screen: 'DriverHomeTab' })}
      onChangeTab={() => navigation.navigate('DriverMainTabs', { screen: 'DriverHomeTab' })}
    />
  );
};

const TripSummaryWrapper = ({ route, navigation }) => {
  const tripData = route.params?.tripData;

  return (
    <TripSummary
      tripData={tripData}
      onDismiss={() => navigation.navigate('DriverMainTabs', { screen: 'DriverHomeTab' })}
      onChangeTab={() => navigation.navigate('DriverMainTabs', { screen: 'DriverHomeTab' })}
    />
  );
};

export default DriverNavigator;
