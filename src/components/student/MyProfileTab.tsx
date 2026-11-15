import { useState, useRef } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import type { StudentProfile } from '../../types/student'
import {
  updateStudentProfile,
  updateStudentPhoto,
  removeStudentPhoto,
} from '../../services/api'
import { ProfileIcon, CameraIcon, TrashIcon, CheckCircleIcon } from '../common/Icons'

interface MyProfileTabProps {
  student: StudentProfile
  onProfileUpdated: (updated: Partial<StudentProfile>) => void
}

export default function MyProfileTab({ student, onProfileUpdated }: MyProfileTabProps) {
  // Nickname editing
  const [nickname, setNickname] = useState(student.nickname || '')
  const [isEditingNick, setIsEditingNick] = useState(false)
  const [nickSaving, setNickSaving] = useState(false)
  const [nickSuccess, setNickSuccess] = useState('')

  // Phone editing
  const [phone, setPhone] = useState(student.phone || '')
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [phoneSaving, setPhoneSaving] = useState(false)

  // Photo uploading
  const [photoPreview, setPhotoPreview] = useState<string | null>(student.profile_photo_url)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoNotice, setPhotoNotice] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const initial = (student.nickname || student.full_name).charAt(0).toUpperCase() || 'S'

  async function handleSaveNickname(e: FormEvent) {
    e.preventDefault()
    setNickSaving(true)
    try {
      await updateStudentProfile({ nickname: nickname.trim() || undefined })
      onProfileUpdated({ nickname: nickname.trim() || null })
      setIsEditingNick(false)
      setNickSuccess('Preferred nickname updated successfully!')
      setTimeout(() => setNickSuccess(''), 3000)
    } catch {
      // ignore
    } finally {
      setNickSaving(false)
    }
  }

  async function handleSavePhone(e: FormEvent) {
    e.preventDefault()
    setPhoneSaving(true)
    try {
      await updateStudentProfile({ phone: phone.trim() || undefined })
      onProfileUpdated({ phone: phone.trim() || null })
      setIsEditingPhone(false)
    } catch {
      // ignore
    } finally {
      setPhoneSaving(false)
    }
  }

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 4MB) & type
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      setPhotoNotice('Please choose a valid JPG, PNG, or WebP image.')
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setPhotoNotice('Image size must be less than 4MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setPhotoPreview(dataUrl)
      setPhotoSaving(true)
      try {
        await updateStudentPhoto(dataUrl)
        onProfileUpdated({ profile_photo_url: dataUrl })
        setPhotoNotice('Profile photograph updated successfully!')
        setTimeout(() => setPhotoNotice(''), 3500)
      } catch {
        setPhotoNotice('Failed to save photograph. Please try another image.')
      } finally {
        setPhotoSaving(false)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleRemovePhoto() {
    setPhotoSaving(true)
    try {
      await removeStudentPhoto()
      setPhotoPreview(null)
      onProfileUpdated({ profile_photo_url: null })
      setPhotoNotice('Profile photograph removed.')
      setTimeout(() => setPhotoNotice(''), 3000)
    } catch {
      // ignore
    } finally {
      setPhotoSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Photo & Customization Hero Card */}
      <div className="student-card">
        <div className="student-card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ProfileIcon size={16} /> Profile Photograph & Persona
          </span>
          <span style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>Student Personalization</span>
        </div>

        {photoNotice && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, color: '#065f46', fontSize: 12.5, fontWeight: 600 }}>
            {photoNotice}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {/* Avatar with Upload Badge */}
          <div style={{ position: 'relative' }}>
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile Preview"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--srm-olive)',
                  boxShadow: '0 4px 18px var(--srm-olive-glow)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: 'var(--srm-navy)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 34,
                  fontWeight: 800,
                  border: '3px solid var(--srm-olive)',
                  boxShadow: '0 4px 18px var(--srm-olive-glow)',
                }}
              >
                {initial}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload new photo"
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--srm-olive)',
                color: '#fff',
                border: '2px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              <CameraIcon size={14} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />

          <div style={{ flex: 1, minWidth: 240 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--srm-navy)', margin: '0 0 4px 0' }}>
              {nickname || student.full_name}
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: 12.5, color: 'var(--srm-text-muted)' }}>
              Official Name: <strong>{student.full_name}</strong> · Reg: <strong>{student.registration_number}</strong>
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="vh-btn vh-btn-secondary"
                style={{ fontSize: 12, padding: '6px 14px' }}
                disabled={photoSaving}
                onClick={() => fileInputRef.current?.click()}
              >
                <CameraIcon size={14} />
                {photoPreview ? 'Change Photograph' : 'Upload Photograph'}
              </button>

              {photoPreview && (
                <button
                  type="button"
                  className="vh-btn vh-btn-ghost"
                  style={{ fontSize: 12, padding: '6px 12px', color: '#b91c1c' }}
                  disabled={photoSaving}
                  onClick={handleRemovePhoto}
                >
                  <TrashIcon size={14} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nickname & Contact Customization */}
      <div className="student-grid-2">
        {/* Preferred Nickname */}
        <div className="student-card">
          <div className="student-card-title">
            <span>Preferred Transit Nickname</span>
          </div>

          {nickSuccess && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#ecfdf5', borderRadius: 6, color: '#065f46', fontSize: 12, fontWeight: 600 }}>
              {nickSuccess}
            </div>
          )}

          <p style={{ fontSize: 12.5, color: 'var(--srm-text-muted)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Customize your display name shown on your portal header and in the transit discussion room.
          </p>

          {isEditingNick ? (
            <form onSubmit={handleSaveNickname} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="e.g. Kishore, Aditya, Sonic..."
                maxLength={50}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--srm-border)',
                  fontSize: 13,
                  outline: 'none',
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="vh-btn vh-btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    setNickname(student.nickname || '')
                    setIsEditingNick(false)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vh-btn vh-btn-primary"
                  style={{ fontSize: 12 }}
                  disabled={nickSaving}
                >
                  {nickSaving ? 'Saving...' : 'Save Nickname'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--srm-cream)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--srm-border)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>CURRENT NICKNAME</div>
                <strong style={{ fontSize: 14, color: 'var(--srm-navy)' }}>
                  {student.nickname || 'Not set (using official name)'}
                </strong>
              </div>
              <button
                type="button"
                className="vh-btn vh-btn-secondary"
                style={{ fontSize: 12, padding: '5px 12px' }}
                onClick={() => setIsEditingNick(true)}
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Contact Phone */}
        <div className="student-card">
          <div className="student-card-title">
            <span>Contact Phone</span>
          </div>

          <p style={{ fontSize: 12.5, color: 'var(--srm-text-muted)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Used for emergency transit alerts and driver pickup coordination when necessary.
          </p>

          {isEditingPhone ? (
            <form onSubmit={handleSavePhone} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--srm-border)',
                  fontSize: 13,
                  outline: 'none',
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="vh-btn vh-btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    setPhone(student.phone || '')
                    setIsEditingPhone(false)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vh-btn vh-btn-primary"
                  style={{ fontSize: 12 }}
                  disabled={phoneSaving}
                >
                  {phoneSaving ? 'Saving...' : 'Save Phone'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--srm-cream)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--srm-border)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--srm-text-muted)' }}>PRIMARY PHONE</div>
                <strong style={{ fontSize: 14, color: 'var(--srm-navy)' }}>
                  {student.phone || 'Not provided'}
                </strong>
              </div>
              <button
                type="button"
                className="vh-btn vh-btn-secondary"
                style={{ fontSize: 12, padding: '5px 12px' }}
                onClick={() => setIsEditingPhone(true)}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Official Academic Identity (Protected) */}
      <div className="student-card">
        <div className="student-card-title">
          <span>Official University Academic Identity</span>
          <span className="vh-badge vh-badge--success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircleIcon size={12} /> Verified SRM AP Record
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="student-prop-row">
            <span className="student-prop-label">Full Legal Name</span>
            <span className="student-prop-value">{student.full_name}</span>
          </div>
          <div className="student-prop-row">
            <span className="student-prop-label">Registration Number</span>
            <span className="student-prop-value">{student.registration_number}</span>
          </div>
          <div className="student-prop-row">
            <span className="student-prop-label">University Email</span>
            <span className="student-prop-value">{student.email || 'student@srmap.edu.in'}</span>
          </div>
          <div className="student-prop-row">
            <span className="student-prop-label">Department / School</span>
            <span className="student-prop-value">{student.department || 'School of Engineering & Applied Sciences'}</span>
          </div>
          <div className="student-prop-row">
            <span className="student-prop-label">Academic Year</span>
            <span className="student-prop-value">{student.academic_year || 'Academic Year 2025-2026'}</span>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--srm-text-light)' }}>
          * Official academic credentials are synchronized with university admissions registry and can only be modified through academic administration.
        </div>
      </div>
    </div>
  )
}

