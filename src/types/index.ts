// Enums as union types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'VIEWER'

export type AppointmentStatus =
  | 'PENDING_APPROVAL'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED_BY_CLIENT'
  | 'CANCELLED_BY_ADMIN'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'WAITLISTED'

export type PaymentStatus = 'UNPAID' | 'DEPOSIT_PAID' | 'PAID' | 'REFUNDED'

export type MessageChannel = 'SMS' | 'WHATSAPP' | 'EMAIL'

export type WaitlistStatus = 'WAITING' | 'NOTIFIED' | 'BOOKED' | 'EXPIRED'

export type OtpChannel = 'SMS' | 'WHATSAPP'

// Booking flow state
export interface BookingState {
  serviceIds: string[]
  staffId?: string
  date?: string // ISO date string YYYY-MM-DD
  time?: string // HH:MM
  holdToken?: string
}

// Available slot returned by availability logic
export interface AvailableSlot {
  time: string // HH:MM
  staffId: string
  staffName: string
}

// Service with its category name included
export interface ServiceWithCategory {
  id: string
  name: string
  description?: string | null
  durationMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  price: number
  depositAmount?: number | null
  requiresDeposit: boolean
  requiresApproval: boolean
  imageUrl?: string | null
  isActive: boolean
  sortOrder: number
  categoryId: string
  categoryName: string
}

// Staff member with their offered services
export interface StaffWithServices {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  bio?: string | null
  imageUrl?: string | null
  color: string
  isActive: boolean
  maxAppointmentsPerDay?: number | null
  services: Array<{
    id: string
    name: string
    durationMinutes: number
    price: number
  }>
}

// Date availability for calendar
export interface DateAvailability {
  date: string // ISO date YYYY-MM-DD
  status: 'available' | 'full' | 'closed'
}

// Appointment summary for client view
export interface AppointmentSummary {
  id: string
  status: AppointmentStatus
  startDateTime: Date
  endDateTime: Date
  totalDurationMinutes: number
  totalPrice: number
  paymentStatus: PaymentStatus
  clientManageToken: string
  customerFullName: string
  customerPhone: string
  staffName: string
  services: Array<{
    serviceNameSnapshot: string
    priceSnapshot: number
    durationSnapshot: number
  }>
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
