import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Dimensions,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const DriverHome = ({ driverData, onLogout, onViewRequests, onChangeTab }) => {
  const [isOnline, setIsOnline] = useState(true);

  const toggleOnlineStatus = () => setIsOnline((prev) => !prev);

  // Default coordinate viewport framing Legon UG Campus territory
  const ugCampusRegion = {
    latitude: 5.6506,
    longitude: -0.1873,
    latitudeDelta: 0.015,
    longitudeDelta: 0.012,
  };

  const mockPassengerRequests = [
    {
      id: "req_1",
      latitude: 5.6542,
      longitude: -0.1915,
      label: "Balme Library",
    },
    {
      id: "req_2",
      latitude: 5.6481,
      longitude: -0.1812,
      label: "Night Market",
    },
    {
      id: "req_3",
      latitude: 5.651,
      longitude: -0.185,
      label: "Commonwealth Hall",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      {/* Top Header App Bar */}
      <View style={styles.header}>
        <Text style={styles.logoText}>CampusRide</Text>
        <View style={styles.headerRight}>
          <Text style={styles.driverName}>
            {driverData?.fullName?.split(" ")[0] || "Driver"}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onChangeTab("profile")}
            style={styles.avatarContainer}
          >
            <View style={styles.avatarFallback}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color="#1E3A8A"
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.7}
            onPress={() => onChangeTab("profile")}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={22}
              color="#1E3A8A"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Go Online Switch Card */}
      <View style={styles.toggleCardContainer}>
        <View style={styles.toggleCard}>
          <View style={styles.toggleCardTextColumn}>
            <Text style={styles.toggleCardTitle}>
              {isOnline ? "Go Offline" : "Go Online"}
            </Text>
            <Text style={styles.toggleCardSubtitle} numberOfLines={1}>
              {isOnline
                ? "Ready to accept ride requests"
                : "Stay offline to pause requests"}
            </Text>
          </View>
          <Switch
            trackColor={{ false: "#E2E8F0", true: "#A3E635" }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E2E8F0"
            onValueChange={toggleOnlineStatus}
            value={isOnline}
          />
        </View>
      </View>

      {/* Live Map Viewport Area */}
      <View style={styles.mapViewportContainer}>
        {/* TODO: BACKEND INTEGRATION — Initialize background polling or WebSockets to update live client locations */}
        <MapView
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : null}
          style={StyleSheet.absoluteFillObject}
          initialRegion={ugCampusRegion}
          showsCompass={false}
          showsPointsOfInterest={true}
        >
          {isOnline && (
            <>
              {/* TODO: BACKEND INTEGRATION — Swap placeholder device coordinate structures with live geolocation hooks */}
              <Marker coordinate={{ latitude: 5.6506, longitude: -0.1873 }}>
                <View style={styles.driverPulseOuter}>
                  <View style={styles.driverPulseInner} />
                </View>
              </Marker>

              {mockPassengerRequests.map((request) => (
                <Marker
                  key={request.id}
                  coordinate={{
                    latitude: request.latitude,
                    longitude: request.longitude,
                  }}
                  title={request.label}
                >
                  <View style={styles.passengerPin}>
                    <MaterialCommunityIcons
                      name="account"
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                </Marker>
              ))}
            </>
          )}
        </MapView>

        {/* Map Overlay Status Badge */}
        <View
          style={[
            styles.mapStatusBadge,
            { backgroundColor: isOnline ? "#EFF6FF" : "#F1F5F9" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? "#1E3A8A" : "#94A3B8" },
            ]}
          />
          <Text
            style={[
              styles.mapStatusBadgeText,
              { color: isOnline ? "#1E3A8A" : "#64748B" },
            ]}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Text>
        </View>

        {/* Floating Context Summary Drawer */}
        <View style={styles.floatingStatusDrawer}>
          <View style={styles.drawerHeaderRow}>
            <View style={styles.drawerTextBlock}>
              <Text style={styles.drawerMainStatusTitle}>
                {isOnline ? "You are online" : "You are offline"}
              </Text>
              <Text style={styles.drawerSubStatusTitle}>
                {isOnline
                  ? `${mockPassengerRequests.length} requests nearby`
                  : "Toggle online status to start tracking"}
              </Text>
            </View>
            <View style={styles.drawerIconSquare}>
              <MaterialCommunityIcons name="routes" size={22} color="#1E3A8A" />
            </View>
          </View>

          {/* TODO: BACKEND INTEGRATION — GET /api/v1/drivers/analytics-summary */}
          <Text style={styles.metricsTextLine}>
            Trips today: <Text style={styles.metricsBoldValue}>5</Text> • Total
            trips: <Text style={styles.metricsBoldValue}>42</Text>
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              !isOnline && styles.disabledActionButton,
            ]}
            activeOpacity={0.85}
            disabled={!isOnline}
            onPress={onViewRequests}
          >
            <Text style={styles.actionButtonText}>View Active Requests</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Base System Tab Nav Bar Component */}
      <View style={styles.tabBarContainer}>
        {/* Home Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab("home")}
          activeOpacity={0.7}
        >
          <View
            style={[styles.tabIconBackground, styles.activeTabIconBackground]}
          >
            <MaterialCommunityIcons name="home" size={24} color="#1E3A8A" />
          </View>
          <Text style={[styles.tabLabelText, styles.activeTabLabelText]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Trips Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab("trips")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="car-multiple"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabLabelText}>Trips</Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab("profile")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabLabelText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  logoText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E3A8A",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E2937",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  notificationBtn: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleCardContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleCardTextColumn: {
    flex: 1,
    paddingRight: 8,
  },
  toggleCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E2937",
    marginBottom: 2,
  },
  toggleCardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  mapViewportContainer: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  mapStatusBadge: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mapStatusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  passengerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverPulseOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  driverPulseInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#1E3A8A",
  },
  floatingStatusDrawer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  drawerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  drawerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  drawerMainStatusTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E2937",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  drawerSubStatusTitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  drawerIconSquare: {
    width: 44,
    height: 44,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricsTextLine: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: 16,
  },
  metricsBoldValue: {
    color: "#475569",
    fontWeight: "700",
  },
  actionButton: {
    backgroundColor: "#1E3A8A",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledActionButton: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  tabBarContainer: {
    flexDirection: "row",
    height: 74,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconBackground: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 2,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  tabLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
  activeTabLabelText: {
    color: "#1E3A8A",
    fontWeight: "700",
  },
});

export default DriverHome;
