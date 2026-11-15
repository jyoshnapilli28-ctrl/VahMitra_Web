import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import './App.css'

import ManagementLayout from './components/management/ManagementLayout'
import type { ManagementTab } from './components/management/ManagementSidebar'
import ManagementOverview from './pages/management/ManagementOverview'
import StudentsPage from './pages/management/StudentsPage'
import DriversPage from './pages/management/DriversPage'
import BusesPage from './pages/management/BusesPage'
import RoutesPage from './pages/management/RoutesPage'
import AllocationsPage from './pages/management/AllocationsPage'
import FleetMonitoringPage from './pages/management/FleetMonitoringPage'

import StudentLayout from './components/student/StudentLayout'
import type { StudentTab } from './components/student/StudentSidebar'
import StudentDashboardPage from './pages/student/StudentDashboardPage'
import type { StudentProfile } from './types/student'

import type { DriverTab } from './components/driver/DriverSidebar'
import DriverDashboardPage from './pages/driver/DriverDashboardPage'

type Role = 'Student' | 'Driver' | 'Management'

type Session = {
  username: string
  role: string
}

function OfficialBusSymbol() {
  return (
    <img
      src="/images/branding/vahmitra-favicon.svg"
      alt="VAHMITRA Emblem"
      className="hero-bus-icon"
    />
  )
}

