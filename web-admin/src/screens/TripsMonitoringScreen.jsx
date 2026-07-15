import React, { useState, useEffect } from 'react'
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Radio,
  MapPin,
  ShieldAlert,
  LogOut,
  Car
} from 'lucide-react'
import api from '../api/axios'

export default function TripsMonitoringScreen() {
  const [activeRightTab, setActiveRightTab] = useState('trips')
  const [selectedDriverId, setSelectedDriverId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Live Operations States
  const [metrics, setMetrics] = useState([])
  const [activeTrips, setActiveTrips] = useState([])
  const [routePerformance, setRoutePerformance] = useState([])
  const [driverRoster, setDriverRoster] = useState([])
  const [eventsLog, setEventsLog] = useState([])

  const fetchLiveTrackingState = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      
      const res = await api.get('/admin/monitoring/snapshot')
      if (res.data?.success && res.data?.data) {
        const { metrics: rawMetrics, activeTrips: rawTrips, routePerformance: rawRoute, driverRoster: rawRoster } = res.data.data
        
        // Hydrate metrics with frontend lucide-react icons
        const iconMapping = [
          { icon: <Users size={18} color="#1E3A8A" /> },
          { icon: <CheckCircle size={18} color="#1E3A8A" /> },
          { icon: <Clock size={18} color="#CA8A04" /> },
          { icon: <AlertTriangle size={18} color="#DC2626" /> }
        ]

        setMetrics(rawMetrics.map((item, idx) => ({
          ...item,
          icon: iconMapping[idx]?.icon || <Users size={18} />
        })))

        setActiveTrips(rawTrips)
        setRoutePerformance(rawRoute)
        setDriverRoster(rawRoster)

        if (rawRoster.length > 0 && !selectedDriverId) {
          setSelectedDriverId(rawRoster[0].id)
        }

        // Maintain log track of state changes
        if (rawTrips.length > 0) {
          setEventsLog([
            { id: 1, title: 'Dispatches Synchronized', desc: `Operations matched with ${rawTrips.length} current active runs.`, time: 'LIVE', color: '#16A34A' },
            { id: 2, title: 'Geospatial Heartbeat Active', desc: 'Rerouting indices recalculated across Legon campus zones.', time: 'LIVE', color: '#2563EB' }
          ])
        } else {
          setEventsLog([
            { id: 1, title: 'Systems Live & Listening', desc: 'Awaiting active campus ride matching signals...', time: 'LIVE', color: '#3B82F6' }
          ])
        }
      }
    } catch (err) {
      console.error("Monitoring screen telemetry sync failure:", err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveTrackingState(true)
    
    // High-frequency 3-second operational room sync polling
    const liveTelemetryPoller = setInterval(() => {
      fetchLiveTrackingState(false)
    }, 3000)

    return () => clearInterval(liveTelemetryPoller)
  }, [selectedDriverId])

  const handleDriverAction = async (driverId, commandType) => {
    try {
      const res = await api.post(`/admin/monitoring/driver/${driverId}/action`, { action: commandType })
      if (res.data?.success) {
        alert(`Successfully executed command: ${commandType.toUpperCase()}`)
        fetchLiveTrackingState(false)
      }
    } catch (err) {
      console.error("Action transmission failure:", err)
      alert("Failed executing operations action.")
    }
  }

  const auditedDriver = driverRoster.find(d => d.id === selectedDriverId) || driverRoster[0]

  if (loading) {
    return (
      <div style={tmStyles.loadingContainerFrame}>
        <span style={tmStyles.loadingText}>Syncing Live Operational Telemetry Feed...</span>
      </div>
    )
  }

  return (
    <div style={tmStyles.workspaceWrapperContainer}>
      <MapStyles />

      {/* 1. UPPER OVERVIEW METRICS GRID */}
      <div style={tmStyles.metricsGrid}>
        {metrics.map((m) => (
          <div key={m.id} style={tmStyles.statCard}>
            <div style={smStyles.statBodyBlock}>
              <span style={smStyles.statLabelText}>{m.label}</span>
              <div style={smStyles.statNumberGroup}>
                <span style={smStyles.statNumberText}>{m.value}</span>
                <span style={{ ...smStyles.statTrendText, color: m.color }}>{m.change}</span>
              </div>
            </div>
            <div style={{ ...smStyles.statIconBadge, backgroundColor: m.bg }}>{m.icon}</div>
          </div>
        ))}
      </div>

      {/* 2. MIDDLE ROW CANVAS: SPLIT ZONES TABLE & SIDEPANEL */}
      <div style={tmStyles.splitContentRowCanvas}>

        {/* LEFT COLUMN COMPONENT LAYER: CAMPUS ZONES CARD */}
        <div style={tmStyles.leftWorkspaceMainColumn}>
          <div style={tmStyles.routePerformanceCard}>
            <div style={tmStyles.panelHeadingRowFlexHeader}>
              <h3 style={tmStyles.containerBlockTitle}>Campus Zone Demand Density</h3>
              <span style={tmStyles.liveFeedIndicatorTag}>
                <Radio size={12} style={tmStyles.iconRightMarginSpacing} /> GPS Feed Live
              </span>
            </div>

            <div style={tmStyles.performanceGridTable}>
              <div style={tmStyles.tableHeaderRow}>
                <span style={tmStyles.tableHeaderLabel}>CAMPUS PICKUP ZONE</span>
                <span style={tmStyles.tableHeaderLabel}>ONLINE DRIVERS</span>
                <span style={tmStyles.tableHeaderLabel}>AVG WAIT ETA</span>
                <span style={{ ...tmStyles.tableHeaderLabel, textAlign: 'right' }}>SURGE VELOCITY</span>
              </div>
              {routePerformance.map((route, index) => (
                <div key={index} style={tmStyles.tableDataDataRow}>
                  <span style={tmStyles.routeNameText}>{route.name}</span>
                  <span style={tmStyles.routeMetricsText}>{route.activeDrivers} cars roaming</span>
                  <span style={tmStyles.routeMetricsText}>{route.avgEta}</span>
                  <div style={tmStyles.flexRightAlignWrapper}>
                    <span style={{ ...tmStyles.loadStatusPill, backgroundColor: route.color }}>
                      {route.load}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN COMPONENT LAYER: INTERACTIVE MONITOR SIDEBAR */}
        <div style={tmStyles.rightWorkspaceSidebarPanel}>
          <div style={tmStyles.tabHeaderSwitcherTrackRow}>
            <button 
              style={{ ...tmStyles.switchTriggerButton, backgroundColor: activeRightTab === 'trips' ? '#ffffff' : 'transparent', color: activeRightTab === 'trips' ? '#1E3A8A' : '#64748B', fontWeight: activeRightTab === 'trips' ? 800 : 600 }} 
              onClick={() => setActiveRightTab('trips')}
            >
              Active Dispatches
            </button>
            <button 
              style={{ ...tmStyles.switchTriggerButton, backgroundColor: activeRightTab === 'driver-roster' ? '#ffffff' : 'transparent', color: activeRightTab === 'driver-roster' ? '#1E3A8A' : '#64748B', fontWeight: activeRightTab === 'driver-roster' ? 800 : 600 }} 
              onClick={() => setActiveRightTab('driver-roster')}
            >
              Active Drivers
            </button>
          </div>

          <div style={tmStyles.tripsScrollContainer}>
            {activeRightTab === 'trips' ? (
              activeTrips.length > 0 ? (
                activeTrips.map((t, idx) => (
                  <div key={idx} style={tmStyles.tripCleanLayoutItemBlock}>
                    <div style={tmStyles.tripCardTopHeaderLine}>
                      <span style={tmStyles.tripIdIdentifierLabelText}>{t.id}</span>
                      <span style={{ ...tmStyles.liveStatusBadgeMarkup, backgroundColor: t.statusBg, color: t.statusColor }}>{t.status}</span>
                    </div>

                    <div style={tmStyles.tripIdentityDetailsGridContainer}>
                      <div style={tmStyles.identityEntityDataStackLeft}>
                        <span style={tmStyles.cleanMetaMicroTitleFieldLabel}>RIDER</span>
                        <span style={tmStyles.cleanMetaFieldValueStrongText}>{t.studentName}</span>
                      </div>
                      <div style={tmStyles.identityEntityDataStackLeft}>
                        <span style={tmStyles.cleanMetaMicroTitleFieldLabel}>MATCHED DRIVER</span>
                        <span style={tmStyles.cleanMetaFieldValueStrongText}>{t.driverName}</span>
                      </div>
                    </div>

                    <div style={tmStyles.tripCardBaseRouteTrackingFootprintBar}>
                      <div style={tmStyles.inlineMicroFlexRowAssetField}><MapPin size={12} color="#94A3B8" /><span style={tmStyles.microFooterValueDataText}>{t.route}</span></div>
                      <div style={tmStyles.inlineMicroFlexRowAssetField}><Car size={12} color="#94A3B8" /><span style={tmStyles.microFooterValueDataText}>{t.vehicle}</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={tmStyles.emptyStateTextWrapper}>No active runs on campus right now.</div>
              )
            ) : (
              driverRoster.length > 0 ? (
                driverRoster.map((driver, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedDriverId(driver.id)} 
                    style={{ ...tmStyles.driverRosterLayoutCardBlock, border: selectedDriverId === driver.id ? '2px solid #1E3A8A' : '1px solid #E2E8F0' }}
                  >
                    <div style={tmStyles.driverRosterHeaderFlexRow}>
                      <div style={tmStyles.driverIdentityTextStack}>
                        <span style={tmStyles.driverRosterNameTitle}>{driver.name}</span>
                        <span style={tmStyles.driverRosterSubAssetLabel}>{driver.id.substring(18)} • {driver.vehicle}</span>
                      </div>
                      <span style={{ ...tmStyles.statusBadgeIndicatorPillMarkup, backgroundColor: driver.statusBg, color: driver.statusColor }}>{driver.status}</span>
                    </div>
                    <p style={tmStyles.driverLiveActivityLogDetailsDescriptionText}>{driver.details}</p>
                  </div>
                ))
              ) : (
                <div style={tmStyles.emptyStateTextWrapper}>No registered drivers on platform.</div>
              )
            )}
          </div>
        </div>
      </div>

      {/* 3. BASE TIER PANEL: DYNAMIC AUDITING LEDGER & RECENT TIMELINE LOGS */}
      <div style={tmStyles.bottomDoubleGridCanvasRow}>

        {/* LOWER GRID WINDOW LEFT: ACTIVE OPERATOR DETAILS DETECTOR */}
        <div style={tmStyles.driverHistoryLedgerCard}>
          <div style={tmStyles.panelHeadingRowFlexHeader}>
            <h3 style={tmStyles.containerBlockTitle}>Driver Audit Blueprint: <span style={tmStyles.auditedDriverInlineHeadingText}>{auditedDriver?.name}</span></h3>
          </div>

          <div style={tmStyles.driverHistorySplitGridContainers}>
            <div style={{ ...tmStyles.ledgerMetricSubBlock, gridColumn: 'span 2' }}>
              <span style={tmStyles.subBlockHeadingTitle}>LIFETIME PERFORMANCE TRACKER</span>
              <p style={tmStyles.ledgerDataRowText}>Total Completed Rides: <strong>{auditedDriver?.lifetimeTrips?.completed}</strong></p>
              <p style={tmStyles.ledgerDataRowText}>Total Customer Cancellations: <strong style={tmStyles.errorColorEmphasisText}>{auditedDriver?.lifetimeTrips?.canceled}</strong></p>
            </div>

            <div style={{ ...tmStyles.ledgerMetricSubBlock, gridColumn: 'span 2' }}>
              <span style={tmStyles.subBlockHeadingTitle}>BEHAVIORAL INFRACTIONS RECORD DETECTOR</span>
              {auditedDriver?.infractionsLog?.length > 0 ? auditedDriver.infractionsLog.map((inf, i) => (
                <div key={i} style={tmStyles.infractionRowCard}>
                  <div style={tmStyles.historyCardHeader}>
                    <span style={tmStyles.infractionLabelErrorFlexLine}>
                      <AlertTriangle size={12} style={tmStyles.iconRightMarginSpacing} />{inf.type}
                    </span>
                    <span>{inf.date}</span>
                  </div>
                  <p style={tmStyles.infractionDetailsParagraphBodyText}>{inf.details}</p>
                </div>
              )) : (
                <p style={tmStyles.emptyLedgerFallbackItalicText}>No behavioral infractions or system performance flags logged.</p>
              )}
            </div>
          </div>

          {/* Active Operator Control Access Layout Context */}
          {activeRightTab === 'driver-roster' && auditedDriver && (
            <div style={tmStyles.driverRosterActionButtonsClusterRow}>
              <button style={tmStyles.driverRosterFlagActionButton} onClick={() => handleDriverAction(auditedDriver.id, 'flag')}>
                <ShieldAlert size={12} /> Flag Operator Account
              </button>
              <button style={tmStyles.driverRosterLogoutActionButton} onClick={() => handleDriverAction(auditedDriver.id, 'logout')}>
                <LogOut size={12} /> Force Disconnect Offline
              </button>
            </div>
          )}
        </div>

        {/* LOWER GRID WINDOW RIGHT: TIMELINE LOGGER LOG TRACK */}
        <div style={tmStyles.eventLogCardContainer}>
          <div style={tmStyles.panelHeadingRowFlexHeader}>
            <h3 style={tmStyles.containerBlockTitle}>Ride-Matching System Timeline Logs</h3>
          </div>
          <div style={tmStyles.verticalFlexStackLayoutContainer}>
            {eventsLog.map((log, idx) => (
              <div key={idx} style={tmStyles.logEventRowStrip}>
                <div style={tmStyles.logEventLeftStatusCluster}>
                  <div style={{ ...tmStyles.logStatusNodePoint, backgroundColor: log.color }} />
                  <div style={tmStyles.logTextStackTextGroup}>
                    <span style={tmStyles.logEventHeadingTitleText}>{log.title}</span>
                    <span style={smStyles.studentProfileSecondaryEmailText}>{log.desc}</span>
                  </div>
                </div>
                <span style={tmStyles.logTimestampCounterText}>{log.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

const MapStyles = () => (
  <style>{`
    @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
  `}</style>
)

 const smStyles = {
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
  studentProfileSecondaryEmailText: { 
    fontSize: '11px', 
    color: '#64748B', 
    fontWeight: 500 
  }
}

const tmStyles = {
  workspaceWrapperContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px', 
    width: '100%', 
    boxSizing: 'border-box' 
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
    flex: 3, 
    boxSizing: 'border-box' 
  },
  routePerformanceCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px', 
    boxSizing: 'border-box' 
  },
  panelHeadingRowFlexHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    marginBottom: '4px' 
  },
  liveFeedIndicatorTag: { 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#16A34A', 
    display: 'flex', 
    alignItems: 'center' 
  },
  iconRightMarginSpacing: { 
    marginRight: '6px' 
  },
  performanceGridTable: { 
    display: 'flex', 
    flexDirection: 'column', 
    width: '100%' 
  },
  tableHeaderRow: { 
    display: 'grid', 
    gridTemplateColumns: '1.5fr 1fr 1fr 1fr', 
    paddingBottom: '12px', 
    borderBottom: '1px solid #F1F5F9' 
  },
  tableHeaderLabel: { 
    fontSize: '10px', 
    fontWeight: 800, 
    color: '#94A3B8', 
    letterSpacing: '0.5px', 
    textAlign: 'left' 
  },
  tableDataDataRow: { 
    display: 'grid', 
    gridTemplateColumns: '1.5fr 1fr 1fr 1fr', 
    padding: '16px 0', 
    alignItems: 'center', 
    borderBottom: '1px solid #F8FAFC' 
  },
  routeNameText: { 
    fontSize: '13px', 
    fontWeight: 700, 
    color: '#1E293B', 
    textAlign: 'left' 
  },
  routeMetricsText: { 
    fontSize: '12px', 
    fontWeight: 600, 
    color: '#475569', 
    textAlign: 'left' 
  },
  flexRightAlignWrapper: { 
    display: 'flex', 
    justifyContent: 'flex-end' 
  },
  loadStatusPill: { 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#ffffff', 
    padding: '4px 12px', 
    borderRadius: '50px', 
    textAlign: 'center', 
    width: 'fit-content' 
  },
  containerBlockTitle: { 
    fontSize: '15px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    margin: 0, 
    textAlign: 'left' 
  },
  rightWorkspaceSidebarPanel: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    flex: 1.2, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px', 
    minWidth: '360px', 
    boxSizing: 'border-box' 
  },
  tabHeaderSwitcherTrackRow: { 
    display: 'flex', 
    backgroundColor: '#F1F5F9', 
    borderRadius: '10px', 
    padding: '4px', 
    gap: '4px', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  switchTriggerButton: { 
    flex: 1, 
    border: 'none', 
    padding: '8px 0', 
    borderRadius: '8px', 
    fontSize: '12px', 
    cursor: 'pointer', 
    outline: 'none', 
    transition: 'all 0.1s ease' 
  },
  tripsScrollContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '16px', 
    maxHeight: '380px', 
    overflowY: 'auto', 
    paddingRight: '4px' 
  },
  tripCleanLayoutItemBlock: { 
    border: '1px solid #E2E8F0', 
    borderRadius: '14px', 
    padding: '16px', 
    backgroundColor: '#ffffff', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '14px', 
    textAlign: 'left' 
  },
  tripCardTopHeaderLine: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%' 
  },
  tripIdIdentifierLabelText: { 
    fontSize: '11px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    fontFamily: 'monospace', 
    backgroundColor: '#EFF6FF', 
    padding: '2px 8px', 
    borderRadius: '6px' 
  },
  liveStatusBadgeMarkup: { 
    fontSize: '10px', 
    fontWeight: 700, 
    padding: '4px 10px', 
    borderRadius: '50px', 
    whiteSpace: 'nowrap' 
  },
  tripIdentityDetailsGridContainer: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '12px', 
    width: '100%' 
  },
  identityEntityDataStackLeft: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '3px', 
    textAlign: 'left' 
  },
  cleanMetaMicroTitleFieldLabel: { 
    fontSize: '9px', 
    fontWeight: 800, 
    color: '#94A3B8', 
    letterSpacing: '0.3px', 
    textTransform: 'uppercase' 
  },
  cleanMetaFieldValueStrongText: { 
    fontSize: '12px', 
    fontWeight: 700, 
    color: '#1E293B', 
    overflow: 'hidden', 
    textOverflow: 'ellipsis', 
    whiteSpace: 'nowrap' 
  },
  tripCardBaseRouteTrackingFootprintBar: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderTop: '1px solid #F1F5F9', 
    paddingTop: '10px', 
    marginTop: '2px' 
  },
  inlineMicroFlexRowAssetField: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px' 
  },
  microFooterValueDataText: { 
    fontSize: '11px', 
    fontWeight: 600, 
    color: '#475569' 
  },
  driverRosterLayoutCardBlock: { 
    border: '1px solid #E2E8F0', 
    borderRadius: '14px', 
    padding: '16px', 
    backgroundColor: '#ffffff', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px', 
    textAlign: 'left', 
    cursor: 'pointer' 
  },
  driverRosterHeaderFlexRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    gap: '12px', 
    width: '100%' 
  },
  driverIdentityTextStack: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '2px', 
    overflow: 'hidden' 
  },
  driverRosterNameTitle: { 
    fontSize: '13px', 
    fontWeight: 700, 
    color: '#1E293B', 
    overflow: 'hidden', 
    textOverflow: 'ellipsis', 
    whiteSpace: 'nowrap' 
  },
  driverRosterSubAssetLabel: { 
    fontSize: '11px', 
    color: '#64748B', 
    fontWeight: 600, 
    fontFamily: 'monospace' 
  },
  statusBadgeIndicatorPillMarkup: { 
    fontSize: '10px', 
    fontWeight: 800, 
    padding: '3px 8px', 
    borderRadius: '6px', 
    whiteSpace: 'nowrap' 
  },
  driverLiveActivityLogDetailsDescriptionText: { 
    fontSize: '12px', 
    color: '#475569', 
    fontWeight: 500, 
    margin: 0, 
    lineHeight: '1.4' 
  },
  bottomDoubleGridCanvasRow: { 
    display: 'grid', 
    gridTemplateColumns: '1.6fr 1fr', 
    gap: '32px', 
    width: '100%', 
    marginTop: '24px' 
  },
  driverHistoryLedgerCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px', 
    boxSizing: 'border-box' 
  },
  auditedDriverInlineHeadingText: { 
    color: '#1E3A8A' 
  },
  driverHistorySplitGridContainers: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '20px', 
    width: '100%' 
  },
  ledgerMetricSubBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px', 
    padding: '16px', 
    border: '1px solid #F1F5F9', 
    borderRadius: '12px', 
    backgroundColor: '#FAFCFF', 
    textAlign: 'left' 
  },
  subBlockHeadingTitle: { 
    fontSize: '9px', 
    fontWeight: 800, 
    color: '#94A3B8', 
    letterSpacing: '0.5px' 
  },
  ledgerDataRowText: { 
    fontSize: '12px', 
    color: '#334155', 
    margin: 0, 
    fontWeight: 500 
  },
  errorColorEmphasisText: { 
    color: '#991B1B' 
  },
  infractionRowCard: { 
    padding: '10px', 
    border: '1px solid #FEE2E2', 
    borderRadius: '8px', 
    backgroundColor: '#FFF5F5', 
    display: 'flex', 
    flexDirection: 'column', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  infractionLabelErrorFlexLine: { 
    color: '#991B1B', 
    fontWeight: 700, 
    display: 'flex', 
    alignItems: 'center' 
  },
  infractionDetailsParagraphBodyText: { 
    margin: '4px 0 0 0', 
    fontSize: '11px', 
    color: '#475569' 
  },
  emptyLedgerFallbackItalicText: { 
    fontSize: '12px', 
    color: '#64748B', 
    margin: 0, 
    fontWeight: 500, 
    fontStyle: 'italic' 
  },
  driverRosterActionButtonsClusterRow: { 
    display: 'flex', 
    gap: '10px', 
    width: '100%', 
    marginTop: '4px', 
    borderTop: '1px solid #F1F5F9', 
    paddingTop: '16px' 
  },
  driverRosterFlagActionButton: { 
    flex: 1, 
    backgroundColor: '#FFF1F2', 
    border: 'none', 
    borderRadius: '8px', 
    color: '#E11D48', 
    fontSize: '11px', 
    fontWeight: 700, 
    padding: '10px 0', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '4px' 
  },
  driverRosterLogoutActionButton: { 
    flex: 1, 
    backgroundColor: '#F1F5F9', 
    border: 'none', 
    borderRadius: '8px', 
    color: '#475569', 
    fontSize: '11px', 
    fontWeight: 700, 
    padding: '10px 0', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '4px' 
  },
  eventLogCardContainer: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    width: '100%', 
    boxSizing: 'border-box', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px' 
  },
  verticalFlexStackLayoutContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px' 
  },
  historyCardHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    fontSize: '11px', 
    color: '#475569' 
  },
  logEventRowStrip: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottom: '1px solid #F8FAFC', 
    paddingBottom: '10px', 
    gap: '16px' 
  },
  logEventLeftStatusCluster: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    textAlign: 'left' 
  },
  logStatusNodePoint: { 
    width: '6px', 
    height: '6px', 
    borderRadius: '50%', 
    flexShrink: 0 
  },
  logTextStackTextGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '2px' 
  },
  logEventHeadingTitleText: { 
    fontSize: '12px', 
    fontWeight: 700, 
    color: '#1E293B' 
  },
  logTimestampCounterText: { 
    fontSize: '11px', 
    color: '#94A3B8', 
    fontWeight: 600, 
    flexShrink: 0 
  },
  loadingContainerFrame: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '75vh', 
    width: '100%' 
  },
  loadingText: { 
    fontSize: '14px', 
    color: '#1E3A8A', 
    fontWeight: 700 
  },
  emptyStateTextWrapper: { 
    padding: '24px', 
    textAlign: 'center', 
    color: '#94A3B8', 
    fontSize: '12px', 
    fontWeight: 600 
  }
}