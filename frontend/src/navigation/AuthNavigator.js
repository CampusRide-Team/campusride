import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import authService from '../api/services/authService';

// Progressive Authentication Screens
import SplashScreen from '../screens/auth/SplashScreen';
import Onboarding from '../screens/auth/Onboarding';
import RoleSelection from '../screens/auth/RoleSelection';
import AuthGatewayScreen from '../screens/auth/AuthGatewayScreen';
import PhoneInputScreen from '../screens/auth/PhoneInputScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import NameInputScreen from '../screens/auth/NameInputScreen';
import EmailInputScreen from '../screens/auth/EmailInputScreen';
import ProfilePhotoScreen from '../screens/auth/ProfilePhotoScreen';
import SetPasswordScreen from '../screens/auth/SetPasswordScreen';
import TermsPrivacyScreen from '../screens/auth/TermsPrivacyScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import PasswordUpdatedScreen from '../screens/auth/PasswordUpdatedScreen';

// Progressive Driver Setup Screens
import DriverDetailsScreen from '../screens/auth/DriverDetailsScreen';
import VehicleDetailsScreen from '../screens/auth/VehicleDetailsScreen';
import DriverDocumentsScreen from '../screens/auth/DriverDocumentsScreen';
import DriverVerificationPendingScreen from '../screens/auth/DriverVerificationPendingScreen';

// Preserved Legacy Screens for backward compatibility
import PassengerLogin from '../screens/auth/PassengerLogin';
import DriverLogin from '../screens/auth/DriverLogin';
import SignupScreen from '../screens/auth/SignupScreen';
import DriverRegisterStep1 from '../screens/auth/DriverRegisterStep1';
import DriverRegisterStep2 from '../screens/auth/DriverRegisterStep2';
import DriverRegisterStep3 from '../screens/auth/DriverRegisterStep3';
import DriverRegisterSuccess from '../screens/auth/DriverRegisterSuccess';

const Stack = createStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ECE5D2' },
      }}
    >
      {/* Entry & Onboarding */}
      <Stack.Screen name="Splash" component={SplashScreenWrapper} />
      <Stack.Screen name="Onboarding" component={OnboardingWrapper} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionWrapper} />
      <Stack.Screen name="AuthGateway" component={AuthGatewayWrapper} />

      {/* Progressive Identity Flow */}
      <Stack.Screen name="PhoneInput" component={PhoneInputWrapper} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationWrapper} />
      <Stack.Screen name="NameInput" component={NameInputWrapper} />
      <Stack.Screen name="EmailInput" component={EmailInputWrapper} />
      <Stack.Screen name="ProfilePhoto" component={ProfilePhotoWrapper} />
      <Stack.Screen name="SetPassword" component={SetPasswordWrapper} />
      <Stack.Screen name="TermsPrivacy" component={TermsPrivacyWrapper} />

      {/* Sign In & Password Recovery */}
      <Stack.Screen name="SignIn" component={SignInWrapper} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordWrapper} />
      <Stack.Screen name="RecoveryOTP" component={RecoveryOTPWrapper} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordWrapper} />
      <Stack.Screen name="PasswordUpdated" component={PasswordUpdatedWrapper} />

      {/* Progressive Driver Setup */}
      <Stack.Screen name="DriverDetails" component={DriverDetailsWrapper} />
      <Stack.Screen name="VehicleDetails" component={VehicleDetailsWrapper} />
      <Stack.Screen name="DriverDocuments" component={DriverDocumentsWrapper} />
      <Stack.Screen name="DriverVerificationPending" component={DriverVerificationPendingWrapper} />

      {/* Preserved Legacy Routes */}
      <Stack.Screen name="PassengerLogin" component={PassengerLoginWrapper} />
      <Stack.Screen name="DriverLogin" component={DriverLoginWrapper} />
      <Stack.Screen name="Signup" component={SignupWrapper} />
      <Stack.Screen name="DriverRegisterStep1" component={DriverReg1Wrapper} />
      <Stack.Screen name="DriverRegisterStep2" component={DriverReg2Wrapper} />
      <Stack.Screen name="DriverRegisterStep3" component={DriverReg3Wrapper} />
      <Stack.Screen name="DriverRegisterSuccess" component={DriverRegSuccessWrapper} />
    </Stack.Navigator>
  );
};

