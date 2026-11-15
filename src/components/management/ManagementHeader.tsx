interface ManagementHeaderProps {
  title: string
  username: string
  onToggleSidebar: () => void
  onLogout: () => void
}

export default function ManagementHeader({
  title,
  username,
  onToggleSidebar,
  onLogout,
}: ManagementHeaderProps) {
  return (
    <header className="mgmt-header">
      <div className="mgmt-header-left">
        <button
          type="button"
          className="mgmt-menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
        >
          ☰
        </button>
        <h2 className="mgmt-header-title">{title}</h2>
      </div>

      <div className="mgmt-header-right">
        <div className="mgmt-user-pill">
          <div className="mgmt-user-avatar">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="mgmt-user-meta">
            <span className="mgmt-user-name">{username}</span>
            <span className="mgmt-user-role">Management</span>
          </div>
        </div>

        <button
          type="button"
          className="mgmt-logout-btn"
          onClick={onLogout}
          title="Sign out of Management Portal"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}

