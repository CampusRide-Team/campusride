import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import { SUPPORT_CONFIG } from '../../config/appConfig';

const DriverVerificationPendingScreen = ({ onBackToSignIn, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const applicantName = route?.params?.fullName || 'Driver';
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  const illustrationWidth = Math.min(width * 0.76, 290);
  const illustrationHeight = Math.min(width * 0.52, 200);

  const handleReturn = () => {
    if (onBackToSignIn) {
      onBackToSignIn();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Image
          source={require('../../../assets/brand/wordmark_transparent.png')}
          style={styles.brandWordmark}
          resizeMode="contain"
          accessible={false}
          importantForAccessibility="no"
        />
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Main Content Area */}
        <View style={styles.contentBlock}>
          {/* Status Hero Illustration directly on #ECE5D2 */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../../../assets/images/application_under_review.png')}
              style={[
                styles.heroIllustration,
                { width: illustrationWidth, height: illustrationHeight },
              ]}
              resizeMode="contain"
              accessible={false}
              importantForAccessibility="no"
            />
          </View>

          {/* Headline & Subtitle */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>APPLICATION UNDER REVIEW</Text>
            <Text style={styles.subtitle}>
              Thank you, {applicantName}. Your driver application has been submitted and is currently being reviewed.
            </Text>
          </View>

          {/* Flat Verification Timeline directly on #ECE5D2 Canvas */}
          <View style={styles.timelineList}>
            {/* Step 1: Application Submitted */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeftColumn}>
                <View style={[styles.statusNode, styles.statusNodeCompleted]}>
                  <Ionicons name="checkmark" size={16} color={colors.semantic.success} />
                </View>
                <View style={styles.verticalLine} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>APPLICATION SUBMITTED</Text>
                <Text style={styles.timelineDesc}>
                  Your application information and documents were received.
                </Text>
              </View>
            </View>

            {/* Step 2: Review in Progress */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeftColumn}>
                <View style={[styles.statusNode, styles.statusNodeActive]}>
                  <Ionicons name="time" size={14} color={colors.brand.onGoldText} />
                </View>
                <View style={styles.verticalLine} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.brand.primaryPressed }]}>
                  REVIEW IN PROGRESS
                </Text>
                <Text style={styles.timelineDesc}>
                  Your application is being reviewed.
                </Text>
              </View>
            </View>

            {/* Step 3: Account Activation */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeftColumn}>
                <View style={[styles.statusNode, styles.statusNodePending]}>
                  <Ionicons name="ellipse-outline" size={14} color={colors.text.muted} />
                </View>
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text.muted }]}>
                  ACCOUNT ACTIVATION
                </Text>
                <Text style={styles.timelineDesc}>
                  We'll let you know when your application status changes.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Region */}
        <View style={styles.bottomRegion}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleReturn}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Return to sign in"
          >
            <Text style={styles.continueBtnText}>Return to Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportLink}
            onPress={() => setSupportModalVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Need help support"
          >
            <Text style={styles.supportLinkText}>Need help?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Support Info Modal */}
      <Modal
        visible={supportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CampusRide Support</Text>
              <TouchableOpacity
                onPress={() => setSupportModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>
              For inquiries regarding driver applications, please reach out via:
            </Text>
            <View style={styles.supportItem}>
              <Ionicons name="mail-outline" size={18} color={colors.brand.primary} />
              <Text style={styles.supportText}>{SUPPORT_CONFIG.email}</Text>
            </View>
            <View style={styles.supportItem}>
              <Ionicons name="call-outline" size={18} color={colors.brand.primary} />
              <Text style={styles.supportText}>{SUPPORT_CONFIG.phoneNumber}</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSupportModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground, // Continuous #ECE5D2 Canvas
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBarSpacer: {
    width: 44,
    height: 44,
  },
  brandWordmark: {
    height: 26,
    width: 140,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentBlock: {
    width: '100%',
    alignItems: 'center',
  },
  illustrationContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIllustration: {
    backgroundColor: 'transparent',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.text.primary,
    letterSpacing: -0.4,
    lineHeight: 28,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  timelineList: {
    width: '100%',
    paddingHorizontal: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 32,
  },
  statusNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statusNodeCompleted: {
    backgroundColor: colors.semantic.successTint,
    borderColor: colors.semantic.success,
  },
  statusNodeActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  statusNodePending: {
    backgroundColor: 'transparent',
    borderColor: colors.border.subtle,
  },
  verticalLine: {
    width: 2,
    height: 36,
    backgroundColor: colors.border.subtle,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 24,
  },
  timelineTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  timelineDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginTop: 3,
  },
  bottomRegion: {
    width: '100%',
    paddingTop: 24,
    alignItems: 'center',
    gap: 14,
  },
  continueBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.brand.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  continueBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand.onGoldText,
    letterSpacing: 0.3,
  },
  supportLink: {
    padding: 8,
  },
  supportLinkText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface.base,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text.primary,
  },
  modalBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  supportText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text.primary,
  },
  modalCloseBtn: {
    marginTop: 8,
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand.onGoldText,
  },
});

export default DriverVerificationPendingScreen;
