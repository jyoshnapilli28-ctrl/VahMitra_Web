import type { ReactNode } from 'react'
import {
  HomeIcon,
  RouteIcon,
  BellIcon,
  MessageSquareIcon,
  DriverIcon,
  CalendarDaysIcon,
  ComplaintsIcon,
  BusMembersIcon,
  DiscussionIcon,
  ProfileIcon,
} from '../common/Icons'

export type StudentTab =
  | 'home'
  | 'route'
  | 'messages'
  | 'notifications'
  | 'attendance'
  | 'driver'
  | 'complaints'
  | 'members'
  | 'discussion'
  | 'profile'

interface StudentSidebarProps {
  currentTab: StudentTab
  onSelectTab: (tab: StudentTab) => void
  isOpen: boolean
  onClose: () => void
  unreadNotificationsCount?: number
  unreadMessagesCount?: number
}

interface NavItem {
  key: StudentTab
  label: string
  icon: ReactNode
}

export default function StudentSidebar({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
}: StudentSidebarProps) {
  const NAV_ITEMS: NavItem[] = [
    { key: 'home', label: 'Home', icon: <HomeIcon size={18} /> },
    { key: 'route', label: 'My Route', icon: <RouteIcon size={18} /> },
    { key: 'messages', label: 'Messages', icon: <MessageSquareIcon size={18} /> },
    { key: 'notifications', label: 'Notifications', icon: <BellIcon size={18} /> },
    { key: 'attendance', label: 'Attendance History', icon: <CalendarDaysIcon size={18} /> },
    { key: 'driver', label: 'My Driver', icon: <DriverIcon size={18} /> },
    { key: 'complaints', label: 'Complaints', icon: <ComplaintsIcon size={18} /> },
    { key: 'members', label: 'My Bus Members', icon: <BusMembersIcon size={18} /> },
    { key: 'discussion', label: 'Discussion Room', icon: <DiscussionIcon size={18} /> },
    { key: 'profile', label: 'My Profile', icon: <ProfileIcon size={18} /> },
  ]

  function handleSelect(tab: StudentTab) {
    onSelectTab(tab)
    onClose()
  }

  return (
    <>
      <div
        className={`student-sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`student-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="student-sidebar-brand">
          <img
            src="/images/branding/vahmitra-favicon.svg"
            alt="VAHMITRA Emblem"
            className="student-sidebar-logo"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
          <div className="student-sidebar-title">
            <h1>VAHMITRA</h1>
            <span>Student Transit</span>
          </div>
        </div>

        <nav className="student-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.key
            return (
              <button
                key={item.key}
                type="button"
                className={`student-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(item.key)}
              >
                <span className="student-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.key === 'notifications' && unreadNotificationsCount > 0 && (
                  <span className="student-nav-badge">
                    {unreadNotificationsCount}
                  </span>
                )}
                {item.key === 'messages' && unreadMessagesCount > 0 && (
                  <span className="student-nav-badge" style={{ background: 'var(--srm-olive)' }}>
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="student-sidebar-footer">
          <div>SRM UNIVERSITY AP</div>
          <div>Smart Bus Tracking · AY 2026</div>
        </div>
      </aside>
    </>
  )
}
