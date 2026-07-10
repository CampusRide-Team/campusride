import React from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

const BLUE = "#122A6B";
const BLUE_DEEP = "#0F1F55";
const TEXT = "#0F1733";
const MUTED = "#8A8FA3";
const BG = "#FFFFFF";
const CARD = "#F1F3F8";
const LIME = "#C6F24E";
const LIGHT_BLUE_BG = "#EAF0FF";
const ICON_CIRCLE = "#EEF1F6";
const BORDER = "#ECEEF3";

const MAP_URL =
  "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80";
const DRIVER_URL =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80";

function TabItem({ label, icon, active }) {
  return (
    <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>{icon}</View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MapPin({ n, top, left }) {
  return (
    <View style={[styles.mapPinWrap, { top, left }]}>
      <View style={styles.mapPin}>
        <MaterialCommunityIcons name="car" size={16} color="#fff" />
      </View>
      <View style={styles.mapPinBadge}>
        <Text style={styles.mapPinBadgeText}>{n}</Text>
      </View>
    </View>
  );
}

export default function TrackRideScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CampusRide</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Feather name="more-vertical" size={20} color={TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Map */}
        <View style={styles.mapWrap}>
          <Image source={{ uri: MAP_URL }} style={styles.mapImg} />
          {/* Search pill overlay */}
          <View style={styles.searchPill}>
            <Ionicons name="location-outline" size={18} color={BLUE} />
            <View style={{ width: 12 }} />
            <Feather name="sliders" size={16} color={MUTED} />
          </View>

          {/* Pins */}
          <MapPin n={3} top={140} left={80} />
          <MapPin n={1} top={330} left={260} />
          <MapPin n={2} top={410} left={70} />

          {/* User location dot */}
          <View style={styles.userDotOuter}>
            <View style={styles.userDotInner} />
          </View>
        </View>

        {/* Bottom sheet card */}
        <View style={styles.sheet}>
          {/* ETA row */}
          <View style={styles.etaRow}>
            <View>
              <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
              <Text style={styles.etaValue}>3 mins away</Text>
            </View>
            <View style={styles.seatsPill}>
              <MaterialCommunityIcons name="seat" size={16} color={TEXT} />
              <Text style={styles.seatsText}>3 seats</Text>
            </View>
          </View>

          {/* Driver row */}
          <View style={styles.driverRow}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: DRIVER_URL }} style={styles.avatar} />
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={18} color={LIME} />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.driverName}>Daniel Miller</Text>
              <View style={styles.driverMeta}>
                <Ionicons name="star-outline" size={14} color={TEXT} />
                <Text style={styles.driverMetaText}> 4.9</Text>
                <Text style={[styles.driverMetaText, { color: MUTED }]}>  •  2,400+ rides</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => Linking.openURL("tel:+10000000000")}
            >
              <Feather name="phone" size={18} color={BLUE} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleBtn, { marginLeft: 8 }]}>
              <Feather name="message-square" size={18} color={BLUE} />
            </TouchableOpacity>
          </View>

          {/* Vehicle card */}
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleIconBox}>
              <MaterialCommunityIcons name="car-outline" size={22} color={TEXT} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.vehicleTitle}>White Toyota Camry</Text>
              <Text style={styles.vehicleSub}>Premium Campus Fleet</Text>
            </View>
            <View style={styles.plate}>
              <Text style={styles.plateText}>X-12-24</Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.cta} activeOpacity={0.9}>
            <Text style={styles.ctaText}>Request Ride</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        <TabItem
          key="home"
          label="Home"
          active
          icon={<Ionicons name="home" size={20} color={BLUE} />}
        />
        <TabItem
          key="rides"
          label="Rides"
          icon={<MaterialCommunityIcons name="car-outline" size={22} color={MUTED} />}
        />
        <TabItem
          key="alerts"
          label="Alerts"
          icon={<Ionicons name="notifications-outline" size={20} color={MUTED} />}
        />
        <TabItem
          key="profile"
          label="Profile"
          icon={<Ionicons name="person-outline" size={20} color={MUTED} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BG,
  },
  headerBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT },

  mapWrap: { height: 460, backgroundColor: "#E5E9F0", position: "relative" },
  mapImg: { width: "100%", height: "100%" },

  searchPill: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    height: 44,
    backgroundColor: "#F3F4F8",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  mapPinWrap: { position: "absolute", width: 34, height: 44 },
  mapPin: {
    width: 32,
    height: 40,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPinBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  mapPinBadgeText: { fontSize: 11, fontWeight: "700", color: TEXT },

  userDotOuter: {
    position: "absolute",
    top: 300,
    left: 180,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(47,70,200,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  userDotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2F46C8",
    borderWidth: 3,
    borderColor: "#fff",
  },

  sheet: {
    marginTop: -24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },

  etaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  etaLabel: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: MUTED,
    fontWeight: "600",
  },
  etaValue: { fontSize: 26, fontWeight: "800", color: BLUE, marginTop: 4 },
  seatsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIME,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  seatsText: { marginLeft: 6, fontWeight: "700", color: TEXT },

  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  avatarWrap: { width: 54, height: 54 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  verifiedBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    backgroundColor: BLUE,
    borderRadius: 12,
    padding: 1,
  },
  driverName: { fontSize: 16, fontWeight: "700", color: TEXT },
  driverMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  driverMetaText: { fontSize: 13, color: TEXT },

  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ICON_CIRCLE,
    alignItems: "center",
    justifyContent: "center",
  },

  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  vehicleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleTitle: { fontSize: 15, fontWeight: "700", color: TEXT },
  vehicleSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  plate: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  plateText: { fontWeight: "700", color: TEXT, letterSpacing: 1 },

  cta: {
    marginTop: 18,
    backgroundColor: BLUE_DEEP,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 4 },
  tabIconWrap: {
    width: 44,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapActive: { backgroundColor: LIGHT_BLUE_BG },
  tabLabel: { fontSize: 11, color: MUTED, marginTop: 2 },
  tabLabelActive: { color: BLUE, fontWeight: "700" },
});