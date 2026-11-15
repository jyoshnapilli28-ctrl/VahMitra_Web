import { useState, useEffect } from 'react'
import { fetchDashboardRoutes } from '../../services/api'
import type { RouteOverviewResponse } from '../../types/management'

export default function FleetMonitoringPage() {
  const [data, setData] = useState<RouteOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    fetchDashboardRoutes()
      .then((res) => {
        if (!isMounted) return
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load fleet monitoring data')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [reloadKey])

  function handleRetry() {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  const activeRoutesWithBuses =
    data?.routes.filter((r) => r.is_active && r.buses.length > 0) || []

  const totalAssignedBuses = activeRoutesWithBuses.reduce(
    (acc, r) => acc + r.buses.length,
    0
  )

  return (
    <div>
      <div className="mgmt-page-header">
        <div className="mgmt-page-title-block">
          <h2>Fleet Monitoring & Live Telemetry</h2>
          <p>Active route deployments and onboard vehicle telemetry status</p>
        </div>
        <div className="mgmt-page-actions">
          <button type="button" className="mgmt-secondary-btn" onClick={handleRetry}>
            ↻ Check Status
          </button>
        </div>
      </div>

      {error && (
        <div className="mgmt-error-alert">
          <span>{error}</span>
          <button type="button" className="mgmt-secondary-btn" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {/* Telemetry integration notice */}
      <div
        className="mgmt-card"
        style={{
          borderLeft: '4px solid #78843b',
          background: '#fafbf6',
          marginBottom: '22px',
        }}
      >
        <div className="mgmt-card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '18px' }}>📡</span>
            <strong style={{ color: '#102d46', fontSize: '14px' }}>
              GPS Telemetry & Live Map Status
            </strong>
            <span className="mgmt-badge mgmt-badge--warning">Hardware Pending</span>
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Live geospatial positioning endpoints are currently pending onboard GPS unit deployment.
            Allocated vehicles are actively verified via timetable schedules and driver assignments below.
            No simulated or fabricated coordinates are displayed.
          </p>
        </div>
      </div>

      <div className="mgmt-stats-grid" style={{ marginBottom: '22px' }}>
        <div className="mgmt-card" style={{ marginBottom: 0 }}>
          <div className="mgmt-card-body">
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              DEPLOYED VEHICLES
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#102d46', marginTop: '4px' }}>
              {totalAssignedBuses}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Buses currently allocated to active routes
            </div>
          </div>
        </div>

        <div className="mgmt-card" style={{ marginBottom: 0 }}>
          <div className="mgmt-card-body">
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              SERVICED ROUTES
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#102d46', marginTop: '4px' }}>
              {activeRoutesWithBuses.length}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Routes with active vehicle deployments
            </div>
          </div>
        </div>
      </div>

      <div className="mgmt-card">
        <div className="mgmt-card-header">
          <h3>Active Fleet Deployments by Route</h3>
        </div>
        <div className="mgmt-table-wrapper">
          {loading ? (
            <div className="mgmt-state-box">
              <div className="mgmt-spinner" />
              <h4>Loading Fleet Deployment Status...</h4>
            </div>
          ) : activeRoutesWithBuses.length > 0 ? (
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>Route Code</th>
                  <th>Area</th>
                  <th>Route Name</th>
                  <th>Vehicle Number</th>
                  <th>Designated Driver</th>
                  <th>Enroute Students</th>
                </tr>
              </thead>
              <tbody>
                {activeRoutesWithBuses.flatMap((route) =>
                  route.buses.map((bus) => (
                    <tr key={`${route.route_id}-${bus.allocation_id}`}>
                      <td>
                        <strong>{route.route_code}</strong>
                      </td>
                      <td>
                        <span className="mgmt-badge mgmt-badge--neutral">{route.area}</span>
                      </td>
                      <td>{route.route_name}</td>
                      <td>
                        <code>🚌 {bus.bus_number}</code>
                      </td>
                      <td>{bus.driver_name}</td>
                      <td>
                        <strong>{route.active_student_count}</strong> students assigned
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="mgmt-state-box">
              <h4>No Active Deployments</h4>
              <p>There are no buses actively assigned to running routes at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
