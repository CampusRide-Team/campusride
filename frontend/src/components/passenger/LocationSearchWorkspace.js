import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts, radii, spacing, typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';
import { poiService } from '../../api/services/poiService';
import { normalizePoiLocation } from '../../utils/locationSelection';

// Haversine formula to compute distance in km matching Reference Image 2
const calculateDistanceKm = (fromCoords, toPoi) => {
  if (!fromCoords) return null;
  const rawTo = toPoi?.coordinates?.coordinates || toPoi?.coordinates;
  if (!Array.isArray(rawTo) || rawTo.length < 2) return null;
  const lon1 = Number(fromCoords[0]);
  const lat1 = Number(fromCoords[1]);
  const lon2 = Number(rawTo[0]);
  const lat2 = Number(rawTo[1]);
  if (!Number.isFinite(lon1) || !Number.isFinite(lat1) || !Number.isFinite(lon2) || !Number.isFinite(lat2)) return null;

  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d > 0 ? `${d.toFixed(1)} km` : null;
};

const locationKey = (location) => {
  const id = location?._id || location?.id || location?.poiId;
  if (id) return `poi:${id}`;
  const coords = location?.coordinates?.coordinates || location?.coordinates;
  return Array.isArray(coords) && coords.length >= 2
    ? `coord:${Number(coords[0]).toFixed(6)}:${Number(coords[1]).toFixed(6)}`
    : null;
};

