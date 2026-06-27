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

        {/* Updated Microcopy clarifying SMS & Email channels */}
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
  // Main Canvas Container
  container: {
    flex: 1,
    backgroundColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // Centered Alert Box Card
  statusCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },

  // Geometric Vector Clock Properties
  clockIconWrap: {
    marginBottom: 24,
  },
  clockFace: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#3B82F6",
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

  // Typography Specifications
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  highlightText: {
    fontWeight: "700",
    color: "#1E3A8A",
  },

  // Nav Controller Anchor Link Button
  actionBtn: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingHorizontal: 28,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default DriverRegisterSuccess;
