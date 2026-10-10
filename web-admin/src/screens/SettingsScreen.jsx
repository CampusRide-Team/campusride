import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Shield, 
  Bell, 
  Palette, 
  AlertTriangle, 
  ChevronDown,
  LogOut,
  X,
  KeyRound,
  CheckCircle2
} from 'lucide-react'
import api from '../api/axios'

export default function SettingsScreen({ onLogout }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // System Preferences
  const [platformName, setPlatformName] = useState('')
  const [operatingHours, setOperatingHours] = useState('')
  const [rideRadius, setRideRadius] = useState('')
  const [enableRideNotifications, setEnableRideNotifications] = useState(true)

  // Security
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('')

  // Notification Preferences
  const [driverVerificationAlerts, setDriverVerificationAlerts] = useState(true)
  const [rideActivityAlerts, setRideActivityAlerts] = useState(true)
  const [riderActivityAlerts, setRiderActivityAlerts] = useState(false)
  const [systemMaintenanceAlerts, setSystemMaintenanceAlerts] = useState(true)

  // Appearance
  const [colorTheme, setColorTheme] = useState('light')
  const [interfaceDensity, setInterfaceDensity] = useState('comfortable')

  // Password modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3200)
  }

  const applySettings = (d) => {
    if (!d) return
    setPlatformName(d.platformName ?? '')
    setOperatingHours(d.operatingHours ?? '')
    setRideRadius(d.rideRadius ?? '')
    setEnableRideNotifications(d.enableRideNotifications !== false)
    setTwoFactorAuth(!!d.twoFactorAuth)
    setSessionTimeout(d.sessionTimeout ?? '')
    setDriverVerificationAlerts(d.driverVerificationAlerts !== false)
    setRideActivityAlerts(d.rideActivityAlerts !== false)
    setRiderActivityAlerts(!!d.riderActivityAlerts)
    setSystemMaintenanceAlerts(d.systemMaintenanceAlerts !== false)
    setColorTheme(d.colorTheme || 'light')
    setInterfaceDensity(d.interfaceDensity || 'comfortable')
  }

  const fetchGlobalSettings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/settings')
      if (res.data?.success && res.data?.data) {
        applySettings(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      showToast('Failed to load settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGlobalSettings()
  }, [])

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      const payload = {
        platformName,
        operatingHours,
        rideRadius,
        enableRideNotifications,
        twoFactorAuth,
        sessionTimeout,
        driverVerificationAlerts,
        rideActivityAlerts,
        riderActivityAlerts,
        systemMaintenanceAlerts,
        colorTheme,
        interfaceDensity
      }

      const res = await api.put('/admin/settings', payload)
      if (res.data?.success) {
        showToast('Settings saved successfully')
      } else {
        showToast(res.data?.message || 'Failed to save settings', 'error')
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      showToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPreferences = async () => {
    const ok = window.confirm(
      'Reset all preferences to the values stored on the server? Unsaved changes will be lost.'
    )
    if (!ok) return

    try {
      setLoading(true)
      const res = await api.get('/admin/settings')
      if (res.data?.success && res.data?.data) {
        applySettings(res.data.data)
        showToast('Preferences reset from server')
      }
    } catch (err) {
      console.error('Failed to reset preferences:', err)
      showToast('Failed to reset preferences', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields', 'error')
      return
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    try {
      setPasswordSaving(true)
      const res = await api.put('/admin/settings/password', {
        currentPassword,
        newPassword
      })
      if (res.data?.success) {
        showToast('Password updated successfully')
        setPasswordModalOpen(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        showToast(res.data?.message || 'Failed to update password', 'error')
      }
    } catch (err) {
      console.error('Password update failed:', err)
      const msg = err.response?.data?.message || 'Failed to update password'
      showToast(msg, 'error')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleLogout = () => {
    const ok = window.confirm('End your admin session and log out?')
    if (!ok) return
    localStorage.removeItem('adminToken')
    localStorage.removeItem('token')
    onLogout?.()
  }

  if (loading && !platformName && !operatingHours) {
    return (
      <div style={s.loadingWrapper}>
        <span style={s.loadingText}>Loading settings...</span>
      </div>
    )
  }

  return (
    <div style={s.container}>
      {toast && (
        <div style={{
          ...s.toast,
          backgroundColor: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5',
          borderColor: toast.type === 'error' ? '#FECACA' : '#A7F3D0',
          color: toast.type === 'error' ? '#B91C1C' : '#065F46'
        }}>
          <CheckCircle2 size={16} />
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Settings</h1>
          <p style={s.subtitle}>
            Manage system preferences, security, notifications, and appearance
          </p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={s.mainRow}>
        {/* LEFT */}
        <div style={s.leftCol}>
          {/* System Preferences */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <Settings size={16} color="#2563EB" />
              <h3 style={s.cardTitle}>System Preferences</h3>
            </div>

            <div style={s.fieldStack}>
              <div style={s.field}>
                <label style={s.label}>Platform Name</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  style={s.input}
                  placeholder="CampusRide Admin"
                />
              </div>

              <div style={s.fieldRow}>
                <div style={s.field}>
                  <label style={s.label}>Operating Hours</label>
                  <div style={s.selectWrap}>
                    <select
                      value={operatingHours}
                      onChange={(e) => setOperatingHours(e.target.value)}
                      style={s.select}
                    >
                      <option value="">Select hours</option>
                      <option value="06:00 AM - 11:59 PM">06:00 AM – 11:59 PM</option>
                      <option value="24 Hours Open">24 Hours</option>
                    </select>
                    <ChevronDown size={14} color="#94A3B8" style={s.chevron} />
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Dispatch Search Radius</label>
                  <div style={s.selectWrap}>
                    <select
                      value={rideRadius}
                      onChange={(e) => setRideRadius(e.target.value)}
                      style={s.select}
                    >
                      <option value="">Select radius</option>
                      <option value="3 Miles">3 Miles</option>
                      <option value="5 Miles">5 Miles</option>
                      <option value="10 Miles">10 Miles</option>
                    </select>
                    <ChevronDown size={14} color="#94A3B8" style={s.chevron} />
                  </div>
                </div>
              </div>

              <div style={s.toggleRow}>
                <div>
                  <span style={s.toggleTitle}>Global Dispatch Notifications</span>
                  <span style={s.toggleSub}>
                    Send real-time matching updates to admins
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableRideNotifications(!enableRideNotifications)}
                  style={{
                    ...s.toggle,
                    backgroundColor: enableRideNotifications ? '#2563EB' : '#E2E8F0'
                  }}
                >
                  <div style={{
                    ...s.toggleKnob,
                    transform: enableRideNotifications ? 'translateX(20px)' : 'translateX(2px)'
                  }} />
                </button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <Shield size={16} color="#2563EB" />
              <h3 style={s.cardTitle}>Security</h3>
            </div>

            <div style={s.fieldStack}>
              <div style={s.toggleRow}>
                <div>
                  <span style={s.toggleTitle}>Change Password</span>
                  <span style={s.toggleSub}>Update your admin account password</span>
                </div>
                <button
                  type="button"
                  style={s.inlineBtn}
                  onClick={() => setPasswordModalOpen(true)}
                >
                  <KeyRound size={13} />
                  Update
                </button>
              </div>

              <div style={s.toggleRow}>
                <div>
                  <span style={s.toggleTitle}>Two-Factor Authentication</span>
                  <span style={s.toggleSub}>
                    Require a verification code on login
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                  style={{
                    ...s.toggle,
                    backgroundColor: twoFactorAuth ? '#2563EB' : '#E2E8F0'
                  }}
                >
                  <div style={{
                    ...s.toggleKnob,
                    transform: twoFactorAuth ? 'translateX(20px)' : 'translateX(2px)'
                  }} />
                </button>
              </div>

              <div style={s.field}>
                <label style={s.label}>Session Timeout</label>
                <div style={s.selectWrap}>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    style={s.select}
                  >
                    <option value="">Select timeout</option>
                    <option value="15 Minutes of inactivity">15 minutes</option>
                    <option value="30 Minutes of inactivity">30 minutes</option>
                    <option value="60 Minutes of inactivity">60 minutes</option>
                  </select>
                  <ChevronDown size={14} color="#94A3B8" style={s.chevron} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={s.rightCol}>
          {/* Notifications */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <Bell size={16} color="#2563EB" />
              <h3 style={s.cardTitle}>Notification Preferences</h3>
            </div>

            <div style={s.compactStack}>
              {[
                { label: 'Driver Verification Alerts', value: driverVerificationAlerts, set: setDriverVerificationAlerts },
                { label: 'Ride Activity Alerts', value: rideActivityAlerts, set: setRideActivityAlerts },
                { label: 'Rider Account Alerts', value: riderActivityAlerts, set: setRiderActivityAlerts },
                { label: 'System Maintenance Alerts', value: systemMaintenanceAlerts, set: setSystemMaintenanceAlerts }
              ].map((item) => (
                <div key={item.label} style={s.compactRow}>
                  <span style={s.compactLabel}>{item.label}</span>
                  <button
                    type="button"
                    onClick={() => item.set(!item.value)}
                    style={{
                      ...s.toggleSm,
                      backgroundColor: item.value ? '#2563EB' : '#E2E8F0'
                    }}
                  >
                    <div style={{
                      ...s.toggleKnobSm,
                      transform: item.value ? 'translateX(14px)' : 'translateX(2px)'
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <Palette size={16} color="#2563EB" />
              <h3 style={s.cardTitle}>Appearance</h3>
            </div>

            <div style={s.compactStack}>
              <div style={s.segmentGroup}>
                <span style={s.compactLabel}>Color Theme</span>
                <div style={s.segmentTrack}>
                  {['light', 'dark'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setColorTheme(t)}
                      style={{
                        ...s.segmentBtn,
                        backgroundColor: colorTheme === t ? '#fff' : 'transparent',
                        color: colorTheme === t ? '#0F172A' : '#64748B',
                        fontWeight: colorTheme === t ? 700 : 500,
                        boxShadow: colorTheme === t ? '0 1px 3px rgba(15,23,42,0.08)' : 'none'
                      }}
                    >
                      {t === 'light' ? 'Light' : 'Dark'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.segmentGroup}>
                <span style={s.compactLabel}>Interface Density</span>
                <div style={s.segmentTrack}>
                  {['comfortable', 'compact'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setInterfaceDensity(d)}
                      style={{
                        ...s.segmentBtn,
                        backgroundColor: interfaceDensity === d ? '#fff' : 'transparent',
                        color: interfaceDensity === d ? '#0F172A' : '#64748B',
                        fontWeight: interfaceDensity === d ? 700 : 500,
                        boxShadow: interfaceDensity === d ? '0 1px 3px rgba(15,23,42,0.08)' : 'none'
                      }}
                    >
                      {d === 'comfortable' ? 'Comfortable' : 'Compact'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div style={s.dangerCard}>
        <div>
          <div style={s.dangerHeader}>
            <AlertTriangle size={14} color="#BE123C" />
            <h4 style={s.dangerTitle}>Danger Zone</h4>
          </div>
          <p style={s.dangerText}>
            Session and preference actions that cannot be undone from this screen.
          </p>
        </div>
        <div style={s.dangerActions}>
          <button type="button" style={s.dangerPrimary} onClick={handleLogout}>
            <LogOut size={13} />
            Log Out
          </button>
          <button type="button" style={s.dangerSecondary} onClick={handleResetPreferences}>
            Reset Preferences
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div style={s.footer}>
        <button type="button" style={s.cancelBtn} onClick={fetchGlobalSettings}>
          Cancel
        </button>
        <button
          type="button"
          style={s.saveBtn}
          onClick={handleSaveChanges}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* PASSWORD MODAL */}
      {passwordModalOpen && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={s.cardHeader}>
                <KeyRound size={16} color="#2563EB" />
                <h3 style={s.modalTitle}>Change Password</h3>
              </div>
              <button type="button" style={s.modalClose} onClick={() => setPasswordModalOpen(false)}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} style={s.modalForm}>
              <div style={s.field}>
                <label style={s.label}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={s.input}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={s.input}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={s.input}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div style={s.modalFooter}>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={() => setPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={s.saveBtn} disabled={passwordSaving}>
                  {passwordSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
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
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    position: 'relative'
  },
  loadingWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh'
  },
  loadingText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: 600
  },
  toast: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid',
    fontSize: 13,
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(15,23,42,0.12)'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.3px'
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: '#64748B',
    fontWeight: 500
  },
  mainRow: {
    display: 'flex',
    gap: 20,
    alignItems: 'stretch'
  },
  leftCol: {
    flex: 2.2,
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  rightCol: {
    flex: 1.2,
    minWidth: 300,
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    padding: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  cardTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  fieldStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1
  },
  fieldRow: {
    display: 'flex',
    gap: 12
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
    color: '#0F172A',
    fontWeight: 500,
    outline: 'none'
  },
  selectWrap: {
    position: 'relative',
    width: '100%'
  },
  select: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: '10px 36px 10px 12px',
    fontSize: 13,
    color: '#0F172A',
    fontWeight: 500,
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer'
  },
  chevron: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none'
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 14,
    border: '1px solid #F1F5F9',
    borderRadius: 12,
    backgroundColor: '#F8FAFC'
  },
  toggleTitle: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#0F172A'
  },
  toggleSub: {
    display: 'block',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 1.4
  },
  toggle: {
    width: 42,
    height: 22,
    borderRadius: 50,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    flexShrink: 0
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
    transition: 'transform 0.15s ease'
  },
  toggleSm: {
    width: 34,
    height: 18,
    borderRadius: 50,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    flexShrink: 0
  },
  toggleKnobSm: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
    transition: 'transform 0.15s ease'
  },
  inlineBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    color: '#334155',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0
  },
  compactStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  compactRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 12px',
    border: '1px solid #F1F5F9',
    borderRadius: 10,
    backgroundColor: '#F8FAFC'
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#334155'
  },
  segmentGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  segmentTrack: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    gap: 4
  },
  segmentBtn: {
    flex: 1,
    border: 'none',
    padding: '8px 0',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer'
  },
  dangerCard: {
    border: '1px solid #FECDD3',
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    padding: 22,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap'
  },
  dangerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  dangerTitle: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    color: '#BE123C',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  dangerText: {
    margin: '6px 0 0',
    fontSize: 12,
    color: '#9F1239',
    fontWeight: 500,
    lineHeight: 1.4
  },
  dangerActions: {
    display: 'flex',
    gap: 10,
    flexShrink: 0
  },
  dangerPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E11D48',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer'
  },
  dangerSecondary: {
    backgroundColor: '#FFE4E6',
    color: '#BE123C',
    border: '1px solid #FECDD3',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    borderTop: '1px solid #E2E8F0',
    paddingTop: 20
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '11px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  },
  cancelBtn: {
    backgroundColor: '#fff',
    color: '#475569',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    padding: '11px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 20
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    padding: 24,
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 40px rgba(15,23,42,0.15)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottom: '1px solid #F1F5F9'
  },
  modalTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: '#0F172A'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTop: '1px solid #F1F5F9',
    marginTop: 4
  }
}