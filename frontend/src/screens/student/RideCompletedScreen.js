import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
  FontAwesome5,
} from "@expo/vector-icons";

const BLUE = "#122A6B";
const TEXT = "#0F1733";
const MUTED = "#6B7280";
const BG = "#F5F7FB";
const CARD = "#FFFFFF";
const GREEN = "#8BC53F";
const GREEN_SOFT = "#EAF4D6";
const BLUE_SOFT = "#E4E9F7";
const TAB_ACTIVE_BG = "#E8ECFF";
const BORDER = "#E5E7EB";

export default function RideCompletedScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Success check */}
        <View style={styles.checkWrap}>
          <View style={styles.checkCircle}>
            <Feather name="check" size={54} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>Ride Completed</Text>
        <Text style={styles.subtitle}>You have arrived at your destination.</Text>

        {/* Details card */}
        <View style={styles.card}>
          {/* Pickup */}
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: BLUE_SOFT }]}>
              <Ionicons name="location-sharp" size={20} color={BLUE} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.label}>Pickup Location</Text>
              <Text style={styles.place}>Student Union Building</Text>
              <Text style={styles.address}>123 Campus Drive</Text>
            </View>
          </View>

          <View style={styles.dashed} />

          {/* Destination */}
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: GREEN_SOFT }]}>
              <FontAwesome5 name="flag-checkered" size={16} color={GREEN} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.label}>Destination</Text>
              <Text style={styles.place}>Engineering Library</Text>
              <Text style={styles.address}>456 Research Boulevard</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: BLUE_SOFT }]}>
                <Ionicons name="time-outline" size={20} color={BLUE} />
              </View>
              <Text style={styles.statLabel}>Total Time</Text>
              <Text style={styles.statValue}>12 min</Text>
            </View>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: GREEN_SOFT }]}>
                <FontAwesome5 name="dollar-sign" size={16} color={GREEN} />
              </View>
              <Text style={styles.statLabel}>Final Cost</Text>
              <Text style={styles.statValue}>$4.50</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9}>
          <Text style={styles.primaryBtnText}>Rate Driver</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.9}>
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        <TabItem
          label="Home"
          active
          icon={<Ionicons name="home" size={22} color={BLUE} />}
        />
        <TabItem
          label="Rides"
          icon={<MaterialCommunityIcons name="car-outline" size={22} color={MUTED} />}
        />
        <TabItem
          label="Alerts"
          icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />}
        />
        <TabItem
          label="Profile"
          icon={<Feather name="user" size={22} color={MUTED} />}
        />
      </View>
    </SafeAreaView>
  );
}

function TabItem({ label, icon, active }) {
  return (
    <TouchableOpacity style={styles.tabItem} activeOpacity={0.8}>
      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
        {icon}
      </View>
      <Text style={[styles.tabLabel, active && { color: BLUE, fontWeight: "600" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { padding: 20, paddingBottom: 40 },

  checkWrap: { alignItems: "center", marginTop: 16 },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GREEN,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: MUTED,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowText: { flex: 1 },
  label: { fontSize: 13, color: MUTED, marginBottom: 4 },
  place: { fontSize: 16, fontWeight: "700", color: TEXT },
  address: { fontSize: 13, color: MUTED, marginTop: 2 },

  dashed: {
    borderStyle: "dashed",
    borderTopWidth: 1,
    borderColor: BORDER,
    marginVertical: 16,
    marginLeft: 54,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 18,
  },

  stats: { flexDirection: "row" },
  stat: { flex: 1 },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statLabel: { fontSize: 13, color: MUTED, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "800", color: TEXT },

  primaryBtn: {
    marginTop: 24,
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: BLUE,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  secondaryBtn: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  secondaryBtnText: { color: TEXT, fontSize: 16, fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabIconWrap: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
});