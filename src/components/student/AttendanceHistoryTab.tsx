import { useState, useEffect, useRef } from 'react'
import type {
  AttendanceRecordItem,
  AttendanceSummaryResponse,
} from '../../types/student'
import {
  fetchStudentAttendance,
  fetchStudentAttendanceSummary,
} from '../../services/api'
import { CalendarDaysIcon, CheckCircle2Icon } from '../common/Icons'

export default function AttendanceHistoryTab() {
  const [summary, setSummary] = useState<AttendanceSummaryResponse | null>(null)
  const [records, setRecords] = useState<AttendanceRecordItem[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const limit = 15

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('')
  const [selectedYear, setSelectedYear] = useState<number | ''>(2026)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tracks the current fetch generation to discard stale responses.
  // Incremented synchronously in event handlers — never inside the effect body.
  const fetchGenRef = useRef(0)

  // Fetch summary on mount
  useEffect(() => {
    let isMounted = true
    fetchStudentAttendanceSummary()
      .then((res) => {
        if (!isMounted) return
        setSummary(res)
      })
      .catch((err: unknown) => {
        console.error('Failed to load attendance summary:', err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Fetch paginated & filtered records
  useEffect(() => {
    // Capture the generation that was current when this effect ran.
    // If a newer effect fires before this one resolves, the ref will have
    // advanced and the stale response will be silently dropped.
    const currentGen = fetchGenRef.current

    const params: {
      month?: number
      year?: number
      start_date?: string
      end_date?: string
      page: number
      limit: number
    } = { page, limit }

    if (selectedMonth !== '') params.month = Number(selectedMonth)
    if (selectedYear !== '') params.year = Number(selectedYear)
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate

    fetchStudentAttendance(params)
      .then((res) => {
        if (fetchGenRef.current !== currentGen) return
        setRecords(res.records)
        setTotalRecords(res.total)
        setTotalPages(res.total_pages)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (fetchGenRef.current !== currentGen) return
        setError(err instanceof Error ? err.message : 'Unable to load attendance records.')
        setLoading(false)
      })
  }, [page, selectedMonth, selectedYear, startDate, endDate])

  function handleResetFilters() {
    fetchGenRef.current += 1
    setLoading(true)
    setError(null)
    setSelectedMonth('')
    setSelectedYear(2026)
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Verified Metrics KPI Cards */}
      <div className="student-grid-3" style={{ margin: 0 }}>
        {/* Total Boardings */}
        <div className="student-stat-card">
          <div className="student-stat-card-title">Total Boardings</div>
          <div className="student-stat-card-value" style={{ color: 'var(--srm-navy)' }}>
            {summary ? summary.total_boardings : '—'}
          </div>
          <div className="student-stat-card-sub">
            Verified campus transit boarding events
          </div>
        </div>

        {/* Distinct Attendance Days */}
        <div className="student-stat-card">
          <div className="student-stat-card-title">Distinct Attendance Days</div>
          <div className="student-stat-card-value" style={{ color: 'var(--srm-olive)' }}>
            {summary ? summary.distinct_attendance_days : '—'}
          </div>
          <div className="student-stat-card-sub">
            Unique calendar days with transit activity (Asia/Kolkata)
          </div>
        </div>

        {/* Most Recent Boarding */}
        <div className="student-stat-card">
          <div className="student-stat-card-title">Latest Boarding</div>
          {summary?.most_recent_boarding ? (
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--srm-navy)' }}>
                {summary.most_recent_boarding.formatted_date}
              </div>
              <div style={{ fontSize: 12, color: 'var(--srm-olive)', fontWeight: 600, marginTop: 2 }}>
                {summary.most_recent_boarding.formatted_time} · Bus {summary.most_recent_boarding.bus_number} ({summary.most_recent_boarding.route_code})
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: 'var(--srm-text-muted)', marginTop: 8 }}>
              No recorded boardings yet
            </div>
          )}
          <div className="student-stat-card-sub" style={{ marginTop: 6 }}>
            Electronic pass verification
          </div>
        </div>
      </div>

      {/* 2. Monthly Attendance Breakdown */}
      {summary && summary.monthly_history && summary.monthly_history.length > 0 && (
        <div className="student-card" style={{ padding: 18 }}>
          <div className="student-card-title" style={{ marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDaysIcon size={18} /> Monthly Attendance Breakdown
            </span>
            <span style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
              Asia/Kolkata Standard Calendar
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {summary.monthly_history.map((m) => (
              <div
                key={m.month_key}
                style={{
                  background: 'var(--srm-cream)',
                  border: '1px solid var(--srm-border)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--srm-navy)' }}>
                  {m.month_label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--srm-text-dark)' }}>
                  <strong>{m.boardings}</strong> recorded boarding{m.boardings === 1 ? '' : 's'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--srm-olive)', fontWeight: 600 }}>
                  <strong>{m.distinct_days}</strong> distinct attendance day{m.distinct_days === 1 ? '' : 's'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Detailed Attendance Records Table with Filters */}
      <div className="student-card" style={{ padding: 18 }}>
        <div className="student-card-title" style={{ marginBottom: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDaysIcon size={18} /> Verified Attendance Records ({totalRecords})
          </span>
          <span style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
            Tamper-Resistant Transit Logs
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'flex-end',
            marginBottom: 18,
            padding: '12px 14px',
            background: 'var(--srm-cream)',
            border: '1px solid var(--srm-border)',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--srm-navy)' }}>
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                fetchGenRef.current += 1
                setLoading(true)
                setError(null)
                setSelectedMonth(e.target.value === '' ? '' : Number(e.target.value))
                setPage(1)
              }}
              style={{
                fontSize: 12.5,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--srm-border)',
                background: '#FFFFFF',
              }}
            >
              <option value="">All Months</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--srm-navy)' }}>
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                fetchGenRef.current += 1
                setLoading(true)
                setError(null)
                setSelectedYear(e.target.value === '' ? '' : Number(e.target.value))
                setPage(1)
              }}
              style={{
                fontSize: 12.5,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--srm-border)',
                background: '#FFFFFF',
              }}
            >
              <option value="">All Years</option>
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--srm-navy)' }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                fetchGenRef.current += 1
                setLoading(true)
                setError(null)
                setStartDate(e.target.value)
                setPage(1)
              }}
              style={{
                fontSize: 12.5,
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid var(--srm-border)',
                background: '#FFFFFF',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--srm-navy)' }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                fetchGenRef.current += 1
                setLoading(true)
                setError(null)
                setEndDate(e.target.value)
                setPage(1)
              }}
              style={{
                fontSize: 12.5,
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid var(--srm-border)',
                background: '#FFFFFF',
              }}
            />
          </div>

          <button
            type="button"
            className="vh-btn vh-btn-secondary"
            onClick={handleResetFilters}
            style={{ fontSize: 12, padding: '6px 14px', alignSelf: 'flex-end' }}
          >
            Clear Filters
          </button>
        </div>

        {/* Attendance Records Table */}
        {loading ? (
          <div className="vh-state-box" style={{ padding: '36px 12px' }}>
            <div className="vh-spinner" />
            <p>Loading transit records...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box" style={{ padding: '36px 12px' }}>
            <h4>Unable to Load Attendance</h4>
            <p>{error}</p>
          </div>
        ) : records.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid var(--srm-border)',
                      color: 'var(--srm-navy)',
                      fontSize: 11.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px' }}>Boarding Time</th>
                    <th style={{ padding: '10px 12px' }}>Bus &amp; Route</th>
                    <th style={{ padding: '10px 12px' }}>Assigned Driver</th>
                    <th style={{ padding: '10px 12px' }}>Verification Method</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid var(--srm-border)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--srm-cream)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--srm-navy)' }}>
                        {r.date}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--srm-text-dark)' }}>
                        {r.time}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--srm-navy)' }}>
                          Bus {r.bus_number}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--srm-text-muted)' }}>
                          {r.route_name} ({r.route_code})
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--srm-text-dark)' }}>
                        {r.driver_name}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          className="vh-badge"
                          style={{
                            background:
                              r.verification_method_raw === 'qr_code'
                                ? 'rgba(120, 132, 59, 0.15)'
                                : 'rgba(16, 45, 70, 0.12)',
                            color:
                              r.verification_method_raw === 'qr_code'
                                ? 'var(--srm-olive)'
                                : 'var(--srm-navy)',
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        >
                          {r.verification_method}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#065f46',
                            fontWeight: 700,
                            fontSize: 11.5,
                          }}
                        >
                          <CheckCircle2Icon size={14} /> {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 18,
                  paddingTop: 12,
                  borderTop: '1px solid var(--srm-border)',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--srm-text-muted)' }}>
                  Showing page {page} of {totalPages} ({totalRecords} records)
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="vh-btn vh-btn-secondary"
                    style={{ fontSize: 12, padding: '4px 12px' }}
                    disabled={page <= 1}
                    onClick={() => {
                      fetchGenRef.current += 1
                      setLoading(true)
                      setError(null)
                      setPage((p) => Math.max(1, p - 1))
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="vh-btn vh-btn-secondary"
                    style={{ fontSize: 12, padding: '4px 12px' }}
                    disabled={page >= totalPages}
                    onClick={() => {
                      fetchGenRef.current += 1
                      setLoading(true)
                      setError(null)
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
          <div
            style={{
              textAlign: 'center',
              padding: '36px 12px',
              color: 'var(--srm-text-muted)',
            }}
          >
            <p style={{ margin: 0, fontSize: 13.5 }}>
              No verified transit attendance records found for this period.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

