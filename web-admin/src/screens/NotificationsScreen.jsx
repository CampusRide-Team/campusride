import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  AlertTriangle, 
  UserPlus, 
  Car, 
  ShieldAlert, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  Megaphone,
  X
} from 'lucide-react'
import api from '../api/axios'

export default function NotificationsScreen() {
  const [activeTab, setActivePageTab] = useState('all') 
  const [notifications, setNotifications] = useState([])
  const [criticalAlerts, setCriticalAlerts] = useState([])
  const [pendingTasks, setPendingTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('ALL') 
  const [broadcastUrgency, setBroadcastUrgency] = useState('INFO') 
  const [isSending, setIsSending] = useState(false)

  const fetchNotificationsData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      
      const res = await api.get(`/admin/notifications/snapshot?t=${Date.now()}`)
      
      if (res.data?.success && res.data?.data) {
        const { metrics = {}, notifications: rawNotes = [] } = res.data.data

        const feedStyleLookup = {
          driver: { icon: <UserPlus size={16} color="#1E3A8A" />, bg: '#EFF6FF', sideBg: '#1E3A8A' },
          rides: { icon: <Car size={16} color="#DC2626" />, bg: '#FEE2E2', sideBg: '#DC2626' },
          system: { icon: <AlertTriangle size={16} color="#475569" />, bg: '#F1F5F9', sideBg: '#475569' }
        }

        const hydratedNotes = rawNotes.map(note => {
          if (!note) return null
          const defaults = note.urgency === 'CRITICAL' 
            ? { icon: <AlertTriangle size={16} color="#DC2626" />, bg: '#FEE2E2', sideBg: '#DC2626' }
            : { icon: <Megaphone size={16} color="#1E3A8A" />, bg: '#EFF6FF', sideBg: '#1E3A8A' };

          const config = feedStyleLookup[note.category] || defaults;

          return {
            ...note,
            _id: note._id || note.id,
            icon: config.icon,
            bg: config.bg,
            sideBg: config.sideBg,
            actionText: note.category === 'driver' ? 'Verify Credentials' : note.category === 'rides' ? 'Inspect Live' : 'Acknowledge'
          }
        }).filter(Boolean)

        setNotifications(hydratedNotes)
        setCriticalAlerts(hydratedNotes.filter(n => n.urgency === 'CRITICAL'))
        
        // Dynamically structure the sidebar items using true live counters from the database
        setPendingTasks([
          { id: '1', title: 'Pending Driver Screenings', count: `${metrics.pendingDrivers || 0} left` },
          { id: '2', title: 'Active Transit Running Streams', count: `${metrics.activeRides || 0} current` },
          { id: '3', title: 'Total Users Connected', count: `${metrics.systemLoad || 0} entities` }
        ])
      }
    } catch (error) {
      console.error("Failed syncing notification registry lists:", error)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotificationsData(true)
  }, [])

  const handleDispatchBroadcast = async (e) => {
    e.preventDefault()
    if (!broadcastTitle || !broadcastMessage) return

    try {
      setIsSending(true)
      
      const res = await api.post('/admin/notifications/broadcast', {
        title: broadcastTitle,
        body: broadcastMessage, 
        target: broadcastTarget,
        urgency: broadcastUrgency
      })

      if (res.data?.success) {
        alert("System broadcast successfully deployed!")
        setBroadcastTitle('')
        setBroadcastMessage('')
        setIsModalOpen(false)
        fetchNotificationsData(false) 
      }
    } catch (err) {
      console.error("Failed deploying global broadcast payload configuration:", err)
      alert("Error sending message. Please check the backend console logs.")
    } finally {
      setIsSending(false)
    }
  }

  const handleActionClick = async (notificationId, actionType) => {
    if (actionType === 'dismiss') {
      try {
        const res = await api.delete(`/admin/notifications/${notificationId}`)
        
        if (res.data?.success) {
          const targetIdStr = String(notificationId).trim();
          
          setNotifications(prev => prev.filter(note => {
            const noteId = note._id ? String(note._id).trim() : '';
            const fallbackId = note.id ? String(note.id).trim() : '';
            return noteId !== targetIdStr && fallbackId !== targetIdStr;
          }));
          
          setCriticalAlerts(prev => prev.filter(note => {
            const noteId = note._id ? String(note._id).trim() : '';
            const fallbackId = note.id ? String(note.id).trim() : '';
            return noteId !== targetIdStr && fallbackId !== targetIdStr;
          }));
        }
      } catch (err) {
        console.error("Failed to dismiss notification:", err)
        alert("Failed to dismiss this notification.")
      }
    } else {
      console.log(`Notification action: [${actionType}] targeted at entry: ${notificationId}`)
    }
  }

  const filteredFeed = notifications.filter(n => {
    if (activeTab === 'all') return true
    return n.category === activeTab
  })

  if (loading) {
    return (
      <div style={ntStyles.loadingFrame}>
        <span style={ntStyles.loadingText}>Syncing Platform Logs...</span>
      </div>
    )
  }

  return (
    <div style={ntStyles.workspaceWrapperContainer}>

      {/* NEW HEADER AREA WITH QUICK ACTION TRIGGER */}
      <div style={ntStyles.dashboardHeaderBlockFlexRow}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>System Notifications Hub</h2>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>Monitor live operations data updates and broadcast messaging streams</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={ntStyles.toolbarBroadcastActionButton}>
          <Megaphone size={14} /> Send Global Broadcast
        </button>
      </div>

      {/* SPLIT LAYOUT CANVAS PANELS */}
      <div style={ntStyles.splitContentRowCanvas}>

        {/* LEFT COMPONENT: SYSTEM EVENT LOGGER FEED */}
        <div style={ntStyles.leftWorkspaceMainColumn}>
          <div style={ntStyles.feedContainerCard}>

            <div style={ntStyles.tabHeaderSwitcherTrackRow}>
              <button onClick={() => setActivePageTab('all')} style={{ ...ntStyles.switchTriggerButton, backgroundColor: activeTab === 'all' ? '#ffffff' : 'transparent', fontWeight: activeTab === 'all' ? 800 : 600, color: activeTab === 'all' ? '#1E3A8A' : '#64748B' }}>All Activity</button>
              <button onClick={() => setActivePageTab('system')} style={{ ...ntStyles.switchTriggerButton, backgroundColor: activeTab === 'system' ? '#ffffff' : 'transparent', fontWeight: activeTab === 'system' ? 800 : 600, color: activeTab === 'system' ? '#1E3A8A' : '#64748B' }}>System Events</button>
              <button onClick={() => setActivePageTab('driver')} style={{ ...ntStyles.switchTriggerButton, backgroundColor: activeTab === 'driver' ? '#ffffff' : 'transparent', fontWeight: activeTab === 'driver' ? 800 : 600, color: activeTab === 'driver' ? '#1E3A8A' : '#64748B' }}>Driver Context</button>
              <button onClick={() => setActivePageTab('rides')} style={{ ...ntStyles.switchTriggerButton, backgroundColor: activeTab === 'rides' ? '#ffffff' : 'transparent', fontWeight: activeTab === 'rides' ? 800 : 600, color: activeTab === 'rides' ? '#1E3A8A' : '#64748B' }}>Ride Runs</button>
            </div>

            <div style={ntStyles.notificationsVerticalScrollFrame}>
              {filteredFeed.length > 0 ? (
                filteredFeed.map((note) => {
                  const itemKey = note._id || note.id || Math.random().toString();
                  const displayDesc = note.desc || note.body || note.message || "No content provided.";
                  const displayTime = note.time || "Recent";

                  return (
                    <div key={itemKey} style={{ ...ntStyles.notificationItemStripBlock, borderLeft: `4px solid ${note.sideBg || '#1E3A8A'}` }}>
                      <div style={{ ...ntStyles.itemBadgeNodeIcon, backgroundColor: note.bg || '#EFF6FF' }}>{note.icon}</div>

                      <div style={ntStyles.itemTextDetailsMetadataStackGroup}>
                        <div style={ntStyles.itemFlexTopHeaderLine}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={ntStyles.itemPrimaryHeadingTitleText}>{note.title || "Untitled Notification"}</span>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: note.type === 'SYSTEM_ALERT' ? '#F1F5F9' : '#F3E8FF',
                              color: note.type === 'SYSTEM_ALERT' ? '#475569' : '#6B21A8',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {note.type === 'SYSTEM_ALERT' ? 'System Log' : 'Broadcast'}
                            </span>
                          </div>
                          <span style={ntStyles.itemMicroTimestampLabelText}>{displayTime}</span>
                        </div>
                        <p style={ntStyles.itemParagraphDescriptionBodyText}>{displayDesc}</p>

                        <div style={ntStyles.itemActionButtonsClusterRow}>
                          <button 
                            onClick={() => handleActionClick(itemKey, 'investigate')} 
                            style={ntStyles.itemPrimaryActionButtonMarkup}
                          >
                            {note.actionText || 'Acknowledge'}
                          </button>
                          
                          {/* Only allow dismissal actions for actual global broadcasts */}
                          {note.type !== 'SYSTEM_ALERT' && (
                            <button 
                              onClick={() => handleActionClick(itemKey, 'dismiss')} 
                              style={ntStyles.itemSecondaryDismissButtonMarkup}
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={ntStyles.emptyStateTextWrapper}>Logs history stream clean. No active notifications recorded under this tab category.</div>
              )}
            </div>

            <div style={ntStyles.tableFooterPaginationRow}>
              <div style={ntStyles.tableFooterCount}>Showing {filteredFeed.length} live entries</div>
              <div style={ntStyles.paginationButtonCluster}>
                <button style={ntStyles.paginationArrowButton} aria-label="Previous feed page"><ChevronLeft size={14} color="#64748B" /></button>
                <button style={ntStyles.paginationArrowButton} aria-label="Next feed page"><ChevronRight size={14} color="#64748B" /></button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT WORKSPACE SIDEBAR PANEL */}
        <div style={ntStyles.rightWorkspaceSidebarPanel}>

          {/* CRITICAL ALERTS */}
          <div style={ntStyles.criticalSidebarWidgetCard}>
            <div style={ntStyles.widgetHeaderFlexLine}>
              <ShieldAlert size={14} color="#DC2626" />
              <h4 style={ntStyles.widgetBlockTitleErrorThemeText}>Critical Diagnostics</h4>
            </div>
            <div style={ntStyles.widgetVerticalContentStackList}>
              {criticalAlerts.length > 0 ? (
                criticalAlerts.map((crit) => (
                  <div key={crit._id || crit.id} style={ntStyles.criticalBulletRowCardBlock}>
                    <div style={ntStyles.criticalCardIndicatorBulletNode} />
                    <div style={ntStyles.widgetTextGroupDetailsStack}>
                      <span style={ntStyles.widgetItemTitleStrongText}>{crit.title}</span>
                      <p style={ntStyles.widgetItemParagraphSupportingDescriptionText}>{crit.desc || crit.body || crit.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={ntStyles.emptySidebarFallbackLabelText}>Infrastructure engines tracking nominal. Zero exception states reported.</div>
              )}
            </div>
          </div>

          {/* PENDING TASKS */}
          <div style={ntStyles.tasksSidebarWidgetCard}>
            <div style={ntStyles.widgetHeaderFlexLine}>
              <ClipboardList size={14} color="#1E3A8A" />
              <h4 style={ntStyles.widgetBlockTitlePrimaryThemeText}>Live Context Registry</h4>
            </div>
            <div style={ntStyles.widgetVerticalContentStackList}>
              {pendingTasks.map((task, index) => (
                <div key={index} style={ntStyles.taskListItemRowStrip}>
                  <div style={ntStyles.widgetTextGroupDetailsStack}>
                    <span style={ntStyles.widgetItemTitleStrongText}>{task.title}</span>
                    <span style={ntStyles.widgetItemParagraphSupportingDescriptionText}>{task.count}</span>
                  </div>
                  <Eye size={12} color="#94A3B8" style={ntStyles.clickableHoverAssetCursor} />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* DYNAMIC COMPOSER MODAL OVERLAY PORTAL */}
      {isModalOpen && (
        <div style={ntStyles.modalOverlayFrame}>
          <div style={ntStyles.modalContainerCard}>
            <div style={ntStyles.modalHeaderRow}>
              <div style={ntStyles.widgetHeaderFlexLine}>
                <Megaphone size={16} color="#1E3A8A" />
                <h3 style={ntStyles.modalHeadingTitleText}>Compose Custom User Broadcast</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={ntStyles.modalCloseIconButton}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleDispatchBroadcast} style={ntStyles.modalBodyFormStack}>
              <div style={ntStyles.modalInputFieldGroup}>
                <label style={ntStyles.modalFieldTitleLabel}>Alert Heading / Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. System Update Notification" 
                  value={broadcastTitle} 
                  onChange={(e) => setBroadcastTitle(e.target.value)} 
                  required 
                  style={ntStyles.modalStandardTextInput} 
                />
              </div>

              <div style={ntStyles.modalInlineFormFieldsSplitRow}>
                <div style={ntStyles.modalInputFieldGroup}>
                  <label style={ntStyles.modalFieldTitleLabel}>Target Recipient Pool</label>
                  <select 
                    value={broadcastTarget} 
                    onChange={(e) => setBroadcastTarget(e.target.value)} 
                    style={ntStyles.modalDropdownNativeInput}
                  >
                    <option value="ALL">All Platform Users (Riders + Drivers)</option>
                    <option value="DRIVERS">Active Drivers Only</option>
                    <option value="RIDERS">Registered Riders Only</option>
                  </select>
                </div>

                <div style={ntStyles.modalInputFieldGroup}>
                  <label style={ntStyles.modalFieldTitleLabel}>Urgency Priority Tier</label>
                  <select 
                    value={broadcastUrgency} 
                    onChange={(e) => setBroadcastUrgency(e.target.value)} 
                    style={ntStyles.modalDropdownNativeInput}
                  >
                    <option value="INFO">Informational Update (Blue Branding)</option>
                    <option value="CRITICAL">Critical Service Interruption (Red Branding)</option>
                  </select>
                </div>
              </div>

              <div style={ntStyles.modalInputFieldGroup}>
                <label style={ntStyles.modalFieldTitleLabel}>Broadcast Message Body Context</label>
                <textarea 
                  rows={4} 
                  placeholder="Type the message here to broadcast directly through backend pipelines..." 
                  value={broadcastMessage} 
                  onChange={(e) => setBroadcastMessage(e.target.value)} 
                  required 
                  style={ntStyles.modalTextAreaInput} 
                />
              </div>

              <div style={ntStyles.modalToolbarFooterActionRow}>
                <button type="submit" disabled={isSending} style={ntStyles.modalSubmitActionButton}>
                  {isSending ? 'Transmitting System Payload...' : 'Transmit Stream Trigger'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={ntStyles.modalCancelActionButton}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

const ntStyles = {
  workspaceWrapperContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box'
  },
  dashboardHeaderBlockFlexRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  toolbarBroadcastActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1E3A8A',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 20px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(30,58,138,0.15)'
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
    flex: 2.5,
    boxSizing: 'border-box'
  },
  feedContainerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px 0',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box'
  },
  tabHeaderSwitcherTrackRow: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    borderRadius: '10px',
    padding: '4px',
    gap: '4px',
    margin: '0 24px 20px 24px',
    boxSizing: 'border-box'
  },
  switchTriggerButton: {
    flex: 1,
    border: 'none',
    padding: '8px 0',
    borderRadius: '8px',
    fontSize: '11px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.1s ease'
  },
  notificationsVerticalScrollFrame: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    padding: '0 24px',
    maxHeight: '480px',
    overflowY: 'auto'
  },
  notificationItemStripBlock: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    backgroundColor: '#ffffff'
  },
  itemBadgeNodeIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  itemTextDetailsMetadataStackGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    textAlign: 'left'
  },
  itemFlexTopHeaderLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  itemPrimaryHeadingTitleText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E293B'
  },
  itemMicroTimestampLabelText: {
    fontSize: '10px',
    color: '#94A3B8',
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  itemParagraphDescriptionBodyText: {
    fontSize: '12px',
    color: '#475569',
    margin: 0,
    lineHeight: '1.45',
    fontWeight: 500
  },
  itemActionButtonsClusterRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  itemPrimaryActionButtonMarkup: {
    backgroundColor: '#1E3A8A',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  itemSecondaryDismissButtonMarkup: {
    backgroundColor: '#FFF1F2',
    color: '#E11D48',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  tableFooterPaginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px 0 24px',
    borderTop: '1px solid #F1F5F9',
    marginTop: 'auto'
  },
  tableFooterCount: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 500
  },
  paginationButtonCluster: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  paginationArrowButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px'
  },
  rightWorkspaceSidebarPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    flex: 1.1,
    minWidth: '320px',
    boxSizing: 'border-box'
  },
  criticalSidebarWidgetCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #FFE4E6',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 1px 2px rgba(225,29,72,0.01)'
  },
  widgetHeaderFlexLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%'
  },
  widgetBlockTitleErrorThemeText: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#991B1B',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  widgetVerticalContentStackList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  criticalBulletRowCardBlock: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    textAlign: 'left'
  },
  criticalCardIndicatorBulletNode: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#E11D48',
    marginTop: '6px',
    flexShrink: 0
  },
  widgetTextGroupDetailsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    textAlign: 'left'
  },
  widgetItemTitleStrongText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#1E293B'
  },
  widgetItemParagraphSupportingDescriptionText: {
    fontSize: '11px',
    color: '#64748B',
    margin: 0,
    lineHeight: '1.4',
    fontWeight: 500
  },
  tasksSidebarWidgetCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  widgetBlockTitlePrimaryThemeText: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#1E3A8A',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  taskListItemRowStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 12px',
    border: '1px solid #F1F5F9',
    borderRadius: '10px',
    backgroundColor: '#FAFCFF'
  },
  clickableHoverAssetCursor: {
    cursor: 'pointer'
  },
  loadingFrame: {
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
  modalOverlayFrame: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
    boxSizing: 'border-box'
  },
  modalContainerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    width: '100%',
    maxWidth: '640px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    boxSizing: 'border-box'
  },
  modalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #F1F5F9',
    paddingBottom: '14px',
    width: '100%'
  },
  modalHeadingTitleText: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#1E3A8A',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  modalCloseIconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px'
  },
  modalBodyFormStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%'
  },
  modalInputFieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
    textAlign: 'left'
  },
  modalFieldTitleLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  modalStandardTextInput: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#334155',
    fontWeight: 600,
    outline: 'none'
  },
  modalInlineFormFieldsSplitRow: {
    display: 'flex',
    gap: '16px',
    width: '100%'
  },
  modalDropdownNativeInput: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#334155',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer'
  },
  modalInlineFormFieldsSplitRow: {
    display: 'flex',
    gap: '16px',
    width: '100%'
  },
  modalTextAreaInput: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#334155',
    fontWeight: 600,
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit'
  },
  modalToolbarFooterActionRow: {
    display: 'flex',
    flexDirection: 'row-reverse',
    gap: '12px',
    width: '100%',
    borderTop: '1px solid #F1F5F9',
    paddingTop: '16px',
    marginTop: '4px'
  },
  modalSubmitActionButton: {
    backgroundColor: '#1E3A8A',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none'
  },
  modalCancelActionButton: {
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none'
  },
  emptyStateTextWrapper: {
    padding: '32px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '12px',
    fontWeight: 600,
    fontStyle: 'italic'
  },
  emptySidebarFallbackLabelText: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: 500,
    fontStyle: 'italic',
    lineHeight: '1.4'
  }
}