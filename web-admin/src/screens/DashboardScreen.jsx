import React, { useState, useEffect, useRef } from 'react'
import { Car, UserCheck, Users, ShieldCheck, ShieldAlert } from 'lucide-react'
import api from '../api/axios'
import L from 'leaflet'
import io from 'socket.io-client'

const MapStyles = () => (
  <style>{`
    @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    .leaflet-container {
      width: 100%;
      height: 100%;
      border-radius: 16px;
    }
    .leaflet-marker-icon {
      transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .pulse-marker {
      background: #1E3A8A;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(30, 58, 138, 0.7);
      animation: mapPulse 1.8s infinite ease-in-out;
    }
    @keyframes mapPulse {
      0% {
        box-shadow: 0 0 0 0 rgba(30, 58, 138, 0.7);
      }
      70% {
        box-shadow: 0 0 0 8px rgba(30, 58, 138, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(30, 58, 138, 0);
      }
    }
    .hotspot-dot {
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }
  `}</style>
)

export default function DashboardScreen() {
  const [stats, setStats] = useState([])
  const [topDrivers, setTopDrivers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [chartData, setChartData] = useState([])
  const [hotspots, setHotspots] = useState([])
  const [currentWeek, setCurrentWeek] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerGroupRef = useRef(null)
  const heatZonesGroupRef = useRef(null)
  const socketRef = useRef(null)
  const driverLocationsRef = useRef({})

  const iconMap = {
    'Active Rides Now': { icon: Car, color: '#1E3A8A', bg: '#DBEAFE' },
    'Drivers Online': { icon: UserCheck, color: '#1E3A8A', bg: '#DCFCE7' },
    'Drivers Registered': { icon: ShieldAlert, color: '#1E3A8A', bg: '#EFF6FF' }, // 💡 Added driver mapping
    'Riders Registered': { icon: Users, color: '#1E3A8A', bg: '#EFF6FF' },
    'Pending Verification': { icon: ShieldCheck, color: '#991B1B', bg: '#FEE2E2' }
  }

  // Renders Active Online Driver Pins
  const updateMapMarkers = () => {
    if (!markerGroupRef.current || !mapInstanceRef.current) return
    markerGroupRef.current.clearLayers()

    Object.values(driverLocationsRef.current).forEach(driver => {
      if (!driver.lat || !driver.lng) return

      const customIcon = L.divIcon({
        className: 'pulse-marker',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })

      const marker = L.marker([driver.lat, driver.lng], { icon: customIcon })
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 11px; padding: 2px;">
            <strong style="color: #1E3A8A;">${driver.name || 'Driver'}</strong><br/>
            Status: <span style="font-weight: 700; color: #15803D">Active Online</span>
          </div>
        `)
      
      markerGroupRef.current.addLayer(marker)
    })
  }

  // Renders minimal elegant solid dot demand markers
  const drawHeatmapZones = (zonesList) => {
    if (!heatZonesGroupRef.current || !mapInstanceRef.current) return
    heatZonesGroupRef.current.clearLayers()

    const targets = zonesList && zonesList.length > 0 ? zonesList : hotspots

    targets.forEach(zone => {
      const customIcon = L.divIcon({
        className: 'hotspot-dot',
        html: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })

      const marker = L.marker([zone.lat, zone.lng], { icon: customIcon })
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 11px;">
            <strong>${zone.name}</strong><br/>
            Density: <strong style="color: ${zone.color};">${zone.level}</strong> (${zone.activeRequests} active reqs)
          </div>
        `)

      marker.on('add', (e) => {
        const el = e.target.getElement()
        if (el) el.style.backgroundColor = zone.color
      })

      heatZonesGroupRef.current.addLayer(marker)
    })
  }

  const fetchLiveLocationsAndDemand = async () => {
    try {
      const [locationsRes, demandRes] = await Promise.all([
        api.get('/admin/drivers/pending'),
        api.get('/admin/dashboard/demand')
      ])
      
      const updatedDrivers = locationsRes.data?.data || []
      driverLocationsRef.current = updatedDrivers.reduce((acc, curr) => {
        if (curr._id && curr.currentLatitude && curr.currentLongitude) {
          acc[curr._id] = {
            driverId: curr._id,
            name: curr.fullName,
            lat: curr.currentLatitude,
            lng: curr.currentLongitude
          }
        }
        return acc
      }, {})

      updateMapMarkers()

      if (demandRes.data?.success && demandRes.data?.data) {
        setHotspots(demandRes.data.data)
        drawHeatmapZones(demandRes.data.data)
      }
    } catch (err) {
      console.warn("Telemetry polling skip:", err)
    }
  }

  useEffect(() => {
    const hydrateDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [dashboardRes] = await Promise.all([
          api.get('/admin/dashboard')
        ])

        if (dashboardRes.data?.success && dashboardRes.data?.data) {
          const { stats: rawStats, topDrivers, recentActivity, chartData, currentWeek: serverWeek } = dashboardRes.data.data

          const hydratedStats = rawStats.map(item => ({
            ...item,
            icon: iconMap[item.label]?.icon || Car,
            color: iconMap[item.label]?.color || '#1E3A8A',
            bg: iconMap[item.label]?.bg || '#DBEAFE'
          }))

          setStats(hydratedStats)
          setTopDrivers(topDrivers || [])
          setRecentActivity(recentActivity || [])
          setChartData(chartData || [0, 0, 0, 0, 0, 0, 0])
          setCurrentWeek(serverWeek)
        }

        await fetchLiveLocationsAndDemand()
      } catch (err) {
        console.error("Dashboard hydration error:", err)
        setError('Server Connection Error. Check Node service & database states.')
      } finally {
        setLoading(false)
      }
    }

    hydrateDashboardData()

    // 2-second high-frequency refresh cycle
    const liveGPSPollingTimer = setInterval(fetchLiveLocationsAndDemand, 2000)

    const socketUrl = api.defaults.baseURL ? api.defaults.baseURL.split('/api/v1')[0] : 'https://orange-fiesta-wrrvpqgqgxw53x65-5000.app.github.dev'
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling']
    })

    socketRef.current.on('driver_location_update', (data) => {
      if (data && data.driverId) {
        driverLocationsRef.current[data.driverId] = data
        updateMapMarkers()
      }
    })

    return () => {
      clearInterval(liveGPSPollingTimer)
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [])

  useEffect(() => {
    if (loading || error || !mapRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([5.6506, -0.1870], 15)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      mapInstanceRef.current = map
      markerGroupRef.current = L.layerGroup().addTo(map)
      heatZonesGroupRef.current = L.layerGroup().addTo(map)
      
      updateMapMarkers()
      drawHeatmapZones()
    }
  }, [loading, error, hotspots])

  if (loading) {
    return (
      <div style={styles.loadingWrapperFrame}>
        <span style={styles.loadingText}>Hydrating Performance Dashboards...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.loadingWrapperFrame}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ ...styles.loadingText, color: '#EF4444' }}>{error}</p>
          <button 
            style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #EF4444', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#EF4444' }} 
            onClick={() => window.location.reload()}
          >
            Reconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <MapStyles />

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
                  {card.change && (
                    <span style={{ ...styles.statTrendText, color: card.changeColor }}>
                      {card.change}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ ...styles.statIconBadge, backgroundColor: card.bg }}>
                <IconComponent size={18} color={card.color} />
              </div>
            </div>
          )
        })}
      </div>

      {/* 2. MIDDLE AREA: MAP & RECENT ACTIVITY */}
      <div style={styles.middleSection}>
        <div style={styles.mapCard}>
          <div style={styles.mapHeaderRow}>
            <div style={styles.liveLabel}>
              <span style={styles.pingDot} /> LIVE CAMPUS DENSITIES
            </div>
            <span style={styles.campusTargetLabel}>University of Ghana, Legon Campus</span>
          </div>

          <div style={styles.mapWrapper}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            
            {/* 📍 FANCY CORNER DEMAND CARD WITH SOLID COLORS */}
            <div style={styles.mapLegendCard}>
              <span style={styles.legendHeader}>DEMAND FORECAST</span>
              <div style={styles.legendList}>
                {hotspots.map((hotspot, idx) => (
                  <div key={idx} style={styles.legendItem}>
                    <div style={styles.legendItemLeft}>
                      <span style={{ ...styles.legendDot, backgroundColor: hotspot.color }} />
                      <span style={styles.legendName}>{hotspot.name.split(" ")[0]}</span>
                    </div>
                    <span style={{ 
                      ...styles.legendBadge, 
                      backgroundColor: hotspot.color + '15', 
                      color: hotspot.color 
                    }}>
                      {hotspot.level.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

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

      {/* 3. BOTTOM AREA: LEADERBOARD & RIDE VOLUME */}
      <div style={styles.bottomSection}>
        <div style={styles.tableCard}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Top Operators This Week</h3>
            <span style={styles.weekBadge}>WEEK {currentWeek || '...'}</span>
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
              {topDrivers.length > 0 ? (
                topDrivers.map((drv, i) => (
                  <tr key={i} style={styles.tableRow}>
                    <td style={styles.tdNameCell}>
                      {drv.profilePicture ? (
                        <img 
                          src={drv.profilePicture} 
                          alt={drv.name} 
                          style={styles.tableAvatarImage} 
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div style={{ ...styles.tableAvatarMock, display: drv.profilePicture ? 'none' : 'flex' }}>
                        {drv.initials}
                      </div>
                      <span style={styles.driverNameText}>{drv.name}</span>
                    </td>
                    <td style={styles.tdRatingCell}>{drv.rating}</td>
                    <td style={styles.tdTripsCell}>{drv.trips}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={styles.emptyTableStateCell}>
                    No rides completed on campus yet this week.
                  </td>
                </tr>
              )}
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
    gap: '16px',
    width: '100%'
  },
  middleSection: {
    display: 'flex',
    gap: '32px',
    minHeight: '380px',
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
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statBodyBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left'
  },
  statLabelText: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 600
  },
  statNumberGroup: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px'
  },
  statNumberText: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0F172A'
  },
  statTrendText: {
    fontSize: '10px',
    fontWeight: 700
  },
  statIconBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mapCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 2,
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box'
  },
  mapHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  campusTargetLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  mapWrapper: {
    flex: 1,
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
    minHeight: '280px'
  },
  mapLegendCard: {
    position: 'absolute',
    bottom: '16px',
    right: '16px',
    width: '180px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backdropFilter: 'blur(8px)'
  },
  legendHeader: {
    fontSize: '9px',
    fontWeight: 800,
    color: '#94A3B8',
    letterSpacing: '0.8px',
    textTransform: 'uppercase'
  },
  legendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  legendItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  legendItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  legendName: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#334155'
  },
  legendBadge: {
    fontSize: '9px',
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: '6px',
    textTransform: 'uppercase'
  },
  liveLabel: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    color: '#1E3A8A',
    fontSize: '11px',
    fontWeight: 800,
    padding: '6px 12px',
    borderRadius: '50px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: 'max-content'
  },
  pingDot: {
    width: '6px',
    height: '6px',
    backgroundColor: '#22C55E',
    borderRadius: '50%'
  },
  activityPanel: {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
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
  tableAvatarImage: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #E2E8F0'
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
  emptyTableStateCell: {
    textAlign: 'center',
    padding: '32px',
    color: '#94A3B8',
    fontSize: '13px',
    fontWeight: 600
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