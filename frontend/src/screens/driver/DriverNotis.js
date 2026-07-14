import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";  
import api from "../../api/axios"; 

const { width } = Dimensions.get("window");

const DriverNotis = ({ onBack, onChangeTab }) => {
  const { theme, darkModeEnabled } = useTheme();  
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Icon & Design Map Configuration Based on Notification Type (Integrated with Dark Theme Parameters)
  const getNotificationTheme = (type) => {
    switch (type) {
      case "ride_request":
        return { icon: "car", bg: darkModeEnabled ? "#1E3A8A" : "#EFF6FF", color: darkModeEnabled ? "#60A5FA" : "#1E3A8A" };
      case "rating":
        return { icon: "star-outline", bg: darkModeEnabled ? "#78350F" : "#FEF08A", color: darkModeEnabled ? "#FDE047" : "#A16207" };
      case "verification":
        return { icon: "file-check-outline", bg: darkModeEnabled ? "#064E3B" : "#DCFCE7", color: darkModeEnabled ? "#4ADE80" : "#15803D" };
      case "cancelled":
        return { icon: "alert-circle-outline", bg: darkModeEnabled ? "#7F1D1D" : "#FEE2E2", color: darkModeEnabled ? "#FCA5A5" : "#EF4444" };
      default:
        return { icon: "bell-outline", bg: theme.background, color: theme.subText };
    }
  };

  const formatTimeStr = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/driver/notifications");
      if (response.data?.success && Array.isArray(response.data.data)) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching dynamic notification logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleOpenNotification = async (notif) => {
    setSelectedNotif(notif);

    setNotifications((prev) =>
      prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n)),
    );

    try {
      await api.patch(`/driver/notifications/${notif._id}/read`);
    } catch (err) {
      console.error("Failed to sync notification read state with database:", err);
    }
  };

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
        <Text style={[styles.topBarTitle, { color: theme.iconColor }]}>Notifications</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.topBarButton}>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={theme.iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* Core Dynamic Screen Layout Conditional Rendering Block */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.iconColor} />
          <Text style={[styles.loadingText, { color: theme.subText }]}>Syncing message logs...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="bell-off-outline"
            size={64}
            color={theme.subText}
          />
          <Text style={[styles.emptyText, { color: theme.subText }]}>Inbox completely clean!</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.background }]}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((item) => {
            const notifTheme = getNotificationTheme(item.type);
            return (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.notifCard,
                  { backgroundColor: theme.cardBackground, borderColor: theme.borderColor },
                  !item.isRead && [styles.unreadCardTint, { backgroundColor: darkModeEnabled ? "#334155" : "#F8FAFC", borderColor: theme.borderColor }],
                ]}
                activeOpacity={0.75}
                onPress={() => handleOpenNotification(item)}
              >
                {/* Round Avatar Icon Graphic Box */}
                <View style={[styles.iconContainer, { backgroundColor: notifTheme.bg }]}>
                  <MaterialCommunityIcons
                    name={notifTheme.icon}
                    size={22}
                    color={notifTheme.color}
                  />
                </View>

                {/* Notification Information Main Block Column */}
                <View style={styles.textBlock}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.notifTitle,
                        { color: theme.subText },
                        !item.isRead && [styles.boldText, { color: theme.mainText }],
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {!item.isRead && <View style={[styles.unreadStatusDot, { borderColor: theme.borderColor }]} />}
                  </View>
                  <Text style={[styles.notifDescription, { color: theme.subText }]} numberOfLines={2}>
                    {item.body || item.description}
                  </Text>
                  <Text style={[styles.timeText, { color: theme.subText }]}>
                    {formatTimeStr(item.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Detailed Message Reader Overlay Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedNotif !== null}
        onRequestClose={() => setSelectedNotif(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: darkModeEnabled ? "rgba(15, 23, 42, 0.8)" : "rgba(30, 58, 138, 0.4)" }]}>
          <View style={[styles.modalContentCard, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
            {(() => {
              const notifTheme = getNotificationTheme(selectedNotif?.type);
              return (
                <View style={[styles.modalIconContainer, { backgroundColor: notifTheme.bg }]}>
                  <MaterialCommunityIcons
                    name={notifTheme.icon}
                    size={28}
                    color={notifTheme.color}
                  />
                </View>
              );
            })()}
            <Text style={[styles.modalTitle, { color: theme.mainText }]}>{selectedNotif?.title}</Text>
            <Text style={[styles.modalTime, { color: theme.subText }]}>
              {formatTimeStr(selectedNotif?.createdAt)}
            </Text>
            <Text style={[styles.modalDescription, { color: theme.subText }]}>
              {selectedNotif?.body || selectedNotif?.description}
            </Text>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: theme.iconColor }]}
              activeOpacity={0.8}
              onPress={() => setSelectedNotif(null)}
            >
              <Text style={styles.modalCloseButtonText}>Close Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
          <Text style={[styles.navLabel, { color: "#94A3B8" }]}>Home</Text>
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
          <Text style={[styles.navLabel, { color: "#94A3B8" }]}>Trips</Text>
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
  activeTabIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  boldText: {
    fontWeight: "700",
  },
  bottomNav: {
    borderTopWidth: 1,
    flexDirection: "row",
    height: 74,
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
  },
  iconContainer: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginRight: 14,
    width: 44,
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
  modalCloseButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    width: "100%",
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalContentCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    width: "100%",
  },
  modalDescription: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    marginBottom: 24,
    textAlign: "center",
  },
  modalIconContainer: {
    alignItems: "center",
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    marginBottom: 16,
    width: 64,
  },
  modalOverlay: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modalTime: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
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
  notifCard: {
    alignItems: "flex-start",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    padding: 16,
  },
  notifDescription: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  tabIconBackground: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    marginBottom: 2,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  textBlock: {
    flex: 1,
    justifyContent: "center",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingRight: 4,
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
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  unreadCardTint: {
    borderWidth: 1,
  },
  unreadStatusDot: {
    backgroundColor: "#A3E635",
    borderRadius: 4,
    borderWidth: 0.5,
    height: 8,
    marginLeft: 8,
    width: 8,
  },
});

export default DriverNotis;