import React from 'react';
import { AbsenKuLogo } from './AbsenKuLogo';
import { DemoAccountSelector } from './DemoAccountSelector';
import { User, AttendanceUnlockRequest } from '../../types';
import {
  Menu,
  Smartphone,
  Building2,
  GraduationCap,
  ShieldAlert,
  LogOut,
} from 'lucide-react';

interface AbsenKuNavbarProps {
  onToggleSidebar: () => void;
  showMobileMockup: boolean;
  onToggleMobileMockup: () => void;
  companyName: string;
  onUpdateCompanyName: (name: string) => void;
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  unlockRequests: AttendanceUnlockRequest[];
  onOpenUnlockModal: () => void;
  onLogout?: () => void;
}

export const AbsenKuNavbar: React.FC<AbsenKuNavbarProps> = ({
  onToggleSidebar,
  showMobileMockup,
  onToggleMobileMockup,
  companyName,
  onUpdateCompanyName,
  currentUser,
  users,
  onSelectUser,
  unlockRequests,
  onOpenUnlockModal,
  onLogout,
}) => {
  const pendingRequestsCount = unlockRequests.filter(
    (r) => r.status === 'MENUNGGU'
  ).length;

  return (
    <header className="sticky top-0 z-30 flex flex-col shadow-md">
      {/* Upper Blue Bar */}
      <div className="bg-[#0088cc] text-white h-12 px-4 flex items-center justify-between">
        {/* Left: Brand Logo & Hamburger */}
        <div className="flex items-center gap-3">
          <AbsenKuLogo size="sm" variant="light" showSubtitle={false} />
          <button
            onClick={onToggleSidebar}
            className="p-1 rounded hover:bg-white/10 text-white/90 transition ml-1"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Mode Toggles, Demo Account Switcher & Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
          {/* Admin Unlock Request Notification Pill */}
          {currentUser.role === 'ADMIN' && pendingRequestsCount > 0 && (
            <button
              onClick={onOpenUnlockModal}
              className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse transition"
              title={`${pendingRequestsCount} pengajuan keterlambatan menunggu persetujuan`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{pendingRequestsCount} Izin Masuk</span>
            </button>
          )}

          {/* Mobile Preview Toggle Button */}
          <button
            onClick={onToggleMobileMockup}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              showMobileMockup
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {showMobileMockup ? 'Sembunyikan' : 'Aplikasi Mobile'}
            </span>
          </button>

          {/* Interactive Demo Account Switcher (Admin Utama / Guru / Pegawai) */}
          <DemoAccountSelector
            currentUser={currentUser}
            users={users}
            onSelectUser={onSelectUser}
          />

          {/* Logout button returning to Login Panel */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="bg-white/15 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              title="Keluar ke Panel Login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          )}
        </div>
      </div>

      {/* Subheader Bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold tracking-wider text-slate-700 uppercase">
          <GraduationCap className="w-4 h-4 text-[#0088cc]" />
          <span>Sistem Presensi Online TKK Inviolata</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Building2 className="w-3.5 h-3.5 text-[#0088cc]" />
          <input
            type="text"
            value={companyName}
            onChange={(e) => onUpdateCompanyName(e.target.value)}
            className="bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-[#0088cc] focus:outline-none text-right font-bold text-slate-800 text-xs px-1"
          />
        </div>
      </div>
    </header>
  );
};

