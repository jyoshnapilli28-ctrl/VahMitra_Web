import { useState } from 'react'
import type { AnnouncementItem } from '../../types/student'
import { PinIcon, AlertTriangleIcon, XIcon } from '../common/Icons'

interface AnnouncementSectionProps {
  announcements: AnnouncementItem[]
}

export default function AnnouncementSection({ announcements }: AnnouncementSectionProps) {
  const [selectedAnn, setSelectedAnn] = useState<AnnouncementItem | null>(null)

  function formatTime(isoStr: string) {
    try {
      const d = new Date(isoStr)
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } catch {
      return isoStr
    }
  }

  function getCategoryLabel(cat: string) {
    const map: Record<string, string> = {
      route_change: 'Route Change',
      delay: 'Bus Delay',
      breakdown: 'Vehicle Breakdown',
      holiday: 'Holiday Notice',
      schedule: 'Schedule Update',
      emergency: 'Emergency Alert',
      general: 'Transport Notice',
    }
    return map[cat] || cat
  }

  return (
    <div className="student-announcements-container">
      <div className="student-section-header">
        <h3>
          <AlertTriangleIcon size={18} style={{ color: 'var(--srm-olive)' }} />
          <span>Official Campus Transport Announcements</span>
        </h3>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--srm-olive)',
            background: 'rgba(120, 132, 59, 0.12)',
            padding: '3px 10px',
            borderRadius: 12,
          }}
        >
          {announcements.length} Published
        </span>
      </div>

      {announcements.length > 0 ? (
        <div className="student-announcements-list">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`student-announcement-card ${ann.priority}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedAnn(ann)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSelectedAnn(ann)
              }}
            >
              <div className="student-announcement-meta">
                {ann.is_pinned && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: 'var(--srm-navy)',
                      background: 'rgba(16, 45, 70, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}
                  >
                    <PinIcon size={11} /> PINNED
                  </span>
                )}

                <span
                  className={`vh-badge ${
                    ann.priority === 'emergency'
                      ? 'vh-badge--error'
                      : ann.priority === 'important'
                      ? 'vh-badge--warning'
                      : 'vh-badge--neutral'
                  }`}
                >
                  {ann.priority.toUpperCase()}
                </span>

                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--srm-olive)' }}>
                  {getCategoryLabel(ann.category)}
                </span>

                <span style={{ fontSize: 11, color: 'var(--srm-text-muted)', marginLeft: 'auto' }}>
                  {formatTime(ann.created_at)}
                </span>
              </div>

              <div className="student-announcement-title">{ann.title}</div>

              <div className="student-announcement-desc">
                {ann.description.length > 140
                  ? `${ann.description.slice(0, 140)}...`
                  : ann.description}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 10.5, color: 'var(--srm-text-light)' }}>
                  By {ann.published_by}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--srm-olive)' }}>
                  Read Details →
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--srm-text-muted)' }}>
          <p style={{ margin: 0, fontSize: 13 }}>
            No active announcements. All university transit routes are running on standard schedule.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAnn && (
        <div
          className="student-qr-modal-backdrop"
          onClick={() => setSelectedAnn(null)}
        >
          <div
            className="student-qr-modal"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="student-qr-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className={`vh-badge ${
                    selectedAnn.priority === 'emergency'
                      ? 'vh-badge--error'
                      : selectedAnn.priority === 'important'
                      ? 'vh-badge--warning'
                      : 'vh-badge--neutral'
                  }`}
                >
                  {selectedAnn.priority.toUpperCase()}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--srm-olive)' }}>
                  {getCategoryLabel(selectedAnn.category)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnn(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--srm-text-muted)' }}
              >
                <XIcon size={20} />
              </button>
            </div>

            <div style={{ padding: '24px 28px', background: '#FFFFFF' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--srm-navy)', margin: '0 0 10px 0' }}>
                {selectedAnn.title}
              </h3>

              <div style={{ fontSize: 11.5, color: 'var(--srm-text-muted)', marginBottom: 18 }}>
                Published on {formatTime(selectedAnn.created_at)} by <strong>{selectedAnn.published_by}</strong>
              </div>

              <div
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: 'var(--srm-text-dark)',
                  background: 'var(--srm-cream)',
                  padding: 18,
                  borderRadius: 10,
                  border: '1px solid var(--srm-border)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedAnn.description}
              </div>

              <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="vh-btn vh-btn-secondary"
                  onClick={() => setSelectedAnn(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

