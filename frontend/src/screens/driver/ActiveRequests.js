import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Standardized vector plugin package

const { width } = Dimensions.get("window");

const ActiveRequests = ({ onBack, onChangeTab, onAcceptRide }) => {

  // TODO: BACKEND INTEGRATION — Hook real-time API state hooks here
  // const [allRequests, setAllRequests] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);

  const [allRequests, setAllRequests] = useState([
    {
      id: "req_lucy",
      name: "Lucy Amankwa",
      pickup: "Law Department",
      destination: "Engineering Block C",
      distance: "2.5 km",
      arrival: "3 mins",
      avatarEmoji: "👩‍🎓",
      rideMode: "shared", 
    },
    {
      id: "req_kwame",
      name: "Kwame Mensah",
      pickup: "Balme Library",
      destination: "Gym / Sports Stadium",
      distance: "1.2 km",
      arrival: "5 mins",
      avatarEmoji: "👨‍🎓",
      rideMode: "private", 
    },
    {
      id: "req_aisha",
      name: "Aisha Osei",
      pickup: "Dorms A / Volta",
      destination: "Bush Canteen Cafe",
      distance: "0.8 km",
      arrival: "2 mins",
      avatarEmoji: "👩‍💼",
      rideMode: "shared",
    },
  ]);

  const [selectedId, setSelectedId] = useState("req_lucy");

  const currentSpotlightRequest =
    allRequests.find((req) => req.id === selectedId) || allRequests[0];
  const lowerQueueRequests = allRequests.filter((req) => req.id !== selectedId);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      {/* Header App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Active Requests</Text>
        </View>
        <View style={styles.badgeNearby}>
          <Text style={styles.badgeNearbyText}>
            {allRequests.length} Nearby
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Primary Spotlight Request Detail Card */}
        <View style={styles.mainCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarMock}>
              <Text style={styles.avatarEmoji}>
                {currentSpotlightRequest.avatarEmoji}
              </Text>
            </View>
            <View style={styles.profileTextContainer}>
              <View style={styles.nameAndTagRow}>
                <Text style={styles.passengerName} numberOfLines={1}>
                  {currentSpotlightRequest.name}
                </Text>

                {/* Mode Indicator Capsule Tag */}
                <View
                  style={[
                    styles.modeTagCapsule,
                    currentSpotlightRequest.rideMode === "shared"
                      ? styles.sharedTagBackground
                      : styles.privateTagBackground,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      currentSpotlightRequest.rideMode === "shared"
                        ? "account-multiple-plus"
                        : "shield-lock"
                    }
                    size={12}
                    color="#1E3A8A"
                  />
                  <Text style={styles.modeTagText}>
                    {currentSpotlightRequest.rideMode?.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.passengerMeta}>Campus Commuter</Text>
            </View>
          </View>

          <View style={styles.routeTimelineContainer}>
            <View style={styles.timelineIndicatorsColumn}>
              <MaterialCommunityIcons
                name="circle-slice-8"
                size={14}
                color="#1E3A8A"
              />
              <View style={styles.timelineLineConnector} />
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color="#4D7C0F"
              />
            </View>

            <View style={styles.routeAddressesColumn}>
              <View style={styles.addressBlock}>
                <Text style={styles.addressLabelText}>PICKUP</Text>
                <Text style={styles.addressMainText}>
                  {currentSpotlightRequest.pickup}
                </Text>
              </View>
              <View style={styles.addressBlock}>
                <Text style={styles.addressLabelText}>DESTINATION</Text>
                <Text style={styles.addressMainText}>
                  {currentSpotlightRequest.destination}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue}>
                {currentSpotlightRequest.distance}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Arrival</Text>
              <Text style={styles.metricValue}>
                {currentSpotlightRequest.arrival}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.acceptButton}
            activeOpacity={0.85}
            onPress={() => onAcceptRide(currentSpotlightRequest)}
          >
            <Text style={styles.acceptButtonText}>Accept Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            activeOpacity={0.85}
            onPress={onBack}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Extra Dispatch Queue Section */}
        <View style={styles.otherSectionHeader}>
          <Text style={styles.otherSectionTitle}>Other Available Requests</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllActionText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollLayout}
        >
          {lowerQueueRequests.map((item) => (
            <View key={item.id} style={styles.horizontalMiniCard}>
              <View style={styles.miniCardUpperSection}>
                <View style={styles.miniCardHeaderRow}>
                  <View
                    style={[
                      styles.miniModeDot,
                      item.rideMode === "shared"
                        ? { backgroundColor: "#4D7C0F" }
                        : { backgroundColor: "#EFF6FF" },
                    ]}
                  />
                  <Text style={styles.miniModeLabel} numberOfLines={1}>
                    {item.rideMode?.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.miniCardRouteContainer}>
                  <View style={styles.miniRouteLineRow}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={14}
                      color="#1E2937"
                    />
                    <Text style={styles.miniMapPlaceText} numberOfLines={1}>
                      {item.pickup}
                    </Text>
                  </View>
                  <View style={styles.miniRouteLineRow}>
                    <MaterialCommunityIcons
                      name="flag-checkered"
                      size={14}
                      color="#1E2937"
                    />
                    <Text style={styles.miniMapPlaceText} numberOfLines={1}>
                      {item.destination}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.miniCardFooterRow}>
                <Text style={styles.miniCardDistanceText}>{item.distance}</Text>
                <TouchableOpacity
                  style={styles.miniCardViewButton}
                  activeOpacity={0.8}
                  onPress={() => setSelectedId(item.id)}
                >
                  <Text style={styles.miniCardViewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {/* App Base System Tab Nav Bar */}
      <View style={styles.tabBarContainer}>
        {/* Home Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab && onChangeTab("home")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="home-outline"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabItemLabel}>Home</Text>
        </TouchableOpacity>

        {/* Trips Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab && onChangeTab("trips")}
          activeOpacity={0.7}
        >
          <View
            style={[styles.tabIconBackground, styles.activeTabIconBackground]}
          >
            <MaterialCommunityIcons
              name="car-multiple"
              size={24}
              color="#1E3A8A"
            />
          </View>
          <Text style={[styles.tabItemLabel, styles.activeTabLabelText]}>
            Trips
          </Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab && onChangeTab("profile")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabItemLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", 
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
  },
  backButton: {
    paddingVertical: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E3A8A",
    letterSpacing: -0.5,
  },
  badgeNearby: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  badgeNearbyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatarMock: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  profileTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  nameAndTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  passengerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#1E2937",
  },
  modeTagCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  sharedTagBackground: {
    backgroundColor: "#F7FEE7",
    borderColor: "#4D7C0F",
  },
  privateTagBackground: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E3A8A",
    letterSpacing: 0.5,
  },
  passengerMeta: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  routeTimelineContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  timelineIndicatorsColumn: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    width: 20,
  },
  timelineLineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
  routeAddressesColumn: {
    flex: 1,
    marginLeft: 14,
    gap: 16,
  },
  addressBlock: {
    justifyContent: "center",
  },
  addressLabelText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressMainText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E2937",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E2937",
  },
  acceptButton: {
    backgroundColor: "#1E3A8A",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  acceptButtonText: {
    color: "#FFFFFF", // Hardened white font color property
    fontSize: 16,
    fontWeight: "700",
  },
  declineButton: {
    backgroundColor: "#F1F5F9",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  declineButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "700",
  },
  otherSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  otherSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E2937",
  },
  viewAllActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  horizontalScrollLayout: {
    paddingLeft: 24,
    paddingRight: 12,
    gap: 12,
  },
  horizontalMiniCard: {
    backgroundColor: "#FFFFFF",
    width: width * 0.48,
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-between",
    height: 148,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  miniCardUpperSection: {
    gap: 8,
  },
  miniCardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniModeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: "#1E3A8A",
  },
  miniModeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  miniCardRouteContainer: {
    gap: 6,
  },
  miniRouteLineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniMapPlaceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E2937",
    flex: 1,
  },
  miniCardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniCardDistanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  miniCardViewButton: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  miniCardViewButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  tabBarContainer: {
    flexDirection: "row",
    height: 74,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  tabItemLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
  activeTabLabelText: {
    color: "#1E3A8A",
    fontWeight: "700",
  },
});

export default ActiveRequests;