import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { fetchDrivers, createDriver } from '../../services/api'
import type { DriverItem, DriverCreatePayload } from '../../types/management'

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const pageSize = 25

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<DriverCreatePayload>({
    username: '',
    password: '',
    driver_name: '',
    phone: '',
    license_number: '',
  })

  useEffect(() => {
    let isMounted = true

    fetchDrivers(search, page * pageSize, pageSize)
      .then((res) => {
        if (!isMounted) return
        setDrivers(res.drivers)
        setTotal(res.total)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load drivers')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [search, page, reloadKey])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setPage(0)
    setReloadKey((k) => k + 1)
  }

  function handleRetry() {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  async function handleCreateDriver(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (formData.password.length < 12) {
      setFormError('Password must be at least 12 characters long')
      return
    }

    setSubmitting(true)
    try {
      await createDriver({
        username: formData.username.trim(),
        password: formData.password,
        driver_name: formData.driver_name.trim(),
        phone: formData.phone?.trim() || null,
        license_number: formData.license_number?.trim() || null,
      })
      setShowCreateModal(false)
      setFormData({
        username: '',
        password: '',
        driver_name: '',
        phone: '',
        license_number: '',
      })
      setLoading(true)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to register driver')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mgmt-page-header">
        <div className="mgmt-page-title-block">
          <h2>Driver Registry</h2>
          <p>Manage transport staff, driver license records, and duty allocations</p>
        </div>
        <div className="mgmt-page-actions">
          <button
            type="button"
            className="mgmt-primary-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Register Driver
          </button>
        </div>
      </div>

      <div className="mgmt-toolbar">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input
            type="text"
            className="mgmt-search-input"
            placeholder="Search by driver name, phone, or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="mgmt-secondary-btn">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="mgmt-secondary-btn"
              onClick={() => {
                setSearch('')
                setPage(0)
                setLoading(true)
                setReloadKey((k) => k + 1)
              }}
            >
              Clear
            </button>
          )}
        </form>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          Total: <strong>{total}</strong> drivers
        </span>
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
            <h4>Loading Drivers...</h4>
          </div>
        ) : drivers.length > 0 ? (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Phone</th>
                <th>License Number</th>
                <th>Account Status</th>
                <th>Current Allocation</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const activeAllocation = driver.allocations.find(
                  (a) => a.status === 'active'
                )

                return (
                  <tr key={driver.id}>
                    <td>
                      <strong>{driver.driver_name}</strong>
                    </td>
                    <td>{driver.phone || '—'}</td>
                    <td>
                      <code>{driver.license_number || '—'}</code>
                    </td>
                    <td>
                      {driver.account_created ? (
                        <span className="mgmt-badge mgmt-badge--success">Active Account</span>
                      ) : (
                        <span className="mgmt-badge mgmt-badge--warning">Pending Login</span>
                      )}
                    </td>
                    <td>
                      {activeAllocation?.bus ? (
                        <span className="mgmt-badge mgmt-badge--neutral">
                          Bus {activeAllocation.bus.bus_number}
                          {activeAllocation.route ? ` · ${activeAllocation.route.route_code}` : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Unassigned</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="mgmt-state-box">
            <h4>No Drivers Found</h4>
            <p>{search ? 'No driver records matched your search query.' : 'No drivers registered.'}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="mgmt-secondary-btn"
              disabled={page === 0}
              onClick={() => {
                setLoading(true)
                setPage((p) => Math.max(0, p - 1))
              }}
            >
              Previous
            </button>
            <button
              type="button"
              className="mgmt-secondary-btn"
              disabled={(page + 1) * pageSize >= total}
              onClick={() => {
                setLoading(true)
                setPage((p) => p + 1)
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Register Driver Modal */}
      {showCreateModal && (
        <div className="mgmt-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3>Register New Driver</h3>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateDriver}>
              <div className="mgmt-modal-body">
                {formError && (
                  <div className="mgmt-error-alert" style={{ marginBottom: '14px' }}>
                    {formError}
                  </div>
                )}
                <div className="mgmt-form-group">
                  <label htmlFor="driver-name">Full Driver Name *</label>
                  <input
                    id="driver-name"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="driver-username">Username *</label>
                  <input
                    id="driver-username"
                    type="text"
                    required
                    placeholder="e.g. ramesh_k"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                  <div className="mgmt-form-hint">At least 3 characters</div>
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="driver-password">Initial Password *</label>
                  <input
                    id="driver-password"
                    type="password"
                    required
                    placeholder="Minimum 12 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <div className="mgmt-form-hint">Must be at least 12 characters</div>
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="driver-phone">Phone Number</label>
                  <input
                    id="driver-phone"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="driver-license">Driving License Number</label>
                  <input
                    id="driver-license"
                    type="text"
                    placeholder="e.g. AP1620180012345"
                    value={formData.license_number || ''}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="mgmt-modal-footer">
                <button
                  type="button"
                  className="mgmt-secondary-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mgmt-primary-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Registering...' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
