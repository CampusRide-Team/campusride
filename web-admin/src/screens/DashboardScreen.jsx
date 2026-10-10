import React, { useState, useEffect, useRef } from 'react'
import { Car, CircleUser, ShieldCheck, Users, TriangleAlert, Check } from 'lucide-react'
import api from '../api/axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import io from 'socket.io-client'

const MapStyles = () => (
  <style>{`
    .leaflet-container {
      width: 100%;
      height: 100%;
      font-family: Inter, system-ui, sans-serif;
      background: #F8FAFC;
    }
    .pulse-marker {
      background: #2563EB;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
      animation: mapPulse 1.8s infinite ease-in-out;
    }
    @keyframes mapPulse {
      0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
      100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
    }
    .hotspot-radar {
      background: transparent;
      border: none;
    }
    .hotspot-radar span {
      display: block;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid currentColor;
      animation: radarPing 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
      transform: translate(-10px, -10px);
    }
    @keyframes radarPing {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    .leaflet-tooltip.hotspot-label {
      background: #ffffff !important;
      border: 1px solid #E2E8F0 !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08) !important;
      color: #0F172A !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      padding: 5px 10px !important;
    }
    .leaflet-tooltip.hotspot-label::before { display: none !important; }
    .leaflet-control-zoom { display: none; }
  `}</style>
)

const CARD_CONFIG = {
  'Active Rides Now': {
    icon: Car, accent: '#2563EB', iconColor: '#2563EB', bg: '#EFF6FF',
    sub: 'Campus live baseline', subType: 'dotGrey'
  },
  'Drivers Online': {
    icon: CircleUser, accent: '#0D9488', iconColor: '#0D9488', bg: '#F0FDFA',
    sub: 'Awaiting shift logins', subType: 'dotGreen'
  },
  'Drivers Registered': {
    icon: ShieldCheck, accent: '#3B82F6', iconColor: '#3B82F6', bg: '#EFF6FF',
    sub: 'Verified campus operators', subType: 'plain'
  },
  'Riders Registered': {
    icon: Users, accent: '#6366F1', iconColor: '#6366F1', bg: '#EEF2FF',
    sub: 'UG Legon student accounts', subType: 'plain'
  },
  'Pending Verification': {
    icon: TriangleAlert, accent: '#F43F5E', iconColor: '#F43F5E', bg: '#FFF1F2',
    sub: 'Queue is completely clear', subType: 'check'
  }
}

const DEFAULT_CARD = {
  icon: Car, accent: '#2563EB', iconColor: '#2563EB', bg: '#EFF6FF', sub: '', subType: 'plain'
}

