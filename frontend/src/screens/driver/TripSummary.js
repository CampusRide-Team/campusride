import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const TripSummary = ({ onDismiss, onChangeTab, tripData }) => {

  // Fallback structural mock data matching your exact timeframe and distance metrics
  const activeSummary = tripData || {
    driverName: 'Kwame',
    pickupLocation: 'Engineering Block C',
    destinationLocation: 'Student Union North',
    durationText: '12 minutes', 
    distanceText: '4.2 km',      
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top Title Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => onChangeTab?.('trips')} 
          activeOpacity={0.7} 
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Trip Summary</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      {/* Main Core Content Layer */}
      <View style={styles.contentWorkspace}>

        {/* Animated Green Checkmark Vector Circle Badge */}
        <View style={styles.successCircleContainer}>
          <MaterialCommunityIcons name="check" size={48} color="#1E3A8A" />
        </View>

        <Text style={styles.tripCompletedHeadingText}>Trip Completed</Text>
        <Text style={styles.driverGreetingSubtext}>
          Well done, {activeSummary.driverName}. Safe driving!
        </Text>

        {/* Metrics Display Master Card Shell */}
        <View style={styles.summaryCardView}>

          {/* Vertical Route Indicator Timeline Link Block */}
          <View style={styles.routeTimelineTrackRow}>
            <View style={styles.timelineNodeVisualColumn}>
              {/* Pickup Pin - Blue target ring */}
              <View style={styles.pickupOuterCirclePin}>
                <View style={styles.pickupInnerCirclePin} />
              </View>

              <View style={styles.verticalLinkLineTrack} />

              {/* Destination Pin - Green Ring Enclosing Finish Marker */}
              <View style={styles.dropoffOuterCirclePin}>
                <MaterialCommunityIcons name="map-marker" size={14} color="#1E3A8A" />
              </View>
            </View>

            <View style={styles.routeLabelsTextColumn}>
              <View style={styles.labelBlockSegment}>
                <Text style={styles.fieldCategoryMetaLabel}>PICKUP</Text>
                <Text style={styles.locationHeadlineText} numberOfLines={1}>
                  {activeSummary.pickupLocation}
                </Text>
              </View>

              <View style={styles.labelBlockSegment}>
                <Text style={styles.fieldCategoryMetaLabel}>DESTINATION</Text>
                <Text style={styles.locationHeadlineText} numberOfLines={1}>
                  {activeSummary.destinationLocation}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.horizontalDividerRule} />

          {/* Metrics Distribution Row Wrapper */}
          <View style={styles.metricsDistributionGridRow}>
            <View style={styles.metricDataCellUnit}>
              <View style={styles.metricLabelContainer}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#94A3B8" /> 
                <Text style={styles.metricLabelCategory}>Duration</Text>
              </View>
              <Text style={styles.metricValueHeadlineText}>{activeSummary.durationText}</Text>
            </View>

            <View style={styles.metricDataCellUnit}>
              <View style={styles.metricLabelContainer}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color="#94A3B8" /> 
                <Text style={styles.metricLabelCategory}>Distance</Text>
              </View>
              <Text style={styles.metricValueHeadlineText}>{activeSummary.distanceText}</Text>
            </View>
          </View>

        </View>

        {/* TODO: Implement analytical background ledger sync logic tasks on database completion hooks */}
        <Text style={styles.bottomSuccessBannerLabelToast}>Trip successfully completed</Text>
      </View>

      {/* App Base System Tab Nav Bar Component */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity style={styles.tabItem} onPress={onDismiss} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelInactive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab?.('trips')} activeOpacity={0.7}>
          <View style={[styles.tabIconBackground, styles.activeTabIconBackground]}>
            <MaterialCommunityIcons name="car-multiple" size={24} color="#1E3A8A" />
          </View>
          <Text style={styles.tabLabelActive}>Trips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => onChangeTab?.('profile')} activeOpacity={0.7}>
          <View style={styles.tabIconBackground}>
            <MaterialCommunityIcons name="account-circle-outline" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.tabLabelInactive}>Profile</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  contentWorkspace: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCircleContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A3E635',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  tripCompletedHeadingText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  driverGreetingSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 32,
    textAlign: 'center',
  },
  summaryCardView: {
    width: width - 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeTimelineTrackRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 18,
  },
  timelineNodeVisualColumn: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 24,
    marginRight: 14,
    paddingVertical: 4,
  },
  pickupOuterCirclePin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  pickupInnerCirclePin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E3A8A',
  },
  verticalLinkLineTrack: {
    flex: 1,
    width: 2,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  dropoffOuterCirclePin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#A3E635',
  },
  routeLabelsTextColumn: {
    flex: 1,
    gap: 20,
  },
  labelBlockSegment: {
    justifyContent: 'center',
  },
  fieldCategoryMetaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  locationHeadlineText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2937',
  },
  horizontalDividerRule: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  metricsDistributionGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  metricDataCellUnit: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  metricLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabelCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  metricValueHeadlineText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
    paddingLeft: 22,
  },
  bottomSuccessBannerLabelToast: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 32,
    textAlign: 'center',
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
  tabLabelActive: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  tabLabelInactive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
})

export default TripSummary