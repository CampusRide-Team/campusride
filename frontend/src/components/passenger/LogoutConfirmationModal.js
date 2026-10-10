import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { fonts } from '../../theme';

export default function LogoutConfirmationModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
}) {
  const { theme } = useTheme();
  const { colors, typography, radii, spacing } = theme;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onClose}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.surface.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.surface.base,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <View style={[styles.handleBar, { backgroundColor: colors.border.subtle }]} />

              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: colors.semantic.dangerTint,
                    borderColor: colors.semantic.danger,
                  },
                ]}
              >
                <Ionicons name="log-out-outline" size={24} color={colors.semantic.danger} />
              </View>

              <Text style={[styles.title, { color: colors.text.primary }]}>
                Log out of CampusRide?
              </Text>

              <Text style={[styles.description, { color: colors.text.secondary }]}>
                You will need to sign in again before requesting a ride or accessing your trip history.
              </Text>

              <View style={styles.buttonStack}>
                <TouchableOpacity
                  style={[
                    styles.logoutButton,
                    {
                      backgroundColor: colors.semantic.danger,
                      opacity: loading ? 0.7 : 1,
                    },
                  ]}
                  onPress={onConfirm}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: colors.surface.elevated,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                  onPress={onClose}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  buttonStack: {
    width: '100%',
    gap: 10,
  },
  logoutButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  cancelButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
