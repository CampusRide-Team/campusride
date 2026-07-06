import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const DriverNotis = ({ onBack, onChangeTab }) => {
  const [selectedNotif, setSelectedNotif] = useState(null)
  const [mockNotifications, setMockNotifications] = useState([
    {
      id: 'notif_1',
      title: 'New ride request nearby',
      description: 'Sarah requested a Shared ride from the main gate. Tap to review.',
      time: '2 minutes ago',
      icon: 'check',
      iconBg: '#EFF6FF',
      iconColor: '#1E3A8A',
      unread: true,
    },
    {
      id: 'notif_2',
      title: 'Documents verified successfully',
      description: 'Your campus driver permit and vehicle registration logs have been approved by the housing division.',
      time: '1 hour ago',
      icon: 'file-document-outline',
      iconBg: '#EFF6FF',
      iconColor: '#1E3A8A',
      unread: false,
    },
    {
      id: 'notif_3',
      title: 'High demand near Balme Library',
      description: 'Lecture blocks are closing soon. Head toward the central circle loop for immediate passenger requests.',
      time: '3 hours ago',
      icon: 'lightning-bolt-outline',
      iconBg: '#EFF6FF',
      iconColor: '#1E3A8A',
      unread: false,
    },
    {
      id: 'notif_4',
      title: 'System update complete',
      description: 'New optimization features added! Check out our improved route matching maps algorithms.',
      time: 'Yesterday',
      icon: 'bell-outline',
      iconBg: '#F1F5F9',
      iconColor: '#64748B',
      unread: false,
    },
    {
      id: 'notif_5',
      title: 'Ride request cancelled',
      description: 'The Private ride request to Downtown Campus has been cancelled by the student.',
      time: '2 days ago',
      icon: 'alert-circle-outline',
      iconBg: '#FEE2E2',
      iconColor: '#EF4444',
      unread: false,
    },
    {
      id: 'notif_6',
      title: 'Passenger rating submitted',
      description: 'Alex left you feedback note: \"Great driving, very polite!\"',
      time: '3 days ago',
      icon: 'star-outline',
      iconBg: '#EFF6FF',
      iconColor: '#1E3A8A',
      unread: false,
    },
  ])

  // Handle card click, marking as read and opening detailed overlay modal
  const handleOpenNotification = (notif) => {
    setSelectedNotif(notif)
    setMockNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, unread: false } : n)
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top Bar Navbar Section */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.topBarButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Notifications</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.topBarButton}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      {/* Notifications List Container */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {mockNotifications.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.notifCard}
            activeOpacity={0.75}
            onPress={() => handleOpenNotification(item)}
          >
            {/* Round Avatar Icon Graphic Box */}
            <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
              <MaterialCommunityIcons name={item.icon} size={22} color={item.iconColor} />
            </View>

            {/* Notification Information Main Block Column */}
            <View style={styles.textBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                {item.unread && <View style={styles.unreadStatusDot} />}
              </View>
              <Text style={styles.notifDescription} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Detailed Message Reader Overlay Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedNotif !== null}
        onRequestClose={() => setSelectedNotif(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <View style={[styles.modalIconContainer, { backgroundColor: selectedNotif?.iconBg }]}>
              <MaterialCommunityIcons name={selectedNotif?.icon || 'bell'} size={28} color={selectedNotif?.iconColor} />
            </View>
            <Text style={styles.modalTitle}>{selectedNotif?.title}</Text>
            <Text style={styles.modalTime}>{selectedNotif?.time}</Text>
            <Text style={styles.modalDescription}>{selectedNotif?.description}</Text>

            <TouchableOpacity 
              style={styles.modalCloseButton} 
              activeOpacity={0.8} 
              onPress={() => setSelectedNotif(null)}
            >
              <Text style={styles.modalCloseButtonText}>Close Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Persistent App Footer Bottom Nav Tabs Menu */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => onChangeTab && onChangeTab('home')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onChangeTab && onChangeTab('trips')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="car-multiple" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.navLabel}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onBack && onBack()} activeOpacity={0.7}>
          <View style={[styles.tabIconBackground, styles.activeTabIconBackground]}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#1E3A8A" />
          </View>
          <Text style={styles.navLabelActive}>Profile</Text>
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topBarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: 4,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2937',
    flex: 1,
  },
  unreadStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A3E635',
    marginLeft: 8,
    borderWidth: 0.5,
    borderColor: '#1E3A8A',
  },
  notifDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 58, 138, 0.4)', // Themed deep blue backdrop tint
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContentCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E2937',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalCloseButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: 74,
  },
  navItem: {
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
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navLabelActive: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '700',
  },
})

export default DriverNotis