import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Car, 
  ShieldCheck, 
  ShieldAlert,
  Users, 
  BarChart3, 
  Bell, 
  Settings 
} from 'lucide-react'
import api from '../api/axios'

const NAV_ITEMS = [
  { id: 'dashboard',           label: 'Dashboard',           icon: LayoutDashboard },
  { id: 'safety',              label: 'Safety & SOS',        icon: ShieldAlert },
  { id: 'trips',               label: 'Trips',               icon: Car },
  { id: 'driver-verification', label: 'Driver Verification', icon: ShieldCheck },
  { id: 'user-directory',      label: 'User Directory',      icon: Users }, 
  { id: 'analytics',           label: 'Analytics',           icon: BarChart3 },
  { id: 'notifications',       label: 'Notifications',       icon: Bell },
  { id: 'settings',            label: 'Settings',            icon: Settings },
]

export default function Sidebar({ activePage = 'dashboard', onNavigate, unreadCount = 0 }) {
  const [hoveredItemId, setHoveredItemId] = useState(null)
  const [isProfileHovered, setIsProfileHovered] = useState(false)

  const [adminUser, setAdminUser] = useState({
    name: 'Administrator',
    role: 'System Administrator',
    initials: 'AD'
  })

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'AD'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  useEffect(() => {
    const fetchAdminSession = async () => {
      try {
        const res = await api.get('/auth/profile')
        if (res.data?.success && res.data?.data?.user) {
          const user = res.data.data.user
          setAdminUser({
            name: user.fullName || 'Campus Administrator',
            role: 'System Administrator',
            initials: getInitials(user.fullName)
          })
        }
      } catch (err) {
        console.warn('Could not fetch admin session profile:', err?.message)
      }
    }
    fetchAdminSession()
  }, [])

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <span style={styles.brandName}>CampusRide</span>
        <span style={styles.brandSub}>ADMIN PORTAL</span>
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = activePage === item.id
          const isHovered = hoveredItemId === item.id
          const IconComponent = item.icon

          let bg = 'transparent'
          let color = 'rgba(255,255,255,0.72)'

          if (active) {
            bg = '#2563EB'
            color = '#ffffff'
          } else if (isHovered) {
            bg = 'rgba(37, 99, 235, 0.35)'
            color = '#ffffff'
          }

          return (
            <button
              key={item.id}
              style={{ ...styles.navItem, backgroundColor: bg }}
              onClick={() => onNavigate?.(item.id)}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <IconComponent
                size={18}
                strokeWidth={2.2}
                color={color}
                style={styles.uiTransition}
              />
              <span style={{
                ...styles.navLabel,
                color,
                fontWeight: active || isHovered ? 700 : 500
              }}>
                {item.label}
              </span>

              {item.id === 'notifications' && unreadCount > 0 && (
                <span style={styles.navBadge}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <button
        style={{
          ...styles.adminSectionButton,
          backgroundColor: isProfileHovered ? 'rgba(37, 99, 235, 0.35)' : 'transparent'
        }}
        onClick={() => onNavigate?.('admin-profile')}
        onMouseEnter={() => setIsProfileHovered(true)}
        onMouseLeave={() => setIsProfileHovered(false)}
      >
        <div style={styles.adminAvatar}>{adminUser.initials}</div>
        <div style={styles.adminInfo}>
          <span style={styles.adminName}>{adminUser.name}</span>
          <span style={styles.adminRole}>{adminUser.role}</span>
        </div>
      </button>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: '240px',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #1E3A8A 0%, #1E40AF 55%, #172554 100%)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    borderRight: '1px solid rgba(37, 99, 235, 0.25)'
  },
  brand: {
    padding: '24px 20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  brandName: {
    fontSize: '20px',
    fontWeight: 900,
    color: '#ffffff',
    letterSpacing: '-0.5px',
    fontFamily: 'Inter, sans-serif'
  },
  brandSub: {
    fontSize: '9px',
    fontWeight: 800,
    color: 'rgba(191, 219, 254, 0.75)',
    letterSpacing: '1.5px',
    fontFamily: 'Inter, sans-serif'
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 12px',
    gap: '4px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    outline: 'none',
    boxShadow: 'none',
    userSelect: 'none',
    transition: 'background-color 0.15s ease'
  },
  navLabel: {
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    transition: 'color 0.15s ease',
    flex: 1
  },
  navBadge: {
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    borderRadius: 9,
    backgroundColor: '#F43F5E',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1
  },
  uiTransition: {
    transition: 'color 0.15s ease'
  },
  adminSectionButton: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    outline: 'none',
    transition: 'background-color 0.15s ease'
  },
  adminAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: 'Inter, sans-serif',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.15)'
  },
  adminInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    overflow: 'hidden'
  },
  adminName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff'
  },
  adminRole: {
    fontSize: '10px',
    fontWeight: 500,
    color: 'rgba(191, 219, 254, 0.8)'
  }
}