import React, { useState, useEffect } from 'react'
import { Car, UserCheck, Users, ShieldCheck } from 'lucide-react'

export default function DashboardScreen() {
  // Operational Dynamic Dynamic Real-time States
  const [stats, setStats] = useState([])
  const [topDrivers, setTopDrivers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardAggregations = async () => {
      try {
        setLoading(false)

        // 💡 BACKEND TODO: Assemble global initialization data lookups via Promise.all
        // const [statsRes, driversRes, feedRes, chartRes] = await Promise.all([
        //   axios.get('/api/v1/admin/dashboard/stats'),
        //   axios.get('/api/v1/admin/drivers/leaderboard'),
        //   axios.get('/api/v1/admin/dashboard/activity-stream'),
        //   axios.get('/api/v1/admin/dashboard/volume-charts')
        // ])

        setStats([
          { label: 'Active Rides Now', value: '27', change: '+12%', icon: Car, color: '#1E3A8A', bg: '#DBEAFE', changeColor: '#15803D' },
          { label: 'Drivers Online', value: '128', change: '+5%', icon: UserCheck, color: '#1E3A8A', bg: '#DCFCE7', changeColor: '#15803D' },
          { label: 'Riders Registered', value: '4,892', change: '+24%', icon: Users, color: '#1E3A8A', bg: '#EFF6FF', changeColor: '#15803D' },
          { label: 'Pending Verification', value: '3', change: 'Action Req.', icon: ShieldCheck, color: '#991B1B', bg: '#FEE2E2', changeColor: '#991B1B' },
        ])

        setTopDrivers([
          { name: 'Kwame Evans Mensah', rating: '4.98', trips: 142, initials: 'KM' },
          { name: 'Emmanuel Kofi Boateng', rating: '4.95', trips: 138, initials: 'EB' },
          { name: 'Samuel Yaw Addo', rating: '4.89', trips: 125, initials: 'SA' },
        ])

        setRecentActivity([
          { title: 'New Rider Signup', desc: 'Julian Vance verified his institutional database token.', time: '2 MINS AGO', circleColor: '#3B82F6' },
          { title: 'Ride Completed', desc: 'Emmanuel Kofi Boateng reached Main Gate terminal cluster.', time: '15 MINS AGO', circleColor: '#22C55E' },
          { title: 'Dispute Flagged', desc: 'Rider passenger submitted delay alert entry for Ride #78.', time: '42 MINS AGO', circleColor: '#EF4444' },
        ])

        setChartData([35, 45, 55, 90, 75, 30, 20])

      } catch (err) {
        console.error("Failed fetching structural administrative dashboard states:", err)
      }
    }

    fetchDashboardAggregations()

    // 💡 BACKEND TODO: Connect client to active socket stream channel layers
    // socket.on('trip_status_updated', (data) => { updateLocalStatsCounters(data) })
    // return () => socket.off('trip_status_updated')
  }, [])

  if (loading) {
    return (
      <div style={styles.loadingWrapperFrame}>
        <span style={styles.loadingText}>Hydrating Performance Dashboards...</span>
      </div>
    )
  }

  return (
    <div style={styles.container}>

      {/* 1. TOP METRICS GRID ROW */}
      <div style={styles.metricsGrid}>
        {stats.map((card, idx) => {
          const IconComponent = card.icon
          return (
            <div key={idx} style={styles.statCard}>
              <div style={styles.statBodyBlock}>
                <span style={styles.statLabelText}>{card.label}</span>
                <div style={styles.statNumberGroup}>
                  <span style={styles.statNumberText}>{card.value}</span>
                  <span style={{ ...styles.statTrendText, color: card.changeColor }}>{card.change}</span>
                </div>
              </div>
              <div style={{ ...styles.statIconBadge, backgroundColor: card.bg }}>
                <IconComponent size={18} color={card.color} />
              </div>
            </div>
          )
        })}
      </div>

      {/* 2. MIDDLE AREA: LIVE RADAR MAP AND ACTIVITY FEED */}
      <div style={styles.middleSection}>
        <div style={styles.mapContainer}>
          <div style={styles.liveLabel}>
            <span style={styles.pingDot} /> LIVE CAMPUS ACTIVITY
          </div>

          <div style={styles.mapVisualFrame}>
            <div style={styles.mapGridLineHorizontal} />
            <div style={styles.mapGridLineVertical} />
            <div style={styles.liveDriverNodeGreen} />
            <div style={styles.liveDriverNodeBlue} />
            <div style={styles.liveDriverNodeRed} />
          </div>

          <div style={styles.mapLegendBox}>
            <div style={styles.legendItem}>
              <span style={styles.legendDotGreen} /> Available Drivers
            </div>
            <div style={styles.legendItem}>
              <span style={styles.legendDotBlue} /> Rides In Progress
            </div>
            <div style={styles.legendItem}>
              <span style={styles.legendDotRed} /> High Demand Zones
            </div>
          </div>
        </div>

        {/* Recent Activity Panel */}
        <div style={styles.activityPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Recent Activity Feed</h3>
            <span style={styles.viewAllBtn}>VIEW ALL</span>
          </div>
          <div style={styles.activityList}>
            {recentActivity.map((act, i) => (
              <div key={i} style={styles.activityItem}>
                <span style={{ ...styles.statusDot, backgroundColor: act.circleColor }} />
                <div style={styles.itemContentBlock}>
                  <p style={styles.itemTitle}>{act.title}</p>
                  <span style={styles.itemTime}>{act.time}</span>
                  <p style={styles.itemDesc}>{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM AREA: PERFORMANCE LEADERBOARD AND CHART */}
      <div style={styles.bottomSection}>
        <div style={styles.tableCard}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Top Operators This Week</h3>
            <span style={styles.weekBadge}>WEEK 42</span>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thLeftAlign}>DRIVER OPERATOR</th>
                <th style={styles.thCenterAlign}>PERFORMANCE RATING</th>
                <th style={styles.thRightAlign}>COMPLETED RIDES</th>
              </tr>
            </thead>
            <tbody>
              {topDrivers.map((drv, i) => (
                <tr key={i} style={styles.tableRow}>
                  <td style={styles.tdNameCell}>
                    <div style={styles.tableAvatarMock}>{drv.initials}</div>
                    <span style={styles.driverNameText}>{drv.name}</span>
                  </td>
                  <td style={styles.tdRatingCell}>★ {drv.rating}</td>
                  <td style={styles.tdTripsCell}>{drv.trips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Ride Volume Performance</h3>
            <span style={styles.weekBadge}>LAST 7 DAYS</span>
          </div>
          <div style={styles.chartTrack}>
            {chartData.map((h, idx) => (
              <div key={idx} style={styles.chartColumnWrapper}>
                <div style={{ ...styles.barColumn, height: `${h}%`, backgroundColor: idx === 3 ? '#1E3A8A' : '#DBEAFE' }} />
                <span style={styles.barLabel}>{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][idx]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    width: '100%'
  },
  middleSection: {
    display: 'flex',
    gap: '32px',
    minHeight: '340px',
    alignItems: 'stretch'
  },
  bottomSection: {
    display: 'flex',
    gap: '32px',
    minHeight: '240px',
    alignItems: 'stretch'
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
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
    fontSize: '24px',
    fontWeight: 800,
    color: '#0F172A'
  },
  statTrendText: {
    fontSize: '11px',
    fontWeight: 700
  },
  statIconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mapContainer: {
    backgroundColor: '#0B1329',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 2,
    position: 'relative',
    border: '1px solid #1E293B',
    overflow: 'hidden'
  },
  mapVisualFrame: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  mapGridLineHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: '100%',
    height: '1px',
    borderTop: '1px dashed rgba(30, 41, 59, 0.4)'
  },
  mapGridLineVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: '1px',
    height: '100%',
    borderLeft: '1px dashed rgba(30, 41, 59, 0.4)'
  },
  liveDriverNodeGreen: {
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    top: '35%',
    left: '25%',
    backgroundColor: '#22C55E',
    boxShadow: '0 0 12px #22C55E'
  },
  liveDriverNodeBlue: {
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    top: '60%',
    left: '70%',
    backgroundColor: '#2563EB',
    boxShadow: '0 0 12px #2563EB'
  },
  liveDriverNodeRed: {
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    top: '20%',
    left: '55%',
    backgroundColor: '#EF4444',
    boxShadow: '0 0 12px #EF4444'
  },
  liveLabel: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid #1E293B',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 800,
    padding: '6px 12px',
    borderRadius: '50px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: 'max-content',
    zIndex: 2
  },
  pingDot: {
    width: '6px',
    height: '6px',
    backgroundColor: '#22C55E',
    borderRadius: '50%'
  },
  mapLegendBox: {
    backgroundColor: 'rgba(11, 19, 41, 0.95)',
    border: '1px solid #1E293B',
    padding: '12px',
    borderRadius: '12px',
    width: '170px',
    alignSelf: 'flex-end',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    zIndex: 2
  },
  legendItem: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  legendDotGreen: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#22C55E'
  },
  legendDotBlue: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#2563EB'
  },
  legendDotRed: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#EF4444'
  },
  activityPanel: {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    boxSizing: 'border-box'
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#1E3A8A',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  viewAllBtn: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#2563EB',
    cursor: 'pointer'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  activityItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    textAlign: 'left'
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    marginTop: '6px',
    flexShrink: 0
  },
  itemContentBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    width: '100%'
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E293B',
    margin: 0
  },
  itemTime: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#94A3B8'
  },
  itemDesc: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
    lineHeight: '1.4'
  },
  tableCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '20px',
    flex: 3,
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    boxSizing: 'border-box'
  },
  weekBadge: {
    fontSize: '10px',
    fontWeight: 800,
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  thLeftAlign: {
    paddingBottom: '12px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#94A3B8',
    borderBottom: '1px solid #F1F5F9',
    letterSpacing: '0.5px',
    textAlign: 'left'
  },
  thCenterAlign: {
    paddingBottom: '12px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#94A3B8',
    borderBottom: '1px solid #F1F5F9',
    letterSpacing: '0.5px',
    textAlign: 'center'
  },
  thRightAlign: {
    paddingBottom: '12px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#94A3B8',
    borderBottom: '1px solid #F1F5F9',
    letterSpacing: '0.5px',
    textAlign: 'right'
  },
  tableRow: {
    borderBottom: '1px solid #F1F5F9'
  },
  tdNameCell: {
    padding: '12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  tdRatingCell: {
    padding: '12px 0',
    color: '#1E3A8A',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: '13px'
  },
  tdTripsCell: {
    padding: '12px 0',
    fontWeight: '800',
    textAlign: 'right',
    color: '#1E293B',
    fontSize: '13px'
  },
  tableAvatarMock: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #E2E8F0'
  },
  driverNameText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E293B'
  },
  chartCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 2,
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    boxSizing: 'border-box'
  },
  chartTrack: {
    height: '140px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    paddingTop: '12px'
  },
  chartColumnWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    height: '100%',
    justifyContent: 'flex-end'
  },
  barColumn: {
    width: '100%',
    borderRadius: '4px 4px 0 0'
  },
  barLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#94A3B8'
  },
  loadingWrapperFrame: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh',
    width: '100%'
  },
  loadingText: {
    fontSize: '14px',
    color: '#1E3A8A',
    fontWeight: 700
  }
}