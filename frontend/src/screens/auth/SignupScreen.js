// SignupScreen.js
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
  editable = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, isFocused && styles.inputRowFocused, !editable && { backgroundColor: '#F1F5F9' }]}>
        <Ionicons
          name={icon}
          size={18}
          color={isFocused ? BLUE : MUTED}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, !editable && { color: MUTED }]}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightAction && editable && (
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

const CarIcon = () => (
  <View style={styles.carWrap}>
    <View style={styles.carRoof} />
    <View style={styles.carBase}>
      <View style={[styles.wheel, { left: 5 }]} />
      <View style={[styles.wheel, { right: 5 }]} />
    </View>
  </View>
);

const SignupScreen = ({ onDone, onSignIn }) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required";

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (phone.replace(/\s/g, "").length < 10) {
      newErrors.phone = "Enter a valid phone number";
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(email.trim().toLowerCase())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreed) newErrors.agreed = "You must agree to the terms to continue";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    const sanitizedPhone = phone.trim().replace(/\s+/g, "");

    try {
      const payload = {
        fullName: fullName.trim(),
        phoneNumber: sanitizedPhone,
        email: email.trim().toLowerCase(),
        password,
        role: 'student'
      };

      const response = await fetch(`${API_BASE_URL}/register`, {
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
        let serverMsg = "Registration failed";
        if (result) {
          if (typeof result.message === 'string') serverMsg = result.message;
          else if (typeof result.error === 'string') serverMsg = result.error;
          else if (typeof result.message === 'object') serverMsg = JSON.stringify(result.message);
          else serverMsg = JSON.stringify(result);
        }
        throw new Error(serverMsg);
      }

      setLoading(false);
      setSuccessMessage("Account created successfully! Redirecting to Sign In...");

      // Redirect to sign in view after 1.5 seconds
      setTimeout(() => {
        if (onSignIn) onSignIn();
      }, 1500);

    } catch (err) {
      setLoading(false);
      let errorMessage = "Registration failed. Please check your details.";
      if (typeof err.message === 'string') {
        errorMessage = err.message;
      } else if (err.message && typeof err.message === 'object') {
        errorMessage = JSON.stringify(err.message);
      }
      setErrors({ general: errorMessage });
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrors({});
    try {
      const response = await fetch(`${API_BASE_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Google authentication failed.');

      if (result.token) {
        await AsyncStorage.setItem('user_token', result.token);
      }

      setGoogleLoading(false);
      if (onDone) onDone();
    } catch (err) {
      setGoogleLoading(false);
      setErrors({ general: err.message || "Google sign-up failed. Please try again." });
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
          <View style={styles.iconCard}>
            <CarIcon />
          </View>
          <Text style={styles.appName}>CampusRide</Text>
          <Text style={styles.appTagline}>
            Universal mobility services for campus transit
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.cardSubtitle}>
            Sign up using your personal details
          </Text>

          {successMessage ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          ) : null}

          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          <InputField
            label="Full Name"
            placeholder="Full name"
            value={fullName}
            onChangeText={(v) => {
              setFullName(v);
              setErrors((e) => ({ ...e, fullName: null }));
            }}
            icon="person-outline"
            editable={!successMessage}
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}

          <InputField
            label="Phone Number"
            placeholder="Phone number"
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              setErrors((e) => ({ ...e, phone: null }));
            }}
            keyboardType="phone-pad"
            icon="call-outline"
            editable={!successMessage}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          <InputField
            label="Email Address"
            placeholder="Email address"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setErrors((e) => ({ ...e, email: null }));
            }}
            keyboardType="email-address"
            icon="mail-outline"
            editable={!successMessage}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <InputField
            label="Password"
            placeholder="Password"
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
            editable={!successMessage}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <InputField
            label="Confirm Password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              setErrors((e) => ({ ...e, confirmPassword: null }));
            }}
            secureTextEntry={!showConfirmPassword}
            icon="lock-closed-outline"
            rightAction={{
              icon: showConfirmPassword ? "eye-off-outline" : "eye-outline",
              onPress: () => setShowConfirmPassword((s) => !s),
            }}
            editable={!successMessage}
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => {
              if (successMessage) return;
              setAgreed((a) => !a);
              setErrors((e) => ({ ...e, agreed: null }));
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.agreed && (
            <Text style={styles.errorText}>{errors.agreed}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (loading || successMessage) && styles.submitBtnDisabled]}
            onPress={handleSignup}
            activeOpacity={0.85}
            disabled={loading || !!successMessage}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInBtn}
            onPress={onSignIn}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>
              Already have an account?{" "}
              <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, (googleLoading || successMessage) && styles.submitBtnDisabled]}
            onPress={handleGoogleSignup}
            activeOpacity={0.85}
            disabled={googleLoading || !!successMessage}
          >
            {googleLoading ? (
              <ActivityIndicator color={NAVY} size="small" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#DB4437" />
                <Text style={styles.googleBtnText}>Continue with Google Account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SCREEN_BG },
  scroll: { flexGrow: 1, alignItems: "center", paddingTop: 50, paddingBottom: 40, paddingHorizontal: 24 },
  logoSection: { alignItems: "center", marginBottom: 24, gap: 4 },
  iconCard: { width: 76, height: 76, borderRadius: 20, backgroundColor: NAVY, alignItems: "center", justifyContent: "center", marginBottom: 8, shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  appName: { fontSize: 26, fontWeight: "900", color: NAVY, letterSpacing: -0.5 },
  appTagline: { fontSize: 13, color: MUTED, textAlign: "center", fontWeight: "600" },
  carWrap: { alignItems: "center" },
  carRoof: { width: 24, height: 12, backgroundColor: "white", borderTopLeftRadius: 7, borderTopRightRadius: 7, marginBottom: -1 },
  carBase: { width: 38, height: 15, backgroundColor: "white", borderRadius: 3 },
  wheel: { position: "absolute", bottom: -5, width: 11, height: 11, borderRadius: 6, backgroundColor: NAVY, borderWidth: 2.5, borderColor: "white" },
  card: { width: "100%", backgroundColor: CARD_BG, borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: BORDER },
  cardTitle: { fontSize: 22, fontWeight: "900", color: TEXT, textAlign: "center", marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: MUTED, textAlign: "center", marginBottom: 20, fontWeight: "600" },
  errorBanner: { backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#EF4444" },
  errorBannerText: { fontSize: 13, fontWeight: "600", color: "#DC2626" },
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#DCFCE7", borderRadius: 12, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#16A34A", gap: 8 },
  successBannerText: { fontSize: 13, fontWeight: "700", color: "#166534", flex: 1 },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: -10, marginBottom: 12, marginLeft: 4, fontWeight: "600" },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: TEXT, marginBottom: 8, letterSpacing: 0.2 },
  inputRow: { flexDirection: "row", alignItems: "center", height: 52, paddingHorizontal: 16, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: BORDER, borderRadius: 16 },
  inputRowFocused: { borderColor: BLUE, backgroundColor: '#FAFCFF' },
  input: { flex: 1, fontSize: 15, color: TEXT, fontWeight: "600", height: "100%" },
  inputIcon: { marginRight: 10 },
  inputRightAction: { paddingLeft: 8 },
  termsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18, marginTop: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: "#CBD5E1", backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkboxChecked: { backgroundColor: NAVY, borderColor: NAVY },
  termsText: { flex: 1, fontSize: 13, color: MUTED, fontWeight: "600" },
  termsLink: { color: NAVY, fontWeight: "800" },
  submitBtn: { width: "100%", height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 16, backgroundColor: NAVY, shadowColor: NAVY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.3 },
  signInBtn: { alignItems: "center", paddingVertical: 4, marginBottom: 16 },
  signInText: { fontSize: 14, color: MUTED, fontWeight: "600", textAlign: "center" },
  signInLink: { color: NAVY, fontWeight: "800" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { fontSize: 13, fontWeight: "600", color: "#94A3B8" },
  googleBtn: { flexDirection: "row", alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#FFFFFF' },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: TEXT },
});

export default SignupScreen;