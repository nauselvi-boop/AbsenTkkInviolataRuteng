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
  Laptop,
  Smartphone,
  Layers,
  Clock,
  Sparkles,
  ArrowRightLeft,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AbsenKuLogo } from './absenku/AbsenKuLogo';
import { User } from '../types';

interface MainLayoutProps {
  children: ReactNode;
  user: any;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  viewMode?: 'showcase' | 'desktop' | 'mobile';
  onViewModeChange?: (mode: 'showcase' | 'desktop' | 'mobile') => void;
  allUsers?: User[];
  onQuickSwitchUser?: (u: User) => void;
  mobileMockupElement?: ReactNode;
  showPhoneMockup?: boolean;
  onTogglePhoneMockup?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user,
  onLogout,
  activeTab = 'monitoring',
  onTabChange,
  viewMode = 'showcase',
  onViewModeChange,
  allUsers = [],
  onQuickSwitchUser,
  mobileMockupElement,
  showPhoneMockup = true,
  onTogglePhoneMockup,
}) => {
  const [isIzinOpen, setIsIzinOpen] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [isPhoneMinimized, setIsPhoneMinimized] = useState(false);

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

          {/* Sisi Tengah: Mode Switcher (Showcase vs Full Laptop vs Full HP) */}
          {onViewModeChange && (
            <div className="hidden md:flex items-center bg-[#0072aa] p-1 rounded-xl border border-white/20 text-xs">
              <button
                onClick={() => onViewModeChange('showcase')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                  viewMode === 'showcase'
                    ? 'bg-white text-[#0088cc] shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Tampilan Laptop di Belakang dan HP di Depan"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Showcase (Laptop + HP)</span>
              </button>
              <button
                onClick={() => onViewModeChange('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                  viewMode === 'desktop'
                    ? 'bg-white text-[#0088cc] shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Tampilan Laptop Penuh"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Laptop Saja</span>
              </button>
              <button
                onClick={() => onViewModeChange('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                  viewMode === 'mobile'
                    ? 'bg-white text-[#0088cc] shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Tampilan HP Mobile Penuh"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>HP Saja</span>
              </button>
            </div>
          )}

          {/* Sisi Kanan: Jam WITA & User Profile */}
          <div className="flex items-center gap-3 text-xs">
            {currentTimeStr && (
              <div className="hidden lg:flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg text-[11px] font-mono border border-white/15">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentTimeStr}</span>
              </div>
            )}

            {/* Quick Switch User (Untuk memudahkan simulasi pengujian guru/pegawai) */}
            {onQuickSwitchUser && allUsers.length > 0 && (
              <div className="hidden xl:flex items-center gap-1.5 bg-[#0072aa] px-2 py-1 rounded-lg border border-white/20">
                <ArrowRightLeft className="w-3 h-3 text-emerald-300" />
                <span className="text-[10px] font-semibold text-white/80">Simulasi Akun:</span>
                <select
                  value={user?.id || ''}
                  onChange={(e) => {
                    const found = allUsers.find((u) => String(u.id) === e.target.value);
                    if (found) onQuickSwitchUser(found);
                  }}
                  className="bg-white text-slate-800 text-[11px] font-bold rounded px-1.5 py-0.5 border-none outline-none cursor-pointer"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tombol Toggle Mockup HP */}
            {onTogglePhoneMockup && viewMode === 'showcase' && (
              <button
                onClick={onTogglePhoneMockup}
                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg shadow-sm text-xs transition"
                title="Tampilkan / Sembunyikan HP Mobile di Depan"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{showPhoneMockup ? 'Sembunyikan HP' : 'Buka HP'}</span>
              </button>
            )}

            {/* User Pill & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              <img
                src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=Admin&background=8B5CF6&color=fff&size=36'}
                alt="Avatar"
                className="w-7 h-7 rounded-full border border-white object-cover"
              />
              <span className="font-bold hidden sm:inline">{user?.name?.split(' ')[0] || 'Admin'}</span>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-white transition ml-1"
                title="Keluar / Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
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

        {/* Foreground Interactive Smartphone Mockup (Posisi di depan seperti pada gambar) */}
        {viewMode === 'showcase' && showPhoneMockup && mobileMockupElement && (
          <aside
            className={`fixed right-6 bottom-4 z-40 transition-all duration-300 ${
              isPhoneMinimized ? 'translate-y-[calc(100%-48px)]' : 'translate-y-0'
            }`}
          >
            {/* Header Kontrol HP Mockup */}
            <div className="bg-slate-900 text-white px-4 py-2 rounded-t-2xl shadow-xl flex items-center justify-between border-t border-x border-slate-700 text-xs select-none">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold">📱 Tampilan HP Guru & Pegawai</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsPhoneMinimized(!isPhoneMinimized)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                  title={isPhoneMinimized ? 'Perbesar HP' : 'Kecilkan HP'}
                >
                  {isPhoneMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                {onTogglePhoneMockup && (
                  <button
                    onClick={onTogglePhoneMockup}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title="Tutup HP"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Frame HP */}
            <div className="bg-slate-950 p-2 rounded-b-[40px] shadow-2xl border-b border-x border-slate-700 max-h-[85vh] overflow-y-auto">
              {mobileMockupElement}
            </div>
          </aside>
        )}

        {/* Floating Button jika HP sedang disembunyikan */}
        {viewMode === 'showcase' && (!showPhoneMockup || isPhoneMinimized) && (
          <button
            onClick={() => {
              if (!showPhoneMockup && onTogglePhoneMockup) onTogglePhoneMockup();
              setIsPhoneMinimized(false);
            }}
            className="fixed right-6 bottom-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold transition hover:scale-105"
          >
            <Smartphone className="w-4 h-4" />
            <span>📱 Buka HP Guru & Pegawai</span>
          </button>
        )}
      </div>
    </div>
  );
};
