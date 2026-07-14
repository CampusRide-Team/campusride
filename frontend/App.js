import React, { useEffect, useState } from "react";
import { Alert, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

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

const RootNavigator = () => {
  const [screen, setScreen] = useState("splash");
  const { role, setRole, login, logout, user: authUser, token: authToken } = useAuth(); // 💡 Added: user (authUser) and token (authToken)
  
  // Actively listen to global theme changes to force component redraws
  const { theme, darkModeEnabled } = useTheme();

  // UNIFIED DRIVER REGISTRATION LEDGER STATE
  const [registrationForm, setRegistrationForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    vehicleType: "",
    licensePlate: "",
    vehicleColor: "",
    seats: "",
  });

  // Operational states tracking active live jobs
  const [activeTripData, setActiveTripData] = useState(null);
  const [tripStartTime, setTripStartTime] = useState(null);
  const [finalCalculatedTrip, setFinalCalculatedTrip] = useState(null);

  // LIVE DRIVER PROFILE RECORD
  const [driverProfileData, setDriverProfileData] = useState(null);

  // 💡 Sync global auth user profile data to local state whenever authUser hydrates or changes
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

  // Helper render wrapper function to ensure the root background color shifts dynamically
  const renderScreen = () => {
    // 1. Splash Screen
    if (screen === "splash") {
      return <SplashScreen onFinish={() => setScreen("onboarding")} />;
    }

    // 2. Onboarding Screen
    if (screen === "onboarding") {
      return <Onboarding onFinish={() => setScreen("role-selection")} />;
    }

    // 3. Role Selection Screen
    if (screen === "role-selection") {
      return (
        <RoleSelection
          onSelectStudent={() => setScreen("student-login")}
          onSelectDriver={() => setScreen("driver-login")}
        />
      );
    }

    // 4. Student Login Screen
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

    // 5. Driver Login Screen
    if (screen === "driver-login") {
      return (
        <DriverLogin
          onDriverLogin={async (authPayload) => {
            if (authPayload?.success) {
              const { user, token } = authPayload.data || {};

              if (user && token) {
                await login(user, token);

                // 💡 Corrected to check the updated database field first
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

    // 6. Driver Registration — Stage 1
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

    // 7. Driver Registration — Stage 2
    if (screen === "driver-reg-step2") {
      return (
        <DriverRegisterStep2
          initialData={registrationForm}
          onNext={(vehicleData) => {
            setRegistrationForm((prev) => ({ ...prev, ...vehicleData }));
            setScreen("driver-reg-step3");
          }}
          onBack={() => setScreen("driver-reg-step1")}
          onLogin={() => setScreen("driver-login")}
        />
      );
    }

    // 8. Driver Registration — Stage 3
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

    // 9. Driver Registration — Stage 4
    if (screen === "driver-reg-success") {
      return <DriverRegisterSuccess onBackToLogin={() => setScreen("driver-login")} />;
    }

    // 10. Shared Signup Screen
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

    // 11. Core Portal Dashboard
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

    // 12. Incoming Ride Requests Queue Screen Layout
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

    // 13. Active Navigation Tracking View
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

    // 14. Post-Trip Summary Interface
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

    // 15. Driver Settings and Profile Workspace Frame
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

    // 16. Ride History Archive Module
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

    // 17. Standalone Driver Notifications Module
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

    // 18. Standalone Driver Help & Support Module
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

    // 19. Standalone Driver Edit Profile Module inside App.js
    if (screen === "edit-driver-profile") {
      return (
        <EditDriverProfile
          driverData={driverProfileData}
          onBack={() => setScreen("driver-profile")}
          onProfileUpdated={async (updatedUser) => {
            // 💡 Update local profile record structure
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

            // 💡 Keep persistent global auth context synchronized
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

    // 20. Standalone Driver App Settings Module
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

  // Wrap in a dynamic theme-responsive container to catch direct layout boundaries
  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      {renderScreen()}
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