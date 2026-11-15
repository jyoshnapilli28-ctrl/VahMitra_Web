import type { StudentDashboardData } from '../../types/student'
import type { StudentTab } from './StudentSidebar'
import AnnouncementSection from './AnnouncementSection'
import TrackingMap from './TrackingMap'
import {
  QrCodeIcon,
  BellIcon,
  ArrowRightIcon,
  BusIcon,
  RouteIcon,
  CalendarDaysIcon,
  MessageSquareIcon,
  ComplaintsIcon,
} from '../common/Icons'

interface HomeTabProps {
  data: StudentDashboardData
  onOpenScanner: () => void
  onNavigateTab: (tab: StudentTab) => void
}

export default function HomeTab({
  data,
  onOpenScanner,
  onNavigateTab,
}: HomeTabProps) {
  const {
    student,
    route,
    stops,
    bus,
    driver,
    location,
    attendance,
    announcements,
    notifications_preview,
    unread_messages_count = 0,
    open_complaints_count = 0,
    latest_message_preview,
    latest_complaint_preview,
  } = data

  const displayName = student.nickname || student.full_name

  function formatTime(isoStr: string) {
    try {
      const d = new Date(isoStr)
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } catch {
      return isoStr
    }
  }

  function getComplaintBadgeClass(status: string) {
    switch (status) {
      case 'Resolved':
        return 'vh-badge--success'
      case 'Under Review':
      case 'In Progress':
        return 'vh-badge--warning'
      case 'Rejected':
        return 'vh-badge--error'
      default:
        return 'vh-badge--neutral'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Student Home Hero */}
      <div className="student-home-hero">
        <div className="student-hero-info">
          <h2>
            Good day, <span>{displayName}</span>!
          </h2>
          <p>
            {route ? (
              <>
                Assigned to <strong>{route.route_code} — {route.route_name}</strong> ({route.area})
              </>
            ) : (
              'SRM University AP Smart Transit Portal'
            )}
          </p>
        </div>

        <div className="student-hero-actions">
          <button
            type="button"
            className="student-qr-scan-btn"
            onClick={onOpenScanner}
          >
            <QrCodeIcon size={18} />
            <span>Scan Attendance QR</span>
          </button>
        </div>
      </div>

      {/* 2. Announcements — HIGHEST PRIORITY */}
      <AnnouncementSection announcements={announcements} />

      {/* 3. Large Live Tracking Map */}
      <TrackingMap
        route={route}
        stops={stops}
        bus={bus}
        location={location}
      />

      {/* 4. Enhanced 3-Pillar Transit Quick Access Grid */}
      <div className="student-grid-3" style={{ margin: 0 }}>
        {/* Card A: Verified Attendance */}
        <div className="student-card" style={{ padding: 16 }}>
          <div className="student-card-title" style={{ marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDaysIcon size={16} /> Attendance Activity
            </span>
            <button
              type="button"
              className="vh-btn vh-btn-ghost"
              style={{ fontSize: 11, padding: '2px 6px' }}
              onClick={() => onNavigateTab('attendance')}
            >
              View History <ArrowRightIcon size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: 'var(--srm-text-muted)' }}>Distinct Days:</span>
              <strong style={{ fontSize: 16, color: 'var(--srm-navy)' }}>
                {attendance.distinct_days ?? '—'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: 'var(--srm-text-muted)' }}>Total Boardings:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--srm-olive)' }}>
                {attendance.total} Recorded
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--srm-text-light)', borderTop: '1px solid var(--srm-border)', paddingTop: 6 }}>
              Official records in Asia/Kolkata timezone
            </div>
          </div>
        </div>

        {/* Card B: Direct Messages */}
        <div className="student-card" style={{ padding: 16 }}>
          <div className="student-card-title" style={{ marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquareIcon size={16} /> Direct Messages
            </span>
            <button
              type="button"
              className="vh-btn vh-btn-ghost"
              style={{ fontSize: 11, padding: '2px 6px' }}
              onClick={() => onNavigateTab('messages')}
            >
              Open Inbox <ArrowRightIcon size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: 'var(--srm-text-muted)' }}>Unread Messages:</span>
              <span
                className="vh-badge"
                style={{
                  background: unread_messages_count > 0 ? 'var(--srm-olive)' : 'rgba(16, 45, 70, 0.1)',
                  color: unread_messages_count > 0 ? '#FFFFFF' : 'var(--srm-navy)',
                  fontWeight: 700,
                  fontSize: 11.5,
                }}
              >
                {unread_messages_count} Unread
              </span>
            </div>

            {latest_message_preview ? (
              <div
                style={{
                  background: 'var(--srm-cream)',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--srm-border)',
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--srm-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {latest_message_preview.sender_name}: {latest_message_preview.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--srm-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {latest_message_preview.snippet}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--srm-text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                No direct messages received
              </div>
            )}
          </div>
        </div>

        {/* Card C: Transport Support Tickets */}
        <div className="student-card" style={{ padding: 16 }}>
          <div className="student-card-title" style={{ marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ComplaintsIcon size={16} /> Support Tickets
            </span>
            <button
              type="button"
              className="vh-btn vh-btn-ghost"
              style={{ fontSize: 11, padding: '2px 6px' }}
              onClick={() => onNavigateTab('complaints')}
            >
              All Tickets <ArrowRightIcon size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: 'var(--srm-text-muted)' }}>Open Tickets:</span>
              <strong style={{ fontSize: 15, color: open_complaints_count > 0 ? '#b45309' : 'var(--srm-navy)' }}>
                {open_complaints_count} Active
              </strong>
            </div>

            {latest_complaint_preview ? (
              <div
                style={{
                  background: 'var(--srm-cream)',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--srm-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--srm-navy)' }}>
                    {latest_complaint_preview.ticket_number}
                  </span>
                  <span className={`vh-badge ${getComplaintBadgeClass(latest_complaint_preview.status)}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                    {latest_complaint_preview.status}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--srm-text-dark)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {latest_complaint_preview.title}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--srm-text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                No active complaints
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Transport Summary & Live Notifications Preview */}
      <div className="student-grid-2" style={{ margin: 0 }}>
        {/* Route & Vehicle Summary */}
        <div className="student-card">
          <div className="student-card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BusIcon size={16} /> Transit Allocation
            </span>
            {route && <span className="vh-badge vh-badge--success">Active</span>}
          </div>

          {route ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="student-prop-row">
                <span className="student-prop-label">Assigned Route</span>
                <span className="student-prop-value">{route.route_code} ({route.area})</span>
              </div>
              <div className="student-prop-row">
                <span className="student-prop-label">Vehicle</span>
                <span className="student-prop-value">{bus ? `Bus #${bus.bus_number} (${bus.registration_number})` : 'Pending Allocation'}</span>
              </div>
              <div className="student-prop-row">
                <span className="student-prop-label">Driver</span>
                <span className="student-prop-value">{driver ? driver.name : 'Unassigned'}</span>
              </div>
              <div className="student-prop-row">
                <span className="student-prop-label">Boarding Trips</span>
                <span className="student-prop-value">{attendance.total} Recorded</span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="vh-btn vh-btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => onNavigateTab('route')}
                >
                  <RouteIcon size={14} /> Full Route
                </button>
                <button
                  type="button"
                  className="vh-btn vh-btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => onNavigateTab('driver')}
                >
                  My Driver →
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--srm-text-muted)' }}>
              <p style={{ margin: 0, fontSize: 13 }}>No active route assignment for this semester.</p>
            </div>
          )}
        </div>

        {/* Live Notifications Preview */}
        <div className="student-card">
          <div className="student-card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BellIcon size={16} /> Recent Notifications
            </span>
            <button
              type="button"
              className="vh-btn vh-btn-ghost"
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => onNavigateTab('notifications')}
            >
              View All <ArrowRightIcon size={12} />
            </button>
          </div>

          {notifications_preview.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications_preview.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: n.is_read ? 'var(--srm-cream)' : 'rgba(120, 132, 59, 0.1)',
                    border: `1px solid ${n.is_read ? 'var(--srm-border)' : 'rgba(120, 132, 59, 0.3)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--srm-navy)' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--srm-text-light)' }}>
                      {formatTime(n.created_at)}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--srm-text-dark)', lineHeight: 1.4 }}>
                    {n.message}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--srm-text-muted)' }}>
              <p style={{ margin: 0, fontSize: 13 }}>No recent notifications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
