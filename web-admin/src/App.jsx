import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import DashboardScreen from './screens/DashboardScreen'
import DriverVerificationScreen from './screens/VerificationScreen'
import TripsMonitoringScreen from './screens/TripsMonitoringScreen'
import StudentsManagementScreen from './screens/UserDirectoryScreen'
import AnalyticsScreen from './screens/AnalyticsScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import SettingsScreen from './screens/SettingsScreen'
import AdminProfileScreen from './screens/AdminProfileScreen'
import LoginScreen from './screens/LoginScreen' // 🌟 1. Imported the gateway security checkpoint component
import { Search, Bell } from 'lucide-react'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [currentDateTime, setCurrentDateTime] = useState('')
  const [sessionLoading, setSessionLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false) // 🌟 2. Added master state tracker to gate portal access

  // Dynamic Real-Time Status Clock Update Loop
  useEffect(() => {
    const updateSystemClock = () => {
      const now = new Date()
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      const dateString = now.toLocaleDateString('en-US', options)
      const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      setCurrentDateTime(`${dateString} • ${timeString}`)
    }

    updateSystemClock()
    const timerInterval = setInterval(updateSystemClock, 60000)
    return () => clearInterval(timerInterval)
  }, [])

  // 1. 💡 BACKEND TODO: Enforce Global Administrative Session Guard Verification
  useEffect(() => {
    const verifyAdminSessionToken = async () => {
      try {
        setSessionLoading(true)

        // 💡 BACKEND PRODUCTION ROUTE: Check cookie token context on initial hydration mount
        // const response = await fetch('/api/v1/auth/verify-session')
        // if (response.ok) { setIsAuthenticated(true) }

        // Staging Framework Toggle (Auto-resolves loading state to expose login screen)
        setIsAuthenticated(false) 
      } catch (err) {
        console.error("Unauthorized administrative intercept. Redirecting to login session.", err)
      } finally {
        setSessionLoading(false)
      }
    }

    verifyAdminSessionToken()
  }, [])

  if (sessionLoading) {
    return (
      <div style={appStyles.appFrameLoading}>
        <span style={appStyles.loadingTextFont}>Authorizing Secure Session Handshake Tokens...</span>
      </div>
    )
  }

  // 🔒 GATING INTERCEPT: Deflect session tracking pathways down to login mask if unverified
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div style={appStyles.appFrame}>
      {/* GLOBAL LEFT SIDEBAR NAVIGATION */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* MAIN CONTENT VIEWPORT */}
      <main style={appStyles.mainViewport}>
        <header style={appStyles.header}>
          <div style={appStyles.headerLeftContainer}>
            <h2 style={appStyles.headerTitle}>
              {activePage === 'dashboard' 
                ? 'Dashboard' 
                : activePage === 'trips' 
                ? 'Trips Monitoring' 
                : activePage === 'user-directory'
                ? 'User Directory'
                : activePage === 'analytics'
                ? 'Analytics' 
                : activePage === 'notifications'
                ? 'Notifications'
                : activePage === 'settings'
                ? 'Settings'
                : activePage === 'admin-profile'
                ? 'Admin Profile' 
                : activePage.replace('-', ' ')}
            </h2>
            <div style={appStyles.searchBar}>
              <Search size={14} strokeWidth={2.5} color="#94A3B8" />
              <input type="text" placeholder="Search trips, drivers, users..." style={appStyles.searchInput} />
            </div>
          </div>

          <div style={appStyles.headerRightContainer}>
            <div style={appStyles.dateBlock}>
              <p style={appStyles.dateLabel}>TODAY'S DATE</p>
              <p style={appStyles.dateValue}>{currentDateTime || 'Loading live time...'}</p>
            </div>
            <button style={appStyles.bellButton} onClick={() => setActivePage('notifications')} aria-label="Open Alerts Feed View">
              <Bell size={16} strokeWidth={2.5} color="#64748B" />
            </button>
          </div>
        </header>

        {/* INNER SCREEN CANVAS FRAME LAYER */}
        <div style={appStyles.contentCanvas}>
          {activePage === 'dashboard' && <DashboardScreen />}
          {activePage === 'driver-verification' && <DriverVerificationScreen />}
          {activePage === 'trips' && <TripsMonitoringScreen />}
          {activePage === 'user-directory' && <StudentsManagementScreen />}
          {activePage === 'analytics' && <AnalyticsScreen />} 
          {activePage === 'notifications' && <NotificationsScreen />} 
          {activePage === 'settings' && <SettingsScreen />}
          {activePage === 'admin-profile' && <AdminProfileScreen />}

          {/* FALLBACK SAFEGUARD BLOCK */}
          {!['dashboard', 'driver-verification', 'trips', 'user-directory', 'analytics', 'notifications', 'settings', 'admin-profile'].includes(activePage) && (
            <div style={appStyles.fallbackBox}>
              <h3 style={appStyles.fallbackTitle}>{activePage.replace('-', ' ')} Shell</h3>
              <p style={appStyles.fallbackDesc}>Global inline framework operating successfully.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ── ARRANGED MASTER STYLE SHEET SHEET WITH DOUBLE SPACE INDENTS ──────────────
const appStyles = {
  appFrame: {
    display: 'flex',
    position: 'fixed',
    inset: 0,
    height: '100vh',
    width: '100vw',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box'
  },
  appFrameLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#F8FAFC'
  },
  loadingTextFont: {
    fontSize: '14px',
    color: '#1E3A8A',
    fontWeight: 700,
    fontFamily: 'Inter, sans-serif'
  },
  bellButton: {
    height: '32px',
    width: '32px',
    borderRadius: '12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: 'none'
  },
  contentCanvas: {
    flex: 1,
    padding: '32px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  dateBlock: {
    textAlign: 'right'
  },
  dateLabel: {
    fontSize: '9px',
    fontWeight: 800,
    color: '#94A3B8',
    letterSpacing: '1px',
    margin: 0,
    fontFamily: 'Inter, sans-serif'
  },
  dateValue: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155',
    margin: '2px 0 0 0',
    fontFamily: 'Inter, sans-serif'
  },
  fallbackBox: {
    height: '384px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  fallbackDesc: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 500,
    marginTop: '8px'
  },
  fallbackTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
    textTransform: 'capitalize',
    margin: 0
  },
  header: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #E2E8F0',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  },
  headerLeftContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  headerRightContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#1E293B',
    textTransform: 'capitalize',
    fontFamily: 'Inter, sans-serif',
    margin: 0
  },
  mainViewport: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 'calc(100vw - 240px)',
    height: '100vh',
    overflowX: 'hidden'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#F8FAFC',
    padding: '8px 14px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    width: '320px'
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '12px',
    color: '#334155',
    width: '100%',
    fontFamily: 'Inter, sans-serif'
  }
}