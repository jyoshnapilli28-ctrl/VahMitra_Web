import { useState } from 'react'
import type { ReactNode } from 'react'
import '../../styles/StudentDashboard.css'
import StudentSidebar from './StudentSidebar'
import type { StudentTab } from './StudentSidebar'
import StudentHeader from './StudentHeader'

interface StudentLayoutProps {
  children: ReactNode
  currentTab: StudentTab
  onSelectTab: (tab: StudentTab) => void
  username: string
  officialName?: string
  nickname?: string | null
  registrationNumber?: string
  profilePhotoUrl?: string | null
  unreadNotificationsCount?: number
  unreadMessagesCount?: number
  onLogout: () => void
}

export default function StudentLayout({
  children,
  currentTab,
  onSelectTab,
  username,
  officialName,
  nickname,
  registrationNumber,
  profilePhotoUrl,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  onLogout,
}: StudentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="student-container">
      <StudentSidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
      />

      <div className="student-main">
        <StudentHeader
          currentTab={currentTab}
          username={username}
          officialName={officialName}
          nickname={nickname}
          registrationNumber={registrationNumber}
          profilePhotoUrl={profilePhotoUrl}
          unreadCount={unreadNotificationsCount}
          onNavigateTab={onSelectTab}
          onLogout={onLogout}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="student-content">{children}</main>
      </div>
    </div>
  )
}
