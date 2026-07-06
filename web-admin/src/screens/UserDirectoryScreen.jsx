import React, { useState, useEffect } from 'react'
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  AlertTriangle, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  Globe,
  Send,
  Ban,
  ShieldAlert
} from 'lucide-react'

export default function UserDirectoryScreen() {
  const [activeInspectorTab, setActiveInspectorTab] = useState('info') 
  const [searchQuery, setSearchQuery] = useState('')
  const [studentsData, setStudentsData] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. 💡 BACKEND TODO: Implement Paginated User Records & Metrics Aggregation Loaders
  useEffect(() => {
    const fetchDirectoryState = async () => {
      try {
        setLoading(true)
        // const [metricsRes, directoryRes] = await Promise.all([
        //   axios.get('/api/v1/admin/users/metrics-summary'),
        //   axios.get(`/api/v1/admin/users?query=${searchQuery}`)
        // ])

        setMetrics([
          { id: 1, label: 'Total Accounts', value: '5,420', change: '↑ +12% from last month', icon: Users, color: '#1E3A8A', bg: '#DBEAFE', trendColor: '#15803D' },
          { id: 2, label: 'Active Today', value: '1,890', change: '● Live Activity', icon: UserCheck, color: '#1E3A8A', bg: '#DCFCE7', trendColor: '#15803D' },
          { id: 3, label: 'New Registrations', value: '45', change: 'Past 24 hours', icon: UserPlus, color: '#1E3A8A', bg: '#EFF6FF', trendColor: '#64748B' },
          { id: 4, label: 'Flagged Accounts', value: '12', change: 'Requires Attention', icon: AlertTriangle, color: '#991B1B', bg: '#FEE2E2', trendColor: '#991B1B' }
        ])

        const stagingMockDirectory = [
          { 
            id: '#CR-2823-8842', userType: 'STUDENT', name: 'Alex Johnson', email: 'alex.j@st.ug.edu.gh', regDate: 'Sept 12, 2025', rideCount: 42, status: 'ACTIVE', phone: '+233 24 556 7891', residence: 'Jean Nelson Aka Hall', rideStatus: 'In Transit', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
            tripsHistory: [{ id: 'RIDE-78', date: 'June 15', route: 'Pent Hall → Main Gate', driver: 'E. Boateng', state: 'COMPLETED' }, { id: 'RIDE-62', date: 'June 12', route: 'Balme Library → Night Market', driver: 'K. Mensah', state: 'COMPLETED' }, { id: 'RIDE-41', date: 'June 10', route: 'Main Gate → Volta Hall', driver: 'S. Addo', state: 'CANCELED' }],
            feedbackHistory: [{ rating: 5, comment: 'Very polite driver, clean car.', date: 'June 15' }, { rating: 2, comment: 'Driver took a long route to bypass traffic.', date: 'June 12' }],
            reportsHistory: [{ type: 'Late for Pickup', reporter: 'Driver K. Mensah', date: 'June 12', details: 'Rider kept vehicle waiting at Balme Library loading zone for over 8 minutes.' }]
          },
          { 
            id: '#CR-GUEST-0931', userType: 'GUEST', name: 'Michael Thompson', email: 'm.thompson92@gmail.com', regDate: 'Sep 05, 2025', rideCount: 14, status: 'ACTIVE', phone: '+233 50 441 0293', residence: 'External • Off-Campus Visitor', rideStatus: 'Offline', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
            tripsHistory: [{ id: 'RIDE-69', date: 'June 14', route: 'Main Gate → Night Market', driver: 'S. Addo', state: 'COMPLETED' }],
            feedbackHistory: [{ rating: 4, comment: 'Good dynamic drive around campus.', date: 'June 14' }],
            reportsHistory: []
          },
          {
            id: '#CR-2823-4412', userType: 'STUDENT', name: 'David Chen', email: 'd.chen@st.ug.edu.gh', regDate: 'Oct 15, 2025', rideCount: 2, status: 'FLAGGED', phone: '+233 27 987 6543', residence: 'Limann Hall', rideStatus: 'Offline', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
            tripsHistory: [{ id: 'RIDE-12', date: 'April 02', route: 'Limann Hall → Main Gate', driver: 'E. Boateng', state: 'CANCELED' }],
            feedbackHistory: [{ rating: 1, comment: 'Driver canceled without calling.', date: 'April 02' }],
            reportsHistory: [{ type: 'Cash Fare Dispute', reporter: 'Driver E. Boateng', date: 'April 02', details: 'Rider refused to pay full standard fare surcharge upon arrival at Limann Hall gateway segment.' }, { type: 'Abusive Language', reporter: 'Driver S. Addo', date: 'March 24', details: 'Argument over vehicle pickup location marker choice.' }]
          }
        ]

        setStudentsData(stagingMockDirectory)
        setSelectedStudent(stagingMockDirectory[0])
      } catch (err) {
        console.error("Critical core error loading user directory payload lines:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDirectoryState()
  }, [searchQuery])

  // 2. 💡 BACKEND TODO: Connect Direct Action Mutators to REST Router Targets
  const handleAccountAction = async (targetId, actionProtocol) => {
    try {
      // await axios.patch(`/api/v1/admin/users/${targetId}/status`, { action: actionProtocol })
      console.log(`Dispatched enforcement rule [${actionProtocol.toUpperCase()}] targeting ID: ${targetId}`)

      setStudentsData(prev => prev.map(user => {
        if (user.id === targetId) {
          return { ...user, status: actionProtocol === 'suspend' ? 'FLAGGED' : user.status }
        }
        return user
      }))
    } catch (err) {
      console.error("Enforcement state tracking error:", err)
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ACTIVE': return { backgroundColor: '#DCFCE7', color: '#15803D' }
      case 'INACTIVE': return { backgroundColor: '#E2E8F0', color: '#475569' }
      case 'FLAGGED': return { backgroundColor: '#FEE2E2', color: '#991B1B' }
      default: return { backgroundColor: '#F1F5F9', color: '#64748B' }
    }
  }

  if (loading) {
    return (
      <div style={smStyles.loadingWrapperContainerFrame}>
        <span style={smStyles.loadingText}>Hydrating Platform Directories...</span>
      </div>
    )
  }

  return (
    <div style={smStyles.workspaceWrapperContainer}>

      {/* 1. UPPER OVERVIEW METRICS GRID */}
      <div style={smStyles.metricsGrid}>
        {metrics.map((card) => {
          const IconComponent = card.icon
          return (
            <div key={card.id} style={smStyles.statCard}>
              <div style={smStyles.statBodyBlock}>
                <span style={smStyles.statLabelText}>{card.label}</span>
                <div style={smStyles.statNumberGroup}>
                  <span style={smStyles.statNumberText}>{card.value}</span>
                  <span style={{ ...smStyles.statTrendText, color: card.trendColor }}>{card.change}</span>
                </div>
              </div>
              <div style={{ ...smStyles.statIconBadge, backgroundColor: card.bg }}>
                <IconComponent size={18} color={card.color} />
              </div>
            </div>
          )
        })}
      </div>

      {/* 2. MIDDLE ROW CANVAS: SPLIT TABLE & HISTORICAL INSPECTOR */}
      <div style={smStyles.splitContentRowCanvas}>

        {/* LEFT CANVAS COMPONENT: USER DIRECTORY TABLE */}
        <div style={smStyles.leftWorkspaceMainColumn}>
          <div style={smStyles.tableContainerCard}>
            <div style={smStyles.tableHeaderSegmentRow}>
              <h3 style={smStyles.panelTitleText}>User Directory</h3>
              <div style={smStyles.tableHeaderToolbarActionCluster}>
                <div style={smStyles.tableCardInlineSearchBar}>
                  <Search size={14} color="#94A3B8" />
                  <input 
                    type="text" 
                    placeholder="Search name, email, identifier ID..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    style={smStyles.tableCardSearchInputField} 
                  />
                </div>
              </div>
            </div>

            <div style={smStyles.tableScrollFrameworkWrapper}>
              <table style={smStyles.tableStructureMarkup}>
                <thead>
                  <tr>
                    <th style={{ ...smStyles.th, textAlign: 'left', paddingLeft: '24px' }}>NAME / CONTACT DETAILS</th>
                    <th style={{ ...smStyles.th, textAlign: 'left' }}>ACCOUNT ROLE</th>
                    <th style={{ ...smStyles.th, textAlign: 'left' }}>IDENTIFIER ID</th>
                    <th style={{ ...smStyles.th, textAlign: 'left' }}>RIDE ACTIVITY</th>
                    <th style={{ ...smStyles.th, textAlign: 'center' }}>STATUS</th>
                    <th style={{ ...smStyles.th, textAlign: 'right', paddingRight: '24px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsData.map((user) => {
                    const isSelected = selectedStudent && selectedStudent.id === user.id
                    return (
                      <tr 
                        key={user.id} 
                        style={{ 
                          ...smStyles.tableDataRowMarkup, 
                          backgroundColor: isSelected ? '#F8FAFC' : 'transparent', 
                          borderLeft: isSelected ? '4px solid #1E3A8A' : '4px solid transparent' 
                        }} 
                        onClick={() => { setSelectedStudent(user); setActiveInspectorTab('info'); }}
                      >
                        <td style={{ ...smStyles.tdNameCellMarkup, paddingLeft: isSelected ? '20px' : '24px' }}>
                          <div style={smStyles.avatarContainerNodeRelative}>
                            <img src={user.image} alt={user.name} style={smStyles.tableRowAvatarImage} />
                            {user.rideStatus === 'In Transit' && <div style={smStyles.tableRowOnlineStatusDotBadgeNode} />}
                          </div>
                          <div style={smStyles.tableNameTextStackGroup}>
                            <span style={smStyles.studentProfilePrimaryNameText}>{user.name}</span>
                            <span style={smStyles.studentProfileSecondaryEmailText}>{user.email}</span>
                          </div>
                        </td>
                        <td style={smStyles.tdStandardDataText}>
                          {user.userType === 'STUDENT' ? (
                            <span style={smStyles.roleStudentBadge}><GraduationCap size={12} /> Student</span>
                          ) : (
                            <span style={smStyles.roleGuestBadge}><Globe size={12} /> Guest</span>
                          )}
                        </td>
                        <td style={smStyles.tdStandardDataText}><span style={smStyles.monospaceIdentifierFont}>{user.id}</span></td>
                        <td style={smStyles.tdStandardDataText}>
                          <div style={smStyles.rideActivityStatusBarFlexBlock}>
                            <div style={smStyles.progressBarTrackBaseLine}>
                              <div style={{ ...smStyles.progressBarFilledTrackLine, width: `${Math.min(user.rideCount * 2.5, 100)}%` }} />
                            </div>
                            <span style={smStyles.rideVolumeTextCounterLabel}>{user.rideCount} rides</span>
                          </div>
                        </td>
                        <td style={{ ...smStyles.tdStandardDataText, textAlign: 'center' }}>
                          <span style={{ ...smStyles.statusBadgeIndicatorPill, ...getStatusStyle(user.status) }}>{user.status}</span>
                        </td>
                        <td style={{ ...smStyles.tdStandardDataText, textAlign: 'right', paddingRight: '24px' }}>
                          <span style={smStyles.tableInteractiveInlineActionTextBtn}>Inspect</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={smStyles.tableFooterPaginationRow}>
              <div style={smStyles.tableFooterCount}>Showing {studentsData.length} of 5,420 profiles</div>
              <div style={smStyles.paginationButtonCluster}>
                <button style={smStyles.paginationArrowButton} aria-label="Previous page"><ChevronLeft size={14} strokeWidth={2.5} color="#64748B" /></button>
                <button style={smStyles.paginationArrowButton} aria-label="Next page"><ChevronRight size={14} strokeWidth={2.5} color="#64748B" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CANVAS COMPONENT: THE HISTORY INSPECTOR SIDEBAR */}
        <div style={smStyles.rightWorkspaceReviewInspectorSidebarPanel}>
          {selectedStudent ? (
            <div style={smStyles.inspectorSidebarInternalContentFlexContainer}>

              {/* Profile Card Header Summary */}
              <div style={smStyles.inspectorHeaderProfileSummaryBlock}>
                <img src={selectedStudent.image} alt={selectedStudent.name} style={smStyles.inspectorProfileAvatarMainImage} />
                <h2 style={smStyles.inspectorProfilePrimaryTitleText}>{selectedStudent.name}</h2>
                <p style={smStyles.inspectorProfileSecondarySubtitleText}>{selectedStudent.id}</p>
              </div>

              {/* Sub-Tab Selector Navigation Track Row */}
              <div style={smStyles.historyTabTrackRow}>
                <button onClick={() => setActiveInspectorTab('info')} style={{ ...smStyles.historyTabBtn, borderBottom: activeInspectorTab === 'info' ? '2px solid #1E3A8A' : 'none', color: activeInspectorTab === 'info' ? '#1E3A8A' : '#64748B', fontWeight: activeInspectorTab === 'info' ? 800 : 600 }}>Info</button>
                <button onClick={() => setActiveInspectorTab('trips')} style={{ ...smStyles.historyTabBtn, borderBottom: activeInspectorTab === 'trips' ? '2px solid #1E3A8A' : 'none', color: activeInspectorTab === 'trips' ? '#1E3A8A' : '#64748B', fontWeight: activeInspectorTab === 'trips' ? 800 : 600 }}>Rides</button>
                <button onClick={() => setActiveInspectorTab('feedback')} style={{ ...smStyles.historyTabBtn, borderBottom: activeInspectorTab === 'feedback' ? '2px solid #1E3A8A' : 'none', color: activeInspectorTab === 'feedback' ? '#1E3A8A' : '#64748B', fontWeight: activeInspectorTab === 'feedback' ? 800 : 600 }}>Reviews</button>
                <button onClick={() => setActiveInspectorTab('reports')} style={{ ...smStyles.historyTabBtn, borderBottom: activeInspectorTab === 'reports' ? '2px solid #1E3A8A' : 'none', color: activeInspectorTab === 'reports' ? '#991B1B' : '#64748B', fontWeight: activeInspectorTab === 'reports' ? 800 : 600 }}>Reports</button>
              </div>

              {/* Content Viewport Stacks */}
              <div style={smStyles.historyScrollContainerViewport}>

                {activeInspectorTab === 'info' && (
                  <div style={smStyles.tabContentBlock}>
                    <h4 style={smStyles.inspectorSegmentGroupHeadingTitleText}>CONTACT DETAILS</h4>
                    <div style={smStyles.inspectorMetaContentBlockCard}>
                      <div style={smStyles.inspectorMetaCardRowField}><Mail size={14} color="#94A3B8" /><span style={smStyles.inspectorMetaCardRowValueText}>{selectedStudent.email}</span></div>
                      <div style={smStyles.inspectorMetaCardRowField}><Phone size={14} color="#94A3B8" /><span style={smStyles.inspectorMetaCardRowValueText}>{selectedStudent.phone}</span></div>
                      <div style={smStyles.inspectorMetaCardRowField}><MapPin size={14} color="#94A3B8" /><span style={smStyles.inspectorMetaCardRowValueText}>{selectedStudent.residence}</span></div>
                    </div>
                  </div>
                )}

                {activeInspectorTab === 'trips' && (
                  <div style={smStyles.tabContentBlock}>
                    <h4 style={smStyles.inspectorSegmentGroupHeadingTitleText}>RIDE HISTORY LEDGER</h4>
                    {selectedStudent.tripsHistory?.map((trip, i) => (
                      <div key={i} style={smStyles.historyItemCard}>
                        <div style={smStyles.historyCardHeader}><span style={smStyles.boldBlueTripIdentifier}>{trip.id}</span><span>{trip.date}</span></div>
                        <p style={smStyles.historyCardText}><MapPin size={10} /> {trip.route}</p>
                        <div style={smStyles.historyCardHeader}><span>Driver: {trip.driver}</span><span style={{ ...smStyles.boldTripStateStatus, color: trip.state === 'CANCELED' ? '#991B1B' : '#15803D' }}>{trip.state}</span></div>
                      </div>
                    ))}
                  </div>
                )}

                {activeInspectorTab === 'feedback' && (
                  <div style={smStyles.tabContentBlock}>
                    <h4 style={smStyles.inspectorSegmentGroupHeadingTitleText}>RIDER REVIEWS MATRIX</h4>
                    {selectedStudent.feedbackHistory?.map((fb, i) => (
                      <div key={i} style={smStyles.historyItemCard}>
                        <div style={smStyles.historyCardHeader}><span style={smStyles.starRatingInlineColorRow}>{Array(fb.rating).fill('★').join('')}</span><span>{fb.date}</span></div>
                        <p style={smStyles.historyCardItalicCommentText}>"{fb.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeInspectorTab === 'reports' && (
                  <div style={smStyles.tabContentBlock}>
                    <h4 style={smStyles.inspectorSegmentGroupHeadingTitleText}>DRIVER-SUBMITTED SYSTEM INCIDENTS</h4>
                    {selectedStudent.reportsHistory && selectedStudent.reportsHistory.length > 0 ? (
                      selectedStudent.reportsHistory.map((rep, i) => (
                        <div key={i} style={smStyles.incidentReportRowBlockCard}>
                          <div style={smStyles.historyCardHeader}>
                            <span style={smStyles.reportIncidentTitleBadge}><ShieldAlert size={12} style={{ marginRight: '4px' }} /> {rep.type}</span>
                            <span style={smStyles.microTimestampFont}>{rep.date}</span>
                          </div>
                          <p style={smStyles.incidentLogBodyTextDescription}>{rep.details}</p>
                          <span style={smStyles.incidentFilerAuthorLabel}>Filed via: {rep.reporter}</span>
                        </div>
                      ))
                    ) : (
                      <p style={smStyles.emptyFallbackItalicMessageText}>Clean Record. No behavior infractions or incident files generated against this rider account.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Administrative Security Control Block */}
              <div style={smStyles.inspectorSidebarFooterActionToolbarButtonCluster}>
                <button style={smStyles.inspectorSidebarMessageActionButton} onClick={() => handleAccountAction(selectedStudent.id, 'warn')}><Send size={14} /> Send Warning Notice</button>
                <button style={smStyles.inspectorSidebarSuspendAccountActionButton} onClick={() => handleAccountAction(selectedStudent.id, 'suspend')}><Ban size={14} /> Suspend Rider Access</button>
              </div>
            </div>
          ) : (
            <div style={smStyles.inspectorSidebarEmptyStateContainerFallbackBox}>
              <h4 style={smStyles.emptyFallbackItalicMessageText}>Select an active directory profile entry to load structural logs blueprint summaries.</h4>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── DOUBLE-SPACE INDENTED STYLESHEET MATRIX ──────────────────────────────────
const smStyles = {
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
  tableContainerCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px 0', 
    width: '100%', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.01)', 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100%' 
  },
  tableHeaderSegmentRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '0 24px 20px 24px', 
    borderBottom: '1px solid #F1F5F9' 
  },
  panelTitleText: { 
    fontSize: '15px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    margin: 0, 
    textTransform: 'capitalize', 
    letterSpacing: '0.3px' 
  },
  tableHeaderToolbarActionCluster: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px' 
  },
  tableCardInlineSearchBar: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    backgroundColor: '#F8FAFC', 
    border: '1px solid #E2E8F0', 
    borderRadius: '10px', 
    padding: '6px 12px', 
    width: '240px' 
  },
  tableCardSearchInputField: { 
    background: 'transparent', 
    border: 'none', 
    outline: 'none', 
    fontSize: '12px', 
    color: '#334155', 
    width: '100%' 
  },
  tableScrollFrameworkWrapper: { 
    width: '100%', 
    overflowX: 'auto' 
  },
  tableStructureMarkup: { 
    width: '100%', 
    borderCollapse: 'collapse' 
  },
  th: { 
    padding: '14px 12px', 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#94A3B8', 
    borderBottom: '1px solid #F1F5F9', 
    letterSpacing: '0.5px', 
    textTransform: 'uppercase' 
  },
  tableDataRowMarkup: { 
    borderBottom: '1px solid #F1F5F9', 
    cursor: 'pointer', 
    transition: 'background-color 0.1s ease' 
  },
  avatarContainerNodeRelative: { 
    position: 'relative', 
    display: 'inline-block' 
  },
  tdNameCellMarkup: { 
    padding: '14px 12px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '14px' 
  },
  tableRowAvatarImage: { 
    width: '34px', 
    height: '34px', 
    borderRadius: '50%', 
    objectFit: 'cover', 
    border: '1px solid #E2E8F0' 
  },
  tableRowOnlineStatusDotBadgeNode: { 
    position: 'absolute', 
    bottom: '-1px', 
    right: '-1px', 
    width: '9px', 
    height: '9px', 
    borderRadius: '50%', 
    backgroundColor: '#22C55E', 
    border: '1.5px solid #ffffff' 
  },
  tableNameTextStackGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '2px', 
    textAlign: 'left' 
  },
  studentProfilePrimaryNameText: { 
    fontSize: '13px', 
    fontWeight: 700, 
    color: '#1E293B' 
  },
  studentProfileSecondaryEmailText: { 
    fontSize: '11px', 
    color: '#64748B', 
    fontWeight: 500 
  },
  tdStandardDataText: { 
    padding: '14px 12px', 
    fontSize: '13px', 
    color: '#475569', 
    textAlign: 'left', 
    verticalAlign: 'middle' 
  },
  monospaceIdentifierFont: { 
    fontFamily: 'monospace', 
    fontWeight: '500' 
  },
  roleStudentBadge: { 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#1E3A8A', 
    backgroundColor: '#EFF6FF', 
    padding: '4px 8px', 
    borderRadius: '6px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '4px', 
    width: 'fit-content' 
  },
  roleGuestBadge: { 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#D97706', 
    backgroundColor: '#FFFBEB', 
    padding: '4px 8px', 
    borderRadius: '6px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '4px', 
    width: 'fit-content' 
  },
  rideActivityStatusBarFlexBlock: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    width: '120px' 
  },
  progressBarTrackBaseLine: { 
    flex: 1, 
    height: '6px', 
    backgroundColor: '#E2E8F0', 
    borderRadius: '10px', 
    overflow: 'hidden' 
  },
  progressBarFilledTrackLine: { 
    height: '100%', 
    backgroundColor: '#1E3A8A', 
    borderRadius: '10px' 
  },
  rideVolumeTextCounterLabel: { 
    fontSize: '11px', 
    fontWeight: 600, 
    color: '#64748B', 
    whiteSpace: 'nowrap' 
  },
  statusBadgeIndicatorPill: { 
    fontSize: '10px', 
    fontWeight: 700, 
    padding: '4px 10px', 
    borderRadius: '50px', 
    letterSpacing: '0.2px', 
    display: 'inline-block' 
  },
  tableInteractiveInlineActionTextBtn: { 
    fontSize: '12px', 
    fontWeight: 700, 
    color: '#2563EB', 
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
    padding: '4px', 
    outline: 'none' 
  },
  rightWorkspaceReviewInspectorSidebarPanel: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    flex: 1.2, 
    display: 'flex', 
    flexDirection: 'column', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.01)', 
    minWidth: '340px', 
    boxSizing: 'border-box' 
  },
  inspectorSidebarInternalContentFlexContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100%', 
    width: '100%' 
  },
  inspectorHeaderProfileSummaryBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    textAlign: 'center', 
    marginBottom: '16px' 
  },
  inspectorProfileAvatarMainImage: { 
    width: '64px', 
    height: '64px', 
    borderRadius: '50%', 
    objectFit: 'cover', 
    border: '2px solid #E2E8F0', 
    marginBottom: '10px' 
  },
  inspectorProfilePrimaryTitleText: { 
    fontSize: '16px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    margin: 0 
  },
  inspectorProfileSecondarySubtitleText: { 
    fontSize: '12px', 
    color: '#64748B', 
    fontFamily: 'monospace', 
    margin: '2px 0 0 0' 
  },
  historyTabTrackRow: { 
    display: 'flex', 
    borderBottom: '1px solid #E2E8F0', 
    paddingBottom: '2px', 
    gap: '12px', 
    marginBottom: '16px', 
    width: '100%', 
    justifyContent: 'space-between' 
  },
  historyTabBtn: { 
    background: 'none', 
    border: 'none', 
    padding: '6px 0', 
    fontSize: '12px', 
    cursor: 'pointer', 
    outline: 'none' 
  },
  historyScrollContainerViewport: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '14px', 
    flex: 1, 
    overflowY: 'auto', 
    paddingRight: '4px' 
  },
  tabContentBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px', 
    textAlign: 'left' 
  },
  inspectorSegmentGroupHeadingTitleText: { 
    fontSize: '10px', 
    fontWeight: 800, 
    color: '#94A3B8', 
    letterSpacing: '0.5px', 
    margin: 0 
  },
  inspectorMetaContentBlockCard: { 
    border: '1px solid #F1F5F9', 
    borderRadius: '12px', 
    padding: '16px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '14px', 
    backgroundColor: '#FAFCFF' 
  },
  inspectorMetaCardRowField: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px' 
  },
  inspectorMetaCardRowValueText: { 
    fontSize: '12px', 
    color: '#334155', 
    fontWeight: 600 
  },
  historyItemCard: { 
    padding: '12px', 
    border: '1px solid #E2E8F0', 
    borderRadius: '12px', 
    backgroundColor: '#FAFCFF', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px' 
  },
  historyCardHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    fontSize: '11px', 
    color: '#475569' 
  },
  boldBlueTripIdentifier: { 
    fontWeight: 800, 
    color: '#1E3A8A' 
  },
  boldTripStateStatus: { 
    fontWeight: 700 
  },
  historyCardText: { 
    fontSize: '12px', 
    fontWeight: 600, 
    color: '#1E293B', 
    margin: 0, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '4px' 
  },
  starRatingInlineColorRow: { 
    display: 'flex', 
    color: '#CA8A04' 
  },
  historyCardItalicCommentText: { 
    fontSize: '12px', 
    fontWeight: 600, 
    color: '#1E293B', 
    margin: 0, 
    fontStyle: 'italic' 
  },
  incidentReportRowBlockCard: { 
    padding: '12px', 
    border: '1px solid #FEE2E2', 
    borderRadius: '12px', 
    backgroundColor: '#FFF5F5', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px' 
  },
  reportIncidentTitleBadge: { 
    color: '#991B1B', 
    fontWeight: 700, 
    display: 'flex', 
    alignItems: 'center' 
  },
  microTimestampFont: { 
    fontSize: '11px' 
  },
  incidentLogBodyTextDescription: { 
    margin: 0, 
    fontSize: '12px', 
    color: '#475569', 
    lineHeight: '1.4', 
    fontWeight: 500 
  },
  incidentFilerAuthorLabel: { 
    fontSize: '10px', 
    color: '#94A3B8', 
    textTransform: 'uppercase', 
    letterSpacing: '0.3px', 
    fontWeight: 700 
  },
  emptySidebarFallbackContainerBox: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100%', 
    width: '100%' 
  },
  emptyFallbackItalicMessageText: { 
    fontSize: '12px', 
    color: '#64748B', 
    fontWeight: 500, 
    fontStyle: 'italic', 
    lineHeight: '1.5', 
    textAlign: 'center' 
  },
  inspectorSidebarFooterActionToolbarButtonCluster: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px', 
    marginTop: 'auto', 
    paddingTop: '16px' 
  },
  inspectorSidebarMessageActionButton: { 
    width: '100%', 
    backgroundColor: '#F1F5F9', 
    border: 'none', 
    borderRadius: '12px', 
    color: '#475569', 
    fontSize: '13px', 
    fontWeight: 700, 
    padding: '12px 0', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    outline: 'none' 
  },
  inspectorSidebarSuspendAccountActionButton: { 
    width: '100%', 
    backgroundColor: '#FFF1F2', 
    border: 'none', 
    borderRadius: '12px', 
    color: '#E11D48', 
    fontSize: '13px', 
    fontWeight: 700, 
    padding: '12px 0', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    outline: 'none' 
  },
  loadingWrapperContainerFrame: { 
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
  }
}