export default function DashboardScreen() {
  const [stats, setStats] = useState([])
  const [topDrivers, setTopDrivers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [chartData, setChartData] = useState([])
  const [totalRides, setTotalRides] = useState(0)
  const [hotspots, setHotspots] = useState([])
  const [socketConnected, setSocketConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerGroupRef = useRef(null)
  const heatZonesGroupRef = useRef(null)
  const socketRef = useRef(null)
  const driverLocationsRef = useRef({})

  const updateMapMarkers = () => {
    if (!markerGroupRef.current || !mapInstanceRef.current) return
    markerGroupRef.current.clearLayers()

    Object.values(driverLocationsRef.current).forEach(driver => {
      if (!driver || !driver.lat || !driver.lng) return

      const customIcon = L.divIcon({
        className: 'pulse-marker',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })

      const marker = L.marker([driver.lat, driver.lng], { icon: customIcon })
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 11px; padding: 2px;">
            <strong style="color: #1E3A8A;">${driver.name || 'Driver'}</strong><br/>
            Status: <span style="font-weight: 700; color: #0D9488">Active Online</span>
          </div>
        `)

      markerGroupRef.current.addLayer(marker)
    })
  }

  const drawHeatmapZones = (zonesList) => {
    if (!heatZonesGroupRef.current || !mapInstanceRef.current) return
    heatZonesGroupRef.current.clearLayers()

    const targets = zonesList && zonesList.length > 0 ? zonesList : hotspots

    targets.forEach(zone => {
      if (!zone || !zone.lat || !zone.lng) return
      const color = zone.color || '#0D9488'

      const radarIcon = L.divIcon({
        className: 'hotspot-radar',
        html: `<span style="color: ${color}; background: ${color}33;"></span>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })

      const marker = L.marker([zone.lat, zone.lng], { icon: radarIcon })
        .bindTooltip(zone.name, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'hotspot-label'
        })
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; font-size: 11px;">
            <strong>${zone.name}</strong><br/>
            Density: <strong style="color: ${color};">${zone.level}</strong> (${zone.activeRequests || 0} active reqs)
          </div>
        `)

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
      console.warn('Telemetry polling skip:', err)
    }
  }

  useEffect(() => {
    const hydrateDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const dashboardRes = await api.get('/admin/dashboard')

        if (dashboardRes.data?.success && dashboardRes.data?.data) {
          const {
            stats: rawStats,
            topDrivers,
            recentActivity,
            chartData,
            totalRides: serverTotal
          } = dashboardRes.data.data

          setStats(rawStats || [])
          setTopDrivers(topDrivers || [])
          setRecentActivity(recentActivity || [])
          setChartData(chartData || [0, 0, 0, 0, 0, 0, 0])
          setTotalRides(serverTotal || 0)
        }

        await fetchLiveLocationsAndDemand()
      } catch (err) {
        console.error('Dashboard hydration error:', err)
        setError('Server Connection Error. Check Node service & database states.')
      } finally {
        setLoading(false)
      }
    }

    hydrateDashboardData()

    const liveGPSPollingTimer = setInterval(fetchLiveLocationsAndDemand, 5000)

    const baseApiUrl = api.defaults.baseURL || 'http://localhost:5000/api/v1'
    const socketUrl = baseApiUrl.split('/api/v1')[0] || 'http://localhost:5000'
    const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('token')

    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token: adminToken ? adminToken.replace(/^["']|["']$/g, '').trim().replace(/^Bearer\s+/i, '') : '' }
    })

    socketRef.current.on('connect', () => setSocketConnected(true))
    socketRef.current.on('disconnect', () => setSocketConnected(false))

    socketRef.current.on('driver:telemetry', (data) => {
      if (data && data.driverId) {
        const coords = data.coordinates || (data.lat && data.lng ? [data.lng, data.lat] : null)
        if (coords) {
          driverLocationsRef.current[data.driverId] = {
            driverId: data.driverId,
            name: data.driverName || 'Driver',
            lat: coords[1],
            lng: coords[0]
          }
          updateMapMarkers()
        }
      }
    })

    socketRef.current.on('driver_location_update', (data) => {
      if (data && data.driverId) {
        driverLocationsRef.current[data.driverId] = data
        updateMapMarkers()
      }
    })

    socketRef.current.on('activity:new', (item) => {
      setRecentActivity(prev => [item, ...prev].slice(0, 15))
    })

    return () => {
      clearInterval(liveGPSPollingTimer)
      if (socketRef.current) socketRef.current.disconnect()
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerGroupRef.current = null
        heatZonesGroupRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (loading || error || !mapRef.current) return

    if (!mapInstanceRef.current) {
      const legonBounds = [
        [5.6200, -0.2150],
        [5.6850, -0.1550]
      ]

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 14,
        maxZoom: 19,
        maxBounds: legonBounds,
        maxBoundsViscosity: 1.0
      }).setView([5.6506, -0.1870], 15.5)

      L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_3xdw_1_8e3bdc8dc2ba08f3d0f34664', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map)

      mapInstanceRef.current = map
      markerGroupRef.current = L.layerGroup().addTo(map)
      heatZonesGroupRef.current = L.layerGroup().addTo(map)
    }

    updateMapMarkers()
    drawHeatmapZones()
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
          <p style={{ ...styles.loadingText, color: '#F43F5E' }}>{error}</p>
          <button
            style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #F43F5E', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#F43F5E' }}
            onClick={() => window.location.reload()}
          >
            Reconnect
          </button>
        </div>
      </div>
    )
  }

  const hour = new Date().getHours() + new Date().getMinutes() / 60
  const isPeak = hour >= 16 && hour <= 19.5
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const todayIdx = (new Date().getDay() + 6) % 7
  const maxBar = Math.max(...chartData, 1)

  const renderSub = (cfg, card) => {
    const text = card.subtext || cfg.sub
    if (!text) return null
    if (cfg.subType === 'dotGrey') {
      return <span style={styles.subRow}><span style={{ ...styles.subDot, backgroundColor: '#CBD5E1' }} />{text}</span>
    }
    if (cfg.subType === 'dotGreen') {
      return <span style={{ ...styles.subRow, color: '#0D9488' }}><span style={{ ...styles.subDot, backgroundColor: '#14B8A6' }} />{text}</span>
    }
    if (cfg.subType === 'check') {
      return <span style={{ ...styles.subRow, color: '#0D9488' }}><Check size={11} strokeWidth={3} />{text}</span>
    }
    return <span style={styles.subRow}>{text}</span>
  }

  return (
    <div style={styles.container}>
      <MapStyles />

      {/* METRICS GRID */}
      <div style={styles.metricsGrid}>
        {stats.map((card, idx) => {
          const cfg = CARD_CONFIG[card.label] || DEFAULT_CARD
          const IconComponent = cfg.icon
          return (
            <div key={idx} style={{ ...styles.statCard, borderTop: `3px solid ${cfg.accent}` }}>
              <div style={styles.statTopRow}>
                <div style={styles.statBodyBlock}>
                  <span style={styles.statLabelText}>{card.label}</span>
                  <div style={styles.statNumberGroup}>
                    <span style={styles.statNumberText}>{card.value}</span>
                    {card.change && (
                      <span style={styles.statTrendPill}>{card.change}</span>
                    )}
                  </div>
                </div>
                <div style={{ ...styles.statIconBadge, backgroundColor: cfg.bg }}>
                  <IconComponent size={17} color={cfg.iconColor} />
                </div>
              </div>
              <div style={styles.statFooter}>{renderSub(cfg, card)}</div>
            </div>
          )
        })}
      </div>

      {/* MIDDLE: MAP + ACTIVITY */}
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

            <div style={styles.mapLegendCard}>
              <div style={styles.legendHeaderRow}>
                <span style={styles.legendHeader}>DEMAND FORECAST</span>
                <span style={styles.legendSub}>Campus Hotspots</span>
              </div>
              <div style={styles.legendList}>
                {hotspots.length > 0 ? (
                  hotspots.map((hotspot, idx) => (
                    <div key={idx} style={styles.legendItem}>
                      <div style={styles.legendItemLeft}>
                        <span style={{ ...styles.legendDot, backgroundColor: hotspot.color }} />
                        <span style={styles.legendName}>{hotspot.name}</span>
                      </div>
                      <span style={{
                        ...styles.legendBadge,
                        backgroundColor: hotspot.color + '1A',
                        border: `1px solid ${hotspot.color}40`,
                        color: hotspot.color
                      }}>
                        {(hotspot.level || '').split(' ')[0]}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', padding: '6px 0' }}>
                    No hotspots reporting
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.activityPanel}>
          <div style={styles.activityHeader}>
            <h3 style={styles.panelTitle}>Recent Activity</h3>
          </div>
          <div style={styles.activityList}>
            {recentActivity.length > 0 ? (
              recentActivity.map((act, i) => (
                <div key={i} style={styles.activityItem}>
                  <span style={{ ...styles.statusDot, backgroundColor: act.circleColor || '#2563EB' }} />
                  <div style={styles.itemContentBlock}>
                    <div style={styles.itemTitleRow}>
                      <p style={styles.itemTitle}>{act.title}</p>
                      <span style={styles.itemTime}>{act.time}</span>
                    </div>
                    <p style={styles.itemDesc}>{act.desc}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptySub}>No recent activity logged yet.</p>
              </div>
            )}
          </div>
          <div style={styles.activityFooter}>
            Live Campus Dispatch WebSocket: {socketConnected ? 'Connected' : 'Reconnecting...'}
          </div>
        </div>
      </div>

      {/* BOTTOM: TOP OPERATORS + RIDE VOLUME */}
      <div style={styles.bottomSection}>
        <div style={styles.tableCard}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Top Operators This Week</h3>
            <span style={styles.weekBadge}>This Week</span>
          </div>

          <div style={styles.tableBody}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thLeftAlign}>DRIVER OPERATOR</th>
                  <th style={styles.thCenterAlign}>PERFORMANCE RATING</th>
                  <th style={styles.thRightAlign}>COMPLETED RIDES</th>
                </tr>
              </thead>
              {topDrivers.length > 0 && (
                <tbody>
                  {topDrivers.map((drv, i) => (
                    <tr key={i} style={styles.tableRow}>
                      <td style={styles.tdNameCell}>
                        {drv.profilePicture ? (
                          <img
                            src={drv.profilePicture}
                            alt={drv.name}
                            style={styles.tableAvatarImage}
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
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
                  ))}
                </tbody>
              )}
            </table>

            {topDrivers.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIconCircle}>
                  <Users size={18} color="#94A3B8" />
                </div>
                <p style={styles.emptyTitle}>No rides completed on campus yet this week.</p>
                <p style={styles.emptySub}>Leaderboards update dynamically as driver trips conclude.</p>
              </div>
            )}
          </div>

          <div style={styles.cardFooter}>
            <span>Minimum threshold: 5 completed trips</span>
            <span style={styles.footerLink}>Operator Policy</span>
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Ride Volume Performance</h3>
            <span style={styles.weekBadge}>Last 7 Days</span>
          </div>

          <div style={styles.chartTrack}>
            {chartData.map((h, idx) => {
              const isToday = idx === todayIdx
              const pct = maxBar > 0 ? (h / maxBar) * 100 : 0
              return (
                <div key={idx} style={styles.chartColumnWrapper}>
                  {isToday && h > 0 && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#1E40AF'
                    }}>
                      {h}
                    </span>
                  )}
                  <div style={styles.barSlot}>
                    <div style={{
                      ...styles.barColumn,
                      height: `${Math.max(pct, 8)}%`,
                      backgroundColor: isToday ? '#2563EB' : '#E2E8F0',
                      boxShadow: isToday ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none'
                    }} />
                  </div>
                  <span style={{
                    ...styles.barLabel,
                    color: isToday ? '#1E40AF' : '#64748B',
                    fontWeight: isToday ? 800 : 600
                  }}>
                    {dayLabels[idx]}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={styles.cardFooter}>
            <span>Peak Volume Window: 16:00 - 19:30</span>
            <span style={styles.footerStrong}>
              Total Rides: {totalRides} {isPeak ? '(Peak)' : '(Off-peak)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const FONT = 'Inter, system-ui, -apple-system, sans-serif'
const BORDER = '#E2E8F0'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: FONT
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
    gap: '16px',
    width: '100%'
  },
  middleSection: {
    display: 'flex',
    gap: '20px',
    height: '360px',
    alignItems: 'stretch'
  },
  bottomSection: {
    display: 'flex',
    gap: '20px',
    minHeight: '276px',
    alignItems: 'stretch'
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: `1px solid ${BORDER}`,
    padding: '16px 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '14px',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
  },
  statTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px'
  },
  statBodyBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left'
  },
  statLabelText: {
    fontSize: '10px',
    color: '#64748B',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    lineHeight: 1.35,
    maxWidth: '90px'
  },
  statNumberGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statNumberText: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#0F172A',
    lineHeight: 1
  },
  statTrendPill: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#0D9488',
    backgroundColor: '#CCFBF1',
    padding: '2px 7px',
    borderRadius: '6px'
  },
  statIconBadge: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statFooter: {
    minHeight: '26px',
    display: 'flex',
    alignItems: 'flex-end'
  },
  subRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '10px',
    fontWeight: 500,
    color: '#94A3B8',
    lineHeight: 1.35,
    textAlign: 'left'
  },
  subDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0
  },
  mapCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 2,
    border: `1px solid ${BORDER}`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    minWidth: 0,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
  },
  mapHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '16px 18px',
    boxSizing: 'border-box',
    borderBottom: '1px solid #F1F5F9'
  },
  liveLabel: {
    color: '#0F172A',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  pingDot: {
    width: '7px',
    height: '7px',
    backgroundColor: '#0D9488',
    borderRadius: '50%'
  },
  campusTargetLabel: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    backgroundColor: '#F1F5F9',
    padding: '5px 10px',
    borderRadius: '6px'
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC'
  },
  mapLegendCard: {
    position: 'absolute',
    bottom: '16px',
    right: '16px',
    width: '178px',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    padding: '12px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backdropFilter: 'blur(8px)',
    boxSizing: 'border-box'
  },
  legendHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '6px'
  },
  legendHeader: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '0.5px'
  },
  legendSub: {
    fontSize: '8px',
    fontWeight: 500,
    color: '#94A3B8'
  },
  legendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '9px'
  },
  legendItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  legendItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px'
  },
  legendDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  legendName: {
    fontSize: '10px',
    fontWeight: 500,
    color: '#334155'
  },
  legendBadge: {
    fontSize: '8.5px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  activityPanel: {
    backgroundColor: '#ffffff',
    border: `1px solid ${BORDER}`,
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    boxSizing: 'border-box',
    overflow: 'hidden',
    minWidth: 0,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 16px 14px',
    borderBottom: '1px solid #F1F5F9'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '16px',
    flex: 1,
    overflowY: 'auto'
  },
  activityItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    textAlign: 'left'
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    marginTop: '4px',
    flexShrink: 0
  },
  itemContentBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    flex: 1,
    minWidth: 0
  },
  itemTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '8px'
  },
  itemTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#0F172A',
    margin: 0
  },
  itemTime: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap'
  },
  itemDesc: {
    fontSize: '11px',
    color: '#64748B',
    margin: 0,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  activityFooter: {
    borderTop: '1px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
    padding: '12px 16px',
    fontSize: '10px',
    fontWeight: 500,
    color: '#64748B',
    textAlign: 'center'
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 18px 14px'
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.2px'
  },
  weekBadge: {
    fontSize: '10px',
    fontWeight: 600,
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    padding: '4px 10px',
    borderRadius: '6px'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderTop: '1px solid #F1F5F9',
    fontSize: '10px',
    fontWeight: 500,
    color: '#94A3B8'
  },
  footerLink: {
    color: '#2563EB',
    fontWeight: 600,
    cursor: 'pointer'
  },
  footerStrong: {
    color: '#334155',
    fontWeight: 600
  },
  tableCard: {
    backgroundColor: '#ffffff',
    border: `1px solid ${BORDER}`,
    borderRadius: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    minWidth: 0,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
  },
  tableBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 18px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  thLeftAlign: {
    padding: '12px 0',
    fontSize: '10px',
    fontWeight: 600,
    color: '#94A3B8',
    borderTop: '1px solid #F1F5F9',
    borderBottom: '1px solid #F1F5F9',
    letterSpacing: '0.4px',
    textAlign: 'left'
  },
  thCenterAlign: {
    padding: '12px 0',
    fontSize: '10px',
    fontWeight: 600,
    color: '#94A3B8',
    borderTop: '1px solid #F1F5F9',
    borderBottom: '1px solid #F1F5F9',
    letterSpacing: '0.4px',
    textAlign: 'center'
  },
  thRightAlign: {
    padding: '12px 0',
    fontSize: '10px',
    fontWeight: 600,
    color: '#94A3B8',
    borderTop: '1px solid #F1F5F9',
    borderBottom: '1px solid #F1F5F9',
    letterSpacing: '0.4px',
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
    color: '#1E40AF',
    fontWeight: 700,
    textAlign: 'center',
    fontSize: '13px'
  },
  tdTripsCell: {
    padding: '12px 0',
    fontWeight: 700,
    textAlign: 'right',
    color: '#0F172A',
    fontSize: '13px'
  },
  tableAvatarImage: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: `1px solid ${BORDER}`
  },
  tableAvatarMock: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: '11px',
    fontWeight: 700,
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${BORDER}`
  },
  driverNameText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A'
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '20px 0'
  },
  emptyIconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6px'
  },
  emptyTitle: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569'
  },
  emptySub: {
    margin: 0,
    fontSize: '11px',
    color: '#94A3B8'
  },
  chartCard: {
    backgroundColor: '#ffffff',
    border: `1px solid ${BORDER}`,
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    boxSizing: 'border-box',
    minWidth: 0,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
  },
  chartTrack: {
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    gap: '26px',
    padding: '12px 24px 14px',
    minHeight: '150px'
  },
  chartColumnWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  barSlot: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    borderBottom: '1px solid #E2E8F0'
  },
  barColumn: {
    width: '100%',
    borderRadius: '4px 4px 0 0',
    maxHeight: '100%',
    transition: 'all 0.2s ease'
  },
  barLabel: {
    fontSize: '10px',
    letterSpacing: '0.3px'
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
    color: '#af1e20',
    fontWeight: 600
  }
}