import { GeofenceConfig } from '../types';

export type TimeWindowStatus = 
  | 'BEFORE_OPEN'      // Belum dibuka (misal sebelum 06:30 atau sebelum 12:30)
  | 'ON_TIME'          // Dalam rentang tepat waktu (06:30 - 07:30)
  | 'LATE_LOCKED'      // Melewati batas waktu (lewat 07:30 untuk masuk, atau lewat 15:30 untuk pulang) -> Wajib Hubungi Admin
  | 'CHECKOUT_OPEN'    // Dalam rentang waktu pulang (12:30 - 15:30)
  | 'AFTER_HOURS_LOCKED'; // Lewat batas akhir pulang

export interface TimeCheckResult {
  allowed: boolean;
  status: TimeWindowStatus;
  badgeColor: string;
  badgeLabel: string;
  title: string;
  message: string;
  mustContactAdmin: boolean;
  type: 'MASUK' | 'PULANG';
}

/**
 * Converts "HH:mm" to total minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Formats minutes from midnight to "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Checks attendance time window
 */
export function evaluateAttendanceTime(
  currentTimeStr: string, // "HH:mm"
  config: GeofenceConfig,
  type: 'MASUK' | 'PULANG'
): TimeCheckResult {
  const currentMin = timeToMinutes(currentTimeStr);

  if (type === 'MASUK') {
    const startMin = timeToMinutes(config.checkInStartTime || '06:30');
    const deadlineMin = timeToMinutes(config.checkInDeadlineTime || '07:30');

    if (currentMin < startMin) {
      return {
        allowed: false,
        status: 'BEFORE_OPEN',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        badgeLabel: 'Belum Dibuka',
        title: 'Presensi Masuk Belum Dibuka',
        message: `Presensi masuk TKK Inviolata baru dibuka pukul ${config.checkInStartTime} WITA. Harap menunggu waktu yang telah ditentukan.`,
        mustContactAdmin: false,
        type: 'MASUK',
      };
    }

    if (currentMin <= deadlineMin) {
      return {
        allowed: true,
        status: 'ON_TIME',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        badgeLabel: 'Tepat Waktu',
        title: 'Presensi Masuk Terbuka',
        message: `Waktu presensi tepat waktu berlaku hingga pukul ${config.checkInDeadlineTime} WITA. Silakan ambil foto selfie dan presensi.`,
        mustContactAdmin: false,
        type: 'MASUK',
      };
    }

    // currentMin > deadlineMin -> LATE_LOCKED
    const diffMinutes = currentMin - deadlineMin;
    return {
      allowed: false,
      status: 'LATE_LOCKED',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      badgeLabel: 'Terkunci (Lewat Batas)',
      title: 'Batas Waktu Presensi Masuk Telah Berakhir',
      message: `Anda terlambat ${diffMinutes} menit dari batas waktu jam ${config.checkInDeadlineTime} WITA. Sesuai ketentuan TKK Inviolata, Anda WAJIB menghubungi Admin Utama / Kepala TKK terlebih dahulu untuk verifikasi dan pembukaan kunci presensi.`,
      mustContactAdmin: true,
      type: 'MASUK',
    };
  } else {
    // PULANG
    const startMin = timeToMinutes(config.checkOutStartTime || '12:30');
    const endMin = timeToMinutes(config.checkOutEndTime || '15:30');

    if (currentMin < startMin) {
      return {
        allowed: false,
        status: 'BEFORE_OPEN',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        badgeLabel: 'Belum Jam Pulang',
        title: 'Belum Waktunya Presensi Pulang',
        message: `Presensi pulang baru dapat dilakukan mulai pukul ${config.checkOutStartTime} WITA. Jika ada keperluan mendesak untuk pulang lebih awal, silakan hubungi Admin terlebih dahulu.`,
        mustContactAdmin: true,
        type: 'PULANG',
      };
    }

    if (currentMin <= endMin) {
      return {
        allowed: true,
        status: 'CHECKOUT_OPEN',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        badgeLabel: 'Waktu Pulang',
        title: 'Presensi Pulang Terbuka',
        message: `Presensi kepulangan sekolah aktif hingga pukul ${config.checkOutEndTime} WITA. Silakan konfirmasi presensi pulang.`,
        mustContactAdmin: false,
        type: 'PULANG',
      };
    }

    // currentMin > endMin -> AFTER_HOURS_LOCKED
    const diffMinutes = currentMin - endMin;
    return {
      allowed: false,
      status: 'AFTER_HOURS_LOCKED',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      badgeLabel: 'Lewat Jam Pulang',
      title: 'Batas Waktu Presensi Pulang Terlewati',
      message: `Waktu kepulangan telah melewati batas akhir pukul ${config.checkOutEndTime} WITA (${diffMinutes} menit lalu). Harap menghubungi Admin Utama untuk verifikasi laporan kepulangan.`,
      mustContactAdmin: true,
      type: 'PULANG',
    };
  }
}
