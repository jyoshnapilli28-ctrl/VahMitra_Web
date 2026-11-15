import type { DriverDashboardData, DriverStudentItem } from '../../types/driver'

interface DriverAssignedStudentsTabProps {
  dashboardData?: DriverDashboardData | null
}

export default function DriverAssignedStudentsTab({ dashboardData }: DriverAssignedStudentsTabProps) {
  const students: DriverStudentItem[] = dashboardData?.students?.list || []
  const totalCount = dashboardData?.students?.total ?? students.length

  const maskPhone = (phone: string | null | undefined) => {
    if (!phone || phone.trim() === '') return 'Not provided'
    const trimmed = phone.trim()
    if (trimmed.length <= 4) return trimmed
    const last4 = trimmed.slice(-4)
    return `*****${last4}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Disclaimer Card */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--color-warning-bg, #FEF7EC)',
          border: '1px solid var(--color-warning-border, #F5D8A0)',
          borderRadius: 'var(--radius-md, 10px)',
          color: 'var(--color-text, #20251C)',
          fontSize: 13.5,
          lineHeight: 1.5,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <strong style={{ color: '#92400E' }}>Route-Level Scope</strong>
          <p style={{ margin: '4px 0 0', color: '#92400E' }}>
            This list shows students assigned to your route. Bus-specific passenger assignments have
            not been verified. This list must not be treated as a confirmed boarding manifest.
          </p>
        </div>
      </div>

      {/* Students List Card */}
      <div className="driver-card">
        <div className="driver-card-title">
          <span>Assigned Students Manifest</span>
          <span className="vh-badge vh-badge--neutral">
            Total: {totalCount} route-level students
          </span>
        </div>

        {students.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="vh-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Reg. Number</th>
                  <th>Student Name</th>
                  <th>Contact (Masked)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id || student.registration_number}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {student.registration_number}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {student.full_name}
                    </td>
                    <td>{maskPhone(student.phone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="driver-empty-state">
            <div className="driver-empty-icon">👥</div>
            <h3>No Students Found</h3>
            <p>No active students found on this route.</p>
          </div>
        )}
      </div>
    </div>
  )
}
