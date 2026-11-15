import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { fetchStudents, createStudent } from '../../services/api'
import type { StudentItem, StudentCreatePayload } from '../../types/management'

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const pageSize = 25

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<StudentCreatePayload>({
    username: '',
    password: '',
    registration_number: '',
    full_name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    let isMounted = true

    fetchStudents(search, page * pageSize, pageSize)
      .then((res) => {
        if (!isMounted) return
        setStudents(res.students)
        setTotal(res.total)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load students')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [search, page, reloadKey])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setPage(0)
    setReloadKey((k) => k + 1)
  }

  function handleRetry() {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  async function handleCreateStudent(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (formData.password.length < 12) {
      setFormError('Password must be at least 12 characters long')
      return
    }

    setSubmitting(true)
    try {
      await createStudent({
        username: formData.username.trim(),
        password: formData.password,
        registration_number: formData.registration_number.trim(),
        full_name: formData.full_name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
      })
      setShowCreateModal(false)
      setFormData({
        username: '',
        password: '',
        registration_number: '',
        full_name: '',
        email: '',
        phone: '',
      })
      setLoading(true)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create student account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mgmt-page-header">
        <div className="mgmt-page-title-block">
          <h2>Student Directory</h2>
          <p>Manage SRM AP student records, route allocations, and portal accounts</p>
        </div>
        <div className="mgmt-page-actions">
          <button
            type="button"
            className="mgmt-primary-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Register Student
          </button>
        </div>
      </div>

      <div className="mgmt-toolbar">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input
            type="text"
            className="mgmt-search-input"
            placeholder="Search by student name, registration number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="mgmt-secondary-btn">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="mgmt-secondary-btn"
              onClick={() => {
                setSearch('')
                setPage(0)
                setLoading(true)
                setReloadKey((k) => k + 1)
              }}
            >
              Clear
            </button>
          )}
        </form>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          Total: <strong>{total}</strong> students
        </span>
      </div>

      {error && (
        <div className="mgmt-error-alert">
          <span>{error}</span>
          <button type="button" className="mgmt-secondary-btn" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      <div className="mgmt-table-wrapper">
        {loading ? (
          <div className="mgmt-state-box">
            <div className="mgmt-spinner" />
            <h4>Loading Students...</h4>
          </div>
        ) : students.length > 0 ? (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Full Name</th>
                <th>Contact</th>
                <th>Account Status</th>
                <th>Assigned Route</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const activeAssignment = student.route_assignments.find(
                  (a) => a.status === 'active'
                )

                return (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.registration_number}</strong>
                    </td>
                    <td>{student.full_name}</td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <div>{student.email || '—'}</div>
                        <div style={{ color: '#64748b' }}>{student.phone || ''}</div>
                      </div>
                    </td>
                    <td>
                      {student.account_created ? (
                        <span className="mgmt-badge mgmt-badge--success">
                          Active Account
                        </span>
                      ) : (
                        <span className="mgmt-badge mgmt-badge--warning">
                          Pending Registration
                        </span>
                      )}
                    </td>
                    <td>
                      {activeAssignment?.route ? (
                        <span className="mgmt-badge mgmt-badge--neutral">
                          {activeAssignment.route.area} · {activeAssignment.route.route_code}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Unassigned</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="mgmt-state-box">
            <h4>No Students Found</h4>
            <p>{search ? 'No student records matched your search query.' : 'No students registered.'}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="mgmt-secondary-btn"
              disabled={page === 0}
              onClick={() => {
                setLoading(true)
                setPage((p) => Math.max(0, p - 1))
              }}
            >
              Previous
            </button>
            <button
              type="button"
              className="mgmt-secondary-btn"
              disabled={(page + 1) * pageSize >= total}
              onClick={() => {
                setLoading(true)
                setPage((p) => p + 1)
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Register Student Modal */}
      {showCreateModal && (
        <div className="mgmt-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="mgmt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mgmt-modal-header">
              <h3>Register New Student</h3>
              <button
                type="button"
                className="mgmt-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateStudent}>
              <div className="mgmt-modal-body">
                {formError && (
                  <div className="mgmt-error-alert" style={{ marginBottom: '14px' }}>
                    {formError}
                  </div>
                )}
                <div className="mgmt-form-group">
                  <label htmlFor="student-fullname">Full Name *</label>
                  <input
                    id="student-fullname"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="student-regno">Registration Number *</label>
                  <input
                    id="student-regno"
                    type="text"
                    required
                    placeholder="e.g. AP21110010123"
                    value={formData.registration_number}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_number: e.target.value })
                    }
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="student-username">Username *</label>
                  <input
                    id="student-username"
                    type="text"
                    required
                    placeholder="e.g. rahul_s"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                  <div className="mgmt-form-hint">At least 3 characters</div>
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="student-password">Initial Password *</label>
                  <input
                    id="student-password"
                    type="password"
                    required
                    placeholder="Minimum 12 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <div className="mgmt-form-hint">Must be at least 12 characters</div>
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="student-email">Email Address</label>
                  <input
                    id="student-email"
                    type="email"
                    placeholder="e.g. rahul@srmap.edu.in"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="mgmt-form-group">
                  <label htmlFor="student-phone">Phone Number</label>
                  <input
                    id="student-phone"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="mgmt-modal-footer">
                <button
                  type="button"
                  className="mgmt-secondary-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mgmt-primary-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
