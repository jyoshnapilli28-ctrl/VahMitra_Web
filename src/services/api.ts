import type {
  DashboardSummary,
  RouteOverviewResponse,
  StudentsResponse,
  StudentCreatePayload,
  DriversResponse,
  DriverCreatePayload,
  BusesResponse,
  BusCreatePayload,
  RoutesResponse,
  RouteCreatePayload,
  AllocationsResponse,
  AllocationCreatePayload,
} from '../types/management'

import type {
  StudentDashboardData,
  AnnouncementItem,
  NotificationsResponse,
  ComplaintItem,
  ComplaintCreatePayload,
  BusMembersResponse,
  DiscussionMessageItem,
  QrScanResult,
  MessagesResponse,
  DirectMessageItem,
  AttendanceHistoryResponse,
  AttendanceSummaryResponse,
} from '../types/student'

import type {
  DriverDashboardData,
  DriverTrip,
  DriverBoardingResponse,
  DriverFuelResponse,
  DriverServiceRecord,
  DriverVehicleReport,
  DriverNotification,
  DriverProfileFull,
  DriverBusLocation,
} from '../types/driver'

const API_BASE = '/api'

function getAuthHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('vahmitra_token')
  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(isFormData),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body.detail) detail = body.detail
    } catch {
      // keep default message
    }
    throw new ApiError(response.status, detail)
  }

  return response.json()
}

// ==============================
// Dashboard (Management)
// ==============================

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return request('/management/dashboard/summary')
}

export function fetchDashboardRoutes(): Promise<RouteOverviewResponse> {
  return request('/management/dashboard/routes')
}

// ==============================
// Students (Management)
// ==============================

export function fetchStudents(
  search?: string,
  skip = 0,
  limit = 50
): Promise<StudentsResponse> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('skip', String(skip))
  params.set('limit', String(limit))
  return request(`/management/students/?${params}`)
}

