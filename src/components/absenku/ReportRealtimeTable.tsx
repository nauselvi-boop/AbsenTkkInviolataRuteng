import React, { useState } from 'react';
import { User, AttendanceRecord } from '../../types';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  Download,
  Search,
  Filter,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { exportAttendanceToExcel } from '../../utils/excelUtils';

interface ReportRealtimeTableProps {
  users: User[];
  records: AttendanceRecord[];
  onOpenSelfieModal?: (record: AttendanceRecord) => void;
}

export const ReportRealtimeTable: React.FC<ReportRealtimeTableProps> = ({
  users,
  records,
  onOpenSelfieModal,
}) => {
  const getTodayDateString = () => new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [searchFilter, setSearchFilter] = useState('');

  // Calculate today records safely
  const todayRecords = records.filter((r) => {
    if (!r.date) return false;
    const rDate = r.date.includes('T') ? r.date.split('T')[0] : r.date.slice(0, 10);
    return rDate === selectedDate;
  });

  // Filter staff (exclude Admin)
  const staffUsers = users.filter((u) => (u.role || '').toUpperCase() !== 'ADMIN');
  const totalEmployees = staffUsers.length;

  // Combine staff with today's record using robust matching (ID, NIP, or normalized Name)
  const matchedStaffIds = new Set<string>();
  const tableData = staffUsers
    .map((user, idx) => {
      const rec = todayRecords.find((r) => {
        if (String(r.userId) === String(user.id)) return true;
        if (user.nip && r.nip && r.nip.trim() !== '-' && r.nip.trim() === user.nip.trim()) return true;
        if (user.name && r.userName && r.userName.toLowerCase().trim() === user.name.toLowerCase().trim()) return true;
        return false;
      });

      if (rec) {
        matchedStaffIds.add(String(rec.id));
      }

      return {
        no: idx + 1,
        user,
        record: rec,
      };
    })
    .filter(
      (item) =>
        (item.user.name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.user.position || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.user.nip || '').includes(searchFilter)
    );

  // Also include any attendance record that was recorded but staff profile wasn't in users list
  const extraRecords = todayRecords.filter((r) => !matchedStaffIds.has(String(r.id)));
  extraRecords.forEach((extraRec, i) => {
    tableData.push({
      no: tableData.length + 1,
      user: {
        id: `extra-staff-${extraRec.userId || 'unknown'}-${extraRec.id || i}-${i}`,
        name: extraRec.userName || 'Guru / Pegawai',
        nip: extraRec.nip || '-',
        role: (extraRec.userRole as any) || 'GURU',
        position: 'Tenaga Pendidik',
        avatarUrl: extraRec.checkInPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(extraRec.userName || 'Staf')}&background=0088cc&color=fff`,
      },
      record: extraRec,
    });
  });

  const presentCount = tableData.filter((item) => !!item.record).length;
  const absentCount = Math.max(0, totalEmployees - presentCount);

  const handleExportExcel = () => {
    exportAttendanceToExcel(
      records,
      'Rekap_Presensi_TKK_Inviolata_Ruteng.xlsx'
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 space-y-3">
      {/* Title & Stats Row tailored to TKK Inviolata Ruteng */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#0088cc]" />
            <span>Rekap Presensi Harian TKK Inviolata Ruteng</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Monitoring kehadiran guru dan tenaga kependidikan secara realtime
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama guru..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0088cc] w-36 sm:w-48"
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
            title="Download Format Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Counter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 px-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">
              Jumlah Guru & Pegawai :
            </span>
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {totalEmployees}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Sudah Hadir :</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {presentCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Belum Hadir :</span>
            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {absentCount}
            </span>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium text-[11px]">Tanggal:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Realtime Table with Blue Header (matching ho.png) */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0088cc] text-white font-semibold">
              <th className="py-2.5 px-3 w-12 text-center">No.</th>
              <th className="py-2.5 px-3 w-16 text-center">Foto</th>
              <th className="py-2.5 px-3">Nama Guru / Pegawai</th>
              <th className="py-2.5 px-3">Tugas / Sentra</th>
              <th className="py-2.5 px-3">Jam Datang</th>
              <th className="py-2.5 px-3">Jam Pulang</th>
              <th className="py-2.5 px-3">Status Kehadiran</th>
              <th className="py-2.5 px-3 text-center w-24">Bukti Selfie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableData.map(({ no, user, record }) => {
              const isPresent = !!record;
              return (
                <tr
                  key={`realtime-row-${user.id}-${no}`}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-2 px-3 text-center text-slate-500 font-medium">
                    {no}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <img
                      src={record?.checkInPhoto || user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover mx-auto border border-slate-200 shadow-2xs"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <p className="font-bold text-slate-900 leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      NIP: {user.nip}
                    </p>
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-medium">
                    {user.position}
                  </td>
                  <td className="py-2 px-3">
                    {record?.checkInTime ? (
                      <span className="font-bold text-slate-800">
                        {record.checkInTime} WITA
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {record?.checkOutTime ? (
                      <span className="font-bold text-slate-800">
                        {record.checkOutTime} WITA
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {isPresent ? (
                      record?.checkInStatus === 'TERLAMBAT' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Terlambat
                        </span>
                      ) : record?.checkInStatus === 'TERLAMBAT_DIIZINKAN' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Izin Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Tepat Waktu
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        Belum Presensi
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {record ? (
                      <button
                        onClick={() => onOpenSelfieModal?.(record)}
                        className="p-1 px-2 text-[10px] font-semibold text-[#0088cc] hover:bg-blue-50 rounded border border-blue-200 flex items-center justify-center gap-1 mx-auto"
                        title="Lihat Bukti Foto Selfie & GPS"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Selfie</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
