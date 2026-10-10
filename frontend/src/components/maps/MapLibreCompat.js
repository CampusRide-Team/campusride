import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker as RNMarker, Polyline as RNPolyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

export { PROVIDER_GOOGLE, PROVIDER_DEFAULT };

export const Marker = ({ coordinate, anchor, onPress, rotation = 0, children, zIndex }) => {
  if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') return null;
  return (
    <RNMarker
      coordinate={coordinate}
      anchor={anchor}
      onPress={onPress}
      rotation={rotation}
      zIndex={zIndex}
    >
      {children}
    </RNMarker>
  );
};

export const Polyline = ({ coordinates = [], strokeColor = '#2563EB', strokeWidth = 4 }) => {
  if (!coordinates || coordinates.length < 2) return null;
  return (
    <RNPolyline
      coordinates={coordinates}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
};

const CustomMapView = forwardRef(({
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

  useImperativeHandle(ref, () => ({
    animateToRegion: (nextRegion, duration = 600) => {
      mapRef.current?.animateToRegion(nextRegion, duration);
    },
    fitToCoordinates: (coordinates, options = {}) => {
      mapRef.current?.fitToCoordinates(coordinates, options);
    },
    getCamera: async () => {
      return await mapRef.current?.getCamera();
    },
  }));

  return (
    <View style={style}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        region={region}
        showsUserLocation={showsUserLocation}
        showsCompass={showsCompass}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        mapPadding={mapPadding}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        onMapReady={onMapReady}
      >
        {children}
      </MapView>
    </View>
  );
});

export default CustomMapView;