import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext"; // 🌟 Consuming global theme system tokens

const { width } = Dimensions.get("window");

const TripSummary = ({ onDismiss, onChangeTab, tripData }) => {
  const { theme, darkModeEnabled } = useTheme(); // 🌟 Extract dynamic token sets

  const activeSummary = tripData || {
    driverName: "Driver",
    pickupLocation: "Engineering Block C",
    destinationLocation: "Student Union North",
    durationText: "12 minutes",
    distanceText: "4.2 km",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <StatusBar style={theme.statusBar} />

      {/* Top Title Header Bar */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          onPress={() => onChangeTab?.("trips")}
          activeOpacity={0.7}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitleText, { color: theme.iconColor }]}>Trip Summary</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      {/* Main Core Content Layer */}
      <View style={[styles.contentWorkspace, { backgroundColor: theme.background }]}>
        {/* Success Green Circle Badge */}
        <View style={[styles.successCircleContainer, { borderColor: theme.iconColor }]}>
          <MaterialCommunityIcons name="check" size={48} color={darkModeEnabled ? "#121824" : "#1E3A8A"} />
        </View>

        <Text style={[styles.tripCompletedHeadingText, { color: theme.iconColor }]}>Trip Completed</Text>
        <Text style={[styles.driverGreetingSubtext, { color: theme.subText }]}>
          Well done, {activeSummary.driverName}. Safe driving!
        </Text>

        {/* Metrics Display Master Card Shell */}
        <View style={[styles.summaryCardView, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          {/* Vertical Route Indicator Timeline Link Block */}
          <View style={styles.routeTimelineTrackRow}>
            <View style={styles.timelineNodeVisualColumn}>
              <View style={[styles.pickupOuterCirclePin, { borderColor: theme.iconColor, backgroundColor: theme.background }]}>
                <View style={[styles.pickupInnerCirclePin, { backgroundColor: theme.iconColor }]} />
              </View>

              <View style={[styles.verticalLinkLineTrack, { backgroundColor: theme.borderColor }]} />

              <View style={[styles.dropoffOuterCirclePin, { borderColor: "#A3E635", backgroundColor: theme.background }]}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={14}
                  color="#A3E635"
                />
              </View>
            </View>

            <View style={styles.routeLabelsTextColumn}>
              <View style={styles.labelBlockSegment}>
                <Text style={[styles.fieldCategoryMetaLabel, { color: theme.subText }]}>PICKUP</Text>
                <Text style={[styles.locationHeadlineText, { color: theme.mainText }]} numberOfLines={1}>
                  {activeSummary.pickupLocation}
                </Text>
              </View>

              <View style={styles.labelBlockSegment}>
                <Text style={[styles.fieldCategoryMetaLabel, { color: theme.subText }]}>DESTINATION</Text>
                <Text style={[styles.locationHeadlineText, { color: theme.mainText }]} numberOfLines={1}>
                  {activeSummary.destinationLocation}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.horizontalDividerRule, { backgroundColor: theme.borderColor }]} />

          {/* Metrics Distribution Row Wrapper */}
          <View style={styles.metricsDistributionGridRow}>
            <View style={styles.metricDataCellUnit}>
              <View style={styles.metricLabelContainer}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={theme.subText}
                />
                <Text style={[styles.metricLabelCategory, { color: theme.subText }]}>Duration</Text>
              </View>
              <Text style={[styles.metricValueHeadlineText, { color: theme.iconColor }]}>
                {activeSummary.durationText}
              </Text>
            </View>

            <View style={styles.metricDataCellUnit}>
              <View style={styles.metricLabelContainer}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={16}
                  color={theme.subText}
                />
                <Text style={[styles.metricLabelCategory, { color: theme.subText }]}>Distance</Text>
              </View>
              <Text style={[styles.metricValueHeadlineText, { color: theme.iconColor }]}>
                {activeSummary.distanceText}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.bottomSuccessBannerLabelToast, { color: theme.subText }]}>
          Trip successfully completed
        </Text>
      </View>

      {/* App Base System Tab Nav Bar Component */}
      <View style={[styles.tabBarContainer, { backgroundColor: theme.background, borderTopColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={onDismiss}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="home-outline"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabLabelInactive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab?.("trips")}
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
          <Text style={[styles.tabLabelActive, { color: theme.iconColor }]}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onChangeTab?.("profile")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabLabelInactive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  activeTabIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  bottomSuccessBannerLabelToast: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 32,
    textAlign: "center",
  },
  container: {
    flex: 1,
  },
  contentWorkspace: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  driverGreetingSubtext: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 32,
    textAlign: "center",
  },
  dropoffOuterCirclePin: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  fieldCategoryMetaLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  headerButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  horizontalDividerRule: {
    height: 1,
    marginVertical: 4,
  },
  labelBlockSegment: {
    justifyContent: "center",
  },
  locationHeadlineText: {
    fontSize: 16,
    fontWeight: "700",
  },
  metricDataCellUnit: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "column",
  },
  metricLabelCategory: {
    fontSize: 13,
    fontWeight: "600",
  },
  metricLabelContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  metricValueHeadlineText: {
    fontSize: 18,
    fontWeight: "700",
    paddingLeft: 22,
  },
  metricsDistributionGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  pickupInnerCirclePin: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  pickupOuterCirclePin: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  routeLabelsTextColumn: {
    flex: 1,
    gap: 20,
  },
  routeTimelineTrackRow: {
    alignItems: "stretch",
    flexDirection: "row",
    marginBottom: 18,
  },
  successCircleContainer: {
    alignItems: "center",
    backgroundColor: "#A3E635",
    borderRadius: 50,
    borderWidth: 1,
    height: 100,
    justifyContent: "center",
    marginBottom: 24,
    width: 100,
  },
  summaryCardView: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    width: width - 48,
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
  tabLabelActive: {
    fontSize: 11,
    fontWeight: "700",
  },
  tabLabelInactive: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  timelineNodeVisualColumn: {
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 14,
    paddingVertical: 4,
    width: 24,
  },
  tripCompletedHeadingText: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  verticalLinkLineTrack: {
    flex: 1,
    marginVertical: 4,
    width: 2,
  },
});

export default TripSummary;