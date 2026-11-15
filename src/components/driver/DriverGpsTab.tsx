import { useState } from 'react'
import type { DriverDashboardData } from '../../types/driver'
import { updateDriverLocation } from '../../services/api'

interface DriverGpsTabProps {
  dashboardData?: DriverDashboardData | null
}

export default function DriverGpsTab({ dashboardData }: DriverGpsTabProps) {
  const [currentLoc, setCurrentLoc] = useState<{
    latitude: number
    longitude: number
    recorded_at: string
  } | null>(dashboardData?.location || null)

  const [updating, setUpdating] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const formatIST = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    } catch {
      return dateStr
    }
  }

  const handleUpdateLocation = () => {
    setStatusMsg(null)
    setErrorMsg(null)

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.')
      return
    }

    setUpdating(true)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          await updateDriverLocation(lat, lng)

          const nowIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          setCurrentLoc({
            latitude: lat,
            longitude: lng,
            recorded_at: new Date().toISOString(),
          })
          setStatusMsg(`Location updated at ${nowIST}`)
        } catch (err: unknown) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to update location on server.')
        } finally {
          setUpdating(false)
        }
      },
      (err) => {
        setUpdating(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErrorMsg('Location permission denied. Please allow GPS access in your browser.')
            break
          case err.POSITION_UNAVAILABLE:
            setErrorMsg('Location information is unavailable.')
            break
          case err.TIMEOUT:
            setErrorMsg('The request to get user location timed out.')
            break
          default:
            setErrorMsg('An unknown error occurred while retrieving GPS coordinates.')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Current Location Card */}
      <div className="driver-card">
        <div className="driver-card-title">Live GPS Location</div>

        {currentLoc ? (
          <div className="driver-prop-list">
            <div className="driver-prop-row">
              <span className="driver-prop-label">Latitude</span>
              <span className="driver-prop-value" style={{ fontFamily: 'monospace', fontSize: 15 }}>
                {currentLoc.latitude.toFixed(6)}°
              </span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Longitude</span>
              <span className="driver-prop-value" style={{ fontFamily: 'monospace', fontSize: 15 }}>
                {currentLoc.longitude.toFixed(6)}°
              </span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Last Ping (IST)</span>
              <span className="driver-prop-value">{formatIST(currentLoc.recorded_at)}</span>
            </div>
          </div>
        ) : (
          <div className="driver-empty-state" style={{ padding: '24px 12px' }}>
            <p>No location data available</p>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            className="vh-btn vh-btn-primary"
            onClick={handleUpdateLocation}
            disabled={updating}
            style={{ padding: '10px 22px', fontWeight: 700 }}
          >
            {updating ? 'Acquiring GPS...' : 'Update My Location'}
          </button>
        </div>

        {statusMsg && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'var(--color-success-bg, #F0FAF4)',
              border: '1px solid var(--color-success-border, #BBDFC8)',
              color: 'var(--color-success, #299D59)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ✓ {statusMsg}
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'var(--color-error-bg, #FEF2F2)',
              border: '1px solid var(--color-error-border, #FECACA)',
              color: 'var(--color-error, #D9534F)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      <div
        style={{
          padding: '14px 18px',
          background: 'var(--color-bg, #F6F6F0)',
          border: '1px solid var(--color-border, #E6E8DE)',
          borderRadius: 'var(--radius-md, 10px)',
          fontSize: 13,
          color: 'var(--color-text-muted, #777D70)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span>📍</span>
        <span>Map view coming in a future update.</span>
      </div>
    </div>
  )
}
