import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext"; 
import api from "../../api/axios";

const { width } = Dimensions.get("window");

const ActiveRequests = ({ onBack, onChangeTab, onAcceptRide }) => {
  const { theme, darkModeEnabled } = useTheme(); 
  const [allRequests, setAllRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. FETCH LIVE CAMPUS DISPATCHES FROM THE CORRECT RIDES ENDPOINT
  const fetchActiveDispatches = async () => {
    try {
      //  OPTION B ALIGNMENT: Switched seamlessly to match rideRoutes layout prefix
      const response = await api.get("/rides/pending");
      if (response.data?.success && response.data?.data) {
        const requests = response.data.data;
        setAllRequests(requests);

        // Auto-spotlight the first request index if nothing is selected yet
        if (requests.length > 0 && !selectedId) {
          setSelectedId(requests[0].id || requests[0]._id);
        }
      }
    } catch (error) {
      console.error("Production API Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDispatches();

    // Background polling stream to instantly grab new student ride requests
    const trackingInterval = setInterval(fetchActiveDispatches, 4000);
    return () => clearInterval(trackingInterval);
  }, [selectedId]);

  // 🚀 2. EXECUTE PRODUCTION RIDE ACCEPTANCE TRANSACTION
  const handleAcceptRide = async (request) => {
    const requestId = request.id || request._id;
    try {
      setIsSubmitting(true);
      const response = await api.post("/trips/accept", { requestId });

      if (response.data?.success) {
        onAcceptRide(response.data.trip || request);
      } else {
        Alert.alert(
          "Ride Unavailable",
          "Another campus vehicle has accepted this dispatch.",
        );
        fetchActiveDispatches();
      }
    } catch (error) {
      console.error("Acceptance Mutation Error:", error);
      Alert.alert(
        "Connection Failure",
        "Failed to sync transaction with server.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSpotlightRequest =
    allRequests.find((req) => (req.id || req._id) === selectedId) ||
    allRequests[0];
  const lowerQueueRequests = allRequests.filter(
    (req) => (req.id || req._id) !== selectedId,
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <StatusBar style={theme.statusBar} />

      {/* Header App Bar */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitleText, { color: theme.iconColor }]}>Active Requests</Text>
        </View>
        <View style={[styles.badgeNearby, { backgroundColor: theme.iconWrap, borderColor: theme.tabBarBorder }]}>
          <Text style={[styles.badgeNearbyText, { color: theme.iconColor }]}>
            {allRequests.length} Nearby
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerLoadingState}>
          <ActivityIndicator size="large" color={theme.iconColor} />
          <Text style={[styles.loadingStateText, { color: theme.subText }]}>
            Scanning campus dispatches...
          </Text>
        </View>
      ) : allRequests.length === 0 ? (
        <View style={styles.centerLoadingState}>
          <MaterialCommunityIcons
            name="car-connected"
            size={48}
            color={theme.subText}
          />
          <Text style={[styles.loadingStateText, { color: theme.subText }]}>
            No ride requests nearby right now.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Primary Spotlight Request Detail Card */}
          {currentSpotlightRequest && (
            <View style={[styles.mainCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
              <View style={styles.profileRow}>
                <View style={[styles.avatarMock, { backgroundColor: theme.background, borderColor: theme.borderColor }]}>
                  <Text style={styles.avatarEmoji}>
                    {currentSpotlightRequest.avatarEmoji || "👩‍🎓"}
                  </Text>
                </View>
                <View style={styles.profileTextContainer}>
                  <View style={styles.nameAndTagRow}>
                    <Text style={[styles.passengerName, { color: theme.mainText }]} numberOfLines={1}>
                      {currentSpotlightRequest.name}
                    </Text>

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
                        color={theme.iconColor}
                      />
                      <Text style={[styles.modeTagText, { color: theme.iconColor }]}>
                        {currentSpotlightRequest.rideMode?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.passengerMeta, { color: theme.subText }]}>Campus Commuter</Text>
                </View>
              </View>

              <View style={styles.routeTimelineContainer}>
                <View style={styles.timelineIndicatorsColumn}>
                  <MaterialCommunityIcons
                    name="circle-slice-8"
                    size={14}
                    color={theme.iconColor}
                  />
                  <View style={[styles.timelineLineConnector, { backgroundColor: theme.borderColor }]} />
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={16}
                    color="#4D7C0F"
                  />
                </View>

                <View style={styles.routeAddressesColumn}>
                  <View style={styles.addressBlock}>
                    <Text style={[styles.addressLabelText, { color: theme.subText }]}>PICKUP</Text>
                    <Text style={[styles.addressMainText, { color: theme.mainText }]}>
                      {currentSpotlightRequest.pickup}
                    </Text>
                  </View>
                  <View style={styles.addressBlock}>
                    <Text style={[styles.addressLabelText, { color: theme.subText }]}>DESTINATION</Text>
                    <Text style={[styles.addressMainText, { color: theme.mainText }]}>
                      {currentSpotlightRequest.destination}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, { backgroundColor: theme.background, borderColor: theme.borderColor }]}>
                  <Text style={[styles.metricLabel, { color: theme.subText }]}>Distance</Text>
                  <Text style={[styles.metricValue, { color: theme.mainText }]}>
                    {currentSpotlightRequest.distance || "1.5 km"}
                  </Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: theme.background, borderColor: theme.borderColor }]}>
                  <Text style={[styles.metricLabel, { color: theme.subText }]}>Arrival</Text>
                  <Text style={[styles.metricValue, { color: theme.mainText }]}>
                    {currentSpotlightRequest.arrival || "5 mins"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  { backgroundColor: theme.iconColor },
                  isSubmitting && styles.disabledActionButton,
                ]}
                activeOpacity={0.85}
                disabled={isSubmitting}
                onPress={() => handleAcceptRide(currentSpotlightRequest)}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept Ride</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.declineButton, { backgroundColor: theme.background, borderColor: theme.borderColor }]}
                activeOpacity={0.85}
                onPress={onBack}
                disabled={isSubmitting}
              >
                <Text style={[styles.declineButtonText, { color: theme.subText }]}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Horizontal Extra Dispatch Queue Section */}
          {lowerQueueRequests.length > 0 && (
            <>
              <View style={styles.otherSectionHeader}>
                <Text style={[styles.otherSectionTitle, { color: theme.mainText }]}>
                  Other Available Requests
                </Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={[styles.viewAllActionText, { color: theme.iconColor }]}>View All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollLayout}
              >
                {lowerQueueRequests.map((item) => {
                  const itemId = item.id || item._id;
                  return (
                    <View key={itemId} style={[styles.horizontalMiniCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
                      <View style={styles.miniCardUpperSection}>
                        <View style={styles.miniCardHeaderRow}>
                          <View
                            style={[
                              styles.miniModeDot,
                              item.rideMode === "shared"
                                ? styles.miniDotShared
                                : styles.miniDotPrivate,
                            ]}
                          />
                          <Text style={[styles.miniModeLabel, { color: theme.subText }]} numberOfLines={1}>
                            {item.rideMode?.toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.miniCardRouteContainer}>
                          <View style={styles.miniRouteLineRow}>
                            <MaterialCommunityIcons
                              name="map-marker-outline"
                              size={14}
                              color={theme.mainText}
                            />
                            <Text
                              style={[styles.miniMapPlaceText, { color: theme.mainText }]}
                              numberOfLines={1}
                            >
                              {item.pickup}
                            </Text>
                          </View>
                          <View style={styles.miniRouteLineRow}>
                            <MaterialCommunityIcons
                              name="flag-checkered"
                              size={14}
                              color={theme.mainText}
                            />
                            <Text
                              style={[styles.miniMapPlaceText, { color: theme.mainText }]}
                              numberOfLines={1}
                            >
                              {item.destination}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.miniCardFooterRow}>
                        <Text style={[styles.miniCardDistanceText, { color: theme.subText }]}>
                          {item.distance || "2.0 km"}
                        </Text>
                        <TouchableOpacity
                          style={[styles.miniCardViewButton, { backgroundColor: theme.background, borderColor: theme.borderColor }]}
                          activeOpacity={0.8}
                          onPress={() => setSelectedId(itemId)}
                        >
                          <Text style={[styles.miniCardViewButtonText, { color: theme.iconColor }]}>
                            View
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}
        </ScrollView>
      )}

      {/* App Base System Tab Nav Bar */}
      <View style={[styles.tabBarContainer, { backgroundColor: theme.background, borderTopColor: theme.tabBarBorder }]}>
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

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab && onChangeTab("trips")}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.tabIconBackground,
              !darkModeEnabled && styles.activeTabIconBackground,
              darkModeEnabled && { backgroundColor: "#334155" },
            ]}
          >
            <MaterialCommunityIcons
              name="car-multiple"
              size={24}
              color={theme.iconColor}
            />
          </View>
          <Text style={[styles.tabItemLabel, { color: theme.iconColor, fontWeight: "700" }]}>
            Trips
          </Text>
        </TouchableOpacity>

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
  acceptButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    marginBottom: 12,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  activeTabIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  addressBlock: {
    justifyContent: "center",
  },
  addressLabelText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressMainText: {
    fontSize: 15,
    fontWeight: "700",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  avatarMock: {
    alignItems: "center",
    borderRadius: 27,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  backButton: {
    paddingVertical: 4,
  },
  badgeNearby: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeNearbyText: {
    fontSize: 12,
    fontWeight: "700",
  },
  centerLoadingState: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  declineButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  disabledActionButton: {
    backgroundColor: "#CBD5E1",
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  horizontalMiniCard: {
    borderWidth: 1,
    borderRadius: 16,
    height: 148,
    justifyContent: "space-between",
    padding: 14,
    width: width * 0.48,
  },
  horizontalScrollLayout: {
    gap: 12,
    paddingLeft: 24,
    paddingRight: 12,
  },
  loadingStateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  mainCard: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 24,
    marginHorizontal: 24,
    padding: 24,
  },
  metricCard: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    flex: 1,
    paddingVertical: 12,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  miniCardDistanceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  miniCardFooterRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  miniCardHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  miniCardRouteContainer: {
    gap: 6,
  },
  miniCardUpperSection: {
    gap: 8,
  },
  miniCardViewButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  miniCardViewButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  miniDotPrivate: {
    backgroundColor: "#EFF6FF",
  },
  miniDotShared: {
    backgroundColor: "#4D7C0F",
  },
  miniMapPlaceText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  miniModeDot: {
    borderColor: "#1E3A8A",
    borderRadius: 3,
    borderWidth: 0.5,
    height: 6,
    width: 6,
  },
  miniModeLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modeTagCapsule: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  nameAndTagRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 4,
  },
  otherSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 24,
  },
  otherSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  passengerMeta: {
    fontSize: 13,
    fontWeight: "700",
  },
  passengerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
  },
  privateTagBackground: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  profileRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 24,
  },
  profileTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  miniRouteLineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  routeAddressesColumn: {
    flex: 1,
    gap: 16,
    marginLeft: 14,
  },
  routeTimelineContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sharedTagBackground: {
    backgroundColor: "#F7FEE7",
    borderColor: "#4D7C0F",
  },
  tabBarContainer: {
    borderTopWidth: 1,
    flexDirection: "row",
    height: 74,
  },
  tabIconBackground: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    marginBottom: 2,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  tabItemLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  timelineIndicatorsColumn: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    width: 20,
  },
  timelineLineConnector: {
    flex: 1,
    marginVertical: 4,
    width: 2,
  },
  viewAllActionText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

export default ActiveRequests;