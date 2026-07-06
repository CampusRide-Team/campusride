import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const RoleSelection = ({ onSelectStudent, onSelectDriver }) => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Logo Branding Header Area */}
        <View style={styles.logoSection}>
          <View style={styles.iconCard}>
            <MaterialCommunityIcons name="car-electric" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>CampusRide</Text>
          <Text style={styles.appTagline}>Safe rides for everyone on campus</Text>
        </View>

        {/* Central Interactivity Option Matrix */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome to CampusRide</Text>
          <Text style={styles.cardSubtitle}>Please select your role to continue</Text>

          <View style={styles.roleGrid}>
            {/* Student Option */}
            <TouchableOpacity 
              style={styles.roleOption} 
              onPress={onSelectStudent}
              activeOpacity={0.75}
            >
              <View style={styles.roleOptionIconCard}>
                <MaterialCommunityIcons name="school" size={26} color="#1E3A8A" />
              </View>
              <View style={styles.roleOptionMeta}>
                <Text style={styles.roleOptionTitle}>Student</Text>
                <Text style={styles.roleOptionSubtitle}>Campus living made easy: just book, ride, and arrive</Text>
              </View>
            </TouchableOpacity>

            {/* Driver Option */}
            <TouchableOpacity 
              style={styles.roleOption} 
              onPress={onSelectDriver}
              activeOpacity={0.75}
            >
              <View style={styles.roleOptionIconCard}>
                <MaterialCommunityIcons name="car" size={26} color="#1E3A8A" />
              </View>
              <View style={styles.roleOptionMeta}>
                <Text style={styles.roleOptionTitle}>Driver</Text>
                <Text style={styles.roleOptionSubtitle}>Access dashboard & manage trips</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 6,
  },
  iconCard: {
    width: 80,
    height: 80,
    borderRadius: 16, 
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,  
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },
  roleGrid: {
    width: '100%',
    gap: 16,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16, 
    padding: 20,
    gap: 16,
  },
  roleOptionIconCard: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  roleOptionMeta: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2937',
    marginBottom: 2,
  },
  roleOptionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
})

export default RoleSelection