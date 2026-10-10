import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import DashboardScreen from './screens/DashboardScreen'
import SafetyScreen from './screens/SafetyScreen'
import DriverVerificationScreen from './screens/VerificationScreen'
import TripsMonitoringScreen from './screens/TripsMonitoringScreen'
import StudentsManagementScreen from './screens/UserDirectoryScreen'
import AnalyticsScreen from './screens/AnalyticsScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import SettingsScreen from './screens/SettingsScreen'
import AdminProfileScreen from './screens/AdminProfileScreen'
import LoginScreen from './screens/LoginScreen'
import { Search, Bell } from 'lucide-react'
import api from './api/axios'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [currentDateTime, setCurrentDateTime] = useState('')
  const [sessionLoading, setSessionLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

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

  // Fetch unread notification count badge
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/admin/notifications/snapshot')
        if (res.data?.success && res.data?.data) {
          const notes = res.data.data.notifications || []
          const count = notes.filter((n) => n && n.isRead !== true && n.read !== true).length
          setUnreadCount(count)
        }
      } catch (err) {
        console.warn('Failed to load unread count')
      }
    }
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Administrative Session Guard Verification
  useEffect(() => {
    const verifyAdminSessionToken = async () => {
      try {
        setSessionLoading(true)
        const token = localStorage.getItem('adminToken')
        if (token) {
          const response = await api.get('/auth/profile')
          if (response.data?.success && response.data?.data?.user?.role === 'admin') {
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem('adminToken')
            setIsAuthenticated(false)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (err) {
        console.error("Unauthorized administrative intercept. Redirecting to login session.", err)
        localStorage.removeItem('adminToken')
        setIsAuthenticated(false)
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

  // GATING INTERCEPT: Deflect session tracking pathways down to login mask if unverified
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div style={appStyles.appFrame}>
      {/* GLOBAL LEFT SIDEBAR NAVIGATION */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} unreadCount={unreadCount} />

      {/* MAIN CONTENT VIEWPORT */}
      <main style={appStyles.mainViewport}>
        <header style={appStyles.header}>
          <div style={appStyles.headerLeftContainer}>
            <h2 style={appStyles.headerTitle}>
              {activePage === 'dashboard' 
                ? 'Dashboard' 
                : activePage === 'safety'
                ? 'Safety & SOS Emergency Receiver'
                : activePage === 'driver-verification'
                ? 'Driver Verification'
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
            <button 
              style={appStyles.bellButton} 
              onClick={() => setActivePage('notifications')} 
              aria-label="Open Alerts Feed View"
            >
              <Bell size={16} strokeWidth={2.5} color="#64748B" />
              {unreadCount > 0 && (
                <div style={appStyles.badgeIndicatorBubble}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* INNER SCREEN CANVAS FRAME LAYER */}
        <div style={appStyles.contentCanvas}>
          {activePage === 'dashboard' && <DashboardScreen />}
          {activePage === 'safety' && <SafetyScreen />}
          {activePage === 'driver-verification' && <DriverVerificationScreen />}
          {activePage === 'trips' && <TripsMonitoringScreen />}
          {activePage === 'user-directory' && <StudentsManagementScreen />}
          {activePage === 'analytics' && <AnalyticsScreen />} 
          {activePage === 'notifications' && (<NotificationsScreen onNavigate={setActivePage} />)}          
          {activePage === 'settings' && <SettingsScreen onLogout={() => setIsAuthenticated(false)} />}
          {activePage === 'admin-profile' && <AdminProfileScreen />}

          {/* FALLBACK SAFEGUARD BLOCK */}
          {!['dashboard', 'safety', 'driver-verification', 'trips', 'user-directory', 'analytics', 'notifications', 'settings', 'admin-profile'].includes(activePage) && (
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
    position: 'relative',
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
  badgeIndicatorBubble: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#E11D48',
    color: '#ffffff',
    fontSize: '9px',
    fontWeight: 800,
    height: '14px',
    minWidth: '14px',
    padding: '0 3px',
    borderRadius: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #ffffff',
    boxSizing: 'content-box'
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
    color: '#2563EB', // Updated to clean blue
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