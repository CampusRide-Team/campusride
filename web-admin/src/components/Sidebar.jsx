import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Car, 
  ShieldCheck, 
  Users, 
  BarChart3, 
  Bell, 
  Settings 
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard',           label: 'Dashboard',           icon: LayoutDashboard },
  { id: 'trips',               label: 'Trips',               icon: Car },
  { id: 'driver-verification', label: 'Driver Verification', icon: ShieldCheck },
  { id: 'user-directory',      label: 'User Directory',      icon: Users }, 
  { id: 'analytics',           label: 'Analytics',           icon: BarChart3 },
  { id: 'notifications',       label: 'Notifications',       icon: Bell },
  { id: 'settings',            label: 'Settings',            icon: Settings },
]

export default function Sidebar({ activePage = 'dashboard', onNavigate }) {
  const [hoveredItemId, setHoveredItemId] = useState(null)
  const [isProfileHovered, setIsProfileHovered] = useState(false)

  // Dynamic Admin Profile State
  const [adminUser, setAdminUser] = useState({
    name: 'Syncing Account...',
    role: 'System Administrator',
    initials: '..'
  })

  // 1. 💡 BACKEND TODO: Authenticated Session Context Ingestion Layer
  useEffect(() => {
    // axios.get('/api/v1/auth/session')
    //   .then(res => {
    //     setAdminUser({
    //       name: res.data.user.fullName,
    //       role: res.data.user.roleTitle,
    //       initials: res.data.user.initialsToken
    //     })
    //   })
    //   .catch(err => console.error("Session missing or token expired:", err))

    // Staging Mock Session Document Tally
    setAdminUser({
      name: 'Dr. Julian Vance',
      role: 'System Administrator',
      initials: 'JV'
    })
  }, [])

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brand}>
        <span style={styles.brandName}>CampusRide</span>
        <span style={styles.brandSub}>ADMIN PORTAL</span>
      </div>

      {/* Navigation Options Links Stack */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = activePage === item.id
          const isHovered = hoveredItemId === item.id
          const IconComponent = item.icon

          let currentBgColor = 'transparent'
          let currentTextColor = '#64748B'

          if (active) {
            currentBgColor = '#1E3A8A'
            currentTextColor = '#ffffff'
          } else if (isHovered) {
            currentBgColor = '#E2E8F0'
            currentTextColor = '#1E3A8A'
          }

          return (
            <button
              key={item.id}
              style={{ 
                ...styles.navItem, 
                backgroundColor: currentBgColor 
              }}
              onClick={() => onNavigate?.(item.id)}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <IconComponent 
                size={18} 
                strokeWidth={2.5} 
                color={currentTextColor} 
                style={styles.uiTransition}
              />
              <span style={{ 
                ...styles.navLabel, 
                color: currentTextColor, 
                fontWeight: active || isHovered ? 700 : 600 
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* USER PROFILE SECTION CONTAINER */}
      <button 
        style={{ 
          ...styles.adminSectionButton,
          backgroundColor: isProfileHovered ? '#F1F5F9' : 'transparent'
        }}
        onClick={() => onNavigate?.('admin-profile')} // 🌟 Modified token value string key to point to the dedicated blueprint profile component canvas view
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

// ── ARRANGED CSS STYLESHEET MAP OBJECT WITH CLEAN INDENTS ────────────────────
const styles = {
  sidebar: { 
    width: '240px', 
    minHeight: '100vh', 
    backgroundColor: '#ffffff', 
    borderRight: '1px solid #E2E8F0', 
    display: 'flex', 
    flexDirection: 'column', 
    flexShrink: 0 
  },
  brand: { 
    padding: '24px 24px 16px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '2px' 
  },
  brandName: { 
    fontSize: '20px', 
    fontWeight: 900, 
    color: '#1E3A8A', 
    letterSpacing: '-0.5px', 
    fontFamily: 'Inter, sans-serif' 
  },
  brandSub: { 
    fontSize: '9px', 
    fontWeight: 800, 
    color: '#94A3B8', 
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
    WebkitTapHighlightColor: 'transparent',
    transition: 'background-color 0.15s ease' 
  },
  navLabel: { 
    fontSize: '13px', 
    fontFamily: 'Inter, sans-serif',
    transition: 'color 0.15s ease'
  },
  uiTransition: {
    transition: 'color 0.15s ease'
  },
  adminSectionButton: { 
    padding: '16px 20px', 
    borderTop: '1px solid #F1F5F9', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    outline: 'none',
    boxShadow: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'background-color 0.15s ease'
  },
  adminAvatar: { 
    width: '36px', 
    height: '36px', 
    borderRadius: '50%', 
    backgroundColor: '#1E3A8A', 
    color: '#ffffff', 
    fontSize: '12px', 
    fontWeight: 700, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexShrink: 0, 
    fontFamily: 'Inter, sans-serif' 
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
    color: '#1E293B' 
  },
  adminRole: { 
    fontSize: '10px', 
    fontWeight: 500, 
    color: '#94A3B8' 
  }
}