import type { StudentDriver, StudentBus, StudentRoute } from '../../types/student'
import { DriverIcon, PhoneIcon, BusIcon, RouteIcon, AlertTriangleIcon } from '../common/Icons'

interface MyDriverTabProps {
  driver: StudentDriver | null
  bus: StudentBus | null
  route: StudentRoute | null
}

export default function MyDriverTab({ driver, bus, route }: MyDriverTabProps) {
  if (!driver) {
    return (
      <div className="student-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <DriverIcon size={36} style={{ color: 'var(--srm-text-light)', marginBottom: 12 }} />
        <h3 style={{ color: 'var(--srm-navy)', margin: '0 0 8px 0' }}>No Driver Assigned Yet</h3>
        <p style={{ color: 'var(--srm-text-muted)', fontSize: 13, maxWidth: 440, margin: '0 auto' }}>
          Your route currently does not have an active driver allocation assigned. Campus transport fleet operations will assign an authorized driver prior to commencement.
        </p>
      </div>
    )
  }

  const initial = driver.name.charAt(0).toUpperCase() || 'D'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Driver Identity Card */}
      <div className="student-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--srm-navy) 0%, var(--srm-olive) 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
              boxShadow: '0 4px 18px var(--srm-olive-glow)',
            }}
          >
            {initial}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--srm-navy)', margin: 0 }}>
                {driver.name}
              </h2>
              <span className="vh-badge vh-badge--success">Authorized Driver</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--srm-text-muted)' }}>
              SRM University AP · Campus Fleet Driver
            </p>

            {driver.phone && (
              <a
                href={`tel:${driver.phone}`}
                className="vh-btn vh-btn-primary"
                style={{ display: 'inline-flex', padding: '7px 16px', fontSize: 12.5 }}
              >
                <PhoneIcon size={14} /> Call Driver ({driver.phone})
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Specs */}
      <div className="student-grid-2">
        <div className="student-card">
          <div className="student-card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BusIcon size={16} /> Operating Vehicle
            </span>
          </div>
          {bus ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="student-prop-row">
                <span className="student-prop-label">Bus Number</span>
                <span className="student-prop-value">Bus #{bus.bus_number}</span>
              </div>
              <div className="student-prop-row">
                <span className="student-prop-label">License Plate</span>
                <span className="student-prop-value">{bus.registration_number}</span>
              </div>
              <div className="student-prop-row">
                <span className="student-prop-label">Capacity</span>
                <span className="student-prop-value">{bus.capacity} seats</span>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--srm-text-muted)' }}>Bus mapping in progress.</p>
          )}
        </div>

        <div className="student-card">
          <div className="student-card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RouteIcon size={16} /> Transit Route
            </span>
          </div>
          {route ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="student-prop-row">
                <span className="student-prop-label">Route Code</span>
                <span className="student-prop-value">{route.route_code}</span>
              </div>
              <div className="student-prop-row">
                <span className="student-prop-label">Route Name</span>
                <span className="student-prop-value">{route.route_name}</span>
              </div>
              <div className="student-prop-row">
                <span className="student-prop-label">Operating Region</span>
                <span className="student-prop-value">{route.area}</span>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--srm-text-muted)' }}>Route details in progress.</p>
          )}
        </div>
      </div>

      {/* Operational Disclosure Banner */}
      <div
        style={{
          background: 'var(--srm-cream)',
          border: '1px solid var(--srm-border)',
          borderRadius: 10,
          padding: '14px 18px',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          fontSize: 12,
          color: 'var(--srm-text-muted)',
        }}
      >
        <AlertTriangleIcon size={18} style={{ color: 'var(--srm-olive)', flexShrink: 0 }} />
        <span>
          <strong>Campus Transit Notice:</strong> An active driver allocation confirms vehicle mapping for your route. It does not certify that the driver has commenced a physical trip at any given moment. Please consult the live map and announcements for live updates.
        </span>
      </div>
    </div>
  )
}

