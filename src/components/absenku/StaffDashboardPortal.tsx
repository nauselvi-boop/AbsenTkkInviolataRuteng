import React, { useState } from 'react';
import { AttendanceForm } from './AttendanceForm'; // Import form yang kita buat

// Interface untuk props yang diterima
interface StaffDashboardPortalProps {
  user?: any;                // data user yang login (opsional)
  records?: any[];           // data absensi (opsional)
  onRefresh?: () => void;    // fungsi refresh data (opsional)
}

export const StaffDashboardPortal: React.FC<StaffDashboardPortalProps> = ({
  user,
  records = [],
  onRefresh,
}) => {
  // State untuk menampilkan pesan atau loading
  const [activeTab, setActiveTab] = useState<'dashboard' | 'absensi'>('dashboard');

  // Fungsi untuk refresh data setelah absen
  const handleAbsenSuccess = () => {
    if (onRefresh) onRefresh();
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header / Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Selamat Datang, {user?.full_name || 'Pengguna'}!
        </h2>
        <p className="text-gray-600">Dashboard Presensi Guru / Pegawai</p>
      </div>

      {/* Statistik Ringkas (opsional) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Kehadiran Bulan Ini</p>
          <p className="text-2xl font-bold text-blue-600">
            {records.filter(r => r.status === 'hadir').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Izin / Sakit</p>
          <p className="text-2xl font-bold text-yellow-600">
            {records.filter(r => r.status === 'izin' || r.status === 'sakit').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Absensi</p>
          <p className="text-2xl font-bold text-gray-800">{records.length}</p>
        </div>
      </div>

      {/* Navigasi Tab (Dashboard / Form Absensi) */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📋 Dashboard
        </button>
        <button
          onClick={() => setActiveTab('absensi')}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
            activeTab === 'absensi'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ✏️ Absensi Hari Ini
        </button>
      </div>

      {/* Konten sesuai tab */}
      <div className="mt-4">
        {activeTab === 'dashboard' ? (
          // Tampilan Dashboard (statistik, chart, dll) – bisa diisi dengan komponen lain
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">
              Selamat datang di dashboard Anda. Gunakan tab <strong>Absensi Hari Ini</strong> untuk melakukan presensi.
            </p>
            {/* Jika ada komponen grafik, bisa ditambahkan di sini */}
          </div>
        ) : (
          // Form Absensi
          <div className="bg-white p-6 rounded-lg shadow">
            <AttendanceForm 
              onSuccess={handleAbsenSuccess} 
              userId={user?.id || 1} 
            />
          </div>
        )}
      </div>
    </div>
  );
};