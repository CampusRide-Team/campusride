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
  ShieldAlert,
  Car
} from 'lucide-react'
import api from '../api/axios'

export default function UserDirectoryScreen() {
  const [activeInspectorTab, setActiveInspectorTab] = useState('info') 
  const [searchQuery, setSearchQuery] = useState('')
  const [studentsData, setStudentsData] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDirectoryState = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const response = await api.get(`/admin/users?query=${searchQuery}`)
      if (response.data?.success && response.data?.data) {
        const { metrics: rawMetrics, studentsData: rawUsers } = response.data.data
        
        const iconMapping = {
          users: Users,
          userCheck: UserCheck,
          userPlus: UserPlus,
          alertTriangle: AlertTriangle
        }

        setMetrics(rawMetrics.map(item => ({
          ...item,
          icon: iconMapping[item.icon] || Users
        })))

        setStudentsData(rawUsers)

        if (rawUsers.length > 0) {
          const stillExists = rawUsers.find(u => u.id === selectedStudent?.id)
          setSelectedStudent(stillExists || rawUsers[0])
        } else {
          setSelectedStudent(null)
        }
      }
    } catch (err) {
      console.error("Critical error loading directory metrics:", err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDirectoryState(true)
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleAccountAction = async (targetId, actionProtocol) => {
  try {
    let customPayload = { action: actionProtocol };

    if (actionProtocol === 'warn') {
      const warningMsg = window.prompt(
        'Enter custom warning message to send to user:',
        'Please review platform terms regarding account usage.'
      );
      if (!warningMsg) return; // User cancelled prompt
      customPayload.message = warningMsg;
    }

    if (actionProtocol === 'suspend') {
      const isCurrentlyFlagged = selectedStudent?.status === 'FLAGGED';
      const confirmAction = window.confirm(
        isCurrentlyFlagged
          ? 'Are you sure you want to reactivate access for this user?'
          : 'Are you sure you want to suspend this user account?'
      );
      if (!confirmAction) return;
    }

    const res = await api.patch(`/admin/users/${targetId}/status`, customPayload);

    if (res.data?.success) {
      // Instantly update selected user in local state for fast UI response
      if (actionProtocol === 'suspend') {
        const nextStatus = selectedStudent.status === 'FLAGGED' ? 'ACTIVE' : 'FLAGGED';
        setSelectedStudent(prev => prev ? { ...prev, status: nextStatus } : null);
      }
      
      alert(res.data.message || `Action [${actionProtocol.toUpperCase()}] executed successfully.`);
      fetchDirectoryState(false);
    }
  } catch (err) {
    console.error("Account action error:", err);
    alert(err.response?.data?.error?.message || "Failed to execute account action.");
  }
};

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ACTIVE': return { backgroundColor: '#DCFCE7', color: '#15803D' };
      case 'PENDING': return { backgroundColor: '#FEF9C3', color: '#854D0E' };
      case 'REJECTED': return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      case 'FLAGGED': return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      default: return { backgroundColor: '#F1F5F9', color: '#64748B' };
    }
  }

  const formatShortId = (idStr) => {
    if (!idStr) return 'N/A';
    return idStr.length > 6 ? idStr.substring(idStr.length - 6) : idStr;
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
            
            {/* TABLE HEADER - TITLE ON LEFT, SEARCH BAR SHIFTED FAR RIGHT */}
            <div style={smStyles.tableHeaderSegmentRow}>
              <h3 style={smStyles.panelTitleText}>User Directory</h3>
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

            <div style={smStyles.tableScrollFrameworkWrapper}>
              {studentsData.length > 0 ? (
                <table style={smStyles.tableStructureMarkup}>
                  <thead>
                    <tr>
                      <th style={{ ...smStyles.th, textAlign: 'left', paddingLeft: '20px' }}>NAME / CONTACT DETAILS</th>
                      <th style={{ ...smStyles.th, textAlign: 'left' }}>ROLE</th>
                      <th style={{ ...smStyles.th, textAlign: 'left' }}>IDENTIFIER</th>
                      <th style={{ ...smStyles.th, textAlign: 'left' }}>ACTIVITY</th>
                      <th style={{ ...smStyles.th, textAlign: 'center' }}>STATUS</th>
                      <th style={{ ...smStyles.th, textAlign: 'right', paddingRight: '20px' }}>ACTION</th>
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
                          <td style={{ ...smStyles.tdNameCellMarkup, paddingLeft: isSelected ? '16px' : '20px' }}>
                            <div style={smStyles.avatarContainerNodeRelative}>
                              {user.image ? (
                                <img src={user.image} alt={user.name} style={smStyles.tableRowAvatarImage} />
                              ) : (
                                <div style={smStyles.tableRowAvatarMock}>{user.initials || user.name.slice(0, 2).toUpperCase()}</div>
                              )}
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
                            ) : user.userType === 'DRIVER' ? (
                              <span style={{ ...smStyles.roleStudentBadge, backgroundColor: '#DCFCE7', color: '#15803D' }}><Car size={12} /> Driver</span>
                            ) : (
                              <span style={smStyles.roleGuestBadge}><Globe size={12} /> Guest</span>
                            )}
                          </td>
                          <td style={smStyles.tdStandardDataText}>
                            <span style={smStyles.monospaceIdentifierFont}>#{formatShortId(user.id)}</span>
                          </td>
                          <td style={smStyles.tdStandardDataText}>
                            <div style={smStyles.rideActivityStatusBarFlexBlock}>
                              <div style={smStyles.progressBarTrackBaseLine}>
                                <div style={{ ...smStyles.progressBarFilledTrackLine, width: `${Math.min((user.rideCount || 0) * 2.5, 100)}%` }} />
                              </div>
                              <span style={smStyles.rideVolumeTextCounterLabel}>{user.rideCount || 0} runs</span>
                            </div>
                          </td>
                          <td style={{ ...smStyles.tdStandardDataText, textAlign: 'center' }}>
                            <span style={{ ...smStyles.statusBadgeIndicatorPill, ...getStatusStyle(user.status) }}>{user.status}</span>
                          </td>
                          <td style={{ ...smStyles.tdStandardDataText, textAlign: 'right', paddingRight: '20px' }}>
                            <span style={smStyles.tableInteractiveInlineActionTextBtn}>Inspect</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={smStyles.emptyFallbackTextWrapper}>No matching profiles found in platform database registry records.</div>
              )}
            </div>

            <div style={smStyles.tableFooterPaginationRow}>
              <div style={smStyles.tableFooterCount}>Showing {studentsData.length} profiles</div>
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
                {selectedStudent.image ? (
                  <img src={selectedStudent.image} alt={selectedStudent.name} style={smStyles.inspectorProfileAvatarMainImage} />
                ) : (
                  <div style={smStyles.inspectorProfileAvatarMock}>{selectedStudent.name.slice(0, 2).toUpperCase()}</div>
                )}
                <h2 style={smStyles.inspectorProfilePrimaryTitleText}>{selectedStudent.name}</h2>
                <p style={smStyles.inspectorProfileSecondarySubtitleText}>ID: #{formatShortId(selectedStudent.id)}</p>
              </div>

              {/* Sub-Tab Selector Navigation Track Row */}
              <div style={smStyles.historyTabTrackRow}>
                <button onClick={() => setActiveInspectorTab('info')} style={{ ...smStyles.historyTabBtn, borderBottom: activeInspectorTab === 'info' ? '2px solid #1E3A8A' : '2px solid transparent', color: activeInspectorTab === 'info' ? '#1E3A8A' : '#64748B', fontWeight: activeInspectorTab === 'info' ? 800 : 600 }}>Info</button>
                <button onClick={() => setActiveInspectorTab('trips')} style={{ ...smStyles.historyTabBtn, borderBottom: activeInspectorTab === 'trips' ? '2px solid #1E3A8A' : '2px solid transparent', color: activeInspectorTab === 'trips' ? '#1E3A8A' : '#64748B', fontWeight: activeInspectorTab === 'trips' ? 800 : 600 }}>Rides</button>
                <button onClick={() => setActiveInspectorTab('feedback')} style={{ ...smStyles.historyTabBtn, borderBottom: activeInspectorTab === 'feedback' ? '2px solid #1E3A8A' : '2px solid transparent', color: activeInspectorTab === 'feedback' ? '#1E3A8A' : '#64748B', fontWeight: activeInspectorTab === 'feedback' ? 800 : 600 }}>Reviews</button>
                <button onClick={() => setActiveInspectorTab('reports')} style={{ ...smStyles.historyTabBtn, borderBottom: activeInspectorTab === 'reports' ? '2px solid #1E3A8A' : '2px solid transparent', color: activeInspectorTab === 'reports' ? '#991B1B' : '#64748B', fontWeight: activeInspectorTab === 'reports' ? 800 : 600 }}>Reports</button>
              </div>

              {/* Content Viewport Stacks */}
              <div style={smStyles.historyScrollContainerViewport}>

                {activeInspectorTab === 'info' && (
                  <div style={smStyles.tabContentBlock}>
                    <h4 style={smStyles.inspectorSegmentGroupHeadingTitleText}>{selectedStudent.userType === 'DRIVER' ? 'VEHICLE ACCESS INFO' : 'CONTACT DETAILS'}</h4>
                    <div style={smStyles.inspectorMetaContentBlockCard}>
                      <div style={smStyles.inspectorMetaCardRowField}><Mail size={14} color="#94A3B8" style={{ flexShrink: 0 }} /><span style={smStyles.inspectorMetaCardRowValueText}>{selectedStudent.email}</span></div>
                      <div style={smStyles.inspectorMetaCardRowField}><Phone size={14} color="#94A3B8" style={{ flexShrink: 0 }} /><span style={smStyles.inspectorMetaCardRowValueText}>{selectedStudent.phone}</span></div>
                      <div style={smStyles.inspectorMetaCardRowField}><MapPin size={14} color="#94A3B8" style={{ flexShrink: 0 }} /><span style={smStyles.inspectorMetaCardRowValueText}>{selectedStudent.residence}</span></div>
                    </div>
                  </div>
                )}

                {activeInspectorTab === 'trips' && (
                  <div style={smStyles.tabContentBlock}>
                    <h4 style={smStyles.inspectorSegmentGroupHeadingTitleText}>RIDE HISTORY LEDGER</h4>
                    {selectedStudent.tripsHistory && selectedStudent.tripsHistory.length > 0 ? (
                      selectedStudent.tripsHistory.map((trip, i) => (
                        <div key={i} style={smStyles.historyItemCard}>
                          <div style={smStyles.historyCardHeader}><span style={smStyles.boldBlueTripIdentifier}>#{formatShortId(trip.id)}</span><span>{trip.date}</span></div>
                          <p style={smStyles.historyCardText}><MapPin size={10} /> {trip.route}</p>
                          <div style={smStyles.historyCardHeader}><span>{selectedStudent.userType === 'DRIVER' ? 'Passenger:' : 'Driver:'} {trip.driver}</span><span style={{ ...smStyles.boldTripStateStatus, color: trip.state === 'CANCELED' ? '#991B1B' : '#15803D' }}>{trip.state}</span></div>
                        </div>
                      ))
                    ) : (
                      <p style={smStyles.emptyFallbackItalicMessageText}>No logged runs found for this account pipeline.</p>
                    )}
                  </div>
                )}

                {activeInspectorTab === 'feedback' && (
                  <div style={smStyles.tabContentBlock}>
                    <h4 style={smStyles.inspectorSegmentGroupHeadingTitleText}>REVIEWS MATRIX</h4>
                    {selectedStudent.feedbackHistory && selectedStudent.feedbackHistory.length > 0 ? (
                      selectedStudent.feedbackHistory.map((fb, i) => (
                        <div key={i} style={smStyles.historyItemCard}>
                          <div style={smStyles.historyCardHeader}><span style={smStyles.starRatingInlineColorRow}>{Array(fb.rating).fill('★').join('')}</span><span>{fb.date}</span></div>
                          <p style={smStyles.historyCardItalicCommentText}>"{fb.comment}"</p>
                        </div>
                      ))
                    ) : (
                      <p style={smStyles.emptyFallbackItalicMessageText}>No recorded ratings entries available.</p>
                    )}
                  </div>
                )}

                {activeInspectorTab === 'reports' && (
                  <div style={smStyles.tabContentBlock}>
                    <h4 style={smStyles.inspectorSegmentGroupHeadingTitleText}>SYSTEM INCIDENTS FILES</h4>
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
                      <p style={smStyles.emptyFallbackItalicMessageText}>Clean Record. No behavior infractions or incident logs recorded.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Administrative Security Control Block */}
              <div style={smStyles.inspectorSidebarFooterActionToolbarButtonCluster}>
                <button 
                  style={smStyles.inspectorSidebarMessageActionButton} 
                  onClick={() => handleAccountAction(selectedStudent.id, 'warn')}
                >
                  <Send size={14} /> Send Warning Notice
                </button>
                
                <button 
                  style={{
                    ...smStyles.inspectorSidebarSuspendAccountActionButton,
                    backgroundColor: selectedStudent.status === 'FLAGGED' ? '#DCFCE7' : '#FFF1F2',
                    color: selectedStudent.status === 'FLAGGED' ? '#15803D' : '#E11D48'
                  }} 
                  onClick={() => handleAccountAction(selectedStudent.id, 'suspend')}
                >
                  <Ban size={14} /> {selectedStudent.status === 'FLAGGED' ? 'Reactivate User Access' : 'Suspend User Access'}
                </button>
              </div>
            </div>
          ) : (
            <div style={smStyles.inspectorSidebarEmptyStateContainerFallbackBox}>
              <h4 style={smStyles.emptyFallbackItalicMessageText}>Select an entry to load operational summaries logs blueprint fields.</h4>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

const smStyles = {
  workspaceWrapperContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  metricsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(4, 1fr)', 
    gap: '16px', 
    width: '100%', 
    alignItems: 'stretch' 
  },
  splitContentRowCanvas: { 
    display: 'flex', 
    gap: '20px', 
    width: '100%', 
    boxSizing: 'border-box', 
    alignItems: 'flex-start' 
  },
  leftWorkspaceMainColumn: { 
    display: 'flex', 
    flexDirection: 'column', 
    flex: '1 1 64%', 
    minWidth: '0', 
    boxSizing: 'border-box'
  },
  statCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '16px 20px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    boxShadow: '0 1px 2px rgba(0,0,0,0.01)' 
  },
  statBodyBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px', 
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
  statTrendText: { 
    fontSize: '11px', 
    fontWeight: 700 
  },
  statIconBadge: { 
    width: '40px', 
    height: '40px', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0
  },
  tableContainerCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '20px 0 0 0', 
    width: '100%', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.01)', 
    display: 'flex', 
    flexDirection: 'column' 
  },

  /* HEADER SEGMENT - SPREADS TITLE TO FAR LEFT AND SEARCH TO FAR RIGHT */
  tableHeaderSegmentRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '0 20px 16px 20px', 
    borderBottom: '1px solid #F1F5F9',
    width: '100%',
    boxSizing: 'border-box'
  },
  panelTitleText: { 
    fontSize: '15px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    margin: 0, 
    textTransform: 'capitalize', 
    letterSpacing: '0.3px' 
  },
  tableCardInlineSearchBar: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    backgroundColor: '#F8FAFC', 
    border: '1px solid #E2E8F0', 
    borderRadius: '10px', 
    padding: '6px 12px', 
    width: '260px' 
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
    padding: '12px 10px', 
    fontSize: '10px', 
    fontWeight: 800, 
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
    display: 'inline-block',
    flexShrink: 0
  },
  tdNameCellMarkup: { 
    padding: '12px 10px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px' 
  },
  tableRowAvatarImage: { 
    width: '34px', 
    height: '34px', 
    borderRadius: '50%', 
    objectFit: 'cover', 
    border: '1px solid #E2E8F0' 
  },
  tableRowAvatarMock: { 
    width: '34px', 
    height: '34px', 
    borderRadius: '50%', 
    backgroundColor: '#DBEAFE', 
    color: '#1E3A8A', 
    fontSize: '12px', 
    fontWeight: 700, 
    lineHeight: '34px', 
    textAlign: 'center'
  },
  tableRowOnlineStatusDotBadgeNode: { 
    position: 'absolute', 
    bottom: '-1px', 
    right: '-1px', 
    width: '8px', 
    height: '8px', 
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
    padding: '12px 10px', 
    fontSize: '12px', 
    color: '#475569', 
    textAlign: 'left', 
    verticalAlign: 'middle' 
  },
  monospaceIdentifierFont: { 
    fontFamily: 'monospace', 
    fontWeight: '600' 
  },
  roleStudentBadge: { 
    fontSize: '10px', 
    fontWeight: 700, 
    color: '#1E3A8A', 
    backgroundColor: '#EFF6FF', 
    padding: '3px 8px', 
    borderRadius: '6px', 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: '4px' 
  },
  roleGuestBadge: { 
    fontSize: '10px', 
    fontWeight: 700, 
    color: '#D97706', 
    backgroundColor: '#FFFBEB', 
    padding: '3px 8px', 
    borderRadius: '6px', 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: '4px' 
  },
  rideActivityStatusBarFlexBlock: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    width: '100px' 
  },
  progressBarTrackBaseLine: { 
    flex: 1, 
    height: '5px', 
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
    padding: '3px 8px', 
    borderRadius: '50px', 
    letterSpacing: '0.2px', 
    display: 'inline-block' 
  },
  tableInteractiveInlineActionTextBtn: { 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#2563EB', 
    cursor: 'pointer' 
  },
  tableFooterPaginationRow: { 
    display: 'flex', 
    justify: 'space-between', 
    alignItems: 'center', 
    padding: '14px 20px', 
    borderTop: '1px solid #F1F5F9', 
    marginTop: 'auto' 
  },
  tableFooterCount: { 
    fontSize: '11px', 
    color: '#94A3B8', 
    fontWeight: 500 
  },
  paginationButtonCluster: { 
    display: 'flex', 
    gap: '12px', 
    alignItems: 'center' 
  },
  paginationArrowButton: { 
    display: 'flex', 
    alignItems: 'center', 
    justify: 'center', 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    padding: '4px', 
    outline: 'none' 
  },

  /* INSPECTOR PANEL */
  rightWorkspaceReviewInspectorSidebarPanel: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '20px', 
    flex: '0 0 320px', 
    maxWidth: '320px',
    display: 'flex', 
    flexDirection: 'column', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.01)', 
    boxSizing: 'border-box'
  },
  inspectorSidebarInternalContentFlexContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    width: '100%' 
  },
  inspectorHeaderProfileSummaryBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justify: 'center',
    textAlign: 'center', 
    marginBottom: '16px',
    width: '100%'
  },
  inspectorProfileAvatarMainImage: { 
    width: '68px', 
    height: '68px', 
    borderRadius: '50%', 
    objectFit: 'cover', 
    border: '2px solid #E2E8F0', 
    marginBottom: '10px' 
  },
  inspectorProfileAvatarMock: { 
    width: '68px', 
    height: '68px', 
    borderRadius: '50%', 
    backgroundColor: '#DBEAFE', 
    color: '#1E3A8A', 
    fontSize: '20px', 
    fontWeight: 800, 
    lineHeight: '68px', 
    textAlign: 'center', 
    margin: '0 auto 10px auto',
    boxSizing: 'border-box'
  },
  inspectorProfilePrimaryTitleText: { 
    fontSize: '16px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    margin: 0,
    textAlign: 'center'
  },
  inspectorProfileSecondarySubtitleText: { 
    fontSize: '11px', 
    color: '#64748B', 
    fontFamily: 'monospace', 
    margin: '4px 0 0 0',
    textAlign: 'center'
  },
  historyTabTrackRow: { 
    display: 'flex', 
    borderBottom: '1px solid #E2E8F0', 
    paddingBottom: '2px', 
    gap: '16px', 
    marginBottom: '16px', 
    width: '100%', 
    justify: 'flex-start' 
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
    gap: '12px', 
    maxHeight: '300px',
    overflowY: 'auto', 
    paddingRight: '2px'
  },
  tabContentBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
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
    padding: '14px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px', 
    backgroundColor: '#FAFCFF' 
  },
  inspectorMetaCardRowField: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px' 
  },
  inspectorMetaCardRowValueText: { 
    fontSize: '12px', 
    color: '#334155', 
    fontWeight: 600,
    wordBreak: 'break-all'
  },
  historyItemCard: { 
    padding: '10px', 
    border: '1px solid #E2E8F0', 
    borderRadius: '10px', 
    backgroundColor: '#FAFCFF', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px' 
  },
  historyCardHeader: { 
    display: 'flex', 
    justify: 'space-between', 
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
    fontSize: '11px', 
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
    fontSize: '11px', 
    fontWeight: 600, 
    color: '#1E293B', 
    margin: 0, 
    fontStyle: 'italic' 
  },
  incidentReportRowBlockCard: { 
    padding: '10px', 
    border: '1px solid #FEE2E2', 
    borderRadius: '10px', 
    backgroundColor: '#FFF5F5', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px' 
  },
  reportIncidentTitleBadge: { 
    color: '#991B1B', 
    fontWeight: 700, 
    display: 'flex', 
    alignItems: 'center' 
  },
  microTimestampFont: { 
    fontSize: '10px' 
  },
  incidentLogBodyTextDescription: { 
    margin: 0, 
    fontSize: '11px', 
    color: '#475569', 
    lineHeight: '1.4', 
    fontWeight: 500 
  },
  incidentFilerAuthorLabel: { 
    fontSize: '9px', 
    color: '#94A3B8', 
    textTransform: 'uppercase', 
    letterSpacing: '0.3px', 
    fontWeight: 700 
  },
  inspectorSidebarFooterActionToolbarButtonCluster: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #F1F5F9'
  },
  inspectorSidebarMessageActionButton: { 
    width: '100%', 
    backgroundColor: '#F1F5F9', 
    border: 'none', 
    borderRadius: '10px', 
    color: '#475569', 
    fontSize: '12px', 
    fontWeight: 700, 
    padding: '10px 0', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justify: 'center', 
    gap: '8px', 
    outline: 'none' 
  },
  inspectorSidebarSuspendAccountActionButton: { 
    width: '100%', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '12px', 
    fontWeight: 700, 
    padding: '10px 0', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justify: 'center', 
    gap: '8px', 
    outline: 'none',
    transition: 'all 0.15s ease'
  },
  inspectorSidebarEmptyStateContainerFallbackBox: { 
    display: 'flex', 
    alignItems: 'center', 
    justify: 'center', 
    height: '100%', 
    width: '100%' 
  },
  loadingWrapperContainerFrame: { 
    display: 'flex', 
    alignItems: 'center', 
    justify: 'center', 
    height: '75vh', 
    width: '100%' 
  },
  loadingText: { 
    fontSize: '14px', 
    color: '#1E3A8A', 
    fontWeight: 700 
  },
  emptyFallbackTextWrapper: { 
    padding: '32px', 
    textAlign: 'center', 
    color: '#94A3B8', 
    fontSize: '12px', 
    fontWeight: 600 
  },
  emptyFallbackItalicMessageText: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: 500,
    fontStyle: 'italic',
    textAlign: 'center'
  }
}