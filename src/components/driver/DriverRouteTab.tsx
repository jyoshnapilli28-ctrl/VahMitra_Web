import type { DriverDashboardData, DriverRouteStop } from '../../types/driver'

interface DriverRouteTabProps {
  dashboardData?: DriverDashboardData | null
}

export default function DriverRouteTab({ dashboardData }: DriverRouteTabProps) {
  const route = dashboardData?.route
  const stops: DriverRouteStop[] = dashboardData?.stops || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Route Info Card */}
      <div className="driver-card">
        <div className="driver-card-title">Assigned Route Information</div>
        {route ? (
          <div className="driver-prop-list">
            <div className="driver-prop-row">
              <span className="driver-prop-label">Route Code</span>
              <span className="driver-prop-value" style={{ fontSize: 16, color: 'var(--color-primary)' }}>
                {route.route_code}
              </span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Route Name</span>
              <span className="driver-prop-value">{route.route_name}</span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Area / Sector</span>
              <span className="driver-prop-value">{route.area || '-'}</span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Starting Point</span>
              <span className="driver-prop-value">{route.start_point || '-'}</span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Ending Point</span>
              <span className="driver-prop-value">{route.end_point || '-'}</span>
            </div>
          </div>
        ) : (
          <div className="driver-empty-state">
            <div className="driver-empty-icon">🗺️</div>
            <h3>No Route Assigned</h3>
            <p>You have not been assigned to a scheduled route.</p>
          </div>
        )}
      </div>

      {/* Stops List */}
      <div className="driver-card">
        <div className="driver-card-title">
          <span>Route Stops &amp; Sequence ({stops.length})</span>
        </div>

        {stops.length > 0 ? (
          <div className="driver-route-timeline">
            {stops.map((stop, idx) => {
              const isStart = idx === 0
              const isEnd = idx === stops.length - 1
              const dotClass = isStart ? 'start' : isEnd ? 'end' : ''

              return (
                <div key={stop.id || idx} className="driver-timeline-item">
                  <div className={`driver-timeline-dot ${dotClass}`} />
                  <div className="driver-timeline-body">
                    <div>
                      <div className="driver-timeline-name">
                        {stop.name || `Stop #${stop.sequence_number}`}
                      </div>
                      {(stop.latitude !== null && stop.latitude !== undefined &&
                        stop.longitude !== null && stop.longitude !== undefined) && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          Coordinates: {Number(stop.latitude).toFixed(4)}, {Number(stop.longitude).toFixed(4)}
                        </div>
                      )}
                    </div>
                    <span className="driver-timeline-seq">Stop #{stop.sequence_number}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="driver-empty-state" style={{ padding: '24px 12px' }}>
            <p>No designated stops found for this route.</p>
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
        <span>📍</span>
        <span>Map view coming in a future update.</span>
      </div>
    </div>
  )
}
