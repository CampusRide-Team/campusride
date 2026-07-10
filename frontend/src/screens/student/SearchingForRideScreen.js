import React, { useEffect, useRef } from 'react';
import {
  Animated, Easing, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const BLUE = '#122A6B';
const BLUE_ACCENT = '#2F46C8';
const TEXT = '#0F1733';
const MUTED = '#6B7280';
const BG = '#F5F7FB';
const MAP_BG = '#E6EEFB';
const PICKUP = '#122A6B';
const DROPOFF = '#B7E24A';
const CANCEL_BG = '#E5E7EC';
const TAB_ACTIVE_BG = '#E8ECFF';

function PulseRing({ delay, size }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={[styles.pulseRing, { width: size, height: size, borderRadius: size / 2, transform: [{ scale }], opacity }]}
    />
  );
}

function TabItem({ active, label, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>{icon}</View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SearchingForRideScreen() {
  const [tab, setTab] = React.useState('home');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Searching for Ride</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.mapCard}>
          <View style={styles.dashRow} pointerEvents="none">
            {Array.from({ length: 18 }).map((_, i) => (
              <View
                key={i}
                style={[styles.dash, { top: 120 - Math.sin((i / 17) * Math.PI) * 70, left: 40 + i * 16 }]}
              />
            ))}
          </View>
          <View style={[styles.pinWrap, { left: 24, bottom: 40 }]}>
            <View style={[styles.pin, { backgroundColor: PICKUP }]} />
            <Text style={styles.pinLabel}>Pickup</Text>
          </View>
          <View style={[styles.pinWrap, { right: 28, top: 24 }]}>
            <View style={[styles.pin, { backgroundColor: DROPOFF }]} />
            <Text style={[styles.pinLabel, { color: '#7BAE1F' }]}>Drop-off</Text>
          </View>
        </View>

        <View style={styles.pulseWrap}>
          <PulseRing delay={0} size={220} />
          <PulseRing delay={600} size={220} />
          <PulseRing delay={1200} size={220} />
          <View style={styles.pulseCore}>
            <MaterialCommunityIcons name="car" size={38} color={BLUE} />
          </View>
        </View>

        <Text style={styles.statusText}>Matching you with drivers going your direction.</Text>

        <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.85}>
          <Feather name="x" size={20} color={TEXT} />
          <Text style={styles.cancelText}>Cancel Request</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.tabBar}>
        <TabItem active={tab === 'home'} label="Home"
          icon={<Ionicons name="home" size={22} color={tab === 'home' ? BLUE : MUTED} />}
          onPress={() => setTab('home')} />
        <TabItem active={tab === 'rides'} label="Rides"
          icon={<MaterialCommunityIcons name="car-outline" size={24} color={tab === 'rides' ? BLUE : MUTED} />}
          onPress={() => setTab('rides')} />
        <TabItem active={tab === 'alerts'} label="Alerts"
          icon={<Ionicons name="notifications-outline" size={22} color={tab === 'alerts' ? BLUE : MUTED} />}
          onPress={() => setTab('alerts')} />
        <TabItem active={tab === 'profile'} label="Profile"
          icon={<Feather name="user" size={22} color={tab === 'profile' ? BLUE : MUTED} />}
          onPress={() => setTab('profile')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 14 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: BLUE },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  mapCard: { height: 200, borderRadius: 20, backgroundColor: MAP_BG, overflow: 'hidden', marginTop: 8 },
  dashRow: { position: 'absolute', inset: 0 },
  dash: { position: 'absolute', width: 10, height: 4, borderRadius: 2, backgroundColor: BLUE_ACCENT, transform: [{ rotate: '-10deg' }] },
  pinWrap: { position: 'absolute', alignItems: 'center' },
  pin: { width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#fff' },
  pinLabel: { marginTop: 6, fontSize: 13, fontWeight: '600', color: TEXT },
  pulseWrap: { height: 260, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  pulseRing: { position: 'absolute', backgroundColor: '#C9CEDB' },
  pulseCore: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  statusText: { textAlign: 'center', color: MUTED, fontSize: 16, lineHeight: 24, marginTop: 8, paddingHorizontal: 24 },
  cancelBtn: {
    marginTop: 32, height: 60, borderRadius: 16, backgroundColor: CANCEL_BG,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  cancelText: { fontSize: 17, fontWeight: '600', color: TEXT },
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEF0F5',
    paddingHorizontal: 8, paddingTop: 8, paddingBottom: 12, backgroundColor: '#fff',
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIconWrap: { width: 56, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  tabLabelActive: { color: BLUE, fontWeight: '600' },
});