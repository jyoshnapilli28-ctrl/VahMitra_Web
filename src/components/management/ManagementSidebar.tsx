export type ManagementTab =
  | 'overview'
  | 'students'
  | 'drivers'
  | 'buses'
  | 'routes'
  | 'allocations'
  | 'fleet'

interface ManagementSidebarProps {
  currentTab: ManagementTab
  onSelectTab: (tab: ManagementTab) => void
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS: { id: ManagementTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'students', label: 'Students', icon: '🎓' },
  { id: 'drivers', label: 'Drivers', icon: '🪪' },
  { id: 'buses', label: 'Buses', icon: '🚌' },
  { id: 'routes', label: 'Routes', icon: '🗺️' },
  { id: 'allocations', label: 'Allocations', icon: '🔄' },
  { id: 'fleet', label: 'Fleet Monitoring', icon: '📡' },
]

export default function ManagementSidebar({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}: ManagementSidebarProps) {
  function handleNav(tab: ManagementTab) {
    onSelectTab(tab)
    onClose()
  }

  return (
    <>
      <div
        className={`mgmt-sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`mgmt-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="mgmt-sidebar-brand">
          <img
            src="/images/branding/vahmitra-logo.svg"
            alt="VAHMITRA"
            className="mgmt-sidebar-logo"
          />
          <div className="mgmt-sidebar-title">
            <h1>VAHMITRA</h1>
            <span>Transport Ops</span>
          </div>
        </div>

        <nav className="mgmt-sidebar-nav" aria-label="Management Navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mgmt-nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              <span className="mgmt-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mgmt-sidebar-footer">
          <div>SRM UNIVERSITY AP</div>
          <div>VAHMITRA MANAGEMENT · v1.0</div>
        </div>
      </aside>
    </>
  )
}

