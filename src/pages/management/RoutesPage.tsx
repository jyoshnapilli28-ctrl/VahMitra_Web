import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { fetchRoutes, createRoute } from '../../services/api'
import type { RouteItem, RouteCreatePayload } from '../../types/management'

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [reloadKey, setReloadKey] = useState(0)

  // Create Modal
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<RouteCreatePayload>({
    area: '',
    route_code: '',
    route_name: '',
    start_point: '',
    end_point: 'SRM University AP',
  })

  useEffect(() => {
    let isMounted = true

    fetchRoutes()
      .then((res) => {
        if (!isMounted) return
        setRoutes(res.routes)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load routes')
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

  async function handleCreateRoute(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!formData.area.trim() || !formData.route_code.trim() || !formData.route_name.trim()) {
      setFormError('Area, Route Code, and Route Name are required.')
      return
    }

    setSubmitting(true)
    try {
      await createRoute({
        area: formData.area.trim(),
        route_code: formData.route_code.trim(),
        route_name: formData.route_name.trim(),
        start_point: formData.start_point?.trim() || null,
        end_point: formData.end_point?.trim() || null,
      })
      setShowModal(false)
      setFormData({
        area: '',
        route_code: '',
        route_name: '',
        start_point: '',
        end_point: 'SRM University AP',
      })
      setLoading(true)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create route')
    } finally {
      setSubmitting(false)
    }
  }

  // Extract unique areas
  const areas = Array.from(new Set(routes.map((r) => r.area))).filter(Boolean)

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      route.route_code.toLowerCase().includes(search.toLowerCase()) ||
      route.route_name.toLowerCase().includes(search.toLowerCase()) ||
      (route.start_point && route.start_point.toLowerCase().includes(search.toLowerCase())) ||
      (route.end_point && route.end_point.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (selectedArea !== 'all' && route.area !== selectedArea) {
      return false
    }

    return true
  })

  return (
    <div>
      <div className="mgmt-page-header">
        <div className="mgmt-page-title-block">
          <h2>Campus Transportation Routes</h2>
          <p>Configure operational zones, routes, origins, and destination termini</p>
        </div>
        <div className="mgmt-page-actions">
          <button
            type="button"
            className="mgmt-primary-btn"
            onClick={() => setShowModal(true)}
          >
            + New Route
          </button>
        </div>
      </div>

      <div className="mgmt-toolbar">
        <input
          type="text"
          className="mgmt-search-input"
          placeholder="Search by route code, name, or stops..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label htmlFor="area-filter" style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
            Area:
          </label>
          <select
            id="area-filter"
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            <option value="all">All Areas ({routes.length})</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area} ({routes.filter((r) => r.area === area).length})
              </option>
            ))}
          </select>
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
            <h4>Loading Routes...</h4>
          </div>
        ) : filteredRoutes.length > 0 ? (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Route Code</th>
                <th>Route Name</th>
                <th>Start Point</th>
                <th>End Point</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((route) => (
                <tr key={route.id}>
                  <td>
                    <span className="mgmt-badge mgmt-badge--neutral">{route.area}</span>
                  </td>
                  <td>
                    <strong>{route.route_code}</strong>
                  </td>
                  <td>{route.route_name}</td>
                  <td>{route.start_point || '—'}</td>
                  <td>{route.end_point || 'SRM AP'}</td>
                  <td>
                    {route.is_active ? (
                      <span className="mgmt-badge mgmt-badge--success">Active</span>
                    ) : (
                      <span className="mgmt-badge mgmt-badge--danger">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mgmt-state-box">
            <h4>No Routes Found</h4>
            <p>{search ? 'No routes matched your query.' : 'No routes configured.'}</p>
          </div>
        )}
      </div>

      {/* New Route Modal */}
      {showModal && (
        <div className="mgmt-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3>Create New Transport Route</h3>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateRoute}>
              <div className="mgmt-modal-body">
                {formError && (
                  <div className="mgmt-error-alert" style={{ marginBottom: '14px' }}>
                    {formError}
                  </div>
                )}
                <div className="mgmt-form-group">
                  <label htmlFor="route-area">Area / Zone *</label>
                  <input
                    id="route-area"
                    type="text"
                    required
                    placeholder="e.g. Vijayawada, Guntur, or Tenali"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="route-code">Route Code *</label>
                  <input
                    id="route-code"
                    type="text"
                    required
                    placeholder="e.g. VJA-01, GNT-03"
                    value={formData.route_code}
                    onChange={(e) => setFormData({ ...formData, route_code: e.target.value })}
                  />
                  <div className="mgmt-form-hint">Unique route identifier within this area</div>
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="route-name">Route Name / Description *</label>
                  <input
                    id="route-name"
                    type="text"
                    required
                    placeholder="e.g. Benz Circle - High Court - SRM AP"
                    value={formData.route_name}
                    onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="route-start">Starting Point</label>
                  <input
                    id="route-start"
                    type="text"
                    placeholder="e.g. Benz Circle, Vijayawada"
                    value={formData.start_point || ''}
                    onChange={(e) => setFormData({ ...formData, start_point: e.target.value })}
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="route-end">Destination Point</label>
                  <input
                    id="route-end"
                    type="text"
                    placeholder="e.g. SRM University AP Campus"
                    value={formData.end_point || ''}
                    onChange={(e) => setFormData({ ...formData, end_point: e.target.value })}
                  />
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
                  {submitting ? 'Creating...' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
