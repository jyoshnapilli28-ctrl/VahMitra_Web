import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import type { DriverDashboardData } from '../../types/driver'
import { apiRequest } from '../../services/api'

interface DriverMessagesTabProps {
  dashboardData?: DriverDashboardData | null
}

interface MessageItem {
  id: number
  broadcast_id?: string | null
  title?: string | null
  content: string
  recipient_name?: string | null
  created_at: string
}

export default function DriverMessagesTab({ dashboardData }: DriverMessagesTabProps) {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Broadcast form states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchGenRef = useRef(0)
  const routeCode = dashboardData?.route?.route_code || 'Assigned Route'

  const formatIST = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    } catch {
      return dateStr
    }
  }

  const loadMessages = useCallback(() => {
    const currentGen = ++fetchGenRef.current

    apiRequest<{ messages?: MessageItem[] } | MessageItem[]>('/driver/messages')
      .then((res) => {
        if (fetchGenRef.current !== currentGen) return
        const list: MessageItem[] = Array.isArray(res) ? res : res.messages || []
        // Deduplicate by broadcast_id if present
        const seenBroadcasts = new Set<string>()
        const deduped: MessageItem[] = []

        for (const item of list) {
          if (item.broadcast_id) {
            if (!seenBroadcasts.has(item.broadcast_id)) {
              seenBroadcasts.add(item.broadcast_id)
              deduped.push(item)
            }
          } else {
            deduped.push(item)
          }
        }

        setMessages(deduped)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (fetchGenRef.current !== currentGen) return
        setError(err instanceof Error ? err.message : 'Failed to fetch messages.')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMsg(null)

    if (content.trim().length < 10) {
      setFormError('Message content must be at least 10 characters long.')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiRequest<{ message: string; recipients_count?: number }>(
        '/driver/messages',
        {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim() || undefined,
            content: content.trim(),
          }),
        }
      )

      const count = res.recipients_count ?? 'assigned'
      setSuccessMsg(`Message sent to ${count} students on Route ${routeCode}.`)
      setTitle('')
      setContent('')
      setLoading(true)
      loadMessages()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to send broadcast.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Scope Notice Banner */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--color-warning-bg, #FEF7EC)',
          border: '1px solid var(--color-warning-border, #F5D8A0)',
          borderRadius: 'var(--radius-md, 10px)',
          color: 'var(--color-text, #20251C)',
          fontSize: 13.5,
          lineHeight: 1.5,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <strong style={{ color: '#92400E' }}>Route-Level Broadcast</strong>
          <p style={{ margin: '4px 0 0', color: '#92400E' }}>
            Your message will be sent to all students on your assigned route ({routeCode}).
            Bus-specific assignments have not been verified.
          </p>
        </div>
      </div>

      {/* Compose Form */}
      <div className="driver-card">
        <div className="driver-card-title">Compose Route Broadcast</div>

        {successMsg && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-success-bg, #F0FAF4)',
              border: '1px solid var(--color-success-border, #BBDFC8)',
              color: 'var(--color-success, #299D59)',
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            ✓ {successMsg}
          </div>
        )}

        {formError && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-error-bg, #FEF2F2)',
              border: '1px solid var(--color-error-border, #FECACA)',
              color: 'var(--color-error, #D9534F)',
              fontSize: 13,
            }}
          >
            ⚠️ {formError}
          </div>
        )}

        <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="vh-form-group">
            <label className="vh-form-label">Subject / Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 10 Minute Delay Due to Rain"
              className="vh-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="vh-form-group">
            <label className="vh-form-label">
              Message Content <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <textarea
              rows={4}
              required
              minLength={10}
              placeholder="Write your broadcast update to route students here..."
              className="vh-form-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <span className="vh-form-hint">Minimum 10 characters</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="submit"
              className="vh-btn vh-btn-primary"
              disabled={submitting}
              style={{ padding: '10px 24px', fontWeight: 700 }}
            >
              {submitting ? 'Transmitting...' : 'Send Broadcast to Route'}
            </button>
          </div>
        </form>
      </div>

      {/* Sent Messages List */}
      <div className="driver-card">
        <div className="driver-card-title">
          <span>Sent Broadcast History</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Total: {messages.length} broadcasts
          </span>
        </div>

        {loading ? (
          <div className="vh-state-box">
            <div className="vh-spinner" />
            <p>Loading sent messages...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box">
            <h4>Unable to Load Sent Messages</h4>
            <p>{error}</p>
          </div>
        ) : messages.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg) => {
              const snippet =
                msg.content.length > 150 ? `${msg.content.slice(0, 150)}...` : msg.content

              return (
                <div
                  key={msg.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong style={{ fontSize: 14.5, color: 'var(--color-text)' }}>
                        {msg.title || 'Route Update'}
                      </strong>
                      <span className="vh-badge vh-badge--neutral">
                        {msg.recipient_name || 'Route Broadcast'}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {formatIST(msg.created_at)}
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {snippet}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="driver-empty-state">
            <div className="driver-empty-icon">✉️</div>
            <h3>No Messages Sent</h3>
            <p>You haven't transmitted any route-level broadcast announcements yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
