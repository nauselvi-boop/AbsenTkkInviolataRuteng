import React, { ReactNode, useState } from 'react';
import {
  Menu,
  Smartphone,
  Building2,
  GraduationCap,
  LogOut,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Sliders,
  ShieldAlert,
  Bell,
  ChevronRight,
  X,
} from 'lucide-react';
import { AbsenKuLogo } from './absenku/AbsenKuLogo';
import { DemoAccountSelector } from './absenku/DemoAccountSelector';
import { MobileAppMockup } from './absenku/MobileAppMockup';
import { MobileAbsenKuHome } from './absenku/MobileAbsenKuHome';
import { ExcelReportDropdown } from './absenku/ExcelReportDropdown';
import { User, GeofenceConfig, AttendanceRecord } from '../types';

interface MainLayoutProps {
  children: ReactNode;
  user: User;
  users?: User[];
  records?: AttendanceRecord[];
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: any) => void;
  onSelectReportPreset?: (preset: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL') => void;
  onSelectUser?: (user: User) => void;
  geofenceConfig?: GeofenceConfig;
  onRecordAttendance?: (record: AttendanceRecord) => void;
  onSwitchToMobile?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user,
  users = [],
  records = [],
  onLogout,
  activeTab = 'monitoring',
  onTabChange,
  onSelectReportPreset,
  onSelectUser,
  geofenceConfig,
  onRecordAttendance,
  onSwitchToMobile,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMobileMockup, setShowMobileMockup] = useState(false);

  // Fallback demo users if none supplied
  const effectiveUsers: User[] = users.length > 0 ? users : [
    {
      id: '1',
      name: 'Sr. Maria Inviolata, S.Pd.',
      email: 'kepala@tkkinviolata.sch.id',
      nip: '197805122002122001',
      role: 'ADMIN',
      position: 'Kepala Sekolah & Penanggung Jawab',
      phone: '0812-3888-9901',
      avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    },
    {
      id: '2',
      name: 'Ibu Yuliana Nardi, S.Pd.',
      email: 'yuliana.nardi@tkkinviolata.sch.id',
      nip: '198804152014022003',
      role: 'GURU',
      position: 'Guru Kelompok A (TK-A)',
      phone: '0813-3922-3344',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    },
  ];

  const handleNavClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6f9] select-none">
      {/* ================= 1. UPPER NAVBAR ================= */}
      <header className="sticky top-0 z-30 flex flex-col shadow-md">
        {/* Upper Blue Bar */}
        <div className="bg-[#0088cc] text-white h-12 px-3 sm:px-4 flex items-center justify-between">
          {/* Left: Brand Logo & Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <AbsenKuLogo size="sm" variant="light" showSubtitle={false} />
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded hover:bg-white/15 text-white/90 transition ml-1"
              title="Sembunyikan / Tampilkan Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Mode Toggles, Demo Account Switcher & Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
            {/* Mobile App View Toggle Button */}
            <button
              onClick={() => {
                if (onSwitchToMobile) {
                  onSwitchToMobile();
                } else {
                  setShowMobileMockup(true);
                }
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition bg-white/15 hover:bg-amber-400 hover:text-slate-900 text-white"
              title="Buka tampilan HP (Mobile View) seperti di aplikasi smartphone"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Tampilan HP</span>
            </button>

            {/* Interactive Demo Account Switcher */}
            <DemoAccountSelector
              currentUser={user}
              users={effectiveUsers}
              onSelectUser={(selected) => onSelectUser && onSelectUser(selected)}
            />

            {/* Logout button returning to Login Panel */}
            <button
              onClick={onLogout}
              className="bg-white/15 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              title="Keluar ke Panel Login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Subheader Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold tracking-wider text-slate-700 uppercase">
            <GraduationCap className="w-4 h-4 text-[#0088cc]" />
            <span>SISTEM PRESENSI ONLINE TKK INVIOLATA</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
            <Building2 className="w-3.5 h-3.5 text-[#0088cc]" />
            <span>TKK Inviolata Ruteng</span>
          </div>
        </div>
      </header>

      {/* ================= 2. BODY: SIDEBAR + MAIN CONTENT ================= */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-[#1a2530] text-slate-300 w-60 shrink-0 transition-all duration-300 flex flex-col border-r border-slate-800 ${
            isSidebarOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="py-2.5 flex-1">
            {/* User Role Badge */}
            <div className="px-4 py-2 mb-1">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-slate-400">Hak Akses:</span>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Admin Utama (Penuh)
                </span>
              </div>
            </div>

            {/* Dashboard Beranda Utama */}
            <button
              onClick={() => handleNavClick('monitoring')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeTab === 'monitoring'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-300 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-[#0088cc]" />
                <span>Dashboard Admin Utama</span>
              </div>
            </button>

            {/* Kelola Penuh Admin Header */}
            <div className="my-1.5 border-t border-slate-800/80 mx-3"></div>
            <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Kelola Penuh Admin
            </div>

            {/* Menu: Rekap Absensi Excel with Dropdown Segitiga */}
            <ExcelReportDropdown
              records={records}
              activeTab={activeTab}
              onNavigateToReport={(preset) => {
                if (onSelectReportPreset) {
                  onSelectReportPreset(preset);
                }
                handleNavClick('laporan');
              }}
              variant="sidebar"
            />

            {/* Menu: Data Guru & Pegawai */}
            <button
              onClick={() => handleNavClick('pengguna')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeTab === 'pengguna'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-300 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Data Guru & Pegawai</span>
              </div>
            </button>

            {/* Menu: Lokasi GPS & Jam Sekolah */}
            <button
              onClick={() => handleNavClick('geofence')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeTab === 'geofence'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-300 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>Lokasi GPS & Jam Sekolah</span>
              </div>
            </button>

            {/* Menu: Persetujuan Izin & Kunci */}
            <button
              onClick={() => handleNavClick('izin')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeTab === 'izin'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-300 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Persetujuan Izin & Kunci</span>
              </div>
            </button>

            {/* Menu: Pengumuman Sekolah */}
            <button
              onClick={() => handleNavClick('pengumuman')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeTab === 'pengumuman'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-300 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>Pengumuman Sekolah</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Menu: Keluar ke Panel Login */}
            <div className="my-1.5 border-t border-slate-800/80 mx-3"></div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium hover:bg-[#202d3b] transition border-l-4 border-transparent text-cyan-400"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-cyan-400" />
                <span>Keluar ke Panel Login</span>
              </div>
            </button>
          </div>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-400">
            <p className="font-bold text-slate-300">TKK Inviolata Ruteng</p>
            <p>Kec. Langke Rembong, Kab. Manggarai, NTT</p>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          {children}
        </main>
      </div>

      {/* ================= 3. MOBILE MOCKUP MODAL ================= */}
      {showMobileMockup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-md w-full max-h-[96vh] flex flex-col items-center">
            {/* Close Button on Top */}
            <div className="w-full flex justify-between items-center text-white pb-2 px-1">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" />
                Pratinjau Aplikasi Mobile Guru / Pegawai
              </span>
              <button
                onClick={() => setShowMobileMockup(false)}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mockup Component matching ho.png */}
            <div className="w-full overflow-hidden rounded-3xl shadow-2xl border-4 border-slate-700 bg-white">
              <MobileAbsenKuHome
                currentUser={user}
                users={effectiveUsers}
                records={records}
                geofenceConfig={
                  geofenceConfig || {
                    schoolName: 'TKK Inviolata Ruteng',
                    address: 'Jl. Ranaka, Ruteng, Flores, NTT',
                    latitude: -8.616310,
                    longitude: 120.463403,
                    radiusMeters: 50,
                    checkInStartTime: '06:30',
                    checkInDeadlineTime: '07:15',
                    checkOutStartTime: '00:00',
                    checkOutEndTime: '02:00',
                    adminContactPhone: '0812-3888-9901',
                    adminContactName: 'Sr. Maria Inviolata, S.Pd.',
                    antiFakeGpsEnabled: true,
                    maxAllowedAccuracyMeters: 50,
                  }
                }
                onLogout={onLogout}
                onRecordAttendance={(rec) => {
                  if (onRecordAttendance) onRecordAttendance(rec);
                }}
                onOpenDesktopView={() => setShowMobileMockup(false)}
                onNavigateTab={(tab, preset) => {
                  setShowMobileMockup(false);
                  if (preset && onSelectReportPreset) {
                    onSelectReportPreset(preset);
                  }
                  if (onTabChange) onTabChange(tab);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
