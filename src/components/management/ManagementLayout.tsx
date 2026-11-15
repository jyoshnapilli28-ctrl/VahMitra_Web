import { useState } from 'react'
import type { ReactNode } from 'react'
import ManagementSidebar from './ManagementSidebar'
import type { ManagementTab } from './ManagementSidebar'
import ManagementHeader from './ManagementHeader'
import './Management.css'

interface ManagementLayoutProps {
  currentTab: ManagementTab
  onSelectTab: (tab: ManagementTab) => void
  username: string
  onLogout: () => void
  children: ReactNode
}

const TAB_TITLES: Record<ManagementTab, string> = {
  overview: 'Operations Overview',
  students: 'Student Directory',
  drivers: 'Driver Registry',
  buses: 'Bus Fleet Management',
  routes: 'Campus Routes',
  allocations: 'Vehicle & Driver Allocations',
  fleet: 'Fleet Monitoring',
}

export default function ManagementLayout({
  currentTab,
  onSelectTab,
  username,
  onLogout,
  children,
}: ManagementLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="mgmt-container">
      <ManagementSidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="mgmt-main">
        <ManagementHeader
          title={TAB_TITLES[currentTab]}
          username={username}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={onLogout}
        />

        <main className="mgmt-content">{children}</main>
      </div>
    </div>
  )
}

