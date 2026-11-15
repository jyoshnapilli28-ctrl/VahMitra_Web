import type { StudentRoute, StudentRouteStop, StudentBus, StudentDriver, StudentAssignment, AnnouncementItem } from '../../types/student'
import { RouteIcon, BusIcon, DriverIcon, MapPinIcon } from '../common/Icons'

interface MyRouteTabProps {
  route: StudentRoute | null
  stops: StudentRouteStop[]
  bus: StudentBus | null
  driver: StudentDriver | null
  assignment: StudentAssignment | null
  announcements: AnnouncementItem[]
}

export default function MyRouteTab({
  route,
  stops,
  bus,
  driver,
  assignment,
  announcements,
}: MyRouteTabProps) {
  if (!route) {
    return (
      <div className="student-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <RouteIcon size={36} style={{ color: 'var(--srm-text-light)', marginBottom: 12 }} />
        <h3 style={{ color: 'var(--srm-navy)', margin: '0 0 8px 0' }}>No Assigned Route</h3>
        <p style={{ color: 'var(--srm-text-muted)', fontSize: 13, maxWidth: 440, margin: '0 auto' }}>
          You have not been assigned to an official university bus route. If you are registered for campus transit, please contact the transport department.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Route Overview Header Card */}
      <div className="student-card">
        <div className="student-card-title">
          <span>Route Information</span>
          <span className="vh-badge vh-badge--success">Active Assignment</span>
        </div>

        <div className="student-grid-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="student-prop-row">
              <span className="student-prop-label">Route Code</span>
              <span className="student-prop-value">{route.route_code}</span>
            </div>
            <div className="student-prop-row">
              <span className="student-prop-label">Route Name</span>
              <span className="student-prop-value">{route.route_name}</span>
            </div>
            <div className="student-prop-row">
              <span className="student-prop-label">Operating Area</span>
              <span className="student-prop-value">{route.area}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="student-prop-row">
              <span className="student-prop-label">Starting Point</span>
              <span className="student-prop-value">{route.start_point || 'Designated Area Origin'}</span>
            </div>
            <div className="student-prop-row">
              <span className="student-prop-label">Destination</span>
              <span className="student-prop-value">{route.end_point || 'SRM University AP Campus'}</span>
            </div>
            {assignment && (
              <div className="student-prop-row">
                <span className="student-prop-label">Validity Period</span>
                <span className="student-prop-value">
                  {new Date(assignment.start_date).toLocaleDateString()}
                  {assignment.end_date ? ` to ${new Date(assignment.end_date).toLocaleDateString()}` : ' (Active)'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Stops Timeline */}
      <div className="student-card">
        <div className="student-card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPinIcon size={16} /> Designated Halts ({stops.length} Stops)
          </span>
          <span style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
            Sequential Route Order
          </span>
        </div>

        {stops.length > 0 ? (
          <div className="student-timeline">
            {stops.map((stop, index) => {
              const isStart = index === 0
              const isEnd = index === stops.length - 1
              return (
                <div key={stop.id} className="student-timeline-item">
                  <div className={`student-timeline-dot ${isStart ? 'start' : isEnd ? 'end' : ''}`} />
                  <div className="student-timeline-info">
                    <div>
                      <strong style={{ fontSize: 13.5, color: 'var(--srm-navy)' }}>
                        {stop.name}
                      </strong>
                      {isStart && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: 'var(--srm-navy)', background: '#e0dfc2', padding: '1px 6px', borderRadius: 4 }}>
                          START
                        </span>
                      )}
                      {isEnd && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#d9534f', background: '#fee2e2', padding: '1px 6px', borderRadius: 4 }}>
                          CAMPUS DESTINATION
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--srm-olive)',
                        background: '#FFFFFF',
                        border: '1px solid var(--srm-border)',
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}
                    >
                      Halt #{stop.sequence_number}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--srm-text-muted)' }}>
            <p style={{ margin: 0, fontSize: 13 }}>No intermediate halts configured for this route.</p>
          </div>
        )}
      </div>

      {/* Vehicle & Driver Details */}
      <div className="student-grid-2">
        <div className="student-card">
          <div className="student-card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BusIcon size={16} /> Assigned Bus
            </span>
          </div>
          {bus ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="student-prop-row">
                <span className="student-prop-label">Bus Number</span>
                <span className="student-prop-value">Bus #{bus.bus_number}</span>
              </div>
              <div className="student-prop-row">
                <span className="student-prop-label">Registration</span>
                <span className="student-prop-value">{bus.registration_number}</span>
              </div>
              <div className="student-prop-row">
                <span className="student-prop-label">Seating Capacity</span>
                <span className="student-prop-value">{bus.capacity} seats</span>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--srm-text-muted)' }}>Vehicle assignment pending.</p>
          )}
        </div>

        <div className="student-card">
          <div className="student-card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DriverIcon size={16} /> Assigned Driver
            </span>
          </div>
          {driver ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="student-prop-row">
                <span className="student-prop-label">Driver Name</span>
                <span className="student-prop-value">{driver.name}</span>
              </div>
              <div className="student-prop-row">
                <span className="student-prop-label">Contact Phone</span>
                <span className="student-prop-value">
                  {driver.phone ? (
                    <a href={`tel:${driver.phone}`} style={{ color: 'var(--srm-olive)', textDecoration: 'none', fontWeight: 700 }}>
                      {driver.phone}
                    </a>
                  ) : (
                    'Not listed'
                  )}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--srm-text-muted)' }}>Driver assignment pending.</p>
          )}
        </div>
      </div>

      {/* Route-Related Announcements */}
      {announcements.length > 0 && (
        <div className="student-card">
          <div className="student-card-title">
            <span>Route-Related Advisories & Notices</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                style={{
                  padding: '12px 14px',
                  background: 'var(--srm-cream)',
                  borderRadius: 8,
                  border: '1px solid var(--srm-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13.5, color: 'var(--srm-navy)' }}>{ann.title}</strong>
                  <span className={`vh-badge ${ann.priority === 'emergency' ? 'vh-badge--error' : ann.priority === 'important' ? 'vh-badge--warning' : 'vh-badge--neutral'}`}>
                    {ann.priority}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--srm-text-dark)', lineHeight: 1.4 }}>
                  {ann.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
