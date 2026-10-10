import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingService } from '../../api/services/bookingService';
import { CRIcon } from '../../components/common';
import { useTheme } from '../../context/ThemeContext';
import { fonts, spacing } from '../../theme';
import { cancelRideReminder } from '../../utils/scheduledRideNotifications';

export default function ScheduledRidesScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await bookingService.getScheduledBookings();
      setRides(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      Alert.alert('Could not load scheduled rides', error.message || 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancel = (ride) => Alert.alert('Cancel scheduled ride?', 'This ride will not be dispatched.', [
    { text: 'Keep ride', style: 'cancel' },
    {
      text: 'Cancel ride', style: 'destructive', onPress: async () => {
        try {
          await bookingService.cancelBooking(ride._id, 'Cancelled scheduled ride');
          await cancelRideReminder(ride._id);
          setRides((items) => items.filter((item) => item._id !== ride._id));
        } catch (error) {
          Alert.alert('Could not cancel', error.message || 'Please try again.');
        }
      },
    },
  ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.brand.baseBackground }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}><CRIcon name="arrow-back" size={22} color={colors.text.primary} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Scheduled rides</Text>
        <View style={styles.headerButton} />
      </View>
      {loading ? <ActivityIndicator style={styles.loader} color={colors.brand.primary} /> : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
          <Text style={[styles.heroTitle, { color: colors.text.primary }]}>Your upcoming campus rides</Text>
          <Text style={[styles.heroCopy, { color: colors.text.secondary }]}>Dispatch starts automatically at the scheduled local time.</Text>
          {rides.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surface.tile }]}>
              <CRIcon name="calendar-outline" size={32} color={colors.text.muted} />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No scheduled rides</Text>
              <Text style={[styles.emptyCopy, { color: colors.text.secondary }]}>Choose Schedule from Ride options to plan one.</Text>
            </View>
          ) : rides.map((ride) => (
            <View key={ride._id} style={[styles.card, { borderColor: colors.border.subtle, backgroundColor: colors.surface.base }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.calendarIcon, { backgroundColor: colors.brand.primaryTint }]}><CRIcon name="calendar" size={20} color={colors.brand.primary} /></View>
                <View style={styles.cardHeaderCopy}>
                  <Text style={[styles.timeText, { color: colors.text.primary }]}>{new Date(ride.scheduledTime).toLocaleString()}</Text>
                  <Text style={[styles.modeText, { color: colors.text.secondary }]}>{ride.rideMode === 'shared' ? 'Shared ride' : 'Solo ride'}</Text>
                </View>
              </View>
              <View style={styles.locationRow}><View style={[styles.dot, { backgroundColor: colors.brand.primary }]} /><Text style={[styles.locationText, { color: colors.text.primary }]} numberOfLines={1}>{ride.pickup?.name}</Text></View>
              <View style={[styles.track, { backgroundColor: colors.border.subtle }]} />
              <View style={styles.locationRow}><View style={[styles.dot, { backgroundColor: colors.semantic.danger }]} /><Text style={[styles.locationText, { color: colors.text.primary }]} numberOfLines={1}>{ride.dropoff?.name}</Text></View>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border.subtle }]} onPress={() => cancel(ride)}><Text style={[styles.cancelText, { color: colors.semantic.danger }]}>Cancel scheduled ride</Text></TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 18 },
  loader: { marginTop: 80 },
  content: { padding: spacing.lg, paddingBottom: 50 },
  heroTitle: { fontFamily: fonts.extraBold, fontSize: 26, letterSpacing: -0.7 },
  heroCopy: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 20, marginTop: 4, marginBottom: spacing.lg },
  empty: { padding: 36, borderRadius: 20, alignItems: 'center' },
  emptyTitle: { fontFamily: fonts.extraBold, fontSize: 16, marginTop: spacing.sm },
  emptyCopy: { fontFamily: fonts.medium, fontSize: 12, marginTop: 3, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: 20, padding: spacing.md, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  calendarIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  cardHeaderCopy: { flex: 1 },
  timeText: { fontFamily: fonts.extraBold, fontSize: 15 },
  modeText: { fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  track: { width: 2, height: 15, marginLeft: 4, marginVertical: 2 },
  locationText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 13 },
  cancelButton: { height: 42, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  cancelText: { fontFamily: fonts.bold, fontSize: 12.5 },
});
