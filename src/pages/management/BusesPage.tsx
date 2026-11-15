import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { fetchBuses, createBus, updateBusStatus } from '../../services/api'
import type { BusItem, BusCreatePayload } from '../../types/management'

export default function BusesPage() {
  const [buses, setBuses] = useState<BusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [reloadKey, setReloadKey] = useState(0)

  // Create Modal
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<BusCreatePayload>({
    bus_number: '',
    registration_number: '',
    capacity: 50,
  })

  // Action status toggle loading
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchBuses()
      .then((res) => {
        if (!isMounted) return
        setBuses(res.buses)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load buses')
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

  async function handleCreateBus(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (formData.capacity <= 0) {
      setFormError('Bus capacity must be greater than 0')
      return
    }

    setSubmitting(true)
    try {
      await createBus({
        bus_number: formData.bus_number.trim(),
        registration_number: formData.registration_number.trim(),
        capacity: Number(formData.capacity),
      })
      setShowModal(false)
      setFormData({
        bus_number: '',
        registration_number: '',
        capacity: 50,
      })
      setLoading(true)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to register bus')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleStatus(bus: BusItem) {
    setTogglingId(bus.id)
    try {
      await updateBusStatus(bus.id, !bus.is_active)
      // Update locally
      setBuses((prev) =>
        prev.map((b) => (b.id === bus.id ? { ...b, is_active: !b.is_active } : b))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update bus status')
    } finally {
      setTogglingId(null)
    }
  }

  const filteredBuses = buses.filter((bus) => {
    const matchesSearch =
      bus.bus_number.toLowerCase().includes(search.toLowerCase()) ||
      bus.registration_number.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    if (filterActive === 'active') return bus.is_active
    if (filterActive === 'inactive') return !bus.is_active
    return true
  })

  return (
    <div>
      <div className="mgmt-page-header">
        <div className="mgmt-page-title-block">
          <h2>Bus Fleet Management</h2>
          <p>Register campus buses, inspect vehicle capacities, and manage operational status</p>
        </div>
        <div className="mgmt-page-actions">
          <button
            type="button"
            className="mgmt-primary-btn"
            onClick={() => setShowModal(true)}
          >
            + Register Bus
          </button>
        </div>
      </div>

      <div className="mgmt-toolbar">
        <input
          type="text"
          className="mgmt-search-input"
          placeholder="Filter by bus number or registration number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`mgmt-secondary-btn ${filterActive === 'all' ? 'active' : ''}`}
            onClick={() => setFilterActive('all')}
          >
            All ({buses.length})
          </button>
          <button
            type="button"
            className={`mgmt-secondary-btn ${filterActive === 'active' ? 'active' : ''}`}
            onClick={() => setFilterActive('active')}
          >
            Active ({buses.filter((b) => b.is_active).length})
          </button>
          <button
            type="button"
            className={`mgmt-secondary-btn ${filterActive === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterActive('inactive')}
          >
            Inactive ({buses.filter((b) => !b.is_active).length})
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
            <h4>Loading Fleet...</h4>
          </div>
        ) : filteredBuses.length > 0 ? (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Bus ID</th>
                <th>Bus Number</th>
                <th>Registration Plate</th>
                <th>Seating Capacity</th>
                <th>Operational Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuses.map((bus) => (
                <tr key={bus.id}>
                  <td>#{bus.id}</td>
                  <td>
                    <strong>{bus.bus_number}</strong>
                  </td>
                  <td>
                    <code>{bus.registration_number}</code>
                  </td>
                  <td>{bus.capacity} seats</td>
                  <td>
                    {bus.is_active ? (
                      <span className="mgmt-badge mgmt-badge--success">Active</span>
                    ) : (
                      <span className="mgmt-badge mgmt-badge--danger">Inactive</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="mgmt-secondary-btn"
                      disabled={togglingId === bus.id}
                      onClick={() => handleToggleStatus(bus)}
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {togglingId === bus.id
                        ? 'Updating...'
                        : bus.is_active
                          ? 'Deactivate'
                          : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mgmt-state-box">
            <h4>No Buses Found</h4>
            <p>{search ? 'No buses match your filter criteria.' : 'No buses currently registered.'}</p>
          </div>
        )}
      </div>

      {/* Add Bus Modal */}
      {showModal && (
        <div className="mgmt-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3>Register New Campus Bus</h3>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateBus}>
              <div className="mgmt-modal-body">
                {formError && (
                  <div className="mgmt-error-alert" style={{ marginBottom: '14px' }}>
                    {formError}
                  </div>
                )}
                <div className="mgmt-form-group">
                  <label htmlFor="bus-number">Bus Identifier / Number *</label>
                  <input
                    id="bus-number"
                    type="text"
                    required
                    placeholder="e.g. BUS-42 or 42"
                    value={formData.bus_number}
                    onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="bus-regno">Vehicle Registration Number *</label>
                  <input
                    id="bus-regno"
                    type="text"
                    required
                    placeholder="e.g. AP 16 TX 9999"
                    value={formData.registration_number}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_number: e.target.value })
                    }
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="bus-capacity">Passenger Capacity (Seats) *</label>
                  <input
                    id="bus-capacity"
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 0 })
                    }
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
                  {submitting ? 'Registering...' : 'Register Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
