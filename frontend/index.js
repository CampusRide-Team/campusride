import { registerRootComponent } from 'expo';

const isMapLibreSpikeEnabled = process.env.EXPO_PUBLIC_MAPLIBRE_SPIKE === 'true';

if (__DEV__) {
  console.log(`[CampusRide] MapLibre spike enabled: ${isMapLibreSpikeEnabled}`);
}

const RootComponent = isMapLibreSpikeEnabled
  ? require('./src/screens/dev/MapLibreSpikeScreen').default
  : require('./App').default;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(RootComponent);
