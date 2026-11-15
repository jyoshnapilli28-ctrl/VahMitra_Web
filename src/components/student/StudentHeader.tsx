import type { StudentTab } from './StudentSidebar'
import { BellIcon } from '../common/Icons'

interface StudentHeaderProps {
  currentTab: StudentTab
  username: string
  officialName?: string
  nickname?: string | null
  registrationNumber?: string
  profilePhotoUrl?: string | null
  unreadCount?: number
  onNavigateTab: (tab: StudentTab) => void
  onLogout: () => void
  onMenuToggle: () => void
}

const TAB_TITLES: Record<StudentTab, string> = {
  home: 'Student Home',
  route: 'My Route & Transit Halts',
  messages: 'Direct Messages & Communications',
  notifications: 'Notification Center',
  attendance: 'Attendance History & Records',
  driver: 'Assigned Driver Profile',
  complaints: 'Support & Complaints',
  members: 'My Bus Members',
  discussion: 'Campus Transit Discussion',
  profile: 'My Student Profile',
}

export default function StudentHeader({
  currentTab,
  username,
  officialName,
  nickname,
  registrationNumber,
  profilePhotoUrl,
  unreadCount = 0,
  onNavigateTab,
  onLogout,
  onMenuToggle,
}: StudentHeaderProps) {
  const displayName = nickname || officialName || username
  const initial = displayName.charAt(0).toUpperCase() || 'S'
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <header className="student-header">
      <div className="student-header-left">
        <button
          type="button"
          className="student-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
        <div>
          <h2 className="student-header-title">{TAB_TITLES[currentTab]}</h2>
          <span className="student-header-date">{todayStr} · SRM University AP</span>
        </div>
      </div>

      <div className="student-header-right">
        {/* Notification Bell Button */}
        <button
          type="button"
          className="student-bell-btn"
          onClick={() => onNavigateTab('notifications')}
          title="View Notifications"
          aria-label="Notifications"
        >
          <BellIcon size={17} />
          {unreadCount > 0 && (
            <span className="student-bell-badge">{unreadCount}</span>
          )}
        </button>

        {/* Profile Shortcut Pill */}
        <div
          className="student-user-pill"
          onClick={() => onNavigateTab('profile')}
          title="Open Profile Settings"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onNavigateTab('profile')
          }}
        >
          {profilePhotoUrl ? (
            <img
              src={profilePhotoUrl}
              alt={displayName}
              className="student-avatar-img"
            />
          ) : (
            <div className="student-avatar">{initial}</div>
          )}
          <div className="student-user-meta">
            <span className="student-user-name">{displayName}</span>
            <span className="student-user-sub">
              {registrationNumber || 'Student'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          className="student-logout-btn"
          onClick={onLogout}
          title="Sign out of student portal"
        >
          <span>Sign out</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </header>
  )
}
