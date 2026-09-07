// src/types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  nip: string;
  role: 'ADMIN' | 'GURU' | 'PEGAWAI';
  avatarUrl?: string;
  phone?: string;
  profilePhoto?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
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

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  nip: string;
  date: string;
  checkInTime: string;
  checkInLocation: {
    latitude: number;
    longitude: number;
    distanceMeters: number;
  };
  checkInStatus: 'TEPAT_WAKTU' | 'TERLAMBAT';
  checkInPhoto: string;
  status: string;
  notes: string;
  location: string;
}

export interface GeofenceConfig {
  schoolName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  checkInStartTime: string;
  checkInDeadlineTime: string;
  checkOutStartTime?: string;
  checkOutDeadlineTime?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  detail?: string;
  message?: string;
}