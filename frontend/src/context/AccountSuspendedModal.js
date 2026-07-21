import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // 👈 Using Expo's built-in icons

export default function AccountSuspendedModal({ visible, onClose, userEmail }) {
  const handleContactSupport = () => {
    const supportEmail = 'support@campusride.edu'; 
    const subject = encodeURIComponent('Account Suspension Appeal - CampusRide');
    const body = encodeURIComponent(`Hello CampusRide Admin,\n\nMy account (${userEmail || 'N/A'}) has been suspended. I would like to request a review and appeal regarding this restriction.\n\nReason/Context: `);
    
    Linking.openURL(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          
          <View style={styles.iconContainer}>
            <Ionicons name="shield-outline" size={36} color="#DC2626" />
          </View>

          <Text style={styles.titleText}>Account Suspended</Text>
          <Text style={styles.descriptionText}>
            Your CampusRide account access has been restricted due to a violation of campus transit safety policies or terms of use.
          </Text>

          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>How to appeal:</Text>
            <Text style={styles.instructionText}>
              If you believe this is an error, please reach out directly to the campus transport administration team via email with your account identifier details.
            </Text>
          </View>

          <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
            <Ionicons name="mail-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.supportButtonText}>Contact Support & Appeal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
            <Text style={styles.dismissButtonText}>Back to Login</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center'
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  instructionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  instructionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4
  },
  instructionText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16
  },
  supportButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  supportButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  dismissButton: {
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center'
  },
  dismissButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600'
  }
});