import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { CRModal, CRIcon } from '../common';

export const AssignedRideCancellationModal = ({
  visible,
  onClose,
  onConfirmCancel,
  isCancelling = false,
}) => {
  return (
    <CRModal
      visible={visible}
      onClose={onClose}
      title="Cancel ride?"
      description="Are you sure you want to cancel this ride?"
      confirmText={isCancelling ? 'Cancelling...' : 'Cancel Ride'}
      cancelText="Keep Ride"
      onConfirm={onConfirmCancel}
      confirmVariant="danger"
      icon={
        <View style={styles.iconCircle}>
          <CRIcon name="alert-circle-outline" size={32} color={colors.semantic.danger} />
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
    backgroundColor: 'rgba(197, 48, 48, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});

export default AssignedRideCancellationModal;
