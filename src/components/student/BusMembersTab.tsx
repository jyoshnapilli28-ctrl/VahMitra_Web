import { useState, useEffect } from 'react'
import type { BusMemberItem } from '../../types/student'
import { fetchBusMembers } from '../../services/api'
import { BusMembersIcon, SearchIcon, AlertTriangleIcon } from '../common/Icons'

export default function BusMembersTab() {
  const [members, setMembers] = useState<BusMemberItem[]>([])
  const [routeCode, setRouteCode] = useState<string | null>(null)
  const [routeName, setRouteName] = useState<string | null>(null)
  const [hasRoute, setHasRoute] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchBusMembers()
      .then((res) => {
        if (!isMounted) return
        setHasRoute(res.has_route)
        setRouteCode(res.route_code)
        setRouteName(res.route_name)
        setMembers(res.members)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Unable to load route members')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.full_name.toLowerCase().includes(q) ||
      (m.nickname && m.nickname.toLowerCase().includes(q)) ||
      m.registration_number.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Route Cohort Header */}
      <div className="student-card">
        <div className="student-card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BusMembersIcon size={16} /> Route Passenger Directory
          </span>
          {routeCode && (
            <span className="vh-badge vh-badge--info">
              {routeCode} · {filteredMembers.length} Members
            </span>
          )}
        </div>

        {hasRoute ? (
          <div>
            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--srm-text-dark)' }}>
              Showing fellow students registered for <strong>{routeCode} — {routeName}</strong>.
            </p>

            {/* Search Input */}
            <div style={{ position: 'relative', maxWidth: 400 }}>
              <input
                type="text"
                placeholder="Search by name, nickname, or reg no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: 8,
                  border: '1px solid var(--srm-border)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <SearchIcon
                size={16}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--srm-text-light)' }}
              />
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--srm-text-muted)' }}>
            You do not currently have an active route assignment. Member directory is available once assigned to a transit route.
          </p>
        )}
      </div>

      {/* Cohort Clarification Notice */}
      <div
        style={{
          background: 'var(--srm-cream)',
          border: '1px solid var(--srm-border)',
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          fontSize: 12,
          color: 'var(--srm-text-muted)',
        }}
      >
        <AlertTriangleIcon size={16} style={{ color: 'var(--srm-olive)', flexShrink: 0 }} />
        <span>
          <strong>Data Scope:</strong> Members listed represent registered students assigned to your official university transit route cohort.
        </span>
      </div>

      {/* Member Cards Grid */}
      {loading ? (
        <div className="vh-state-box" style={{ padding: '36px 12px' }}>
          <div className="vh-spinner" />
          <p>Loading route passenger directory...</p>
        </div>
      ) : error ? (
        <div className="vh-state-box" style={{ padding: '36px 12px' }}>
          <p>{error}</p>
        </div>
      ) : filteredMembers.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {filteredMembers.map((m) => {
            const initial = (m.nickname || m.full_name).charAt(0).toUpperCase() || 'S'
            return (
              <div
                key={m.id}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${m.is_current_user ? 'rgba(120, 132, 59, 0.4)' : 'var(--srm-border)'}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: m.is_current_user ? '0 0 12px var(--srm-olive-glow)' : '0 2px 6px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.2s',
                }}
              >
                {m.profile_photo_url ? (
                  <img
                    src={m.profile_photo_url}
                    alt={m.full_name}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--srm-border)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: m.is_current_user ? 'var(--srm-olive)' : 'var(--srm-navy)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 800,
                    }}
                  >
                    {initial}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <strong
                      style={{
                        fontSize: 13.5,
                        color: 'var(--srm-navy)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {m.nickname || m.full_name}
                    </strong>
                    {m.is_current_user && (
                      <span className="vh-badge vh-badge--success" style={{ fontSize: 9.5, padding: '1px 5px' }}>
                        YOU
                      </span>
                    )}
                  </div>

                  {m.nickname && (
                    <div style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
                      {m.full_name}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--srm-text-light)', marginTop: 2 }}>
                    Reg: {m.registration_number} · {m.department || 'SEAS'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="student-card" style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--srm-text-muted)' }}>
          <p style={{ margin: 0, fontSize: 13 }}>No route members match your search criteria.</p>
        </div>
      )}
    </div>
  )
}

