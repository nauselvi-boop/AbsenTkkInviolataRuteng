import { AttendanceRecord, AttendanceUnlockRequest, GeofenceConfig, User } from '../types';

export const DEFAULT_GEOFENCE: GeofenceConfig = {
  schoolName: 'TKK Inviolata Ruteng',
  address: 'Jl. Ahmad Yani No. 12, Kel. Watu, Kec. Langke Rembong, Kota Ruteng, Kab. Manggarai, NTT',
  latitude: -8.6135,
  longitude: 120.4635,
  radiusMeters: 80,
  checkInStartTime: '06:30',
  checkInDeadlineTime: '07:30',
  checkOutStartTime: '12:30',
  checkOutEndTime: '15:30',
  adminContactPhone: '0812-3888-9901',
  adminContactName: 'Sr. Maria Inviolata, S.Pd.',
  antiFakeGpsEnabled: true,
  maxAllowedAccuracyMeters: 50,
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    nip: '197805122002122001',
    name: 'Sr. Maria Inviolata, S.Pd.',
    email: 'kepala@tkkinviolata.sch.id',
    role: 'ADMIN',
    position: 'Kepala Sekolah & Penanggung Jawab',
    phone: '0812-3888-9901',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-05',
    status: 'AKTIF',
  },
  {
    id: 'usr-guru-1',
    nip: '198804152014022003',
    name: 'Ibu Yuliana Nardi, S.Pd.',
    email: 'yuliana.nardi@tkkinviolata.sch.id',
    role: 'GURU',
    position: 'Guru Kelompok A (TK-A)',
    phone: '0813-3922-3344',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-10',
    status: 'AKTIF',
  },
  {
    id: 'usr-guru-2',
    nip: '199209202019032005',
    name: 'Ibu Fransiska Murni, S.Pd. AUD',
    email: 'fransiska.murni@tkkinviolata.sch.id',
    role: 'GURU',
    position: 'Guru Kelompok B (TK-B)',
    phone: '0812-3944-5566',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-12',
    status: 'AKTIF',
  },
  {
    id: 'usr-guru-3',
    nip: '199511102021012002',
    name: 'Ibu Maria Goreti, S.Pd.',
    email: 'maria.goreti@tkkinviolata.sch.id',
    role: 'GURU',
    position: 'Guru Sentra Seni, Musik & Rohani',
    phone: '0852-3955-6677',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-15',
    status: 'AKTIF',
  },
  {
    id: 'usr-pegawai-1',
    nip: '199008222018011004',
    name: 'Bpk. Yohanes Berchmans, S.Kom.',
    email: 'yohanes.tu@tkkinviolata.sch.id',
    role: 'PEGAWAI',
    position: 'Staf Tata Usaha & Dapodik TK',
    phone: '0821-3988-7766',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-20',
    status: 'AKTIF',
  },
  {
    id: 'usr-pegawai-2',
    nip: '198512142010011002',
    name: 'Bpk. Fransiskus Deno',
    email: 'frans.sarpras@tkkinviolata.sch.id',
    role: 'PEGAWAI',
    position: 'Penjaga Sekolah & Sarpras',
    phone: '0813-3977-8899',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-22',
    status: 'AKTIF',
  },
];

