import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { CRModal, CRIcon } from '../common';

export const RideCancelledModal = ({
  visible,
  onDismiss,
  reason,
}) => {
  const displayReason = reason && typeof reason === 'string' && reason.trim().length > 0
    ? reason.trim()
    : 'Your ride request was cancelled.';

  return (
    <CRModal
      visible={visible}
      onClose={onDismiss}
      title="Ride cancelled"
      description={displayReason}
      confirmText="Back to Route"
      cancelText={null}
      onConfirm={onDismiss}
      confirmVariant="primary"
      icon={
        <View style={styles.iconCircle}>
          <CRIcon name="close-circle-outline" size={32} color={colors.semantic.warning} />
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(200, 159, 62, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});

export default RideCancelledModal;
