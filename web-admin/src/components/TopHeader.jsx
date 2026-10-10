import React, { useState, useEffect, useCallback } from 'react'
import { Search, Bell } from 'lucide-react'
import api from '../api/axios'

export default function TopHeader({ activePage = 'dashboard', onNavigate, onUnreadChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentDateTime, setCurrentDateTime] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

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

  const fetchUnreadCount = useCallback(async () => {
    try {
      // Prefer dedicated endpoint if you add it later
      try {
        const countRes = await api.get('/admin/notifications/unread-count')
        if (countRes.data?.success && typeof countRes.data?.data?.count === 'number') {
          const count = countRes.data.data.count
          setUnreadCount(count)
          onUnreadChange?.(count)
          return
        }
        if (typeof countRes.data?.count === 'number') {
          setUnreadCount(countRes.data.count)
          onUnreadChange?.(countRes.data.count)
          return
        }
      } catch {
        // fallback to snapshot
      }

      const res = await api.get(`/admin/notifications/snapshot?t=${Date.now()}`)
      if (res.data?.success && res.data?.data) {
        const notes = res.data.data.notifications || []
        const count = notes.filter(
          (n) => n && n.isRead !== true && n.read !== true
        ).length
        setUnreadCount(count)
        onUnreadChange?.(count)
      }
    } catch (err) {
      console.warn('Failed to load unread notifications:', err?.message)
    }
  }, [onUnreadChange])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Refresh when user opens notifications
  useEffect(() => {
    if (activePage === 'notifications') {
      fetchUnreadCount()
    }
  }, [activePage, fetchUnreadCount])

  useEffect(() => {
    if (!searchQuery.trim()) return
    const t = setTimeout(() => {
      console.log(`Search query: ${searchQuery}`)
      // wire global search later
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const pageTitle =
    activePage === 'dashboard'
      ? 'Dashboard'
      : activePage === 'user-directory'
      ? 'User Directory'
      : activePage === 'driver-verification'
      ? 'Driver Verification'
      : activePage.replace(/-/g, ' ')

  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.leftContainer}>
        <h2 style={headerStyles.title}>{pageTitle}</h2>

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
          aria-label="View notifications"
        >
          <Bell size={16} strokeWidth={2.5} color="#64748B" />
          {unreadCount > 0 && (
            <div style={headerStyles.badgeIndicatorBubble}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </button>
      </div>
    </header>
  )
}

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
  }
}