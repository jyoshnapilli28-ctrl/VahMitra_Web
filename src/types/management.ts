// ==============================
// Dashboard Summary
// ==============================

export interface DashboardSummary {
  students: {
    total: number
    accounts_created: number
    pending_registration: number
  }
  drivers: {
    total: number
    accounts_created: number
    pending_registration: number
  }
  buses: {
    total: number
    active: number
  }
  routes: {
    total: number
    active: number
  }
  allocations: {
    active: number
  }
}

// ==============================
// Route Overview (dashboard)
// ==============================

export interface RouteOverviewBus {
  allocation_id: number
  bus_id: number
  bus_number: string
  driver_id: number
  driver_name: string
}

export interface RouteOverviewItem {
  route_id: number
  area: string
  route_code: string
  route_name: string
  is_active: boolean
  active_student_count: number
  active_bus_count: number
  buses: RouteOverviewBus[]
}

export interface RouteOverviewResponse {
  total_routes: number
  routes: RouteOverviewItem[]
}

// ==============================
// Students
// ==============================

export interface StudentRouteAssignment {
  assignment_id: number
  status: string
  start_date: string
  end_date: string | null
  route: {
    id: number
    area: string
    route_code: string
    route_name: string
  } | null
}

export interface StudentItem {
  id: number
  user_id: number | null
  registration_number: string
  full_name: string
  email: string | null
  phone: string | null
  account_created: boolean
  account_active: boolean
  route_assignments: StudentRouteAssignment[]
}

export interface StudentsResponse {
  total: number
  skip: number
  limit: number
  students: StudentItem[]
}

export interface StudentCreatePayload {
  username: string
  password: string
  registration_number: string
  full_name: string
  email?: string | null
  phone?: string | null
}

// ==============================
// Drivers
// ==============================

export interface DriverAllocation {
  allocation_id: number
  status: string
  start_date: string
  end_date: string | null
  bus: {
    id: number
    bus_number: string
    registration_number: string
  } | null
  route: {
    id: number
    area: string
    route_code: string
    route_name: string
  } | null
}

export interface DriverItem {
  id: number
  user_id: number | null
  driver_name: string
  phone: string | null
  license_number: string | null
  account_created: boolean
  account_active: boolean
  allocations: DriverAllocation[]
}

export interface DriversResponse {
  total: number
  skip: number
  limit: number
  drivers: DriverItem[]
}

export interface DriverCreatePayload {
  username: string
  password: string
  driver_name: string
  phone?: string | null
  license_number?: string | null
}

// ==============================
// Buses
// ==============================

export interface BusItem {
  id: number
  bus_number: string
  registration_number: string
  capacity: number
  is_active: boolean
}

export interface BusesResponse {
  total: number
  buses: BusItem[]
}

export interface BusCreatePayload {
  bus_number: string
  registration_number: string
  capacity: number
}

// ==============================
// Routes
// ==============================

export interface RouteItem {
  id: number
  area: string
  route_code: string
  route_name: string
  start_point: string | null
  end_point: string | null
  is_active: boolean
}

export interface RoutesResponse {
  total: number
  routes: RouteItem[]
}

export interface RouteCreatePayload {
  area: string
  route_code: string
  route_name: string
  start_point?: string | null
  end_point?: string | null
}

// ==============================
// Allocations
// ==============================

export interface AllocationItem {
  id: number
  bus_id: number
  driver_id: number
  route_id: number
  start_date: string
  end_date: string | null
  status: string
}

export interface AllocationsResponse {
  total: number
  allocations: AllocationItem[]
}

export interface AllocationCreatePayload {
  bus_id: number
  driver_id: number
  route_id: number
  start_date: string
  end_date?: string | null
}

