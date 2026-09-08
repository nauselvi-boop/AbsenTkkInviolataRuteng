import React, { ReactNode, useState } from 'react';
import {
  School,
  FileSpreadsheet,
  Users,
  MapPin,
  CheckSquare,
  Megaphone,
  UserCog,
  LogOut,
  ChevronDown,
  ChevronRight,
  Camera,
  Calendar,
  BarChart3,
  Bell,
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

  const menuGroups = [
    {
      title: 'KELOLA PENUH ADMIN',
      items: [
        { icon: <BarChart3 className="w-4 h-4" />, label: 'Rekapitulasi Absensi', tabId: 'monitoring' },
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
        { icon: <Camera className="w-4 h-4" />, label: 'Buka Kamera Presensi', tabId: 'camera' },
      ],
    },
    {
      title: 'PENGUMUMAN SEKOLAH',
      items: [
        { icon: <Megaphone className="w-4 h-4" />, label: 'Pengumuman', tabId: 'pengumuman' },
        { icon: <UserCog className="w-4 h-4" />, label: 'Profil & Password', tabId: 'profile' },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a2e3b] text-white flex flex-col shrink-0 shadow-lg">
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <School className="w-8 h-8 text-emerald-400" />
            <div>
              <span className="font-bold text-lg block">absenKU</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Sistem Presensi Online</span>
            </div>
          </div>
          <p className="text-xs text-emerald-400 mt-1 font-semibold">TKK INVIOLATA RUTENG</p>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-2">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="mb-4">
              <div className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                {group.title}
              </div>
              {group.items.map((item, i) => {
                if (item.isDropdown) {
                  return (
                    <div key={i}>
                      <button
                        onClick={() => setIsIzinOpen(!isIzinOpen)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition ${
                          activeTab === 'aktivasi_absen' || activeTab === 'izin_tidak_masuk'
                            ? 'bg-emerald-600/20 text-white'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
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
                        <div className="ml-6 mt-1 space-y-1">
                          {item.subItems.map((sub) => (
                            <button
                              key={sub.tabId}
                              onClick={() => onTabChange && onTabChange(sub.tabId)}
                              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition text-left ${
                                activeTab === sub.tabId
                                  ? 'bg-emerald-600/30 text-white'
                                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                      activeTab === item.tabId
                        ? 'bg-emerald-600/30 text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Profil & Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=8B5CF6&color=fff&size=40'}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border border-emerald-400"
            />
            <div>
              <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-400">{user?.role || 'ADMIN'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between shrink-0 border-b">
          <h2 className="text-xl font-bold text-gray-800">Dashboard Admin Utama</h2>
          <div className="text-sm text-gray-500 bg-emerald-50 px-3 py-1 rounded-full">
            Hak Akses: {user?.role || 'Admin'} (Penuh)
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};