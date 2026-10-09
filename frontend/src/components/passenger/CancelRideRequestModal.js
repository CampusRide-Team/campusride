import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, radii, spacing, typography, fonts } from '../../theme';
import { CRModal, CRIcon } from '../common';

export const CancelRideRequestModal = ({
  visible,
  onClose,
  onConfirmCancel,
  isCancelling = false,
}) => {
  return (
    <CRModal
      visible={visible}
      onClose={onClose}
      title="Cancel ride request?"
      description="CampusRide will stop looking for a driver."
      confirmText={isCancelling ? 'Cancelling...' : 'Cancel Request'}
      cancelText="Keep Searching"
      onConfirm={onConfirmCancel}
      confirmVariant="danger"
      icon={
        <View style={styles.iconCircle}>
          <CRIcon name="close-circle-outline" size={32} color={colors.semantic.danger} />
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

export default CancelRideRequestModal;
