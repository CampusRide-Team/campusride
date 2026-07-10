// RateDriverScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  AntDesign,
} from "@expo/vector-icons";

const BLUE = "#122A6B";
const TEXT = "#0F1733";
const MUTED = "#6B7280";
const BG = "#F5F7FB";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const STAR_EMPTY = "#D9DCE3";
const STAR_FILLED = "#F5B301";
const PRIMARY_SOFT = "#A5AEE8";
const TAB_ACTIVE_BG = "#E8ECFF";

function TabItem({ label, active, children }) {
  const color = active ? BLUE : "#9CA3AF";
  return (
    <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
        {React.cloneElement(children, { color })}
      </View>
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function RateDriverScreen() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Driver</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Driver */}
        <View style={styles.driverBlock}>
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri: "https://i.pravatar.cc/300?img=12",
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.driverName}>Michael Chen</Text>
          <Text style={styles.driverSub}>Your CampusRide Driver</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.question}>How was your ride?</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => {
              const filled = i <= rating;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating(i)}
                  activeOpacity={0.7}
                  style={styles.starBtn}
                >
                  <AntDesign
                    name="star"
                    size={40}
                    color={filled ? STAR_FILLED : STAR_EMPTY}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Add a comment (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Share your experience..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={comment}
            onChangeText={setComment}
          />

          <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85}>
            <Text style={styles.submitText}>Submit Rating</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom tabs */}
      <View style={styles.tabBar}>
        <TabItem label="Home" active>
          <Ionicons name="home" size={22} />
        </TabItem>
        <TabItem label="Rides">
          <MaterialCommunityIcons name="car-outline" size={22} />
        </TabItem>
        <TabItem label="Alerts">
          <Feather name="bell" size={22} />
        </TabItem>
        <TabItem label="Profile">
          <FontAwesome5 name="user" size={20} />
        </TabItem>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    height: 56,
    backgroundColor: CARD,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: TEXT },

  scroll: { paddingBottom: 24 },

  driverBlock: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: "hidden",
    backgroundColor: "#ddd",
  },
  avatar: { width: "100%", height: "100%" },
  driverName: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "800",
    color: TEXT,
  },
  driverSub: { marginTop: 4, fontSize: 15, color: MUTED },

  card: {
    backgroundColor: CARD,
    marginHorizontal: 0,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  question: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: TEXT,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 28,
  },
  starBtn: { paddingHorizontal: 6 },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    minHeight: 110,
    padding: 14,
    fontSize: 15,
    color: TEXT,
    textAlignVertical: "top",
    backgroundColor: CARD,
  },

  submitBtn: {
    marginTop: 22,
    backgroundColor: PRIMARY_SOFT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: PRIMARY_SOFT,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingVertical: 8,
    paddingBottom: 14,
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabIconWrap: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 2,
  },
  tabIconWrapActive: { backgroundColor: TAB_ACTIVE_BG },
  tabLabel: { fontSize: 12, fontWeight: "600" },
});