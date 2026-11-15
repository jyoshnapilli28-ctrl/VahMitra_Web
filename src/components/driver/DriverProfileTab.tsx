import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import type { DriverDashboardData, DriverProfileFull } from '../../types/driver'
import { fetchDriverProfile, updateDriverProfile } from '../../services/api'

interface DriverProfileTabProps {
  dashboardData?: DriverDashboardData | null
}

export default function DriverProfileTab({ dashboardData }: DriverProfileTabProps) {
  const [profile, setProfile] = useState<DriverProfileFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [phone, setPhone] = useState('')
  const [experienceYears, setExperienceYears] = useState<string>('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fetchGenRef = useRef(0)

  const formatIST = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
    } catch {
      return dateStr
    }
  }

  const loadProfile = useCallback(() => {
    const currentGen = ++fetchGenRef.current

    fetchDriverProfile()
      .then((res: { profile?: DriverProfileFull } | DriverProfileFull) => {
        if (fetchGenRef.current !== currentGen) return
        const p: DriverProfileFull = 'profile' in res && res.profile ? res.profile : (res as DriverProfileFull)
        setProfile(p)
        setPhone(p.phone || '')
        setExperienceYears(p.experience_years !== null && p.experience_years !== undefined ? String(p.experience_years) : '')
        setAddress(p.address || '')
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (fetchGenRef.current !== currentGen) return
        setError(err instanceof Error ? err.message : 'Failed to fetch driver profile')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(null)
    setSaving(true)

    try {
      await updateDriverProfile({
        phone: phone.trim() || undefined,
        experience_years: experienceYears ? parseInt(experienceYears, 10) : undefined,
        address: address.trim() || undefined,
      })

      setSaveSuccess('Profile updated successfully!')
      setIsEditing(false)
      loadProfile()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile changes.')
    } finally {
      setSaving(false)
    }
  }

  const driverName = profile?.driver_name || dashboardData?.driver?.name || 'Driver'
  const licenseNumber = profile?.license_number || dashboardData?.driver?.license_number || 'N/A'

  // Get initials for avatar
  const initials = driverName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0].toUpperCase())
    .join('')

  const allocation = profile?.allocation || dashboardData?.allocation
  const bus = profile?.bus || dashboardData?.bus
  const route = profile?.route || dashboardData?.route

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile Header & Info Card */}
      <div className="driver-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div className="driver-card-title" style={{ margin: 0 }}>Driver Profile &amp; Credentials</div>
          {!isEditing && (
            <button
              type="button"
              className="vh-btn vh-btn-secondary"
              onClick={() => {
                setIsEditing(true)
                setSaveSuccess(null)
                setSaveError(null)
              }}
              style={{ fontSize: 13, padding: '6px 14px' }}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {saveSuccess && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-success-bg, #F0FAF4)',
              border: '1px solid var(--color-success-border, #BBDFC8)',
              color: 'var(--color-success, #299D59)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ✓ {saveSuccess}
          </div>
        )}

        {loading ? (
          <div className="vh-state-box">
            <div className="vh-spinner" />
            <p>Loading profile information...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box">
            <h4>Unable to Load Profile</h4>
            <p>{error}</p>
          </div>
        ) : (
          <div>
            {/* Top row with avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={driverName}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--color-accent)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    backgroundColor: '#102d46',
                    color: '#faf9f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  {initials || 'DR'}
                </div>
              )}

              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, color: 'var(--color-primary)' }}>
                  {driverName}
                </h3>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Commercial Transport Operator
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 600, marginTop: 4 }}>
                  License: {licenseNumber}
                </div>
              </div>
            </div>

            {/* Read / Edit Form */}
            {isEditing ? (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {saveError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-error-bg)',
                      border: '1px solid var(--color-error-border)',
                      color: 'var(--color-error)',
                      fontSize: 13,
                    }}
                  >
                    ⚠️ {saveError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div className="vh-form-group">
                    <label className="vh-form-label">Driver Name (Locked)</label>
                    <input
                      type="text"
                      disabled
                      className="vh-form-input"
                      value={driverName}
                      style={{ opacity: 0.7, background: 'var(--color-bg)' }}
                    />
                  </div>

                  <div className="vh-form-group">
                    <label className="vh-form-label">License Number (Locked)</label>
                    <input
                      type="text"
                      disabled
                      className="vh-form-input"
                      value={licenseNumber}
                      style={{ opacity: 0.7, background: 'var(--color-bg)' }}
                    />
                  </div>

                  <div className="vh-form-group">
                    <label className="vh-form-label">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      className="vh-form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="vh-form-group">
                    <label className="vh-form-label">Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      placeholder="e.g. 8"
                      className="vh-form-input"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                    />
                  </div>
                </div>

                <div className="vh-form-group">
                  <label className="vh-form-label">Residential Address</label>
                  <textarea
                    rows={2}
                    placeholder="Enter current address"
                    className="vh-form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="button"
                    className="vh-btn vh-btn-secondary"
                    onClick={() => {
                      setIsEditing(false)
                      setPhone(profile?.phone || '')
                      setExperienceYears(
                        profile?.experience_years !== null && profile?.experience_years !== undefined
                          ? String(profile.experience_years)
                          : ''
                      )
                      setAddress(profile?.address || '')
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="vh-btn vh-btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="driver-prop-list">
                <div className="driver-prop-row">
                  <span className="driver-prop-label">Full Name</span>
                  <span className="driver-prop-value">{driverName}</span>
                </div>
                <div className="driver-prop-row">
                  <span className="driver-prop-label">License Number</span>
                  <span className="driver-prop-value" style={{ fontFamily: 'monospace' }}>
                    {licenseNumber}
                  </span>
                </div>
                <div className="driver-prop-row">
                  <span className="driver-prop-label">Contact Phone</span>
                  <span className="driver-prop-value">{profile?.phone || 'Not provided'}</span>
                </div>
                <div className="driver-prop-row">
                  <span className="driver-prop-label">Driving Experience</span>
                  <span className="driver-prop-value">
                    {profile?.experience_years !== null && profile?.experience_years !== undefined
                      ? `${profile.experience_years} years`
                      : 'Not specified'}
                  </span>
                </div>
                <div className="driver-prop-row">
                  <span className="driver-prop-label">Residential Address</span>
                  <span className="driver-prop-value" style={{ maxWidth: 300, textAlign: 'right' }}>
                    {profile?.address || 'Not specified'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Allocation Information Section */}
      <div className="driver-card">
        <div className="driver-card-title">Current Duty &amp; Vehicle Allocation</div>
        {allocation ? (
          <div className="driver-prop-list">
            <div className="driver-prop-row">
              <span className="driver-prop-label">Assigned Bus</span>
              <span className="driver-prop-value">
                {bus?.bus_number ? `Bus #${bus.bus_number}` : 'Unassigned'}
              </span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Assigned Route</span>
              <span className="driver-prop-value">
                {route?.route_code ? `${route.route_name} (${route.route_code})` : 'Unassigned'}
              </span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Duty Assignment Date</span>
              <span className="driver-prop-value">{formatIST(allocation.start_date)}</span>
            </div>
            <div className="driver-prop-row">
              <span className="driver-prop-label">Assignment Status</span>
              <span className="driver-prop-value">
                <span className="vh-badge vh-badge--success" style={{ textTransform: 'capitalize' }}>
                  {allocation.status || 'Active'}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className="driver-empty-state" style={{ padding: '24px 12px' }}>
            <p>No active duty allocation assigned to your driver account.</p>
          </div>
        )}
      </div>
    </div>
  )
}
