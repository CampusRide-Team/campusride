import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { radii, spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export const ActivitySkeletonLoader = ({ count = 4 }) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const items = Array.from({ length: count });

  return (
    <View style={styles.container}>
      {items.map((_, index) => (
        <View
          key={`skeleton-${index}`}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface.base,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          {/* Header Row */}
          <View style={styles.topRow}>
            <Animated.View
              style={[
                styles.shimmerBox,
                styles.titleBox,
                { backgroundColor: colors.surface.elevated, opacity: pulseAnim },
              ]}
            />
            <Animated.View
              style={[
                styles.shimmerBox,
                styles.metadataBox,
                { backgroundColor: colors.surface.elevated, opacity: pulseAnim },
              ]}
            />
          </View>

          {/* Route Row */}
          <Animated.View
            style={[
              styles.shimmerBox,
              styles.routeBox,
              { backgroundColor: colors.surface.elevated, opacity: pulseAnim },
            ]}
          />

          {/* Bottom Row */}
          <View style={[styles.bottomRow, { borderTopColor: colors.border.divider }]}>
            <Animated.View
              style={[
                styles.shimmerBox,
                styles.metaBox,
                { backgroundColor: colors.surface.elevated, opacity: pulseAnim },
              ]}
            />
            <Animated.View
              style={[
                styles.shimmerBox,
                styles.badgeBox,
                { backgroundColor: colors.surface.elevated, opacity: pulseAnim },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  shimmerBox: {
    borderRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleBox: {
    width: '50%',
    height: 16,
  },
  metadataBox: {
    width: 60,
    height: 16,
  },
  routeBox: {
    width: '75%',
    height: 12,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  metaBox: {
    width: '40%',
    height: 10,
  },
  badgeBox: {
    width: 65,
    height: 16,
    borderRadius: 8,
  },
});

export default ActivitySkeletonLoader;
