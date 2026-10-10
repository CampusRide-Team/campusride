import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { fonts, radii, spacing } from '../../theme';
import { CRIcon } from '../../components/common';
import api from '../../api/axios';

export default function RideHistory({ onBack, onChangeTab }) {
  const { theme, isDark } = useTheme();
  const { colors } = theme;

  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'completed' | 'cancelled'

  const formatRideDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recent trip';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent trip';
    }
  };

  const fetchRideHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await api.get('/bookings/history');
      if (response.data?.success && Array.isArray(response.data.data)) {
        setHistoryData(response.data.data);
      } else {
        setHistoryData([]);
      }
    } catch (err) {
      console.error('Error fetching driver ride history:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRideHistory();
  }, [fetchRideHistory]);

  const filteredRides = historyData.filter((ride) => {
    if (activeFilter === 'all') return true;
    const status = (ride.status || 'completed').toLowerCase();
    if (activeFilter === 'completed') return status === 'completed';
    if (activeFilter === 'cancelled') return status.includes('cancel') || status.includes('failed');
    return true;
  });

  const filterTabs = [
    { key: 'all', label: 'All Trips' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Ride History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Segmented Control */}
      <View style={styles.filterRow}>
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                { backgroundColor: colors.surface.elevated, borderColor: colors.border.subtle },
                isSelected && { backgroundColor: colors.brand.primary, borderColor: colors.brand.primaryPressed },
              ]}
              onPress={() => setActiveFilter(tab.key)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterLabel,
                  { color: colors.text.secondary },
                  isSelected && { color: colors.brand.onGoldText, fontFamily: fonts.bold },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading ride archives...
          </Text>
        </View>
      ) : filteredRides.length === 0 ? (
        <View style={styles.centerState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.surface.elevated }]}>
            <CRIcon name="car-outline" size={32} color={colors.text.muted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No rides found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            {activeFilter === 'all'
              ? 'Completed trips and transit archives will appear here.'
              : `No ${activeFilter} rides recorded yet.`}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchRideHistory(true)}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
        >
          {filteredRides.map((ride) => {
            const isCompleted = (ride.status || 'completed').toLowerCase() === 'completed';
            const pickupName = ride.pickupLocation?.address || ride.pickup?.name || ride.pickupLocation || ride.pickup || 'Campus Pickup';
            const dropoffName = ride.destinationLocation?.address || ride.dropoff?.name || ride.dropoffLocation || ride.destination || 'Campus Destination';
            const rideType = (ride.type || ride.rideMode || 'Solo').toLowerCase().includes('shared') ? 'Shared' : 'Solo';
            const tripId = ride._id || ride.id || '';
            const shortId = tripId ? `#${tripId.slice(-6).toUpperCase()}` : '';

            return (
              <View
                key={tripId || Math.random().toString()}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle },
                ]}
              >
                {/* Top Row: Date + Mode Badge + Status Badge */}
                <View style={styles.cardHeader}>
                  <Text style={[styles.dateText, { color: colors.text.muted }]}>
                    {formatRideDate(ride.createdAt || ride.updatedAt)}
                  </Text>

                  <View style={styles.badgesRow}>
                    <View style={[styles.modeBadge, { backgroundColor: colors.surface.elevated }]}>
                      <Text style={[styles.modeBadgeText, { color: colors.text.secondary }]}>
                        {rideType}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isCompleted
                            ? colors.semantic.successTint
                            : colors.semantic.dangerTint,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: isCompleted
                              ? colors.semantic.success
                              : colors.semantic.danger,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: isCompleted
                              ? colors.semantic.success
                              : colors.semantic.danger,
                          },
                        ]}
                      >
                        {isCompleted ? 'Completed' : 'Cancelled'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Middle Row: Route Path */}
                <View style={styles.routeContainer}>
                  <View style={styles.routeNodeCol}>
                    <View style={[styles.pickupDot, { backgroundColor: colors.brand.primary }]} />
                    <View style={[styles.routeTrack, { backgroundColor: colors.border.divider }]} />
                    <View style={[styles.dropoffDot, { backgroundColor: colors.text.primary }]} />
                  </View>

                  <View style={styles.routeTextCol}>
                    <Text style={[styles.locationText, { color: colors.text.primary }]} numberOfLines={1}>
                      {pickupName}
                    </Text>
                    <Text style={[styles.locationText, { color: colors.text.primary }]} numberOfLines={1}>
                      {dropoffName}
                    </Text>
                  </View>
                </View>

                {/* Footer Row: canonical trip reference */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border.divider }]}>
                  <Text style={[styles.tripIdText, { color: colors.text.muted }]}>
                    {shortId ? `Trip ${shortId}` : ''}
                  </Text>
                  <Text style={[styles.modeText, { color: colors.text.primary }]}>{rideType}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
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
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  modeBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
  },
  routeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  routeNodeCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    width: 14,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeTrack: {
    width: 1.5,
    flex: 1,
    marginVertical: 2,
  },
  dropoffDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  routeTextCol: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  locationText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: spacing.xs + 2,
  },
  tripIdText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  modeText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
});
