import React, { useState } from 'react';
import {
  School,
  LayoutDashboard,
  Camera,
  Bell,
  Lock,
  LogOut,
  Menu,
  X,
  Clock,
  Phone,
  FileText,
  Calendar,
  User,
} from 'lucide-react';

interface MobileStaffDashboardProps {
  user: any;
  records: any[];
  onRefresh: () => void;
  onLogout: () => void;
  geofenceConfig?: any;
}

export const MobileStaffDashboard: React.FC<MobileStaffDashboardProps> = ({
  user,
  records,
  onRefresh,
  onLogout,
  geofenceConfig,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = records.find((r) => r.userId === user.id?.toString() && r.date === today);
  const hasCheckedIn = !!todayRecord?.checkInTime;
  const hasCheckedOut = !!todayRecord?.checkOutTime;

  // Menu untuk grid (seperti gambar)
  const menuItems = [
    { icon: <LayoutDashboard className="w-6 h-6 text-emerald-600" />, label: 'Dashboard', tabId: 'dashboard' },
    { icon: <Camera className="w-6 h-6 text-blue-600" />, label: 'Presensi', tabId: 'presensi' },
    { icon: <FileText className="w-6 h-6 text-purple-600" />, label: 'Izin', tabId: 'izin' },
    { icon: <Bell className="w-6 h-6 text-amber-600" />, label: 'Pengumuman', tabId: 'pengumuman' },
    { icon: <User className="w-6 h-6 text-indigo-600" />, label: 'Profil', tabId: 'profil' },
  ];

  const handleMenuClick = (tabId: string) => {
    // Untuk sementara hanya close sidebar
    setIsSidebarOpen(false);
    // Anda bisa tambahkan navigasi jika diperlukan
  };

  const handlePresensi = async (type: 'masuk' | 'pulang') => {
    setIsLoading(true);
    setStatusMessage({ text: '', type: '' });

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      let lat = 0,
        lng = 0;
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve(true);
            },
            () => resolve(true),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
      }

      const payload = {
        user_id: user.id,
        date: dateStr,
        status: 'hadir',
        location: `GPS: ${lat}, ${lng}`,
        notes: `Presensi ${type} via HP`,
        photo: null,
        lat: lat,
        lng: lng,
      };

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const action = result.type === 'check-in' ? 'Check-in' : 'Check-out';
        setStatusMessage({
          text: `✅ ${action} berhasil pukul ${timeStr} WITA!`,
          type: 'success',
        });
        await onRefresh();
      } else {
        setStatusMessage({
          text: `❌ Gagal: ${result.error || result.detail || 'Terjadi kesalahan'}`,
          type: 'error',
        });
      }
    } catch (error: any) {
      setStatusMessage({
        text: `❌ Error: ${error.message}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <header className="bg-[#1a2e3b] text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-2">
          <School className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-lg">absenKU</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-1">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* SIDEBAR (sama seperti sebelumnya) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#1a2e3b] text-white z-40 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ... isi sidebar (bisa diambil dari kode sebelumnya) ... */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-lg">absenKU</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 py-1 text-xs text-gray-400 uppercase tracking-wider">
            Portal {user?.role || 'User'}
          </div>
          {menuItems.map((item) => (
            <button
              key={item.tabId}
              onClick={() => handleMenuClick(item.tabId)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm transition text-left text-gray-300 hover:bg-gray-700/30 border-b border-gray-700/50"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              onLogout();
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700/30 transition text-left border-b border-gray-700/50"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=10B981&color=fff&size=40`}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="text-white font-semibold text-sm">{user?.name || 'User'}</p>
              <p className="text-gray-400 text-[10px]">Portal {user?.role || 'User'}</p>
              <p className="text-gray-500 text-[10px]">NIP: {user?.nip || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div className="flex-1 p-4 space-y-4">
        {/* Profil */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-800">Dashboard Presensi Saya</h2>
          <p className="text-sm text-gray-600 mt-1">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-500">{user?.role === 'GURU' ? 'Guru' : 'Pegawai'} • TKK Inviolata Ruteng</p>
          <p className="text-xs text-gray-400">NIP: {user?.nip || '-'}</p>
        </div>

        {/* Status Presensi */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-700">PRESENSI MASUK</p>
            {hasCheckedIn ? (
              <p className="text-lg font-bold text-emerald-600">{todayRecord?.checkInTime || '07:30'}</p>
            ) : (
              <p className="text-sm text-gray-500">Belum</p>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-700">PRESENSI PULANG</p>
            {hasCheckedOut ? (
              <p className="text-lg font-bold text-blue-600">{todayRecord?.checkOutTime || 'Sudah'}</p>
            ) : hasCheckedIn ? (
              <p className="text-sm text-gray-500">Belum</p>
            ) : (
              <p className="text-sm text-gray-500">-</p>
            )}
          </div>
        </div>

        {/* TOMBOL PRESENSI (seperti gambar) */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-5 h-5 text-emerald-600" />
            <p className="font-bold text-gray-800">Buka Kamera Presensi</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePresensi('masuk')}
              disabled={isLoading || hasCheckedIn}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
                hasCheckedIn
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isLoading ? '...' : '📸 Masuk'}
            </button>
            <button
              onClick={() => handlePresensi('pulang')}
              disabled={isLoading || !hasCheckedIn || hasCheckedOut}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
                !hasCheckedIn || hasCheckedOut
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? '...' : '🏠 Pulang'}
            </button>
          </div>
        </div>

        {/* MENU GRID (seperti gambar) */}
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.tabId}
              onClick={() => handleMenuClick(item.tabId)}
              className="bg-white rounded-2xl shadow-sm p-4 text-center hover:shadow-md transition flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Pesan Status */}
        {statusMessage.text && (
          <div
            className={`p-3 rounded-xl text-sm font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* WA Admin */}
        <a
          href="https://wa.me/6281238889901"
          target="_blank"
          rel="noreferrer"
          className="bg-white border rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition"
        >
          <Phone className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-bold text-gray-800 text-sm">WA Admin</p>
            <p className="text-xs text-gray-500">0812-3888-9901 (Sr. Maria)</p>
          </div>
        </a>

        {/* Keluar */}
        <button
          onClick={onLogout}
          className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition"
        >
          Keluar
        </button>

        <p className="text-center text-[10px] text-slate-400 mt-4">
          Sistem Informasi Presensi Online • TKK Inviolata Ruteng
        </p>
      </div>
    </div>
  );
};