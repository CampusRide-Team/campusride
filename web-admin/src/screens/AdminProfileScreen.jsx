import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  Mail, 
  Phone, 
  Calendar, 
  Laptop, 
  Smartphone, 
  ShieldCheck, 
  Activity, 
  Edit3
} from 'lucide-react'
import api from '../api/axios'

export default function AdminProfileScreen() {
  const [profile, setProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/profile')
      if (res.data?.success && res.data?.data) {
        const { profileData, activeSessions = [], auditLogs: logs = [] } = res.data.data
        setProfile(profileData)
        setSessions(activeSessions)
        setAuditLogs(logs)
        setFullName(profileData.name || '')
        setPhone(profileData.phone || '')
        setDepartment(profileData.department || '')
      }
    } catch (err) {
      console.error("Failed loading admin profile:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await api.put('/auth/profile', {
        fullName,
        phoneNumber: phone,
        locationResidence: department
      })
      if (res.data?.success) {
        alert("Admin profile updated successfully.")
        setEditing(false)
        fetchProfileData()
      }
    } catch (err) {
      console.error("Failed saving admin profile:", err)
      alert(err.response?.data?.error?.message || "Failed to update profile.")
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'AD'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  if (loading) {
    return (
      <div style={apStyles.loadingFrame}>
        <span style={apStyles.loadingText}>Hydrating Admin Profile Context...</span>
      </div>
    )
  }

  return (
    <div style={apStyles.container}>
      {/* HEADER ROW */}
      <div style={apStyles.screenHeaderRow}>
        <div>
          <h2 style={apStyles.screenTitle}>Administrative Profile & Access</h2>
          <p style={apStyles.screenSubtitle}>Manage system operator credentials, security clearance attributes, and active authorization sessions.</p>
        </div>
        <button 
          style={apStyles.editTriggerButton}
          onClick={() => setEditing(!editing)}
        >
          <Edit3 size={14} /> {editing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      {/* EDIT MODAL / FORM */}
      {editing && (
        <div style={apStyles.editCard}>
          <div style={apStyles.cardHeaderRow}>
            <ShieldCheck size={16} color="#1E3A8A" />
            <h3 style={apStyles.cardTitle}>Update Administrator Details</h3>
          </div>
          <form onSubmit={handleSaveProfile} style={apStyles.editForm}>
            <div style={apStyles.formGrid}>
              <div style={apStyles.inputUnit}>
                <label style={apStyles.inputLabel}>Full Name</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required
                  style={apStyles.textInput}
                />
              </div>
              <div style={apStyles.inputUnit}>
                <label style={apStyles.inputLabel}>Phone Number</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required
                  style={apStyles.textInput}
                />
              </div>
              <div style={{ ...apStyles.inputUnit, gridColumn: 'span 2' }}>
                <label style={apStyles.inputLabel}>Department / Office Residence</label>
                <input 
                  type="text" 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)} 
                  style={apStyles.textInput}
                />
              </div>
            </div>
            <div style={apStyles.editActionsRow}>
              <button type="submit" disabled={saving} style={apStyles.saveBtn}>
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)} style={apStyles.cancelBtn}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TOP PROFILE CARD */}
      <div style={apStyles.profileHeroCard}>
        <div style={apStyles.avatarContainer}>
          <div style={apStyles.avatarCircle}>{getInitials(profile?.name)}</div>
        </div>

        <div style={apStyles.heroInfoStack}>
          <div style={apStyles.heroTopRow}>
            <h2 style={apStyles.heroName}>{profile?.name || 'Administrator'}</h2>
            <span style={apStyles.clearanceBadge}>
              <Shield size={12} style={{ marginRight: '4px' }} /> {profile?.clearance || 'Level 5 (Full Read/Write)'}
            </span>
          </div>
          <p style={apStyles.heroRole}>{profile?.role || 'System Administrator'} • {profile?.department || 'Campus Security & Logistics'}</p>

          <div style={apStyles.metaBadgesRow}>
            <div style={apStyles.metaBadgeItem}>
              <Mail size={13} color="#94A3B8" />
              <span>{profile?.email || 'admin@campusride.ug.edu.gh'}</span>
            </div>
            <div style={apStyles.metaBadgeItem}>
              <Phone size={13} color="#94A3B8" />
              <span>{profile?.phone || 'N/A'}</span>
            </div>
            <div style={apStyles.metaBadgeItem}>
              <Calendar size={13} color="#94A3B8" />
              <span>Joined {profile?.joinedDate || 'September 2026'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN LOWER LAYOUT */}
      <div style={apStyles.lowerSplitGrid}>
        {/* ACTIVE SESSIONS */}
        <div style={apStyles.sectionCard}>
          <div style={apStyles.cardHeaderRow}>
            <Laptop size={16} color="#1E3A8A" />
            <h3 style={apStyles.cardTitle}>Active Authenticated Sessions</h3>
          </div>

          <div style={apStyles.sessionsList}>
            {sessions.length === 0 ? (
              <p style={apStyles.emptyText}>No active session metadata returned.</p>
            ) : (
              sessions.map((sess, idx) => (
                <div key={sess.id || idx} style={{
                  ...apStyles.sessionItem,
                  borderLeft: sess.current ? '4px solid #16A34A' : '4px solid #E2E8F0'
                }}>
                  <div style={apStyles.sessionIcon}>
                    {sess.device?.includes('iPhone') || sess.device?.includes('Mobile') ? (
                      <Smartphone size={18} color="#1E3A8A" />
                    ) : (
                      <Laptop size={18} color="#1E3A8A" />
                    )}
                  </div>
                  <div style={apStyles.sessionTextStack}>
                    <div style={apStyles.sessionTitleRow}>
                      <span style={apStyles.sessionDeviceName}>{sess.device || 'Desktop Browser'}</span>
                      {sess.current && <span style={apStyles.currentPill}>Current Device</span>}
                    </div>
                    <span style={apStyles.sessionSubText}>IP: {sess.ip || '127.0.0.1'} • Last active: {sess.activity || 'Just now'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AUDIT LOGS */}
        <div style={apStyles.sectionCard}>
          <div style={apStyles.cardHeaderRow}>
            <Activity size={16} color="#1E3A8A" />
            <h3 style={apStyles.cardTitle}>Recent Administrative Actions</h3>
          </div>

          <div style={apStyles.auditLogsList}>
            {auditLogs.length === 0 ? (
              <p style={apStyles.emptyText}>No recent audit logs recorded.</p>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={log.id || idx} style={apStyles.auditLogItem}>
                  <div style={{ ...apStyles.auditDot, backgroundColor: log.color || '#16A34A' }} />
                  <div style={apStyles.auditTextStack}>
                    <div style={apStyles.auditTitleRow}>
                      <span style={apStyles.auditActionTitle}>{log.action || 'System Action'}</span>
                      <span style={apStyles.auditTime}>{log.time || 'Recently'}</span>
                    </div>
                    <p style={apStyles.auditDetails}>{log.details || 'No additional details provided.'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const apStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box'
  },
  screenHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left'
  },
  screenTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#2563EB',
    margin: 0
  },
  screenSubtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0 0',
    fontWeight: 500
  },
  editTriggerButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#2563EB',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  editCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #DBEAFE',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(30,58,138,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  inputUnit: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left'
  },
  inputLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  textInput: {
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
  editActionsRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    borderTop: '1px solid #F1F5F9',
    paddingTop: '16px'
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  profileHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #E2E8F0',
    padding: '32px',
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  avatarContainer: {
    flexShrink: 0
  },
  avatarCircle: {
    width: '84px',
    height: '84px',
    borderRadius: '24px',
    backgroundColor: '#2563EB',
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(37,99,235,0.2)'
  },
  heroInfoStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    textAlign: 'left'
  },
  heroTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  heroName: {
    fontSize: '22px',
    fontWeight: 900,
    color: '#0F172A',
    margin: 0
  },
  clearanceBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: 800,
    padding: '4px 12px',
    borderRadius: '50px'
  },
  heroRole: {
    fontSize: '13px',
    color: '#64748B',
    fontWeight: 600,
    margin: 0
  },
  metaBadgesRow: {
    display: 'flex',
    gap: '20px',
    marginTop: '4px',
    flexWrap: 'wrap'
  },
  metaBadgeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#475569',
    fontWeight: 500
  },
  lowerSplitGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box'
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxSizing: 'border-box'
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#2563EB',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    textAlign: 'left'
  },
  sessionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sessionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    border: '1px solid #F1F5F9',
    borderRadius: '12px',
    backgroundColor: '#FAFCFF',
    textAlign: 'left'
  },
  sessionIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0'
  },
  sessionTextStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1
  },
  sessionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sessionDeviceName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E293B'
  },
  currentPill: {
    fontSize: '9px',
    fontWeight: 800,
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    padding: '2px 8px',
    borderRadius: '50px',
    textTransform: 'uppercase'
  },
  sessionSubText: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 500
  },
  auditLogsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  auditLogItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    textAlign: 'left',
    paddingBottom: '12px',
    borderBottom: '1px solid #F8FAFC'
  },
  auditDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginTop: '5px',
    flexShrink: 0
  },
  auditTextStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1
  },
  auditTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  auditActionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E293B'
  },
  auditTime: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#94A3B8'
  },
  auditDetails: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
    lineHeight: '1.4'
  },
  emptyText: {
    fontSize: '12px',
    color: '#94A3B8',
    fontStyle: 'italic',
    margin: 0,
    textAlign: 'left'
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
    color: '#2563EB',
    fontWeight: 700
  }
}