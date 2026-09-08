import React, { useState } from 'react';
import {
  School,
  FileSpreadsheet,
  Users,
  MapPin,
  Calendar,
  Bell,
  LogOut,
  UserCog,
  CheckSquare,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

interface MobileAbsenKuHomeProps {
  user: any;
  onLogout: () => void;
  onNavigate?: (tab: string) => void;
}

export const MobileAbsenKuHome: React.FC<MobileAbsenKuHomeProps> = ({
  user,
  onLogout,
  onNavigate,
}) => {
  const [isIzinOpen, setIsIzinOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Rekap Absensi Excel', tabId: 'laporan' },
    { icon: <Users className="w-4 h-4" />, label: 'Data Guru & Pegawai', tabId: 'pengguna' },
    { icon: <MapPin className="w-4 h-4" />, label: 'Lokasi GPS & Jam Sekolah', tabId: 'geofence' },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: 'Persetujuan Izin & Kunci',
      isDropdown: true,
      subItems: [
        { icon: <span className="w-4 h-4 text-emerald-400">▶</span>, label: 'Izin Terlambat', tabId: 'izin_terlambat' },
        { icon: <span className="w-4 h-4 text-blue-400">▶</span>, label: 'Izin Tidak Masuk', tabId: 'izin_tidak_masuk' },
      ],
    },
    { icon: <Megaphone className="w-4 h-4" />, label: 'Pengumuman Sekolah', tabId: 'pengumuman' },
    ...(user?.role === 'ADMIN' ? [
      { icon: <UserCog className="w-4 h-4" />, label: 'Profil & Password Admin', tabId: 'profile' },
    ] : []),
  ];

  const handleMenuClick = (tabId: string) => {
    if (onNavigate) {
      onNavigate(tabId);
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER MOBILE */}
      <header className="bg-[#1a2e3b] text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-2">
          <School className="w-6 h-6 text-emerald-400" />
          <div>
            <span className="font-bold text-lg">absenKU</span>
            <p className="text-[10px] text-gray-400 leading-tight">SISTEM PRESENSI ONLINE</p>
            <p className="text-[10px] text-emerald-400 leading-tight">TKK INVIOLATA RUTENG</p>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white p-1"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsSidebarOpen(false)}
        />
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
            Kelola Penuh Admin
          </div>
          {menuItems.map((item, idx) => {
            if (item.isDropdown) {
              return (
                <div key={idx}>
                  <button
                    onClick={() => setIsIzinOpen(!isIzinOpen)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition text-left text-gray-300 hover:bg-gray-700/30"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {isIzinOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isIzinOpen && (
                    <div className="bg-gray-800/50">
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.tabId}
                          onClick={() => handleMenuClick(sub.tabId)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm transition text-left text-gray-300 hover:bg-gray-700/30 pl-10"
                        >
                          {sub.icon}
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.tabId}
                onClick={() => handleMenuClick(item.tabId)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left text-gray-300 hover:bg-gray-700/30"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="border-t border-gray-700 my-2"></div>
          <button
            onClick={() => {
              onLogout();
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700/30 transition text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar ke Panel Login</span>
          </button>
        </div>

        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <img
              src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=8B5CF6&color=fff&size=40'}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="text-white font-semibold text-sm">{user?.name || 'User'}</p>
              <p className="text-gray-400 text-[10px]">{user?.role || 'Role'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div className="flex-1 p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800">Dashboard Admin Utama</h2>
          <p className="text-sm text-gray-500 mt-1">Hak Akses: {user?.role || 'Admin'} (Penuh)</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => {
            if (item.isDropdown) {
              return (
                <div key={item.label} className="col-span-2">
                  <button
                    onClick={() => setIsIzinOpen(!isIzinOpen)}
                    className="w-full bg-white rounded-2xl shadow-sm p-4 text-left hover:shadow-md transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="font-semibold text-gray-700">{item.label}</span>
                    </div>
                    {isIzinOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {isIzinOpen && (
                    <div className="mt-2 space-y-2">
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.tabId}
                          onClick={() => handleMenuClick(sub.tabId)}
                          className="w-full bg-white/80 rounded-xl p-3 text-left hover:bg-white transition flex items-center gap-2 ml-4"
                        >
                          {sub.icon}
                          <span className="text-sm text-gray-700">{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.tabId}
                onClick={() => handleMenuClick(item.tabId)}
                className="bg-white rounded-2xl shadow-sm p-4 text-left hover:shadow-md transition flex items-center gap-2"
              >
                {item.icon}
                <span className="font-semibold text-gray-700">{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (onNavigate) {
              onNavigate('desktop');
            }
          }}
          className="w-full bg-[#1a2e3b] text-white py-3 rounded-xl font-bold hover:bg-[#2a4050] transition flex items-center justify-center gap-2"
        >
          <span>💻 Buka Tampilan Desktop Penuh</span>
        </button>

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