import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { colors, typography, spacing } from '../../theme';

export const CRLoadingState = ({
  message = 'Loading...',
  variant = 'spinner', // 'spinner' | 'radar' | 'shimmer'
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (variant === 'radar') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.8,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [variant, pulseAnim]);

  if (variant === 'radar') {
    return (
      <View style={[styles.radarContainer, style]}>
        <Animated.View
          style={[
            styles.radarWave,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.8],
                outputRange: [0.6, 0],
              }),
            },
          ]}
        />
        <View style={styles.radarCore} />
        {message ? <Text style={styles.messageText}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.spinnerContainer, style]}>
      <ActivityIndicator size="large" color={colors.brand.primary} />
      {message ? <Text style={styles.messageText}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarContainer: {
    padding: spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarWave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brand.primaryMuted,
  },
  radarCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
  },
  messageText: {
    marginTop: spacing.md,
    fontSize: typography.size.bodyRegular,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
});

export default CRLoadingState;
