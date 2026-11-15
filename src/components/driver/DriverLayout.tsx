import { useState } from 'react'
import type { ReactNode } from 'react'
import '../../styles/DriverDashboard.css'
import DriverSidebar from './DriverSidebar'
import type { DriverTab } from '../../types/driver'
import DriverHeader from './DriverHeader'

interface DriverLayoutProps {
  children: ReactNode
  currentTab: DriverTab
  onSelectTab: (tab: DriverTab) => void
  username?: string
  driverName?: string
  busNumber?: string
  routeCode?: string
  unreadNotifications?: number
  journeyActive?: boolean
  onLogout?: () => void
}

export default function DriverLayout({
  children,
  currentTab,
  onSelectTab,
  username = 'Driver',
  driverName,
  busNumber,
  routeCode,
  unreadNotifications = 0,
  journeyActive = false,
  onLogout,
}: DriverLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="driver-container">
      <DriverSidebar
        activeTab={currentTab}
        onTabChange={onSelectTab}
        driverName={driverName || username}
        unreadNotifications={unreadNotifications}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="driver-main">
        <DriverHeader
          currentTab={currentTab}
          username={username}
          driverName={driverName}
          busNumber={busNumber}
          routeCode={routeCode}
          journeyActive={journeyActive}
          onLogout={onLogout}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="driver-content">{children}</main>
      </div>
    </div>
  )
}
