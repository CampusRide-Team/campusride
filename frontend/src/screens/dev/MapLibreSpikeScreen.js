import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Camera, Map, NativeUserLocation } from '@maplibre/maplibre-react-native';
import { StatusBar } from 'expo-status-bar';

const OPEN_FREE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const UG_CAMPUS_CENTER = [-0.187, 5.6502];

export default function MapLibreSpikeScreen() {
  const [mapStatus, setMapStatus] = useState('loading');
  const [locationStatus, setLocationStatus] = useState('requesting');
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    let subscription;
    let mounted = true;

    const startLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;

        if (permission.status !== 'granted') {
          setLocationStatus('denied');
          return;
        }

        setLocationStatus('acquiring');
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 3,
            timeInterval: 3000,
          },
          (position) => {
            if (!mounted) return;
            setCoordinates([
              position.coords.longitude,
              position.coords.latitude,
            ]);
            setLocationStatus('ready');
          }
        );
      } catch (error) {
        if (mounted) setLocationStatus('error');
      }
    };

    startLocation();

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  const locationLabel = {
    requesting: 'Requesting location permission…',
    acquiring: 'Acquiring genuine device GPS…',
    denied: 'Location permission denied — map remains available',
    error: 'GPS unavailable — map remains available',
    ready: coordinates
      ? `GPS ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`
      : 'GPS ready',
  }[locationStatus];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Map
        style={styles.map}
        mapStyle={OPEN_FREE_MAP_STYLE}
        androidView="texture"
        attribution
        attributionPosition={{ bottom: 34, right: 8 }}
        onDidFinishLoadingMap={() => setMapStatus('ready')}
        onDidFailLoadingMap={() => setMapStatus('error')}
      >
        <Camera
          initialViewState={{ center: UG_CAMPUS_CENTER, zoom: 15 }}
          trackUserLocation={locationStatus === 'ready' ? 'default' : undefined}
          zoom={16}
        />
        {locationStatus === 'ready' ? <NativeUserLocation /> : null}
      </Map>

      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>CAMPUSRIDE NATIVE MAP SPIKE</Text>
        <Text style={styles.title}>University of Ghana</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              mapStatus === 'ready' && styles.statusDotReady,
              mapStatus === 'error' && styles.statusDotError,
            ]}
          />
          <Text style={styles.statusText}>
            {mapStatus === 'ready'
              ? 'OpenFreeMap vector map loaded'
              : mapStatus === 'error'
                ? 'Map unavailable — check network access'
                : 'Loading OpenFreeMap vector map…'}
          </Text>
        </View>
        <Text style={styles.gpsText}>{locationLabel}</Text>
      </View>

      {mapStatus === 'loading' ? (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color="#0B6E4F" />
          <Text style={styles.loadingText}>Loading native map</Text>
        </View>
      ) : null}

      <View style={styles.attributionLabel} pointerEvents="none">
        <Text style={styles.attributionText}>© OpenStreetMap contributors · OpenFreeMap</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF4EF',
  },
  map: {
    flex: 1,
  },
  headerCard: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    shadowColor: '#153C2E',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  eyebrow: {
    color: '#0B6E4F',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 4,
    color: '#17352B',
    fontSize: 22,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusDot: {
    width: 9,
    height: 9,
    marginRight: 8,
    borderRadius: 5,
    backgroundColor: '#D49A20',
  },
  statusDotReady: {
    backgroundColor: '#16A36A',
  },
  statusDotError: {
    backgroundColor: '#C7463B',
  },
  statusText: {
    flex: 1,
    color: '#365C4D',
    fontSize: 13,
    fontWeight: '700',
  },
  gpsText: {
    marginTop: 8,
    color: '#5E756C',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBadge: {
    position: 'absolute',
    left: 24,
    bottom: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
  },
  loadingText: {
    marginLeft: 9,
    color: '#365C4D',
    fontSize: 12,
    fontWeight: '700',
  },
  attributionLabel: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
  },
  attributionText: {
    color: '#365C4D',
    fontSize: 9,
  },
});
