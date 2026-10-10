import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PassengerRideShell } from '../../components/passenger';

export default function PassengerHome({ navigation, onLogout, onToggleTabBar }) {
  return (
    <View style={styles.container}>
      <PassengerRideShell
        navigation={navigation}
        onToggleTabBar={onToggleTabBar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
