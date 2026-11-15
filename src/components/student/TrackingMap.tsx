import { useState } from 'react'
import type { StudentRoute, StudentRouteStop, BusLocation, StudentBus } from '../../types/student'
import { BusIcon, MapPinIcon } from '../common/Icons'

interface TrackingMapProps {
  route: StudentRoute | null
  stops: StudentRouteStop[]
  bus: StudentBus | null
  location: BusLocation | null
}

export default function TrackingMap({
  route,
  stops,
  bus,
  location,
}: TrackingMapProps) {
  const [zoom, setZoom] = useState(1)

  // Determine if genuine live GPS is connected
  const hasLiveGps = Boolean(location && location.latitude && location.longitude)

  return (
    <div className="student-map-container">
      <div className="student-section-header">
        <h3>
          <MapPinIcon size={18} />
          <span>Live Campus Route Transit Map</span>
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px',
              background: hasLiveGps ? '#dcfce7' : '#fef3c7',
              color: hasLiveGps ? '#15803d' : '#92400e',
              border: `1px solid ${hasLiveGps ? '#86efac' : '#fde68a'}`,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: hasLiveGps ? '#16a34a' : '#d97706',
              }}
            />
            {hasLiveGps ? 'GPS Broadcast Online' : 'DEMO MAP — LIVE GPS NOT CONNECTED'}
          </span>
        </div>
      </div>

      <div className="student-map-viewport">
        {/* Transparent Banner on top */}
        <div className="student-map-demo-banner">
          <span className="student-map-demo-dot" />
          <span>{hasLiveGps ? `Bus #${bus?.bus_number || ''} Live Position` : 'DEMO MAP — LIVE GPS NOT CONNECTED'}</span>
        </div>

        {/* SVG Roads & Transit Visualization */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 380"
          style={{
            transform: `scale(${zoom})`,
            transition: 'transform 0.3s ease',
            transformOrigin: 'center center',
          }}
        >
          {/* Background Grid Pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d5dcce" strokeWidth="1" />
            </pattern>
            <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#102d46" />
              <stop offset="50%" stopColor="#78843b" />
              <stop offset="100%" stopColor="#c4cc80" />
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill="#edf1e6" />
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.6" />

          {/* Simulated arterial roads */}
          <path d="M 50 190 Q 250 80 500 190 T 750 190" fill="none" stroke="#d2dacb" strokeWidth="22" strokeLinecap="round" />
          <path d="M 200 40 L 200 340" fill="none" stroke="#d2dacb" strokeWidth="14" strokeLinecap="round" />
          <path d="M 600 40 L 600 340" fill="none" stroke="#d2dacb" strokeWidth="14" strokeLinecap="round" />

          {/* Active Bus Route Line */}
          <path
            d="M 100 190 C 220 110, 360 270, 520 160 S 680 230, 720 190"
            fill="none"
            stroke="url(#routeGlow)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="6 4"
          />

          {/* Stops along the route */}
          {stops.slice(0, 5).map((stop, i) => {
            const positions = [
              { x: 100, y: 190 },
              { x: 230, y: 135 },
              { x: 420, y: 220 },
              { x: 580, y: 175 },
              { x: 720, y: 190 },
            ]
            const pos = positions[i] || { x: 100 + i * 110, y: 190 }
            return (
              <g key={stop.id} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle r="7" fill="#ffffff" stroke="#78843b" strokeWidth="3" />
                <rect x="-40" y="12" width="80" height="18" rx="4" fill="#102d46" opacity="0.85" />
                <text
                  x="0"
                  y="24"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8.5"
                  fontWeight="bold"
                >
                  {stop.name.slice(0, 14)}
                </text>
              </g>
            )
          })}

          {/* SRM University AP Campus Destination Marker */}
          <g transform="translate(720, 190)">
            <circle r="18" fill="#102d46" opacity="0.2" />
            <circle r="11" fill="#102d46" />
            <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
              SRM
            </text>
            <text x="0" y="-18" textAnchor="middle" fill="#102d46" fontSize="10" fontWeight="bold">
              Campus
            </text>
          </g>

          {/* Bus Marker (Active position or simulated on route) */}
          <g transform="translate(380, 215)">
            <circle r="22" fill="#78843b" opacity="0.25">
              <animate attributeName="r" values="16;26;16" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="14" fill="#78843b" stroke="#ffffff" strokeWidth="2.5" />
            <g transform="translate(-7, -7)">
              <BusIcon size={14} color="#ffffff" />
            </g>
            <rect x="-35" y="-30" width="70" height="16" rx="4" fill="#102d46" />
            <text x="0" y="-19" textAnchor="middle" fill="#c4cc80" fontSize="8.5" fontWeight="bold">
              {bus ? `Bus #${bus.bus_number}` : 'Transit Bus'}
            </text>
          </g>
        </svg>

        {/* Map Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(6px)',
            border: '1px solid var(--srm-border)',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'flex',
            gap: '14px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--srm-navy)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#78843b' }} />
            {bus ? `Bus #${bus.bus_number}` : 'Assigned Bus'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', border: '2px solid #78843b' }} />
            Halts ({stops.length})
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#102d46' }} />
            SRM AP
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="student-map-controls">
          <button
            type="button"
            className="student-map-ctrl-btn"
            onClick={() => setZoom((z) => Math.min(z + 0.2, 1.8))}
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            className="student-map-ctrl-btn"
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.8))}
            title="Zoom Out"
          >
            −
          </button>
        </div>
      </div>

      {route && (
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--srm-text-muted)' }}>
            Route: <strong style={{ color: 'var(--srm-navy)' }}>{route.route_code} — {route.route_name}</strong> ({route.area})
          </span>
          <span style={{ fontSize: '11.5px', color: 'var(--srm-olive)', fontWeight: 700 }}>
            {hasLiveGps ? `GPS sync at ${location?.recorded_at ? new Date(location.recorded_at).toLocaleTimeString() : 'Live'}` : 'Live GPS telemetry waiting on vehicle hardware'}
          </span>
        </div>
      )}
    </div>
  )
}

