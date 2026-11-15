export type DriverTab =
  | 'home'
  | 'bus'
  | 'route'
  | 'students'
  | 'trips'
  | 'boarding'
  | 'gps'
  | 'fuel'
  | 'service'
  | 'reports'
  | 'notifications'
  | 'messages'
  | 'profile'

export interface DriverProfile {
  id: number
  name: string
  phone: string | null
  license_number: string | null
}

export interface DriverAllocation {
  id: number
  start_date: string
  end_date: string | null
  status: string
}

export interface DriverBus {
  id: number
  bus_number: string
  registration_number: string
  capacity: number
  is_active: boolean
}

export interface DriverRoute {
  id: number
  area: string
  route_code: string
  route_name: string
  start_point: string | null
  end_point: string | null
}

export interface DriverRouteStop {
  id: number
  name: string
  sequence_number: number
  latitude: number | null
  longitude: number | null
}

export interface DriverStudentItem {
  id: number
  registration_number: string
  full_name: string
  phone: string | null
}

export interface DriverAttendanceItem {
  id: number
  student_id: number
  student_name: string
  registration_number: string
  boarding_time: string
  verification_method: string
}

export interface DriverAttendanceData {
  total: number
  recent: DriverAttendanceItem[]
}

export interface DriverBusLocation {
  latitude: number
  longitude: number
  recorded_at: string
}

export interface DriverDashboardData {
  driver: DriverProfile
  allocation: DriverAllocation | null
  bus: DriverBus | null
  route: DriverRoute | null
  stops: DriverRouteStop[]
  students: {
    total: number
    list: DriverStudentItem[]
  }
  attendance: DriverAttendanceData
  location: DriverBusLocation | null
}

// ==============================
// New extended types
// ==============================

export interface DriverTrip {
  id: number
  allocation_id: number
  driver_id: number
  route_id: number
  bus_id: number
  started_at: string
  ended_at: string | null
  status: 'active' | 'completed' | 'cancelled'
  start_lat: number | null
  start_lng: number | null
  end_lat: number | null
  end_lng: number | null
  notes: string | null
  created_at: string
}

export interface DriverBoardingRecord {
  id: number
  student_name: string
  registration_number: string
  boarding_time: string
  verification_method: string
  trip_id: number | null
}

export interface DriverBoardingResponse {
  total: number
  page: number
  page_size: number
  records: DriverBoardingRecord[]
}

export interface DriverFuelRecord {
  id: number
  fuel_litres: number
  amount_paid: number
  odometer_km: number | null
  fuel_station: string | null
  notes: string | null
  recorded_at: string
  created_at: string
}

export interface DriverFuelResponse {
  total: number
  records: DriverFuelRecord[]
  summary: {
    total_fuel_litres: number
    total_amount_paid: number
    record_count: number
  }
}

export interface DriverServiceRecord {
  id: number
  service_date: string
  category: string
  description: string
  odometer_km: number | null
  service_centre: string | null
  cost: number | null
  next_service_date: string | null
  next_service_km: number | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface DriverVehicleReport {
  id: number
  ticket_number: string
  title: string
  category: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  management_response: string | null
  created_at: string
  updated_at: string
}

export interface DriverNotification {
  id: number
  title: string
  message: string
  category: string
  priority: string
  is_read: boolean
  created_at: string
}

export interface DriverProfileFull {
  id: number
  driver_name: string
  phone: string | null
  license_number: string
  experience_years: number | null
  address: string | null
  profile_photo_url: string | null
  allocation: {
    id: number
    start_date: string
    end_date: string | null
    status: string
  } | null
  bus: {
    id: number
    bus_number: string
    registration_number: string
    capacity: number
  } | null
  route: {
    id: number
    route_code: string
    route_name: string
    area: string
  } | null
}