// --- Entry Wrappers ---
const SplashScreenWrapper = ({ navigation }) => {
  return (
    <SplashScreen
      onFinish={({ hasCompletedOnboarding } = {}) => {
        if (!hasCompletedOnboarding) {
          navigation.replace('Onboarding');
        } else {
          navigation.replace('RoleSelection');
        }
      }}
    />
  );
};

const OnboardingWrapper = ({ navigation }) => {
  return <Onboarding onFinish={() => navigation.replace('RoleSelection')} />;
};

const RoleSelectionWrapper = ({ navigation }) => {
  return (
    <RoleSelection
      onSelectRole={(role) => {
        navigation.navigate('AuthGateway', { role });
      }}
      onSelectPassenger={() => {
        navigation.navigate('AuthGateway', { role: 'passenger' });
      }}
      onSelectDriver={() => {
        navigation.navigate('AuthGateway', { role: 'driver' });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Onboarding');
        }
      }}
    />
  );
};

const AuthGatewayWrapper = ({ route, navigation }) => {
  return (
    <AuthGatewayScreen
      route={route}
      onContinueWithPhone={(role) => {
        navigation.navigate('PhoneInput', { role });
      }}
      onContinueWithGoogle={(role) => {
        // Handled via modal in screen
      }}
      onSignIn={(role) => {
        navigation.navigate('SignIn', { role });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('RoleSelection');
        }
      }}
    />
  );
};

// --- Progressive Registration Identity Wrappers ---
const PhoneInputWrapper = ({ route, navigation }) => {
  return (
    <PhoneInputScreen
      route={route}
      onContinue={(phoneData) => {
        navigation.navigate('OTPVerification', {
          ...route?.params,
          ...phoneData,
        });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('AuthGateway', { role: route?.params?.role || 'passenger' });
        }
      }}
    />
  );
};

const OTPVerificationWrapper = ({ route, navigation }) => {
  return (
    <OTPVerificationScreen
      route={route}
      onVerifySuccess={(data) => {
        // TODO(CAMPUSRIDE-AUTH): TEMPORARY DEV-ONLY OTP BYPASS
        // Routes forward into progressive name input screen with verified phone state
        navigation.navigate('NameInput', {
          ...route?.params,
          ...data,
          phoneVerified: true,
        });
      }}
      onEditPhone={() => {
        navigation.navigate('PhoneInput', {
          ...route?.params,
          phoneVerified: false,
        });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('PhoneInput', {
            ...route?.params,
            phoneVerified: false,
          });
        }
      }}
    />
  );
};

const NameInputWrapper = ({ route, navigation }) => {
  return (
    <NameInputScreen
      route={route}
      onContinue={(nameData) => {
        navigation.navigate('EmailInput', {
          ...route?.params,
          ...nameData,
        });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('OTPVerification', route?.params);
        }
      }}
    />
  );
};

const EmailInputWrapper = ({ route, navigation }) => {
  return (
    <EmailInputScreen
      route={route}
      onContinue={(emailData) => {
        navigation.navigate('ProfilePhoto', {
          ...route?.params,
          ...emailData,
        });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('NameInput', route?.params);
        }
      }}
    />
  );
};

const ProfilePhotoWrapper = ({ route, navigation }) => {
  return (
    <ProfilePhotoScreen
      route={route}
      onContinue={(photoData) => {
        navigation.navigate('SetPassword', {
          ...route?.params,
          ...photoData,
        });
      }}
      onSkip={(photoData) => {
        navigation.navigate('SetPassword', {
          ...route?.params,
          ...photoData,
        });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('EmailInput', route?.params);
        }
      }}
    />
  );
};

const SetPasswordWrapper = ({ route, navigation }) => {
  return (
    <SetPasswordScreen
      route={route}
      onContinue={(pwdData) => {
        navigation.navigate('TermsPrivacy', {
          ...route?.params,
          ...pwdData,
        });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('ProfilePhoto', route?.params);
        }
      }}
    />
  );
};

