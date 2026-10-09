import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker as MapLibreMarker,
  NativeUserLocation,
} from '@maplibre/maplibre-react-native';

const OPEN_FREE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_REGION = {
  latitude: 5.6508,
  longitude: -0.187,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

let nextShapeId = 0;

const isFiniteNumber = (value) => Number.isFinite(Number(value));

const normalizeRegion = (region) => {
  if (!region || !isFiniteNumber(region.latitude) || !isFiniteNumber(region.longitude)) {
    return DEFAULT_REGION;
  }

  return {
    latitude: Number(region.latitude),
    longitude: Number(region.longitude),
    latitudeDelta: Math.max(Number(region.latitudeDelta) || 0.015, 0.00001),
    longitudeDelta: Math.max(Number(region.longitudeDelta) || 0.015, 0.00001),
  };
};

const zoomForRegion = (region) => {
  const normalized = normalizeRegion(region);
  return Math.max(0, Math.min(20, Math.log2(360 / normalized.longitudeDelta)));
};

const regionFromViewState = (viewState) => {
  const [longitude, latitude] = viewState?.center || [DEFAULT_REGION.longitude, DEFAULT_REGION.latitude];
  const bounds = viewState?.bounds;
  const longitudeDelta = Array.isArray(bounds)
    ? Math.max(Math.abs(bounds[2] - bounds[0]), 0.00001)
    : 360 / (2 ** (viewState?.zoom || zoomForRegion(DEFAULT_REGION)));
  const latitudeDelta = Array.isArray(bounds)
    ? Math.max(Math.abs(bounds[3] - bounds[1]), 0.00001)
    : longitudeDelta;

  return { latitude, longitude, latitudeDelta, longitudeDelta };
};

const anchorName = (anchor) => {
  if (!anchor) return 'center';
  const horizontal = anchor.x <= 0.25 ? 'left' : anchor.x >= 0.75 ? 'right' : '';
  const vertical = anchor.y <= 0.25 ? 'top' : anchor.y >= 0.75 ? 'bottom' : '';
  return [vertical, horizontal].filter(Boolean).join('-') || 'center';
};

const validCoordinate = (coordinate) => (
  coordinate
  && isFiniteNumber(coordinate.latitude)
  && isFiniteNumber(coordinate.longitude)
);

export const Marker = ({
  coordinate,
  anchor,
  onPress,
  rotation = 0,
  children,
  zIndex,
}) => {
  if (!validCoordinate(coordinate)) return null;

  return (
    <MapLibreMarker
      lngLat={[Number(coordinate.longitude), Number(coordinate.latitude)]}
      anchor={anchorName(anchor)}
      onPress={onPress}
      style={zIndex == null ? undefined : { zIndex }}
    >
      <View style={rotation ? { transform: [{ rotate: `${rotation}deg` }] } : undefined}>
        {children || <View style={styles.defaultMarker} />}
      </View>
    </MapLibreMarker>
  );
};

export const Polyline = ({
  coordinates = [],
  strokeColor = '#2563EB',
  strokeWidth = 4,
  lineCap = 'round',
  lineJoin = 'round',
}) => {
  const shapeId = useRef(`campusride-route-${nextShapeId += 1}`).current;
  const lineCoordinates = useMemo(() => coordinates
    .filter(validCoordinate)
    .map(({ longitude, latitude }) => [Number(longitude), Number(latitude)]), [coordinates]);

  if (lineCoordinates.length < 2) return null;

  return (
    <GeoJSONSource
      id={`${shapeId}-source`}
      data={{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: lineCoordinates },
      }}
    >
      <Layer
        id={`${shapeId}-layer`}
        type="line"
        paint={{
          'line-color': strokeColor,
          'line-width': strokeWidth,
        }}
        layout={{
          'line-cap': lineCap,
          'line-join': lineJoin,
        }}
      />
    </GeoJSONSource>
  );
};

