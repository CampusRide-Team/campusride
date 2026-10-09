import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { fonts, radii, spacing } from '../../theme';
import { CRIcon } from '../../components/common';
import api from '../../api/axios';

export default function DriverNotis({ onBack, onChangeTab }) {
  const { theme, isDark } = useTheme();
  const { colors } = theme;

  const [selectedNotif, setSelectedNotif] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getNotificationTheme = (type) => {
    switch (type) {
      case 'ride_request':
        return {
          icon: 'car-outline',
          bg: colors.brand.primaryTint,
          color: colors.brand.primary,
        };
      case 'rating':
        return {
          icon: 'star-outline',
          bg: colors.brand.primaryTint,
          color: colors.brand.primary,
        };
      case 'verification':
        return {
          icon: 'shield-checkmark-outline',
          bg: colors.semantic.successTint,
          color: colors.semantic.success,
        };
      case 'cancelled':
        return {
          icon: 'alert-circle-outline',
          bg: colors.semantic.dangerTint,
          color: colors.semantic.danger,
        };
      default:
        return {
          icon: 'notifications-outline',
          bg: colors.surface.elevated,
          color: colors.text.secondary,
        };
    }
  };

  const formatTimeStr = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recent';
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await api.get('/driver/notifications');
      if (response.data?.success && Array.isArray(response.data.data)) {
        setNotifications(response.data.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching driver notifications:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleOpenNotification = async (notif) => {
    setSelectedNotif(notif);

    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );

      try {
        await api.patch(`/driver/notifications/${notif._id}/read`);
      } catch (err) {
        console.error('Failed to sync notification read state:', err.message);
      }
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.brand.baseBackground }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.brand.baseBackground}
      />

      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={[styles.backButton, { backgroundColor: colors.surface.elevated }]}
          >
            <CRIcon name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading notifications...
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.surface.elevated }]}>
            <CRIcon name="notifications-off-outline" size={32} color={colors.text.muted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Inbox is clean</Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            Dispatch offers, rating updates, and system notices will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchNotifications(true)}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
        >
          {notifications.map((item) => {
            const notifTheme = getNotificationTheme(item.type);
            const isRead = Boolean(item.isRead);

            return (
              <TouchableOpacity
                key={item._id || Math.random().toString()}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle },
                  !isRead && { borderColor: colors.brand.primaryMuted },
                ]}
                activeOpacity={0.75}
                onPress={() => handleOpenNotification(item)}
              >
                {/* Type Icon Badge */}
                <View style={[styles.iconWrap, { backgroundColor: notifTheme.bg }]}>
                  <CRIcon name={notifTheme.icon} size={20} color={notifTheme.color} />
                </View>

                {/* Content */}
                <View style={styles.textCol}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.titleText,
                        { color: colors.text.primary },
                        !isRead && { fontFamily: fonts.extraBold },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {!isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.brand.primary }]} />
                    )}
                  </View>

                  <Text
                    style={[styles.bodyText, { color: colors.text.secondary }]}
                    numberOfLines={2}
                  >
                    {item.body || item.description}
                  </Text>

                  <Text style={[styles.timeText, { color: colors.text.muted }]}>
                    {formatTimeStr(item.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Notification Reader Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedNotif !== null}
        onRequestClose={() => setSelectedNotif(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface.base, borderColor: colors.border.subtle }]}>
            {(() => {
              const notifTheme = getNotificationTheme(selectedNotif?.type);
              return (
                <View style={[styles.modalIconWrap, { backgroundColor: notifTheme.bg }]}>
                  <CRIcon name={notifTheme.icon} size={26} color={notifTheme.color} />
                </View>
              );
            })()}

            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {selectedNotif?.title}
            </Text>

            <Text style={[styles.modalTime, { color: colors.text.muted }]}>
              {formatTimeStr(selectedNotif?.createdAt)}
            </Text>

            <Text style={[styles.modalBody, { color: colors.text.secondary }]}>
              {selectedNotif?.body || selectedNotif?.description}
            </Text>

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.brand.primary }]}
              activeOpacity={0.8}
              onPress={() => setSelectedNotif(null)}
            >
              <Text style={[styles.modalCloseBtnText, { color: colors.brand.onGoldText }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
  },
  emptySubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  titleText: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    flex: 1,
    paddingRight: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bodyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  timeText: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 19, 17, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalTime: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  modalBody: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalCloseBtn: {
    width: '100%',
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
  },
});