const TermsPrivacyWrapper = ({ route, navigation }) => {
  const { useAuth } = require('../context/AuthContext');
  const { login } = useAuth();
  const role = route?.params?.role || 'passenger';
  const isDriver = role === 'driver';

  return (
    <TermsPrivacyScreen
      route={route}
      onAgree={async (termsData) => {
        const fullRegistrationData = {
          ...route?.params,
          ...termsData,
        };

        if (isDriver) {
          // Driver proceeds to progressive Driver Onboarding Step 1
          navigation.navigate('DriverDetails', fullRegistrationData);
        } else {
          // Passenger completes registration directly
          const rawPhone = fullRegistrationData.normalizedNumber || fullRegistrationData.phoneNumber || fullRegistrationData.rawNumber;
          const cleanPhone = (rawPhone || '').replace(/\s+/g, '');
          const cleanEmail = (fullRegistrationData.email || '').trim().toLowerCase();
          const cleanFullName = fullRegistrationData.fullName || `${fullRegistrationData.firstName || ''} ${fullRegistrationData.lastName || ''}`.trim();

          const payload = fullRegistrationData.photoUri
            ? (() => {
                const fd = new FormData();
                fd.append('fullName', cleanFullName);
                fd.append('email', cleanEmail);
                fd.append('phoneNumber', cleanPhone);
                fd.append('password', fullRegistrationData.password);
                fd.append('role', 'passenger');
                fd.append('profilePhoto', {
                  uri: fullRegistrationData.photoUri,
                  name: 'profile.jpg',
                  type: 'image/jpeg',
                });
                return fd;
              })()
            : {
                fullName: cleanFullName,
                email: cleanEmail,
                phoneNumber: cleanPhone,
                password: fullRegistrationData.password,
                role: 'passenger',
              };

          const response = await authService.register(payload);
          if (response?.success && response?.data) {
            const { user, token } = response.data;
            await login({ ...user, role: 'passenger' }, token);
          } else {
            throw new Error(response?.error?.message || response?.message || 'Registration failed');
          }
        }
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('SetPassword', route?.params);
        }
      }}
    />
  );
};

// --- Progressive Driver Onboarding Wrappers ---
const DriverDetailsWrapper = ({ route, navigation }) => {
  return (
    <DriverDetailsScreen
      route={route}
      onContinue={(driverDetailsData) => {
        navigation.navigate('VehicleDetails', {
          ...route?.params,
          ...driverDetailsData,
        });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('TermsPrivacy', route?.params);
        }
      }}
    />
  );
};

const VehicleDetailsWrapper = ({ route, navigation }) => {
  return (
    <VehicleDetailsScreen
      route={route}
      onContinue={(vehicleData) => {
        navigation.navigate('DriverDocuments', {
          ...route?.params,
          ...vehicleData,
        });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('DriverDetails', route?.params);
        }
      }}
    />
  );
};

