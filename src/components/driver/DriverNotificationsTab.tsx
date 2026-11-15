import { useState, useEffect, useRef, useCallback } from 'react'
import type { DriverNotification } from '../../types/driver'
import {
  fetchDriverNotifications,
  markDriverNotificationRead,
  markAllDriverNotificationsRead,
} from '../../services/api'

interface DriverNotificationsTabProps {
  onUnreadCountChange: (count: number) => void
}

export default function DriverNotificationsTab({
  onUnreadCountChange,
}: DriverNotificationsTabProps) {
  const [notifications, setNotifications] = useState<DriverNotification[]>([])
  const [totalNotifications, setTotalNotifications] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const limit = 10
  const fetchGenRef = useRef(0)

  const formatIST = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    } catch {
      return dateStr
    }
  }

  const loadNotifications = useCallback(() => {
    const currentGen = ++fetchGenRef.current
    const skip = (page - 1) * limit

    fetchDriverNotifications(skip, limit)
      .then((res: { notifications?: DriverNotification[]; total?: number }) => {
        if (fetchGenRef.current !== currentGen) return
        const list: DriverNotification[] = res.notifications || (Array.isArray(res) ? res : [])
        const total = res.total ?? list.length
        setNotifications(list)
        setTotalNotifications(total)
        const unreadCount = list.filter((n) => !n.is_read).length
        onUnreadCountChange(unreadCount)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (fetchGenRef.current !== currentGen) return
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
        setLoading(false)
      })
  }, [page, onUnreadCountChange])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleMarkAllRead = async () => {
    try {
      await markAllDriverNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      onUnreadCountChange(0)
    } catch (err: unknown) {
      console.error('Failed to mark all notifications read:', err)
    }
  }

  const handleNotificationClick = async (notif: DriverNotification) => {
    if (notif.is_read) return

    try {
      await markDriverNotificationRead(notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
      const currentUnread = notifications.filter((n) => !n.is_read && n.id !== notif.id).length
      onUnreadCountChange(currentUnread)
    } catch (err: unknown) {
      console.error('Failed to mark notification read:', err)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalNotifications / limit))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header card with action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, margin: 0, color: 'var(--color-primary)' }}>Notifications</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
            System dispatches, schedule alerts, and administrative messages
          </p>
        </div>

        <button
          type="button"
          className="vh-btn vh-btn-secondary"
          onClick={handleMarkAllRead}
          disabled={loading || notifications.every((n) => n.is_read)}
          style={{ fontSize: 13, padding: '7px 16px' }}
        >
          ✓ Mark All Read
        </button>
      </div>

      {/* Notifications list */}
      <div className="driver-card" style={{ padding: 18 }}>
        {loading ? (
          <div className="vh-state-box">
            <div className="vh-spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box">
            <h4>Unable to Load Notifications</h4>
            <p>{error}</p>
          </div>
        ) : notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map((notif) => {
              const isUnread = !notif.is_read
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    borderLeft: isUnread
                      ? '5px solid var(--color-accent, #8CA832)'
                      : '1px solid var(--color-border)',
                    backgroundColor: isUnread
                      ? 'var(--color-warning-bg, #FEF7EC)'
                      : 'var(--color-card-bg, #FFFFFF)',
                    cursor: isUnread ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong
                        style={{
                          fontSize: 14.5,
                          color: 'var(--color-text)',
                          fontWeight: isUnread ? 800 : 600,
                        }}
                      >
                        {notif.title}
                      </strong>
                      {isUnread && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-accent)',
                          }}
                        />
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="vh-badge vh-badge--neutral" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                        {notif.category}
                      </span>
                      <span
                        className="vh-badge"
                        style={{
                          fontSize: 11,
                          textTransform: 'capitalize',
                          background: notif.priority === 'high' || notif.priority === 'urgent'
                            ? 'var(--color-error-bg)'
                            : 'var(--color-info-bg)',
                          color: notif.priority === 'high' || notif.priority === 'urgent'
                            ? 'var(--color-error)'
                            : 'var(--color-info)',
                        }}
                      >
                        {notif.priority}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>

                  <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {formatIST(notif.created_at)}
                  </div>
                </div>
              )
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 8,
                  paddingTop: 12,
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Page {page} of {totalPages}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="vh-btn vh-btn-secondary"
                    disabled={page <= 1}
                    onClick={() => {
                      setLoading(true)
                      setPage((p) => Math.max(1, p - 1))
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="vh-btn vh-btn-secondary"
                    disabled={page >= totalPages}
                    onClick={() => {
                      setLoading(true)
                      setPage((p) => Math.min(totalPages, p + 1))
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="driver-empty-state">
            <div className="driver-empty-icon">🔔</div>
            <h3>No notifications yet</h3>
            <p>You have caught up with all transit and management announcements.</p>
          </div>
        )}
      </div>
    </div>
  )
}
