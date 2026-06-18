import React, { useState, useEffect } from 'react'
import { 
  User, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Activity, 
  Key, 
  Monitor, 
  History 
} from 'lucide-react'

export default function AdminProfileScreen() {
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [activeSessions, setActiveSessions] = useState([])

  useEffect(() => {
    const fetchAdminProfileData = async () => {
      try {
        setLoading(true)

        // 💡 BACKEND TODO: Batch load individual administrator identity states & immutable logs
        // const [profileRes, logsRes, sessionsRes] = await Promise.all([
        //   axios.get('/api/v1/admin/profile'),
        //   axios.get('/api/v1/admin/profile/audit-logs'),
        //   axios.get('/api/v1/admin/profile/active-sessions')
        // ])

        setProfileData({
          name: 'Dr. Julian Vance',
          role: 'System Administrator',
          clearance: 'Level 5 (Full Read/Write/Override)',
          department: 'Campus Logistics & Security Operations',
          email: 'j.vance@st.ug.edu.gh',
          phone: '+233 24 112 9901',
          joinedDate: 'January 10, 2026'
        })

        setAuditLogs([
          { id: 1, action: 'Global Broadcast Dispatched', details: 'Transmitted system maintenance warning to all platform users.', time: 'Today • 14:45', status: 'SUCCESS', color: '#16A34A' },
          { id: 2, action: 'Operator Account Suspended', details: 'Force-terminated active dispatch tokens for Driver ID-99.', time: 'Yesterday • 09:12', status: 'SUCCESS', color: '#16A34A' },
          { id: 3, action: 'Driver Document Vetting', details: 'Approved commercial license credential registry for Emmanuel Kofi Boateng.', time: 'June 16, 2026', status: 'SUCCESS', color: '#16A34A' }
        ])

        setActiveSessions([
          { id: 'S1', device: 'Chrome / macOS (Accra, Ghana)', current: true, ip: '192.168.1.104', activity: 'Active Now' },
          { id: 'S2', device: 'Safari / iPhone 15 Pro', current: false, ip: '102.176.45.12', activity: '2 Hours Ago' }
        ])

      } catch (err) {
        console.error("Failed initializing secure administrative account metrics:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminProfileData()
  }, [])

  if (loading) {
    return (
      <div style={profStyles.loadingFrame}>
        <span style={profStyles.loadingText}>Verifying Administrative Clearance Level...</span>
      </div>
    )
  }

  return (
    <div style={profStyles.workspaceContainer}>

      {/* 1. TOP MASTER PROFILE INFORMATION HEAD CARD */}
      <div style={profStyles.profileHeaderCard}>
        <div style={profStyles.avatarSectionRow}>
          <div style={profStyles.profileAvatarMock}>JV</div>
          <div style={profStyles.identityTextStackBlock}>
            <h2 style={profStyles.profileNameTitleText}>{profileData?.name}</h2>
            <p style={profStyles.profileRoleSubtitleText}>{profileData?.role}</p>
            <div style={profStyles.clearanceBadgeFlexRowLine}>
              <Shield size={12} color="#1E3A8A" />
              <span style={profStyles.clearanceBadgeText}>{profileData?.clearance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT WORKSPACE CANVAS METRICS */}
      <div style={profStyles.splitContentRowCanvas}>

        {/* LEFT COLUMN COMPONENT LAYER: GRANULAR METADATA FIELDS */}
        <div style={profStyles.leftWorkspaceMainColumn}>
          <div style={profStyles.detailsContainerCard}>
            <h3 style={profStyles.containerBlockTitle}>Account Blueprint Fields</h3>

            <div style={profStyles.metaDataFieldsVerticalStackContainer}>
              <div style={profStyles.metaDataFieldUnitRow}>
                <div style={profStyles.fieldLabelFlexRowLine}><Mail size={14} color="#94A3B8" /><span>Email Identity</span></div>
                <span style={profStyles.fieldValueStrongText}>{profileData?.email}</span>
              </div>

              <div style={profStyles.metaDataFieldUnitRow}>
                <div style={profStyles.fieldLabelFlexRowLine}><Phone size={14} color="#94A3B8" /><span>Contact Number</span></div>
                <span style={profStyles.fieldValueStrongText}>{profileData?.phone}</span>
              </div>

              <div style={profStyles.metaDataFieldUnitRow}>
                <div style={profStyles.fieldLabelFlexRowLine}><MapPin size={14} color="#94A3B8" /><span>Assigned Department</span></div>
                <span style={profStyles.fieldValueStrongText}>{profileData?.department}</span>
              </div>

              <div style={profStyles.metaDataFieldUnitRow}>
                <div style={profStyles.fieldLabelFlexRowLine}><Activity size={14} color="#94A3B8" /><span>Account Hydration Lifecycle</span></div>
                <span style={profStyles.fieldValueStrongText}>Registered since {profileData?.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* ACTIVE LOGGED-IN VALIDATION SESSIONS WIDGET */}
          <div style={profStyles.detailsContainerCard}>
            <h3 style={profStyles.containerBlockTitle}>Active Login Sessions</h3>
            <div style={profStyles.sessionsVerticalStackListContainer}>
              {activeSessions.map((session) => (
                <div key={session.id} style={profStyles.sessionListItemRowStrip}>
                  <div style={profStyles.sessionLeftDetailsCluster}>
                    <Monitor size={16} color="#1E3A8A" />
                    <div style={profStyles.sessionTextStackGroup}>
                      <span style={profStyles.sessionDeviceStrongText}>{session.device}</span>
                      <span style={profStyles.sessionIpSubLabelText}>IP Address: {session.ip}</span>
                    </div>
                  </div>
                  <span style={{ 
                    ...profStyles.sessionStatusIndicatorTagPillMarkup, 
                    backgroundColor: session.current ? '#DCFCE7' : '#F1F5F9',
                    color: session.current ? '#15803D' : '#64748B'
                  }}>
                    {session.activity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN COMPONENT LAYER: SECURITY ACTION AUDIT TRAIL */}
        <div style={profStyles.rightWorkspaceSidebarPanel}>
          <div style={profStyles.auditTrailContainerCard}>
            <div style={profStyles.panelHeaderRowFlexHeader}>
              <History size={16} color="#1E3A8A" />
              <h3 style={profStyles.containerBlockTitle}>Immutable Administrative Action Logs</h3>
            </div>

            <div style={profStyles.auditLogsChronologicalVerticalTrackListContainer}>
              {auditLogs.map((log) => (
                <div key={log.id} style={profStyles.auditLogEventStripBlock}>
                  <div style={profStyles.logEventFlexTopHeaderLine}>
                    <span style={profStyles.logActionHeadingTitleText}>{log.action}</span>
                    <span style={profStyles.logMicroTimestampLabelText}>{log.time}</span>
                  </div>
                  <p style={profStyles.logParagraphDescriptionBodyText}>{log.details}</p>
                  <span style={{ ...profStyles.logStatusPillMarkup, color: log.color }}>System Verification Status: {log.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

// ── ARRANGED SECURE ADMINISTRATOR PROFILE VIEWPORT CANVAS STYLESHEET ─────────
const profStyles = {
  workspaceContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  profileHeaderCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '32px', 
    display: 'flex', 
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    boxShadow: '0 1px 2px rgba(0,0,0,0.01)', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  avatarSectionRow: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '24px' 
  },
  profileAvatarMock: { 
    width: '80px', 
    height: '80px', 
    borderRadius: '24px', 
    backgroundColor: '#1E3A8A', 
    color: '#ffffff', 
    fontSize: '28px', 
    fontWeight: 800, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  identityTextStackBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px', 
    textAlign: 'left' 
  },
  profileNameTitleText: { 
    fontSize: '22px', 
    fontWeight: 900, 
    color: '#0F172A', 
    margin: 0 
  },
  profileRoleSubtitleText: { 
    fontSize: '13px', 
    fontWeight: 600, 
    color: '#64748B', 
    margin: 0 
  },
  clearanceBadgeFlexRowLine: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    marginTop: '2px' 
  },
  clearanceBadgeText: { 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#1E3A8A', 
    backgroundColor: '#EFF6FF', 
    padding: '2px 8px', 
    borderRadius: '6px' 
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
    flex: 1.4, 
    gap: '24px', 
    boxSizing: 'border-box' 
  },
  detailsContainerCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px', 
    boxSizing: 'border-box' 
  },
  containerBlockTitle: { 
    fontSize: '13px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    margin: 0, 
    textTransform: 'uppercase', 
    letterSpacing: '0.4px', 
    textAlign: 'left' 
  },
  metaDataFieldsVerticalStackContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    width: '100%' 
  },
  metaDataFieldUnitRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '16px 0', 
    borderBottom: '1px solid #F8FAFC', 
    gap: '16px' 
  },
  fieldLabelFlexRowLine: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    fontSize: '12px', 
    color: '#64748B', 
    fontWeight: 600 
  },
  fieldValueStrongText: { 
    fontSize: '13px', 
    fontWeight: 700, 
    color: '#1E293B', 
    textAlign: 'right' 
  },
  sessionsVerticalStackListContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px', 
    width: '100%' 
  },
  sessionListItemRowStrip: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '12px', 
    border: '1px solid #F1F5F9', 
    borderRadius: '12px', 
    backgroundColor: '#FAFCFF', 
    gap: '16px' 
  },
  sessionLeftDetailsCluster: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    textAlign: 'left' 
  },
  sessionTextStackGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '2px' 
  },
  sessionDeviceStrongText: { 
    fontSize: '12px', 
    fontWeight: 700, 
    color: '#1E293B' 
  },
  sessionIpSubLabelText: { 
    fontSize: '11px', 
    color: '#94A3B8', 
    fontWeight: 500 
  },
  sessionStatusIndicatorTagPillMarkup: { 
    fontSize: '10px', 
    fontWeight: 800, 
    padding: '4px 10px', 
    borderRadius: '6px' 
  },
  rightWorkspaceSidebarPanel: { 
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    border: '1px solid #E2E8F0', 
    padding: '24px', 
    flex: 1.6, 
    display: 'flex', 
    flexDirection: 'column', 
    minWidth: '340px', 
    boxSizing: 'border-box' 
  },
  auditTrailContainerCard: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px', 
    width: '100%' 
  },
  panelHeaderRowFlexHeader: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    width: '100%', 
    borderBottom: '1px solid #F1F5F9', 
    paddingBottom: '14px' 
  },
  auditLogsChronologicalVerticalTrackListContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '16px', 
    maxHeight: '520px', 
    overflowY: 'auto', 
    paddingRight: '4px' 
  },
  auditLogEventStripBlock: { 
    padding: '14px', 
    border: '1px solid #E2E8F0', 
    borderRadius: '12px', 
    backgroundColor: '#FAFCFF', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px', 
    textAlign: 'left' 
  },
  logEventFlexTopHeaderLine: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%' 
  },
  logActionHeadingTitleText: { 
    fontSize: '13px', 
    fontWeight: 700, 
    color: '#1E293B' 
  },
  logMicroTimestampLabelText: { 
    fontSize: '11px', 
    color: '#94A3B8', 
    fontWeight: 600 
  },
  logParagraphDescriptionBodyText: { 
    margin: 0, 
    fontSize: '12px', 
    color: '#475569', 
    lineHeight: '1.45', 
    fontWeight: 500 
  },
  logStatusPillMarkup: { 
    fontSize: '10px', 
    fontWeight: 700, 
    textTransform: 'uppercase', 
    letterSpacing: '0.3px', 
    marginTop: '2px' 
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
  }
}