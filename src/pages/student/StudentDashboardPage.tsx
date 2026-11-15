import { useState, useEffect } from 'react'
import type { StudentTab } from '../../components/student/StudentSidebar'
import type { StudentDashboardData, StudentProfile } from '../../types/student'
import { fetchStudentDashboard } from '../../services/api'

import HomeTab from '../../components/student/HomeTab'
import MyRouteTab from '../../components/student/MyRouteTab'
import MessagesTab from '../../components/student/MessagesTab'
import NotificationsTab from '../../components/student/NotificationsTab'
import AttendanceHistoryTab from '../../components/student/AttendanceHistoryTab'
import MyDriverTab from '../../components/student/MyDriverTab'
import ComplaintsTab from '../../components/student/ComplaintsTab'
import BusMembersTab from '../../components/student/BusMembersTab'
import DiscussionRoomTab from '../../components/student/DiscussionRoomTab'
import MyProfileTab from '../../components/student/MyProfileTab'
import QRScannerModal from '../../components/student/QRScannerModal'

interface StudentDashboardPageProps {
  activeTab: StudentTab
  username: string
  onNavigateTab: (tab: StudentTab) => void
  onUpdateHeaderProfile?: (
    student: StudentProfile,
    unreadCount: number,
    unreadMessagesCount?: number
  ) => void
}

export default function StudentDashboardPage({
  activeTab,
  onNavigateTab,
  onUpdateHeaderProfile,
}: StudentDashboardPageProps) {
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // QR Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    fetchStudentDashboard()
      .then((res) => {
        if (!isMounted) return
        setData(res)
        setLoading(false)
        if (onUpdateHeaderProfile) {
          onUpdateHeaderProfile(
            res.student,
            res.unread_notifications_count,
            res.unread_messages_count ?? 0
          )
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to connect to student transit system.'
        )
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [reloadKey, onUpdateHeaderProfile])

  function handleRetry() {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  function handleProfileUpdated(updated: Partial<StudentProfile>) {
    setData((prev) => {
      if (!prev) return prev
      const newStudent = { ...prev.student, ...updated }
      if (onUpdateHeaderProfile) {
        onUpdateHeaderProfile(
          newStudent,
          prev.unread_notifications_count,
          prev.unread_messages_count ?? 0
        )
      }
      return {
        ...prev,
        student: newStudent,
      }
    })
  }

  function handleRefreshUnread() {
    setReloadKey((k) => k + 1)
  }

  if (loading) {
    return (
      <div className="vh-state-box" style={{ padding: '64px 20px' }}>
        <div className="vh-spinner" />
        <h4>Connecting to VAHMITRA Student Portal...</h4>
        <p>Loading real-time transit schedule and announcements.</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="vh-state-box" style={{ padding: '64px 20px' }}>
        <h4>Unable to Load Student Portal</h4>
        <p>{error || 'An unexpected network error occurred.'}</p>
        <button
          type="button"
          className="vh-btn vh-btn-primary"
          onClick={handleRetry}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 1. Home Tab */}
      {activeTab === 'home' && (
        <HomeTab
          data={data}
          onOpenScanner={() => setIsScannerOpen(true)}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 2. My Route Tab */}
      {activeTab === 'route' && (
        <MyRouteTab
          route={data.route}
          stops={data.stops}
          bus={data.bus}
          driver={data.driver}
          assignment={data.assignment}
          announcements={data.announcements}
        />
      )}

      {/* 3. Messages Tab */}
      {activeTab === 'messages' && (
        <MessagesTab onRefreshParentUnread={handleRefreshUnread} />
      )}

      {/* 4. Notifications Tab */}
      {activeTab === 'notifications' && (
        <NotificationsTab onRefreshParentUnread={handleRefreshUnread} />
      )}

      {/* 5. Attendance History Tab */}
      {activeTab === 'attendance' && <AttendanceHistoryTab />}

      {/* 6. My Driver Tab */}
      {activeTab === 'driver' && (
        <MyDriverTab
          driver={data.driver}
          bus={data.bus}
          route={data.route}
        />
      )}

      {/* 7. Complaints & Support Tab */}
      {activeTab === 'complaints' && <ComplaintsTab />}

      {/* 8. My Bus Members Tab */}
      {activeTab === 'members' && <BusMembersTab />}

      {/* 9. Discussion Room Tab */}
      {activeTab === 'discussion' && <DiscussionRoomTab />}

      {/* 10. My Profile Tab */}
      {activeTab === 'profile' && (
        <MyProfileTab
          student={data.student}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* QR Attendance Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  )
}
