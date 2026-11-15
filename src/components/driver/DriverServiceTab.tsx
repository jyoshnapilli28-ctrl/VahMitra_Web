import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import type { DriverServiceRecord } from '../../types/driver'
import { fetchDriverServiceRecords, addDriverServiceRecord } from '../../services/api'

export default function DriverServiceTab() {
  const [records, setRecords] = useState<DriverServiceRecord[]>([])
  const [upcomingAlerts, setUpcomingAlerts] = useState<DriverServiceRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Expandable form
  const [showForm, setShowForm] = useState(false)
  const [serviceDate, setServiceDate] = useState('')
  const [category, setCategory] = useState('general')
  const [description, setDescription] = useState('')
  const [odometerKm, setOdometerKm] = useState('')
  const [serviceCentre, setServiceCentre] = useState('')
  const [cost, setCost] = useState('')
  const [nextServiceDate, setNextServiceDate] = useState('')
  const [nextServiceKm, setNextServiceKm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const limit = 10
  const fetchGenRef = useRef(0)

  const formatIST = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
    } catch {
      return dateStr
    }
  }

  const loadData = useCallback(() => {
    const currentGen = ++fetchGenRef.current
    const skip = (page - 1) * limit

    fetchDriverServiceRecords(skip, limit)
      .then((res: { records?: DriverServiceRecord[]; total?: number }) => {
        if (fetchGenRef.current !== currentGen) return
        const list = res.records || (Array.isArray(res) ? res : [])
        const total = res.total ?? list.length
        setRecords(list)
        setTotalRecords(total)

        // Compute upcoming maintenance within 30 days
        const now = Date.now()
        const alerts = list.filter((r) => {
          if (!r.next_service_date) return false
          const target = new Date(r.next_service_date).getTime()
          const diffDays = (target - now) / (1000 * 60 * 60 * 24)
          return diffDays >= 0 && diffDays <= 30
        })
        setUpcomingAlerts(alerts)

        setLoading(false)
      })
      .catch((err: unknown) => {
        if (fetchGenRef.current !== currentGen) return
        setError(err instanceof Error ? err.message : 'Failed to fetch service history')
        setLoading(false)
      })
  }, [page])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!serviceDate) {
      setFormError('Please select a service date.')
      return
    }

    if (!description.trim()) {
      setFormError('Description is required.')
      return
    }

    setSubmitting(true)
    try {
      await addDriverServiceRecord({
        service_date: serviceDate,
        category,
        description: description.trim(),
        odometer_km: odometerKm ? parseFloat(odometerKm) : undefined,
        service_centre: serviceCentre.trim() || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        next_service_date: nextServiceDate || undefined,
        next_service_km: nextServiceKm ? parseFloat(nextServiceKm) : undefined,
      })

      setFormSuccess('Maintenance record logged successfully!')
      setServiceDate('')
      setCategory('general')
      setDescription('')
      setOdometerKm('')
      setServiceCentre('')
      setCost('')
      setNextServiceDate('')
      setNextServiceKm('')
      setShowForm(false)
      setLoading(true)
      loadData()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit service record.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Upcoming Maintenance Alert */}
      {upcomingAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {upcomingAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: '16px 20px',
                background: 'var(--color-warning-bg, #FEF7EC)',
                border: '1px solid var(--color-warning-border, #F5D8A0)',
                borderRadius: 'var(--radius-md, 10px)',
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 24 }}>🔧</span>
              <div>
                <strong style={{ color: '#92400E', fontSize: 14 }}>
                  Upcoming Scheduled Service Alert
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#92400E' }}>
                  Next service for <strong>{alert.category.replace('_', ' ')}</strong> scheduled for{' '}
                  <strong>{formatIST(alert.next_service_date)}</strong>
                  {alert.next_service_km && ` (or ${alert.next_service_km} km)`}.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expandable Form Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="vh-btn vh-btn-primary"
          onClick={() => {
            setShowForm(!showForm)
            setFormError(null)
            setFormSuccess(null)
          }}
        >
          {showForm ? 'Cancel Maintenance Log' : '+ Add Service Record'}
        </button>
      </div>

      {formSuccess && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-success-bg, #F0FAF4)',
            border: '1px solid var(--color-success-border, #BBDFC8)',
            color: 'var(--color-success, #299D59)',
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          ✓ {formSuccess}
        </div>
      )}

      {showForm && (
        <div className="driver-card" style={{ border: '1px solid var(--color-accent)' }}>
          <div className="driver-card-title">Log Vehicle Maintenance / Service</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-error-bg, #FEF2F2)',
                  border: '1px solid var(--color-error-border, #FECACA)',
                  color: 'var(--color-error, #D9534F)',
                  fontSize: 13,
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="vh-form-group">
                <label className="vh-form-label">
                  Service Date <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  className="vh-form-input"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                />
              </div>

              <div className="vh-form-group">
                <label className="vh-form-label">
                  Category <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <select
                  className="vh-form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="oil_change">Oil Change</option>
                  <option value="tire">Tire Service</option>
                  <option value="brake">Brake Inspection / Repair</option>
                  <option value="general">General Periodic Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="vh-form-group">
                <label className="vh-form-label">Odometer Reading (km)</label>
                <input
                  type="number"
                  placeholder="e.g. 54200"
                  className="vh-form-input"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                />
              </div>

              <div className="vh-form-group">
                <label className="vh-form-label">Service Centre / Workshop</label>
                <input
                  type="text"
                  placeholder="e.g. SRM Auto Care Center"
                  className="vh-form-input"
                  value={serviceCentre}
                  onChange={(e) => setServiceCentre(e.target.value)}
                />
              </div>

              <div className="vh-form-group">
                <label className="vh-form-label">Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 3500"
                  className="vh-form-input"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>

              <div className="vh-form-group">
                <label className="vh-form-label">Next Service Date</label>
                <input
                  type="date"
                  className="vh-form-input"
                  value={nextServiceDate}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                />
              </div>

              <div className="vh-form-group">
                <label className="vh-form-label">Next Service Km Target</label>
                <input
                  type="number"
                  placeholder="e.g. 60000"
                  className="vh-form-input"
                  value={nextServiceKm}
                  onChange={(e) => setNextServiceKm(e.target.value)}
                />
              </div>
            </div>

            <div className="vh-form-group">
              <label className="vh-form-label">
                Description &amp; Work Details <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe parts replaced or maintenance performed"
                className="vh-form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                className="vh-btn vh-btn-secondary"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="vh-btn vh-btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving Record...' : 'Submit Service Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Service History Table */}
      <div className="driver-card">
        <div className="driver-card-title">
          <span>Service &amp; Maintenance Records</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Total: {totalRecords} records
          </span>
        </div>

        {loading ? (
          <div className="vh-state-box">
            <div className="vh-spinner" />
            <p>Loading maintenance logs...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box">
            <h4>Unable to Load Service Records</h4>
            <p>{error}</p>
          </div>
        ) : records.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="vh-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th>Workshop</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    let badgeClass = 'vh-badge--neutral'
                    if (r.status === 'approved') badgeClass = 'vh-badge--success'
                    else if (r.status === 'pending') badgeClass = 'vh-badge--warning'
                    else if (r.status === 'rejected') badgeClass = 'vh-badge--error'

                    const descSnippet =
                      r.description.length > 100
                        ? `${r.description.slice(0, 100)}...`
                        : r.description

                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{formatIST(r.service_date)}</td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {r.category.replace('_', ' ')}
                        </td>
                        <td style={{ maxWidth: 300 }} title={r.description}>
                          {descSnippet}
                        </td>
                        <td>
                          {r.cost !== null && r.cost !== undefined
                            ? `₹${r.cost.toLocaleString('en-IN')}`
                            : '-'}
                        </td>
                        <td>
                          <span className={`vh-badge ${badgeClass}`} style={{ textTransform: 'capitalize' }}>
                            {r.status || 'pending'}
                          </span>
                        </td>
                        <td>{r.service_centre || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 18,
                  paddingTop: 12,
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Page {page} of {totalPages}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="vh-btn vh-btn-secondary"
                    disabled={page <= 1}
                    onClick={() => {
                      setLoading(true)
                      setPage((p) => Math.max(1, p - 1))
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="vh-btn vh-btn-secondary"
                    disabled={page >= totalPages}
                    onClick={() => {
                      setLoading(true)
                      setPage((p) => Math.min(totalPages, p + 1))
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="driver-empty-state">
            <p>No maintenance or service entries found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
