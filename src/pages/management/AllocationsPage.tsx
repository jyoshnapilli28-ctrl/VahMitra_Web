import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
  fetchAllocations,
  fetchBuses,
  fetchDrivers,
  fetchRoutes,
  createAllocation,
} from '../../services/api'
import type {
  AllocationItem,
  BusItem,
  DriverItem,
  RouteItem,
} from '../../types/management'

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<AllocationItem[]>([])
  const [buses, setBuses] = useState<BusItem[]>([])
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Create Modal
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [selectedBusId, setSelectedBusId] = useState<string>('')
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [selectedRouteId, setSelectedRouteId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetchAllocations(),
      fetchBuses(),
      fetchDrivers(undefined, 0, 100),
      fetchRoutes(),
    ])
      .then(([allocRes, busesRes, driversRes, routesRes]) => {
        if (!isMounted) return
        setAllocations(allocRes.allocations)
        setBuses(busesRes.buses)
        setDrivers(driversRes.drivers)
        setRoutes(routesRes.routes)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load allocation data')
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

  // Lookup helpers
  const busMap = new Map(buses.map((b) => [b.id, b]))
  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const routeMap = new Map(routes.map((r) => [r.id, r]))

  async function handleCreateAllocation(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!selectedBusId || !selectedDriverId || !selectedRouteId || !startDate) {
      setFormError('Please select a bus, driver, route, and start date.')
      return
    }

    const startIso = new Date(startDate).toISOString()
    const endIso = endDate ? new Date(endDate).toISOString() : null

    if (endIso && endIso <= startIso) {
      setFormError('End date must be after the start date.')
      return
    }

    setSubmitting(true)
    try {
      await createAllocation({
        bus_id: Number(selectedBusId),
        driver_id: Number(selectedDriverId),
        route_id: Number(selectedRouteId),
        start_date: startIso,
        end_date: endIso,
      })
      setShowModal(false)
      setSelectedBusId('')
      setSelectedDriverId('')
      setSelectedRouteId('')
      setStartDate('')
      setEndDate('')
      setLoading(true)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create allocation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mgmt-page-header">
        <div className="mgmt-page-title-block">
          <h2>Vehicle & Driver Allocations</h2>
          <p>Assign drivers and campus buses to operational transportation routes</p>
        </div>
        <div className="mgmt-page-actions">
          <button
            type="button"
            className="mgmt-primary-btn"
            onClick={() => setShowModal(true)}
          >
            + Assign Bus & Driver
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

      <div className="mgmt-table-wrapper">
        {loading ? (
          <div className="mgmt-state-box">
            <div className="mgmt-spinner" />
            <h4>Loading Allocations...</h4>
          </div>
        ) : allocations.length > 0 ? (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Assigned Bus</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((alloc) => {
                const bus = busMap.get(alloc.bus_id)
                const driver = driverMap.get(alloc.driver_id)
                const route = routeMap.get(alloc.route_id)

                const isEnded = alloc.end_date && new Date(alloc.end_date) < new Date()
                const displayStatus = isEnded ? 'completed' : alloc.status

                return (
                  <tr key={alloc.id}>
                    <td>#{alloc.id}</td>
                    <td>
                      {bus ? (
                        <div>
                          <strong>{bus.bus_number}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {bus.registration_number}
                          </div>
                        </div>
                      ) : (
                        `Bus #${alloc.bus_id}`
                      )}
                    </td>
                    <td>
                      {driver ? (
                        <div>
                          <strong>{driver.driver_name}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {driver.phone || 'No phone recorded'}
                          </div>
                        </div>
                      ) : (
                        `Driver #${alloc.driver_id}`
                      )}
                    </td>
                    <td>
                      {route ? (
                        <span className="mgmt-badge mgmt-badge--neutral">
                          {route.area} · {route.route_code}
                        </span>
                      ) : (
                        `Route #${alloc.route_id}`
                      )}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(alloc.start_date).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {alloc.end_date
                        ? new Date(alloc.end_date).toLocaleDateString()
                        : 'Open-ended'}
                    </td>
                    <td>
                      {displayStatus === 'active' ? (
                        <span className="mgmt-badge mgmt-badge--success">Active</span>
                      ) : (
                        <span className="mgmt-badge mgmt-badge--neutral">Completed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="mgmt-state-box">
            <h4>No Allocations Found</h4>
            <p>No buses are currently assigned to drivers or routes.</p>
          </div>
        )}
      </div>

      {/* Allocation Modal */}
      {showModal && (
        <div className="mgmt-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3>Create Fleet Allocation</h3>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAllocation}>
              <div className="mgmt-modal-body">
                {formError && (
                  <div className="mgmt-error-alert" style={{ marginBottom: '14px' }}>
                    {formError}
                  </div>
                )}
                <div className="mgmt-form-group">
                  <label htmlFor="alloc-bus">Select Bus *</label>
                  <select
                    id="alloc-bus"
                    required
                    value={selectedBusId}
                    onChange={(e) => setSelectedBusId(e.target.value)}
                  >
                    <option value="">-- Choose active bus --</option>
                    {buses
                      .filter((b) => b.is_active)
                      .map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          {bus.bus_number} ({bus.registration_number}) — {bus.capacity} seats
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="alloc-driver">Select Driver *</label>
                  <select
                    id="alloc-driver"
                    required
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                  >
                    <option value="">-- Choose driver --</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.driver_name} {driver.phone ? `(${driver.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="alloc-route">Select Route *</label>
                  <select
                    id="alloc-route"
                    required
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                  >
                    <option value="">-- Choose active route --</option>
                    {routes
                      .filter((r) => r.is_active)
                      .map((route) => (
                        <option key={route.id} value={route.id}>
                          [{route.area}] {route.route_code} — {route.route_name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="alloc-start">Start Date & Time *</label>
                  <input
                    id="alloc-start"
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="alloc-end">End Date & Time (Optional)</label>
                  <input
                    id="alloc-end"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <div className="mgmt-form-hint">Leave blank for indefinite deployment</div>
                </div>
              </div>
              <div className="mgmt-modal-footer">
                <button
                  type="button"
                  className="mgmt-secondary-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mgmt-primary-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