export const LocationSearchWorkspace = ({
  pickupLocation,
  dropoffLocation,
  initialActiveField = 'destination',
  onSelectLocation,
  onInitiateMapPin,
  onUseCurrentLocation,
  onSwapLocations,
  isLocating = false,
  locationError,
  onPressBack,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const [activeField, setActiveField] = useState(initialActiveField);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [campusPois, setCampusPois] = useState([]);
  const [recentLocations, setRecentLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (initialActiveField === 'pickup') {
        pickupInputRef.current?.focus();
      } else {
        dropoffInputRef.current?.focus();
      }
    }, 150);
    return () => {
      clearTimeout(focusTimer);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [initialActiveField]);

  useEffect(() => {
    let isMounted = true;
    const loadInitialPOIs = async () => {
      try {
        const allPoisRes = await poiService.getAllPOIs(50);
        if (!isMounted) return;
        const allPois = allPoisRes?.success && Array.isArray(allPoisRes.data) ? allPoisRes.data : [];
        const recents = await poiService.refreshRecentLocations(allPois);
        if (!isMounted) return;
        if (allPoisRes?.success && Array.isArray(allPoisRes.data)) {
          setCampusPois(allPoisRes.data);
        }
        if (Array.isArray(recents) && recents.length > 0) {
          setRecentLocations(recents);
        }
      } catch (err) {
        console.warn('[LocationSearch] Error loading campus POIs:', err);
      }
    };
    loadInitialPOIs();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchPOIs = async (searchQuery, includeExternal = false) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      requestIdRef.current += 1;
      setResults([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = includeExternal
        ? await poiService.searchOpenStreetMap(trimmed, 12)
        : await poiService.searchPOIs(trimmed, '', 20);
      if (requestId !== requestIdRef.current) return;
      const apiResults = response?.success && Array.isArray(response.data) ? response.data : [];
      if (apiResults.length > 0) {
        setResults(apiResults);
      } else {
        const filtered = campusPois.filter((p) =>
          p.name?.toLowerCase().includes(trimmed.toLowerCase())
          || p.aliases?.some((alias) => alias.toLowerCase().includes(trimmed.toLowerCase()))
        );
        setResults(filtered);
        if (!filtered.length) {
          setErrorMessage(includeExternal
            ? `No mapped campus places found for “${trimmed}”.`
            : 'Press Search on the keyboard to search OpenStreetMap.');
        }
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.warn('[LocationSearch] Error fetching POIs:', error);
      const filtered = campusPois.filter((p) =>
        p.name?.toLowerCase().includes(trimmed.toLowerCase())
        || p.aliases?.some((alias) => alias.toLowerCase().includes(trimmed.toLowerCase()))
      );
      setResults(filtered);
      setErrorMessage(filtered.length ? 'Showing saved campus places while search is unavailable.' : 'Campus search is unavailable. Check your connection and retry.');
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  const handleQueryChange = (text) => {
    requestIdRef.current += 1;
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    // Typing searches the local curated/cache catalog only. Public Nominatim
    // explicitly forbids client-side autocomplete; an OSM lookup happens only
    // when the user submits the keyboard Search action.
    debounceTimerRef.current = setTimeout(() => fetchPOIs(text, false), 250);
  };

  const handleExternalSearch = () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    fetchPOIs(query, true);
  };

  const handleSelectPoi = (poi) => {
    const formattedLocation = normalizePoiLocation(poi);
    if (!formattedLocation) return;
    Keyboard.dismiss();
    onSelectLocation?.(activeField, formattedLocation);
    poiService.saveRecentLocation(formattedLocation).catch(() => {});
  };

  const handleSetPinOnMap = () => {
    Keyboard.dismiss();
    onInitiateMapPin?.(activeField);
  };

  const handleSwitchToPickup = () => {
    setActiveField('pickup');
    setQuery('');
    setResults([]);
    pickupInputRef.current?.focus();
  };

  const handleSwitchToDestination = () => {
    setActiveField('destination');
    setQuery('');
    setResults([]);
    dropoffInputRef.current?.focus();
  };

  const handleSwap = () => {
    onSwapLocations?.();
  };

  const displayList = useMemo(() => {
    if (query.trim().length > 0) {
      return results;
    }
    if (recentLocations.length > 0) {
      return recentLocations;
    }
    return campusPois;
  }, [query, results, recentLocations, campusPois]);

  const originCoords = pickupLocation?.coordinates;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.surface.base }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 1. Header Bar: Close 'X' + 'Route' Title matching Reference Image 2 */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onPressBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <CRIcon name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Route</Text>
      </View>

      {/* 2. Dual-Input Stacked Container with Green Active Outline & Swap Button */}
      <View style={styles.inputsSection}>
        <View style={styles.inputsColumn}>
          {/* Pickup Input Row */}
          <TouchableOpacity
            style={[
              styles.inputRow,
              activeField === 'pickup'
                ? [styles.inputRowActive, { borderColor: colors.brand.primary }]
                : styles.inputRowInactive,
            ]}
            onPress={handleSwitchToPickup}
            activeOpacity={0.9}
          >
            <View style={styles.pickupDotIcon}>
              <View style={styles.pickupDotCircle} />
            </View>

            {activeField === 'pickup' ? (
              <TextInput
                ref={pickupInputRef}
                value={query}
                onChangeText={handleQueryChange}
                placeholder={pickupLocation?.name || 'Pickup location'}
                placeholderTextColor={colors.text.muted}
                style={[styles.textInput, { color: colors.text.primary }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleExternalSearch}
              />
            ) : (
              <Text
                style={[styles.inputTextDisplay, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                {pickupLocation?.name || 'Current location'}
              </Text>
            )}

            <TouchableOpacity
              style={styles.inputEndBtn}
              onPress={() => {
                if (activeField === 'pickup' && query) {
                  handleQueryChange('');
                } else {
                  handleSwitchToPickup();
                }
              }}
              accessibilityLabel="Add stop"
            >
              <CRIcon name={activeField === 'pickup' && query ? 'close-circle' : 'add'} size={20} color="#4B5563" />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Dropoff Input Row */}
          <TouchableOpacity
            style={[
              styles.inputRow,
              activeField === 'destination'
                ? [styles.inputRowActive, { borderColor: colors.brand.primary }]
                : styles.inputRowInactive,
            ]}
            onPress={handleSwitchToDestination}
            activeOpacity={0.9}
          >
            <CRIcon name="search-outline" size={18} color={colors.text.primary} style={styles.searchIcon} />

            {activeField === 'destination' ? (
              <TextInput
                ref={dropoffInputRef}
                value={query}
                onChangeText={handleQueryChange}
                placeholder="Dropoff location"
                placeholderTextColor={colors.text.muted}
                style={[styles.textInput, { color: colors.text.primary }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleExternalSearch}
              />
            ) : (
              <Text
                style={[
                  styles.inputTextDisplay,
                  { color: dropoffLocation?.name ? colors.text.primary : colors.text.muted },
                ]}
                numberOfLines={1}
              >
                {dropoffLocation?.name || 'Dropoff location'}
              </Text>
            )}

            {/* Mini Map Thumbnail Button with Pin matching Reference Image 2 */}
            <TouchableOpacity
              style={styles.miniMapBtn}
              onPress={handleSetPinOnMap}
              activeOpacity={0.75}
              accessibilityLabel="Set on map"
            >
              <View style={styles.miniMapBox}>
                <CRIcon name="location" size={15} color={colors.brand.primary} />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Swap Button on the Right */}
        <TouchableOpacity
          style={styles.swapButton}
          onPress={handleSwap}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Swap pickup and dropoff"
        >
          <CRIcon name="swap-vertical" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Subtle Divider below Inputs */}
      <View style={styles.headerDivider} />

      {/* 3. Results / Recents List matching Reference Image 2 */}
      <View style={styles.resultsContainer}>
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={colors.brand.primary} />
            <Text style={[styles.stateText, { color: colors.text.secondary }]}>Searching destinations…</Text>
          </View>
        ) : errorMessage && displayList.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { color: colors.text.secondary }]}>{errorMessage}</Text>
          </View>
        ) : (
          <FlatList
            data={displayList}
            keyExtractor={(item, index) => item._id || item.id || `${item.name}-${index}`}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const distanceKm = calculateDistanceKm(originCoords, item);
              const subtitle = item.campusZone || item.address || 'Legon, Accra';
              const selectedLocation = activeField === 'pickup' ? pickupLocation : dropoffLocation;
              const isSelected = Boolean(locationKey(item) && locationKey(item) === locationKey(selectedLocation));

              return (
                <TouchableOpacity
                  style={[styles.resultRow, isSelected && { backgroundColor: colors.brand.primaryTint }]}
                  onPress={() => handleSelectPoi(item)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                >
                  {/* Left: Clock Icon in circle matching Reference Image 2 */}
                  <View style={styles.clockIconWrap}>
                    <CRIcon name="time-outline" size={22} color="#4B5563" />
                  </View>

                  {/* Center: Title & Subtitle */}
                  <View style={styles.copyCol}>
                    <Text style={[styles.itemTitle, { color: colors.text.primary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemSubtitle, { color: colors.text.secondary }]} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  </View>

                  {/* Right: Distance in km matching Reference Image 2 */}
                  {distanceKm ? (
                    <Text style={[styles.distanceText, { color: colors.text.secondary }]}>
                      {distanceKm}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    marginBottom: spacing.xs,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  inputsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputsColumn: {
    flex: 1,
    gap: spacing.xs + 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 12,
    paddingHorizontal: spacing.sm + 2,
  },
  inputRowActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  inputRowInactive: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickupDotIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  pickupDotCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  inputTextDisplay: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  inputEndBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapButton: {
    width: 40,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: -spacing.md,
    marginBottom: spacing.xs,
  },
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  clockIconWrap: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  copyCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  itemTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  itemSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 2,
  },
  distanceText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  stateText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
});

export default LocationSearchWorkspace;
