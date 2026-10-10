import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, Animated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from '../maps/MapLibreCompat';
import { colors, radii, spacing, typography, fonts } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';
import { DriverMarker } from './DriverMarker';

// University of Ghana default campus center
const UG_CAMPUS_DEFAULT = {
  latitude: 5.6508,
  longitude: -0.1870,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

// Warm Campus Map Style (Cream canvas #ECE5D2, muted roads, soft greens)
const campusMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#ECE5D2' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1A1815' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ECE5D2' }, { weight: 2 }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#E2DAC4' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#D8DEC9' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#D3DDC9' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B665C' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#D3DDC9' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#D8D2C3' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#C89F3E' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#C5D8E0' }],
  },
];

export const PassengerMap = forwardRef(({
  userLocation,
  isLocating,
  pois = [],
  pickupLocation,
  dropoffLocation,
  driverTelemetry = null,
  availableDrivers = [],
  routeCoordinates = [],
  selectedPoi,
  isMapPinMode = false,
  hideUserLocation = false,
  hideDriverMarker = false,
  hidePickupMarker = false,
  showScrim = false,
  onMapPinRegionChange,
  onMapPinRegionChangeComplete,
  onSelectPoi,
  mapBottomInset = 0,
  showPointsOfInterest = false,
  style,
}, ref) => {
  const mapRef = useRef(null);
  const { theme } = useTheme();
  const themeColors = theme.colors;

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 600) => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(region, duration);
      }
    },
    fitToCoordinates: (coordinates, options = {}) => {
      if (mapRef.current && coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 80, right: 50, bottom: 260, left: 50, ...options.edgePadding },
          animated: options.animated !== false,
        });
      }
    },
    getCamera: async () => {
      if (mapRef.current) {
        return await mapRef.current.getCamera();
      }
      return null;
    },
  }));

  const initialRegion = userLocation ? {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  } : UG_CAMPUS_DEFAULT;

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        mapPadding={{ top: 0, right: 0, bottom: mapBottomInset, left: 0 }}
        initialRegion={initialRegion}
        showsCompass={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={showPointsOfInterest}
        customMapStyle={campusMapStyle}
        onRegionChange={isMapPinMode ? onMapPinRegionChange : undefined}
        onRegionChangeComplete={isMapPinMode ? onMapPinRegionChangeComplete : undefined}
      >
        {/* 1. User Current Location Marker */}
        {userLocation && !isMapPinMode && !hideUserLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.userLocationPulse}>
              <View style={styles.userLocationDot}>
                <View style={styles.userLocationCore} />
              </View>
            </View>
          </Marker>
        )}

        {/* 2. Campus POI Markers */}
        {!hidePickupMarker && pois.map((poi) => {
          const coords = poi.coordinates?.coordinates || poi.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) return null;
          const [lng, lat] = coords;
          const isSelected = selectedPoi && (selectedPoi._id === poi._id || selectedPoi.name === poi.name);

          return (
            <Marker
              key={poi._id || poi.id || `${poi.name}-${lat}-${lng}`}
              coordinate={{ latitude: lat, longitude: lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => onSelectPoi && onSelectPoi(poi)}
              tracksViewChanges={false}
            >
              <View style={[styles.poiBadge, isSelected && styles.poiBadgeSelected]}>
                <CRIcon
                  name="business-outline"
                  size={12}
                  color={isSelected ? colors.brand.onGoldText : colors.text.secondary}
                />
                <Text
                  style={[styles.poiLabel, isSelected && styles.poiLabelSelected]}
                  numberOfLines={1}
                >
                  {poi.name}
                </Text>
              </View>
            </Marker>
          );
        })}

        {/* 3. Explicit Pickup Location Marker */}
        {pickupLocation && pickupLocation.coordinates && !isMapPinMode && !hidePickupMarker && (
          <Marker
            coordinate={{
              latitude: pickupLocation.coordinates[1],
              longitude: pickupLocation.coordinates[0],
            }}
            anchor={{ x: 0.5, y: 1.0 }}
            tracksViewChanges={false}
          >
            <View style={styles.pickupMarkerWrap}>
              <View style={styles.pickupMarkerCallout}>
                <Text style={styles.pickupMarkerText} numberOfLines={1}>
                  {pickupLocation.name || 'Pickup'}
                </Text>
              </View>
              <View style={styles.pickupPinHead}>
                <View style={styles.pickupPinInnerDot} />
              </View>
              <View style={styles.pickupPinStem} />
            </View>
          </Marker>
        )}

        {/* 4. Explicit Destination Location Marker */}
        {dropoffLocation && dropoffLocation.coordinates && !isMapPinMode && (
          <Marker
            coordinate={{
              latitude: dropoffLocation.coordinates[1],
              longitude: dropoffLocation.coordinates[0],
            }}
            anchor={{ x: 0.5, y: 1.0 }}
            tracksViewChanges={false}
          >
            <View style={styles.dropoffMarkerWrap}>
              <View style={styles.dropoffMarkerCallout}>
                <Text style={styles.dropoffMarkerText} numberOfLines={1}>
                  {dropoffLocation.name || 'Destination'}
                </Text>
              </View>
              <View style={styles.dropoffPinHead}>
                <View style={styles.dropoffPinInnerDot} />
              </View>
              <View style={styles.dropoffPinStem} />
            </View>
          </Marker>
        )}

        {/* 5. Driver Live Marker (Section 5 Approach & Section 6 Active Trip) */}
        {!driverTelemetry && !isMapPinMode && !hideDriverMarker && availableDrivers.map((driver) => (
          <DriverMarker
            key={String(driver.id)}
            coordinates={[driver.lng, driver.lat]}
            heading={driver.heading}
          />
        ))}

        {driverTelemetry && driverTelemetry.coordinates && !isMapPinMode && !hideDriverMarker && (
          <DriverMarker
            coordinates={driverTelemetry.coordinates}
            heading={driverTelemetry.heading}
          />
        )}

        {/* 6. Authoritative Route Polyline */}
        {routeCoordinates && routeCoordinates.length > 0 && !isMapPinMode && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.brand.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* Tuned Map Scrim Overlay for Section 7 Completion */}
      {showScrim && (
        <View style={styles.scrimOverlay} pointerEvents="none" />
      )}

      {/* 5. Fixed Center Pin for Manual Map Pin Selection Mode */}
      {isMapPinMode && (
        <View style={[styles.fixedCenterPinContainer, { bottom: mapBottomInset }]} pointerEvents="none">
          <View style={styles.fixedPinWrapper}>
            <View style={[styles.fixedPinHead, { backgroundColor: themeColors.brand.primary, borderColor: themeColors.surface.base }]}>
              <View style={[styles.fixedPinDot, { backgroundColor: themeColors.surface.base }]} />
            </View>
            <View style={styles.fixedPinShadow} />
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.brand.baseBackground,
  },
  userLocationPulse: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(200, 159, 62, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 4,
  },
  userLocationCore: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.semantic.info,
  },
  poiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 250, 247, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  poiBadgeSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primaryPressed,
  },
  poiLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  poiLabelSelected: {
    color: colors.brand.onGoldText,
    fontFamily: fonts.bold,
  },
  pickupMarkerWrap: {
    alignItems: 'center',
  },
  pickupMarkerCallout: {
    backgroundColor: colors.text.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
  },
  pickupMarkerText: {
    color: colors.brand.baseBackground,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  pickupPinHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text.primary,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupPinInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
  },
  pickupPinStem: {
    width: 2,
    height: 6,
    backgroundColor: colors.text.primary,
  },
  dropoffMarkerWrap: {
    alignItems: 'center',
  },
  dropoffMarkerCallout: {
    backgroundColor: colors.surface.elevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  dropoffMarkerText: {
    color: colors.text.primary,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  dropoffPinHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text.secondary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropoffPinInnerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  dropoffPinStem: {
    width: 2,
    height: 6,
    backgroundColor: colors.text.secondary,
  },
  fixedCenterPinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedPinWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },
  fixedPinHead: {
    width: 38,
    height: 38,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 5,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
  },
  fixedPinDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  fixedPinShadow: {
    width: 16,
    height: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 24, 21, 0.18)',
    marginTop: 8,
    transform: [{ scaleX: 1.25 }],
  },
  scrimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 24, 21, 0.32)',
  },
});

export default PassengerMap;
