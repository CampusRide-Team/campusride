import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { colors, typography, radii, spacing, elevation } from '../../theme';
import CRButton from './CRButton';

export const CRModal = ({
  visible,
  onClose,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  confirmVariant = 'primary',
  icon,
  children,
  showActions = true,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogCard}>
              {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
              {title ? <Text style={styles.titleText}>{title}</Text> : null}
              {description ? <Text style={styles.descriptionText}>{description}</Text> : null}

              {children}

              {showActions ? (
                <View style={styles.actionRow}>
                  {cancelText ? (
                    <CRButton
                      title={cancelText}
                      variant="secondary"
                      size="medium"
                      onPress={onClose}
                      style={styles.actionBtn}
                    />
                  ) : null}
                  {confirmText && onConfirm ? (
                    <CRButton
                      title={confirmText}
                      variant={confirmVariant}
                      size="medium"
                      onPress={onConfirm}
                      style={styles.actionBtn}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface.base,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...elevation.level4,
  },
  iconWrap: {
    marginBottom: spacing.md,
  },
  titleText: {
    fontSize: typography.size.titleMedium,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.size.bodyRegular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.bodyRegular,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});

export default CRModal;
