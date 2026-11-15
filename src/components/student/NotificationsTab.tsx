import { useState, useEffect } from 'react'
import type { NotificationItem } from '../../types/student'
import {
  fetchStudentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/api'
import { BellIcon, CheckCircleIcon } from '../common/Icons'

interface NotificationsTabProps {
  onRefreshParentUnread?: () => void
}

type FilterType = 'all' | 'unread' | 'read' | 'important' | 'emergency'

export default function NotificationsTab({ onRefreshParentUnread }: NotificationsTabProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    fetchStudentNotifications(filter === 'all' ? undefined : filter)
      .then((res) => {
        if (!isMounted) return
        setNotifications(res.items)
        setUnreadCount(res.unread_count)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Unable to load notifications')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [filter, reloadKey])

  async function handleMarkRead(id: number) {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
      onRefreshParentUnread?.()
    } catch {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      onRefreshParentUnread?.()
    } catch {
      // ignore
    }
  }

  function formatTime(isoStr: string) {
    try {
      const d = new Date(isoStr)
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } catch {
      return isoStr
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Filter Pills with Transparent Ambient Glow */}
        <div className="student-filter-row" style={{ margin: 0 }}>
          {(['all', 'unread', 'read', 'important', 'emergency'] as FilterType[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`student-filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => {
                setLoading(true)
                setFilter(f)
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="vh-btn vh-btn-secondary"
            style={{ fontSize: 12, padding: '6px 14px' }}
            onClick={handleMarkAllRead}
          >
            <CheckCircleIcon size={14} /> Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="student-card" style={{ padding: 18 }}>
        {loading ? (
          <div className="vh-state-box" style={{ padding: '36px 12px' }}>
            <div className="vh-spinner" />
            <p>Fetching your transit notifications...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box" style={{ padding: '36px 12px' }}>
            <h4>Unable to Load Notifications</h4>
            <p>{error}</p>
            <button
              type="button"
              className="vh-btn vh-btn-primary"
              onClick={() => {
                setLoading(true)
                setError(null)
                setReloadKey((k) => k + 1)
              }}
            >
              Retry
            </button>
          </div>
        ) : notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 10,
                  background: n.is_read ? '#FFFFFF' : 'rgba(120, 132, 59, 0.08)',
                  border: `1px solid ${n.is_read ? 'var(--srm-border)' : 'rgba(120, 132, 59, 0.35)'}`,
                  boxShadow: n.is_read ? 'none' : '0 2px 10px var(--srm-olive-glow)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!n.is_read && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--srm-olive)',
                          boxShadow: '0 0 6px var(--srm-olive)',
                        }}
                      />
                    )}
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--srm-navy)' }}>
                      {n.title}
                    </span>
                    <span
                      className={`vh-badge ${
                        n.priority === 'emergency'
                          ? 'vh-badge--error'
                          : n.priority === 'important'
                          ? 'vh-badge--warning'
                          : 'vh-badge--neutral'
                      }`}
                    >
                      {n.priority}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--srm-text-light)' }}>
                      {formatTime(n.created_at)}
                    </span>
                    {!n.is_read && (
                      <button
                        type="button"
                        className="vh-btn vh-btn-ghost"
                        style={{ fontSize: 11, padding: '2px 8px' }}
                        onClick={() => handleMarkRead(n.id)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--srm-text-dark)', lineHeight: 1.5 }}>
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--srm-text-muted)' }}>
            <BellIcon size={32} style={{ color: 'var(--srm-text-light)', marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13.5 }}>No notifications found under this filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}

