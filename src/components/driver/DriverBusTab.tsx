import type { DriverDashboardData } from '../../types/driver'

interface DriverBusTabProps {
  dashboardData?: DriverDashboardData | null
}

export default function DriverBusTab({ dashboardData }: DriverBusTabProps) {
  const bus = dashboardData?.bus

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="driver-card">
        <div className="driver-card-title">Assigned Bus Information</div>

        {bus ? (
          <div className="driver-prop-list">
            <div className="driver-prop-row">
              <span className="driver-prop-label">Bus Number</span>
              <span className="driver-prop-value" style={{ fontSize: 16 }}>
                {bus.bus_number}
              </span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Registration Number</span>
              <span className="driver-prop-value" style={{ fontFamily: 'monospace' }}>
                {bus.registration_number}
              </span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Seating Capacity</span>
              <span className="driver-prop-value">{bus.capacity} seats</span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Operating Status</span>
              <span className="driver-prop-value">
                {bus.is_active ? (
                  <span className="vh-badge vh-badge--success">Active</span>
                ) : (
                  <span className="vh-badge vh-badge--error">Inactive</span>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="driver-empty-state">
            <div className="driver-empty-icon">🚌</div>
            <h3>No Bus Assigned</h3>
            <p>You are currently not assigned to an active bus in the system.</p>
          </div>
        )}
      </div>

      <div
        style={{
          padding: '14px 18px',
          background: 'var(--color-bg, #F6F6F0)',
          border: '1px solid var(--color-border, #E6E8DE)',
          borderRadius: 'var(--radius-md, 10px)',
          fontSize: 13,
          color: 'var(--color-text-muted, #777D70)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span>ℹ️</span>
        <span>
          Bus details are managed by the operations team. Contact management for updates or issues.
        </span>
      </div>
    </div>
  )
}
