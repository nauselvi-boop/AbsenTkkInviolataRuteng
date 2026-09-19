import React, { useState, useEffect } from 'react';
import { AttendanceRecord, UserRole } from '../types';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  X,
  Edit,
  Save,
  RefreshCw,
} from 'lucide-react';
import { exportAttendanceToExcel } from '../utils/excelUtils';

interface AttendanceReportsProps {
  records: AttendanceRecord[];
  isPersonalView?: boolean;
  currentUserRole?: UserRole;
  currentUserName?: string;
  initialDatePreset?: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
}

export const AttendanceReports: React.FC<AttendanceReportsProps> = ({
  records,
  isPersonalView = false,
  currentUserRole,
  currentUserName,
  initialDatePreset = 'ALL',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'GURU' | 'PEGAWAI'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HADIR' | 'TERLAMBAT'>('ALL');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>(initialDatePreset);

  useEffect(() => {
    if (initialDatePreset) {
      setDatePreset(initialDatePreset);
    }
  }, [initialDatePreset]);

  // State Modal Foto
  const [selectedRecordForPhoto, setSelectedRecordForPhoto] = useState<{
    record: AttendanceRecord;
    type: 'DATANG' | 'PULANG';
  } | null>(null);

  // ===== STATE BARU: MODAL EDIT ABSENSI =====
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    reason: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper: Format waktu untuk input time (HH:MM:SS)
  const formatTimeForInput = (timeStr: string | null | undefined): string => {
    if (!timeStr) return '';
    try {
      if (timeStr.includes('T')) {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-GB', { hour12: false });
      }
      return timeStr.replace(/\./g, ':');
    } catch (e) {
      return '';
    }
  };

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.nip.includes(searchTerm);

    const matchesRole = roleFilter === 'ALL' || rec.userRole === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;

    let matchesDate = true;
    if (datePreset === 'TODAY') {
      matchesDate = rec.date === todayStr;
    } else if (datePreset === 'WEEK') {
      const recDate = new Date(rec.date);
      const diffTime = Math.abs(new Date().getTime() - recDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchesDate = diffDays <= 7;
    } else if (datePreset === 'MONTH') {
      const currentYearMonth = todayStr.substring(0, 7);
      matchesDate = rec.date.startsWith(currentYearMonth);
    }

    return matchesSearch && matchesRole && matchesStatus && matchesDate;
  });

  const handleExport = () => {
    const fileName = isPersonalView
      ? `Rekap_Absensi_${currentUserName?.replace(/\s+/g, '_') || 'Saya'}.xlsx`
      : `Laporan_Absensi_TK_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportAttendanceToExcel(filteredRecords, fileName);
  };

  // ===== HANDLER BARU: BUKA MODAL EDIT =====
  const handleOpenEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditForm({
      checkIn: formatTimeForInput(record.checkInTime),
      checkOut: formatTimeForInput(record.checkOutTime),
      reason: '',
    });
  };

  // ===== HANDLER BARU: SIMPAN PERUBAHAN KE BACKEND =====
  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    if (!editForm.reason.trim()) {
      alert('⚠️ Alasan koreksi wajib diisi!');
      return;
    }

    setIsSaving(true);

    try {
      const recordDate = editingRecord.date.includes('T')
        ? editingRecord.date.split('T')[0]
        : editingRecord.date;

      const newCheckIn = editForm.checkIn
        ? `${recordDate}T${editForm.checkIn}+08:00`
        : null;

      const newCheckOut = editForm.checkOut
        ? `${recordDate}T${editForm.checkOut}+08:00`
        : null;

      const response = await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          check_in_time: newCheckIn,
          check_out_time: newCheckOut,
          reason: editForm.reason,
          editor_name: currentUserName || 'Admin Utama',
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Data absensi berhasil dikoreksi!');
        setEditingRecord(null);
        window.location.reload();
      } else {
        alert('❌ Gagal menyimpan: ' + (result.error || 'Terjadi kesalahan'));
      }
    } catch (error: any) {
      console.error('Error saving edit:', error);
      alert('❌ Terjadi kesalahan pada server saat menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalCount = filteredRecords.length;
  const onTimeCount = filteredRecords.filter((r) => r.checkInStatus === 'TEPAT_WAKTU').length;
  const lateCount = filteredRecords.filter((r) => r.checkInStatus === 'TERLAMBAT').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Excel Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            {isPersonalView ? 'Riwayat & Rekap Absensi Pribadi' : 'Laporan Rekap Absensi TK'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isPersonalView
              ? 'Daftar kehadiran datang & pulang Anda beserta foto selfie dan koordinat validasi GPS.'
              : 'Pantau riwayat absensi guru dan pegawai TK dengan bukti live capture selfie & verifikasi lokasi.'}
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 transition shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export ke Excel (.xlsx)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Total Kehadiran Tercatat</p>
            <p className="text-xl font-extrabold text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Hadir Tepat Waktu</p>
            <p className="text-xl font-extrabold text-emerald-600">{onTimeCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Terlambat</p>
            <p className="text-xl font-extrabold text-amber-600">{lateCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {!isPersonalView && (
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500">Rentang:</span>
            {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDatePreset(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  datePreset === d
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d === 'ALL' ? 'Semua' : d === 'TODAY' ? 'Hari Ini' : d === 'WEEK' ? '7 Hari' : 'Bulan Ini'}
              </button>
            ))}
          </div>

          {!isPersonalView && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Peran:</span>
              {(['ALL', 'GURU', 'PEGAWAI'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    roleFilter === r
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'ALL' ? 'Semua' : r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Tanggal</th>
                {!isPersonalView && <th className="py-3.5 px-4">Pengguna</th>}
                <th className="py-3.5 px-4">Bukti Selfie</th>
                <th className="py-3.5 px-4">Absen Datang</th>
                <th className="py-3.5 px-4">Absen Pulang</th>
                <th className="py-3.5 px-4">Validasi GPS</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Durasi</th>
                {/* KOLOM BARU: AKSI EDIT */}
                {!isPersonalView && <th className="py-3.5 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isPersonalView ? 8 : 9} className="py-8 text-center text-slate-400">
                    Belum ada riwayat absensi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr
                    key={`report-rec-${rec.id || idx}-${rec.userId || ''}-${rec.date}-${idx}`}
                    className="hover:bg-slate-50/70 transition"
                  >
                    {/* Tanggal */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{rec.date}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(rec.date).toLocaleDateString('id-ID', { weekday: 'long' })}
                      </p>
                    </td>

                    {/* Pengguna (if Admin) */}
                    {!isPersonalView && (
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{rec.userName}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-mono">{rec.nip}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-700">{rec.userRole}</span>
                        </div>
                      </td>
                    )}

                    {/* Selfie Photos */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {rec.checkInPhoto ? (
                          <div
                            onClick={() => setSelectedRecordForPhoto({ record: rec, type: 'DATANG' })}
                            className="relative group cursor-pointer w-11 h-11 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm"
                            title="Klik untuk melihat bukti foto selfie datang"
                          >
                            <img src={rec.checkInPhoto} alt="Selfie Datang" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}

                        {rec.checkOutPhoto ? (
                          <div
                            onClick={() => setSelectedRecordForPhoto({ record: rec, type: 'PULANG' })}
                            className="relative group cursor-pointer w-11 h-11 rounded-xl overflow-hidden border-2 border-blue-500 shadow-sm"
                            title="Klik untuk melihat bukti foto selfie pulang"
                          >
                            <img src={rec.checkOutPhoto} alt="Selfie Pulang" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Datang */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-mono font-bold text-slate-800">{rec.checkInTime}</p>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          rec.checkInStatus === 'TEPAT_WAKTU'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.checkInStatus === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}
                      </span>
                    </td>

                    {/* Pulang */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {rec.checkOutTime ? (
                        <p className="font-mono font-bold text-slate-800">{rec.checkOutTime}</p>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belum Absen Pulang</span>
                      )}
                    </td>

                    {/* Validasi GPS */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold">{rec.checkInLocation?.distanceMeters || 0}m</span>
                        <span className="text-[11px] text-slate-400">dari TK</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-semibold">Lolos Geofence (Live GPS)</p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                          rec.status === 'HADIR' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>

                    {/* Durasi Kerja */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600">
                      {rec.workHoursMinutes
                        ? `${Math.floor(rec.workHoursMinutes / 60)}j ${rec.workHoursMinutes % 60}m`
                        : '-'}
                    </td>

                    {/* KOLOM BARU: TOMBOL EDIT */}
                    {!isPersonalView && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition shadow-sm"
                          title="Koreksi Data Absensi"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL EDIT ABSENSI ================= */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800">Koreksi Absensi</h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-2">
                <p className="text-xs text-blue-800 font-medium">
                  Nama: <span className="font-bold">{editingRecord.userName}</span> <br />
                  Tanggal: <span className="font-bold">{editingRecord.date.split('T')[0]}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jam Datang (WITA)</label>
                <input
                  type="time"
                  step="1"
                  value={editForm.checkIn}
                  onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jam Pulang (WITA)</label>
                <input
                  type="time"
                  step="1"
                  value={editForm.checkOut}
                  onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alasan Koreksi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  placeholder="Contoh: Bug sistem, absen ganda, atau kesalahan teknis lainnya..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition resize-none"
                ></textarea>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setEditingRecord(null)}
                disabled={isSaving}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition shadow-md shadow-emerald-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL FOTO SELFIE ================= */}
      {selectedRecordForPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Bukti Selfie Absensi {selectedRecordForPhoto.type}
                </h3>
                <p className="text-slate-400 text-xs">
                  {selectedRecordForPhoto.record.userName} • {selectedRecordForPhoto.record.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecordForPhoto(null)}
                className="p-1 rounded-full hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950">
                <img
                  src={
                    selectedRecordForPhoto.type === 'DATANG'
                      ? selectedRecordForPhoto.record.checkInPhoto
                      : selectedRecordForPhoto.record.checkOutPhoto
                  }
                  alt="Bukti Kehadiran"
                  className="w-full h-auto object-contain max-h-[420px]"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="font-semibold text-slate-800">Keterangan Otentikasi:</p>
                <p className="text-slate-600 text-[11px]">
                  Foto direkam langsung melalui live webcam/kamera perangkat dengan validasi liveness
                  check dan segel timestamp digital.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