function App() {
  const [role, setRole] = useState<Role>('Student')
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState<Session | null>(null)

  const [activeTab, setActiveTab] = useState<ManagementTab>('overview')
  const [studentTab, setStudentTab] = useState<StudentTab>('home')
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [studentUnread, setStudentUnread] = useState(0)
  const [studentUnreadMessages, setStudentUnreadMessages] = useState(0)

  const [driverTab, setDriverTab] = useState<DriverTab>('home')

  // Check existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('vahmitra_token')
    if (!token) return

    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Session expired')
        }
        return res.json()
      })
      .then((data) => {
        setSession({
          username: data.username,
          role: data.role,
        })
      })
      .catch(() => {
        localStorage.removeItem('vahmitra_token')
        setSession(null)
      })
  }, [])

  const handleHeaderProfileUpdate = useCallback(
    (profile: StudentProfile, unread: number, unreadMessages: number = 0) => {
      setStudentProfile(profile)
      setStudentUnread(unread)
      setStudentUnreadMessages(unreadMessages)
    },
    []
  )

  const details = {
    Student: {
      label: 'Registration Number',
      placeholder: 'Enter your registration number',
      button: 'Continue as Student',
    },
    Driver: {
      label: 'Username',
      placeholder: 'Enter your driver username',
      button: 'Continue as Driver',
    },
    Management: {
      label: 'Management ID',
      placeholder: 'Enter your management username',
      button: 'Continue as Management',
    },
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          role: role.toLowerCase(),
        }),
      })

      const rawText = await response.text()
      let data: Record<string, unknown> | null = null
      try {
        data = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null
      } catch {
        if (!response.ok) {
          throw new Error(
            response.status === 502 || response.status === 504
              ? 'Unable to reach the VAHMITRA backend service (port 8001). Please verify the server is running.'
              : `Server error (${response.status}). Please try again later.`
          )
        }
      }

      if (!response.ok) {
        const errorDetail = typeof data?.detail === 'string' ? data.detail : 'Invalid login credentials'
        throw new Error(errorDetail)
      }

      const accessToken = typeof data?.access_token === 'string' ? data.access_token : null
      const username = typeof data?.username === 'string' ? data.username : identifier.trim()
      const userRole = typeof data?.role === 'string' ? data.role : role.toLowerCase()

      if (!accessToken) {
        throw new Error('Invalid authentication response from server.')
      }

      localStorage.setItem('vahmitra_token', accessToken)

      setSession({
        username,
        role: userRole,
      })

      setPassword('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('vahmitra_token')
    setSession(null)
    setIdentifier('')
    setPassword('')
    setError('')
    setActiveTab('overview')
    setStudentTab('home')
    setStudentProfile(null)
    setStudentUnread(0)
    setStudentUnreadMessages(0)
    setDriverTab('home')
  }

  function handleRoleChange(item: Role) {
    setRole(item)
    setShowPassword(false)
    setIdentifier('')
    setPassword('')
    setError('')
  }

  // 1. Role: Management Dashboard
  if (session && session.role.toLowerCase() === 'management') {
    return (
      <ManagementLayout
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        username={session.username}
        onLogout={handleLogout}
      >
        {activeTab === 'overview' && (
          <ManagementOverview
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'students' && <StudentsPage />}
        {activeTab === 'drivers' && <DriversPage />}
        {activeTab === 'buses' && <BusesPage />}
        {activeTab === 'routes' && <RoutesPage />}
        {activeTab === 'allocations' && <AllocationsPage />}
        {activeTab === 'fleet' && <FleetMonitoringPage />}
      </ManagementLayout>
    )
  }

  // 2. Role: Student Dashboard (Full Smart Campus Platform)
  if (session && session.role.toLowerCase() === 'student') {
    return (
      <StudentLayout
        currentTab={studentTab}
        onSelectTab={setStudentTab}
        username={session.username}
        officialName={studentProfile?.full_name}
        nickname={studentProfile?.nickname}
        registrationNumber={studentProfile?.registration_number}
        profilePhotoUrl={studentProfile?.profile_photo_url}
        unreadNotificationsCount={studentUnread}
        unreadMessagesCount={studentUnreadMessages}
        onLogout={handleLogout}
      >
        <StudentDashboardPage
          activeTab={studentTab}
          username={session.username}
          onNavigateTab={setStudentTab}
          onUpdateHeaderProfile={handleHeaderProfileUpdate}
        />
      </StudentLayout>
    )
  }

  // 3. Role: Driver Dashboard
  if (session && session.role.toLowerCase() === 'driver') {
    return (
      <DriverDashboardPage
        activeTab={driverTab}
        onSelectTab={setDriverTab}
        username={session.username}
        onLogout={handleLogout}
      />
    )
  }

  // Fallback / Public Login Page (Preserved 100% exact design)
  return (
    <main className="page">
      <div className="campus-background" />

      <header className="header">
        <div className="header-brand">
          <img
            src="/images/srm-wordmark.jpeg"
            alt="SRM University AP"
            className="srm-logo"
          />
          <span className="header-divider" />
          <img
            src="/images/branding/vahmitra-logo.svg"
            alt="VAHMITRA - Smart Bus Tracking & Management System"
            className="vahmitra-header-logo"
          />
        </div>
        <span className="header-tag">SRM AP · CAMPUS TRANSPORT</span>
      </header>

      <section className="main-content">
        {session ? (
          <section className="login-card">
            <div className="card-top">
              <span className="card-eyebrow">VAHMITRA PORTAL</span>
              <h2>Welcome, {session.username}</h2>
              <p>You have signed in under role: {session.role}</p>
            </div>

            <div className="role-selector">
              <button type="button" className="role active">
                {session.role}
              </button>
            </div>

            <button
              className="submit-button"
              type="button"
              onClick={handleLogout}
            >
              Sign out <span>→</span>
            </button>

            <div className="card-bottom">
              <span className="secure-dot" />
              Secure access to SRM AP transport services
            </div>
          </section>
        ) : (
          <>
            <div className="hero-content">
              <div className="hero-bus">
                <OfficialBusSymbol />
              </div>
              <p className="hero-kicker">SRM UNIVERSITY AP</p>
              <h1>VAHMITRA</h1>
              <h2>
                Your campus.<br />
                Your journey.<br />
                <span>Connected.</span>
              </h2>
              <p className="hero-description">
                A smarter way to track, manage and experience
                campus transportation.
              </p>
              <div className="hero-line" />
              <p className="hero-caption">
                SMART BUS TRACKING & MANAGEMENT SYSTEM
              </p>
            </div>

            <section className="login-card">
              <div className="card-top">
                <span className="card-eyebrow">WELCOME BACK</span>
                <h2>Sign in to Vahmitra</h2>
                <p>Choose your portal to continue.</p>
              </div>

              <div className="role-selector">
                {(['Student', 'Driver', 'Management'] as Role[]).map(
                  (item) => (
                    <button
                      type="button"
                      key={item}
                      className={role === item ? 'role active' : 'role'}
                      onClick={() => handleRoleChange(item)}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <form className="login-form" onSubmit={handleLogin}>
                <label htmlFor="identity">{details[role].label}</label>
                <input
                  id="identity"
                  type="text"
                  placeholder={details[role].placeholder}
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                />

                <div className="password-heading">
                  <label htmlFor="password">Password</label>
                  <button type="button" className="forgot-link">
                    Forgot password?
                  </button>
                </div>

                <div className="password-field">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                {error && (
                  <p className="login-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  className="submit-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : details[role].button}
                  <span>→</span>
                </button>
              </form>

              <div className="card-bottom">
                <span className="secure-dot" />
                Secure access to SRM AP transport services
              </div>
            </section>
          </>
        )}
      </section>

      <footer className="footer">
        <span>SRM UNIVERSITY AP · ANDHRA PRADESH</span>
        <span>VAHMITRA © 2026</span>
      </footer>
    </main>
  )
}

export default App
