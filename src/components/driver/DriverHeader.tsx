import type { DriverTab } from '../../types/driver'

interface DriverHeaderProps {
  currentTab: DriverTab
  username?: string
  driverName?: string
  busNumber?: string
  routeCode?: string
  journeyActive?: boolean
  onLogout?: () => void
  onMenuToggle?: () => void
}

const TAB_TITLES: Record<DriverTab, string> = {
  home: 'Driver Operations Dashboard',
  bus: 'My Bus Allocation',
  route: 'My Route Halts',
  students: 'Route Students Manifest',
  trips: 'Trip Manager',
  boarding: 'Student Boarding Verification',
  gps: 'Live GPS Tracking',
  fuel: 'Fuel Expense Records',
  service: 'Maintenance & Service Records',
  reports: 'Vehicle Issue Reports',
  notifications: 'Driver Notifications',
  messages: 'Communications & Messages',
  profile: 'Driver Profile & Credentials',
}

export default function DriverHeader({
  currentTab,
  username = 'Driver',
  driverName,
  busNumber,
  routeCode,
  journeyActive = false,
  onLogout,
  onMenuToggle,
}: DriverHeaderProps) {
  const displayName = driverName || username || 'Driver'
  const initial = displayName.charAt(0).toUpperCase() || 'D'

  const currentDateIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  return (
    <header className="driver-header">
      <div className="driver-header-left">
        <button
          type="button"
          className="driver-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
        <div>
          <h2 className="driver-header-title">{TAB_TITLES[currentTab] || 'Driver Operations'}</h2>
          {(busNumber || routeCode) && (
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--color-text-muted, #777D70)',
                marginTop: '2px',
              }}
            >
              Bus #{busNumber || '—'} &nbsp;|&nbsp; Route {routeCode || '—'}
            </div>
          )}
        </div>
      </div>

      <div className="driver-header-right">
        {/* Journey status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '12px',
            fontWeight: 600,
            padding: '5px 10px',
            borderRadius: '99px',
            backgroundColor: journeyActive ? 'rgba(41, 157, 89, 0.1)' : 'rgba(119, 125, 112, 0.1)',
            border: `1px solid ${journeyActive ? 'rgba(41, 157, 89, 0.3)' : 'rgba(119, 125, 112, 0.2)'}`,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: journeyActive ? '#299D59' : '#A8ADA3',
              boxShadow: journeyActive ? '0 0 0 3px rgba(41, 157, 89, 0.25)' : 'none',
              display: 'inline-block',
            }}
          />
          <span style={{ color: journeyActive ? '#299D59' : 'var(--color-text-muted, #777D70)' }}>
            {journeyActive ? 'Journey Active' : 'No Active Journey'}
          </span>
        </div>

        {/* Date in IST */}
        <span
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted, #777D70)',
            fontWeight: 500,
          }}
          className="driver-header-date"
        >
          {currentDateIST}
        </span>

        {/* Driver pill */}
        <div className="driver-user-pill">
          <div className="driver-user-avatar">{initial}</div>
          <div className="driver-user-meta">
            <span className="driver-user-name">{displayName}</span>
            <span className="driver-user-role">Driver</span>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            className="driver-logout-btn"
            onClick={onLogout}
            title="Sign out of driver portal"
          >
            <span>Sign out</span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </header>
  )
}