// Today's date string YYYY-MM-DD
const getFormattedDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // HARI INI (Day 0)
  {
    id: 'att-001',
    userId: 'usr-guru-1',
    userName: 'Ibu Yuliana Nardi, S.Pd.',
    userRole: 'GURU',
    nip: '198804152014022003',
    date: getFormattedDate(0),
    checkInTime: '06:58:22',
    checkInPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    checkInLocation: {
      latitude: -8.61348,
      longitude: 120.46352,
      accuracy: 10,
      distanceMeters: 12,
      isWithinGeofence: true,
      addressName: 'TKK Inviolata Ruteng (Gerbang Utama)',
      isMockDetected: false,
    },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    notes: 'Hadir tepat waktu, siap menyambut anak didik Kelompok TK-A.',
  },
  {
    id: 'att-002',
    userId: 'usr-guru-2',
    userName: 'Ibu Fransiska Murni, S.Pd. AUD',
    userRole: 'GURU',
    nip: '199209202019032005',
    date: getFormattedDate(0),
    checkInTime: '07:05:40',
    checkInPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
    checkInLocation: {
      latitude: -8.61352,
      longitude: 120.46349,
      accuracy: 8,
      distanceMeters: 15,
      isWithinGeofence: true,
      addressName: 'TKK Inviolata Ruteng (Ruang Kelas TK-B)',
      isMockDetected: false,
    },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    notes: 'Presensi selfie verified, persiapan alat peraga sentra.',
  },
  {
    id: 'att-003',
    userId: 'usr-guru-3',
    userName: 'Ibu Maria Goreti, S.Pd.',
    userRole: 'GURU',
    nip: '199511102021012002',
    date: getFormattedDate(0),
    checkInTime: '07:12:15',
    checkInPhoto: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=300',
    checkInLocation: {
      latitude: -8.61345,
      longitude: 120.46355,
      accuracy: 9,
      distanceMeters: 18,
      isWithinGeofence: true,
      addressName: 'TKK Inviolata Ruteng (Ruang Musik & Doa)',
      isMockDetected: false,
    },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    notes: 'Hadir mendampingi kegiatan doa pagi dan lagu anak.',
  },
  {
    id: 'att-004',
    userId: 'usr-pegawai-1',
    userName: 'Bpk. Yohanes Berchmans, S.Kom.',
    userRole: 'PEGAWAI',
    nip: '199008222018011004',
    date: getFormattedDate(0),
    checkInTime: '06:45:00',
    checkInPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    checkInLocation: {
      latitude: -8.61350,
      longitude: 120.46348,
      accuracy: 7,
      distanceMeters: 8,
      isWithinGeofence: true,
      addressName: 'TKK Inviolata Ruteng (Kantor TU)',
      isMockDetected: false,
    },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    notes: 'Tugas administrasi dan rekap absensi harian.',
  },
  {
    id: 'att-005',
    userId: 'usr-pegawai-2',
    userName: 'Bpk. Fransiskus Deno',
    userRole: 'PEGAWAI',
    nip: '198512142010011002',
    date: getFormattedDate(0),
    checkInTime: '06:30:10',
    checkInPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    checkInLocation: {
      latitude: -8.61355,
      longitude: 120.46351,
      accuracy: 11,
      distanceMeters: 14,
      isWithinGeofence: true,
      addressName: 'TKK Inviolata Ruteng (Pos Jaga & Halaman)',
      isMockDetected: false,
    },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    notes: 'Membuka gerbang dan pengecekan sarana bermain anak.',
  },

  // HISTORICAL RECORDS (Day -1 to Day -6) with Check-In and Check-Out times
  // Day -1 (Kemarin)
  {
    id: 'att-hist-01',
    userId: 'usr-guru-1',
    userName: 'Ibu Yuliana Nardi, S.Pd.',
    userRole: 'GURU',
    nip: '198804152014022003',
    date: getFormattedDate(1),
    checkInTime: '07:04:12',
    checkInLocation: { latitude: -8.61348, longitude: 120.46352, accuracy: 8, distanceMeters: 10, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:38:15',
    checkOutLocation: { latitude: -8.61348, longitude: 120.46352, accuracy: 9, distanceMeters: 12, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    notes: 'KBM Sentra Balok berjalan lancar.',
  },
  {
    id: 'att-hist-02',
    userId: 'usr-guru-2',
    userName: 'Ibu Fransiska Murni, S.Pd. AUD',
    userRole: 'GURU',
    nip: '199209202019032005',
    date: getFormattedDate(1),
    checkInTime: '07:10:30',
    checkInLocation: { latitude: -8.61352, longitude: 120.46349, accuracy: 10, distanceMeters: 14, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:45:20',
    notes: 'Evaluasi mingguan anak didik.',
  },
  {
    id: 'att-hist-03',
    userId: 'usr-pegawai-1',
    userName: 'Bpk. Yohanes Berchmans, S.Kom.',
    userRole: 'PEGAWAI',
    nip: '199008222018011004',
    date: getFormattedDate(1),
    checkInTime: '06:48:15',
    checkInLocation: { latitude: -8.61350, longitude: 120.46348, accuracy: 7, distanceMeters: 9, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '13:02:40',
    notes: 'Sinkronisasi Dapodik Paud semester baru.',
  },

  // Day -2
  {
    id: 'att-hist-04',
    userId: 'usr-guru-1',
    userName: 'Ibu Yuliana Nardi, S.Pd.',
    userRole: 'GURU',
    nip: '198804152014022003',
    date: getFormattedDate(2),
    checkInTime: '06:52:05',
    checkInLocation: { latitude: -8.61348, longitude: 120.46352, accuracy: 9, distanceMeters: 11, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:42:10',
    notes: 'Piket pagi dan pendampingan snack anak.',
  },
  {
    id: 'att-hist-05',
    userId: 'usr-guru-2',
    userName: 'Ibu Fransiska Murni, S.Pd. AUD',
    userRole: 'GURU',
    nip: '199209202019032005',
    date: getFormattedDate(2),
    checkInTime: '06:59:18',
    checkInLocation: { latitude: -8.61352, longitude: 120.46349, accuracy: 8, distanceMeters: 12, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:36:50',
    notes: 'Sentra Seni Rohani.',
  },
  {
    id: 'att-hist-06',
    userId: 'usr-pegawai-1',
    userName: 'Bpk. Yohanes Berchmans, S.Kom.',
    userRole: 'PEGAWAI',
    nip: '199008222018011004',
    date: getFormattedDate(2),
    checkInTime: '06:40:22',
    checkInLocation: { latitude: -8.61350, longitude: 120.46348, accuracy: 7, distanceMeters: 8, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:55:15',
  },

  // Day -3
  {
    id: 'att-hist-07',
    userId: 'usr-guru-1',
    userName: 'Ibu Yuliana Nardi, S.Pd.',
    userRole: 'GURU',
    nip: '198804152014022003',
    date: getFormattedDate(3),
    checkInTime: '07:18:40',
    checkInLocation: { latitude: -8.61348, longitude: 120.46352, accuracy: 12, distanceMeters: 15, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:35:00',
    notes: 'Hujan rintik di jalan, hadir sebelum batas 07:30.',
  },
  {
    id: 'att-hist-08',
    userId: 'usr-guru-2',
    userName: 'Ibu Fransiska Murni, S.Pd. AUD',
    userRole: 'GURU',
    nip: '199209202019032005',
    date: getFormattedDate(3),
    checkInTime: '07:02:11',
    checkInLocation: { latitude: -8.61352, longitude: 120.46349, accuracy: 8, distanceMeters: 10, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:40:00',
  },
  {
    id: 'att-hist-09',
    userId: 'usr-pegawai-1',
    userName: 'Bpk. Yohanes Berchmans, S.Kom.',
    userRole: 'PEGAWAI',
    nip: '199008222018011004',
    date: getFormattedDate(3),
    checkInTime: '06:50:00',
    checkInLocation: { latitude: -8.61350, longitude: 120.46348, accuracy: 9, distanceMeters: 10, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:48:30',
  },

  // Day -4
  {
    id: 'att-hist-10',
    userId: 'usr-guru-1',
    userName: 'Ibu Yuliana Nardi, S.Pd.',
    userRole: 'GURU',
    nip: '198804152014022003',
    date: getFormattedDate(4),
    checkInTime: '07:01:25',
    checkInLocation: { latitude: -8.61348, longitude: 120.46352, accuracy: 8, distanceMeters: 10, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:45:10',
    notes: 'Kegiatan luar ruangan / outbond mini.',
  },
  {
    id: 'att-hist-11',
    userId: 'usr-guru-2',
    userName: 'Ibu Fransiska Murni, S.Pd. AUD',
    userRole: 'GURU',
    nip: '199209202019032005',
    date: getFormattedDate(4),
    checkInTime: '07:08:50',
    checkInLocation: { latitude: -8.61352, longitude: 120.46349, accuracy: 7, distanceMeters: 11, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:38:00',
  },

  // Day -5
  {
    id: 'att-hist-12',
    userId: 'usr-guru-1',
    userName: 'Ibu Yuliana Nardi, S.Pd.',
    userRole: 'GURU',
    nip: '198804152014022003',
    date: getFormattedDate(5),
    checkInTime: '06:55:10',
    checkInLocation: { latitude: -8.61348, longitude: 120.46352, accuracy: 8, distanceMeters: 12, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:35:40',
  },
  {
    id: 'att-hist-13',
    userId: 'usr-guru-2',
    userName: 'Ibu Fransiska Murni, S.Pd. AUD',
    userRole: 'GURU',
    nip: '199209202019032005',
    date: getFormattedDate(5),
    checkInTime: '06:58:30',
    checkInLocation: { latitude: -8.61352, longitude: 120.46349, accuracy: 9, distanceMeters: 13, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:42:15',
  },

  // Day -6
  {
    id: 'att-hist-14',
    userId: 'usr-guru-1',
    userName: 'Ibu Yuliana Nardi, S.Pd.',
    userRole: 'GURU',
    nip: '198804152014022003',
    date: getFormattedDate(6),
    checkInTime: '07:06:45',
    checkInLocation: { latitude: -8.61348, longitude: 120.46352, accuracy: 8, distanceMeters: 10, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '12:50:00',
    notes: 'Rapat koordinasi guru TK mingguan.',
  },
  {
    id: 'att-hist-15',
    userId: 'usr-pegawai-1',
    userName: 'Bpk. Yohanes Berchmans, S.Kom.',
    userRole: 'PEGAWAI',
    nip: '199008222018011004',
    date: getFormattedDate(6),
    checkInTime: '06:42:10',
    checkInLocation: { latitude: -8.61350, longitude: 120.46348, accuracy: 8, distanceMeters: 9, isWithinGeofence: true, addressName: 'TKK Inviolata' },
    checkInStatus: 'TEPAT_WAKTU',
    status: 'HADIR',
    checkOutTime: '13:10:00',
  },
];

const STORAGE_KEYS = {
  GEOFENCE_V2: 'absenku_inviolata_geofence_v2',
  USERS_V2: 'absenku_inviolata_users_v2',
  ATTENDANCE_V2: 'absenku_inviolata_attendance_v2',
  CURRENT_USER_ID: 'absenku_inviolata_active_user',
  UNLOCK_REQUESTS_V2: 'absenku_inviolata_unlock_requests_v2',
};

export const INITIAL_UNLOCK_REQUESTS: AttendanceUnlockRequest[] = [
  {
    id: 'req-001',
    userId: 'usr-guru-2',
    userName: 'Ibu Fransiska Murni, S.Pd. AUD',
    userRole: 'GURU',
    userPosition: 'Guru Kelompok B (TK-B)',
    type: 'MASUK',
    requestTime: '07:46:12 WITA',
    currentTime: '07:46',
    reason: 'Kendaraan motor mogok di jalan Ruteng-Cancar, mohon izin dispensasi buka presensi.',
    status: 'DISETUJUI',
    adminNotes: 'Diizinkan oleh Sr. Maria. Utamakan keselamatan di jalan.',
    createdAt: new Date().toISOString().split('T')[0],
  },
];

export function getStoredUnlockRequests(): AttendanceUnlockRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNLOCK_REQUESTS_V2);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading unlock requests from localStorage', e);
  }
  return INITIAL_UNLOCK_REQUESTS;
}

export function saveStoredUnlockRequests(requests: AttendanceUnlockRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.UNLOCK_REQUESTS_V2, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed saving unlock requests to localStorage', e);
  }
}

export function getStoredGeofence(): GeofenceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GEOFENCE_V2);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading geofence from localStorage', e);
  }
  return DEFAULT_GEOFENCE;
}

export function saveStoredGeofence(config: GeofenceConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GEOFENCE_V2, JSON.stringify(config));
  } catch (e) {
    console.error('Failed saving geofence to localStorage', e);
  }
}

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_V2);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading users from localStorage', e);
  }
  return INITIAL_USERS;
}

export function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS_V2, JSON.stringify(users));
  } catch (e) {
    console.error('Failed saving users to localStorage', e);
  }
}

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= INITIAL_ATTENDANCE.length) {
        return parsed;
      }
      // If parsed has fewer or older records, merge with INITIAL_ATTENDANCE
      const existingIds = new Set(parsed.map((r: AttendanceRecord) => r.id));
      const merged = [
        ...parsed,
        ...INITIAL_ATTENDANCE.filter((r) => !existingIds.has(r.id)),
      ];
      return merged;
    }
  } catch (e) {
    console.error('Failed reading attendance from localStorage', e);
  }
  return INITIAL_ATTENDANCE;
}

export function saveStoredAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_V2, JSON.stringify(records));
  } catch (e) {
    console.error('Failed saving attendance to localStorage', e);
  }
}

export function getStoredActiveUserId(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (raw) return raw;
  } catch (e) {
    // ignore
  }
  return INITIAL_USERS[0].id;
}

export function saveStoredActiveUserId(userId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  } catch (e) {
    // ignore
  }
}
