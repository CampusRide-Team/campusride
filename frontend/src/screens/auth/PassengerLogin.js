import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api/axios";

// Modern Electric Vehicle Visual Graphic
const EVIllustration = () => (
  <View style={styles.evContainer}>
    <View style={styles.evBody}>
      <View style={styles.evRoof} />
      <View style={styles.evHood} />
      <View style={styles.evTrunk} />
      <View style={styles.evWindowFront} />
      <View style={styles.evWindowRear} />
      <View style={styles.evDoorLine} />
      <View style={styles.evHandle} />
      <View style={styles.evHeadlight} />
      <View style={styles.evTaillight} />
      <View style={styles.evChargingPort}>
        <Ionicons name="flash" size={7} color="#22C55E" />
      </View>
      <View style={styles.wheelArchFront}>
        <View style={styles.wheel}>
          <View style={styles.wheelRim} />
          <View style={styles.wheelSpokeH} />
          <View style={styles.wheelSpokeV} />
          <View style={styles.wheelCenter} />
        </View>
      </View>
      <View style={styles.wheelArchRear}>
        <View style={styles.wheel}>
          <View style={styles.wheelRim} />
          <View style={styles.wheelSpokeH} />
          <View style={styles.wheelSpokeV} />
          <View style={styles.wheelCenter} />
        </View>
      </View>
      <View style={styles.evShadow} />
    </View>
    <View style={styles.roadLine} />
  </View>
);

