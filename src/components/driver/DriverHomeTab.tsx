import type { DriverAttendanceItem, DriverDashboardData, DriverTrip } from '../../types/driver'

interface DriverHomeTabProps {
  dashboardData?: DriverDashboardData | null
  currentTrip?: DriverTrip | null
  onTripStart: () => void
  onTripStop: (tripId: number) => void
}

export default function DriverHomeTab({
  dashboardData,
  currentTrip,
  onTripStart,
  onTripStop,
}: DriverHomeTabProps) {
  const driverName = dashboardData?.driver?.name || 'Driver'
  const todayIST = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formatIST = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    } catch {
      return dateStr
    }
  }

  const isTripActive = currentTrip?.status === 'active'
  const recentBoardings = dashboardData?.attendance?.recent?.slice(0, 5) || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome Banner */}
      <div className="driver-welcome-card">
        <div className="driver-welcome-meta">
          <h2>Welcome back, {driverName}</h2>
          <p>{todayIST}</p>
        </div>
        <div className="driver-status-indicator">
          <span className="driver-pulse-dot" />
          <span>Driver Portal Active</span>
        </div>
      </div>

      {/* Journey Status Card */}
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
              Current Journey Status
            </div>
            {isTripActive ? (
              <div>
                <span
                  className="vh-badge vh-badge--success"
                  style={{ fontSize: 13, padding: '4px 10px', fontWeight: 700 }}
                >
                  ● Active Journey
                </span>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--color-text)' }}>
                  Journey Active since <strong>{formatIST(currentTrip.started_at)}</strong>
                </p>
              </div>
            ) : (
              <div>
                <span
                  className="vh-badge vh-badge--neutral"
                  style={{ fontSize: 13, padding: '4px 10px', fontWeight: 600 }}
                >
                  No Active Journey
                </span>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Start a journey to begin tracking boardings and location.
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

      {/* Stats Row */}
      <div className="driver-grid" style={{ marginBottom: 0 }}>
        <div className="driver-card">
          <div className="driver-card-title">Total Assigned Students</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-primary)' }}>
            {dashboardData?.students?.total ?? 0}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '6px 0 0' }}>
            Registered on this route
          </p>
        </div>

        <div className="driver-card">
          <div className="driver-card-title">Total Attendance Today</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-accent)' }}>
            {dashboardData?.attendance?.total ?? 0}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '6px 0 0' }}>
            Total confirmed boarding records
          </p>
        </div>

        <div className="driver-card">
          <div className="driver-card-title">Last GPS Position</div>
          {dashboardData?.location ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>
                {dashboardData.location.latitude.toFixed(5)}, {dashboardData.location.longitude.toFixed(5)}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '6px 0 0' }}>
                Recorded at {formatIST(dashboardData.location.recorded_at)}
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                No location recorded
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '6px 0 0' }}>
                Update location via GPS tab
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Boardings Table */}
      <div className="driver-card">
        <div className="driver-card-title">Recent Boardings (Last 5)</div>
        {recentBoardings.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="vh-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Reg Number</th>
                  <th>Boarding Time (IST)</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {recentBoardings.map((b: DriverAttendanceItem) => (
                  <tr key={b.id || `${b.registration_number}-${b.boarding_time}`}>
                    <td style={{ fontWeight: 600 }}>{b.student_name}</td>
                    <td>{b.registration_number}</td>
                    <td>{formatIST(b.boarding_time)}</td>
                    <td>
                      <span className="vh-badge vh-badge--info">
                        {b.verification_method || 'Verified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="driver-empty-state" style={{ padding: '24px 12px' }}>
            <p>No recent boarding activity recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
