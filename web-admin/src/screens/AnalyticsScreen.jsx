import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Zap, 
  Star,
  Activity
} from 'lucide-react'
import api from '../api/axios'

const DISTINCT_COLORS = [
  '#2563EB', // blue
  '#0D9488', // teal
  '#D97706', // amber
  '#7C3AED', // purple
  '#F43F5E', // rose
]

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
        const res = await api.get('/admin/analytics/snapshot')
        
        if (res.data?.success && res.data?.data) {
          const { 
            metrics: rawMetrics, 
            popularZones: rawZones, 
            driverPerformance: rawDrivers, 
            chartData: rawChart, 
            activityOverview: rawOverview 
          } = res.data.data

          const iconLookup = {
            barChart: <BarChart3 size={18} color="#2563EB" />,
            clock: <Clock size={18} color="#0D9488" />,
            zap: <Zap size={18} color="#D97706" />,
            trendingUp: <TrendingUp size={18} color="#7C3AED" />
          }

          setMetrics((rawMetrics || []).map(item => ({
            ...item,
            icon: iconLookup[item.icon] || <BarChart3 size={18} color="#2563EB" />
          })))

          setPopularZones(rawZones || [])
          setDriverPerformance(rawDrivers || [])
          setChartData(rawChart || [])
          setActivityOverview(rawOverview || null)
        }
      } catch (error) {
        console.error("Analytics synchronization issue:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  if (loading) {
    return (
      <div style={s.loadingWrapper}>
        <span style={s.loadingText}>Loading System Metrics...</span>
      </div>
    )
  }

  const maxVal = Math.max(...chartData.map(d => Math.max(d.standard || 0, d.premium || 0, 1)), 10)

  // Real Demand Distribution (max 5, distinct colors)
  const zonesForDonut = popularZones.slice(0, 5)
  const totalTrips = zonesForDonut.reduce((sum, z) => {
    const trips = parseInt(String(z.trips).replace(/[^0-9]/g, '')) || 0
    return sum + trips
  }, 0)

  const demandSegments = zonesForDonut.length > 0 && totalTrips > 0
    ? zonesForDonut.map((zone, i) => {
        const trips = parseInt(String(zone.trips).replace(/[^0-9]/g, '')) || 0
        const percentage = Math.round((trips / totalTrips) * 100)
        return {
          label: zone.name,
          value: percentage,
          color: DISTINCT_COLORS[i % DISTINCT_COLORS.length]
        }
      })
    : []

  return (
    <div style={s.container}>
      {/* HEADER */}
      <div style={s.header}>
        <div>
          <h3 style={s.title}>Campus ride performance, demand patterns & driver insights</h3>
         </div>
        <div style={s.headerActions}>
          <div style={s.dateRange}>Last 30 Days</div>
          <button style={s.filterBtn}>Filter</button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div style={s.kpiGrid}>
        {metrics.map((m, idx) => (
          <div key={m.id || idx} style={s.kpiCard}>
            <div style={s.kpiTop}>
              <div style={{ ...s.kpiIcon, backgroundColor: m.bg || '#EFF6FF' }}>
                {m.icon}
              </div>
              <span style={s.kpiTrend}>{m.change || '—'}</span>
            </div>
            <div style={s.kpiValue}>{m.value}</div>
            <div style={s.kpiLabel}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* MIDDLE: CHART + DONUT */}
      <div style={s.middleRow}>
        <div style={s.chartCard}>
          <div style={s.cardHeader}>
            <div>
              <h3 style={s.cardTitle}>Ride Volume Trends</h3>
              <p style={s.cardSub}>Standard vs Shared rides over time</p>
            </div>
            <span style={s.badge}>Last 7 Days</span>
          </div>

          <div style={s.chartArea}>
            {chartData.length > 0 ? (
              chartData.map((data, idx) => {
                const standardH = ((data.standard || 0) / maxVal) * 140
                const premiumH = ((data.premium || 0) / maxVal) * 140
                return (
                  <div key={idx} style={s.barCol}>
                    <div style={s.barGroup}>
                      <div 
                        style={{ 
                          ...s.bar, 
                          height: Math.max(standardH, 4), 
                          backgroundColor: '#2563EB',
                          opacity: data.standard ? 1 : 0.2
                        }} 
                        title={`Standard: ${data.standard || 0}`}
                      />
                      <div 
                        style={{ 
                          ...s.bar, 
                          height: Math.max(premiumH, 4), 
                          backgroundColor: '#0D9488',
                          opacity: data.premium ? 1 : 0.2
                        }} 
                        title={`Shared: ${data.premium || 0}`}
                      />
                    </div>
                    <span style={s.barLabel}>{data.day}</span>
                  </div>
                )
              })
            ) : (
              <div style={s.emptyChart}>No chart data available</div>
            )}
          </div>

          <div style={s.legend}>
            <div style={s.legendItem}>
              <span style={{ ...s.legendDot, backgroundColor: '#2563EB' }} />
              Standard Rides
            </div>
            <div style={s.legendItem}>
              <span style={{ ...s.legendDot, backgroundColor: '#0D9488' }} />
              Shared Rides
            </div>
          </div>
        </div>

        {/* Demand Distribution */}
        <div style={s.donutCard}>
          <div style={s.cardHeader}>
            <div>
              <h3 style={s.cardTitle}>Demand Distribution</h3>
              <p style={s.cardSub}>Campus zone intensity</p>
            </div>
          </div>

          <div style={s.donutWrapper}>
            {demandSegments.length > 0 ? (
              <>
                <div style={{
                  ...s.donutVisual,
                  background: `conic-gradient(${demandSegments.map((seg, i) => {
                    const start = demandSegments.slice(0, i).reduce((acc, s) => acc + s.value, 0)
                    return `${seg.color} ${start}% ${start + seg.value}%`
                  }).join(', ')})`
                }}>
                  <div style={s.donutCenter}>
                    <span style={s.donutValue}>{totalTrips}</span>
                    <span style={s.donutLabel}>Trips</span>
                  </div>
                </div>

                <div style={s.donutLegend}>
                  {demandSegments.map((seg, i) => (
                    <div key={i} style={s.donutLegendItem}>
                      <span style={{ ...s.legendDot, backgroundColor: seg.color }} />
                      <span style={s.donutLegendText}>{seg.label}</span>
                      <span style={s.donutLegendValue}>{seg.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={s.emptyState}>No demand data available</div>
            )}
          </div>
        </div>
      </div>

      {/* LOWER SECTION */}
      <div style={s.lowerRow}>
        <div style={s.hubsCard}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Popular Pickup Hubs</h3>
          </div>
          <div style={s.hubsList}>
            {popularZones.slice(0, 5).length > 0 ? (
              popularZones.slice(0, 5).map((zone) => (
                <div key={zone.rank || zone.name} style={s.hubItem}>
                  <div style={{ 
                    ...s.hubRank, 
                    backgroundColor: zone.color || DISTINCT_COLORS[(zone.rank - 1) % 5],
                    color: zone.textColor || '#fff'
                  }}>
                    {zone.rank}
                  </div>
                  <div style={s.hubInfo}>
                    <span style={s.hubName}>{zone.name}</span>
                    <span style={s.hubTrips}>{zone.trips} trips</span>
                  </div>
                  <span style={{ 
                    ...s.hubStatus, 
                    color: zone.textColor || '#64748B' 
                  }}>
                    {zone.status}
                  </span>
                </div>
              ))
            ) : (
              <div style={s.emptyState}>No hub data available</div>
            )}
          </div>
        </div>

        <div style={s.tableCard}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Driver Performance Summary</h3>
          </div>
          <div style={s.tableWrapper}>
            {driverPerformance.length > 0 ? (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.thLeft}>DRIVER</th>
                    <th style={s.thCenter}>RATING</th>
                    <th style={s.thCenter}>TRIPS</th>
                    <th style={s.thRight}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {driverPerformance.map((drv, idx) => (
                    <tr key={idx} style={s.tr}>
                      <td style={s.tdName}>{drv.name}</td>
                      <td style={s.tdCenter}>
                        <span style={s.rating}>
                          {drv.rating !== 'N/A' && (
                            <Star size={12} fill="#D97706" color="#D97706" />
                          )}
                          {drv.rating}
                        </span>
                      </td>
                      <td style={s.tdCenter}>{drv.trips}</td>
                      <td style={s.tdRight}>
                        <span style={{
                          ...s.statusBadge,
                          backgroundColor: drv.statusBg || '#F1F5F9',
                          color: drv.statusColor || '#475569'
                        }}>
                          {drv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={s.emptyState}>No performance data logged</div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM INSIGHTS */}
      {activityOverview && (
        <div style={s.insightsRow}>
          <div style={s.insightCard}>
            <div style={s.insightHeader}>
              <Activity size={16} color="#2563EB" />
              <span>Rider Activity</span>
            </div>
            <div style={s.insightGrid}>
              <div>
                <span style={s.insightLabel}>Registration Growth</span>
                <span style={s.insightValue}>{activityOverview.growth}</span>
              </div>
              <div>
                <span style={s.insightLabel}>Request Trends</span>
                <span style={s.insightValue}>{activityOverview.trends}</span>
              </div>
            </div>
          </div>

          <div style={s.insightCard}>
            <div style={s.insightHeader}>
              <Clock size={16} color="#0D9488" />
              <span>Peak Hours</span>
            </div>
            <div style={s.progressGroup}>
              <div style={s.progressItem}>
                <div style={s.progressLabel}>
                  <span>Mornings (7–11 AM)</span>
                  <span>{activityOverview.morningProgress}</span>
                </div>
                <div style={s.progressTrack}>
                  <div style={{ ...s.progressFill, width: activityOverview.morningProgress, backgroundColor: '#2563EB' }} />
                </div>
              </div>
              <div style={s.progressItem}>
                <div style={s.progressLabel}>
                  <span>Afternoons (1–5 PM)</span>
                  <span>{activityOverview.afternoonProgress}</span>
                </div>
                <div style={s.progressTrack}>
                  <div style={{ ...s.progressFill, width: activityOverview.afternoonProgress, backgroundColor: '#0D9488' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
  },
  loadingWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '80vh',
    width: '100%'
  },
  loadingText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: 600
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.3px'
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#64748B',
    fontWeight: 500
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  dateRange: {
    backgroundColor: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#334155'
  },
  filterBtn: {
    backgroundColor: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16
  },
  kpiCard: {
    backgroundColor: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
  },
  kpiTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiTrend: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0D9488'
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: 800,
    color: '#0F172A',
    lineHeight: 1.1
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#64748B'
  },
  middleRow: {
    display: 'flex',
    gap: 20
  },
  chartCard: {
    flex: 2,
    backgroundColor: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
  },
  donutCard: {
    flex: 1,
    minWidth: 300,
    backgroundColor: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: '#0F172A'
  },
  cardSub: {
    margin: '4px 0 0',
    fontSize: 12,
    color: '#64748B'
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    padding: '4px 10px',
    borderRadius: 6
  },
  chartArea: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: 12,
    gap: 8
  },
  barCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8
  },
  barGroup: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 3,
    height: 140
  },
  bar: {
    width: 12,
    borderRadius: '3px 3px 0 0',
    transition: 'opacity 0.15s'
  },
  barLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#64748B'
  },
  legend: {
    display: 'flex',
    gap: 20
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#64748B',
    fontWeight: 500
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: '50%'
  },
  emptyChart: {
    width: '100%',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    padding: '40px 0'
  },
  donutWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    justifyContent: 'center'
  },
  donutVisual: {
    width: 140,
    height: 140,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  donutCenter: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 1px #E2E8F0'
  },
  donutValue: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0F172A'
  },
  donutLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  donutLegend: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  donutLegendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  donutLegendText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B'
  },
  donutLegendValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0F172A'
  },
  lowerRow: {
    display: 'flex',
    gap: 20
  },
  hubsCard: {
    flex: 1,
    backgroundColor: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
  },
  hubsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  hubItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    border: '1px solid #E2E8F0'
  },
  hubRank: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0
  },
  hubInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  hubName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#0F172A'
  },
  hubTrips: {
    fontSize: 11,
    color: '#64748B'
  },
  hubStatus: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  tableCard: {
    flex: 1.4,
    backgroundColor: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  thLeft: {
    paddingBottom: 12,
    fontSize: 10,
    fontWeight: 700,
    color: '#94A3B8',
    textAlign: 'left',
    letterSpacing: '0.4px'
  },
  thCenter: {
    paddingBottom: 12,
    fontSize: 10,
    fontWeight: 700,
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: '0.4px'
  },
  thRight: {
    paddingBottom: 12,
    fontSize: 10,
    fontWeight: 700,
    color: '#94A3B8',
    textAlign: 'right',
    letterSpacing: '0.4px'
  },
  tr: {
    borderBottom: '1px solid #F1F5F9'
  },
  tdName: {
    padding: '12px 0',
    fontSize: 13,
    fontWeight: 600,
    color: '#0F172A'
  },
  tdCenter: {
    padding: '12px 0',
    fontSize: 13,
    fontWeight: 500,
    color: '#475569',
    textAlign: 'center'
  },
  tdRight: {
    padding: '12px 0',
    textAlign: 'right'
  },
  rating: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 600,
    color: '#0F172A'
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 6
  },
  insightsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20
  },
  insightCard: {
    backgroundColor: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
  },
  insightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: '#0F172A'
  },
  insightGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16
  },
  insightLabel: {
    display: 'block',
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 800,
    color: '#0F172A'
  },
  progressGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },
  progressItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#64748B',
    fontWeight: 500
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  emptyState: {
    padding: '24px 0',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13
  }
}