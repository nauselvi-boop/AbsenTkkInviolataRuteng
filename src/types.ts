// src/types.ts
export type UserRole = 'ADMIN' | 'GURU' | 'PEGAWAI' | string;

export interface User {
  id: number | string;
  name: string;
  email: string;
  nip: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  position?: string;
  status?: string;
  profilePhoto?: string;
  isActive?: boolean;
  is_active?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface UserLogin extends User {
  password?: string;
}

export interface AttendanceDB {
  id: number;
  user_id: number;
  attendance_date: string;
  check_in_time: string;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_in_photo_path: string | null;
  check_in_ip_address: string | null;
  check_out_time: string | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  check_out_photo_path: string | null;
  check_out_ip_address: string | null;
  status: string;
  notes: string | null;
  location: string | null;
  verified_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLocationInfo {
  latitude: number;
  longitude: number;
  distanceMeters: number;
  accuracy?: number;
  isWithinGeofence?: boolean;
  addressName?: string;
  isMockDetected?: boolean;
  mockReason?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  nip: string;
  date: string;
  checkInTime: string;
  checkInLocation: AttendanceLocationInfo;
  checkInStatus: 'TEPAT_WAKTU' | 'TERLAMBAT' | 'TERLAMBAT_DIIZINKAN' | string;
  checkInPhoto?: string;
  checkOutTime?: string | null;
  checkOutLocation?: AttendanceLocationInfo | null;
  checkOutPhoto?: string | null;
  status: string;
  notes?: string;
  location?: string;
  workHoursMinutes?: number;
}

export interface GeofenceConfig {
  id?: number | string;
  schoolName: string;
  address?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  checkInStartTime: string;
  checkInDeadlineTime: string;
  checkOutStartTime?: string;
  checkOutDeadlineTime?: string;
  checkOutEndTime?: string;
  adminContactPhone?: string;
  adminContactName?: string;
  antiFakeGpsEnabled?: boolean;
  maxAllowedAccuracyMeters?: number;
}

export interface AttendanceUnlockRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userPosition?: string;
  type?: 'MASUK' | 'PULANG' | 'IZIN_SAKIT' | 'IZIN_KEPERLUAN' | 'CUTI' | string;
  attendanceType?: 'MASUK' | 'PULANG' | string;
  requestTime?: string;
  currentTime?: string;
  reason: string;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  adminNotes?: string;
  respondedAt?: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceMeters: number;
  isWithinGeofence: boolean;
  addressName?: string;
  isMockDetected?: boolean;
  mockReason?: string;
  timestamp?: number;
}

export interface ExcelImportUserRow {
  nip?: string;
  name?: string;
  email?: string;
  role?: string;
  position?: string;
  phone?: string;
  password?: string;
  status?: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  detail?: string;
  message?: string;
}