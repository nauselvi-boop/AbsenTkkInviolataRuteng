import React, { useState, useEffect } from 'react';
import { AttendanceRecord, GeofenceConfig, User } from '../types';
import { GeofenceMap } from './GeofenceMap';
import { AttendanceReports } from './AttendanceReports';
import { UserManagement } from './UserManagement';
import { AdminGeofenceSettings } from './AdminGeofenceSettings';
import {
  Activity,
  Users,
  FileSpreadsheet,
  Settings,
  Clock,
  UserCheck,
  UserX,
  MapPin,
  ShieldCheck,
  CheckSquare,
  Megaphone,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Calendar,
} from 'lucide-react';

// ... (type definitions tetap sama)

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ ... }) => {
  // ... (semua state dan fungsi tetap sama)

  // ===== RENDER DASHBOARD UTAMA (kartu-kartu menarik) =====
  const renderMonitoring = () => {
    return (
      <div className="space-y-6">
        {/* Statistik Ringkas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Guru & Staf</p>
              <p className="text-2xl font-bold text-gray-800">{totalStaffCount}</p>
              <p className="text-xs text-gray-400">Pegawai aktif terdaftar</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hadir Hari Ini</p>
              <p className="text-2xl font-bold text-blue-600">{presentCount}</p>
              <p className="text-xs text-gray-400">{totalStaffCount > 0 ? Math.round((presentCount / totalStaffCount) * 100) : 0}% kehadiran</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Terlambat</p>
              <p className="text-2xl font-bold text-amber-600">{lateCount}</p>
              <p className="text-xs text-gray-400">Lewat jam {geofenceConfig.checkInDeadlineTime}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-full">
              <UserX className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Belum Absen</p>
              <p className="text-2xl font-bold text-rose-600">{absentCount}</p>
              <p className="text-xs text-gray-400">Belum hadir</p>
            </div>
          </div>
        </div>

        {/* Kartu Peta & Aktivitas Masuk */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Peta Pemantauan Real-Time
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Live
              </span>
            </div>
            <div className="h-[350px] rounded-xl overflow-hidden">
              <GeofenceMap
                config={geofenceConfig}
                userLocation={null}
                allStaffLocations={staffPins}
                height="100%"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Radius: {geofenceConfig.radiusMeters}m</span>
              <span>Pin: lokasi absensi hari ini</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Aktivitas Masuk
              </h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{todayRecords.length} hari ini</span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {todayRecords.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Belum ada absensi hari ini.</p>
              ) : (
                todayRecords.slice(0, 10).map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3 border-b border-gray-100 pb-2">
                    <img src={rec.checkInPhoto} alt={rec.userName} className="w-10 h-10 rounded-full object-cover border" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{rec.userName}</p>
                      <p className="text-xs text-gray-500">{rec.checkInTime} • {rec.userRole}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rec.checkInStatus === 'TEPAT_WAKTU' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {rec.checkInStatus === 'TEPAT_WAKTU' ? 'Tepat' : 'Terlambat'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Kartu-Kartu Cepat (sesuai gambar) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Data Guru & Pegawai</h4>
                <p className="text-sm text-gray-500">Pendidik & Tenaga Kependidikan</p>
              </div>
            </div>
            <button onClick={() => onTabChange('pengguna')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Kelola →</button>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Jadwal Sentra & KBM</h4>
                <p className="text-sm text-gray-500">Balok, Alam, Seni & Rohani</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">Kurikulum Merdeka</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-full">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Rekap Absensi TK</h4>
                <p className="text-sm text-gray-500">Laporan Kehadiran & Unduh</p>
              </div>
            </div>
            <button onClick={() => onTabChange('laporan')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Lihat →</button>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <Megaphone className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Pengumuman Sekolah</h4>
                <p className="text-sm text-gray-500">Agenda & Informasi</p>
              </div>
            </div>
            <button onClick={() => onTabChange('pengumuman')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Baca →</button>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-full">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Lokasi & Jam Kerja</h4>
                <p className="text-sm text-gray-500">Geofence & Jadwal</p>
              </div>
            </div>
            <button onClick={() => onTabChange('geofence')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Atur →</button>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-full">
                <UserCog className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Profil & Password</h4>
                <p className="text-sm text-gray-500">Data Admin</p>
              </div>
            </div>
            <button onClick={() => onTabChange('profile')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Edit →</button>
          </div>
        </div>
      </div>
    );
  };

  // ... (renderTabContent dan lainnya tetap sama, hanya pastikan renderMonitoring dipanggil untuk tab 'monitoring')
};