export function createStudent(
  data: StudentCreatePayload
): Promise<{ message: string }> {
  return request('/management/students/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ==============================
// Drivers (Management)
// ==============================

export function fetchDrivers(
  search?: string,
  skip = 0,
  limit = 50
): Promise<DriversResponse> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('skip', String(skip))
  params.set('limit', String(limit))
  return request(`/management/drivers/?${params}`)
}

export function createDriver(
  data: DriverCreatePayload
): Promise<{ message: string }> {
  return request('/management/drivers/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ==============================
// Buses (Management)
// ==============================

export function fetchBuses(): Promise<BusesResponse> {
  return request('/management/buses/')
}

export function createBus(
  data: BusCreatePayload
): Promise<{ message: string }> {
  return request('/management/buses/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateBusStatus(
  busId: number,
  isActive: boolean
): Promise<{ message: string }> {
  return request(`/management/buses/${busId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  })
}

// ==============================
// Routes (Management)
// ==============================

export function fetchRoutes(): Promise<RoutesResponse> {
  return request('/management/routes/')
}

export function createRoute(
  data: RouteCreatePayload
): Promise<{ message: string }> {
  return request('/management/routes/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ==============================
// Allocations (Management)
// ==============================

export function fetchAllocations(): Promise<AllocationsResponse> {
  return request('/management/allocations/')
}

export function createAllocation(
  data: AllocationCreatePayload
): Promise<{ message: string }> {
  return request('/management/allocations/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ==============================
// Student Portal API Services
// ==============================

export function fetchStudentDashboard(): Promise<StudentDashboardData> {
  return request('/student/dashboard')
}

export function fetchStudentAnnouncements(): Promise<AnnouncementItem[]> {
  return request('/student/announcements')
}

export function fetchStudentNotifications(filter?: string): Promise<NotificationsResponse> {
  const params = filter ? `?filter=${encodeURIComponent(filter)}` : ''
  return request(`/student/notifications${params}`)
}

export function markNotificationRead(id: number): Promise<{ message: string }> {
  return request(`/student/notifications/${id}/read`, {
    method: 'PATCH',
  })
}

export function markAllNotificationsRead(): Promise<{ message: string }> {
  return request('/student/notifications/read-all', {
    method: 'PATCH',
  })
}

export function fetchStudentComplaints(): Promise<ComplaintItem[]> {
  return request('/student/complaints')
}

export function createStudentComplaint(payload: ComplaintCreatePayload): Promise<{ message: string; ticket_number: string; complaint_id: number; status: string; created_at?: string }> {
  return request('/student/complaints', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createStudentComplaintFormData(formData: FormData): Promise<{ message: string; ticket_number: string; complaint_id: number; status: string; created_at?: string }> {
  return request('/student/complaints', {
    method: 'POST',
    body: formData,
  })
}

export function fetchStudentComplaintDetail(ticketNumber: string): Promise<ComplaintItem> {
  return request(`/student/complaints/${encodeURIComponent(ticketNumber)}`)
}

// Direct Messages
export function fetchStudentMessages(): Promise<MessagesResponse> {
  return request('/student/messages')
}

export function fetchStudentMessageDetail(id: number): Promise<DirectMessageItem> {
  return request(`/student/messages/${id}`)
}

export function markStudentMessageRead(id: number): Promise<{ message: string; message_id: number }> {
  return request(`/student/messages/${id}/read`, {
    method: 'PATCH',
  })
}

export function markAllStudentMessagesRead(): Promise<{ message: string }> {
  return request('/student/messages/read-all', {
    method: 'PATCH',
  })
}

export function deleteStudentMessage(id: number): Promise<{ message: string }> {
  return request(`/student/messages/${id}`, {
    method: 'DELETE',
  })
}

// Attendance History
export function fetchStudentAttendance(params?: {
  month?: number
  year?: number
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}): Promise<AttendanceHistoryResponse> {
  const query = new URLSearchParams()
  if (params?.month) query.set('month', String(params.month))
  if (params?.year) query.set('year', String(params.year))
  if (params?.start_date) query.set('start_date', params.start_date)
  if (params?.end_date) query.set('end_date', params.end_date)
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))

  const qs = query.toString()
  return request(`/student/attendance${qs ? `?${qs}` : ''}`)
}

export function fetchStudentAttendanceSummary(): Promise<AttendanceSummaryResponse> {
  return request('/student/attendance/summary')
}

export function fetchBusMembers(): Promise<BusMembersResponse> {
  return request('/student/bus-members')
}

export function fetchDiscussionMessages(): Promise<DiscussionMessageItem[]> {
  return request('/student/discussion')
}

export function sendDiscussionMessage(content: string): Promise<DiscussionMessageItem> {
  return request('/student/discussion', {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export function deleteDiscussionMessage(id: number): Promise<{ message: string }> {
  return request(`/student/discussion/${id}`, {
    method: 'DELETE',
  })
}

export function reportDiscussionMessage(id: number): Promise<{ message: string }> {
  return request(`/student/discussion/${id}/report`, {
    method: 'POST',
  })
}

export function updateStudentProfile(data: { nickname?: string; phone?: string }): Promise<{ message: string; nickname?: string; phone?: string }> {
  return request('/student/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function updateStudentPhoto(photo_data: string): Promise<{ message: string; profile_photo_url: string }> {
  return request('/student/profile/photo', {
    method: 'POST',
    body: JSON.stringify({ photo_data }),
  })
}

export function removeStudentPhoto(): Promise<{ message: string }> {
  return request('/student/profile/photo', {
    method: 'DELETE',
  })
}

export function scanDemoQr(qr_payload: string): Promise<QrScanResult> {
  return request('/student/attendance/scan-demo', {
    method: 'POST',
    body: JSON.stringify({ qr_payload }),
  })
}

export function scanLiveAttendance(qr_payload: string): Promise<QrScanResult> {
  return request('/student/attendance/scan-live', {
    method: 'POST',
    body: JSON.stringify({ qr_payload }),
  })
}

// ==============================
// Driver Portal API Services
// ==============================

export function fetchDriverDashboard(): Promise<DriverDashboardData> {
  return request('/driver/dashboard')
}

// Alias for components that need a generic request function
export const apiRequest = request

// Extended Driver API Functions
export const fetchDriverTrips = (
  pageOrSkip: number = 1,
  pageSizeOrLimit: number = 20
): Promise<{ total?: number; page?: number; page_size?: number; trips?: DriverTrip[]; records?: DriverTrip[] }> => {
  return request(`/driver/trips?page=${pageOrSkip}&page_size=${pageSizeOrLimit}&skip=${pageOrSkip}&limit=${pageSizeOrLimit}`)
}

export const fetchDriverCurrentTrip = (): Promise<DriverTrip | null> =>
  request('/driver/trips/current')

export const startDriverTrip = (data?: { lat?: number; lng?: number; notes?: string }): Promise<DriverTrip> =>
  request('/driver/trips/start', { method: 'POST', body: data ? JSON.stringify(data) : undefined })

export const stopDriverTrip = (
  tripId: number,
  data?: { lat?: number; lng?: number; notes?: string }
): Promise<DriverTrip> =>
  request(`/driver/trips/${tripId}/stop`, { method: 'POST', body: data ? JSON.stringify(data) : undefined })

export const fetchDriverBoardingRecords = (params?: {
  page?: number
  page_size?: number
  trip_id?: number
  date?: string
  skip?: number
  limit?: number
}): Promise<DriverBoardingResponse> => {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.page_size) q.set('page_size', String(params.page_size))
  if (params?.skip !== undefined) q.set('skip', String(params.skip))
  if (params?.limit !== undefined) q.set('limit', String(params.limit))
  if (params?.trip_id) q.set('trip_id', String(params.trip_id))
  if (params?.date) q.set('date', params.date)
  const qs = q.toString()
  return request(`/driver/boarding-records${qs ? `?${qs}` : ''}`)
}

export const updateDriverLocation = (
  latOrData: number | { latitude: number; longitude: number },
  lng?: number
): Promise<{ message: string; location?: DriverBusLocation }> => {
  const body = typeof latOrData === 'number'
    ? { latitude: latOrData, longitude: lng }
    : latOrData
  return request('/driver/location', { method: 'POST', body: JSON.stringify(body) })
}

export const fetchDriverLocation = (): Promise<DriverBusLocation | null> => request('/driver/location')

export const fetchDriverProfile = (): Promise<DriverProfileFull> => request('/driver/profile')

export const updateDriverProfile = (data: {
  phone?: string
  address?: string
  experience_years?: number
}): Promise<{ message: string; profile?: DriverProfileFull }> =>
  request('/driver/profile', { method: 'PATCH', body: JSON.stringify(data) })

export const fetchDriverFuelRecords = (
  pageOrSkip = 1,
  pageSizeOrLimit = 20
): Promise<DriverFuelResponse> =>
  request(`/driver/fuel-records?page=${pageOrSkip}&page_size=${pageSizeOrLimit}&skip=${pageOrSkip}&limit=${pageSizeOrLimit}`)

export const addDriverFuelRecord = (data: Record<string, unknown>): Promise<{ message: string }> =>
  request('/driver/fuel-records', { method: 'POST', body: JSON.stringify(data) })

export const fetchDriverServiceRecords = (
  pageOrSkip = 1,
  pageSizeOrLimit = 20
): Promise<{ total: number; records: DriverServiceRecord[] }> =>
  request(`/driver/service-records?page=${pageOrSkip}&page_size=${pageSizeOrLimit}&skip=${pageOrSkip}&limit=${pageSizeOrLimit}`)

export const addDriverServiceRecord = (data: Record<string, unknown>): Promise<{ message: string }> =>
  request('/driver/service-records', { method: 'POST', body: JSON.stringify(data) })

export const fetchDriverVehicleReports = (
  pageOrSkip = 1,
  pageSizeOrLimit = 20
): Promise<{ total: number; reports: DriverVehicleReport[] }> =>
  request(`/driver/vehicle-reports?page=${pageOrSkip}&page_size=${pageSizeOrLimit}&skip=${pageOrSkip}&limit=${pageSizeOrLimit}`)

export const addDriverVehicleReport = (data: Record<string, unknown>): Promise<{ message: string; ticket_number?: string }> =>
  request('/driver/vehicle-reports', { method: 'POST', body: JSON.stringify(data) })

export const fetchDriverNotifications = (
  paramsOrSkip?: number | { unread_only?: boolean; page?: number; page_size?: number; skip?: number; limit?: number },
  limitParam: number = 20
): Promise<{ total_unread?: number; total?: number; page?: number; page_size?: number; notifications?: DriverNotification[] }> => {
  const q = new URLSearchParams()
  if (typeof paramsOrSkip === 'number') {
    q.set('skip', String(paramsOrSkip))
    q.set('limit', String(limitParam))
  } else if (paramsOrSkip) {
    if (paramsOrSkip.unread_only) q.set('unread_only', 'true')
    if (paramsOrSkip.page) q.set('page', String(paramsOrSkip.page))
    if (paramsOrSkip.page_size) q.set('page_size', String(paramsOrSkip.page_size))
    if (paramsOrSkip.skip !== undefined) q.set('skip', String(paramsOrSkip.skip))
    if (paramsOrSkip.limit !== undefined) q.set('limit', String(paramsOrSkip.limit))
  }
  return request(`/driver/notifications?${q.toString()}`)
}

export const markDriverNotificationRead = (id: number): Promise<{ message: string }> =>
  request(`/driver/notifications/${id}/read`, { method: 'PATCH' })

export const markAllDriverNotificationsRead = (): Promise<{ message: string }> =>
  request('/driver/notifications/read-all', { method: 'POST' })

