import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import driverService from '../api/services/driverService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 1. Driver Operational Tabs
const DriverTabs = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: authUser, logout } = useAuth();
  const [driverProfileData, setDriverProfileData] = useState(null);

  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabBarHeight = 56 + bottomInset;

  useEffect(() => {
    let cancelled = false;
    if (authUser) {
      const rawAvatarUrl = authUser.avatarUri || authUser.avatarUrl || authUser.avatar || null;
      setDriverProfileData({
        fullName: authUser.fullName,
        email: authUser.email,
        rating: authUser.rating || 5.0,
        totalTrips: authUser.totalTrips || 0,
        tripsToday: authUser.tripsToday || 0,
        isApproved: authUser.isApproved,
        isOnline: false,
        availabilityHydrated: false,
        avatarUri: rawAvatarUrl ? `${rawAvatarUrl}?cb=${Date.now()}` : null,
      });

      driverService.getDriverProfile()
        .then((result) => {
          if (cancelled || !result?.success || !result?.data) return;
          const profile = result.data;
          const profileAvatar = profile.avatarUri || profile.avatarUrl || rawAvatarUrl;
          setDriverProfileData({
            ...profile,
            rating: profile.rating ?? profile.ratingAverage ?? authUser.rating ?? 5.0,
            totalTrips: profile.totalTrips ?? authUser.totalTrips ?? 0,
            tripsToday: profile.tripsToday ?? authUser.tripsToday ?? 0,
            isApproved: profile.isApproved ?? authUser.isApproved,
            isOnline: profile.isOnline === true,
            availabilityHydrated: true,
            avatarUri: profileAvatar ? `${profileAvatar}?cb=${Date.now()}` : null,
          });
        })
        .catch((error) => {
          console.warn('[DriverNavigator] Could not hydrate authoritative availability:', error?.message);
        });
    }

    return () => {
      cancelled = true;
    };
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
          height: tabBarHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 0,
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
            onViewRequests={() => props.navigation.navigate('RequestsTab')}
            onChangeTab={(targetTab) => {
              if (targetTab === 'trips') props.navigation.navigate('RequestsTab');
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
              if (targetTab === 'active-requests') props.navigation.navigate('RequestsTab');
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
    />
  );
};

const DriverNavigationWrapper = ({ route, navigation }) => {
  const passenger = route.params?.passenger;

  const handleFinishTrip = (completedTrip = passenger) => {
    const stops = completedTrip?.tripStops || passenger?.tripStops || [];
    const pickupStop = stops.find((stop) => stop.stopType === 'pickup');
    const dropoffStop = [...stops].reverse().find((stop) => stop.stopType === 'dropoff');
    const distanceMeters = completedTrip?.currentRoute?.distanceMeters;
    const durationSeconds = completedTrip?.currentRoute?.durationSeconds;
    const dynamicTripPayload = {
      driverName: 'Driver',
      pickupLocation: pickupStop?.name || passenger?.pickup?.name || passenger?.pickupLocation || 'Campus Pickup',
      destinationLocation: dropoffStop?.name || passenger?.dropoff?.name || passenger?.dropoffLocation || 'Campus Destination',
      durationText: Number.isFinite(Number(durationSeconds)) && Number(durationSeconds) > 0 ? `${Math.ceil(Number(durationSeconds) / 60)} minutes` : 'Not recorded',
      distanceText: Number.isFinite(Number(distanceMeters)) && Number(distanceMeters) > 0 ? `${(Number(distanceMeters) / 1000).toFixed(1)} km` : 'Not recorded',
    };
    navigation.navigate('TripSummary', { tripData: dynamicTripPayload });
  };

  return (
    <DriverNavigation
      passenger={passenger}
      rideData={passenger}
      onBack={() => navigation.goBack()}
      onTripCompleted={handleFinishTrip}
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
