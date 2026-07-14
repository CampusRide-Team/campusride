import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";  
import api from "../../api/axios"; 

const { width } = Dimensions.get("window");

const RideHistory = ({ onBack, onChangeTab }) => {
  const { theme, darkModeEnabled } = useTheme();  
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("completed");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const formatRideDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      return "Recent Trip";
    }
  };

  const fetchRideHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/driver/earnings");

      if (response.data?.success && response.data?.data?.recentTrips) {
        setHistoryData(response.data.data.recentTrips);
      } else if (response.data?.success && Array.isArray(response.data.data)) {
        setHistoryData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching trip archives from backend:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRideHistory();
  }, []);

  const filteredRides = historyData.filter(
    (ride) =>
      (ride.status || "completed").toLowerCase() === activeFilter.toLowerCase(),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <StatusBar style={theme.statusBar} />

      {/* Top Bar Navbar Section */}
      <View style={[styles.topBar, { backgroundColor: theme.background, borderBottomColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.topBarButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.iconColor }]}>Ride History</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.topBarButton,
            showFilterMenu && [styles.activeFilterBtn, { backgroundColor: theme.cardBackground }],
          ]}
          onPress={() => setShowFilterMenu(!showFilterMenu)}
        >
          <MaterialCommunityIcons
            name="filter-variant"
            size={24}
            color={theme.iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* Inline Filter Drawer Dropdown Option */}
      {showFilterMenu && (
        <View style={[styles.filterDrawer, { backgroundColor: theme.cardBackground, borderBottomColor: theme.borderColor }]}>
          <TouchableOpacity
            style={[
              styles.filterOption,
              { backgroundColor: darkModeEnabled ? "#334155" : "#E2E8F0" },
              activeFilter === "completed" && { backgroundColor: theme.iconColor },
            ]}
            onPress={() => {
              setActiveFilter("completed");
              setShowFilterMenu(false);
            }}
          >
            <Text
              style={[
                styles.filterOptionText,
                { color: theme.subText },
                activeFilter === "completed" && styles.selectedFilterText,
              ]}
            >
              Completed Trips
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterOption,
              { backgroundColor: darkModeEnabled ? "#334155" : "#E2E8F0" },
              activeFilter === "cancelled" && { backgroundColor: theme.iconColor },
            ]}
            onPress={() => {
              setActiveFilter("cancelled");
              setShowFilterMenu(false);
            }}
          >
            <Text
              style={[
                styles.filterOptionText,
                { color: theme.subText },
                activeFilter === "cancelled" && styles.selectedFilterText,
              ]}
            >
              Cancelled Trips
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Core Dynamic Content Switching Context Area */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.iconColor} />
          <Text style={[styles.loadingText, { color: theme.subText }]}>Retrieving transit ledger...</Text>
        </View>
      ) : filteredRides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="car-off" size={64} color={theme.subText} />
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            No {activeFilter} rides recorded yet
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.background }]}
          showsVerticalScrollIndicator={false}
        >
          {filteredRides.map((ride) => (
            <View key={ride._id || ride.id} style={[styles.historyCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
              {/* Metadata Header Meta Row */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.headerLeftMeta}>
                  <Text style={[styles.dateText, { color: theme.subText }]}>
                    {formatRideDate(ride.createdAt || ride.updatedAt)}
                  </Text>
                  <Text
                    style={[
                      styles.statusText,
                      ride.status === "cancelled" && { color: "#EF4444" },
                    ]}
                  >
                    {ride.status
                      ? ride.status.charAt(0).toUpperCase() +
                        ride.status.slice(1)
                      : "Completed"}
                  </Text>
                </View>

                {/* Ride Type Pill Badge Indicator */}
                <View
                  style={[
                    styles.typeTagCapsule,
                    (ride.type || "Shared") === "Shared"
                      ? styles.sharedBackground
                      : [styles.privateBackground, { backgroundColor: theme.iconWrap, borderColor: theme.tabBarBorder }],
                  ]}
                >
                  <Text style={[styles.typeTagText, { color: (ride.type || "Shared") === "Shared" ? "#1E3A8A" : theme.iconColor }]}>
                    {(ride.type || "Shared").toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Vertical Routing Visual Stack */}
              <View style={styles.routeContainer}>
                <View style={styles.timelineIndicatorsColumn}>
                  <MaterialCommunityIcons
                    name="circle"
                    size={10}
                    color={theme.iconColor}
                  />
                  <View style={[styles.verticalLinkConnector, { backgroundColor: theme.borderColor }]} />
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={14}
                    color="#A3E635"
                  />
                </View>

                <View style={styles.routeLabelsColumn}>
                  <Text style={[styles.locationText, { color: theme.mainText }]} numberOfLines={1}>
                    {ride.pickupLocation?.address ||
                      ride.pickup ||
                      "Campus Pickup"}
                  </Text>
                  <Text style={[styles.locationText, { color: theme.mainText }]} numberOfLines={1}>
                    {ride.destinationLocation?.address ||
                      ride.destination ||
                      "Campus Destination"}
                  </Text>
                </View>
              </View>

              {/* Footer Row Block Module with Trip Fare details */}
              <View style={[styles.cardFooterRow, { borderTopColor: theme.borderColor }]}>
                <Text style={[styles.rideIdLabel, { color: theme.subText }]}>
                  ID: #{(ride._id || ride.id).substring(0, 8).toUpperCase()}
                </Text>
                <Text style={[styles.fareLabel, { color: theme.iconColor }]}>
                  GH₵ {(ride.fare || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Persistent App Footer Bottom Nav Tabs Menu */}
      <View style={[styles.bottomNav, { backgroundColor: theme.background, borderTopColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          style={styles.navItem}
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
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onChangeTab && onChangeTab("trips")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="car-multiple"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.navLabel}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onBack && onBack()}
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
              name="account-circle"
              size={24}
              color={theme.iconColor}
            />
          </View>
          <Text style={[styles.navLabelActive, { color: theme.iconColor }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  activeFilterBtn: {
    opacity: 0.9,
  },
  activeTabIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  bottomNav: {
    borderTopWidth: 1,
    flexDirection: "row",
    height: 74,
  },
  cardFooterRow: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  cardHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  container: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  filterDrawer: {
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  filterOption: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  headerLeftMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 16,
    padding: 20,
  },
  loaderContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  locationText: {
    fontSize: 15,
    fontWeight: "700",
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  navLabelActive: {
    fontSize: 11,
    fontWeight: "700",
  },
  privateBackground: {
    borderStyle: "solid",
  },
  rideIdLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  routeContainer: {
    alignItems: "stretch",
    flexDirection: "row",
    marginBottom: 16,
    paddingLeft: 2,
  },
  routeLabelsColumn: {
    flex: 1,
    gap: 14,
    justifyContent: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  selectedFilterText: {
    color: "#FFFFFF",
  },
  sharedBackground: {
    backgroundColor: "#A3E635",
    borderColor: "#1E3A8A",
  },
  statusText: {
    color: "#16A34A",
    fontSize: 13,
    fontWeight: "700",
  },
  tabIconBackground: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    marginBottom: 2,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  timelineIndicatorsColumn: {
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 14,
    paddingVertical: 4,
    width: 16,
  },
  topBar: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  topBarButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  typeTagCapsule: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  verticalLinkConnector: {
    flex: 1,
    marginVertical: 4,
    width: 2,
  },
});

export default RideHistory;