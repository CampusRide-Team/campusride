import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView from '../../components/maps/MapLibreCompat';
import { CRIcon } from '../../components/common';
import { useTheme } from '../../context/ThemeContext';
import { useRide, RIDE_STATES } from '../../context/RideContext';
import { poiService } from '../../api/services/poiService';
import { fonts, radii, spacing } from '../../theme';

const DEFAULT_REGION = { latitude: 5.6508, longitude: -0.187, latitudeDelta: 0.01, longitudeDelta: 0.01 };
const PLACE_TYPES = [
  { id: 'faculty', label: 'Academic building', icon: 'school-outline' },
  { id: 'library', label: 'Library or lab', icon: 'book-outline' },
  { id: 'hall', label: 'Hall', icon: 'business-outline' },
  { id: 'hostel', label: 'Hostel', icon: 'home-outline' },
  { id: 'gate', label: 'Gate or stop', icon: 'flag-outline' },
  { id: 'market', label: 'Market or shop', icon: 'cart-outline' },
  { id: 'sports', label: 'Sports facility', icon: 'football-outline' },
  { id: 'other', label: 'Other campus place', icon: 'location-outline' },
];

export default function AddLocationScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { setDropoffLocation, setRideStep } = useRide();
  const [stage, setStage] = useState('intro');
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [address, setAddress] = useState('Move the map to identify the location');
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const reverseRequestRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const locate = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted) return;
        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        });
      } catch (_) {
        // Campus default remains an honest visual fallback; it is never submitted until the user confirms the pin.
      }
    };
    locate();
    return () => { mounted = false; reverseRequestRef.current += 1; };
  }, []);

  const resolveAddress = useCallback(async (nextRegion) => {
    const requestId = ++reverseRequestRef.current;
    setRegion(nextRegion);
    setResolving(true);
    try {
      const result = await poiService.resolveLocationCoordinates(nextRegion.longitude, nextRegion.latitude);
      if (requestId === reverseRequestRef.current) {
        setAddress(result?.data?.name || `Pinned location (${nextRegion.latitude.toFixed(5)}, ${nextRegion.longitude.toFixed(5)})`);
      }
    } finally {
      if (requestId === reverseRequestRef.current) setResolving(false);
    }
  }, []);

  const submit = async () => {
    if (name.trim().length < 3) {
      Alert.alert('Name required', 'Enter the recognizable name students use for this campus place.');
      return;
    }
    try {
      setSubmitting(true);
      const result = await poiService.submitCampusPlace({
        name: name.trim(),
        category,
        coordinates: [region.longitude, region.latitude],
        campusZone: address,
      });
      const location = {
        name: result?.data?.name || name.trim(),
        coordinates: [region.longitude, region.latitude],
        category,
        campusZone: address,
        source: 'map_pin',
      };
      setDropoffLocation(location);
      setRideStep(RIDE_STATES.REVIEWING_OFFERS);
      Alert.alert(
        'Place submitted',
        'You can use it for this ride now. It will become public after campus review.',
        [{ text: 'Use for ride', onPress: () => navigation.navigate('PassengerMainTabs', { screen: 'HomeTab' }) }],
      );
    } catch (error) {
      Alert.alert('Could not add place', error?.response?.data?.error?.message || error.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === 'intro') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.brand.baseBackground }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Header title="Improve the campus map" onBack={() => navigation.goBack()} colors={colors} />
        <View style={styles.introHero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.brand.primaryTint }]}>
            <CRIcon name="map-outline" size={42} color={colors.brand.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text.primary }]}>Help students find every campus place</Text>
          <Text style={[styles.heroCopy, { color: colors.text.secondary }]}>Add an exam centre, laboratory, hall entrance, shop, or other missing destination.</Text>
        </View>
        <TouchableOpacity style={[styles.actionRow, { borderColor: colors.border.subtle }]} onPress={() => setStage('map')} activeOpacity={0.75}>
          <View style={[styles.actionIcon, { backgroundColor: colors.brand.primaryTint }]}>
            <CRIcon name="location" size={24} color={colors.brand.primary} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={[styles.actionTitle, { color: colors.text.primary }]}>Add a place</Text>
            <Text style={[styles.actionSubtitle, { color: colors.text.secondary }]}>Choose its position, type, and name</Text>
          </View>
          <CRIcon name="chevron-forward" size={20} color={colors.text.muted} />
        </TouchableOpacity>
        <View style={[styles.reviewNotice, { backgroundColor: colors.surface.tile }]}>
          <CRIcon name="shield-checkmark-outline" size={18} color={colors.semantic.success} />
          <Text style={[styles.reviewText, { color: colors.text.secondary }]}>Your place works for your ride immediately. CampusRide reviews it before publishing it to everyone.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.safe, { backgroundColor: colors.brand.baseBackground }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.mapCanvas}>
        <MapView initialRegion={region} onRegionChangeComplete={resolveAddress} style={StyleSheet.absoluteFillObject} />
        <Text style={[styles.moveHint, { top: insets.top + 16, color: colors.text.primary, backgroundColor: colors.surface.base }]}>Move the map to position the place</Text>
        <View pointerEvents="none" style={styles.centerPin}>
          <View style={[styles.pinBadge, { backgroundColor: colors.brand.primary }]}><CRIcon name="add" size={28} color={colors.brand.onGoldText} /></View>
          <View style={[styles.pinStem, { backgroundColor: colors.brand.primary }]} />
        </View>
        <TouchableOpacity style={[styles.mapBack, { top: insets.top + 12, backgroundColor: colors.surface.base }]} onPress={() => setStage('intro')}>
          <CRIcon name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      <View style={[styles.formSheet, { backgroundColor: colors.surface.base, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>Add this campus place</Text>
        <View style={styles.addressRow}>
          <CRIcon name="location" size={20} color={colors.brand.primary} />
          <Text style={[styles.addressText, { color: colors.text.secondary }]} numberOfLines={2}>{resolving ? 'Identifying location…' : address}</Text>
          {resolving ? <ActivityIndicator size="small" color={colors.brand.primary} /> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          {PLACE_TYPES.map((item) => {
            const selected = category === item.id;
            return (
              <TouchableOpacity key={item.id} style={[styles.typeChip, { borderColor: selected ? colors.brand.primary : colors.border.subtle, backgroundColor: selected ? colors.brand.primaryTint : colors.surface.base }]} onPress={() => setCategory(item.id)}>
                <CRIcon name={item.icon} size={16} color={selected ? colors.brand.primary : colors.text.secondary} />
                <Text style={[styles.typeText, { color: selected ? colors.text.primary : colors.text.secondary }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={[styles.nameInputWrap, { borderColor: colors.border.subtle }]}>
          <CRIcon name="pencil-outline" size={18} color={colors.text.secondary} />
          <TextInput value={name} onChangeText={setName} placeholder="Place name" placeholderTextColor={colors.text.muted} style={[styles.nameInput, { color: colors.text.primary }]} maxLength={100} />
        </View>
        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.brand.primary, opacity: submitting ? 0.65 : 1 }]} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.brand.onGoldText} /> : <Text style={[styles.submitText, { color: colors.brand.onGoldText }]}>Submit place</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const Header = ({ title, onBack, colors }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.headerButton} onPress={onBack}><CRIcon name="arrow-back" size={22} color={colors.text.primary} /></TouchableOpacity>
    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{title}</Text>
    <View style={styles.headerButton} />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 18, letterSpacing: -0.35 },
  introHero: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 54, paddingBottom: 42 },
  heroIcon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  heroTitle: { fontFamily: fonts.extraBold, fontSize: 28, lineHeight: 34, textAlign: 'center', letterSpacing: -0.8 },
  heroCopy: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: spacing.sm },
  actionRow: { marginHorizontal: spacing.lg, borderWidth: 1, borderRadius: 20, padding: spacing.md, flexDirection: 'row', alignItems: 'center' },
  actionIcon: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  actionCopy: { flex: 1 },
  actionTitle: { fontFamily: fonts.extraBold, fontSize: 18 },
  actionSubtitle: { fontFamily: fonts.medium, fontSize: 12.5, marginTop: 2 },
  reviewNotice: { margin: spacing.lg, borderRadius: 16, padding: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  reviewText: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 18 },
  mapCanvas: { flex: 1 },
  moveHint: { position: 'absolute', alignSelf: 'center', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 18, fontFamily: fonts.bold, fontSize: 13, elevation: 4 },
  centerPin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -24, marginTop: -48, alignItems: 'center' },
  pinBadge: { width: 48, height: 48, borderRadius: 16, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 7 },
  pinStem: { width: 4, height: 18, borderRadius: 2 },
  mapBack: { position: 'absolute', left: spacing.md, width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  formSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: spacing.lg, paddingTop: spacing.md, elevation: 12 },
  sheetTitle: { fontFamily: fonts.extraBold, fontSize: 24, letterSpacing: -0.6, marginBottom: spacing.sm },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  addressText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18 },
  typeRow: { gap: spacing.xs, paddingVertical: spacing.sm },
  typeChip: { height: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { fontFamily: fonts.bold, fontSize: 11.5 },
  nameInputWrap: { height: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  nameInput: { flex: 1, fontFamily: fonts.semiBold, fontSize: 14 },
  submitButton: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  submitText: { fontFamily: fonts.extraBold, fontSize: 16 },
});
