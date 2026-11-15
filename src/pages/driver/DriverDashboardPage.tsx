import { useState, useEffect } from 'react'
import type { DriverTab, DriverDashboardData, DriverTrip } from '../../types/driver'
import {
  fetchDriverDashboard,
  fetchDriverCurrentTrip,
  startDriverTrip,
  stopDriverTrip,
  fetchDriverNotifications,
} from '../../services/api'
import DriverLayout from '../../components/driver/DriverLayout'

import DriverHomeTab from '../../components/driver/DriverHomeTab'
import DriverBusTab from '../../components/driver/DriverBusTab'
import DriverRouteTab from '../../components/driver/DriverRouteTab'
import DriverAssignedStudentsTab from '../../components/driver/DriverAssignedStudentsTab'
import DriverTripsTab from '../../components/driver/DriverTripsTab'
import DriverBoardingRecordsTab from '../../components/driver/DriverBoardingRecordsTab'
import DriverGpsTab from '../../components/driver/DriverGpsTab'
import DriverFuelTab from '../../components/driver/DriverFuelTab'
import DriverServiceTab from '../../components/driver/DriverServiceTab'
import DriverReportsTab from '../../components/driver/DriverReportsTab'
import DriverNotificationsTab from '../../components/driver/DriverNotificationsTab'
import DriverMessagesTab from '../../components/driver/DriverMessagesTab'
import DriverProfileTab from '../../components/driver/DriverProfileTab'

interface DriverDashboardPageProps {
  activeTab?: DriverTab
  onSelectTab?: (tab: DriverTab) => void
  username?: string
  onLogout?: () => void
}

export default function DriverDashboardPage({
  activeTab: propActiveTab,
  onSelectTab: propOnSelectTab,
  username = 'Driver',
  onLogout,
}: DriverDashboardPageProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<DriverTab>('home')
  const [data, setData] = useState<DriverDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTrip, setCurrentTrip] = useState<DriverTrip | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [reloadKey, setReloadKey] = useState(0)

  const activeTab = propActiveTab || internalActiveTab

  const handleTabChange = (tab: DriverTab) => {
    if (propOnSelectTab) {
      propOnSelectTab(tab)
    }
    setInternalActiveTab(tab)
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([
      fetchDriverDashboard(),
      fetchDriverCurrentTrip(),
      fetchDriverNotifications({ unread_only: true }),
    ]).then(([dashResult, tripResult, notifResult]) => {
      if (!isMounted) return

      if (dashResult.status === 'fulfilled') {
        setData(dashResult.value)
      } else {
        setError(
          dashResult.reason instanceof Error
            ? dashResult.reason.message
            : 'Unable to retrieve driver operations details'
        )
      }

      if (tripResult.status === 'fulfilled') {
        setCurrentTrip(tripResult.value)
      }

      if (notifResult.status === 'fulfilled') {
        const notifs = notifResult.value
        const count =
          notifs?.total_unread ??
          notifs?.total ??
          (notifs?.notifications ? notifs.notifications.filter((n) => !n.is_read).length : 0)
        setUnreadCount(count)
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [reloadKey])

  const handleTripStart = async () => {
    try {
      const res = await startDriverTrip({})
      setCurrentTrip(res)
      setReloadKey((k) => k + 1)
    } catch (err: unknown) {
      console.error('Failed to start trip:', err)
    }
  }

  const handleTripStop = async (tripId: number) => {
    try {
      await stopDriverTrip(tripId, {})
      setCurrentTrip(null)
      setReloadKey((k) => k + 1)
    } catch (err: unknown) {
      console.error('Failed to stop trip:', err)
    }
  }

  if (loading) {
    return (
      <div className="vh-state-box">
        <div className="vh-spinner" />
        <h4>Loading driver operations portal...</h4>
        <p>Connecting to SRM University AP fleet allocation system.</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="vh-state-box">
        <h4>Unable to Load Operations Portal</h4>
        <p>{error || 'An unexpected error occurred while fetching your data.'}</p>
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <DriverHomeTab
            dashboardData={data}
            currentTrip={currentTrip}
            onTripStart={handleTripStart}
            onTripStop={handleTripStop}
          />
        )
      case 'bus':
        return <DriverBusTab dashboardData={data} />
      case 'route':
        return <DriverRouteTab dashboardData={data} />
      case 'students':
        return <DriverAssignedStudentsTab dashboardData={data} />
      case 'trips':
        return (
          <DriverTripsTab
            currentTrip={currentTrip}
            onTripStart={handleTripStart}
            onTripStop={handleTripStop}
          />
        )
      case 'boarding':
        return <DriverBoardingRecordsTab allocationId={data?.allocation?.id} />
      case 'gps':
        return <DriverGpsTab dashboardData={data} />
      case 'fuel':
        return <DriverFuelTab />
      case 'service':
        return <DriverServiceTab />
      case 'reports':
        return <DriverReportsTab currentTripId={currentTrip?.id} />
      case 'notifications':
        return (
          <DriverNotificationsTab
            onUnreadCountChange={(count) => setUnreadCount(count)}
          />
        )
      case 'messages':
        return <DriverMessagesTab dashboardData={data} />
      case 'profile':
        return <DriverProfileTab dashboardData={data} />
      default:
        return (
          <DriverHomeTab
            dashboardData={data}
            currentTrip={currentTrip}
            onTripStart={handleTripStart}
            onTripStop={handleTripStop}
          />
        )
    }
  }

  return (
    <DriverLayout
      currentTab={activeTab}
      onSelectTab={handleTabChange}
      username={username}
      driverName={data?.driver?.name}
      busNumber={data?.bus?.bus_number}
      routeCode={data?.route?.route_code}
      unreadNotifications={unreadCount}
      journeyActive={currentTrip?.status === 'active'}
      onLogout={onLogout}
    >
      {renderTabContent()}
    </DriverLayout>
  )
}
