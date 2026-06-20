import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  AlertTriangle, 
  UserPlus, 
  Car, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  Megaphone,
  X
} from 'lucide-react'

export default function NotificationsScreen() {
  // Operational Dynamic States Framework
  const [activeTab, setActivePageTab] = useState('all') 
  const [notifications, setNotifications] = useState([])
  const [criticalAlerts, setCriticalAlerts] = useState([])
  const [pendingTasks, setPendingTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // Custom User Broadcast Messenger States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('ALL') 
  const [broadcastUrgency, setBroadcastUrgency] = useState('INFO') 
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const fetchNotificationsData = async () => {
      try {
        setLoading(true)

        // 💡 BACKEND TODO: 
        // 1. Fetch system log documents via HTTP GET requests:
        //    const [feedRes, criticalRes, tasksRes] = await Promise.all([
        //      axios.get('/api/v1/admin/notifications/feed'),
        //      axios.get('/api/v1/admin/notifications/critical'),
        //      axios.get('/api/v1/admin/notifications/pending-tasks')
        //    ])
        // 2. Set states: setNotifications(feedRes.data), etc.

        // Staging Mock Database Tally Records
        setNotifications([
          { id: 1, category: 'driver', type: 'registration', title: 'New driver application submitted', desc: 'Marcus Thorne submitted a commercial operator registration for a Toyota Vitz (GW-8821-25). Background check pending.', time: '2 MINS AGO', icon: <UserPlus size={16} color="#1E3A8A" />, bg: '#EFF6FF', sideBg: '#1E3A8A', hasActions: true, actionText: 'Verify Credentials' },
          { id: 2, category: 'driver', type: 'activation', title: 'Driver approved successfully', desc: 'Sarah Jenkins credentials have been fully verified. Profile is now active on the platform for live proximity dispatches.', time: '1 HOUR AGO', icon: <CheckCircle2 size={16} color="#16A34A" />, bg: '#DCFCE7', sideBg: '#16A34A', hasActions: false },
          { id: 3, category: 'rides', type: 'delay', title: 'Ride dispatch matching delay reported', desc: 'System detected a 15-minute pickup delay alert threshold breached for active Ride #78 near the South Gate zone.', time: '3 HOURS AGO', icon: <Clock size={16} color="#DC2626" />, bg: '#FEE2E2', sideBg: '#DC2626', hasActions: true, actionText: 'Inspect Live' },
          { id: 4, category: 'system', type: 'maintenance', title: 'Core system update scheduled', desc: 'A staging core engine patch update is scheduled for Sunday at 02:00 AM. Expect up to 10 minutes of temporary routing service interruption.', time: 'OCT 23, 10:00 AM', icon: <AlertTriangle size={16} color="#475569" />, bg: '#F1F5F9', sideBg: '#475569', hasActions: true, actionText: 'Acknowledge' }
        ])

        setCriticalAlerts([
          { id: 'C1', title: 'API Connection Timeout', desc: 'External address geocoding map services experiencing periodic handshake latency.' },
          { id: 'C2', title: 'Unusual Login Activity', desc: 'Multiple failed credential authentication attempts flagged on Admin Session token ID-44.' }
        ])

        setPendingTasks([
          { id: 'T1', title: 'Licence Document Audits', count: '8 drivers awaiting document clearance.' },
          { id: 'T2', title: 'Commercial Car Verification', count: '3 registered vehicles need safety vetting.' }
        ])

      } catch (error) {
        console.error("Failed initializing platform communication logs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotificationsData()
  }, [])

  // Fan-Out Message Custom Emitter Trigger Handler
  const handleDispatchBroadcast = async (e) => {
    e.preventDefault()
    if (!broadcastTitle || !broadcastMessage) return

    try {
      setIsSending(true)

      // 💡 BACKEND TODO:
      // 1. Send text string input data via HTTP POST:
      //    await axios.post('/api/v1/admin/notifications/broadcast', { title: broadcastTitle, message: broadcastMessage, target: broadcastTarget, urgency: broadcastUrgency })
      // 2. Integration layer emits through WebSockets and triggers native Firebase Topic cloud tray dispatches.

      console.log(`Fan-Out pipeline broadcast successfully dispatched to target pool: ${broadcastTarget}`)

      const newBroadcastNode = {
        id: Date.now(),
        category: 'system',
        type: 'maintenance',
        title: broadcastTitle,
        desc: broadcastMessage,
        time: 'JUST NOW',
        icon: broadcastUrgency === 'CRITICAL' ? <AlertTriangle size={16} color="#DC2626" /> : <Megaphone size={16} color="#1E3A8A" />,
        bg: broadcastUrgency === 'CRITICAL' ? '#FEE2E2' : '#EFF6FF',
        sideBg: broadcastUrgency === 'CRITICAL' ? '#DC2626' : '#1E3A8A',
        hasActions: false
      }

      setNotifications(prev => [newBroadcastNode, ...prev])
      setBroadcastTitle('')
      setBroadcastMessage('')
      setIsModalOpen(false)
    } catch (err) {
      console.error("Failed executing custom network fan-out stream message broadcast:", err)
    } finally {
      setIsSending(false)
    }
  }

  const handleActionClick = (notificationId, actionType) => {
    // 💡 BACKEND TODO: Post state modifications back to API routes (e.g. marking as read or executing action)
    console.log(`Notification action triggered [${actionType}] for entry ID: ${notificationId}`)
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

      {/* 1. TOP CARD OVERVIEW COUNTER BADGES */}
      <div style={ntStyles.metricsGrid}>
        <div style={ntStyles.statCard}>
          <div style={ntStyles.statBodyBlock}>
            <span style={ntStyles.statLabelText}>Unread Notifications</span>
            <div style={ntStyles.statNumberGroup}>
              <span style={ntStyles.statNumberText}>14</span>
              <span style={ntStyles.badgeIndicatorGreen}>+1.4</span>
            </div>
          </div>
          <div style={ntStyles.statIconBadgeBlue}><Bell size={18} color="#1E3A8A" /></div>
        </div>

        <div style={ntStyles.statCard}>
          <div style={ntStyles.statBodyBlock}>
            <span style={ntStyles.statLabelText}>System Alerts</span>
            <div style={ntStyles.statNumberGroup}>
              <span style={ntStyles.statNumberText}>3</span>
              <span style={ntStyles.badgeIndicatorRed}>3 Critical</span>
            </div>
          </div>
          <div style={ntStyles.statIconBadgeRed}><ShieldAlert size={18} color="#DC2626" /></div>
        </div>

        <div style={ntStyles.statCard}>
          <div style={ntStyles.statBodyBlock}>
            <span style={ntStyles.statLabelText}>Verification Updates</span>
            <div style={ntStyles.statNumberGroup}>
              <span style={ntStyles.statNumberText}>8</span>
              <span style={ntStyles.badgeIndicatorGreen}>+29</span>
            </div>
          </div>
          <div style={ntStyles.statIconBadgeLightBlue}><UserPlus size={18} color="#2563EB" /></div>
        </div>

        <div style={ntStyles.statCard}>
          <div style={ntStyles.statBodyBlock}>
            <span style={ntStyles.statLabelText}>Ride Notifications</span>
            <div style={ntStyles.statNumberGroup}>
              <span style={ntStyles.statNumberText}>11</span>
              <span style={ntStyles.badgeIndicatorRed}>-10%</span>
            </div>
          </div>
          <div style={ntStyles.statIconBadgeGray}><Car size={18} color="#475569" /></div>
        </div>
      </div>

      {/* ACTION COMPONENT TOOLBAR CONTROL ROW */}
      <div style={ntStyles.actionToolbarRow}>
        <button onClick={() => setIsModalOpen(true)} style={ntStyles.toolbarBroadcastActionButton}>
          <Megaphone size={14} /> Send Global Broadcast Message
        </button>
      </div>

      {/* 2. SPLIT LAYOUT CANVAS PANELS */}
      <div style={ntStyles.splitContentRowCanvas}>

        {/* LEFT COMPONENT: SYSTEM EVENT LOGGER FEED */}
        <div style={ntStyles.leftWorkspaceMainColumn}>
          <div style={ntStyles.feedContainerCard}>

            <div style={ntStyles.tabHeaderSwitcherTrackRow}>
              <button onClick={() => setActivePageTab('all')} style={{ ...ntStyles.switchTriggerButton, backgroundColor: activeTab === 'all' ? '#ffffff' : 'transparent', fontWeight: activeTab === 'all' ? 800 : 600, color: activeTab === 'all' ? '#1E3A8A' : '#64748B' }}>All Logs</button>
              <button onClick={() => setActivePageTab('system')} style={{ ...ntStyles.switchTriggerButton, backgroundColor: activeTab === 'system' ? '#ffffff' : 'transparent', fontWeight: activeTab === 'system' ? 800 : 600, color: activeTab === 'system' ? '#1E3A8A' : '#64748B' }}>System Alerts</button>
              <button onClick={() => setActivePageTab('driver')} style={{ ...ntStyles.switchTriggerButton, backgroundColor: activeTab === 'driver' ? '#ffffff' : 'transparent', fontWeight: activeTab === 'driver' ? 800 : 600, color: activeTab === 'driver' ? '#1E3A8A' : '#64748B' }}>Driver Updates</button>
              <button onClick={() => setActivePageTab('rides')} style={{ ...ntStyles.switchTriggerButton, backgroundColor: activeTab === 'rides' ? '#ffffff' : 'transparent', fontWeight: activeTab === 'rides' ? 800 : 600, color: activeTab === 'rides' ? '#1E3A8A' : '#64748B' }}>Ride Activity</button>
            </div>

            <div style={ntStyles.notificationsVerticalScrollFrame}>
              {filteredFeed.map((note) => (
                <div key={note.id} style={{ ...ntStyles.notificationItemStripBlock, borderLeft: `4px solid ${note.sideBg}` }}>
                  <div style={{ ...ntStyles.itemBadgeNodeIcon, backgroundColor: note.bg }}>{note.icon}</div>

                  <div style={ntStyles.itemTextDetailsMetadataStackGroup}>
                    <div style={ntStyles.itemFlexTopHeaderLine}>
                      <span style={ntStyles.itemPrimaryHeadingTitleText}>{note.title}</span>
                      <span style={ntStyles.itemMicroTimestampLabelText}>{note.time}</span>
                    </div>
                    <p style={ntStyles.itemParagraphDescriptionBodyText}>{note.desc}</p>

                    {note.hasActions && (
                      <div style={ntStyles.itemActionButtonsClusterRow}>
                        <button onClick={() => handleActionClick(note.id, 'investigate')} style={ntStyles.itemPrimaryActionButtonMarkup}>{note.actionText}</button>
                        <button onClick={() => handleActionClick(note.id, 'dismiss')} style={ntStyles.itemSecondaryDismissButtonMarkup}>Dismiss</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={ntStyles.tableFooterPaginationRow}>
              <div style={ntStyles.tableFooterCount}>Showing 1-10 of 142 alerts log rows</div>
              <div style={ntStyles.paginationButtonCluster}>
                <button style={ntStyles.paginationArrowButton} aria-label="Previous feed page"><ChevronLeft size={14} color="#64748B" /></button>
                <button style={ntStyles.paginationArrowButton} aria-label="Next feed page"><ChevronRight size={14} color="#64748B" /></button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT WORKSPACE SIDEBAR PANEL: ACTIONABLE OPERATIONAL HEADS-UP */}
        <div style={ntStyles.rightWorkspaceSidebarPanel}>

          {/* CRITICAL ALERTS COMPONENT WIDGET */}
          <div style={ntStyles.criticalSidebarWidgetCard}>
            <div style={ntStyles.widgetHeaderFlexLine}>
              <ShieldAlert size={14} color="#DC2626" />
              <h4 style={ntStyles.widgetBlockTitleErrorThemeText}>Critical Infrastructure Alerts</h4>
            </div>
            <div style={ntStyles.widgetVerticalContentStackList}>
              {criticalAlerts.map((crit) => (
                <div key={crit.id} style={ntStyles.criticalBulletRowCardBlock}>
                  <div style={ntStyles.criticalCardIndicatorBulletNode} />
                  <div style={ntStyles.widgetTextGroupDetailsStack}>
                    <span style={ntStyles.widgetItemTitleStrongText}>{crit.title}</span>
                    <p style={ntStyles.widgetItemParagraphSupportingDescriptionText}>{crit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PENDING OPERATOR CHECKS COMPONENT WIDGET */}
          <div style={ntStyles.tasksSidebarWidgetCard}>
            <div style={ntStyles.widgetHeaderFlexLine}>
              <ClipboardList size={14} color="#1E3A8A" />
              <h4 style={ntStyles.widgetBlockTitlePrimaryThemeText}>Pending Review Tasks</h4>
            </div>
            <div style={ntStyles.widgetVerticalContentStackList}>
              {pendingTasks.map((task) => (
                <div key={task.id} style={ntStyles.taskListItemRowStrip}>
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
                  placeholder="Type the message here to broadcast directly through WebSocket emitters..." 
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

// ── ARRANGED MASTER NOTIFICATIONS STYLE SHEET SHEET ──────────────────────────
const ntStyles = {
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
    fontSize: '22px', 
    fontWeight: 800, 
    color: '#0F172A' 
  },
  badgeIndicatorGreen: { 
    fontSize: '10px', 
    fontWeight: 700, 
    color: '#16A34A', 
    backgroundColor: '#DCFCE7', 
    padding: '2px 6px', 
    borderRadius: '4px' 
  },
  badgeIndicatorRed: { 
    fontSize: '10px', 
    fontWeight: 700, 
    color: '#DC2626', 
    backgroundColor: '#FEE2E2', 
    padding: '2px 6px', 
    borderRadius: '4px' 
  },
  statIconBadgeBlue: { 
    width: '36px', 
    height: '36px', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#DBEAFE' 
  },
  statIconBadgeRed: { 
    width: '36px', 
    height: '36px', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#FEE2E2' 
  },
  statIconBadgeLightBlue: { 
    width: '36px', 
    height: '36px', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#EFF6FF' 
  },
  statIconBadgeGray: { 
    width: '36px', 
    height: '36px', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F1F5F9' 
  },
  actionToolbarRow: { 
    display: 'flex', 
    justifyContent: 'flex-start', 
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
    outline: 'none' 
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
    backgroundColor: '#F1F5F9', 
    color: '#475569', 
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
  }
}