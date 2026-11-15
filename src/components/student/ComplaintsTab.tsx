import { useState, useEffect, useRef } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import type { ComplaintItem, ComplaintStatusLogItem } from '../../types/student'
import {
  fetchStudentComplaints,
  createStudentComplaintFormData,
  fetchStudentComplaintDetail,
} from '../../services/api'
import {
  ComplaintsIcon,
  CopyIcon,
  PaperclipIcon,
  CheckCircle2Icon,
} from '../common/Icons'

const COMPLAINT_CATEGORIES = [
  'Bus delay',
  'Driver behaviour',
  'Vehicle condition',
  'Missed pickup',
  'Route issue',
  'Attendance issue',
  'Safety concern',
  'Other',
]

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export default function ComplaintsTab() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successTicketNumber, setSuccessTicketNumber] = useState<string | null>(null)
  const [copiedTicket, setCopiedTicket] = useState(false)
  const [formError, setFormError] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Ticket Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<ComplaintItem | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    let isMounted = true

    fetchStudentComplaints()
      .then((items) => {
        if (!isMounted) return
        setComplaints(items)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Unable to load complaints.')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [reloadKey])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFormError('')
    const file = e.target.files?.[0]
    if (!file) {
      setEvidenceFile(null)
      setFilePreviewUrl(null)
      return
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setFormError('Invalid file type. Please upload a JPG, PNG, or WEBP image.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFormError('File size exceeds 5MB limit. Please choose a smaller image.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setEvidenceFile(file)
    const preview = URL.createObjectURL(file)
    setFilePreviewUrl(preview)
  }

  function handleRemoveFile() {
    setEvidenceFile(null)
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl)
      setFilePreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmitComplaint(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSuccessTicketNumber(null)
    setCopiedTicket(false)

    if (!title.trim() || !description.trim()) {
      setFormError('Please complete all required fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('category', category)
      formData.append('description', description.trim())
      if (evidenceFile) {
        formData.append('evidence_file', evidenceFile)
      }

      const res = await createStudentComplaintFormData(formData)

      setSuccessTicketNumber(res.ticket_number)
      setTitle('')
      setDescription('')
      handleRemoveFile()
      setReloadKey((k) => k + 1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit complaint. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCopyTicket(ticketNumber: string) {
    navigator.clipboard.writeText(ticketNumber)
    setCopiedTicket(true)
    setTimeout(() => setCopiedTicket(false), 2500)
  }

  async function handleOpenDetail(ticketNumber: string) {
    setLoadingDetail(true)
    try {
      const fullDetail = await fetchStudentComplaintDetail(ticketNumber)
      setSelectedTicket(fullDetail)
    } catch {
      // Fallback to local item if detail fetch fails
      const local = complaints.find((c) => c.ticket_number === ticketNumber) || null
      setSelectedTicket(local)
    } finally {
      setLoadingDetail(false)
    }
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'Resolved':
        return 'vh-badge--success'
      case 'Under Review':
      case 'In Progress':
        return 'vh-badge--warning'
      case 'Rejected':
        return 'vh-badge--error'
      default:
        return 'vh-badge--neutral'
    }
  }

  function formatTime(isoStr: string) {
    try {
      const d = new Date(isoStr)
      return `${d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} at ${d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    } catch {
      return isoStr
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. New Complaint Form Card */}
      <div className="student-card">
        <div className="student-card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ComplaintsIcon size={18} /> Submit Transport Support Ticket
          </span>
          <span style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
            Official University Escalation &amp; Collision-Safe Ticket Ledger
          </span>
        </div>

        {/* Success Banner with Generated Ticket Number */}
        {successTicketNumber && (
          <div
            style={{
              padding: '16px 20px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 8,
              color: '#065f46',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14 }}>
                <CheckCircle2Icon size={18} /> Ticket Logged Successfully
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Your complaint has been submitted under Ticket{' '}
                <strong style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                  {successTicketNumber}
                </strong>
                . Campus transport management has been notified.
              </div>
            </div>

            <button
              type="button"
              className="vh-btn vh-btn-secondary"
              onClick={() => handleCopyTicket(successTicketNumber)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                padding: '6px 14px',
              }}
            >
              <CopyIcon size={14} />
              {copiedTicket ? 'Copied to Clipboard!' : 'Copy Ticket Number'}
            </button>
          </div>
        )}

        {formError && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#991b1b',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="student-grid-2" style={{ margin: 0, gap: 14 }}>
            <div className="vh-form-group" style={{ margin: 0 }}>
              <label htmlFor="complaint-title">Subject / Title *</label>
              <input
                id="complaint-title"
                type="text"
                placeholder="e.g. Bus 12 arrived 35 minutes late at Benz Circle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="vh-form-group" style={{ margin: 0 }}>
              <label htmlFor="complaint-category">Category *</label>
              <select
                id="complaint-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="vh-form-group" style={{ margin: 0 }}>
            <label htmlFor="complaint-description">Detailed Description *</label>
            <textarea
              id="complaint-description"
              rows={3}
              placeholder="Provide specific details including time, stop name, bus number, or circumstance..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Evidence File Upload */}
          <div className="vh-form-group" style={{ margin: 0 }}>
            <label htmlFor="complaint-evidence" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PaperclipIcon size={14} /> Attach Photographic Evidence (Optional)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                ref={fileInputRef}
                id="complaint-evidence"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                style={{
                  fontSize: 12.5,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px dashed var(--srm-border)',
                  background: 'var(--srm-cream)',
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
                Accepted formats: JPG, PNG, WEBP (Max 5MB). Files are securely stored and verified.
              </span>

              {/* Client Preview */}
              {filePreviewUrl && evidenceFile && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: '#FFFFFF',
                    border: '1px solid var(--srm-border)',
                    borderRadius: 6,
                    maxWidth: 400,
                  }}
                >
                  <img
                    src={filePreviewUrl}
                    alt="Evidence Preview"
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: '1px solid var(--srm-border)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--srm-navy)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {evidenceFile.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
                      {(evidenceFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="submit"
              className="vh-btn vh-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging Ticket...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Complaint History List */}
      <div className="student-card">
        <div className="student-card-title">
          <span>My Support Ticket History ({complaints.length})</span>
          <span style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
            Immutable Audit Trail &amp; Management Review
          </span>
        </div>

        {loading ? (
          <div className="vh-state-box" style={{ padding: '32px 12px' }}>
            <div className="vh-spinner" />
            <p>Loading your past complaints...</p>
          </div>
        ) : error ? (
          <div className="vh-state-box" style={{ padding: '32px 12px' }}>
            <p>{error}</p>
            <button
              type="button"
              className="vh-btn vh-btn-secondary"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Retry
            </button>
          </div>
        ) : complaints.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {complaints.map((c) => (
              <div
                key={c.id}
                style={{
                  border: '1px solid var(--srm-border)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  background: 'var(--srm-cream)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: 'var(--srm-navy)',
                        background: '#FFFFFF',
                        padding: '2px 8px',
                        borderRadius: 4,
                        border: '1px solid var(--srm-border)',
                      }}
                    >
                      {c.ticket_number || `CMP-${c.id}`}
                    </span>
                    <strong style={{ fontSize: 14.5, color: 'var(--srm-navy)' }}>
                      {c.title}
                    </strong>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--srm-olive)' }}>
                      · {c.category}
                    </span>
                    {c.has_evidence && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: 'var(--srm-navy)',
                          background: 'rgba(16, 45, 70, 0.08)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <PaperclipIcon size={11} /> Evidence Attached
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`vh-badge ${getStatusBadgeClass(c.status)}`}>
                      {c.status}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--srm-text-light)' }}>
                      {formatTime(c.created_at)}
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'var(--srm-text-dark)',
                    lineHeight: 1.5,
                  }}
                >
                  {c.description}
                </p>

                {c.management_response && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#FFFFFF',
                      border: '1px solid var(--srm-border)',
                      borderLeft: '4px solid var(--srm-olive)',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--srm-olive)', marginBottom: 2 }}>
                      CAMPUS MANAGEMENT OFFICIAL RESPONSE:
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--srm-navy)' }}>
                      {c.management_response}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                  <button
                    type="button"
                    className="vh-btn vh-btn-secondary"
                    style={{ fontSize: 11.5, padding: '4px 12px' }}
                    onClick={() => handleOpenDetail(c.ticket_number)}
                  >
                    View Details &amp; History
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '36px 12px',
              color: 'var(--srm-text-muted)',
            }}
          >
            <p style={{ margin: 0, fontSize: 13 }}>
              No complaints submitted. Have a concern? Use the form above.
            </p>
          </div>
        )}
      </div>

      {/* 3. Ticket Detail & Status History Modal */}
      {(selectedTicket || loadingDetail) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(16, 45, 70, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setSelectedTicket(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              maxWidth: 620,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetail ? (
              <div className="vh-state-box" style={{ padding: '36px 12px' }}>
                <div className="vh-spinner" />
                <p>Loading ticket history...</p>
              </div>
            ) : selectedTicket ? (
              <>
                {/* Modal Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid var(--srm-border)',
                    paddingBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 14,
                          fontWeight: 800,
                          color: 'var(--srm-navy)',
                          background: 'var(--srm-cream)',
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: '1px solid var(--srm-border)',
                        }}
                      >
                        {selectedTicket.ticket_number}
                      </span>
                      <span className={`vh-badge ${getStatusBadgeClass(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <h3 style={{ margin: '8px 0 2px 0', fontSize: 16, color: 'var(--srm-navy)' }}>
                      {selectedTicket.title}
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--srm-text-muted)' }}>
                      Category: <strong>{selectedTicket.category}</strong> · Submitted on{' '}
                      {formatTime(selectedTicket.created_at)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 20,
                      cursor: 'pointer',
                      color: 'var(--srm-text-muted)',
                      padding: 4,
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Description */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--srm-navy)', marginBottom: 4 }}>
                    DESCRIPTION
                  </div>
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'var(--srm-cream)',
                      border: '1px solid var(--srm-border)',
                      borderRadius: 8,
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: 'var(--srm-text-dark)',
                    }}
                  >
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Evidence Image (if attached) */}
                {(selectedTicket.evidence_url || selectedTicket.has_evidence) && (
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--srm-navy)', marginBottom: 6 }}>
                      ATTACHED EVIDENCE
                    </div>
                    <div
                      style={{
                        padding: 10,
                        background: 'var(--srm-cream)',
                        border: '1px solid var(--srm-border)',
                        borderRadius: 8,
                        display: 'inline-block',
                      }}
                    >
                      <a
                        href={selectedTicket.evidence_url || `/api/student/complaints/${selectedTicket.ticket_number}/evidence`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={selectedTicket.evidence_url || `/api/student/complaints/${selectedTicket.ticket_number}/evidence`}
                          alt="Ticket Evidence"
                          style={{
                            maxHeight: 200,
                            maxWidth: '100%',
                            borderRadius: 6,
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      </a>
                      <div style={{ fontSize: 11, color: 'var(--srm-text-muted)', marginTop: 4 }}>
                        Click to view full photograph
                      </div>
                    </div>
                  </div>
                )}

                {/* Management Response */}
                {selectedTicket.management_response && (
                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderLeft: '4px solid var(--srm-olive)',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--srm-olive)', marginBottom: 4 }}>
                      MANAGEMENT OFFICIAL RESPONSE
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--srm-navy)' }}>
                      {selectedTicket.management_response}
                    </div>
                  </div>
                )}

                {/* Immutable Audit Log Timeline */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--srm-navy)', marginBottom: 8 }}>
                    IMMUTABLE AUDIT TIMELINE
                  </div>

                  {selectedTicket.status_history && selectedTicket.status_history.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedTicket.status_history.map((log: ComplaintStatusLogItem, idx: number) => (
                        <div
                          key={log.id || idx}
                          style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: 'var(--srm-olive)',
                              marginTop: 5,
                              flexShrink: 0,
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: 'var(--srm-cream)',
                              border: '1px solid var(--srm-border)',
                              borderRadius: 6,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--srm-navy)' }}>
                                {log.old_status ? `${log.old_status} → ${log.new_status}` : log.new_status}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>
                                {formatTime(log.created_at)}
                              </div>
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--srm-text-dark)', marginTop: 3 }}>
                              Actor: <strong>{log.updated_by_role}</strong>
                            </div>
                            {log.notes && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: 'var(--srm-text-muted)',
                                  marginTop: 4,
                                  fontStyle: 'italic',
                                }}
                              >
                                Remarks: &ldquo;{log.notes}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--srm-text-muted)' }}>
                      No audit history entries recorded.
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="button"
                    className="vh-btn vh-btn-secondary"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
