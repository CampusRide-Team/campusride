import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';

const VEHICLE_TYPES = [
  { id: 'Campus Sedan', label: 'Campus Sedan', capacity: '4', icon: 'car-sport-outline' },
  { id: 'Campus Shuttle', label: 'Campus Shuttle', capacity: '14', icon: 'bus-outline' },
  { id: 'Campus Van', label: 'Campus Van', capacity: '7', icon: 'car-outline' },
];

const VehicleDetailsScreen = ({ onContinue, onBack, route }) => {
  const insets = useSafeAreaInsets();
  const initialData = route?.params || {};

  const [vehicleType, setVehicleType] = useState(initialData?.vehicleType || 'Campus Sedan');
  const [vehicleModel, setVehicleModel] = useState(initialData?.vehicleModel || '');
  const [vehicleLicensePlate, setVehicleLicensePlate] = useState(initialData?.vehicleLicensePlate || '');
  const [vehicleColor, setVehicleColor] = useState(initialData?.vehicleColor || '');
  const [physicalCapacity, setPhysicalCapacity] = useState(initialData?.physicalCapacity || '4');
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isModelValid = vehicleModel.trim().length >= 2;
  const isPlateValid = vehicleLicensePlate.trim().length >= 4;
  const isColorValid = vehicleColor.trim().length >= 2;
  const isCapacityValid = parseInt(physicalCapacity, 10) > 0;
  const isFormValid = isModelValid && isPlateValid && isColorValid && isCapacityValid;

  const handleSelectVehicleType = (typeObj) => {
    setVehicleType(typeObj.id);
    setPhysicalCapacity(typeObj.capacity);
  };

  const handleContinue = () => {
    if (!isFormValid) {
      setError('Please fill in all vehicle specifications accurately');
      return;
    }

    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (onContinue) {
        onContinue({
          ...initialData,
          vehicleType,
          vehicleModel: vehicleModel.trim(),
          vehicleLicensePlate: vehicleLicensePlate.trim().toUpperCase(),
          vehicleColor: vehicleColor.trim(),
          physicalCapacity: parseInt(physicalCapacity, 10) || 4,
          role: 'driver',
        });
      }
    }, 250);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.inner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content Area */}
          <View style={styles.contentBlock}>
            {/* Step Indicator */}
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>DRIVER ONBOARDING • STEP 2 OF 3</Text>
            </View>

            <View style={styles.headerBlock}>
              <Text style={styles.title}>VEHICLE SPECIFICATIONS</Text>
              <Text style={styles.subtitle}>
                Enter the details of the vehicle you will operate with CampusRide.
              </Text>
            </View>

            {/* Vehicle Type Selection Chips */}
            <View style={styles.typesRow}>
              {VEHICLE_TYPES.map((type) => {
                const isSelected = vehicleType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                    onPress={() => handleSelectVehicleType(type)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={type.icon}
                      size={20}
                      color={isSelected ? colors.brand.onGoldText : colors.text.secondary}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        isSelected && styles.typeChipTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Input Pills sitting directly on #ECE5D2 */}
            <View style={styles.formGroup}>
              {/* Vehicle Model */}
              <View
                style={[
                  styles.inputPill,
                  focusedField === 'model' && styles.inputPillFocused,
                  error && !isModelValid && styles.inputPillError,
                ]}
              >
                <TextInput
                  style={styles.inputField}
                  placeholder="Vehicle Model (e.g. Toyota Corolla / Vitz)"
                  placeholderTextColor={colors.text.muted}
                  value={vehicleModel}
                  onChangeText={(val) => {
                    setVehicleModel(val);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('model')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                  autoFocus={true}
                  returnKeyType="next"
                  accessibilityLabel="Vehicle Model"
                />
              </View>

              {/* License Plate */}
              <View
                style={[
                  styles.inputPill,
                  focusedField === 'plate' && styles.inputPillFocused,
                  error && !isPlateValid && styles.inputPillError,
                ]}
              >
                <TextInput
                  style={styles.inputField}
                  placeholder="License Plate (e.g. GW 1234-22)"
                  placeholderTextColor={colors.text.muted}
                  value={vehicleLicensePlate}
                  onChangeText={(val) => {
                    setVehicleLicensePlate(val);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('plate')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="characters"
                  returnKeyType="next"
                  accessibilityLabel="License Plate"
                />
              </View>

              {/* Color & Capacity Row */}
              <View style={styles.rowInputs}>
                <View
                  style={[
                    styles.inputPill,
                    { flex: 1 },
                    focusedField === 'color' && styles.inputPillFocused,
                    error && !isColorValid && styles.inputPillError,
                  ]}
                >
                  <TextInput
                    style={styles.inputField}
                    placeholder="Color (e.g. White)"
                    placeholderTextColor={colors.text.muted}
                    value={vehicleColor}
                    onChangeText={(val) => {
                      setVehicleColor(val);
                      if (error) setError(null);
                    }}
                    onFocus={() => setFocusedField('color')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="words"
                    returnKeyType="next"
                    accessibilityLabel="Vehicle Color"
                  />
                </View>

                <View
                  style={[
                    styles.inputPill,
                    { width: 110 },
                    focusedField === 'capacity' && styles.inputPillFocused,
                    error && !isCapacityValid && styles.inputPillError,
                  ]}
                >
                  <TextInput
                    style={styles.inputField}
                    placeholder="Seats"
                    placeholderTextColor={colors.text.muted}
                    value={physicalCapacity}
                    onChangeText={(val) => {
                      setPhysicalCapacity(val.replace(/[^0-9]/g, ''));
                      if (error) setError(null);
                    }}
                    onFocus={() => setFocusedField('capacity')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={2}
                    accessibilityLabel="Vehicle Seats"
                  />
                </View>
              </View>
            </View>

            {/* Error Feedback */}
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.semantic.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Region */}
          <View style={styles.bottomRegion}>
            {isFormValid ? (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleContinue}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Next step upload documents"
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.brand.onGoldText} />
                ) : (
                  <Text style={styles.continueBtnText}>Next: Upload Documents</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.baseBackground,
  },
  inner: {
    flex: 1,
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
    paddingBottom: 24,
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
    marginBottom: 20,
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
  typesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: colors.surface.base,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    gap: 6,
  },
  typeChipSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  typeChipText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.text.primary,
    textAlign: 'center',
  },
  typeChipTextSelected: {
    color: colors.brand.onGoldText,
  },
  formGroup: {
    gap: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.surface.base,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputPillFocused: {
    borderColor: colors.brand.primary,
  },
  inputPillError: {
    borderColor: colors.semantic.danger,
  },
  inputField: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
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

export default VehicleDetailsScreen;
