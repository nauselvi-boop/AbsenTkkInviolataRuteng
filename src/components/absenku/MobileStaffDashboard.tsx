import React, { useState, useEffect } from 'react';
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
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const found = records.find(
      (r) => r.userId === user.id?.toString() && r.date === today
    );
    setTodayRecord(found);
    if (found) {
      setHasCheckedIn(!!found.checkInTime);
      setHasCheckedOut(!!found.checkOutTime);
    } else {
      setHasCheckedIn(false);
      setHasCheckedOut(false);
    }
  }, [records, user, today]);

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
        // Update state setelah refresh
        const updated = await fetch('/api/attendance');
        const data = await updated.json();
        if (data.success) {
          const found = data.data.find(
            (r: any) => r.user_id === user.id && r.attendance_date === dateStr
          );
          if (found) {
            setHasCheckedIn(!!found.check_in_time);
            setHasCheckedOut(!!found.check_out_time);
            setTodayRecord({
              checkInTime: found.check_in_time ? new Date(found.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null,
              checkOutTime: found.check_out_time ? new Date(found.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null,
            });
          }
        }
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

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard Presensi Saya', tabId: 'dashboard' },
    { icon: <Camera className="w-5 h-5" />, label: 'Aplikasi Klik & Dispensasi', tabId: 'dispensasi' },
    { icon: <Bell className="w-5 h-5" />, label: 'Pengumuman Sekolah', tabId: 'pengumuman' },
    { icon: <Lock className="w-5 h-5" />, label: 'Profil & Password', tabId: 'profil' },
  ];

  const handleMenuClick = (tabId: string) => {
    setIsSidebarOpen(false);
    // Untuk sementara, kita hanya tutup sidebar
    // Nanti bisa dikembangkan dengan state untuk mengganti konten
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

      {/* OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR MENU */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#1a2e3b] text-white z-40 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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

        {/* Tombol Presensi */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <p className="font-bold text-gray-800">Buka Kamera Presensi</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePresensi('masuk')}
              disabled={isLoading || hasCheckedIn || hasCheckedOut}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
                hasCheckedIn || hasCheckedOut
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

        {/* Informasi */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-gray-700">
          <p className="font-bold text-blue-800">📋 Informasi Presensi</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-600">
            <li>Masuk: 06:30 - 07:30 WITA</li>
            <li>Pulang: 12:30 - 15:30 WITA</li>
            <li>Konfirmasi keterlambatan hubungi admin.</li>
          </ul>
        </div>

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