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

// Reusable input field component
const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  secureTextEntry = false,
  icon,
  rightAction,
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
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

// Branding vector car icon element
const CarIcon = () => (
  <View style={styles.carWrap}>
    <View style={styles.carRoof} />
    <View style={styles.carBase}>
      <View style={[styles.wheel, { left: 5 }]} />
      <View style={[styles.wheel, { right: 5 }]} />
    </View>
  </View>
);

// Main signup component controller
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
  const [errors, setErrors] = useState({});

  // Client-side application data validation runner
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

  // Asynchronous backend register application handshake
  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const sanitizedPhone = phone.trim().replace(/\s+/g, "");

    try {
      // TODO: BACKEND INTEGRATION (Universal Registration Network Payload)
      // const response = await fetch('https://your-api-url/api/v1/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     fullName: fullName.trim(),
      //     phone: sanitizedPhone,
      //     email: email.trim().toLowerCase(),
      //     password,
      //     role: 'student'
      //   })
      // })
      // const result = await response.json()
      // if (!response.ok) throw new Error(result.message || 'Registration failed')
      // await AsyncStorage.setItem('token', result.token)

      setTimeout(() => {
        setLoading(false);
        if (onDone) onDone();
      }, 1200);
    } catch (err) {
      setLoading(false);
      setErrors({
        general: err.message || "Something went wrong. Please try again.",
      });
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
        {/* Header system identity section */}
        <View style={styles.logoSection}>
          <View style={styles.iconCard}>
            <CarIcon />
          </View>
          <Text style={styles.appName}>CampusRide</Text>
          <Text style={styles.appTagline}>
            Universal mobility services for campus transit
          </Text>
        </View>

        {/* Master input layout card wrapper */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.cardSubtitle}>
            Sign up using your personal details
          </Text>

          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          {/* Full name configuration node */}
          <InputField
            label="Full Name"
            placeholder="Full name"
            value={fullName}
            onChangeText={(v) => {
              setFullName(v);
              setErrors((e) => ({ ...e, fullName: null }));
            }}
            icon="person-outline"
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}

          {/* Phone identity configuration node */}
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
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          {/* Communication channel email node */}
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
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Security credential password input */}
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
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Secondary security verification confirmation */}
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
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          {/* Interactive compliance selector box row */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => {
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

          {/* Primary core account genesis submission hook */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSignup}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* View redirection control footer button */}
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

          {/* Structural layout design splitter group */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Secondary Google ecosystem sign in method */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleSignup}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={18} color="#DB4437" />
            <Text style={styles.googleBtnText}>
              Continue with Google Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // ── Layout Canvas Bounds ──
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 24,
    gap: 4,
  },
  iconCard: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
  appTagline: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "500",
  },
  carWrap: {
    alignItems: "center",
  },
  carRoof: {
    width: 24,
    height: 12,
    backgroundColor: "white",
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    marginBottom: -1,
  },
  carBase: {
    width: 38,
    height: 15,
    backgroundColor: "white",
    borderRadius: 3,
  },
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
    marginBottom: 16,
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
  errorBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E2937",
    marginBottom: 8,
  },
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
  inputIcon: {
    marginRight: 10,
  },
  inputRightAction: {
    paddingLeft: 8,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#1E3A8A",
    borderColor: "#1E3A8A",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  termsLink: {
    color: "#1E3A8A",
    fontWeight: "700",
  },
  submitBtn: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "#1E3A8A",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  signInBtn: {
    alignItems: "center",
    paddingVertical: 4,
    marginBottom: 14,
  },
  signInText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
  },
  signInLink: {
    color: "#1E3A8A",
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94A3B8",
  },
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
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
});

export default SignupScreen;
