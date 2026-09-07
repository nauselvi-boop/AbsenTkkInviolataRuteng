// src/components/absenku/AbsenKuDashboard.tsx
import React, { useState } from 'react';
import { AbsenKuSidebar } from './AbsenKuSidebar';
import { DashboardCharts } from './DashboardCharts';
import { StaffDashboardPortal } from './StaffDashboardPortal';
import { AttendanceForm } from './AttendanceForm';

// Tipe data untuk user dan records
interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'guru' | 'pegawai';
}

interface AttendanceRecord {
  id: number;
  user_id: number;
  attendance_date: string;
  status: string;
  location: string;
  notes?: string;
  created_at: string;
}

interface AbsenKuDashboardProps {
  user: User;
  records?: AttendanceRecord[];
  onRefresh?: () => void;
}

export const AbsenKuDashboard: React.FC<AbsenKuDashboardProps> = ({
  user,
  records = [],
  onRefresh,
}) => {
  // State untuk menu aktif di sidebar
  const [activeItem, setActiveItem] = useState<'dashboard' | 'attendance' | 'reports' | 'settings'>('dashboard');

  // State untuk menampilkan pesan sukses/error (opsional)
  const [message, setMessage] = useState<string | null>(null);

  // Fungsi untuk refresh data setelah absen
  const handleAbsenSuccess = () => {
    setMessage('✅ Absensi berhasil disimpan!');
    if (onRefresh) onRefresh();
    setTimeout(() => setMessage(null), 3000);
  };

  // Render konten berdasarkan menu aktif
  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        // Tampilan dashboard utama (Admin atau Staff)
        if (user.role === 'admin') {
          return (
            <div className="p-4 md:p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Admin</h2>
              <DashboardCharts users={[user]} records={records} />
            </div>
          );
        } else {
          // Untuk Guru/Pegawai, gunakan StaffDashboardPortal yang sudah ada
          return (
            <StaffDashboardPortal
              user={user}
              records={records}
              onRefresh={handleAbsenSuccess}
            />
          );
        }

      case 'attendance':
        // Halaman Form Absensi
        return (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Form Absensi Hari Ini</h2>
            <div className="max-w-2xl">
              <AttendanceForm
                userId={user.id}
                onSuccess={handleAbsenSuccess}
              />
            </div>
          </div>
        );

      case 'reports':
        // Halaman Laporan (placeholder)
        return (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Laporan Absensi</h2>
            <p className="text-gray-600">Halaman laporan akan segera hadir.</p>
          </div>
        );

      case 'settings':
        // Halaman Pengaturan (placeholder)
        return (
          <div className="p-4 md:p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Pengaturan</h2>
            <p className="text-gray-600">Halaman pengaturan akun dan sistem.</p>
          </div>
        );

      default:
        return <div className="p-4">Halaman tidak ditemukan.</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <AbsenKuSidebar
        activeItem={activeItem}
        onSelectItem={(item: any) => setActiveItem(item)}
        user={user}
      />

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header (opsional) */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-700">
              {activeItem === 'dashboard' && 'Dashboard'}
              {activeItem === 'attendance' && 'Absensi'}
              {activeItem === 'reports' && 'Laporan'}
              {activeItem === 'settings' && 'Pengaturan'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {user.full_name} ({user.role})
            </span>
          </div>
        </header>

        {/* Notifikasi / Pesan */}
        {message && (
          <div className="mx-4 mt-4 p-3 bg-green-100 text-green-800 rounded-lg shadow">
            {message}
          </div>
        )}

        {/* Konten */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};