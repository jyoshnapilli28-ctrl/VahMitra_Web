import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import type { DriverVehicleReport } from '../../types/driver'
import { fetchDriverVehicleReports, addDriverVehicleReport } from '../../services/api'

interface DriverReportsTabProps {
  currentTripId?: number
}

export default function DriverReportsTab({ currentTripId }: DriverReportsTabProps) {
  const [reports, setReports] = useState<DriverVehicleReport[]>([])
  const [totalReports, setTotalReports] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form inputs
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('mechanical')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [description, setDescription] = useState('')
  const [tripId, setTripId] = useState<string>(currentTripId ? String(currentTripId) : '')
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successTicket, setSuccessTicket] = useState<string | null>(null)

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

  const loadReports = useCallback(() => {
    const currentGen = ++fetchGenRef.current
    const skip = (page - 1) * limit

    fetchDriverVehicleReports(skip, limit)
      .then((res: { reports?: DriverVehicleReport[]; total?: number }) => {
        if (fetchGenRef.current !== currentGen) return
        const list = res.reports || (Array.isArray(res) ? res : [])
        const total = res.total ?? list.length
        setReports(list)
        setTotalReports(total)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (fetchGenRef.current !== currentGen) return
        setError(err instanceof Error ? err.message : 'Failed to fetch vehicle reports')
        setLoading(false)
      })
  }, [page])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessTicket(null)

    if (!title.trim()) {
      setFormError('Please enter an issue title.')
      return
    }

    if (!description.trim()) {
      setFormError('Please describe the vehicle issue in detail.')
      return
    }

    setSubmitting(true)
    try {
      const res = await addDriverVehicleReport({
        title: title.trim(),
        category,
        severity,
        description: description.trim(),
        trip_id: tripId ? parseInt(tripId, 10) : undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      })

      const ticketNum = res?.ticket_number || 'Generated'
      setSuccessTicket(ticketNum)
      setTitle('')
      setDescription('')
      setCategory('mechanical')
      setSeverity('medium')
      setLatitude('')
      setLongitude('')
      setLoading(true)
      loadReports()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit issue report.')
    } finally {
      setSubmitting(false)
    }
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'low':
        return <span className="vh-badge vh-badge--info">Low Severity</span>
      case 'medium':
        return <span className="vh-badge vh-badge--warning">Medium Severity</span>
      case 'high':
        return (
          <span
            className="vh-badge"
            style={{ background: '#FFEDD5', color: '#C2410C', fontWeight: 700 }}
          >
            High Severity
          </span>
        )
      case 'critical':
        return <span className="vh-badge vh-badge--error">Critical Severity</span>
      default:
        return <span className="vh-badge vh-badge--neutral">{sev}</span>
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'open':
        return <span className="vh-badge vh-badge--error">Open</span>
      case 'in_progress':
        return <span className="vh-badge vh-badge--warning">In Progress</span>
      case 'resolved':
        return <span className="vh-badge vh-badge--success">Resolved</span>
      case 'closed':
        return <span className="vh-badge vh-badge--neutral">Closed</span>
      default:
        return <span className="vh-badge vh-badge--neutral">{st}</span>
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalReports / limit))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Submit Form Card */}
      <div className="driver-card" style={{ borderTop: '4px solid var(--color-primary)' }}>
        <div className="driver-card-title">
          <span>Submit Vehicle Incident / Defect Report</span>
        </div>

        {successTicket && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-success-bg, #F0FAF4)',
              border: '1px solid var(--color-success-border, #BBDFC8)',
              color: 'var(--color-success, #299D59)',
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            ✓ Report submitted successfully! Ticket:{' '}
            <strong style={{ fontFamily: 'monospace' }}>{successTicket}</strong>
          </div>
        )}

        {formError && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-error-bg, #FEF2F2)',
              border: '1px solid var(--color-error-border, #FECACA)',
              color: 'var(--color-error, #D9534F)',
              fontSize: 13,
            }}
          >
            ⚠️ {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="vh-form-group">
              <label className="vh-form-label">
                Report Title <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                required
                maxLength={200}
                placeholder="e.g. Unusual brake squeal during morning run"
                className="vh-form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                <option value="mechanical">Mechanical</option>
                <option value="electrical">Electrical</option>
                <option value="tyre">Tyre</option>
                <option value="brake">Brake</option>
                <option value="body">Body / Interior</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="vh-form-group">
              <label className="vh-form-label">
                Severity Level <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                className="vh-form-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
              >
                <option value="low">Low (Cosmetic/Minor)</option>
                <option value="medium">Medium (Requires attention)</option>
                <option value="high">High (Urgent inspection)</option>
                <option value="critical">Critical (Safety hazard)</option>
              </select>
            </div>

            <div className="vh-form-group">
              <label className="vh-form-label">Associated Trip ID</label>
              <input
                type="number"
                placeholder="Trip ID (optional)"
                className="vh-form-input"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
              />
            </div>

            <div className="vh-form-group">
              <label className="vh-form-label">GPS Latitude (Optional)</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 12.8231"
                className="vh-form-input"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>

            <div className="vh-form-group">
              <label className="vh-form-label">GPS Longitude (Optional)</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 80.0452"
                className="vh-form-input"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div className="vh-form-group">
            <label className="vh-form-label">
              Detailed Description <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide exact details of the incident, when it started, and symptoms"
              className="vh-form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="submit"
              className="vh-btn vh-btn-primary"
              disabled={submitting}
              style={{ padding: '10px 24px', fontWeight: 700 }}
            >
              {submitting ? 'Submitting Report...' : 'File Issue Report'}
            </button>
          </div>
        </form>
      </div>

      {/* Reports List Card */}
      <div className="driver-card">
        <div className="driver-card-title">
          <span>Submitted Incident &amp; Vehicle Reports</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Total: {totalReports}
          </span>
        </div>

        {loading ? (
          <div className="vh-state-box">
            <div className="vh-spinner" />
            <p>Loading reports...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box">
            <h4>Unable to Load Reports</h4>
            <p>{error}</p>
          </div>
        ) : reports.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  background: 'var(--color-card-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: 'var(--color-primary)' }}>
                      #{report.ticket_number}
                    </span>
                    <strong style={{ fontSize: 15, color: 'var(--color-text)' }}>
                      {report.title}
                    </strong>
                    <span className="vh-badge vh-badge--neutral" style={{ textTransform: 'capitalize' }}>
                      {report.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getSeverityBadge(report.severity)}
                    {getStatusBadge(report.status)}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-text)', lineHeight: 1.5 }}>
                  {report.description}
                </p>

                {report.management_response && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: '10px 14px',
                      background: 'var(--color-info-bg, #EEF4FC)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '4px solid var(--color-info, #2D7DD2)',
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-info)' }}>
                      MANAGEMENT RESPONSE
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text)' }}>
                      {report.management_response}
                    </p>
                  </div>
                )}

                <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Reported on {formatIST(report.created_at)}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 8,
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
          </div>
        ) : (
          <div className="driver-empty-state">
            <p>No vehicle issue reports logged.</p>
          </div>
        )}
      </div>
    </div>
  )
}