const MapView = forwardRef(({
  initialRegion,
  region,
  style,
  children,
  onRegionChange,
  onRegionChangeComplete,
  onMapReady,
  showsUserLocation = false,
  showsCompass = false,
  scrollEnabled = true,
  zoomEnabled = true,
  rotateEnabled = true,
  pitchEnabled = true,
  mapPadding,
}, ref) => {
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const latestRegionRef = useRef(normalizeRegion(region || initialRegion));
  const [mapError, setMapError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const initialViewState = useMemo(() => {
    const value = normalizeRegion(initialRegion || region);
    return {
      center: [value.longitude, value.latitude],
      zoom: zoomForRegion(value),
    };
  }, []);

  const moveToRegion = (nextRegion, duration = 0) => {
    const value = normalizeRegion(nextRegion);
    latestRegionRef.current = value;
    const options = {
      center: [value.longitude, value.latitude],
      zoom: zoomForRegion(value),
    };
    if (duration > 0) cameraRef.current?.easeTo({ ...options, duration });
    else cameraRef.current?.jumpTo(options);
  };

  useEffect(() => {
    if (region) moveToRegion(region, 250);
  }, [region?.latitude, region?.longitude, region?.latitudeDelta, region?.longitudeDelta]);

  useImperativeHandle(ref, () => ({
    animateToRegion: (nextRegion, duration = 600) => moveToRegion(nextRegion, duration),
    fitToCoordinates: (coordinates, options = {}) => {
      const valid = coordinates.filter(validCoordinate);
      if (!valid.length) return;
      if (valid.length === 1) {
        moveToRegion({ ...valid[0], latitudeDelta: 0.008, longitudeDelta: 0.008 }, options.animated === false ? 0 : 600);
        return;
      }

      const longitudes = valid.map(({ longitude }) => Number(longitude));
      const latitudes = valid.map(({ latitude }) => Number(latitude));
      cameraRef.current?.fitBounds(
        [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)],
        {
          padding: options.edgePadding,
          duration: options.animated === false ? 0 : 600,
        },
      );
    },
    getCamera: async () => {
      const viewState = await mapRef.current?.getViewState();
      if (!viewState) {
        const current = latestRegionRef.current;
        return { center: { latitude: current.latitude, longitude: current.longitude } };
      }
      return {
        center: { latitude: viewState.center[1], longitude: viewState.center[0] },
        zoom: viewState.zoom,
        heading: viewState.bearing,
        pitch: viewState.pitch,
      };
    },
  }));

  const handleRegionChange = (event, callback) => {
    const nextRegion = regionFromViewState(event.nativeEvent);
    latestRegionRef.current = nextRegion;
    callback?.(nextRegion, { isGesture: event.nativeEvent?.userInteraction });
  };

  return (
    <View style={style}>
      <Map
        key={retryKey}
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        mapStyle={OPEN_FREE_MAP_STYLE}
        androidView="texture"
        attribution
        logo={false}
        compass={showsCompass}
        dragPan={scrollEnabled}
        touchZoom={zoomEnabled}
        doubleTapZoom={zoomEnabled}
        touchRotate={rotateEnabled}
        touchPitch={pitchEnabled}
        onRegionIsChanging={onRegionChange ? (event) => handleRegionChange(event, onRegionChange) : undefined}
        onRegionDidChange={onRegionChangeComplete ? (event) => handleRegionChange(event, onRegionChangeComplete) : undefined}
        onDidFinishLoadingMap={() => {
          setMapError(false);
          onMapReady?.();
        }}
        onDidFailLoadingMap={() => setMapError(true)}
      >
        <Camera ref={cameraRef} initialViewState={initialViewState} padding={mapPadding} />
        {showsUserLocation && <NativeUserLocation />}
        {children}
      </Map>
      {mapError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Map unavailable. Check your internet connection.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setMapError(false); setRetryKey((value) => value + 1); }}>
            <Text style={styles.retryText}>Retry map</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  defaultMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C89F3E',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236, 229, 210, 0.9)',
    padding: 24,
  },
  errorText: {
    color: '#1A1815',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: { marginTop: 12, borderRadius: 10, backgroundColor: '#1E3A8A', paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

export default MapView;
