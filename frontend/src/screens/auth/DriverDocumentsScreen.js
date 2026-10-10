import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts } from '../../theme';
import { formatApiError } from '../../api/axios';

const DriverDocumentsScreen = ({ onSubmit, onBack, route }) => {
  const insets = useSafeAreaInsets();
  const registrationData = route?.params || {};

  const [documents, setDocuments] = useState({
    licenseFile: registrationData?.licenseFile || null,
    ghanaCardFront: registrationData?.ghanaCardFront || null,
    ghanaCardBack: registrationData?.ghanaCardBack || null,
    insuranceFile: registrationData?.insuranceFile || null,
  });

  const [uploadingField, setUploadingField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isComplete =
    !!documents.licenseFile &&
    !!documents.ghanaCardFront &&
    !!documents.ghanaCardBack &&
    !!documents.insuranceFile;

  const pickDocumentOrImage = async (fieldKey) => {
    try {
      setError(null);
      setUploadingField(fieldKey);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setDocuments((prev) => ({
          ...prev,
          [fieldKey]: {
            uri: asset.uri,
            name: asset.fileName || `${fieldKey}.jpg`,
            type: asset.mimeType || 'image/jpeg',
          },
        }));
      }
    } catch (err) {
      console.warn('Doc picker error:', err);
      setError('Failed to select file. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveDoc = (fieldKey) => {
    setDocuments((prev) => ({
      ...prev,
      [fieldKey]: null,
    }));
  };

  const handleSubmitApplication = async () => {
    if (!isComplete) {
      setError('Please upload all 4 required verification documents.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit({
          ...registrationData,
          ...documents,
          role: 'driver',
        });
      }
    } catch (err) {
      setError(formatApiError(err, 'Failed to submit driver application. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const DOC_ITEMS = [
    {
      key: 'licenseFile',
      title: "DRIVER'S LICENSE",
      desc: "Clear photo of your valid driver's license.",
      icon: 'card-outline',
    },
    {
      key: 'ghanaCardFront',
      title: 'GHANA CARD — FRONT',
      desc: 'Clear photo of the front of your Ghana Card.',
      icon: 'id-card-outline',
    },
    {
      key: 'ghanaCardBack',
      title: 'GHANA CARD — BACK',
      desc: 'Clear photo of the back of your Ghana Card.',
      icon: 'id-card-outline',
    },
    {
      key: 'insuranceFile',
      title: 'VEHICLE INSURANCE',
      desc: 'Upload your vehicle insurance document.',
      icon: 'shield-outline',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.topBarSpacer} />
        )}

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
          {/* Step Indicator */}
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>DRIVER ONBOARDING • STEP 3 OF 3</Text>
          </View>

          <View style={styles.headerBlock}>
            <Text style={styles.title}>VERIFICATION DOCUMENTS</Text>
            <Text style={styles.subtitle}>
              Upload clear photos or scans of the documents required for your application.
            </Text>
          </View>

          {/* Flat Document List directly on #ECE5D2 canvas */}
          <View style={styles.docList}>
            {DOC_ITEMS.map((item, index) => {
              const doc = documents[item.key];
              const isUploadingThis = uploadingField === item.key;
              const isLast = index === DOC_ITEMS.length - 1;

              return (
                <View
                  key={item.key}
                  style={[styles.docItem, !isLast && styles.docItemDivider]}
                >
                  {/* Item Header: Icon + Title + Description */}
                  <View style={styles.docItemHeader}>
                    <View
                      style={[
                        styles.iconCircle,
                        doc && styles.iconCircleUploaded,
                      ]}
                    >
                      <Ionicons
                        name={doc ? 'checkmark-sharp' : item.icon}
                        size={20}
                        color={doc ? colors.semantic.success : colors.brand.primary}
                      />
                    </View>

                    <View style={styles.docItemInfo}>
                      <Text style={styles.docItemTitle}>{item.title}</Text>
                      <Text style={styles.docItemDesc}>{item.desc}</Text>
                    </View>
                  </View>

                  {/* Item Action Region */}
                  <View style={styles.docItemActionRow}>
                    {isUploadingThis ? (
                      <View style={styles.uploadingState}>
                        <ActivityIndicator size="small" color={colors.brand.primary} />
                        <Text style={styles.uploadingText}>Selecting document...</Text>
                      </View>
                    ) : doc ? (
                      <View style={styles.uploadedControlsRow}>
                        <View style={styles.uploadedBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.semantic.success}
                          />
                          <Text style={styles.uploadedBadgeText} numberOfLines={1}>
                            {doc.name || 'Document attached'}
                          </Text>
                        </View>

                        <View style={styles.uploadedActions}>
                          <TouchableOpacity
                            style={styles.replaceBtn}
                            onPress={() => pickDocumentOrImage(item.key)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={`Replace ${item.title}`}
                          >
                            <Text style={styles.replaceBtnText}>Replace</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => handleRemoveDoc(item.key)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${item.title}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.semantic.danger}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => pickDocumentOrImage(item.key)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Upload ${item.title}`}
                      >
                        <Ionicons
                          name="cloud-upload-outline"
                          size={18}
                          color={colors.text.primary}
                        />
                        <Text style={styles.uploadButtonText}>Upload document</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Contextual Error Message */}
          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={colors.semantic.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Primary Action Region */}
        <View style={styles.bottomRegion}>
          {isComplete ? (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handleSubmitApplication}
              disabled={submitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Submit driver application"
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.brand.onGoldText} />
              ) : (
                <Text style={styles.continueBtnText}>Submit Driver Application</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
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
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
    paddingTop: 16,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  contentBlock: {
    width: '100%',
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.brand.primaryPressed,
    letterSpacing: 0.5,
  },
  headerBlock: {
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.text.primary,
    letterSpacing: -0.4,
    lineHeight: 30,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: 8,
  },
  docList: {
    width: '100%',
  },
  docItem: {
    paddingVertical: 18,
  },
  docItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  docItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  iconCircleUploaded: {
    backgroundColor: colors.semantic.successTint,
  },
  docItemInfo: {
    flex: 1,
  },
  docItemTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text.primary,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  docItemDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginTop: 4,
  },
  docItemActionRow: {
    marginTop: 12,
    marginLeft: 54, // Aligned with the text block after the icon circle
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: colors.surface.base,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  uploadButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.text.primary,
  },
  uploadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  uploadingText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  uploadedControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.semantic.successTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: '60%',
  },
  uploadedBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.semantic.success,
  },
  uploadedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replaceBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  replaceBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.brand.primaryPressed,
    textDecorationLine: 'underline',
  },
  removeBtn: {
    padding: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.semantic.danger,
    flex: 1,
  },
  bottomRegion: {
    width: '100%',
    paddingTop: 24,
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
});

export default DriverDocumentsScreen;
