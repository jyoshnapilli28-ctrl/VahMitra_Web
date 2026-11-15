import { useState, useEffect } from 'react'
import type { DirectMessageItem } from '../../types/student'
import {
  fetchStudentMessages,
  markStudentMessageRead,
  markAllStudentMessagesRead,
  deleteStudentMessage,
} from '../../services/api'
import { MessageSquareIcon, CheckCircleIcon, TrashIcon } from '../common/Icons'

interface MessagesTabProps {
  onRefreshParentUnread?: () => void
}

type MessageFilter = 'all' | 'unread' | 'management' | 'driver'

export default function MessagesTab({ onRefreshParentUnread }: MessagesTabProps) {
  const [messages, setMessages] = useState<DirectMessageItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState<MessageFilter>('all')
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchStudentMessages()
      .then((res) => {
        if (!isMounted) return
        setMessages(res.messages)
        setUnreadCount(res.unread_count)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Unable to load direct messages.')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [reloadKey])

  async function handleSelectMessage(msg: DirectMessageItem) {
    if (selectedMessageId === msg.id) {
      setSelectedMessageId(null)
      return
    }

    setSelectedMessageId(msg.id)

    if (!msg.is_read) {
      try {
        await markStudentMessageRead(msg.id)
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
        onRefreshParentUnread?.()
      } catch {
        // Non-blocking UI update
      }
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllStudentMessagesRead()
      setMessages((prev) =>
        prev.map((m) => ({ ...m, is_read: true, read_at: m.read_at || new Date().toISOString() }))
      )
      setUnreadCount(0)
      onRefreshParentUnread?.()
    } catch {
      // Non-blocking
    }
  }

  async function handleDeleteMessage(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this message from your inbox?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteStudentMessage(id)
      const target = messages.find((m) => m.id === id)
      if (target && !target.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1))
        onRefreshParentUnread?.()
      }
      setMessages((prev) => prev.filter((m) => m.id !== id))
      if (selectedMessageId === id) {
        setSelectedMessageId(null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete message.')
    } finally {
      setDeletingId(null)
    }
  }

  function formatTime(isoStr: string) {
    try {
      const d = new Date(isoStr)
      return `${d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} at ${d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    } catch {
      return isoStr
    }
  }

  const filteredMessages = messages.filter((m) => {
    if (filter === 'unread') return !m.is_read
    if (filter === 'management') return m.sender_role === 'management'
    if (filter === 'driver') return m.sender_role === 'driver'
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Filter and Actions Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div className="student-filter-row" style={{ margin: 0 }}>
          <button
            type="button"
            className={`student-filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Messages ({messages.length})
          </button>
          <button
            type="button"
            className={`student-filter-pill ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
          <button
            type="button"
            className={`student-filter-pill ${filter === 'management' ? 'active' : ''}`}
            onClick={() => setFilter('management')}
          >
            Management
          </button>
          <button
            type="button"
            className={`student-filter-pill ${filter === 'driver' ? 'active' : ''}`}
            onClick={() => setFilter('driver')}
          >
            Driver
          </button>
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

      {/* Messages Card */}
      <div className="student-card" style={{ padding: 18 }}>
        <div className="student-card-title" style={{ marginBottom: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquareIcon size={18} /> Direct Messages
          </span>
          <span style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
            Official Management &amp; Assigned Driver Communications
          </span>
        </div>

        {loading ? (
          <div className="vh-state-box" style={{ padding: '36px 12px' }}>
            <div className="vh-spinner" />
            <p>Loading your direct messages...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box" style={{ padding: '36px 12px' }}>
            <h4>Unable to Load Messages</h4>
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
        ) : filteredMessages.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredMessages.map((msg) => {
              const isSelected = selectedMessageId === msg.id
              const isDriver = msg.sender_role === 'driver'
              const roleLabel = isDriver ? 'Route Driver' : 'Campus Management'

              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 10,
                    background: msg.is_read ? '#FFFFFF' : 'rgba(120, 132, 59, 0.08)',
                    border: `1px solid ${
                      isSelected
                        ? 'var(--srm-olive)'
                        : msg.is_read
                        ? 'var(--srm-border)'
                        : 'rgba(120, 132, 59, 0.35)'
                    }`,
                    boxShadow: !msg.is_read
                      ? '0 2px 10px var(--srm-olive-glow)'
                      : isSelected
                      ? '0 2px 8px rgba(120, 132, 59, 0.15)'
                      : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  {/* Message Item Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {!msg.is_read && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'var(--srm-olive)',
                            display: 'inline-block',
                          }}
                          title="Unread message"
                        />
                      )}
                      <span
                        className="vh-badge"
                        style={{
                          background: isDriver ? 'var(--srm-olive)' : 'var(--srm-navy)',
                          color: '#FFFFFF',
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {roleLabel}
                      </span>
                      <strong style={{ fontSize: 13.5, color: 'var(--srm-navy)' }}>
                        {msg.sender_name}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--srm-text-light)' }}>
                        {formatTime(msg.created_at)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteMessage(msg.id, e)}
                        disabled={deletingId === msg.id}
                        title="Delete message"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--srm-text-muted)',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Message Title */}
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--srm-navy)' }}>
                    {msg.title}
                  </div>

                  {/* Message Snippet or Full Content */}
                  {isSelected ? (
                    <div
                      style={{
                        marginTop: 4,
                        padding: '12px 14px',
                        background: 'var(--srm-cream)',
                        border: '1px solid var(--srm-border)',
                        borderRadius: 8,
                        fontSize: 13,
                        color: 'var(--srm-text-dark)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12.5,
                        color: 'var(--srm-text-muted)',
                        lineHeight: 1.4,
                      }}
                    >
                      {msg.preview}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 16px',
              color: 'var(--srm-text-muted)',
            }}
          >
            <p style={{ margin: 0, fontSize: 13.5 }}>
              {filter === 'unread'
                ? 'You have no unread messages.'
                : filter === 'management'
                ? 'No messages from Campus Management.'
                : filter === 'driver'
                ? 'No messages from your assigned Route Driver.'
                : 'No direct messages in your inbox yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

