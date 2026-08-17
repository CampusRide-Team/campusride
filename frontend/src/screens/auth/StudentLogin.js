// StudentLogin.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NAVY = '#10206B';
const BLUE = '#2F6BFF';
const MUTED = '#8A8FA3';
const TEXT = '#0F1733';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F8FAFC';
const BORDER = '#E2E8F0';

const API_BASE_URL = 'https://c5m62bwc-5000.uks1.devtunnels.ms/api/v1/auth';

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  secureTextEntry = false,
  icon,
  rightAction,
  rightLabel,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {rightLabel && (
          <TouchableOpacity onPress={rightLabel.onPress} activeOpacity={0.7}>
            <Text style={styles.fieldLabelRight}>{rightLabel.text}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
        <Ionicons
          name={icon}
          size={18}
          color={isFocused ? BLUE : MUTED}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightAction && (
          <TouchableOpacity
            style={styles.inputRightAction}
            onPress={rightAction.onPress}
            activeOpacity={0.7}
          >
            <Ionicons name={rightAction.icon} size={18} color={MUTED} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const LogoIcon = () => (
  <View style={styles.iconWrap}>
    <View style={styles.iconCard}>
      <View style={styles.carWrap}>
        <View style={styles.carRoof} />
        <View style={styles.carBase}>
          <View style={[styles.wheel, { left: 5 }]} />
          <View style={[styles.wheel, { right: 5 }]} />
        </View>
      </View>
    </View>
  </View>
);

const StudentLogin = ({
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
          role: 'student' 
        };

        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const textResponse = await response.text();
        let result;
        try {
          result = JSON.parse(textResponse);
        } catch (e) {
          throw new Error(`Server error (${response.status}): Invalid response format.`);
        }

        if (!response.ok) {
          let serverMsg = "Invalid credentials";
          if (result && result.error && result.error.message) serverMsg = result.error.message;
          else if (result && result.message) serverMsg = result.message;
          throw new Error(serverMsg);
        }

        // Transition to OTP input state
        setLoading(false);
        setIsOtpSent(true);

      } catch (err) {
        setLoading(false);
        setErrors({ general: err.message || "Login failed. Please try again." });
      }
    } else {
      if (!validateOtp()) return;
      setLoading(true);
      setErrors({});

      try {
        const payload = { email: trimmedInput, otpCode };

        const response = await fetch(`${API_BASE_URL}/login/verify-otp`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const textResponse = await response.text();
        let result;
        try {
          result = JSON.parse(textResponse);
        } catch (e) {
          throw new Error(`Server error (${response.status}): Invalid response format.`);
        }

        if (!response.ok) {
          let serverMsg = "Incorrect or expired OTP verification code.";
          if (result && result.error && result.error.message) serverMsg = result.error.message;
          else if (result && result.message) serverMsg = result.message;
          throw new Error(serverMsg);
        }

        if (result.data && result.data.token) {
          await AsyncStorage.setItem('user_token', result.data.token);
          await AsyncStorage.setItem('token', result.data.token);
        }

        setLoading(false);
        if (onStudentLogin) onStudentLogin(result); // 🔑 Pass full result payload up to App.js

      } catch (err) {
        setLoading(false);
        setErrors({ general: err.message || "OTP verification failed." });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <LogoIcon />
          <Text style={styles.appName}>CampusRide</Text>
          <Text style={styles.appTagline}>Safe rides for students</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Login</Text>
          <Text style={styles.cardSubtitle}>
            {isOtpSent
              ? "Enter the confirmation token sent to your device"
              : "Access your campus mobility panel account"}
          </Text>

          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          {!isOtpSent ? (
            <>
              <InputField
                label="Email or Phone Number"
                placeholder="Enter email or phone number"
                value={identifier}
                onChangeText={(v) => {
                  setIdentifier(v);
                  setErrors((e) => ({ ...e, identifier: null }));
                }}
                keyboardType="default"
                icon="person-outline"
              />
              {errors.identifier && (
                <Text style={styles.errorText}>{errors.identifier}</Text>
              )}

              <InputField
                label="Password"
                placeholder="Enter your security password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setErrors((e) => ({ ...e, password: null }));
                }}
                secureTextEntry={!showPassword}
                icon="lock-closed-outline"
                rightAction={{
                  icon: showPassword ? "eye-off-outline" : "eye-outline",
                  onPress: () => setShowPassword((s) => !s),
                }}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </>
          ) : (
            <>
              <InputField
                label="Verification OTP Code"
                placeholder="e.g. 4082"
                value={otpCode}
                onChangeText={(v) => {
                  setOtpCode(v);
                  setErrors((e) => ({ ...e, otpCode: null }));
                }}
                keyboardType="number-pad"
                icon="keypad-outline"
                rightLabel={{
                  text: "Change Details?",
                  onPress: () => setIsOtpSent(false),
                }}
              />
              {errors.otpCode && (
                <Text style={styles.errorText}>{errors.otpCode}</Text>
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleActionClick}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>
                {isOtpSent ? "Verify & Login  →" : "Send OTP Verification"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCreateAccount}
            activeOpacity={0.7}
            style={styles.createAccountBtn}
          >
            <Text style={styles.createAccountText}>
              Don't have an account?{" "}
              <Text style={styles.createAccountLink}>Create Account</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={onGoogleLogin}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={18} color="#DB4437" />
            <Text style={styles.googleBtnText}>
              Continue with Google Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onBack}
            style={[styles.supportRow, { marginTop: 16 }]}
            activeOpacity={0.7}
          >
            <Text style={styles.supportLink}>← Change Access Role</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SCREEN_BG },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoSection: { alignItems: "center", marginBottom: 24, gap: 4 },
  iconWrap: { position: "relative", marginBottom: 8 },
  iconCard: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: "900",
    color: NAVY,
    letterSpacing: -0.5,
  },
  appTagline: { fontSize: 13, color: MUTED, fontWeight: "600" },
  carWrap: { alignItems: "center" },
  carRoof: {
    width: 24,
    height: 12,
    backgroundColor: "white",
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    marginBottom: -1,
  },
  carBase: { width: 38, height: 15, backgroundColor: "white", borderRadius: 3 },
  wheel: {
    position: "absolute",
    bottom: -5,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: NAVY,
    borderWidth: 2.5,
    borderColor: "white",
  },
  card: {
    width: "100%",
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  errorBannerText: { fontSize: 13, fontWeight: "600", color: "#DC2626" },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
  fieldWrap: { marginBottom: 16 },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: TEXT, letterSpacing: 0.2 },
  fieldLabelRight: { fontSize: 13, fontWeight: "800", color: NAVY },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 16,
  },
  inputRowFocused: {
    borderColor: BLUE,
    backgroundColor: '#FAFCFF',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
    fontWeight: "600",
    height: "100%",
  },
  inputIcon: { marginRight: 10 },
  inputRightAction: { paddingLeft: 8 },
  loginBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    backgroundColor: NAVY,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginBtnDisabled: { opacity: 0.65 },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  createAccountBtn: { alignItems: "center", paddingVertical: 14 },
  createAccountText: {
    fontSize: 14,
    color: MUTED,
    fontWeight: "600",
    textAlign: "center",
  },
  createAccountLink: { color: NAVY, fontWeight: "800" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { fontSize: 13, fontWeight: "600", color: "#94A3B8" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    marginTop: 4,
  },
  googleBtnText: { fontSize: 15, fontWeight: "700", color: TEXT },
  supportRow: { alignItems: "center", paddingVertical: 4 },
  supportLink: { color: NAVY, fontWeight: "800", fontSize: 14 },
});

export default StudentLogin;