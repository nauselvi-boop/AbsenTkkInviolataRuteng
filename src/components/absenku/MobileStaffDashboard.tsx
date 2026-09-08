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
  FileText,
  ChevronRight,
} from 'lucide-react';

interface MobileStaffDashboardProps {
  user: any;
  records: any[];
  onRefresh: () => void;
  onLogout: () => void;
  geofenceConfig?: any;
}

type StaffTab = 'dashboard' | 'dispensasi' | 'pengumuman' | 'profil';

export const MobileStaffDashboard: React.FC<MobileStaffDashboardProps> = ({
  user,
  records,
  onRefresh,
  onLogout,
  geofenceConfig,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<StaffTab>('dashboard');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = records.find((r) => r.userId === user.id?.toString() && r.date === today);
  const hasCheckedIn = !!todayRecord?.checkInTime;
  const hasCheckedOut = !!todayRecord?.checkOutTime;

  // Menu untuk staff (guru/pegawai)
  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard Presensi Saya', tab: 'dashboard' },
    { icon: <Camera className="w-5 h-5" />, label: 'Aplikasi Klik & Dispensasi', tab: 'dispensasi' },
    { icon: <Bell className="w-5 h-5" />, label: 'Pengumuman Sekolah', tab: 'pengumuman' },
    { icon: <Lock className="w-5 h-5" />, label: 'Profil & Password', tab: 'profil' },
  ];

  const handleMenuClick = (tab: StaffTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
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

  // Render konten berdasarkan tab aktif
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'dispensasi':
        return renderDispensasi();
      case 'pengumuman':
        return renderPengumuman();
      case 'profil':
        return renderProfil();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-lg font-bold text-gray-800">Dashboard Presensi Saya</h2>
        <p className="text-sm text-gray-600 mt-1">{user?.name || 'User'}</p>
        <p className="text-xs text-gray-500">{user?.role === 'GURU' ? 'Guru' : 'Pegawai'} • TKK Inviolata Ruteng</p>
        <p className="text-xs text-gray-400">NIP: {user?.nip || '-'}</p>
      </div>

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

      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
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

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-gray-700">
        <p className="font-bold text-blue-800">📋 Informasi Presensi</p>
        <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-600">
          <li>Masuk: 06:30 - 07:30 WITA</li>
          <li>Pulang: 12:30 - 15:30 WITA</li>
          <li>Konfirmasi keterlambatan hubungi admin.</li>
        </ul>
      </div>

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
    </div>
  );

  const renderDispensasi = () => (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Camera className="w-5 h-5 text-emerald-600" />
        Aplikasi Klik & Dispensasi
      </h3>
      <p className="text-sm text-gray-600">Ajukan izin atau dispensasi.</p>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
        <p className="font-semibold text-blue-800">📝 Formulir Pengajuan Izin</p>
        <p className="text-xs text-gray-600 mt-1">Sakit, Keperluan, atau Cuti.</p>
        <button
          onClick={() => alert('Fitur sedang dikembangkan. Hubungi admin via WA.')}
          className="mt-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          Ajukan Sekarang
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Phone className="w-4 h-4 text-green-600" />
        <span>WA Admin: 0812-3888-9901</span>
      </div>
    </div>
  );

  const renderPengumuman = () => (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Bell className="w-5 h-5 text-emerald-600" />
        Pengumuman Sekolah
      </h3>
      <div className="space-y-2">
        <div className="border-l-4 border-emerald-500 pl-3 py-1">
          <p className="font-semibold text-gray-800 text-sm">📢 Libur Nasional</p>
          <p className="text-xs text-gray-500">17 Agustus 2026</p>
        </div>
        <div className="border-l-4 border-blue-500 pl-3 py-1">
          <p className="font-semibold text-gray-800 text-sm">📢 Rapat Guru</p>
          <p className="text-xs text-gray-500">11 September 2026, 13:00 WITA</p>
        </div>
      </div>
    </div>
  );

  const renderProfil = () => (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Lock className="w-5 h-5 text-emerald-600" />
        Profil & Password
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-500">Nama</p>
          <p className="font-semibold">{user?.name}</p>
        </div>
        <div>
          <p className="text-gray-500">NIP</p>
          <p className="font-semibold">{user?.nip}</p>
        </div>
        <div>
          <p className="text-gray-500">Email</p>
          <p className="font-semibold">{user?.email}</p>
        </div>
        <div>
          <p className="text-gray-500">Role</p>
          <p className="font-semibold">{user?.role}</p>
        </div>
      </div>
      <button
        onClick={() => alert('Fitur ganti password akan segera hadir.')}
        className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold text-sm"
      >
        🔒 Ganti Password
      </button>
    </div>
  );

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

      {/* SIDEBAR */}
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
              key={item.tab}
              onClick={() => handleMenuClick(item.tab as StaffTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition text-left ${
                activeTab === item.tab
                  ? 'bg-gray-700/50 text-white border-l-4 border-emerald-400'
                  : 'text-gray-300 hover:bg-gray-700/30 border-b border-gray-700/50'
              }`}
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
      <div className="flex-1 p-4 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};