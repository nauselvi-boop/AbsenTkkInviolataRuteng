import React, { ReactNode, useState, useEffect } from 'react';
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
  Clock,
} from 'lucide-react';
import { AbsenKuLogo } from './absenku/AbsenKuLogo';
import { User } from '../types';

interface MainLayoutProps {
  children: ReactNode;
  user: any;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  allUsers?: User[];
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user,
  onLogout,
  activeTab = 'monitoring',
  onTabChange,
}) => {
  const [isIzinOpen, setIsIzinOpen] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      setCurrentTimeStr(`${now.toLocaleDateString('id-ID', options)} WITA`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { icon: <School className="w-4 h-4" />, label: 'Beranda / Monitoring', tabId: 'monitoring' },
    { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Rekap Absensi Excel', tabId: 'laporan' },
    { icon: <Users className="w-4 h-4" />, label: 'Data Guru & Pegawai', tabId: 'pengguna' },
    { icon: <MapPin className="w-4 h-4" />, label: 'Lokasi GPS & Jam Sekolah', tabId: 'geofence' },
    {
      icon: <CheckSquare className="w-4 h-4" />,
      label: 'Persetujuan & Izin',
      isDropdown: true,
      subItems: [
        { icon: <span className="w-4 h-4 text-emerald-400">▶</span>, label: 'Izin Terlambat', tabId: 'izin_terlambat' },
        { icon: <span className="w-4 h-4 text-blue-400">▶</span>, label: 'Izin Tidak Masuk', tabId: 'izin_tidak_masuk' },
      ],
    },
    { icon: <Megaphone className="w-4 h-4" />, label: 'Pengumuman Sekolah', tabId: 'pengumuman' },
    { icon: <UserCog className="w-4 h-4" />, label: 'Profil & Password Admin', tabId: 'profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Top Header Biru Solid Khas AbsenKu (#0088cc) */}
      <header className="bg-[#0088cc] text-white shadow-md z-30 shrink-0 border-b border-[#0077b5]">
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Sisi Kiri: Logo AbsenKu & Judul */}
          <div className="flex items-center gap-3">
            <AbsenKuLogo variant="small" />
            <div className="hidden sm:block border-l border-white/25 pl-3">
              <span className="text-xs uppercase font-extrabold tracking-wider text-white flex items-center gap-1.5">
                <span>DASHBOARD ADMIN UTAMA</span>
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  ONLINE
                </span>
              </span>
              <p className="text-[10px] text-white/80">TKK INVIOLATA RUTENG</p>
            </div>
          </div>

          {/* Sisi Kanan: Jam WITA & User Profile */}
          <div className="flex items-center gap-3 text-xs">
            {currentTimeStr && (
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl text-[11px] font-mono border border-white/15">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentTimeStr}</span>
              </div>
            )}

            {/* User Pill (Klik untuk menuju Profil & Password Admin) & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              <button
                onClick={() => onTabChange && onTabChange('profile')}
                className="flex items-center gap-2 hover:bg-white/10 px-2.5 py-1 rounded-xl transition text-left"
                title="Buka Pengaturan Profil & Password"
              >
                <img
                  src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=Admin&background=8B5CF6&color=fff&size=36'}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full border border-white object-cover shadow-2xs"
                />
                <div className="hidden sm:block leading-tight">
                  <span className="font-bold text-xs block">{user?.name?.split(' ')[0] || 'Admin'}</span>
                  <span className="text-[10px] text-white/70 block">Admin Utama</span>
                </div>
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-red-600/80 hover:bg-red-700 text-white transition ml-1 shadow-2xs"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Body Area: Sidebar (Dark Slate) + Main Content (Laptop) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Gelap (#152232) */}
        <aside className="w-64 bg-[#152232] text-white flex flex-col shrink-0 shadow-xl z-10 border-r border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0088cc] flex items-center justify-center font-bold text-white shadow-md">
              TK
            </div>
            <div>
              <p className="font-bold text-xs uppercase tracking-wide text-white">TKK Inviolata</p>
              <p className="text-[10px] text-emerald-400 font-medium">Ruteng, Manggarai</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
            <div className="px-3 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
              MENU UTAMA
            </div>
            {menuItems.map((item, idx) => {
              if (item.isDropdown) {
                const isSubActive =
                  activeTab === 'aktivasi_absen' ||
                  activeTab === 'izin_terlambat' ||
                  activeTab === 'izin_tidak_masuk';
                return (
                  <div key={idx} className="space-y-1">
                    <button
                      onClick={() => setIsIzinOpen(!isIzinOpen)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isSubActive
                          ? 'bg-[#0088cc]/20 text-white border border-[#0088cc]/40'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {isIzinOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                    {isIzinOpen && (
                      <div className="ml-5 pl-2 border-l border-slate-700/60 space-y-1 mt-1">
                        {item.subItems?.map((sub) => (
                          <button
                            key={sub.tabId}
                            onClick={() => onTabChange && onTabChange(sub.tabId)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                              activeTab === sub.tabId
                                ? 'bg-[#0088cc] text-white shadow-sm font-bold'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
              const isActive = activeTab === item.tabId;
              return (
                <button
                  key={item.tabId}
                  onClick={() => onTabChange && onTabChange(item.tabId)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition text-left ${
                    isActive
                      ? 'bg-[#0088cc] text-white shadow-md font-bold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Info Bar at Bottom of Sidebar */}
          <div className="p-3 border-t border-slate-800 bg-[#0f172a]/60">
            <div className="flex items-center gap-2.5">
              <img
                src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=Admin&background=8B5CF6&color=fff&size=36'}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border border-[#0088cc]"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin Utama'}</p>
                <p className="text-[10px] text-emerald-400 font-semibold">{user?.role || 'ADMIN'}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Laptop Dashboard Screen Content */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6 relative">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