const PassengerLogin = ({
  onPassengerLogin,
  onStudentLogin,
  onCreateAccount,
  onGoogleLogin,
  onBack,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateCredentials = () => {
    const newErrors = {};
    if (!identifier.trim()) {
      newErrors.identifier = "Email or phone number is required";
    }
    if (!password.trim()) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors = {};
    if (!otpCode.trim()) {
      newErrors.otpCode = "Verification OTP code is required";
    } else if (otpCode.trim().length < 4) {
      newErrors.otpCode = "Enter complete verification code";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActionClick = async () => {
    const trimmedInput = identifier.trim();

    if (!isOtpSent) {
      if (!validateCredentials()) return;
      setLoading(true);
      setErrors({});

      try {
        const payload = { 
          email: trimmedInput, 
          password, 
          role: 'passenger' 
        };

        const response = await api.post('/auth/login', payload);
        const result = response.data;

        if (!result.success) {
          throw new Error(result.error?.message || "Invalid credentials");
        }

        // MVP Direct Login: If the backend returns a token, complete login immediately
        // without requiring OTP verification. OTP flow is preserved for future re-enablement.
        if (result.data && result.data.token) {
          await AsyncStorage.setItem('user_token', result.data.token);
          await AsyncStorage.setItem('token', result.data.token);

          setLoading(false);
          const loginHandler = onPassengerLogin || onStudentLogin;
          if (loginHandler) loginHandler(result);
          return;
        }

        // Future OTP flow: If backend does NOT return a token (OTP required),
        // transition to OTP verification state
        setLoading(false);
        setIsOtpSent(true);

      } catch (err) {
        setLoading(false);
        const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Login failed. Please try again.";
        setErrors({ general: errorMsg });
      }
    } else {
      // OTP verification step (preserved for future re-enablement)
      if (!validateOtp()) return;
      setLoading(true);
      setErrors({});

      try {
        const payload = { email: trimmedInput, otpCode: otpCode.trim() };

        const response = await api.post('/auth/login/verify-otp', payload);
        const result = response.data;

        if (!result.success) {
          throw new Error(result.error?.message || "Incorrect or expired OTP verification code.");
        }

        if (result.data && result.data.token) {
          await AsyncStorage.setItem('user_token', result.data.token);
          await AsyncStorage.setItem('token', result.data.token);
        }

        setLoading(false);
        const loginHandler = onPassengerLogin || onStudentLogin;
        if (loginHandler) loginHandler(result);

      } catch (err) {
        setLoading(false);
        const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "OTP verification failed.";
        setErrors({ general: errorMsg });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        {onBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
        )}

        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Text style={styles.appName}>CampusRide</Text>
          <Text style={styles.appTagline}>Safe rides for everyone on campus</Text>
        </View>

        {/* EV Illustration */}
        <EVIllustration />

        {/* Main Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isOtpSent ? "Enter Verification Code" : "Passenger Login"}
          </Text>
          <Text style={styles.cardSubtitle}>
            {isOtpSent
              ? `We sent a 6-digit code to ${identifier}`
              : "Welcome back! Please enter your details"}
          </Text>

          {/* General Error Message */}
          {errors.general ? (
            <View style={styles.generalErrorBanner}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          {!isOtpSent ? (
            <>
              {/* Email / Phone Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email or Phone Number</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.identifier && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="student@university.edu"
                    placeholderTextColor="#94A3B8"
                    value={identifier}
                    onChangeText={(text) => {
                      setIdentifier(text);
                      if (errors.identifier) {
                        setErrors((prev) => ({ ...prev, identifier: null }));
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>
                {errors.identifier ? (
                  <Text style={styles.errorText}>{errors.identifier}</Text>
                ) : null}
              </View>

              {/* Password Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.password && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors((prev) => ({ ...prev, password: null }));
                      }
                    }}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((p) => !p)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>
            </>
          ) : (
            /* OTP Field */
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>6-Digit Verification Code</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.otpCode && styles.inputError,
                ]}
              >
                <Ionicons
                  name="key-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP code"
                  placeholderTextColor="#94A3B8"
                  value={otpCode}
                  onChangeText={(text) => {
                    setOtpCode(text);
                    if (errors.otpCode) {
                      setErrors((prev) => ({ ...prev, otpCode: null }));
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>
              {errors.otpCode ? (
                <Text style={styles.errorText}>{errors.otpCode}</Text>
              ) : null}

              <TouchableOpacity
                onPress={() => {
                  setIsOtpSent(false);
                  setOtpCode("");
                  setErrors({});
                }}
                style={styles.resendBtn}
              >
                <Text style={styles.resendText}>← Back to password login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleActionClick}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isOtpSent ? "Verify & Log In" : "Log In"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          {!isOtpSent && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={onGoogleLogin}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Create Account Link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={onCreateAccount}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 8,
    padding: 4,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E3A8A",
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  evContainer: {
    width: "100%",
    height: 90,
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  evBody: {
    width: 140,
    height: 50,
    position: "relative",
  },
  evRoof: {
    position: "absolute",
    top: 0,
    left: 28,
    width: 75,
    height: 24,
    backgroundColor: "#1E3A8A",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 10,
  },
  evHood: {
    position: "absolute",
    top: 20,
    right: 0,
    width: 40,
    height: 22,
    backgroundColor: "#2563EB",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 4,
  },
  evTrunk: {
    position: "absolute",
    top: 20,
    left: 0,
    width: 35,
    height: 22,
    backgroundColor: "#1D4ED8",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 4,
  },
  evWindowFront: {
    position: "absolute",
    top: 3,
    left: 68,
    width: 30,
    height: 18,
    backgroundColor: "#BAE6FD",
    borderTopRightRadius: 6,
  },
  evWindowRear: {
    position: "absolute",
    top: 3,
    left: 33,
    width: 30,
    height: 18,
    backgroundColor: "#BAE6FD",
    borderTopLeftRadius: 8,
  },
  evDoorLine: {
    position: "absolute",
    top: 22,
    left: 65,
    width: 1.5,
    height: 20,
    backgroundColor: "#1E40AF",
  },
  evHandle: {
    position: "absolute",
    top: 25,
    left: 52,
    width: 8,
    height: 2.5,
    backgroundColor: "#93C5FD",
    borderRadius: 1,
  },
  evHeadlight: {
    position: "absolute",
    top: 24,
    right: 0,
    width: 5,
    height: 7,
    backgroundColor: "#FDE047",
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  evTaillight: {
    position: "absolute",
    top: 23,
    left: 0,
    width: 4,
    height: 7,
    backgroundColor: "#EF4444",
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  evChargingPort: {
    position: "absolute",
    top: 24,
    left: 8,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
    alignItems: "center",
    justifyContent: "center",
  },
  wheelArchFront: {
    position: "absolute",
    bottom: -10,
    right: 18,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  wheelArchRear: {
    position: "absolute",
    bottom: -10,
    left: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  wheel: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#475569",
  },
  wheelRim: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    position: "absolute",
  },
  wheelSpokeH: {
    position: "absolute",
    width: 12,
    height: 1.5,
    backgroundColor: "#94A3B8",
  },
  wheelSpokeV: {
    position: "absolute",
    width: 1.5,
    height: 12,
    backgroundColor: "#94A3B8",
  },
  wheelCenter: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2563EB",
    position: "absolute",
  },
  evShadow: {
    position: "absolute",
    bottom: -12,
    left: 5,
    width: 130,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(30, 58, 138, 0.08)",
  },
  roadLine: {
    width: 200,
    height: 2,
    backgroundColor: "#E2E8F0",
    borderRadius: 1,
    marginTop: 10,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  generalErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 8,
  },
  generalErrorText: {
    fontSize: 12,
    color: "#DC2626",
    flex: 1,
    fontWeight: "500",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    height: 48,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    fontSize: 11,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 2,
    fontWeight: "500",
  },
  resendBtn: {
    marginTop: 10,
    alignSelf: "center",
  },
  resendText: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#1E3A8A",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    fontSize: 12,
    color: "#94A3B8",
    paddingHorizontal: 10,
    fontWeight: "500",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    height: 48,
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  signupPrompt: {
    fontSize: 13,
    color: "#64748B",
  },
  signupLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E3A8A",
  },
});

export default PassengerLogin;
