import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../context/ThemeContext";  
import api from "../../api/axios";

const { width } = Dimensions.get("window");

const EditDriverProfile = ({
  onBack,
  onChangeTab,
  driverData,
  onProfileUpdated,
}) => {
  const { theme, darkModeEnabled } = useTheme();  
  const [fullName, setFullName] = useState(driverData?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(driverData?.phoneNumber || "");
  const [email, setEmail] = useState(driverData?.email || "");
  const [avatarUri, setAvatarUri] = useState(driverData?.avatarUri || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (driverData) {
      if (driverData.fullName) setFullName(driverData.fullName);
      if (driverData.phoneNumber) setPhoneNumber(driverData.phoneNumber);
      if (driverData.email) setEmail(driverData.email);
      if (driverData.avatarUri) setAvatarUri(driverData.avatarUri);
    }
  }, [driverData]);

  const handleUpdatePhoto = async () => {
    Alert.alert(
      "Update Profile Photo",
      "Choose an option to update your profile picture:",
      [
        {
          text: "Take Photo (Camera)",
          onPress: async () => {
            const cameraPermission =
              await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPermission.granted) {
              Alert.alert(
                "Permission Denied",
                "CampusRide requires camera access to snap pictures.",
              );
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
              setAvatarUri(result.assets[0].uri);
            }
          },
        },
        {
          text: "Choose From Gallery",
          onPress: async () => {
            const galleryPermission =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!galleryPermission.granted) {
              Alert.alert(
                "Permission Denied",
                "CampusRide requires gallery access to browse pictures.",
              );
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
              setAvatarUri(result.assets[0].uri);
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  const handleSaveChanges = async () => {
    const finalName = fullName.trim() || driverData?.fullName || "";
    const finalPhone = phoneNumber.trim() || driverData?.phoneNumber || "";
    const isNewPhotoSelected = avatarUri && avatarUri !== driverData?.avatarUri;

    if (!finalName && !finalPhone && !isNewPhotoSelected) {
      Alert.alert(
        "Validation Error",
        "Profile inputs cannot be left completely empty.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const profilePayload = new FormData();
      profilePayload.append("fullName", finalName);
      profilePayload.append("phoneNumber", finalPhone);
      profilePayload.append("email", email.trim() || driverData?.email || "");

      if (isNewPhotoSelected) {
        const localUriFilename = avatarUri.split("/").pop() || "avatar.jpg";
        const matchFileExtension = /\.(\w+)$/.exec(localUriFilename);
        const fileExt = matchFileExtension
          ? matchFileExtension[1].toLowerCase()
          : "jpg";
        const mimeTypeFormat = fileExt === "png" ? "image/png" : "image/jpeg";

        profilePayload.append("avatar", {
          uri:
            Platform.OS === "android"
              ? avatarUri
              : avatarUri.replace("file://", ""),
          name: `profile_${Date.now()}.${fileExt}`,
          type: mimeTypeFormat,
        });
      }

      const response = await api.put("/driver/profile", profilePayload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        Alert.alert("Success", "Profile updated successfully!");
        if (onProfileUpdated) onProfileUpdated(response.data.data);
        if (onBack) onBack();
      }
    } catch (error) {
      console.error("Profile update transactional exception error:", error);
      Alert.alert(
        "Update Error",
        "Failed to synchronize profile photo with backend.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <StatusBar style={theme.statusBar} />

      {/* Top Bar Navbar Section */}
      <View style={[styles.topBar, { backgroundColor: theme.background, borderBottomColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.topBarButton}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.iconColor }]}>Edit Profile</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image Node Display Block */}
        <View style={styles.avatarSection}>
          <View style={styles.photoContainer}>
            {avatarUri ? (
                <Image 
                  source={{ 
                    uri: avatarUri.startsWith("http") 
                      ? `${avatarUri}?t=${Date.now()}` 
                      : avatarUri 
                  }} 
                  style={styles.avatarImage} 
                />
              ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.iconColor }]}>
                <Text style={styles.avatarInitials}>
                  {fullName?.trim()
                    ? fullName
                        .trim()
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "D"}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.pencilBadgeButton, { borderColor: theme.background }]}
              activeOpacity={0.85}
              onPress={handleUpdatePhoto}
              disabled={isSubmitting}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#1E3A8A" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleUpdatePhoto}
            activeOpacity={0.7}
            style={styles.changePhotoLink}
            disabled={isSubmitting}
          >
            <Text style={[styles.changePhotoLinkText, { color: theme.iconColor }]}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Theme Form Array Stack */}
        <View style={styles.formStack}>
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabelText, { color: theme.mainText }]}>Full Name</Text>
            <TextInput
              style={[styles.textFieldInput, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor, color: theme.mainText }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your name"
              placeholderTextColor={theme.subText}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabelText, { color: theme.mainText }]}>Phone Number</Text>
            <TextInput
              style={[styles.textFieldInput, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor, color: theme.mainText }]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="Enter phone number"
              placeholderTextColor={theme.subText}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabelText, { color: theme.mainText }]}>Email Address (Read-Only)</Text>
            <TextInput
              style={[
                styles.textFieldInput,
                styles.disabledInputField,
                { 
                  backgroundColor: darkModeEnabled ? "#1E293B" : "#E2E8F0", 
                  borderColor: darkModeEnabled ? "#334155" : "#CBD5E1", 
                  color: theme.subText 
                }
              ]}
              value={email}
              editable={false}
              selectTextOnFocus={false}
            />
          </View>
        </View>

        {/* Call To Actions Stacks Footer */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.saveChangesButton,
              { backgroundColor: theme.iconColor },
              isSubmitting && styles.disabledSaveButton,
            ]}
            activeOpacity={0.85}
            onPress={handleSaveChanges}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.cancelButton}
            disabled={isSubmitting}
          >
            <Text style={[styles.cancelButtonText, { color: theme.subText }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Persistence Base System Tab Footer Navigation Frame */}
      <View style={[styles.bottomNav, { backgroundColor: theme.background, borderTopColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onChangeTab && onChangeTab("home")}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="home-outline"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={[styles.navLabel, { color: "#94A3B8" }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onChangeTab && onChangeTab("trips")}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons
              name="car-multiple"
              size={24}
              color="#94A3B8"
            />
          </View>
          <Text style={[styles.navLabel, { color: "#94A3B8" }]}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onBack && onBack()}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          <View
            style={[
              styles.tabIconBackground,
              !darkModeEnabled && styles.activeTabIconBackground,
              darkModeEnabled && { backgroundColor: "#334155" },
            ]}
          >
            <MaterialCommunityIcons
              name="account-circle"
              size={24}
              color={theme.iconColor}
            />
          </View>
          <Text style={[styles.navLabelActive, { color: theme.iconColor }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButtonsContainer: {
    alignItems: "center",
    flexDirection: "column",
    gap: 16,
    width: "100%",
  },
  activeTabIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  avatarImage: {
    borderRadius: 60,
    height: 120,
    width: 120,
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
  },
  avatarPlaceholder: {
    alignItems: "center",
    borderRadius: 60,
    elevation: 2,
    height: 120,
    justifyContent: "center",
    width: 120,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 8,
  },
  bottomNav: {
    borderTopWidth: 1,
    flexDirection: "row",
    height: 74,
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    width: "100%",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  changePhotoLink: {
    paddingVertical: 4,
  },
  changePhotoLinkText: {
    fontSize: 16,
    fontWeight: "700",
  },
  container: {
    flex: 1,
  },
  disabledInputField: {
    fontStyle: "normal",
  },
  disabledSaveButton: {
    backgroundColor: "#94A3B8",
  },
  formStack: {
    gap: 20,
    marginBottom: 40,
  },
  inputLabelText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "column",
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  navLabelActive: {
    fontSize: 11,
    fontWeight: "700",
  },
  pencilBadgeButton: {
    alignItems: "center",
    backgroundColor: "#A3E635",
    borderRadius: 17,
    borderWidth: 3,
    bottom: 0,
    height: 34,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    width: 34,
  },
  photoContainer: {
    height: 120,
    marginBottom: 16,
    position: "relative",
    width: 120,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  saveChangesButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    width: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  tabIconBackground: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    marginBottom: 2,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  textFieldInput: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "600",
    height: 56,
    paddingHorizontal: 16,
  },
  topBar: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  topBarButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  topBarSpacer: {
    width: 40,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
});

export default EditDriverProfile;