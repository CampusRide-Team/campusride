import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fonts, spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../../components/common';
import { bookingService } from '../../api/services/bookingService';
import {
  ActivityDateHeader,
  ActivityRideCard,
  ActivitySkeletonLoader,
  ActivityEmptyState,
  TripDetailsSheet,
  RateLaterSheet,
} from '../../components/passenger';

const TERMINAL_STATUSES = [
  'completed',
  'cancelled',
  'cancelled_timeout',
  'failed_no_drivers',
  'emergency_cancelled',
];

export default function RideHistoryScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { colors } = theme;

  const [rides, setRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialError, setInitialError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [ratingBooking, setRatingBooking] = useState(null);

  // 1. Fetch History from Service
  const fetchHistory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
        setRefreshError(null);
      } else {
        setIsLoading(true);
        setInitialError(null);
      }

      const response = await bookingService.getBookingHistory();
      const rawList = Array.isArray(response?.data) ? response.data : [];

      const terminalOnly = rawList.filter(
        (b) => b && TERMINAL_STATUSES.includes(b.status)
      );

      setRides(terminalOnly);
      setInitialError(null);
    } catch (err) {
      console.error('[RideHistoryScreen] Error fetching history:', err);
      if (isRefresh || rides.length > 0) {
        setRefreshError("Couldn't refresh activity");
        setTimeout(() => setRefreshError(null), 3000);
      } else {
        setInitialError("Couldn't load activity");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [rides.length]);

  // 2. Refresh on Screen Focus
  useFocusEffect(
    useCallback(() => {
      fetchHistory(rides.length > 0);
    }, [fetchHistory, rides.length])
  );

  // 3. Date Grouping
  const { todayRides, yesterdayRides, earlierRides } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    const today = [];
    const yesterday = [];
    const earlier = [];

    rides.forEach((item) => {
      const timestamp = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      if (timestamp >= todayStart) {
        today.push(item);
      } else if (timestamp >= yesterdayStart) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    });

    return {
      todayRides: today,
      yesterdayRides: yesterday,
      earlierRides: earlier,
    };
  }, [rides]);

  const handleCardPress = (item) => {
    setSelectedBooking(item);
  };

  const handleBookRide = () => {
    navigation.navigate('HomeTab');
  };

  const handleOpenRate = (booking) => {
    setRatingBooking(booking);
  };

  const completedTripCount = rides.filter((ride) => ride.status === 'completed').length;

  const quickActions = [
    { label: 'Book', icon: 'car-outline', onPress: handleBookRide },
    { label: 'Safety', icon: 'shield-checkmark-outline', onPress: () => navigation.navigate('SafetyTab') },
    { label: 'Support', icon: 'headset-outline', onPress: () => navigation.navigate('HelpSupport') },
    { label: 'Settings', icon: 'settings-outline', onPress: () => navigation.navigate('Settings') },
  ];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.surface.base }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface.base}
      />

      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Activity</Text>
      </View>

      {/* Refresh Error Banner */}
      {refreshError && (
        <View style={[styles.refreshErrorBanner, { backgroundColor: colors.semantic.warningTint }]}>
          <Text style={[styles.refreshErrorText, { color: colors.semantic.warning }]}>{refreshError}</Text>
        </View>
      )}

      {/* Main Content Feed */}
      {isLoading && rides.length === 0 ? (
        <View style={styles.contentPadding}>
          <ActivitySkeletonLoader count={4} />
        </View>
      ) : initialError && rides.length === 0 ? (
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconWrap, { backgroundColor: colors.semantic.dangerTint }]}>
            <CRIcon name="alert-circle-outline" size={32} color={colors.semantic.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>Couldn't load activity</Text>
          <Text style={[styles.errorSub, { color: colors.text.secondary }]}>
            Please check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              {
                backgroundColor: colors.brand.primary,
                borderColor: colors.brand.primaryPressed,
              },
            ]}
            onPress={() => fetchHistory(false)}
            activeOpacity={0.85}
          >
            <Text style={[styles.retryButtonText, { color: colors.brand.onGoldText }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchHistory(true)}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
        >
          {/* 1. Large Summary Header (Reference B Style) */}
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryAvatarWrap, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
              <CRIcon name="car" size={36} color={colors.text.primary} />
              <View style={[styles.summaryBadge, { backgroundColor: colors.brand.primary }]}>
                <CRIcon name="time" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.nameRow}>
              <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
                {rides.length > 0 ? `${completedTripCount} Completed Trips` : 'Your Campus Trips'}
              </Text>
              <CRIcon name="chevron-forward" size={18} color={colors.text.secondary} />
            </View>
            <Text style={[styles.summarySub, { color: colors.text.secondary }]}>
              Past campus routes, trip status & driver feedback
            </Text>
          </View>

          {/* 2. Circular Quick Actions Row (Reference B Style) */}
          <View style={styles.quickRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickAction}
                onPress={action.onPress}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                  <CRIcon name={action.icon} size={22} color={colors.text.primary} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.text.primary }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 3. Empty State or Grouped Trip Sections (Reference B Style) */}
          {rides.length === 0 ? (
            <ActivityEmptyState onBookRide={handleBookRide} />
          ) : (
            <>
              {/* GROUP 1: TODAY */}
              {todayRides.length > 0 && (
                <View style={styles.groupSection}>
                  <Text style={[styles.groupTitle, { color: colors.text.secondary }]}>TODAY</Text>
                  <View style={[styles.groupedCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                    {todayRides.map((item, index) => (
                      <ActivityRideCard
                        key={item._id || item.id}
                        item={item}
                        onPress={handleCardPress}
                        showDateInMetadata={false}
                        showDivider={index < todayRides.length - 1}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* GROUP 2: YESTERDAY */}
              {yesterdayRides.length > 0 && (
                <View style={styles.groupSection}>
                  <Text style={[styles.groupTitle, { color: colors.text.secondary }]}>YESTERDAY</Text>
                  <View style={[styles.groupedCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                    {yesterdayRides.map((item, index) => (
                      <ActivityRideCard
                        key={item._id || item.id}
                        item={item}
                        onPress={handleCardPress}
                        showDateInMetadata={false}
                        showDivider={index < yesterdayRides.length - 1}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* GROUP 3: EARLIER */}
              {earlierRides.length > 0 && (
                <View style={styles.groupSection}>
                  <Text style={[styles.groupTitle, { color: colors.text.secondary }]}>EARLIER</Text>
                  <View style={[styles.groupedCard, { backgroundColor: colors.surface.tile, borderColor: colors.border.subtle }]}>
                    {earlierRides.map((item, index) => (
                      <ActivityRideCard
                        key={item._id || item.id}
                        item={item}
                        onPress={handleCardPress}
                        showDateInMetadata={true}
                        showDivider={index < earlierRides.length - 1}
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}

      {/* 4. Trip Details Modal Bottom Sheet */}
      <TripDetailsSheet
        visible={!!selectedBooking && !ratingBooking}
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onPressRate={handleOpenRate}
      />

      {/* 5. Rate Later Modal Sheet */}
      <RateLaterSheet
        visible={!!ratingBooking}
        booking={ratingBooking}
        onClose={() => setRatingBooking(null)}
        onRatingSuccess={() => {
          setRatingBooking(null);
          setSelectedBooking(null);
          fetchHistory(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.5,
  },
  summaryHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  summaryAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  summaryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  summarySub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
    paddingHorizontal: 4,
  },
  quickAction: {
    alignItems: 'center',
    width: 68,
    gap: 6,
  },
  quickIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  groupSection: {
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  groupedCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  contentPadding: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  refreshErrorBanner: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshErrorText: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  errorIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: fonts.extraBold,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  errorSub: {
    fontSize: 13,
    fontFamily: fonts.medium,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
    marginBottom: spacing.lg,
  },
  retryButton: {
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    minWidth: 160,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
});