const DriverDocumentsWrapper = ({ route, navigation }) => {
  return (
    <DriverDocumentsScreen
      route={route}
      onSubmit={async (submissionData) => {
        const fullDriverData = {
          ...route?.params,
          ...submissionData,
        };

        const rawPhone = fullDriverData.normalizedNumber || fullDriverData.phoneNumber || fullDriverData.rawNumber;
        const cleanPhone = (rawPhone || '').replace(/\s+/g, '');
        const cleanEmail = (fullDriverData.email || '').trim().toLowerCase();
        const cleanFullName = fullDriverData.fullName || `${fullDriverData.firstName || ''} ${fullDriverData.lastName || ''}`.trim();

        const formData = new FormData();
        formData.append('fullName', cleanFullName);
        formData.append('email', cleanEmail);
        formData.append('phoneNumber', cleanPhone);
        formData.append('password', fullDriverData.password);
        formData.append('role', 'driver');
        formData.append('vehicleModel', fullDriverData.vehicleModel || '');
        formData.append('vehicleLicensePlate', fullDriverData.vehicleLicensePlate || '');
        formData.append('vehicleColor', fullDriverData.vehicleColor || '');
        formData.append('physicalCapacity', String(fullDriverData.physicalCapacity || 4));
        formData.append('chosenSharedCapacity', String(fullDriverData.physicalCapacity || 4));

        if (fullDriverData.licenseFile?.uri) {
          formData.append('licenseFile', {
            uri: fullDriverData.licenseFile.uri,
            name: fullDriverData.licenseFile.name || 'license.jpg',
            type: fullDriverData.licenseFile.type || 'image/jpeg',
          });
        }
        if (fullDriverData.ghanaCardFront?.uri) {
          formData.append('ghanaCardFront', {
            uri: fullDriverData.ghanaCardFront.uri,
            name: fullDriverData.ghanaCardFront.name || 'ghana_front.jpg',
            type: fullDriverData.ghanaCardFront.type || 'image/jpeg',
          });
        }
        if (fullDriverData.ghanaCardBack?.uri) {
          formData.append('ghanaCardBack', {
            uri: fullDriverData.ghanaCardBack.uri,
            name: fullDriverData.ghanaCardBack.name || 'ghana_back.jpg',
            type: fullDriverData.ghanaCardBack.type || 'image/jpeg',
          });
        }
        if (fullDriverData.insuranceFile?.uri) {
          formData.append('insuranceFile', {
            uri: fullDriverData.insuranceFile.uri,
            name: fullDriverData.insuranceFile.name || 'insurance.jpg',
            type: fullDriverData.insuranceFile.type || 'image/jpeg',
          });
        }

        const response = await authService.register(formData);
        if (response?.success) {
          navigation.navigate('DriverVerificationPending', fullDriverData);
        } else {
          throw new Error(response?.error?.message || response?.message || 'Driver registration could not be completed.');
        }
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('VehicleDetails', route?.params);
        }
      }}
    />
  );
};

const DriverVerificationPendingWrapper = ({ route, navigation }) => {
  return (
    <DriverVerificationPendingScreen
      route={route}
      onBackToSignIn={() => {
        navigation.navigate('SignIn', { role: 'driver' });
      }}
      onContactSupport={() => {
        // Can open campus security phone / contact
      }}
    />
  );
};

// --- Sign In & Password Recovery Wrappers ---
const SignInWrapper = ({ route, navigation }) => {
  const { useAuth } = require('../context/AuthContext');
  const { login } = useAuth();
  const role = route?.params?.role || 'passenger';

  return (
    <SignInScreen
      route={route}
      onSignInSuccess={async (authPayload) => {
        if (authPayload?.success) {
          const { user, token } = authPayload.data || {};
          if (user && token) {
            await login({ ...user, role: user.role || role }, token);
          }
        }
      }}
      onRegister={() => {
        navigation.navigate('PhoneInput', { role });
      }}
      onForgotPassword={() => {
        navigation.navigate('ForgotPassword', { role });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('AuthGateway', { role });
        }
      }}
    />
  );
};

const ForgotPasswordWrapper = ({ route, navigation }) => {
  return (
    <ForgotPasswordScreen
      route={route}
      onSendCode={(recoveryData) => {
        navigation.navigate('RecoveryOTP', {
          ...route?.params,
          ...recoveryData,
          isRecovery: true,
        });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('SignIn', route?.params);
        }
      }}
    />
  );
};

const RecoveryOTPWrapper = ({ route, navigation }) => {
  return (
    <OTPVerificationScreen
      route={route}
      onVerifySuccess={(data) => {
        // TODO(CAMPUSRIDE-AUTH): TEMPORARY DEV-ONLY OTP BYPASS
        navigation.navigate('ResetPassword', {
          ...route?.params,
          ...data,
          isRecoveryVerified: true,
        });
      }}
      onEditPhone={() => {
        navigation.navigate('ForgotPassword', route?.params);
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('ForgotPassword', route?.params);
        }
      }}
    />
  );
};

const ResetPasswordWrapper = ({ route, navigation }) => {
  return (
    <ResetPasswordScreen
      route={route}
      onResetSuccess={(resetData) => {
        navigation.navigate('PasswordUpdated', {
          ...route?.params,
          ...resetData,
        });
      }}
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('RecoveryOTP', route?.params);
        }
      }}
    />
  );
};

