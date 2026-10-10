import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { fonts, spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';

export const ActivityRideCard = ({
  item,
  onPress,
  showDateInMetadata = false,
  showDivider = true,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  if (!item) return null;

  const destinationName = item.dropoff?.name || 'Destination';

  // 1. Authoritative Mode Mapping
  let modeLabel = null;
  if (item.rideMode === 'solo') {
    modeLabel = 'Campus Solo';
  } else if (item.rideMode === 'shared') {
    modeLabel = 'Campus Shared';
  }

  // 2. Authoritative Timestamp Resolution
  let rawTimestamp = null;
  if (item.status === 'completed') {
    rawTimestamp = item.completedAt || item.createdAt;
  } else if (item.cancellation?.cancelledAt) {
    rawTimestamp = item.cancellation.cancelledAt;
  } else {
    rawTimestamp = item.createdAt;
  }

  let formattedTime = null;
  if (rawTimestamp) {
    const dateObj = new Date(rawTimestamp);
    if (!isNaN(dateObj.getTime())) {
      if (showDateInMetadata) {
        formattedTime = dateObj.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        formattedTime = dateObj.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }
  }

  // 3. Status Mapping & Visual Language
  const isCompleted = item.status === 'completed';
  let statusLabel = 'Completed';
  if (item.status === 'completed') {
    statusLabel = 'Completed';
  } else if (item.status === 'cancelled') {
    const role = item.cancellation?.cancelledByRole;
    if (role === 'passenger') {
      statusLabel = 'Cancelled by you';
    } else if (role === 'driver') {
      statusLabel = 'Cancelled by driver';
    } else {
      statusLabel = 'Cancelled';
    }
  } else if (item.status === 'cancelled_timeout' || item.status === 'failed_no_drivers') {
    statusLabel = 'No driver found';
  } else if (item.status === 'emergency_cancelled') {
    statusLabel = 'Ride ended early';
  } else {
    statusLabel = 'Cancelled';
  }

  // 5. Metadata Line Construction
  const metadataString = [
    formattedTime,
    !isCompleted ? statusLabel : null,
    modeLabel,
  ].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderBottomColor: colors.border.subtle,
          borderBottomWidth: showDivider ? 1 : 0,
        },
      ]}
      onPress={() => onPress && onPress(item)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Trip to ${destinationName}, status ${statusLabel}`}
    >
      <View style={[styles.rideIcon, { backgroundColor: colors.surface.base, borderColor: colors.border.subtle }]}>
        <CRIcon name="car" size={18} color={colors.text.primary} />
      </View>
      <View style={styles.rideCopy}>
        <View style={styles.topRow}>
          <Text style={[styles.destinationTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {destinationName}
          </Text>
        </View>
        <Text style={[styles.metadataText, { color: colors.text.secondary }]} numberOfLines={1}>
          {metadataString}
        </Text>
      </View>
      <CRIcon name="chevron-forward" size={16} color={colors.text.muted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rideIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rideCopy: {
    flex: 1,
    marginRight: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  destinationTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    letterSpacing: -0.2,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
});

export default ActivityRideCard;
