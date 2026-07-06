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
}) => (
  <View style={styles.fieldWrap}>
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {rightLabel && (
        <TouchableOpacity onPress={rightLabel.onPress} activeOpacity={0.7}>
          <Text style={styles.fieldLabelRight}>{rightLabel.text}</Text>
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.inputRow}>
      <Ionicons
        name={icon}
        size={18}
        color="#64748B"
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
      />
      {rightAction && (
        <TouchableOpacity
          style={styles.inputRightAction}
          onPress={rightAction.onPress}
          activeOpacity={0.7}
        >
          <Ionicons name={rightAction.icon} size={18} color="#64748B" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateCredentials = () => {
    const newErrors = {};
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (phone.replace(/\s/g, "").length < 10) {
      newErrors.phone = "Enter a valid phone number";
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
      newErrors.otpCode = "Enter complete code verification payload";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActionClick = async () => {
    const sanitizedPhone = phone.trim().replace(/\s+/g, "");

    if (!isOtpSent) {
      // STEP 1: Requesting OTP via Password check validation gateway
      if (!validateCredentials()) return;
      setLoading(true);
      setErrors({});

      try {
        // TODO: BACKEND INTEGRATION (Verify Credentials & Request OTP stream)
        // const response = await fetch('https://your-api-url/api/v1/auth/login/request-otp', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ phone: sanitizedPhone, password, role: 'student' })
        // })
        // if (!response.ok) throw new Error('Invalid phone or password credentials.')

        setTimeout(() => {
          setLoading(false);
          setIsOtpSent(true);
        }, 1200);
      } catch (err) {
        setLoading(false);
        setErrors({ general: err.message });
      }
    } else {
      // STEP 2: Submitting OTP to execute core authentication handshake
      if (!validateOtp()) return;
      setLoading(true);
      setErrors({});

      try {
        // TODO: BACKEND INTEGRATION (Finalize auth token generation mapping)
        // const response = await fetch('https://your-api-url/api/v1/auth/login/verify-otp', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ phone: sanitizedPhone, otpCode })
        // })
        // const result = await response.json()
        // if (!response.ok) throw new Error('Incorrect or expired OTP verification token code.')
        // await AsyncStorage.setItem('token', result.token)

        setTimeout(() => {
          setLoading(false);
          if (onStudentLogin) onStudentLogin();
        }, 1200);
      } catch (err) {
        setLoading(false);
        setErrors({ general: err.message });
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
              {/* Phone Field */}
              <InputField
                label="Phone Number"
                placeholder="+233 XX XXX XXXX"
                value={phone}
                onChangeText={(v) => {
                  setPhone(v);
                  setErrors((e) => ({ ...e, phone: null }));
                }}
                keyboardType="phone-pad"
                icon="call-outline"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}

              {/* Password Field */}
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
              {/* OTP Field (Shown only after step-1 runs successfully) */}
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

          {/* Core Multi-stage Transaction Execution Button */}
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
  container: { flex: 1, backgroundColor: "#F8FAFC" },
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
    borderRadius: 16,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E3A8A",
    letterSpacing: -0.5,
  },
  appTagline: { fontSize: 14, color: "#64748B", fontWeight: "500" },
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
    backgroundColor: "#1E3A8A",
    borderWidth: 2.5,
    borderColor: "white",
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
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
    fontWeight: "500",
  },
  fieldWrap: { marginBottom: 16 },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#1E2937" },
  fieldLabelRight: { fontSize: 13, fontWeight: "700", color: "#1E3A8A" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
    height: "100%",
  },
  inputIcon: { marginRight: 10 },
  inputRightAction: { paddingLeft: 8 },
  loginBtn: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    backgroundColor: "#1E3A8A",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginBtnDisabled: { opacity: 0.65 },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  createAccountBtn: { alignItems: "center", paddingVertical: 14 },
  createAccountText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
  },
  createAccountLink: { color: "#1E3A8A", fontWeight: "700" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText: { fontSize: 13, fontWeight: "500", color: "#94A3B8" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    marginTop: 4,
  },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  supportRow: { alignItems: "center", paddingVertical: 4 },
  supportText: { fontSize: 14, color: "#64748B", textAlign: "center" },
  supportLink: { color: "#1E3A8A", fontWeight: "700" },
});

export default StudentLogin;
