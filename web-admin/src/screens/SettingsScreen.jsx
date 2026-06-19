import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Shield, 
  Bell, 
  Palette, 
  AlertTriangle, 
  ChevronDown,
  RefreshCw,
  LogOut
} from 'lucide-react'

export default function SettingsScreen({ onLogout }) {
  const [loading, setLoading] = useState(false)

  // 1. System Preferences Configurations States
  const [platformName, setPlatformName] = useState('')
  const [operatingHours, setOperatingHours] = useState('06:00 AM - 11:59 PM')
  const [rideRadius, setRideRadius] = useState('5 Miles')
  const [enableRideNotifications, setEnableRideNotifications] = useState(true)

  // 2. Security Configuration Vectors States
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('30 Minutes of inactivity')

  // 3. System Notification Preferences Toggles States
  const [driverVerificationAlerts, setDriverVerificationAlerts] = useState(true)
  const [rideActivityAlerts, setRideActivityAlerts] = useState(true)
  const [riderActivityAlerts, setRiderActivityAlerts] = useState(false)
  const [systemMaintenanceAlerts, setSystemMaintenanceAlerts] = useState(true)

  // 4. Portal Appearance Profile States
  const [colorTheme, setColorTheme] = useState('light') 
  const [interfaceDensity, setInterfaceDensity] = useState('comfortable') 

  // 💡 BACKEND TODO: Fetch active admin system configuration documents from database
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        setLoading(true)
        setPlatformName('CampusRide Admin Portal')
        setOperatingHours('06:00 AM - 11:59 PM')
        setRideRadius('5 Miles')
      } catch (err) {
        console.error("Failed downloading master architecture settings profile:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchGlobalSettings()
  }, [])

  const handleSaveChanges = async () => {
    try {
      setLoading(true)
      console.log("Global application settings saved successfully.")
    } catch (err) {
      console.error("Failed persisting system parameters payload:", err)
    } finally {
      setLoading(false)
    }
  }

  // 💡 BACKEND TODO: Trigger local cookie clearing and dispatch redirect state
  const handleImmediateLogout = () => {
    if (!window.confirm("Are you sure you want to end your session and log out of the CampusRide Admin Portal?")) return

    // Clear tokens here (localStorage.removeItem('token'), clear cookies, etc.)
    onLogout?.()
  }

  return (
    <div style={seStyles.workspaceWrapperContainer}>

      {/* HEADER SECTION METADATA */}
      <div style={seStyles.screenHeaderRow}>
        <h2 style={seStyles.screenTitleMainText}>Portal Settings</h2>
        <p style={seStyles.screenSubtitleSupportingText}>
          Manage global system preferences, environment operational variables, network security rules, and interface presentation profiles.
        </p>
      </div>

      {/* TWO-COLUMN CONFIGURATION CANVAS GRID */}
      <div style={seStyles.splitContentRowCanvas}>

        {/* LEFT COLUMN: PRIMARY PLATFORM OPERATIONS */}
        <div style={seStyles.leftWorkspaceMainColumn}>

          {/* SYSTEM PREFERENCES WIDGET CARD */}
          <div style={seStyles.configCardPanel}>
            <div style={seStyles.cardHeaderRow}>
              <Settings size={16} color="#1E3A8A" />
              <h3 style={seStyles.cardBlockTitle}>System Preferences</h3>
            </div>

            <div style={seStyles.formFieldGroupStack}>
              <div style={seStyles.inputUnitBlock}>
                <label style={seStyles.inputLabelFieldTitle}>Platform Name</label>
                <input 
                  type="text" 
                  value={platformName} 
                  onChange={(e) => setPlatformName(e.target.value)} 
                  style={seStyles.standardTextInputField} 
                />
              </div>

              <div style={seStyles.formInlineDoubleRow}>
                <div style={seStyles.inputUnitBlock}>
                  <label style={seStyles.inputLabelFieldTitle}>Campus Operating Hours</label>
                  <div style={seStyles.selectDropdownInteractiveAnchor}>
                    <select 
                      value={operatingHours} 
                      onChange={(e) => setOperatingHours(e.target.value)} 
                      style={seStyles.hiddenNativeSelectInput}
                    >
                      <option value="06:00 AM - 11:59 PM">06:00 AM - 11:59 PM</option>
                      <option value="24 Hours Open">24 Hours Open</option>
                    </select>
                    <ChevronDown size={14} color="#94A3B8" style={seStyles.dropdownOverlayIconChevron} />
                  </div>
                </div>

                <div style={seStyles.inputUnitBlock}>
                  <label style={seStyles.inputLabelFieldTitle}>Default Dispatch Search Radius</label>
                  <div style={seStyles.selectDropdownInteractiveAnchor}>
                    <select 
                      value={rideRadius} 
                      onChange={(e) => setRideRadius(e.target.value)} 
                      style={seStyles.hiddenNativeSelectInput}
                    >
                      <option value="3 Miles">3 Miles</option>
                      <option value="5 Miles">5 Miles</option>
                      <option value="10 Miles">10 Miles</option>
                    </select>
                    <ChevronDown size={14} color="#94A3B8" style={seStyles.dropdownOverlayIconChevron} />
                  </div>
                </div>
              </div>

              <div style={seStyles.interactiveToggleRowStrip}>
                <div style={seStyles.toggleTextStackedGroup}>
                  <span style={seStyles.togglePrimaryTitleText}>Enable Global Dispatch Notifications</span>
                  <span style={seStyles.toggleSecondarySubtitleText}>Broadcast real-time dispatch matching updates to systemic administrator streams.</span>
                </div>
                <button 
                  onClick={() => setEnableRideNotifications(!enableRideNotifications)} 
                  style={{ ...seStyles.toggleTrackBaseSwitch, backgroundColor: enableRideNotifications ? '#1E3A8A' : '#E2E8F0' }}
                >
                  <div style={{ ...seStyles.toggleInnerKnobNodeCircle, transform: enableRideNotifications ? 'translateX(20px)' : 'translateX(2px)' }} />
                </button>
              </div>
            </div>
          </div>

          {/* SECURITY SETTINGS WIDGET CARD */}
          <div style={seStyles.configCardPanel}>
            <div style={seStyles.cardHeaderRow}>
              <Shield size={16} color="#1E3A8A" />
              <h3 style={seStyles.cardBlockTitle}>Security Settings</h3>
            </div>

            <div style={seStyles.formFieldGroupStack}>
              <div style={seStyles.interactiveToggleRowStrip}>
                <div style={seStyles.toggleTextStackedGroup}>
                  <span style={seStyles.togglePrimaryTitleText}>Change Administrative Credential Password</span>
                  <span style={seStyles.toggleSecondarySubtitleText}>Last updated 45 days ago. Periodic token cycle resets recommended.</span>
                </div>
                <button style={seStyles.inlineActionTriggerButton}>Update</button>
              </div>

              <div style={seStyles.interactiveToggleRowStrip}>
                <div style={seStyles.toggleTextStackedGroup}>
                  <span style={seStyles.togglePrimaryTitleText}>Enforce Two-Factor Authentication (MFA)</span>
                  <span style={seStyles.toggleSecondarySubtitleText}>Mandate explicit device code validation profiles upon active admin portal logins.</span>
                </div>
                <button 
                  onClick={() => setTwoFactorAuth(!twoFactorAuth)} 
                  style={{ ...seStyles.toggleTrackBaseSwitch, backgroundColor: twoFactorAuth ? '#1E3A8A' : '#E2E8F0' }}
                >
                  <div style={{ ...seStyles.toggleInnerKnobNodeCircle, transform: twoFactorAuth ? 'translateX(20px)' : 'translateX(2px)' }} />
                </button>
              </div>

              <div style={seStyles.inputUnitBlock}>
                <label style={seStyles.inputLabelFieldTitle}>Session Inactivity Timeout Window</label>
                <div style={seStyles.selectDropdownInteractiveAnchor}>
                  <select 
                    value={sessionTimeout} 
                    onChange={(e) => setSessionTimeout(e.target.value)} 
                    style={seStyles.hiddenNativeSelectInput}
                  >
                    <option value="15 Minutes of inactivity">15 Minutes of inactivity</option>
                    <option value="30 Minutes of inactivity">30 Minutes of inactivity</option>
                    <option value="60 Minutes of inactivity">60 Minutes of inactivity</option>
                  </select>
                  <ChevronDown size={14} color="#94A3B8" style={seStyles.dropdownOverlayIconChevron} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: WEBHOOK & VISUAL PRESENTATION RULES */}
        <div style={seStyles.rightWorkspaceSidebarPanel}>

          {/* NOTIFICATION PREFERENCES */}
          <div style={seStyles.configCardPanel}>
            <div style={seStyles.cardHeaderRow}>
              <Bell size={16} color="#1E3A8A" />
              <h3 style={seStyles.cardBlockTitle}>Notification Preferences</h3>
            </div>

            <div style={seStyles.verticalTogglesStackContainer}>
              <div style={seStyles.compactToggleInlineRow}>
                <span style={seStyles.compactToggleTitleLabelText}>Driver Verification Alerts</span>
                <button 
                  onClick={() => setDriverVerificationAlerts(!driverVerificationAlerts)} 
                  style={{ ...seStyles.toggleTrackBaseSwitchCompact, backgroundColor: driverVerificationAlerts ? '#1E3A8A' : '#E2E8F0' }}
                >
                  <div style={{ ...seStyles.toggleInnerKnobNodeCircleCompact, transform: driverVerificationAlerts ? 'translateX(14px)' : 'translateX(2px)' }} />
                </button>
              </div>

              <div style={seStyles.compactToggleInlineRow}>
                <span style={seStyles.compactToggleTitleLabelText}>Ride Activity Alerts</span>
                <button 
                  onClick={() => setRideActivityAlerts(!rideActivityAlerts)} 
                  style={{ ...seStyles.toggleTrackBaseSwitchCompact, backgroundColor: rideActivityAlerts ? '#1E3A8A' : '#E2E8F0' }}
                >
                  <div style={{ ...seStyles.toggleInnerKnobNodeCircleCompact, transform: rideActivityAlerts ? 'translateX(14px)' : 'translateX(2px)' }} />
                </button>
              </div>

              <div style={seStyles.compactToggleInlineRow}>
                <span style={seStyles.compactToggleTitleLabelText}>Rider Account Alerts</span>
                <button 
                  onClick={() => setRiderActivityAlerts(!riderActivityAlerts)} 
                  style={{ ...seStyles.toggleTrackBaseSwitchCompact, backgroundColor: riderActivityAlerts ? '#1E3A8A' : '#E2E8F0' }}
                >
                  <div style={{ ...seStyles.toggleInnerKnobNodeCircleCompact, transform: riderActivityAlerts ? 'translateX(14px)' : 'translateX(2px)' }} />
                </button>
              </div>

              <div style={seStyles.compactToggleInlineRow}>
                <span style={seStyles.compactToggleTitleLabelText}>System Maintenance Alerts</span>
                <button 
                  onClick={() => setSystemMaintenanceAlerts(!systemMaintenanceAlerts)} 
                  style={{ ...seStyles.toggleTrackBaseSwitchCompact, backgroundColor: systemMaintenanceAlerts ? '#1E3A8A' : '#E2E8F0' }}
                >
                  <div style={{ ...seStyles.toggleInnerKnobNodeCircleCompact, transform: systemMaintenanceAlerts ? 'translateX(14px)' : 'translateX(2px)' }} />
                </button>
              </div>
            </div>
          </div>

          {/* VISUAL APPEARANCE DESIGN SYSTEM */}
          <div style={seStyles.configCardPanel}>
            <div style={seStyles.cardHeaderRow}>
              <Palette size={16} color="#1E3A8A" />
              <h3 style={seStyles.cardBlockTitle}>Appearance</h3>
            </div>

            <div style={seStyles.verticalTogglesStackContainer}>
              <div style={seStyles.radioControlGroupBlock}>
                <span style={seStyles.compactToggleTitleLabelText}>Color Theme</span>
                <div style={seStyles.segmentedControlTrackWrapperFrame}>
                  <button 
                    onClick={() => setColorTheme('light')} 
                    style={{ ...seStyles.segmentOptionTriggerButton, backgroundColor: colorTheme === 'light' ? '#ffffff' : 'transparent', fontWeight: colorTheme === 'light' ? 800 : 500, color: colorTheme === 'light' ? '#1E3A8A' : '#64748B', boxShadow: colorTheme === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => setColorTheme('dark')} 
                    style={{ ...seStyles.segmentOptionTriggerButton, backgroundColor: colorTheme === 'dark' ? '#ffffff' : 'transparent', fontWeight: colorTheme === 'dark' ? 800 : 500, color: colorTheme === 'dark' ? '#1E3A8A' : '#64748B', boxShadow: colorTheme === 'dark' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div style={seStyles.radioControlGroupBlock}>
                <span style={seStyles.compactToggleTitleLabelText}>Interface Density</span>
                <div style={seStyles.segmentedControlTrackWrapperFrame}>
                  <button 
                    onClick={() => setInterfaceDensity('comfortable')} 
                    style={{ ...seStyles.segmentOptionTriggerButton, backgroundColor: interfaceDensity === 'comfortable' ? '#ffffff' : 'transparent', fontWeight: interfaceDensity === 'comfortable' ? 800 : 500, color: interfaceDensity === 'comfortable' ? '#1E3A8A' : '#64748B', boxShadow: interfaceDensity === 'comfortable' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}
                  >
                    Comfortable
                  </button>
                  <button 
                    onClick={() => setInterfaceDensity('compact')} 
                    style={{ ...seStyles.segmentOptionTriggerButton, backgroundColor: interfaceDensity === 'compact' ? '#ffffff' : 'transparent', fontWeight: interfaceDensity === 'compact' ? 800 : 500, color: interfaceDensity === 'compact' ? '#1E3A8A' : '#64748B', boxShadow: interfaceDensity === 'compact' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}
                  >
                    Compact
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. LOWER DESTRUCTIVE SECTION CRITICAL FIELD (DANGER ZONE) */}
      <div style={seStyles.destructiveDangerZoneWrapperCardContainer}>
        <div style={seStyles.dangerCardLeftContentMetadataStack}>
          <div style={seStyles.cardHeaderRow}>
            <AlertTriangle size={14} color="#991B1B" />
            <h4 style={seStyles.dangerHeadingTitleSectionLabelText}>Danger Zone Actions</h4>
          </div>
          <p style={seStyles.dangerParagraphSupportingExplanationBodyText}>Irreversible global infrastructure data actions. Exercising caution remains strongly advised profile wide.</p>
        </div>

        <div style={seStyles.dangerButtonsClusterRowAlignContainer}>
          {/* 🌟 REDESIGNED POWER COMPONENT LAYER: EXPLICIT IMMEDIATE LOCAL ACCOUNT SESSION TERMINATOR */}
          <button style={seStyles.dangerPrimaryActionButtonMarkup} onClick={handleImmediateLogout}>
            <LogOut size={12} /> Exit Portal Session
          </button>
          <button style={seStyles.dangerSecondaryActionButtonMarkup}>Reset System Preferences</button>
        </div>
      </div>

      {/* MASTER SAVE CHANGE FOOTER TOOLBAR */}
      <div style={seStyles.masterActionToolbarFooterRowBase}>
        <button onClick={handleSaveChanges} disabled={loading} style={seStyles.masterSaveActionButtonMarkup}>
          {loading ? <RefreshCw size={14} style={seStyles.spinAnimationClassAsset} /> : 'Save Changes'}
        </button>
        <button style={seStyles.masterCancelActionButtonMarkup}>Cancel</button>
      </div>

    </div>
  )
}

// ── ARRANGED MASTER SETTINGS SYSTEM STYLESHEET ──────────────────────────────
const seStyles = {
  workspaceWrapperContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  screenHeaderRow: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px', 
    textAlign: 'left', 
    marginBottom: '4px' 
  },
  screenTitleMainText: { 
    fontSize: '22px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    margin: 0 
  },
  screenSubtitleSupportingText: { 
    fontSize: '13px', 
    color: '#64748B', 
    fontWeight: 500, 
    margin: 0, 
    lineHeight: '1.4' 
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
    flex: 2.2, 
    gap: '24px', 
    boxSizing: 'border-box' 
  },
  rightWorkspaceSidebarPanel: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px', 
    flex: 1.2, 
    minWidth: '340px', 
    boxSizing: 'border-box' 
  },
  configCardPanel: { 
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
    gap: '10px', 
    width: '100%' 
  },
  cardBlockTitle: { 
    fontSize: '14px', 
    fontWeight: 800, 
    color: '#1E3A8A', 
    margin: 0, 
    textTransform: 'uppercase', 
    letterSpacing: '0.4px', 
    textAlign: 'left' 
  },
  formFieldGroupStack: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '18px', 
    width: '100%' 
  },
  inputUnitBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px', 
    width: '100%', 
    textAlign: 'left' 
  },
  inputLabelFieldTitle: { 
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#64748B', 
    textTransform: 'uppercase', 
    letterSpacing: '0.3px' 
  },
  standardTextInputField: { 
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
  formInlineDoubleRow: { 
    display: 'flex', 
    gap: '16px', 
    width: '100%' 
  },
  selectDropdownInteractiveAnchor: { 
    position: 'relative', 
    width: '100%', 
    display: 'flex', 
    alignItems: 'center' 
  },
  hiddenNativeSelectInput: { 
    width: '100%', 
    boxSizing: 'border-box', 
    backgroundColor: '#F8FAFC', 
    border: '1px solid #E2E8F0', 
    borderRadius: '10px', 
    padding: '10px 36px 10px 14px', 
    fontSize: '13px', 
    color: '#334155', 
    fontWeight: 600, 
    outline: 'none', 
    appearance: 'none', 
    WebkitAppearance: 'none', 
    cursor: 'pointer' 
  },
  dropdownOverlayIconChevron: { 
    position: 'absolute', 
    right: '14px',
    pointerEvents: 'none' 
  },
  interactiveToggleRowStrip: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    gap: '24px', 
    padding: '14px', 
    border: '1px solid #F1F5F9', 
    borderRadius: '12px', 
    backgroundColor: '#FAFCFF', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  toggleTextStackedGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '3px', 
    textAlign: 'left' 
  },
  togglePrimaryTitleText: { 
    fontSize: '13px', 
    fontWeight: 700, 
    color: '#1E293B' 
  },
  toggleSecondarySubtitleText: { 
    fontSize: '11px', 
    color: '#64748B', 
    lineHeight: '1.4', 
    fontWeight: 500 
  },
  toggleTrackBaseSwitch: { 
    width: '42px', 
    height: '22px', 
    borderRadius: '50px', 
    border: 'none', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    padding: 0, 
    transition: 'background-color 0.15s ease', 
    outline: 'none' 
  },
  toggleInnerKnobNodeCircle: { 
    width: '18px', 
    height: '18px', 
    borderRadius: '50%', 
    backgroundColor: '#ffffff', 
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)', 
    transition: 'transform 0.15s ease' 
  },
  inlineActionTriggerButton: { 
    backgroundColor: '#F1F5F9', 
    color: '#475569', 
    border: 'none', 
    borderRadius: '8px', 
    padding: '8px 16px', 
    fontSize: '12px', 
    fontWeight: 700, 
    cursor: 'pointer', 
    outline: 'none' 
  },
  verticalTogglesStackContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '14px', 
    width: '100%' 
  },
  compactToggleInlineRow: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    gap: '16px', 
    padding: '12px 14px', 
    border: '1px solid #F8FAFC', 
    borderRadius: '10px', 
    backgroundColor: '#FAFCFF', 
    textAlign: 'left' 
  },
  compactToggleTitleLabelText: { 
    fontSize: '12px', 
    fontWeight: 700, 
    color: '#334155' 
  },
  toggleTrackBaseSwitchCompact: { 
    width: '34px', 
    height: '18px', 
    borderRadius: '50px', 
    border: 'none', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    padding: 0, 
    transition: 'background-color 0.15s ease', 
    outline: 'none' 
  },
  toggleInnerKnobNodeCircleCompact: { 
    width: '14px', 
    height: '14px', 
    borderRadius: '50%', 
    backgroundColor: '#ffffff', 
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)', 
    transition: 'transform 0.15s ease' 
  },
  radioControlGroupBlock: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px', 
    width: '100%', 
    textAlign: 'left' 
  },
  segmentedControlTrackWrapperFrame: { 
    display: 'flex', 
    backgroundColor: '#F1F5F9', 
    borderRadius: '10px', 
    padding: '4px', 
    gap: '4px', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  segmentOptionTriggerButton: { 
    flex: 1, 
    border: 'none', 
    padding: '8px 0', 
    borderRadius: '7px', 
    fontSize: '11px', 
    cursor: 'pointer', 
    outline: 'none', 
    transition: 'all 0.1s ease' 
  },
  destructiveDangerZoneWrapperCardContainer: { 
    border: '1px solid #FEE2E2', 
    backgroundColor: '#FFF5F5', 
    padding: '24px', 
    borderRadius: '16px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    gap: '32px', 
    width: '100%', 
    boxSizing: 'border-box', 
    marginTop: '8px' 
  },
  dangerCardLeftContentMetadataStack: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px', 
    textAlign: 'left' 
  },
  dangerHeadingTitleSectionLabelText: { 
    fontSize: '13px', 
    fontWeight: 800, 
    color: '#991B1B', 
    margin: 0, 
    textTransform: 'uppercase', 
    letterSpacing: '0.4px' 
  },
  dangerParagraphSupportingExplanationBodyText: { 
    fontSize: '12px', 
    color: '#7F1D1D', 
    margin: 0, 
    fontWeight: 500, 
    lineHeight: '1.4' 
  },
  dangerButtonsClusterRowAlignContainer: { 
    display: 'flex', 
    gap: '12px', 
    alignItems: 'center', 
    flexShrink: 0 
  },
  dangerPrimaryActionButtonMarkup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#E11D48',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(225,29,72,0.1)'
  },
  dangerSecondaryActionButtonMarkup: { 
    backgroundColor: '#FEE2E2', 
    color: '#991B1B', 
    border: '1px solid #FCA5A5', 
    borderRadius: '10px', 
    padding: '10px 16px', 
    fontSize: '12px', 
    fontWeight: 700, 
    cursor: 'pointer', 
    outline: 'none' 
  },
  masterActionToolbarFooterRowBase: { 
    display: 'flex', 
    flexDirection: 'row-reverse', 
    gap: '16px', 
    alignItems: 'center', 
    width: '100%', 
    boxSizing: 'border-box', 
    borderTop: '1px solid #E2E8F0', 
    paddingTop: '24px', 
    marginTop: '12px' 
  },
  masterSaveActionButtonMarkup: { 
    backgroundColor: '#1E3A8A', 
    color: '#ffffff', 
    border: 'none', 
    borderRadius: '12px', 
    padding: '12px 28px', 
    fontSize: '13px', 
    fontWeight: 700, 
    cursor: 'pointer', 
    outline: 'none', 
    boxShadow: '0 1px 3px rgba(30,58,138,0.15)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px' 
  },
  masterCancelActionButtonMarkup: { 
    backgroundColor: '#ffffff', 
    color: '#475569', 
    border: '1px solid #E2E8F0', 
    borderRadius: '12px', 
    padding: '12px 24px', 
    fontSize: '13px', 
    fontWeight: 700, 
    cursor: 'pointer', 
    outline: 'none' 
  },
  spinAnimationClassAsset: { 
    animation: 'spin 1s linear infinite' 
  }
}