const PasswordUpdatedWrapper = ({ route, navigation }) => {
  return (
    <PasswordUpdatedScreen
      route={route}
      onSignIn={() => {
        navigation.navigate('SignIn', { role: route?.params?.role || 'passenger' });
      }}
    />
  );
};

// --- Preserved Legacy Wrappers ---
const PassengerLoginWrapper = ({ navigation }) => {
  const { useAuth } = require('../context/AuthContext');
  const { login } = useAuth();

  return (
    <PassengerLogin
      onPassengerLogin={async (authPayload) => {
        if (authPayload?.success) {
          const { user, token } = authPayload.data || {};
          if (user && token) {
            await login({ ...user, role: 'passenger' }, token);
          }
        }
      }}
      onCreateAccount={() => navigation.navigate('PhoneInput', { role: 'passenger' })}
      onGoogleLogin={async (authPayload) => {
        if (authPayload?.success) {
          const { user, token } = authPayload.data || {};
          if (user && token) {
            await login({ ...user, role: 'passenger' }, token);
          }
        }
      }}
      onBack={() => navigation.navigate('AuthGateway', { role: 'passenger' })}
    />
  );
};

const DriverLoginWrapper = ({ navigation }) => {
  const { useAuth } = require('../context/AuthContext');
  const { login } = useAuth();

  return (
    <DriverLogin
      onDriverLogin={async (authPayload) => {
        if (authPayload?.success) {
          const { user, token } = authPayload.data || {};
          if (user && token) {
            await login({ ...user, role: 'driver' }, token);
          }
        }
      }}
      onDriverRegister={() => navigation.navigate('PhoneInput', { role: 'driver' })}
      onSupport={() => console.log('Support clicked')}
      onBack={() => navigation.navigate('AuthGateway', { role: 'driver' })}
    />
  );
};

const SignupWrapper = ({ route, navigation }) => {
  const { useAuth } = require('../context/AuthContext');
  const { login } = useAuth();
  const role = route?.params?.role || 'passenger';

  return (
    <SignupScreen
      route={route}
      onDone={async (authPayload) => {
        if (authPayload?.success) {
          const { user, token } = authPayload.data || {};
          if (user && token) {
            await login({ ...user, role }, token);
          }
        }
      }}
      onSignIn={() => {
        navigation.navigate('SignIn', { role });
      }}
      onBack={() => navigation.navigate('AuthGateway', { role })}
    />
  );
};

let registrationFormCache = {
  fullName: '',
  phoneNumber: '',
  email: '',
  password: '',
  vehicleType: 'Campus Sedan',
  vehicleModel: '',
  vehicleLicensePlate: '',
  vehicleColor: '',
  seats: '',
};

const DriverReg1Wrapper = ({ navigation }) => {
  return (
    <DriverRegisterStep1
      initialData={registrationFormCache}
      onNext={(personalData) => {
        registrationFormCache = { ...registrationFormCache, ...personalData };
        navigation.navigate('DriverRegisterStep2');
      }}
      onBack={() => navigation.navigate('DriverLogin')}
      onLogin={() => navigation.navigate('DriverLogin')}
    />
  );
};

const DriverReg2Wrapper = ({ navigation }) => {
  return (
    <DriverRegisterStep2
      initialData={registrationFormCache}
      onNext={(vehicleData) => {
        registrationFormCache = { ...registrationFormCache, ...vehicleData };
        navigation.navigate('DriverRegisterStep3');
      }}
      onBack={() => navigation.navigate('DriverRegisterStep1')}
      onLogin={() => navigation.navigate('DriverLogin')}
    />
  );
};

const DriverReg3Wrapper = ({ navigation }) => {
  return (
    <DriverRegisterStep3
      initialData={registrationFormCache}
      onSubmit={async () => {
        navigation.navigate('DriverRegisterSuccess');
      }}
      onBack={() => navigation.navigate('DriverRegisterStep2')}
      onLogin={() => navigation.navigate('DriverLogin')}
    />
  );
};

const DriverRegSuccessWrapper = ({ navigation }) => {
  return <DriverRegisterSuccess onBackToLogin={() => navigation.navigate('DriverLogin')} />;
};

export default AuthNavigator;
