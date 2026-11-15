import { useState, useEffect, useRef } from 'react'
import type { DriverBoardingRecord, DriverBoardingResponse } from '../../types/driver'
import { fetchDriverBoardingRecords } from '../../services/api'

interface DriverBoardingRecordsTabProps {
  allocationId?: number
}

export default function DriverBoardingRecordsTab({
  allocationId,
}: DriverBoardingRecordsTabProps) {
  void allocationId
  const [records, setRecords] = useState<DriverBoardingRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)
  const [filterDate, setFilterDate] = useState('')
  const [filterTripId, setFilterTripId] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const limit = 15
  const fetchGen = useRef(0)

  const formatIST = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    } catch {
      return dateStr
    }
  }

  useEffect(() => {
    fetchGen.current += 1
    const gen = fetchGen.current

    const skip = (page - 1) * limit
    const params: {
      date?: string
      trip_id?: number
      skip: number
      limit: number
    } = { skip, limit }

    if (filterDate) params.date = filterDate
    if (filterTripId !== '') params.trip_id = Number(filterTripId)

    fetchDriverBoardingRecords(params)
      .then((res: DriverBoardingResponse) => {
        if (gen !== fetchGen.current) return
        const list = res.records || (Array.isArray(res) ? res : [])
        const total = res.total ?? list.length
        setRecords(list)
        setTotalRecords(total)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (gen !== fetchGen.current) return
        setError(err instanceof Error ? err.message : 'Failed to fetch boarding records')
        setLoading(false)
      })
  }, [page, filterDate, filterTripId])

  const handleReset = () => {
    setLoading(true)
    setError(null)
    setFilterDate('')
    setFilterTripId('')
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(totalRecords / limit))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filter Bar */}
      <div className="driver-card" style={{ padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
              Boarding Date
            </label>
            <input
              type="date"
              className="vh-form-input"
              value={filterDate}
              onChange={(e) => {
                setLoading(true)
                setError(null)
                setFilterDate(e.target.value)
                setPage(1)
              }}
              style={{ fontSize: 13, padding: '6px 12px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
              Trip ID
            </label>
            <input
              type="number"
              placeholder="e.g. 101"
              className="vh-form-input"
              value={filterTripId}
              onChange={(e) => {
                setLoading(true)
                setError(null)
                setFilterTripId(e.target.value === '' ? '' : Number(e.target.value))
                setPage(1)
              }}
              style={{ fontSize: 13, padding: '6px 12px', width: 130 }}
            />
          </div>

          <button
            type="button"
            className="vh-btn vh-btn-secondary"
            onClick={handleReset}
            style={{ padding: '7px 16px', fontSize: 13 }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Boarding Records Table Card */}
      <div className="driver-card">
        <div className="driver-card-title">
          <span>Student Boarding Records</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Total Found: {totalRecords}
          </span>
        </div>

        {loading ? (
          <div className="vh-state-box">
            <div className="vh-spinner" />
            <p>Loading boarding records...</p>
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
                    <th>Student Name</th>
                    <th>Registration No.</th>
                    <th>Boarding Time (IST)</th>
                    <th>Verification Method</th>
                    <th>Trip ID</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {r.student_name}
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>
                        {r.registration_number}
                      </td>
                      <td>{formatIST(r.boarding_time)}</td>
                      <td>
                        <span className="vh-badge vh-badge--info">
                          {r.verification_method || 'Verified'}
                        </span>
                      </td>
                      <td>{r.trip_id !== null && r.trip_id !== undefined ? `#${r.trip_id}` : '-'}</td>
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
            <p>No verified boarding records match your selection.</p>
          </div>
        )}
      </div>
    </div>
  )
}
