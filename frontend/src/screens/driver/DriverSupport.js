import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";  
import { SUPPORT_CONFIG } from "../../config/appConfig";

const { width } = Dimensions.get("window");

const DriverSupport = ({ onBack, onChangeTab }) => {
  const { theme, darkModeEnabled } = useTheme();  
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleAccordion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleSupportPress = () => {
    Alert.alert(
      "Contact Support Desk",
      "Choose how you would like to connect with the campus registry desk:",
      [
        {
          text: "💬 Message via WhatsApp",
          onPress: handleWhatsAppSupport,
        },
        {
          text: "📞 Place Phone Call",
          onPress: handleDialSupport,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  const handleDialSupport = async () => {
    const url = `tel:${SUPPORT_CONFIG.phone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          "Direct voice calling is not supported on this hardware.",
        );
      }
    } catch (err) {
      Alert.alert("Error", "Unable to initialize direct voice dialer.");
    }
  };

  const handleWhatsAppSupport = async () => {
    const cleanPhone = SUPPORT_CONFIG.whatsapp.replace(/[+\s-]/g, "");
    const encodedMsg = encodeURIComponent(SUPPORT_CONFIG.message);
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
        await Linking.openURL(webUrl);
      }
    } catch (err) {
      Alert.alert("Error", "Could not open WhatsApp client applications.");
    }
  };

  const driverFaqs = [
    {
      question: "How do I accept a ride request?",
      answer:
        'When a student places a request, it will appear on your "Active Requests" dashboard. Review the pickup point, destination, and whether it is a Private or Shared ride, then tap "Accept Ride" to initialize navigation tracking.',
    },
    {
      question: "How do multi-stop Shared rides work?",
      answer:
        "If you are on an active Shared trip, the system pool can dynamically send you additional passenger requests along your route. Accepting them updates your live navigation timeline map with optimized multi-stop waypoints.",
    },
    {
      question: "What is the penalty-free cancellation policy?",
      answer:
        'Once you arrive at the designated campus pickup spot, a 5-minute countdown clock begins. If the student fails to arrive within 5 minutes (300 seconds), a "Cancel Ride (No Penalty)" option unlocks to preserve your driver rating score.',
    },
    {
      question: "How do I report a vehicle or map location issue?",
      answer:
        'If a campus route or gate is temporarily locked or under maintenance, use the "Contact Support" module below to alert the housing and transit registry desk to update the routing grid matrix parameters.',
    },
  ];

  const filteredFaqs = driverFaqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <StatusBar style={theme.statusBar} />

      {/* Top Bar Navbar Section */}
      <View style={[styles.topBar, { backgroundColor: theme.background, borderBottomColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.topBarButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.iconColor }]}>Help & Support</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subTitleText, { color: theme.subText }]}>
          Find answers to common questions
        </Text>

        {/* Search Input Box Container */}
        <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={theme.subText}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.mainText }]}
            placeholder="How can we help?"
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Interactive Accordion FAQ Area Block */}
        <View style={styles.faqStack}>
          {filteredFaqs.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View key={index} style={[styles.accordionWrapper, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
                <TouchableOpacity
                  style={[
                    styles.accordionHeader,
                    { backgroundColor: theme.cardBackground },
                    isExpanded && [styles.accordionHeaderExpanded, { borderBottomColor: theme.borderColor }],
                  ]}
                  activeOpacity={0.85}
                  onPress={() => toggleAccordion(index)}
                >
                  <Text style={[styles.questionText, { color: theme.mainText }]}>{faq.question}</Text>
                  <MaterialCommunityIcons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.subText}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.accordionBody, { backgroundColor: theme.background }]}>
                    <Text style={[styles.answerText, { color: theme.subText }]}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Integrated Contact Action Trigger */}
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: theme.iconColor }]}
          activeOpacity={0.85}
          onPress={handleSupportPress}
        >
          <Text style={styles.contactButtonText}>Contact Support Desk</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Persistent App Footer Bottom Nav Tabs Menu */}
      <View style={[styles.bottomNav, { backgroundColor: theme.background, borderTopColor: theme.tabBarBorder }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onChangeTab && onChangeTab("home")}
          activeOpacity={0.7}
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
  accordionBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  accordionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  accordionHeaderExpanded: {
    borderBottomWidth: 1,
  },
  accordionWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  activeTabIconBackground: {
    backgroundColor: "#F1F5F9",
  },
  answerText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  bottomNav: {
    borderTopWidth: 1,
    flexDirection: "row",
    height: 74,
  },
  contactButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    marginTop: 12,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  container: {
    flex: 1,
  },
  faqStack: {
    gap: 12,
    marginBottom: 24,
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
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    paddingRight: 12,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  searchContainer: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    height: 56,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  subTitleText: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 24,
    marginTop: 8,
    textAlign: "center",
  },
  tabIconBackground: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    marginBottom: 2,
    paddingHorizontal: 20,
    paddingVertical: 4,
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

export default DriverSupport;