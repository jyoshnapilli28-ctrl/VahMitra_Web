import { useState, useEffect, useRef, useCallback } from 'react'
import type { DriverTrip } from '../../types/driver'
import { fetchDriverTrips } from '../../services/api'

interface DriverTripsTabProps {
  currentTrip?: DriverTrip | null
  onTripStart: () => void
  onTripStop: (tripId: number) => void
}

export default function DriverTripsTab({
  currentTrip,
  onTripStart,
  onTripStop,
}: DriverTripsTabProps) {
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [totalTrips, setTotalTrips] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const calculateDuration = (startStr?: string | null, endStr?: string | null) => {
    if (!startStr || !endStr) return 'In Progress'
    const start = new Date(startStr).getTime()
    const end = new Date(endStr).getTime()
    if (isNaN(start) || isNaN(end) || end < start) return '-'

    const diffMinutes = Math.floor((end - start) / (1000 * 60))
    const hours = Math.floor(diffMinutes / 60)
    const mins = diffMinutes % 60
    if (hours === 0) return `${mins} mins`
    return `${hours} hrs ${mins} mins`
  }

  const loadTrips = useCallback(() => {
    const currentGen = ++fetchGenRef.current
    const skip = (page - 1) * limit

    fetchDriverTrips(skip, limit)
      .then((res: { trips?: DriverTrip[]; records?: DriverTrip[]; total?: number }) => {
        if (fetchGenRef.current !== currentGen) return
        const list = res.trips || res.records || (Array.isArray(res) ? res : [])
        const total = res.total ?? list.length
        setTrips(list)
        setTotalTrips(total)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (fetchGenRef.current !== currentGen) return
        setError(err instanceof Error ? err.message : 'Failed to load trip history')
        setLoading(false)
      })
  }, [page])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  const isTripActive = currentTrip?.status === 'active'
  const totalPages = Math.max(1, Math.ceil(totalTrips / limit))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Trip Control Card */}
      <div
        className="driver-card"
        style={{
          borderLeft: isTripActive
            ? '5px solid var(--color-success, #299D59)'
            : '5px solid var(--color-border, #E6E8DE)',
          backgroundColor: isTripActive
            ? 'var(--color-success-bg, #F0FAF4)'
            : 'var(--color-card-bg, #FFFFFF)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="driver-card-title" style={{ marginBottom: 4 }}>
              Trip Controls
            </div>
            {isTripActive ? (
              <div>
                <span className="vh-badge vh-badge--success" style={{ fontWeight: 700 }}>
                  ● Journey in Progress
                </span>
                <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--color-text)' }}>
                  Active trip began at <strong>{formatIST(currentTrip.started_at)}</strong>
                </p>
              </div>
            ) : (
              <div>
                <span className="vh-badge vh-badge--neutral">Ready to Start</span>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  No journey is currently running. Click Start Journey when departing.
                </p>
              </div>
            )}
          </div>

          <div>
            {isTripActive ? (
              <button
                type="button"
                className="vh-btn vh-btn-danger"
                style={{ padding: '10px 20px', fontWeight: 700 }}
                onClick={() => onTripStop(currentTrip.id)}
              >
                Stop Journey
              </button>
            ) : (
              <button
                type="button"
                className="vh-btn vh-btn-primary"
                style={{ padding: '10px 20px', fontWeight: 700 }}
                onClick={onTripStart}
              >
                Start Journey
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trip History Section */}
      <div className="driver-card">
        <div className="driver-card-title">
          <span>Trip History</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Total Recorded: {totalTrips}
          </span>
        </div>

        {loading ? (
          <div className="vh-state-box">
            <div className="vh-spinner" />
            <p>Loading trip logs...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box">
            <h4>Unable to Load Trips</h4>
            <p>{error}</p>
          </div>
        ) : trips.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="vh-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Started At (IST)</th>
                    <th>Ended At (IST)</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t) => {
                    let badgeClass = 'vh-badge--neutral'
                    if (t.status === 'active') badgeClass = 'vh-badge--success'
                    else if (t.status === 'cancelled') badgeClass = 'vh-badge--error'

                    return (
                      <tr key={t.id}>
                        <td>
                          <span className={`vh-badge ${badgeClass}`} style={{ textTransform: 'capitalize' }}>
                            {t.status}
                          </span>
                        </td>
                        <td>{formatIST(t.started_at)}</td>
                        <td>
                          {t.status === 'active' || !t.ended_at
                            ? <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>In Progress</span>
                            : formatIST(t.ended_at)}
                        </td>
                        <td>{calculateDuration(t.started_at, t.ended_at)}</td>
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
            <p>No trip records found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
