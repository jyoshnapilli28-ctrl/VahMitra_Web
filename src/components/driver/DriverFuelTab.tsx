import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import type { DriverFuelRecord, DriverFuelResponse } from '../../types/driver'
import { fetchDriverFuelRecords, addDriverFuelRecord } from '../../services/api'

export default function DriverFuelTab() {
  const [records, setRecords] = useState<DriverFuelRecord[]>([])
  const [summary, setSummary] = useState<{
    total_fuel_litres: number
    total_amount_paid: number
    record_count: number
  }>({
    total_fuel_litres: 0,
    total_amount_paid: 0,
    record_count: 0,
  })
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [fuelLitres, setFuelLitres] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [odometerKm, setOdometerKm] = useState('')
  const [fuelStation, setFuelStation] = useState('')
  const [notes, setNotes] = useState('')
  const [recordedAt, setRecordedAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const limit = 10
  const fetchGenRef = useRef(0)

  const formatIST = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    } catch {
      return dateStr
    }
  }

  const loadData = useCallback(() => {
    const currentGen = ++fetchGenRef.current
    const skip = (page - 1) * limit

    fetchDriverFuelRecords(skip, limit)
      .then((res: DriverFuelResponse) => {
        if (fetchGenRef.current !== currentGen) return
        const list = res.records || []
        const total = res.total ?? list.length
        setRecords(list)
        setTotalRecords(total)
        if (res.summary) {
          setSummary(res.summary)
        } else {
          const sumLitres = list.reduce((acc: number, r: DriverFuelRecord) => acc + (r.fuel_litres || 0), 0)
          const sumPaid = list.reduce((acc: number, r: DriverFuelRecord) => acc + (r.amount_paid || 0), 0)
          setSummary({
            total_fuel_litres: sumLitres,
            total_amount_paid: sumPaid,
            record_count: total,
          })
        }
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (fetchGenRef.current !== currentGen) return
        setError(err instanceof Error ? err.message : 'Failed to fetch fuel records')
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

    const litres = parseFloat(fuelLitres)
    const paid = parseFloat(amountPaid)

    if (isNaN(litres) || litres < 0.1) {
      setFormError('Fuel litres must be at least 0.1 L')
      return
    }

    if (isNaN(paid) || paid < 0) {
      setFormError('Amount paid must be 0 or greater')
      return
    }

    setSubmitting(true)
    try {
      await addDriverFuelRecord({
        fuel_litres: litres,
        amount_paid: paid,
        odometer_km: odometerKm ? parseFloat(odometerKm) : undefined,
        fuel_station: fuelStation.trim() || undefined,
        notes: notes.trim() || undefined,
        recorded_at: recordedAt ? new Date(recordedAt).toISOString() : undefined,
      })

      setFormSuccess('Fuel log successfully added!')
      setFuelLitres('')
      setAmountPaid('')
      setOdometerKm('')
      setFuelStation('')
      setNotes('')
      setRecordedAt('')
      setShowForm(false)
      setLoading(true)
      loadData()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit fuel record.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Summary Cards */}
      <div className="driver-grid" style={{ marginBottom: 0 }}>
        <div className="driver-card">
          <div className="driver-card-title">Total Fuel Filled</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>
            {summary.total_fuel_litres.toFixed(1)} L
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Cumulative volume
          </p>
        </div>

        <div className="driver-card">
          <div className="driver-card-title">Total Fuel Expense</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-accent)' }}>
            ₹{summary.total_amount_paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Total amount paid
          </p>
        </div>

        <div className="driver-card">
          <div className="driver-card-title">Fuel Records Count</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)' }}>
            {summary.record_count}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Logged transactions
          </p>
        </div>
      </div>

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
          {showForm ? 'Cancel New Log' : '+ Add Fuel Record'}
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
          <div className="driver-card-title">Log New Fuel Purchase</div>
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
                  Fuel Quantity (Litres) <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  placeholder="e.g. 45.5"
                  className="vh-form-input"
                  value={fuelLitres}
                  onChange={(e) => setFuelLitres(e.target.value)}
                />
              </div>

              <div className="vh-form-group">
                <label className="vh-form-label">
                  Amount Paid (₹) <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 4500"
                  className="vh-form-input"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </div>

              <div className="vh-form-group">
                <label className="vh-form-label">Odometer Reading (km)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 52400"
                  className="vh-form-input"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                />
              </div>

              <div className="vh-form-group">
                <label className="vh-form-label">Fuel Station / Vendor</label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Indian Oil, Campus Gate"
                  className="vh-form-input"
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                />
              </div>

              <div className="vh-form-group">
                <label className="vh-form-label">Purchase Date &amp; Time</label>
                <input
                  type="datetime-local"
                  className="vh-form-input"
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                />
              </div>
            </div>

            <div className="vh-form-group">
              <label className="vh-form-label">Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Optional comments or receipt reference"
                className="vh-form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                {submitting ? 'Saving Record...' : 'Submit Fuel Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fuel Records Table Card */}
      <div className="driver-card">
        <div className="driver-card-title">
          <span>Fuel Purchase History</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Total: {totalRecords} records
          </span>
        </div>

        {loading ? (
          <div className="vh-state-box">
            <div className="vh-spinner" />
            <p>Loading fuel records...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box">
            <h4>Unable to Load Records</h4>
            <p>{error}</p>
          </div>
        ) : records.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="vh-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date &amp; Time (IST)</th>
                    <th>Volume</th>
                    <th>Amount Paid</th>
                    <th>Odometer</th>
                    <th>Station</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{formatIST(r.recorded_at)}</td>
                      <td>{r.fuel_litres} L</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        ₹{r.amount_paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td>{r.odometer_km !== null && r.odometer_km !== undefined ? `${r.odometer_km} km` : '-'}</td>
                      <td>{r.fuel_station || '-'}</td>
                    </tr>
                  ))}
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
            <p>No fuel entries logged yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
