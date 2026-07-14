import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";  

const { width } = Dimensions.get("window");

// Verified badge icon
const VerifiedBadge = () => (
  <View style={styles.verifiedBadge}>
    <MaterialCommunityIcons name="check" size={14} color="#1E3A8A" prefix="verified" />
  </View>
);

// Rating pill indicator
const RatingPill = ({ rating, theme }) => (
  <View style={[styles.ratingPill, { backgroundColor: theme.iconWrap }]}>
    <MaterialCommunityIcons name="star" size={14} color={theme.iconColor} />
    <Text style={[styles.ratingText, { color: theme.iconColor }]}>
      {rating ? `${rating} RATING` : "NEW DRIVER"}
    </Text>
  </View>
);

// Stats row data metrics
const StatsRow = ({ totalTrips, tripsToday, theme }) => (
  <View style={[styles.statsRow, { backgroundColor: theme.background, borderColor: theme.borderColor }]}>
    <View style={styles.statItem}>
      <MaterialCommunityIcons
        name="car-multiple"
        size={24}
        color={theme.iconColor}
        style={styles.statIcon}
      />
      <Text style={[styles.statNumber, { color: theme.mainText }]}>{totalTrips ?? 0}</Text>
      <Text style={[styles.statLabel, { color: theme.subText }]}>TOTAL TRIPS</Text>
    </View>
    <View style={[styles.statDivider, { backgroundColor: theme.borderColor }]} prefix="divider" />
    <View style={styles.statItem}>
      <MaterialCommunityIcons
        name="calendar-month"
        size={24}
        color={theme.iconColor}
        style={styles.statIcon}
      />
      <Text style={[styles.statNumber, { color: theme.mainText }]}>{tripsToday ?? 0}</Text>
      <Text style={[styles.statLabel, { color: theme.subText }]}>TRIPS TODAY</Text>
    </View>
  </View>
);

// Menu list action row component
const MenuItem = ({
  iconName,
  label,
  onPress,
  showDot = false,
  isFirst = false,
  isLast = false,
  theme,
}) => (
  <TouchableOpacity
    style={[
      styles.menuItem,
      isFirst && styles.menuItemFirst,
      isLast && styles.menuItemLast,
      !isLast && [styles.menuItemBorder, { borderBottomColor: theme.borderColor }],
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.menuIconWrap, { backgroundColor: theme.background }]}>
      <MaterialCommunityIcons name={iconName} size={20} color={theme.subText} />
    </View>
    <Text style={[styles.menuLabel, { color: theme.mainText }]}>{label}</Text>
    <View style={styles.menuRight}>
      {showDot && <View style={styles.notifDot} prefix="dot" />}
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.subText} />
    </View>
  </TouchableOpacity>
);

const DriverProfile = ({ onLogout, onNavigate, driverData }) => {
  const { theme, darkModeEnabled } = useTheme();

 const rawAvatar = driverData?.avatarUri || driverData?.avatarUrl || null;
  const user = {
    name: driverData?.fullName || "Driver",
    email: driverData?.email || "",
    rating: driverData?.rating,
    totalTrips: driverData?.totalTrips,
    tripsToday: driverData?.tripsToday,
    avatar: rawAvatar && rawAvatar.startsWith("http") 
      ? `${rawAvatar}?t=${Date.now()}` 
      : rawAvatar,
    verified: driverData?.isApproved || false,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <StatusBar style={theme.statusBar} />

      {/* Top logo header section */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.tabBarBorder }]}>
        <Text style={[styles.logoText, { color: theme.iconColor }]}>CampusRide</Text>
        <TouchableOpacity
          onPress={() => onNavigate?.("settings")}
          activeOpacity={0.8}
        >
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={[styles.topBarAvatar, { borderColor: theme.iconColor }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.topBarAvatarPlaceholder, { backgroundColor: theme.iconColor }]}>
              <Text style={styles.topBarAvatarInitials}>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User identification header card layout */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={() => onNavigate?.("settings")}
            activeOpacity={0.85}
            style={styles.photoWrap}
          >
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={[styles.profilePhoto, { borderColor: theme.background }]}
              />
            ) : (
              <View style={[styles.profilePhotoPlaceholder, { backgroundColor: theme.iconColor }]}>
                <Text style={styles.profilePhotoInitials}>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
            )}
            {user.verified && <VerifiedBadge />}
          </TouchableOpacity>

          <Text style={[styles.profileName, { color: theme.iconColor }]} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.subText }]} numberOfLines={1}>
            {user.email}
          </Text>
          <RatingPill rating={user.rating} theme={theme} />
        </View>

        {/* User metrics analytics breakdown block */}
        <StatsRow totalTrips={user.totalTrips} tripsToday={user.tripsToday} theme={theme} />

        {/* Settings options card list links */}
        <View style={[styles.menuCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          <MenuItem
            iconName="clock-outline"
            label="Ride History"
            onPress={() => onNavigate?.("ride-history")}
            isFirst
            theme={theme}
          />
          <MenuItem
            iconName="bell-outline"
            label="Notifications"
            onPress={() => onNavigate?.("notifications")}
            theme={theme}
          />
          <MenuItem
            iconName="help-circle-outline"
            label="Help & Support"
            onPress={() => onNavigate?.("help-support")}
            theme={theme}
          />
          <MenuItem
            iconName="cog-outline"
            label="Settings"
            onPress={() => onNavigate?.("app-settings")}
            isLast
            theme={theme}
          />
        </View>

        {/* Account login termination controller action */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: theme.cardBackground,
              borderColor: darkModeEnabled ? theme.borderColor : "#FEE2E2",
            },
          ]}
          onPress={onLogout}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="logout" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* App Base System Tab Nav Bar Component */}
      <View style={[styles.tabBarContainer, { backgroundColor: theme.background, borderTopColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onNavigate?.("home")}
          activeOpacity={0.7}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="home-outline"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={styles.tabLabelText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onNavigate?.("active-requests")}
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

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onNavigate?.("profile")}
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
          <Text style={[styles.tabLabelText, { color: theme.iconColor, fontWeight: "700" }]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  activeTabIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  logoutBtn: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 8,
    paddingVertical: 16,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  menuIconWrap: {
    alignItems: "center",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  menuItemFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  menuItemLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  menuRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  notifDot: {
    backgroundColor: "#A3E635",
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  photoWrap: {
    marginBottom: 4,
    position: "relative",
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  profilePhoto: {
    borderRadius: 55,
    borderWidth: 3,
    height: 110,
    width: 110,
  },
  profilePhotoInitials: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
  },
  profilePhotoPlaceholder: {
    alignItems: "center",
    borderRadius: 55,
    elevation: 2,
    height: 110,
    justifyContent: "center",
    width: 110,
  },
  profileSection: {
    alignItems: "center",
    gap: 8,
    paddingBottom: 20,
    paddingTop: 20,
  },
  ratingPill: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  statDivider: {
    marginVertical: 4,
    width: 1,
  },
  statIcon: {
    marginBottom: 2,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  statsRow: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 16,
    paddingVertical: 20,
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
  tabLabelText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  topBarAvatar: {
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    width: 36,
  },
  topBarAvatarInitials: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  topBarAvatarPlaceholder: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  verifiedBadge: {
    alignItems: "center",
    backgroundColor: "#A3E635",
    borderColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    bottom: 4,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    width: 24,
  },
});

export default DriverProfile;