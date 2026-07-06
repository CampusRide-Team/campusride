import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context' 
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'

// TODO: BACKEND INTEGRATION — Switch fallback profile objects with live session data contexts from state stores
// import { useAuth } from '../../context/AuthContext'
// import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

// Verified badge icon
const VerifiedBadge = () => (
  <View style={styles.verifiedBadge}>
    <MaterialCommunityIcons name="check" size={14} color="#1E3A8A" />
  </View>
)

// Rating pill indicator
const RatingPill = ({ rating }) => (
  <View style={styles.ratingPill}>
    <MaterialCommunityIcons name="star" size={14} color="#1E3A8A" />
    <Text style={styles.ratingText}>{rating} RATING</Text>
  </View>
)

// Stats row data metrics
const StatsRow = ({ totalTrips, tripsToday }) => (
  <View style={styles.statsRow}>
    <View style={styles.statItem}>
      <MaterialCommunityIcons name="car-multiple" size={24} color="#1E3A8A" style={styles.statIcon} />
      <Text style={styles.statNumber}>{totalTrips}</Text>
      <Text style={styles.statLabel}>TOTAL TRIPS</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <MaterialCommunityIcons name="calendar-month" size={24} color="#1E3A8A" style={styles.statIcon} />
      <Text style={styles.statNumber}>{tripsToday}</Text>
      <Text style={styles.statLabel}>TRIPS TODAY</Text>
    </View>
  </View>
)

// Menu list action row component
const MenuItem = ({ iconName, label, onPress, showDot = false, isFirst = false, isLast = false }) => (
  <TouchableOpacity
    style={[
      styles.menuItem,
      isFirst && styles.menuItemFirst,
      isLast && styles.menuItemLast,
      !isLast && styles.menuItemBorder,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuIconWrap}>
      <MaterialCommunityIcons name={iconName} size={20} color="#475569" />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <View style={styles.menuRight}>
      {showDot && <View style={styles.notifDot} />}
      <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
    </View>
  </TouchableOpacity>
)

const DriverProfile = ({ onLogout, onNavigate, driverData }) => {
  // Fallbacks read clean context values coming down from the master parent context layer
  const user = {
    name:       driverData?.fullName || 'Alex Johnson',
    email:      driverData?.email || 'alex.j@university.edu',
    rating:     4.9,
    totalTrips: 42,
    tripsToday: 5,
    avatar:     driverData?.avatarUri || null, 
    verified:   true,
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top logo header section */}
      <View style={styles.header}>
        <Text style={styles.logoText}>CampusRide</Text>
        <TouchableOpacity onPress={() => onNavigate?.('settings')} activeOpacity={0.8}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.topBarAvatar} />
          ) : (
            <View style={styles.topBarAvatarPlaceholder}>
              <Text style={styles.topBarAvatarInitials}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* User identification header card layout */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => onNavigate?.('settings')} activeOpacity={0.85} style={styles.photoWrap}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Text style={styles.profilePhotoInitials}>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            {user.verified && <VerifiedBadge />}
          </TouchableOpacity>

          <Text style={styles.profileName} numberOfLines={1}>{user.name}</Text>
          <Text style={styles.profileEmail} numberOfLines={1}>{user.email}</Text>
          <RatingPill rating={user.rating} />
        </View>

        {/* User metrics analytics breakdown block */}
        <StatsRow totalTrips={user.totalTrips} tripsToday={user.tripsToday} />

        {/* Settings options card list links */}
        <View style={styles.menuCard}>
          <MenuItem iconName="clock-outline" label="Ride History" onPress={() => onNavigate?.('ride-history')} isFirst />
          <MenuItem iconName="bell-outline" label="Notifications" onPress={() => onNavigate?.('notifications')} showDot />
          <MenuItem iconName="help-circle-outline" label="Help & Support" onPress={() => onNavigate?.('help-support')} />
          <MenuItem iconName="cog-outline" label="Settings" onPress={() => onNavigate?.('app-settings')} isLast />
        </View>

        {/* Account login termination controller action */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
          <MaterialCommunityIcons name="logout" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* App Base System Tab Nav Bar Component */}
      <View style={styles.tabBarContainer}>
        {/* Home Tab */}
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate?.('home')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelText}>Home</Text>
        </TouchableOpacity>

        {/* Trips Tab */}
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate?.('active-requests')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="car-multiple" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelText}>Trips</Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity style={styles.tabItem} onPress={() => onNavigate?.('profile')} activeOpacity={0.7}>
          <View style={[styles.tabIconBackground, styles.activeTabIconBackground]}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#1E3A8A" />
          </View>
          <Text style={[styles.tabLabelText, styles.activeTabLabelText]}>Profile</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  topBarAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  topBarAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarAvatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    gap: 8,
  },
  photoWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  profilePhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#F8FAFC',
  },
  profilePhotoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  profilePhotoInitials: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#A3E635',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E2937',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  menuItemFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  menuItemLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2937',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A3E635',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 74,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBackground: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIconBackground: {
    backgroundColor: '#F1F5F9',
  },
  tabLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeTabLabelText: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
})

export default DriverProfile