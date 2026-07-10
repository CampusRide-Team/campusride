import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
  FontAwesome5,
} from '@expo/vector-icons';

const BLUE = '#122A6B';
const BLUE_ACCENT = '#2F46C8';
const TEXT = '#0F1733';
const MUTED = '#8A8FA3';
const BG = '#F5F7FB';
const CARD = '#ECEEF3';
const ICON_BG = '#E8ECFF';
const LIME = '#C6F24E';
const WHITE = '#FFFFFF';

export default function RequestRideScreen() {
  const [selected, setSelected] = useState('shared');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={BLUE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request a Ride</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pickup / Destination */}
        <View style={styles.locWrap}>
          <View style={styles.locCard}>
            <View style={styles.locIconCol}>
              <Ionicons name="location" size={22} color={BLUE} />
              <View style={styles.dottedLine} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locLabel}>PICKUP</Text>
              <Text style={styles.locValue}>Current Location</Text>
            </View>
          </View>

          <View style={[styles.locCard, { marginTop: 12 }]}>
            <View style={styles.locIconCol}>
              <Ionicons name="flag" size={22} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locLabel}>DESTINATION</Text>
              <Text style={[styles.locValue, { color: MUTED }]}>
                Engineering Building
              </Text>
            </View>
          </View>
        </View>

        {/* Map Mockup */}
        <View style={styles.mapWrap}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=900',
            }}
            style={styles.map}
          />
          <View style={styles.mapDot} />
          <View style={[styles.mapPill, { left: 14 }]}>
            <Ionicons name="time-outline" size={14} color={BLUE} />
            <Text style={styles.mapPillText}>6 mins</Text>
          </View>
          <View style={[styles.mapPill, { right: 14 }]}>
            <Ionicons name="location-outline" size={14} color={BLUE} />
            <Text style={styles.mapPillText}>2.4 miles</Text>
          </View>
        </View>

        {/* Ride Type */}
        <Text style={styles.sectionLabel}>SELECT RIDE TYPE</Text>

        <Pressable
          onPress={() => setSelected('shared')}
          style={[
            styles.rideCard,
            selected === 'shared' && styles.rideCardActive,
          ]}
        >
          <View style={styles.rideIcon}>
            <Ionicons name="people" size={26} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rideTitle, { color: BLUE }]}>Shared Ride</Text>
            <Text style={styles.rideSub}>
              Eco-friendly transit with fellow students
            </Text>
          </View>
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>POPULAR</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setSelected('private')}
          style={[
            styles.rideCard,
            { backgroundColor: CARD, borderColor: 'transparent' },
            selected === 'private' && styles.rideCardActive,
          ]}
        >
          <View style={styles.rideIcon}>
            <Ionicons name="person" size={26} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rideTitle}>Private Ride</Text>
            <Text style={styles.rideSub}>Direct route for focused travel</Text>
          </View>
        </Pressable>

        <View style={styles.seatsPill}>
          <FontAwesome5 name="chair" size={12} color={BLUE} />
          <Text style={styles.seatsText}>4 seats available in this zone</Text>
        </View>

        <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.9}>
          <Text style={styles.confirmText}>CONFIRM RIDE</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TabItem icon={<Ionicons name="home" size={22} color={BLUE} />} label="Home" active />
        <TabItem icon={<MaterialCommunityIcons name="car" size={22} color={MUTED} />} label="Rides" />
        <TabItem icon={<Ionicons name="notifications-outline" size={22} color={MUTED} />} label="Alerts" />
        <TabItem icon={<Feather name="user" size={22} color={MUTED} />} label="Profile" />
      </View>
    </SafeAreaView>
  );
}

function TabItem({ icon, label, active }) {
  return (
    <TouchableOpacity style={styles.tabItem}>
      <View style={[styles.tabIconWrap, active && { backgroundColor: ICON_BG }]}>
        {icon}
      </View>
      <Text style={[styles.tabLabel, active && { color: BLUE, fontWeight: '700' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: { padding: 6, marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: BLUE },

  locWrap: { paddingHorizontal: 16 },
  locCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  locIconCol: { width: 36, alignItems: 'center' },
  dottedLine: {
    position: 'absolute',
    top: 26,
    width: 1,
    height: 30,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: MUTED,
  },
  locLabel: {
    fontSize: 11,
    letterSpacing: 1,
    color: MUTED,
    fontWeight: '700',
    marginBottom: 2,
  },
  locValue: { fontSize: 17, fontWeight: '700', color: TEXT },

  mapWrap: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#6FBBC7',
  },
  map: { width: '100%', height: '100%', opacity: 0.9 },
  mapDot: {
    position: 'absolute',
    top: '48%',
    left: '48%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: LIME,
    borderWidth: 2,
    borderColor: WHITE,
  },
  mapPill: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF2F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapPillText: { color: BLUE, fontWeight: '700', fontSize: 13 },

  sectionLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: MUTED,
    fontWeight: '700',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },

  rideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    gap: 12,
  },
  rideCardActive: { borderColor: BLUE, backgroundColor: WHITE },
  rideIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideTitle: { fontSize: 18, fontWeight: '800', color: TEXT },
  rideSub: { color: MUTED, marginTop: 2, fontSize: 13 },
  popularBadge: {
    backgroundColor: LIME,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  popularText: { color: TEXT, fontSize: 11, fontWeight: '800' },

  seatsPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E4E9F3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  seatsText: { color: BLUE, fontWeight: '600', fontSize: 13 },

  confirmBtn: {
    marginHorizontal: 40,
    marginTop: 24,
    backgroundColor: BLUE,
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
  },
  confirmText: {
    color: WHITE,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 15,
  },

  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingVertical: 10,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  tabLabel: { fontSize: 12, color: MUTED },
});