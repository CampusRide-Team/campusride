import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import { Marker } from '../maps/MapLibreCompat';
import { colors } from '../../theme';
import { CRIcon } from '../common';

export const DriverMarker = ({
  coordinates, // [lng, lat]
  heading = 0,
}) => {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const [lng, lat] = coordinates;
  if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return null;
  }

  const validHeading = typeof heading === 'number' && !isNaN(heading) ? heading : 0;

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat={true}
      rotation={validHeading}
      tracksViewChanges={false}
      zIndex={30}
    >
      <View style={styles.markerContainer}>
        <View style={styles.outerRing}>
          <View style={styles.innerCore}>
            <CRIcon name="car" size={14} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.directionPointer} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
  },
  outerRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 5,
  },
  innerCore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionPointer: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.brand.primary,
  },
});

export default DriverMarker;
