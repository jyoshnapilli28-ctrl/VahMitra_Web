import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import type { DiscussionMessageItem } from '../../types/student'
import {
  fetchDiscussionMessages,
  sendDiscussionMessage,
  deleteDiscussionMessage,
  reportDiscussionMessage,
} from '../../services/api'
import { DiscussionIcon, SendIcon, TrashIcon } from '../common/Icons'

export default function DiscussionRoomTab() {
  const [messages, setMessages] = useState<DiscussionMessageItem[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [reportNotice, setReportNotice] = useState('')

  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    function loadMessages() {
      fetchDiscussionMessages()
        .then((items) => {
          if (!isMounted) return
          setMessages(items)
          setLoading(false)
        })
        .catch(() => {
          if (!isMounted) return
          setLoading(false)
        })
    }

    loadMessages()

    // 5-second polling interval
    const interval = setInterval(loadMessages, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    if (!inputText.trim() || sending) return

    setSending(true)
    const textToSend = inputText.trim()
    setInputText('')

    try {
      const created = await sendDiscussionMessage(textToSend)
      setMessages((prev) => [
        ...prev,
        {
          id: created.id,
          sender_name: created.sender_name,
          official_name: created.sender_name,
          registration_number: '',
          sender_avatar: null,
          content: created.content,
          is_own: true,
          created_at: created.created_at,
        },
      ])
    } catch {
      // rollback
      setInputText(textToSend)
    } finally {
      setSending(false)
    }
  }

  async function handleDeleteMessage(id: number) {
    try {
      await deleteDiscussionMessage(id)
      setMessages((prev) => prev.filter((m) => m.id !== id))
    } catch {
      // ignore
    }
  }

  async function handleReportMessage(id: number) {
    try {
      await reportDiscussionMessage(id)
      setReportNotice(`Message #${id} has been flagged for moderation review.`)
      setTimeout(() => setReportNotice(''), 4000)
    } catch {
      // ignore
    }
  }

  function formatTime(isoStr: string) {
    try {
      const d = new Date(isoStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoStr
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {reportNotice && (
        <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, color: '#065f46', fontSize: 12.5, fontWeight: 600 }}>
          {reportNotice}
        </div>
      )}

      <div className="student-discussion-container">
        {/* Chat Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--srm-border)',
            background: 'var(--srm-cream)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DiscussionIcon size={18} style={{ color: 'var(--srm-olive)' }} />
            <strong style={{ fontSize: 14, color: 'var(--srm-navy)' }}>
              Transit Community Discussion Room
            </strong>
          </div>
          <span style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
            Live Student Coordination · 5s refresh
          </span>
        </div>

        {/* Message Stream */}
        <div className="student-discussion-messages">
          {loading ? (
            <div className="vh-state-box" style={{ padding: '36px 12px' }}>
              <div className="vh-spinner" />
              <p>Connecting to discussion room...</p>
            </div>
          ) : messages.length > 0 ? (
            messages.map((m) => (
              <div key={m.id} className={`student-msg-bubble ${m.is_own ? 'own' : ''}`}>
                <div className="student-msg-header">
                  <span className="student-msg-sender">
                    {m.sender_name}
                  </span>
                  <span className="student-msg-time">
                    {formatTime(m.created_at)}
                  </span>
                </div>

                <div className="student-msg-content">{m.content}</div>

                <div className="student-msg-footer">
                  {m.is_own ? (
                    <button
                      type="button"
                      className="student-msg-del-btn"
                      onClick={() => handleDeleteMessage(m.id)}
                      title="Delete your message"
                    >
                      <TrashIcon size={12} /> Delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="student-msg-del-btn"
                      onClick={() => handleReportMessage(m.id)}
                      title="Report inappropriate content"
                    >
                      Report
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 12px', color: 'var(--srm-text-muted)' }}>
              <p style={{ margin: 0, fontSize: 13.5 }}>
                No messages yet. Start the conversation with your fellow transit passengers!
              </p>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Message Input Box */}
        <form className="student-discussion-input-bar" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="student-discussion-input"
            placeholder="Type a transit message (bus delays, pickup questions, lost items)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="vh-btn vh-btn-primary"
            style={{ padding: '9px 18px' }}
            disabled={!inputText.trim() || sending}
          >
            <SendIcon size={16} />
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

