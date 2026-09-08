import * as XLSX from 'xlsx';
import { AttendanceRecord, ExcelImportUserRow, User } from '../types';

/**
 * Export attendance records to Excel (.xlsx) file
 */
export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  fileName = 'Laporan_Absensi_TK.xlsx'
) {
  const rows = records.map((rec, index) => {
    return {
      'No': index + 1,
      'Tanggal': rec.date,
      'NIP': rec.nip,
      'Nama Pengguna': rec.userName,
      'Role': rec.userRole,
      'Jam Datang': rec.checkInTime || '-',
      'Status Datang': rec.checkInStatus === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat',
      'Jarak Saat Datang': `${rec.checkInLocation.distanceMeters} meter`,
      'Validasi GPS Datang': rec.checkInLocation.isWithinGeofence ? 'Lolos Geofence' : 'Di Luar Area',
      'Jam Pulang': rec.checkOutTime || '-',
      'Jarak Saat Pulang': rec.checkOutLocation ? `${rec.checkOutLocation.distanceMeters} meter` : '-',
      'Total Durasi Kerja': rec.workHoursMinutes
        ? `${Math.floor(rec.workHoursMinutes / 60)}j ${rec.workHoursMinutes % 60}m`
        : '-',
      'Status Kehadiran': rec.status,
      'Bukti Selfie Datang': rec.checkInPhoto ? 'Tervalidasi (Live Camera)' : 'Tidak Ada',
      'Bukti Selfie Pulang': rec.checkOutPhoto ? 'Tervalidasi (Live Camera)' : 'Belum Pulang',
      'Catatan': rec.notes || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // Tanggal
    { wch: 15 }, // NIP
    { wch: 25 }, // Nama Pengguna
    { wch: 12 }, // Role
    { wch: 12 }, // Jam Datang
    { wch: 15 }, // Status Datang
    { wch: 18 }, // Jarak Saat Datang
    { wch: 20 }, // Validasi GPS
    { wch: 12 }, // Jam Pulang
    { wch: 18 }, // Jarak Saat Pulang
    { wch: 18 }, // Total Durasi Kerja
    { wch: 16 }, // Status Kehadiran
    { wch: 25 }, // Bukti Selfie Datang
    { wch: 25 }, // Bukti Selfie Pulang
    { wch: 20 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Absensi TK');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export daily attendance records (Hari Ini / Per Tanggal)
 */
export function exportAttendanceDaily(
  records: AttendanceRecord[],
  targetDate?: string,
  fileName?: string
) {
  const dateToUse = targetDate || new Date().toISOString().split('T')[0];
  const filtered = records.filter((r) => r.date === dateToUse);
  const file = fileName || `Rekap_Presensi_Harian_${dateToUse}.xlsx`;
  exportAttendanceToExcel(filtered.length > 0 ? filtered : records, file);
}

/**
 * Export weekly attendance records (7 Hari Terakhir / Minggu Berjalan)
 */
export function exportAttendanceWeekly(
  records: AttendanceRecord[],
  fileName?: string
) {
  const today = new Date();
  const filtered = records.filter((r) => {
    const recDate = new Date(r.date);
    const diffTime = Math.abs(today.getTime() - recDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });
  const todayStr = today.toISOString().split('T')[0];
  const file = fileName || `Rekap_Presensi_Mingguan_${todayStr}.xlsx`;
  exportAttendanceToExcel(filtered.length > 0 ? filtered : records, file);
}

/**
 * Export monthly attendance records (Bulan Berjalan / Per Bulan)
 */
export function exportAttendanceMonthly(
  records: AttendanceRecord[],
  yearMonth?: string,
  fileName?: string
) {
  const ym = yearMonth || new Date().toISOString().substring(0, 7);
  const filtered = records.filter((r) => r.date.startsWith(ym));
  const file = fileName || `Rekap_Presensi_Bulanan_${ym}.xlsx`;
  exportAttendanceToExcel(filtered.length > 0 ? filtered : records, file);
}

/**
 * Export user master list to Excel (.xlsx) file
 */
export function exportUsersToExcel(users: User[], fileName = 'Data_Guru_Pegawai_TK.xlsx') {
  const rows = users.map((u, index) => ({
    'No': index + 1,
    'NIP': u.nip,
    'Nama Lengkap': u.name,
    'Email': u.email,
    'Peran / Role': u.role,
    'Jabatan': u.position,
    'Nomor Telepon': u.phone,
    'Status Akun': u.status,
    'Tanggal Didaftarkan': u.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Guru & Pegawai');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Generate and download blank/sample template Excel for mass user import
 */
export function downloadUserImportTemplate() {
  const templateRows: ExcelImportUserRow[] = [
    {
      nip: '198904122020012001',
      name: 'Siti Rahmawati, S.Pd.',
      email: 'siti.rahma@tkpertiwi.sch.id',
      role: 'GURU',
      position: 'Guru Sentra Bermain',
      phone: '081234567890',
    },
    {
      nip: '199208152021021002',
      name: 'Ahmad Fauzi, A.Md.',
      email: 'fauzi.tu@tkpertiwi.sch.id',
      role: 'PEGAWAI',
      position: 'Tata Usaha & Administrasi',
      phone: '082198765432',
    },
    {
      nip: '199501052022032003',
      name: 'Dewi Lestari, S.Pd.',
      email: 'dewi.lestari@tkpertiwi.sch.id',
      role: 'GURU',
      position: 'Guru Sentra Balok',
      phone: '085612345678',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet([
    {
      'NIP': templateRows[0].nip,
      'Nama Lengkap': templateRows[0].name,
      'Email': templateRows[0].email,
      'Role (GURU/PEGAWAI)': templateRows[0].role,
      'Jabatan': templateRows[0].position,
      'Nomor HP': templateRows[0].phone,
    },
    {
      'NIP': templateRows[1].nip,
      'Nama Lengkap': templateRows[1].name,
      'Email': templateRows[1].email,
      'Role (GURU/PEGAWAI)': templateRows[1].role,
      'Jabatan': templateRows[1].position,
      'Nomor HP': templateRows[1].phone,
    },
    {
      'NIP': templateRows[2].nip,
      'Nama Lengkap': templateRows[2].name,
      'Email': templateRows[2].email,
      'Role (GURU/PEGAWAI)': templateRows[2].role,
      'Jabatan': templateRows[2].position,
      'Nomor HP': templateRows[2].phone,
    },
  ]);

  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 30 },
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Pengguna');
  XLSX.writeFile(workbook, 'Template_Import_Guru_Pegawai_TK.xlsx');
}

/**
 * Parse uploaded Excel file into user rows
 */
export async function parseExcelUsersFile(file: File): Promise<ExcelImportUserRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to raw JSON rows
        const rawJson: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const mapped: ExcelImportUserRow[] = rawJson.map((row) => {
          // Flexible key matching in case user altered the column names slightly
          const nip = String(row['NIP'] || row['nip'] || row['Nomor Induk'] || '').trim();
          const name = String(row['Nama Lengkap'] || row['Nama'] || row['name'] || '').trim();
          const email = String(row['Email'] || row['email'] || '').trim();
          let role = String(row['Role (GURU/PEGAWAI)'] || row['Role'] || row['role'] || 'GURU').toUpperCase().trim();
          if (role !== 'GURU' && role !== 'PEGAWAI') {
            role = 'GURU';
          }
          const position = String(row['Jabatan'] || row['position'] || 'Guru TK').trim();
          const phone = String(row['Nomor HP'] || row['Telepon'] || row['phone'] || '').trim();

          return { nip, name, email, role, position, phone };
        });

        // Filter out empty rows
        const validRows = mapped.filter((r) => r.name && r.nip);
        resolve(validRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
