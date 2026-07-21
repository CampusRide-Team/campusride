import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";

const DriverRegisterSuccess = ({ onBackToLogin }) => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.statusCard}>
        {/* Custom Clock Icon Vector Illustration */}
        <View style={styles.clockIconWrap}>
          <View style={styles.clockFace}>
            <View style={styles.clockHandHour} />
            <View style={styles.clockHandMinute} />
          </View>
        </View>

        <Text style={styles.cardTitle}>Verification in Progress</Text>

        <Text style={styles.cardSubtitle}>
          Your documents are currently being reviewed by our campus admin team.
          You will receive an{" "}
          <Text style={styles.highlightText}>SMS and Email notification</Text>{" "}
          immediately once your account is activated.
        </Text>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onBackToLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Matches step backgrounds
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  statusCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  clockIconWrap: {
    marginBottom: 24,
  },
  clockFace: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#1E3A8A", // 🚀 Accent Matched to Step Theme
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  clockHandHour: {
    position: "absolute",
    width: 5,
    height: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    top: "25%",
  },
  clockHandMinute: {
    position: "absolute",
    width: 20,
    height: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    left: "50%",
    top: "50%",
    marginTop: -2.5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E3A8A", // 🚀 Title Matched to Step Theme
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#64748B", // Clean slate slate tint text
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  highlightText: {
    fontWeight: "700",
    color: "#1E3A8A",
  },
  actionBtn: {
    backgroundColor: "#1E3A8A", // 🚀 Button Matched to Step Theme
    borderRadius: 16,
    paddingHorizontal: 28,
    height: 56, // Normalized with step buttons heights
    alignItems: "center",
    justifyContent: "center",
    width: "100%", // Full width layout harmony
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default DriverRegisterSuccess;