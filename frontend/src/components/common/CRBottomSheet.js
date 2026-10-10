import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing, elevation } from '../../theme';

export const CRBottomSheet = ({
  children,
  style,
  showHandle = true,
  ...rest
}) => {
  return (
    <View style={[styles.sheetContainer, style]} {...rest}>
      {showHandle ? (
        <View style={styles.handleContainer}>
          <View style={styles.dragHandle} />
        </View>
      ) : null}
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: colors.surface.base,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...elevation.level3,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  dragHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
});

export default CRBottomSheet;
