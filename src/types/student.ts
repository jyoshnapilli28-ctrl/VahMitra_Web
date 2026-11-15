export interface StudentProfile {
  id: number
  registration_number: string
  full_name: string
  nickname: string | null
  email: string | null
  phone: string | null
  profile_photo_url: string | null
  department: string | null
  academic_year: string | null
}

export interface StudentAssignment {
  id: number
  start_date: string
  end_date: string | null
}

export interface StudentRoute {
  id: number
  area: string
  route_code: string
  route_name: string
  start_point: string | null
  end_point: string | null
}

export interface StudentRouteStop {
  id: number
  name: string
  sequence_number: number
  latitude: number | null
  longitude: number | null
}

export interface StudentBus {
  id: number
  bus_number: string
  registration_number: string
  capacity: number
}

export interface StudentDriver {
  id: number
  name: string
  phone: string | null
}

export interface BusLocation {
  latitude: number
  longitude: number
  recorded_at: string
}

export interface StudentAttendanceRecord {
  id: number
  boarding_time: string | null
  verification_method: string
  allocation_id: number
}

export interface StudentAttendanceSummary {
  total: number
  recent: StudentAttendanceRecord[]
}

export interface AnnouncementItem {
  id: number
  title: string
  description: string
  category: 'route_change' | 'delay' | 'breakdown' | 'holiday' | 'schedule' | 'emergency' | 'general' | string
  priority: 'normal' | 'important' | 'emergency' | string
  is_pinned: boolean
  published_by: string
  created_at: string
}

export interface NotificationItem {
  id: number
  title: string
  message: string
  category: string
  priority: 'normal' | 'important' | 'emergency' | string
  is_read: boolean
  created_at: string
}

export interface NotificationsResponse {
  unread_count: number
  items: NotificationItem[]
}

export interface ComplaintStatusLogItem {
  id: number
  old_status: string | null
  new_status: string
  notes: string | null
  updated_by_role: string
  created_at: string
}

export interface ComplaintItem {
  id: number
  ticket_number: string
  title: string
  category: string
  description: string
  has_evidence: boolean
  evidence_url: string | null
  image_url?: string | null
  status: 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected' | string
  management_response: string | null
  created_at: string
  updated_at: string
  status_history?: ComplaintStatusLogItem[]
}

export interface ComplaintCreatePayload {
  title: string
  category: string
  description: string
  image_url?: string | null
}

export interface DirectMessageItem {
  id: number
  sender_id: number | null
  sender_name: string
  sender_role: 'management' | 'driver' | string
  title: string
  content: string
  preview: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface MessagesResponse {
  unread_count: number
  messages: DirectMessageItem[]
}

export interface AttendanceRecordItem {
  id: number
  boarding_time: string
  date: string
  time: string
  month_label: string
  bus_number: string
  bus_registration: string
  route_code: string
  route_name: string
  driver_name: string
  verification_method_raw: string
  verification_method: string
  status: string
}

export interface AttendanceHistoryResponse {
  total: number
  page: number
  limit: number
  total_pages: number
  records: AttendanceRecordItem[]
}

export interface AttendanceMonthlySummary {
  month_key: string
  month_label: string
  boardings: number
  distinct_days: number
}

export interface AttendanceSummaryResponse {
  has_records: boolean
  total_boardings: number
  distinct_attendance_days: number
  most_recent_boarding: {
    iso: string | null
    formatted_date: string | null
    formatted_time: string | null
    bus_number: string | null
    route_code: string | null
  } | null
  monthly_history: AttendanceMonthlySummary[]
}

export interface BusMemberItem {
  id: number
  registration_number: string
  full_name: string
  nickname: string | null
  profile_photo_url: string | null
  department: string | null
  is_current_user: boolean
}

export interface BusMembersResponse {
  has_route: boolean
  route_code: string | null
  route_name: string | null
  total_members: number
  members: BusMemberItem[]
}

export interface DiscussionMessageItem {
  id: number
  sender_name: string
  official_name: string
  registration_number: string
  sender_avatar: string | null
  content: string
  is_own: boolean
  created_at: string
}

export interface QrScanResult {
  valid: boolean
  type?: 'demo' | 'live' | 'invalid'
  title?: string
  subtitle?: string
  notice?: string
  detail?: string
  scanned_at?: string
  message?: string
}

export interface StudentDashboardData {
  student: StudentProfile
  assignment: StudentAssignment | null
  route: StudentRoute | null
  stops: StudentRouteStop[]
  bus: StudentBus | null
  driver: StudentDriver | null
  location: BusLocation | null
  attendance: StudentAttendanceSummary & {
    distinct_days?: number
  }
  announcements: AnnouncementItem[]
  unread_notifications_count: number
  notifications_preview: NotificationItem[]
  unread_messages_count?: number
  open_complaints_count?: number
  latest_message_preview?: {
    id: number
    sender_name: string
    sender_role: string
    title: string
    snippet: string
    created_at: string
  } | null
  latest_complaint_preview?: {
    id: number
    ticket_number: string
    title: string
    status: string
    created_at: string
  } | null
}
