import { useState, useEffect } from 'react'
import StatCard from '../../components/management/StatCard'
import {
  fetchDashboardSummary,
  fetchDashboardRoutes,
} from '../../services/api'
import type {
  DashboardSummary,
  RouteOverviewResponse,
} from '../../types/management'

interface ManagementOverviewProps {
  onNavigateTab: (tab: 'students' | 'drivers' | 'buses' | 'routes' | 'allocations') => void
}

export default function ManagementOverview({ onNavigateTab }: ManagementOverviewProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [routesData, setRoutesData] = useState<RouteOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetchDashboardSummary(),
      fetchDashboardRoutes(),
    ])
      .then(([sumRes, rRes]) => {
        if (!isMounted) return
        setSummary(sumRes)
        setRoutesData(rRes)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard metrics'
        )
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [reloadKey])

  function handleRefresh() {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  if (loading) {
    return (
      <div className="mgmt-state-box">
        <div className="mgmt-spinner" />
        <h4>Loading Dashboard Overview</h4>
        <p>Connecting to VAHMITRA operations backend...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mgmt-state-box">
        <h4>Unable to Load Overview</h4>
        <p>{error}</p>
        <button
          type="button"
          className="mgmt-primary-btn"
          onClick={handleRefresh}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mgmt-page-header">
        <div className="mgmt-page-title-block">
          <h2>Campus Transportation Summary</h2>
          <p>Real-time overview of active routes, fleet capacity, and student allocations</p>
        </div>
        <div className="mgmt-page-actions">
          <button
            type="button"
            className="mgmt-secondary-btn"
            onClick={handleRefresh}
          >
            ↻ Refresh Data
          </button>
        </div>
      </div>

      {summary && (
        <section aria-label="Operations Key Metrics">
          <div className="mgmt-stats-grid">
            <StatCard
              icon="🎓"
              label="TOTAL STUDENTS"
              value={summary.students.total.toLocaleString()}
              subtitle={`${summary.students.accounts_created} registered · ${summary.students.pending_registration} pending`}
              accent="blue"
            />
            <StatCard
              icon="🪪"
              label="TOTAL DRIVERS"
              value={summary.drivers.total.toLocaleString()}
              subtitle={`${summary.drivers.accounts_created} registered · ${summary.drivers.pending_registration} pending`}
              accent="green"
            />
            <StatCard
              icon="🚌"
              label="ACTIVE BUSES"
              value={`${summary.buses.active} / ${summary.buses.total}`}
              subtitle={`${summary.buses.total - summary.buses.active} inactive buses`}
              accent="amber"
            />
            <StatCard
              icon="🗺️"
              label="ACTIVE ROUTES"
              value={`${summary.routes.active} / ${summary.routes.total}`}
              subtitle="Covers Vijayawada, Guntur & Tenali"
              accent="green"
            />
            <StatCard
              icon="🔄"
              label="ACTIVE ALLOCATIONS"
              value={summary.allocations.active.toLocaleString()}
              subtitle="Bus & driver deployed on active routes"
              accent="blue"
            />
          </div>
        </section>
      )}

      <div className="mgmt-card">
        <div className="mgmt-card-header">
          <h3>Active Routes & Assigned Fleet</h3>
          <button
            type="button"
            className="mgmt-secondary-btn"
            onClick={() => onNavigateTab('routes')}
          >
            View All Routes →
          </button>
        </div>

        <div className="mgmt-table-wrapper">
          {routesData && routesData.routes.length > 0 ? (
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Route Code</th>
                  <th>Route Name</th>
                  <th>Status</th>
                  <th>Assigned Fleet & Driver</th>
                  <th>Active Students</th>
                </tr>
              </thead>
              <tbody>
                {routesData.routes.map((route) => (
                  <tr key={route.route_id}>
                    <td>
                      <span className="mgmt-badge mgmt-badge--neutral">
                        {route.area}
                      </span>
                    </td>
                    <td>
                      <strong>{route.route_code}</strong>
                    </td>
                    <td>{route.route_name}</td>
                    <td>
                      {route.is_active ? (
                        <span className="mgmt-badge mgmt-badge--success">Active</span>
                      ) : (
                        <span className="mgmt-badge mgmt-badge--danger">Inactive</span>
                      )}
                    </td>
                    <td>
                      {route.buses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {route.buses.map((b) => (
                            <span key={b.allocation_id} style={{ fontSize: '12px' }}>
                              🚌 <strong>{b.bus_number}</strong> — {b.driver_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                          No bus assigned
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{route.active_student_count}</strong> students
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="mgmt-state-box">
              <h4>No Routes Found</h4>
              <p>There are no routes configured in the system yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
