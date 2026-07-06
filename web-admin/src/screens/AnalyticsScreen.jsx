import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Zap, 
  Star
} from 'lucide-react'

export default function AnalyticsScreen() {
  const [metrics, setMetrics] = useState([])
  const [popularZones, setPopularZones] = useState([])
  const [driverPerformance, setDriverPerformance] = useState([])
  const [chartData, setChartData] = useState([])
  const [activityOverview, setActivityOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)

        // 💡 BACKEND TODO: Connect REST cache layer aggregation queries across time-series models
        // const [summaryRes, zonesRes, performanceRes, distributionRes, overviewRes] = await Promise.all([
        //   axios.get('/api/v1/admin/analytics/summary'),
        //   axios.get('/api/v1/admin/analytics/popular-hubs'),
        //   axios.get('/api/v1/admin/analytics/driver-performance'),
        //   axios.get('/api/v1/admin/analytics/trip-distribution'),
        //   axios.get('/api/v1/admin/analytics/rider-overview')
        // ])

        setMetrics([
          { id: 1, label: 'Total Trips This Week', value: '945', change: '+2.7%', icon: <BarChart3 size={18} color="#1E3A8A" />, bg: '#DBEAFE' },
          { id: 2, label: 'Peak Demand Hours', value: '08:00 - 09:30 AM', change: 'Daily Average', icon: <Clock size={18} color="#1E3A8A" />, bg: '#EFF6FF' },
          { id: 3, label: 'Highest Density Zone', value: 'Pentagon Cluster', change: 'Primary Campus Hub', icon: <Zap size={18} color="#1E3A8A" />, bg: '#DCFCE7' },
          { id: 4, label: 'Average Daily Trips', value: '135', change: '-15 vs last week', icon: <TrendingUp size={18} color="#CA8A04" />, bg: '#FEF9C3' }
        ])

        setPopularZones([
          { rank: 1, name: 'Pentagon / Evandy Cluster', trips: '35 dispatches', status: 'High Density', color: '#EFF6FF', textColor: '#1E40AF' },
          { rank: 2, name: 'Night Market Hub Area', trips: '25 dispatches', status: 'Optimal Supply', color: '#DCFCE7', textColor: '#15803D' },
          { rank: 3, name: 'Main Gate Transit Line', trips: '15 dispatches', status: 'Surge Warning', color: '#FFFBEB', textColor: '#854D0E' }
        ])

        setDriverPerformance([
          { name: 'Alex Johnson', rating: 4.5, trips: 27, status: 'IN ROUTE', statusColor: '#15803D', statusBg: '#DCFCE7' },
          { name: 'Emily Chen', rating: 4.3, trips: 16, status: 'COMPLETED', statusColor: '#2563EB', statusBg: '#EFF6FF' },
          { name: 'Michael Ross', rating: 4.8, trips: 42, status: 'ON BREAK', statusColor: '#475569', statusBg: '#E2E8F0' }
        ])

        setChartData([
          { day: 'MON', standard: 70, premium: 50 },
          { day: 'TUE', standard: 80, premium: 55 },
          { day: 'WED', standard: 90, premium: 65 },
          { day: 'THU', standard: 75, premium: 50 },
          { day: 'FRI', standard: 95, premium: 70 },
          { day: 'SAT', standard: 80, premium: 50 },
          { day: 'SUN', standard: 70, premium: 45 }
        ])

        setActivityOverview({
          growth: '4.5x',
          trends: '86%',
          morningProgress: '78%',
          afternoonProgress: '64%'
        })

      } catch (error) {
        console.error("Failed loading performance analytics parameters:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  if (loading) {
    return (
      <div style={anStyles.loadingFallbackFrame}>
        <span style={anStyles.loadingSpinnerPlaceholder}>Loading System Metrics...</span>
      </div>
    )
  }

  return (
    <div style={anStyles.workspaceWrapperContainer}>

      {/* HEADER SECTION */}
      <div style={anStyles.screenHeaderRow}>
        <h2 style={anStyles.screenTitleMainText}>Analytics Overview</h2>
        <p style={anStyles.screenSubtitleSupportingText}>System-wide transportation insights, behavioral performance indicators, and dispatch activity trends.</p>
      </div>

      {/* 1. TOP SUMMARY METRICS GRID */}
      <div style={anStyles.metricsGrid}>
        {metrics.map((m) => (
          <div key={m.id} style={anStyles.statCard}>
            <div style={anStyles.statBodyBlock}>
              <span style={anStyles.statLabelText}>{m.label}</span>
              <div style={anStyles.statNumberGroup}>
                <span style={anStyles.statNumberText}>{m.value}</span>
                <span style={anStyles.statTrendText}>{m.change}</span>
              </div>
            </div>
            <div style={{ ...anStyles.statIconBadge, backgroundColor: m.bg }}>{m.icon}</div>
          </div>
        ))}
      </div>

      {/* 2. MIDDLE AREA CANVAS */}
      <div style={anStyles.splitContentRowCanvas}>

        {/* CHART VISUAL CANVAS PANEL */}
        <div style={anStyles.leftWorkspaceMainColumn}>
          <div style={anStyles.chartContainerCard}>
            <div style={anStyles.panelHeaderRowFlexHeader}>
              <h3 style={anStyles.containerBlockTitle}>Trip Activity Distribution</h3>
              <span style={anStyles.timeframeBadgeIndicator}>Last 7 Days</span>
            </div>

            <div style={anStyles.chartBarsTrackViewportFrame}>
              {chartData.map((data, idx) => (
                <div key={idx} style={anStyles.chartColumnTrackWrapper}>
                  <div style={anStyles.dualBarGroupClusterContainer}>
                    <div style={{ ...anStyles.chartBarColumnElement, height: `${data.standard * 0.9}px` }} title={`Standard Rides: ${data.standard}`} />
                    <div style={{ ...anStyles.chartBarColumnElementShared, height: `${data.premium * 0.9}px` }} title={`Shared Rides: ${data.premium}`} />
                  </div>
                  <span style={anStyles.chartAxisDayLabel}>{data.day}</span>
                </div>
              ))}
            </div>

            <div style={anStyles.chartLegendsFlexContainerRow}>
              <div style={anStyles.legendIndicatorUnitItem}>
                <span style={anStyles.legendDotBlue} /> Standard Single Rides
              </div>
              <div style={anStyles.legendIndicatorUnitItem}>
                <span style={anStyles.legendDotGreen} /> Shared Group Rides
              </div>
            </div>
          </div>
        </div>

        {/* POPULAR PICKUP HUBS SIDEBAR */}
        <div style={anStyles.rightWorkspaceSidebarPanel}>
          <div style={anStyles.popularHubsContainerCard}>
            <h3 style={anStyles.containerBlockTitle}>Popular Pickup Hubs</h3>

            <div style={anStyles.hubsVerticalStackListContainer}>
              {popularZones.map((zone) => (
                <div key={zone.rank} style={anStyles.hubListItemBlockStrip}>
                  <div style={{ ...anStyles.hubRankBadgeCircle, backgroundColor: zone.color, color: zone.textColor }}>
                    {zone.rank}
                  </div>
                  <div style={anStyles.hubTextDetailsMetadataStackGroup}>
                    <span style={anStyles.hubPrimaryLocationNameTitleText}>{zone.name}</span>
                    <span style={anStyles.hubSecondaryVolumeCounterText}>{zone.trips}</span>
                  </div>
                  <span style={{ ...anStyles.hubStatusIndicatorLabelTagPillMarkup, color: zone.textColor }}>{zone.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM AREA CANVAS */}
      <div style={anStyles.bottomDoubleGridCanvasRow}>

        {/* DRIVER PERFORMANCE TABLE */}
        <div style={anStyles.tableWorkspaceCardContainer}>
          <h3 style={anStyles.containerBlockTitle}>Driver Performance Summary</h3>
          <div style={anStyles.tableScrollFrameworkWrapper}>
            <table style={anStyles.tableStructureMarkup}>
              <thead>
                <tr>
                  <th style={anStyles.thLeftAligned}>DRIVER OPERATOR NAME</th>
                  <th style={anStyles.thCenterAligned}>PERFORMANCE RATING</th>
                  <th style={anStyles.thCenterAligned}>COMPLETED DISPATCHES</th>
                  <th style={anStyles.thRightAligned}>CURRENT STATUS</th>
                </tr>
              </thead>
              <tbody>
                {driverPerformance.map((drv, idx) => (
                  <tr key={idx} style={anStyles.tableDataRowMarkup}>
                    <td style={anStyles.tdPrimaryDriverNameCellText}>{drv.name}</td>
                    <td style={anStyles.tdCenterAlignedDataCellRowText}>
                      <span style={anStyles.ratingStarFlexBadgeLine}>
                        <Star size={12} fill="#CA8A04" color="#CA8A04" /> {drv.rating}
                      </span>
                    </td>
                    <td style={anStyles.tdBoldTripsCounterCellRowText}>{drv.trips} trips</td>
                    <td style={anStyles.tdRightAlignedDataCellRowText}>
                      <span style={{ ...anStyles.statusBadgeIndicatorPillMarkup, backgroundColor: drv.statusBg, color: drv.statusColor }}>
                        {drv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIDER ACTIVITY OVERVIEW */}
        {activityOverview && (
          <div style={anStyles.engagementOverviewCardContainer}>
            <h3 style={anStyles.containerBlockTitle}>Rider Activity Overview</h3>

            <div style={anStyles.engagementMetricsDataSplitRowContainer}>
              <div style={anStyles.engagementDataColumnBlockStack}>
                <span style={anStyles.engagementMicroTitleFieldLabel}>REGISTRATION GROWTH</span>
                <span style={anStyles.engagementMetricPrimaryLargeValueText}>{activityOverview.growth}</span>
              </div>
              <div style={anStyles.engagementDataColumnBlockStack}>
                <span style={anStyles.engagementMicroTitleFieldLabel}>RIDE REQUEST TRENDS</span>
                <span style={anStyles.engagementMetricPrimaryLargeValueText}>{activityOverview.trends}</span>
              </div>
            </div>

            <div style={anStyles.progressionBarsStackTrackContainer}>
              <div style={anStyles.progressUnitGroupTrackBlock}>
                <div style={anStyles.progressLabelFlexRowLine}>
                  <span style={anStyles.progressLabelTitleText}>MORNINGS (7-11 AM)</span>
                  <span style={anStyles.progressPercentageCounterLabelValueText}>{activityOverview.morningProgress}</span>
                </div>
                <div style={anStyles.progressBarBaseTrackLine}>
                  <div style={{ ...anStyles.progressBarFilledInnerActiveLine, width: activityOverview.morningProgress }} />
                </div>
              </div>

              <div style={anStyles.progressUnitGroupTrackBlock}>
                <div style={anStyles.progressLabelFlexRowLine}>
                  <span style={anStyles.progressLabelTitleText}>AFTERNOONS (1-5 PM)</span>
                  <span style={anStyles.progressPercentageCounterLabelValueText}>{activityOverview.afternoonProgress}</span>
                </div>
                <div style={anStyles.progressBarBaseTrackLine}>
                  <div style={{ ...anStyles.progressBarFilledInnerActiveLine, width: activityOverview.afternoonProgress, backgroundColor: '#64748B' }} />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}

// ── ARRANGED MASTER ANALYTICS CSS MATRIX ─────────────────────────────────────
const anStyles = {
  workspaceWrapperContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  screenHeaderRow: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px', 
    textAlign: 'left', 
    marginBottom: '4px' 
  },
  screenTitleMainText: { 
    fontSize: '22px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    margin: 0 
  },
  screenSubtitleSupportingText: { 
    fontSize: '13px', 
    color: '#64748B', 
    fontWeight: 500, 
    margin: 0, 
    lineHeight: '1.4' 
  },
  metricsGrid: { 
    display: 'flex', 
    gap: '20px', 
    width: '100%', 
    flexDirection: 'row', 
    alignItems: 'stretch', 
    justifyContent: 'space-between' 
  },
  statCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '20px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    boxShadow: '0 1px 2px rgba(0,0,0,0.01)', 
    flex: 1 
  },
  statBodyBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px', 
    textAlign: 'left' 
  },
  statLabelText: { 
    fontSize: '12px', 
    color: '#64748B', 
    fontWeight: 600 
  },
  statNumberGroup: { 
    display: 'flex', 
    alignItems: 'baseline', 
    gap: '8px' 
  },
  statNumberText: { 
    fontSize: '20px', 
    fontWeight: 800, 
    color: '#0F172A' 
  },
  statTrendText: { 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#16A34A' 
  },
  statIconBadge: { 
    width: '36px', 
    height: '36px', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  splitContentRowCanvas: { 
    display: 'flex', 
    gap: '32px', 
    width: '100%', 
    boxSizing: 'border-box', 
    alignItems: 'stretch' 
  },
  leftWorkspaceMainColumn: { 
    display: 'flex', 
    flexDirection: 'column', 
    flex: 2.2, 
    boxSizing: 'border-box' 
  },
  chartContainerCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px', 
    boxSizing: 'border-box' 
  },
  panelHeaderRowFlexHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%' 
  },
  containerBlockTitle: { 
    fontSize: '14px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    margin: 0, 
    textTransform: 'uppercase', 
    letterSpacing: '0.4px', 
    textAlign: 'left' 
  },
  timeframeBadgeIndicator: { 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#64748B', 
    backgroundColor: '#F1F5F9', 
    padding: '4px 10px', 
    borderRadius: '6px' 
  },
  chartBarsTrackViewportFrame: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    height: '180px', 
    borderBottom: '1px solid #E2E8F0', 
    paddingBottom: '12px', 
    gap: '10px' 
  },
  chartColumnTrackWrapper: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '10px' 
  },
  dualBarGroupClusterContainer: { 
    display: 'flex', 
    alignItems: 'flex-end', 
    gap: '4px', 
    width: '100%', 
    justifyContent: 'center' 
  },
  chartBarColumnElement: { 
    width: '14px', 
    borderRadius: '3px 3px 0 0', 
    transition: 'opacity 0.15s ease', 
    cursor: 'pointer', 
    backgroundColor: '#1E3A8A' 
  },
  chartBarColumnElementShared: { 
    width: '14px', 
    borderRadius: '3px 3px 0 0', 
    transition: 'opacity 0.15s ease', 
    cursor: 'pointer', 
    backgroundColor: '#A3E635' 
  },
  chartAxisDayLabel: { 
    fontSize: '10px', 
    fontWeight: 700, 
    color: '#94A3B8' 
  },
  chartLegendsFlexContainerRow: { 
    display: 'flex', 
    gap: '24px', 
    alignItems: 'center', 
    justifyContent: 'flex-start' 
  },
  legendIndicatorUnitItem: { 
    fontSize: '11px', 
    color: '#64748B', 
    fontWeight: 600, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px' 
  },
  legendDotBlue: { 
    width: '8px', 
    height: '8px', 
    borderRadius: '50%', 
    backgroundColor: '#1E3A8A' 
  },
  legendDotGreen: { 
    width: '8px', 
    height: '8px', 
    borderRadius: '50%', 
    backgroundColor: '#A3E635' 
  },
  rightWorkspaceSidebarPanel: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    flex: 1.2, 
    display: 'flex', 
    flexDirection: 'column', 
    minWidth: '340px', 
    boxSizing: 'border-box' 
  },
  popularHubsContainerCard: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px', 
    width: '100%' 
  },
  hubsVerticalStackListContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px' 
  },
  hubListItemBlockStrip: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '14px', 
    padding: '12px', 
    border: '1px solid #F1F5F9', 
    borderRadius: '12px', 
    backgroundColor: '#FAFCFF', 
    textAlign: 'left' 
  },
  hubRankBadgeCircle: { 
    width: '28px', 
    height: '28px', 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '12px', 
    fontWeight: 800 
  },
  hubTextDetailsMetadataStackGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '2px', 
    flex: 1 
  },
  hubPrimaryLocationNameTitleText: { 
    fontSize: '12px', 
    fontWeight: 700, 
    color: '#1E293B' 
  },
  hubSecondaryVolumeCounterText: { 
    fontSize: '11px', 
    fontWeight: 600, 
    color: '#64748B' 
  },
  hubStatusIndicatorLabelTagPillMarkup: { 
    fontSize: '10px', 
    fontWeight: 800, 
    textTransform: 'uppercase', 
    letterSpacing: '0.3px' 
  },
  bottomDoubleGridCanvasRow: { 
    display: 'grid', 
    gridTemplateColumns: '1.6fr 1fr', 
    gap: '32px', 
    width: '100%', 
    alignItems: 'stretch' 
  },
  tableWorkspaceCardContainer: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px', 
    boxSizing: 'border-box' 
  },
  tableScrollFrameworkWrapper: { 
    width: '100%', 
    overflowX: 'auto' 
  },
  tableStructureMarkup: { 
    width: '100%', 
    borderCollapse: 'collapse' 
  },
  thLeftAligned: { 
    paddingBottom: '12px', 
    fontSize: '10px', 
    fontWeight: 800, 
    color: '#94A3B8', 
    borderBottom: '1px solid #F1F5F9', 
    letterSpacing: '0.5px', 
    textAlign: 'left' 
  },
  thCenterAligned: { 
    paddingBottom: '12px', 
    fontSize: '10px', 
    fontWeight: 800, 
    color: '#94A3B8', 
    borderBottom: '1px solid #F1F5F9', 
    letterSpacing: '0.5px', 
    textAlign: 'center' 
  },
  thRightAligned: { 
    paddingBottom: '12px', 
    fontSize: '10px', 
    fontWeight: 800, 
    color: '#94A3B8', 
    borderBottom: '1px solid #F1F5F9', 
    letterSpacing: '0.5px', 
    textAlign: 'right' 
  },
  tableDataRowMarkup: { 
    borderBottom: '1px solid #F8FAFC' 
  },
  tdPrimaryDriverNameCellText: { 
    padding: '14px 0', 
    fontSize: '13px', 
    fontWeight: 700, 
    color: '#1E293B', 
    textAlign: 'left' 
  },
  tdCenterAlignedDataCellRowText: { 
    padding: '14px 0', 
    fontSize: '12px', 
    fontWeight: 600, 
    color: '#475569', 
    textAlign: 'center' 
  },
  ratingStarFlexBadgeLine: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: '4px', 
    fontWeight: 700 
  },
  tdBoldTripsCounterCellRowText: { 
    padding: '14px 0', 
    fontSize: '12px', 
    fontWeight: 700, 
    color: '#1E3A8A', 
    textAlign: 'center' 
  },
  tdRightAlignedDataCellRowText: { 
    padding: '14px 0', 
    textAlign: 'right' 
  },
  statusBadgeIndicatorPillMarkup: { 
    fontSize: '10px', 
    fontWeight: 800, 
    padding: '4px 10px', 
    borderRadius: '6px', 
    display: 'inline-block' 
  },
  engagementOverviewCardContainer: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px', 
    boxSizing: 'border-box' 
  },
  engagementMetricsDataSplitRowContainer: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '16px', 
    width: '100%' 
  },
  engagementDataColumnBlockStack: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px', 
    padding: '14px', 
    border: '1px solid #F1F5F9', 
    borderRadius: '12px', 
    backgroundColor: '#FAFCFF', 
    textAlign: 'left' 
  },
  engagementMicroTitleFieldLabel: { 
    fontSize: '9px', 
    fontWeight: 800, 
    color: '#94A3B8', 
    letterSpacing: '0.4px' 
  },
  engagementMetricPrimaryLargeValueText: { 
    fontSize: '22px', 
    fontWeight: 800, 
    color: '#1E293B' 
  },
  progressionBarsStackTrackContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '16px', 
    width: '100%' 
  },
  progressUnitGroupTrackBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px' 
  },
  progressLabelFlexRowLine: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  progressLabelTitleText: { 
    fontSize: '10px', 
    fontWeight: 800, 
    color: '#64748B', 
    letterSpacing: '0.3px' 
  },
  progressPercentageCounterLabelValueText: { 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#1E293B' 
  },
  progressBarBaseTrackLine: { 
    width: '100%', 
    height: '6px', 
    backgroundColor: '#E2E8F0', 
    borderRadius: '10px', 
    overflow: 'hidden' 
  },
  progressBarFilledInnerActiveLine: { 
    height: '100%', 
    backgroundColor: '#1E3A8A', 
    borderRadius: '10px' 
  },
  loadingFallbackFrame: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '80vh', 
    width: '100%' 
  },
  loadingSpinnerPlaceholder: { 
    fontSize: '14px', 
    color: '#1E3A8A', 
    fontWeight: 700 
  }
}