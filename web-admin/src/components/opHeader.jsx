import React, { useState, useEffect } from 'react'
import { Search, Bell } from 'lucide-react'

export default function TopHeader({ activePage = 'dashboard', onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentDateTime, setCurrentDateTime] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  // 1. Dynamic Live Real-Time System Clock Sync Loop
  useEffect(() => {
    const updateHeaderClock = () => {
      const now = new Date()
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      const dateString = now.toLocaleDateString('en-US', options)
      const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      setCurrentDateTime(`${dateString} • ${timeString}`)
    }

    updateHeaderClock()
    const clockInterval = setInterval(updateHeaderClock, 60000)
    return () => clearInterval(clockInterval)
  }, [])

  // 2. 💡 BACKEND TODO: Real-Time Notifications Initial Fetch & WebSocket Event Connection
  useEffect(() => {
    // axios.get('/api/v1/admin/notifications/unread-count').then(res => setUnreadCount(res.data.count))
    // socket.on('notification_received', () => setUnreadCount(prev => prev + 1))
    setUnreadCount(4) // Staging Mock Parameter
  }, [])

  // 3. 💡 BACKEND TODO: Implement Debounced Multi-Collection Global Text Search Query Handler
  useEffect(() => {
    if (!searchQuery) return
    const delayDebounceFn = setTimeout(() => {
      // axios.get(`/api/v1/admin/search?query=${searchQuery}`).then(res => { dispatchSearchEvent(res.data) })
      console.log(`Global omnibox search query dispatched: ${searchQuery}`)
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.leftContainer}>
        <h2 style={headerStyles.title}>
          {activePage === 'dashboard' 
            ? 'Dashboard' 
            : activePage === 'user-directory' 
            ? 'User Directory'
            : activePage.replace('-', ' ')}
        </h2>

        <div style={headerStyles.searchBar}>
          <Search size={14} strokeWidth={2.5} color="#94A3B8" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips, drivers, students..." 
            style={headerStyles.input} 
          />
        </div>
      </div>

      <div style={headerStyles.rightContainer}>
        <div style={headerStyles.dateBlock}>
          <p style={headerStyles.dateLabel}>TODAY'S DATE</p>
          <p style={headerStyles.dateValue}>{currentDateTime || 'Syncing live clock...'}</p>
        </div>

        <button 
          onClick={() => onNavigate?.('notifications')}
          style={headerStyles.bellButton}
          aria-label="View Notification Feed Panels"
        >
          <Bell size={16} strokeWidth={2.5} color="#64748B" />
          {unreadCount > 0 && (
            <div style={headerStyles.badgeIndicatorBubble}>
              {unreadCount}
            </div>
          )}
        </button>
      </div>
    </header>
  )
}

// ── ARRANGED MASTER HEADER SYSTEM STYLESHEET ─────────────────────────────────
const headerStyles = {
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
  leftContainer: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '24px' 
  },
  title: { 
    fontSize: '18px', 
    fontWeight: 800, 
    color: '#1E293B', 
    textTransform: 'capitalize', 
    fontFamily: 'Inter, sans-serif', 
    margin: 0 
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
  input: { 
    background: 'transparent', 
    border: 'none', 
    outline: 'none', 
    fontSize: '12px', 
    color: '#334155', 
    width: '100%', 
    fontFamily: 'Inter, sans-serif' 
  },
  rightContainer: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px' 
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
    backgroundColor: '#DC2626',
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
  }
}