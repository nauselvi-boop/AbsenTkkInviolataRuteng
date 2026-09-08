import React, { ReactNode, useState } from 'react';
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
} from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  user: any;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user,
  onLogout,
  activeTab = 'monitoring',
  onTabChange,
}) => {
  const [isIzinOpen, setIsIzinOpen] = useState(false);

  const menuItems = [
    { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Rekap Absensi Excel', tabId: 'laporan' },
    { icon: <Users className="w-4 h-4" />, label: 'Data Guru & Pegawai', tabId: 'pengguna' },
    { icon: <MapPin className="w-4 h-4" />, label: 'Lokasi GPS & Jam Sekolah', tabId: 'geofence' },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: 'Persetujuan Izin & Kunci',
      isDropdown: true,
      subItems: [
        { icon: <span className="w-4 h-4 text-emerald-400">▶</span>, label: 'Aktivasi Tombol Absen', tabId: 'aktivasi_absen' },
        { icon: <span className="w-4 h-4 text-blue-400">▶</span>, label: 'Izin Tidak Masuk', tabId: 'izin_tidak_masuk' },
      ],
    },
    { icon: <Megaphone className="w-4 h-4" />, label: 'Pengumuman Sekolah', tabId: 'pengumuman' },
    ...(user?.role === 'ADMIN' ? [
      { icon: <UserCog className="w-4 h-4" />, label: 'Profil & Password Admin', tabId: 'profile' },
    ] : []),
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="w-64 bg-[#1a2e3b] text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-lg">absenKU</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">SISTEM PRESENSI ONLINE</p>
          <p className="text-xs text-emerald-400 mt-0.5">TKK INVIOLATA RUTENG</p>
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
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition text-left ${
                      activeTab === 'aktivasi_absen' || activeTab === 'izin_tidak_masuk'
                        ? 'bg-gray-700/50 text-white border-l-4 border-emerald-400'
                        : 'text-gray-300 hover:bg-gray-700/30'
                    }`}
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
                          onClick={() => onTabChange && onTabChange(sub.tabId)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition text-left pl-10 ${
                            activeTab === sub.tabId
                              ? 'bg-gray-700/70 text-white border-l-4 border-emerald-400'
                              : 'text-gray-300 hover:bg-gray-700/30'
                          }`}
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
                onClick={() => onTabChange && onTabChange(item.tabId)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left ${
                  activeTab === item.tabId
                    ? 'bg-gray-700/50 text-white border-l-4 border-emerald-400'
                    : 'text-gray-300 hover:bg-gray-700/30'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="border-t border-gray-700 my-2"></div>
          <button
            onClick={onLogout}
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Dashboard Admin Utama</h2>
          <div className="text-sm text-gray-500">Hak Akses: {user?.role || 'Admin'} (Penuh)</div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
};