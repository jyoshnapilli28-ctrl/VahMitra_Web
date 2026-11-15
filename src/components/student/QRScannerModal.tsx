import { useState, useRef, useEffect } from 'react'
import { CheckCircleIcon, XIcon, QrCodeIcon, AlertTriangleIcon } from '../common/Icons'
import { scanDemoQr } from '../../services/api'
import type { QrScanResult } from '../../types/student'

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
}

const OFFICIAL_DEMO_PAYLOAD = 'VAHMITRA-SRMAP-DEMO-PASS-2026'

export default function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const [cameraState, setCameraState] = useState<'requesting' | 'active' | 'denied' | 'error'>('requesting')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [scanResult, setScanResult] = useState<QrScanResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      return
    }

    let isMounted = true

    let timerId: ReturnType<typeof setTimeout> | undefined

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (!isMounted) {
            stream.getTracks().forEach((track) => track.stop())
            return
          }
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
          }
          setCameraState('active')
        })
        .catch((err: unknown) => {
          if (!isMounted) return
          const errorName = err instanceof Error ? err.name : 'UnknownError'
          if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
            setCameraState('denied')
            setErrorMessage('Camera access was denied. Please allow camera permissions to scan.')
          } else {
            setCameraState('error')
            setErrorMessage('Camera hardware is not available on this device.')
          }
        })
    } else {
      timerId = setTimeout(() => {
        if (!isMounted) return
        setCameraState('error')
        setErrorMessage('MediaDevices API not supported on this browser.')
      }, 0)
    }

    return () => {
      isMounted = false
      if (timerId) clearTimeout(timerId)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [isOpen])

  function handleCloseModal() {
    setScanResult(null)
    setErrorMessage('')
    setManualCode('')
    onClose()
  }

  async function handleVerifyPayload(payload: string) {
    setIsScanning(true)
    try {
      const res = await scanDemoQr(payload)
      setScanResult(res)
    } catch {
      setScanResult({
        valid: false,
        detail: 'Unable to connect to verification server. Please try again.',
      })
    } finally {
      setIsScanning(false)
    }
  }

  function handleScanAgain() {
    setScanResult(null)
    setManualCode('')
  }

  if (!isOpen) return null

  return (
    <div className="student-qr-modal-backdrop" onClick={handleCloseModal}>
      <div className="student-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="student-qr-modal-header">
          <h3>
            <QrCodeIcon size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            VAHMITRA QR Scanner
          </h3>
          <button
            type="button"
            onClick={handleCloseModal}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--srm-text-muted)' }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {scanResult ? (
          /* Result Screen */
          scanResult.valid ? (
            /* OFFICIAL SUCCESS SCREEN REQUIRED BY SPEC */
            <div className="student-qr-success-card">
              <div className="student-qr-check-icon">
                <CheckCircleIcon size={36} />
              </div>

              <span className="student-qr-brand-title">VAHMITRA</span>
              <h2>Welcome to VAHMITRA!</h2>
              <h3>Demo QR Scan Successful</h3>

              <div className="student-qr-demo-notice">
                &ldquo;Demonstration Mode — No Attendance Recorded&rdquo;
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="vh-btn vh-btn-secondary"
                  onClick={handleScanAgain}
                >
                  Scan Again
                </button>
                <button
                  type="button"
                  className="vh-btn vh-btn-primary"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Invalid QR Screen */
            <div className="student-qr-success-card">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <AlertTriangleIcon size={32} />
              </div>
              <h3 style={{ color: '#b91c1c', marginBottom: 8 }}>Invalid QR Code</h3>
              <p style={{ fontSize: 13, color: 'var(--srm-text-muted)', maxWidth: 320, marginBottom: 20 }}>
                {scanResult.detail || 'This QR code is not recognized by the VAHMITRA transit network.'}
              </p>
              <button
                type="button"
                className="vh-btn vh-btn-secondary"
                onClick={handleScanAgain}
              >
                Scan Again
              </button>
            </div>
          )
        ) : (
          /* Live Camera / Scanner View */
          <div>
            <div className="student-qr-viewport">
              {cameraState === 'active' ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="student-qr-laser" />
                  <div className="student-qr-guide-box" style={{ position: 'absolute' }}>
                    Align VAHMITRA QR inside frame
                  </div>
                </>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#fff' }}>
                  <AlertTriangleIcon size={30} style={{ color: '#e8a33b', marginBottom: 8 }} />
                  <p style={{ fontSize: 13, margin: '0 0 6px 0', fontWeight: 600 }}>
                    {cameraState === 'denied' ? 'Camera Permission Denied' : 'Camera Unavailable'}
                  </p>
                  <p style={{ fontSize: 11, color: '#a0aaa4', margin: 0 }}>
                    {errorMessage || 'Use the official demo scanner trigger below.'}
                  </p>
                </div>
              )}
            </div>

            <div style={{ padding: '18px 24px', background: 'var(--srm-cream)' }}>
              <div style={{ marginBottom: 12, textAlign: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--srm-text-muted)', textTransform: 'uppercase' }}>
                  Official Demo Verification Test
                </span>
              </div>

              {/* One-click official demo button */}
              <button
                type="button"
                className="vh-btn vh-btn-primary"
                style={{ width: '100%', marginBottom: 14 }}
                disabled={isScanning}
                onClick={() => handleVerifyPayload(OFFICIAL_DEMO_PAYLOAD)}
              >
                {isScanning ? 'Verifying...' : 'Scan Official VAHMITRA Demo QR'}
              </button>

              {/* Or manual payload input for testing invalid QRs */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Enter QR code text..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--srm-border)',
                    fontSize: 12,
                  }}
                />
                <button
                  type="button"
                  className="vh-btn vh-btn-secondary"
                  disabled={!manualCode.trim() || isScanning}
                  onClick={() => handleVerifyPayload(manualCode.trim())}
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
