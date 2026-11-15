import type { ReactNode } from 'react'
import type { DriverTab } from '../../types/driver'
import {
  LayoutDashboardIcon,
  BusIcon,
  MapIcon,
  UsersIcon,
  NavigationIcon,
  ClipboardListIcon,
  LocateIcon,
  FuelIcon,
  WrenchIcon,
  AlertTriangleIcon,
  BellIcon,
  MessageSquareIcon,
  UserCircleIcon,
} from '../common/Icons'

export type { DriverTab }

export interface DriverSidebarProps {
  activeTab: DriverTab
  onTabChange: (tab: DriverTab) => void
  driverName?: string
  unreadNotifications?: number
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  key: DriverTab
  label: string
  icon: ReactNode
}

export default function DriverSidebar({
  activeTab,
  onTabChange,
  driverName,
  unreadNotifications = 0,
  isOpen = false,
  onClose,
}: DriverSidebarProps) {
  const NAV_ITEMS: NavItem[] = [
    { key: 'home', label: 'Dashboard', icon: <LayoutDashboardIcon size={18} /> },
    { key: 'bus', label: 'My Bus', icon: <BusIcon size={18} /> },
    { key: 'route', label: 'My Route', icon: <MapIcon size={18} /> },
    { key: 'students', label: 'Students', icon: <UsersIcon size={18} /> },
    { key: 'trips', label: 'Trip Manager', icon: <NavigationIcon size={18} /> },
    { key: 'boarding', label: 'Boarding', icon: <ClipboardListIcon size={18} /> },
    { key: 'gps', label: 'Live GPS', icon: <LocateIcon size={18} /> },
    { key: 'fuel', label: 'Fuel Records', icon: <FuelIcon size={18} /> },
    { key: 'service', label: 'Maintenance', icon: <WrenchIcon size={18} /> },
    { key: 'reports', label: 'Issue Reports', icon: <AlertTriangleIcon size={18} /> },
    { key: 'notifications', label: 'Notifications', icon: <BellIcon size={18} /> },
    { key: 'messages', label: 'Messages', icon: <MessageSquareIcon size={18} /> },
    { key: 'profile', label: 'My Profile', icon: <UserCircleIcon size={18} /> },
  ]

  function handleSelect(tab: DriverTab) {
    onTabChange(tab)
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      <div
        className={`driver-sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`driver-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="driver-sidebar-brand">
          <img
            src="/images/branding/vahmitra-favicon.svg"
            alt="VAHMITRA"
            className="driver-sidebar-logo"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
          <div className="driver-sidebar-title">
            <h1>VAHMITRA</h1>
            <span>Driver Operations</span>
          </div>
        </div>

        {driverName && (
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{driverName}</div>
            <div>Authorized Driver</div>
          </div>
        )}

        <nav className="driver-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key
            return (
              <button
                key={item.key}
                type="button"
                className={`driver-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(item.key)}
              >
                <span className="driver-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.key === 'notifications' && unreadNotifications > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: '#D9534F',
                      color: '#fff',
                      borderRadius: '99px',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      minWidth: '18px',
                      textAlign: 'center',
                    }}
                  >
                    {unreadNotifications}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="driver-sidebar-footer">
          <div>SRM UNIVERSITY AP</div>
          <div>Driver Operations Portal © 2026</div>
        </div>
      </aside>
    </>
  )
}
