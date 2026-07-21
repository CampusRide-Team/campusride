import React, { useEffect, useState } from "react";
import { Alert, View, StyleSheet, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

// IMPORTS: For registering native hardware push notification parameters
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import api from "./src/api/axios";

// Configure how notifications behave when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Auth screens
import SplashScreen from "./src/screens/auth/SplashScreen";
import Onboarding from "./src/screens/auth/Onboarding";
import RoleSelection from "./src/screens/auth/RoleSelection";
import StudentLogin from "./src/screens/auth/StudentLogin";
import DriverLogin from "./src/screens/auth/DriverLogin";
import SignupScreen from "./src/screens/auth/SignupScreen";
import DriverRegisterStep1 from "./src/screens/auth/DriverRegisterStep1";
import DriverRegisterStep2 from "./src/screens/auth/DriverRegisterStep2";
import DriverRegisterStep3 from "./src/screens/auth/DriverRegisterStep3";
import DriverRegisterSuccess from "./src/screens/auth/DriverRegisterSuccess";

// Student screens
import StudentHome from "./src/screens/student/StudentHome";

// Driver screens
import DriverHome from "./src/screens/driver/DriverHome";
import ActiveRequests from "./src/screens/driver/ActiveRequests";
import DriverNavigation from "./src/screens/driver/DriverNavigation";
import TripSummary from "./src/screens/driver/TripSummary";
import DriverProfile from "./src/screens/driver/DriverProfile";
import RideHistory from "./src/screens/driver/RideHistory";
import DriverNotis from "./src/screens/driver/DriverNotis";
import DriverSupport from "./src/screens/driver/DriverSupport";
import EditDriverProfile from "./src/screens/driver/EditDriverProfile";
import DriverSettings from "./src/screens/driver/DriverSettings";

// IMPORT: Suspension Modal Component
import AccountSuspendedModal from "./src/context/AccountSuspendedModal";

const RootNavigator = () => {
  const [screen, setScreen] = useState("splash");
  const { role, setRole, login, logout, user: authUser, token: authToken } = useAuth();
  const { theme, darkModeEnabled } = useTheme();

  //  GLOBAL SUSPENDED MODAL STATE & ERROR INTERCEPTION
  const [globalSuspendedModalVisible, setGlobalSuspendedModalVisible] = useState(false);
  const [globalAttemptedEmail, setGlobalAttemptedEmail] = useState("");

  // Global Axios interceptor to catch any 403 ACCOUNT_SUSPENDED errors on live sessions
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorCode = error.response?.data?.error?.code;
        if (errorCode === 'ACCOUNT_SUSPENDED') {
          setGlobalAttemptedEmail(error.config?.data ? JSON.parse(error.config.data)?.email || authUser?.email || "" : authUser?.email || "");
          setGlobalSuspendedModalVisible(true);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [authUser]);

  // 🚀 PRODUCTION SYNCED MASTER REGISTRATION FORM LEDGER
  const [registrationForm, setRegistrationForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    vehicleType: "Campus Sedan",
    vehicleModel: "",   
    vehicleLicensePlate: "", 
    vehicleColor: "",
    seats: "",
  });

  // Operational states tracking active live jobs
  const [activeTripData, setActiveTripData] = useState(null);
  const [tripStartTime, setTripStartTime] = useState(null);
  const [finalCalculatedTrip, setFinalCalculatedTrip] = useState(null);

  // LIVE DRIVER PROFILE RECORD
  const [driverProfileData, setDriverProfileData] = useState(null);

  // SYNC DRIVER PROFILE DATA
  useEffect(() => {
    if (authUser && role === "driver") {
      const rawAvatarUrl = authUser.avatarUri || authUser.avatarUrl || authUser.avatar || null;
      setDriverProfileData({
        fullName: authUser.fullName,
        email: authUser.email,
        rating: authUser.rating,
        totalTrips: authUser.totalTrips,
        tripsToday: authUser.tripsToday,
        isApproved: authUser.isApproved,
        avatarUri: rawAvatarUrl ? `${rawAvatarUrl}?cb=${Date.now()}` : null,
      });
    } else if (!authUser) {
      setDriverProfileData(null);
    }
  }, [authUser, role]);

  // CLEAN UNIFIED REGISTRATION HANDSHAKE (Expo Go SDK 53 Safe Guarded)
  const registerForPushNotificationsAsync = async () => {
    let pushToken = null;

    try {
      if (!Device.isDevice) {
        console.log("[Push] Emulator/Simulator detected. Skipping remote push registration.");
        return;
      }

      const appConfig = require("./app.json");
      const projectId = appConfig?.expo?.extra?.eas?.projectId;

      if (!projectId) {
        console.log("[Push] No EAS project ID configured. Skipping push registration for Expo Go.");
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== "granted") {
        console.warn("[Push] User declined notification permissions.");
        return;
      }

      const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
      pushToken = tokenResult.data;

    } catch (err) {
      console.warn("[Push Notice] Remote notifications require a development build on SDK 53+. Bypassing for Expo Go session.");
      return;
    }

    if (pushToken) {
      try {
        console.log("[Push] Dispatching token to backend database:", pushToken);
        const response = await api.put("/driver/profile", { expoPushToken: pushToken });
        if (response.data?.success) {
          console.log("[Push] Success! Token successfully registered in MongoDB.");
        }
      } catch (backendErr) {
        console.error("[Push] Could not write token to backend database:", backendErr.message);
      }
    }
  };

  // DYNAMIC REGISTRY: Run the Push Registration Handshake upon active session login
  useEffect(() => {
    if (authToken && authUser) {
      registerForPushNotificationsAsync();
    }
  }, [authToken]);

  // Helper render wrapper function
  const renderScreen = () => {
    if (screen === "splash") {
      return <SplashScreen onFinish={() => setScreen("onboarding")} />;
    }
    if (screen === "onboarding") {
      return <Onboarding onFinish={() => setScreen("role-selection")} />;
    }
    if (screen === "role-selection") {
      return (
        <RoleSelection
          onSelectStudent={() => setScreen("student-login")}
          onSelectDriver={() => setScreen("driver-login")}
        />
      );
    }
    if (screen === "student-login") {
      return (
        <StudentLogin
          onStudentLogin={() => {
            if (setRole) setRole("student");
            setScreen("home");
          }}
          onCreateAccount={() => setScreen("signup")}
          onGoogleLogin={() => {
            if (setRole) setRole("student");
            setScreen("home");
          }}
          onBack={() => setScreen("role-selection")}
        />
      );
    }
    if (screen === "driver-login") {
      return (
        <DriverLogin
          onDriverLogin={async (authPayload) => {
            if (authPayload?.success) {
              const { user, token } = authPayload.data || {};

              if (user && token) {
                await login(user, token);
                const initialAvatar = user.avatarUri || user.avatarUrl || user.avatar || null;

                setDriverProfileData({
                  fullName: user.fullName,
                  email: user.email,
                  rating: user.rating,
                  totalTrips: user.totalTrips,
                  tripsToday: user.tripsToday,
                  isApproved: user.isApproved,
                  avatarUri: initialAvatar ? `${initialAvatar}?cb=${Date.now()}` : null,
                });
              }
              setScreen("home");
            }
          }}
          onDriverRegister={() => setScreen("driver-reg-step1")}
          onSupport={() => console.log("Support clicked")}
          onBack={() => setScreen("role-selection")}
        />
      );
    }
    if (screen === "driver-reg-step1") {
      return (
        <DriverRegisterStep1
          initialData={registrationForm}
          onNext={(personalData) => {
            setRegistrationForm((prev) => ({ ...prev, ...personalData }));
            setScreen("driver-reg-step2");
          }}
          onBack={() => setScreen("driver-login")}
          onLogin={() => setScreen("driver-login")}
        />
      );
    }
    if (screen === "driver-reg-step2") {
      return (
        <DriverRegisterStep2
          initialData={registrationForm}
          onNext={(vehicleData) => {
            //  HOT PATCH MATCH: Perfectly merges synced vehicle keys into master ledger context
            setRegistrationForm((prev) => ({ ...prev, ...vehicleData }));
            setScreen("driver-reg-step3");
          }}
          onBack={() => setScreen("driver-reg-step1")}
          onLogin={() => setScreen("driver-login")}
        />
      );
    }
    if (screen === "driver-reg-step3") {
      return (
        <DriverRegisterStep3
          initialData={registrationForm}
          onSubmit={async (finalStepData) => {
            if (setRole) setRole("driver");
            setScreen("driver-reg-success");
          }}
          onBack={() => setScreen("driver-reg-step2")}
          onLogin={() => setScreen("driver-login")}
        />
      );
    }
    if (screen === "driver-reg-success") {
      return <DriverRegisterSuccess onBackToLogin={() => setScreen("driver-login")} />;
    }
    if (screen === "signup") {
      return (
        <SignupScreen
          onDone={() => {
            if (setRole) setRole("student");
            setScreen("home");
          }}
          onSignIn={() => setScreen("student-login")}
        />
      );
    }
    if (screen === "home") {
      return (
        <DriverHome
          driverData={driverProfileData}
          onLogout={() => {
            logout();
            setScreen("role-selection");
          }}
          onViewRequests={() => setScreen("active-requests")}
          onChangeTab={(targetTab) => {
            if (targetTab === "trips") setScreen("active-requests");
            if (targetTab === "profile") setScreen("driver-profile");
          }}
        />
      );
    }
    if (screen === "active-requests") {
      return (
        <ActiveRequests
          onBack={() => setScreen("home")}
          onAcceptRide={(acceptedPassenger) => {
            setActiveTripData(acceptedPassenger);
            setTripStartTime(Date.now());
            setScreen("driver-navigation");
          }}
          onChangeTab={(targetTab) => {
            if (targetTab === "home") setScreen("home");
            if (targetTab === "profile") setScreen("driver-profile");
          }}
        />
      );
    }
    if (screen === "driver-navigation") {
      return (
        <DriverNavigation
          passenger={activeTripData}
          onBack={() => setScreen("active-requests")}
          onArrive={() => {
            const endTime = Date.now();
            const totalElapsedMs = endTime - tripStartTime;
            const durationCalculated = tripStartTime ? Math.round(totalElapsedMs / 60000) : 12;

            let durationTextValue = "12 minutes";
            let distanceTextValue = "4.2 km";

            if (durationCalculated > 0) {
              durationTextValue = `${durationCalculated} ${durationCalculated === 1 ? "minute" : "minutes"}`;
              distanceTextValue = `${(durationCalculated * 0.35).toFixed(1)} km`;
            }

            const dynamicTripPayload = {
              driverName: driverProfileData?.fullName ? driverProfileData.fullName.split(" ")[0] : "Driver",
              pickupLocation: activeTripData?.pickup || "Engineering Block C",
              destinationLocation: activeTripData?.destination || "Student Union North",
              durationText: durationTextValue,
              distanceText: distanceTextValue,
            };

            setFinalCalculatedTrip(dynamicTripPayload);
            setScreen("trip-summary");
          }}
          onCancelNoPenalty={() => {
            Alert.alert(
              "Trip Canceled",
              "No-show recorded. Your driver score is unaffected.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    setActiveTripData(null);
                    setTripStartTime(null);
                    setScreen("active-requests");
                  },
                },
              ],
              { cancelable: false }
            );
          }}
          onChangeTab={(targetTab) => {
            if (targetTab === "home") setScreen("home");
            if (targetTab === "active-requests") setScreen("active-requests");
            if (targetTab === "profile") setScreen("driver-profile");
          }}
        />
      );
    }
    if (screen === "trip-summary") {
      return (
        <TripSummary
          tripData={finalCalculatedTrip}
          onDismiss={() => {
            setActiveTripData(null);
            setFinalCalculatedTrip(null);
            setTripStartTime(null);
            setScreen("home");
          }}
          onChangeTab={(targetTab) => {
            if (targetTab === "home") setScreen("home");
            if (targetTab === "trips") setScreen("active-requests");
            if (targetTab === "profile") setScreen("driver-profile");
          }}
        />
      );
    }
    if (screen === "driver-profile") {
      return (
        <DriverProfile
          driverData={driverProfileData}
          onLogout={() => {
            logout();
            setScreen("role-selection");
          }}
          onNavigate={(targetTab) => {
            if (targetTab === "home") return setScreen("home");
            if (targetTab === "active-requests") return setScreen("active-requests");
            if (targetTab === "profile") return;
            if (targetTab === "ride-history") return setScreen("ride-history");
            if (targetTab === "notifications") return setScreen("driver-notis");
            if (targetTab === "help-support") return setScreen("driver-support");
            if (targetTab === "settings") return setScreen("edit-driver-profile");
            if (targetTab === "app-settings") return setScreen("app-settings");
          }}
        />
      );
    }
    if (screen === "ride-history") {
      return (
        <RideHistory
          onBack={() => setScreen("driver-profile")}
          onChangeTab={(targetTab) => {
            if (targetTab === "home") setScreen("home");
            if (targetTab === "trips") setScreen("active-requests");
            if (targetTab === "profile") setScreen("driver-profile");
          }}
        />
      );
    }
    if (screen === "driver-notis") {
      return (
        <DriverNotis
          onBack={() => setScreen("driver-profile")}
          onChangeTab={(targetTab) => {
            if (targetTab === "home") setScreen("home");
            if (targetTab === "trips") setScreen("active-requests");
            if (targetTab === "profile") setScreen("driver-profile");
          }}
        />
      );
    }
    if (screen === "driver-support") {
      return (
        <DriverSupport
          onBack={() => setScreen("driver-profile")}
          onChangeTab={(targetTab) => {
            if (targetTab === "home") setScreen("home");
            if (targetTab === "trips") setScreen("active-requests");
            if (targetTab === "profile") setScreen("driver-profile");
          }}
        />
      );
    }
    if (screen === "edit-driver-profile") {
      return (
        <EditDriverProfile
          driverData={driverProfileData}
          onBack={() => setScreen("driver-profile")}
          onProfileUpdated={async (updatedUser) => {
            const rawAvatarUrl = updatedUser.avatarUrl || updatedUser.avatarUri || null;
            const updatedAvatar = rawAvatarUrl ? `${rawAvatarUrl}?cb=${Date.now()}` : null;
            
            setDriverProfileData({
              fullName: updatedUser.fullName,
              email: updatedUser.email,
              rating: updatedUser.rating,
              totalTrips: updatedUser.totalTrips,
              tripsToday: updatedUser.tripsToday,
              isApproved: updatedUser.isApproved,
              avatarUri: updatedAvatar,
            });

            const updatedAuthUser = {
              ...authUser,
              fullName: updatedUser.fullName,
              phoneNumber: updatedUser.phoneNumber,
              avatarUri: updatedAvatar,
              avatarUrl: updatedAvatar,
            };
            await login(updatedAuthUser, authToken);
          }}
          onChangeTab={(targetTab) => {
            if (targetTab === "home") setScreen("home");
            if (targetTab === "trips") setScreen("active-requests");
            if (targetTab === "profile") setScreen("driver-profile");
          }}
        />
      );
    }
    if (screen === "app-settings") {
      return (
        <DriverSettings
          onBack={() => setScreen("driver-profile")}
          onNavigate={(targetTab) => {
            if (targetTab === "home") setScreen("home");
            if (targetTab === "active-requests") setScreen("active-requests");
            if (targetTab === "profile") setScreen("driver-profile");
          }}
        />
      );
    }

    return null;
  };

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      {renderScreen()}

      {/*  Global Account Suspended Modal Interceptor */}
      <AccountSuspendedModal 
        visible={globalSuspendedModalVisible} 
        userEmail={globalAttemptedEmail}
        onClose={() => {
          setGlobalSuspendedModalVisible(false);
          logout();
          setScreen("role-selection");
        }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}