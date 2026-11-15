import type { ReactNode } from 'react'
import './StatCard.css'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: number | string
  subtitle?: string
  accent?: 'green' | 'blue' | 'amber' | 'red'
}

export default function StatCard({
  icon,
  label,
  value,
  subtitle,
  accent = 'green',
}: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__info">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
        {subtitle && (
          <span className="stat-card__subtitle">{subtitle}</span>
        )}
      </div>
    </div>
  )
}

