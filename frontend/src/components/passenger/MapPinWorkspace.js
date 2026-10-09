import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { radii, spacing, typography, fonts } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRButton } from '../common';

export const MapPinWorkspace = ({
  resolvedLocationName,
  candidateCoords,
  isResolving = false,
  onConfirmPinLocation,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.brand.baseBackground,
          borderTopColor: colors.border.subtle,
        },
        style,
      ]}
    >
      {/* 1. Grab Bar */}
      <View style={[styles.grabBar, { backgroundColor: colors.border.subtle }]} />

      {/* 2. Selected location hierarchy */}
      <View style={styles.locationCopy}>
        <Text style={[styles.locationLabel, { color: colors.text.secondary }]}>Pinned location</Text>
        <View style={styles.resolvedTextWrap}>
          {isResolving ? (
            <View style={styles.resolvingRow}>
              <ActivityIndicator size="small" color={colors.brand.primary} />
              <Text style={[styles.resolvingText, { color: colors.text.secondary }]}>Finding nearby campus place…</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.resolvedName, { color: colors.text.primary }]} numberOfLines={2}>
                {resolvedLocationName || 'Pinned location'}
              </Text>
              {candidateCoords && (
                <Text style={[styles.resolvedCoords, { color: colors.text.secondary }]}>
                  {candidateCoords[1].toFixed(5)}, {candidateCoords[0].toFixed(5)}
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* 3. Primary action */}
      <View>
        <CRButton
          title="Confirm location"
          onPress={onConfirmPinLocation}
          variant="primary"
          size="large"
          disabled={isResolving || !candidateCoords}
          style={styles.confirmButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs + 4,
    paddingBottom: spacing.md,
    minHeight: 190,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  locationCopy: {
    marginBottom: spacing.md,
  },
  locationLabel: {
    fontFamily: fonts.medium,
    fontSize: typography.size.caption,
    marginBottom: 3,
  },
  resolvedTextWrap: {
    flex: 1,
  },
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resolvingText: {
    fontFamily: fonts.medium,
    fontSize: typography.size.bodyMedium,
    marginLeft: spacing.xs,
  },
  resolvedName: {
    fontFamily: fonts.bold,
    fontSize: typography.size.titleSmall,
    lineHeight: typography.lineHeight.titleSmall,
  },
  resolvedCoords: {
    fontFamily: fonts.regular,
    fontSize: typography.size.caption,
    marginTop: 2,
  },
  confirmButton: {
    width: '100%',
    borderRadius: radii.md,
    height: 50,
  },
});

export default MapPinWorkspace;
