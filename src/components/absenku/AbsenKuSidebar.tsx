import React from 'react';
import {
  Bell,
  FileText,
  ChevronRight,
  Sliders,
  Users,
  ShieldAlert,
  LogOut,
  Camera,
  LayoutDashboard,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../../types';

export type AbsenKuMenuItem =
  | 'dashboard'
  | 'informasi'
  | 'laporan'
  | 'master-data'
  | 'pengaturan-absensi'
  | 'pengaturan-profile'
  | 'permohonan-kunci'
  | 'kamera-presensi'
  | 'ajukan-izin'
  | 'login-panel';

interface AbsenKuSidebarProps {
  isOpen: boolean;
  activeItem: AbsenKuMenuItem;
  onSelectItem: (item: AbsenKuMenuItem) => void;
  currentUser?: User;
}

export const AbsenKuSidebar: React.FC<AbsenKuSidebarProps> = ({
  isOpen,
  activeItem,
  onSelectItem,
  currentUser,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <aside
      className={`bg-[#1a2530] text-slate-300 w-60 shrink-0 transition-all duration-300 flex flex-col min-h-[calc(100vh-5.5rem)] border-r border-slate-800 ${
        isOpen ? 'block' : 'hidden lg:block'
      }`}
    >
      <div className="py-2">
        {/* User Role Badge in Sidebar */}
        <div className="px-4 py-2 mb-1">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-slate-400">Hak Akses:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                isAdmin
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              }`}
            >
              {isAdmin ? 'Admin Utama (Penuh)' : 'Guru & Pegawai'}
            </span>
          </div>
        </div>

        {/* Dashboard Beranda */}
        <button
          onClick={() => onSelectItem('dashboard')}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
            activeItem === 'dashboard'
              ? 'bg-[#243342] text-white border-[#0088cc]'
              : 'hover:bg-[#202d3b] text-slate-300 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-4 h-4 text-[#0088cc]" />
            <span>{isAdmin ? 'Dashboard Admin Utama' : 'Dashboard Presensi Saya'}</span>
          </div>
        </button>

        {/* Guru & Pegawai Specific Actions */}
        {!isAdmin && (
          <>
            <div className="my-1.5 border-t border-slate-800/80 mx-3"></div>
            <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Aktivitas Presensi
            </div>

            {/* Menu Item: Kamera Presensi Selfie */}
            <button
              onClick={() => onSelectItem('kamera-presensi')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeItem === 'kamera-presensi'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-300 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Kamera Presensi Mobile</span>
              </div>
            </button>

            {/* Menu Item: Ajukan Izin & Dispensasi */}
            <button
              onClick={() => onSelectItem('ajukan-izin')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeItem === 'ajukan-izin'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-300 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Ajukan Izin & Dispensasi</span>
              </div>
            </button>
          </>
        )}

        {/* Admin Utama Exclusive Management Menus */}
        {isAdmin && (
          <>
            <div className="my-1.5 border-t border-slate-800/80 mx-3"></div>
            <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Kelola Penuh Admin
            </div>

            {/* Menu Item: Rekap Absensi Guru */}
            <button
              onClick={() => onSelectItem('laporan')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeItem === 'laporan'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-300 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Rekap Absensi Excel</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Menu Item: Data Guru & Pegawai */}
            <button
              onClick={() => onSelectItem('master-data')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeItem === 'master-data'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-400 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Data Guru & Pegawai</span>
              </div>
            </button>

            {/* Menu Item: Lokasi GPS & Jam Sekolah */}
            <button
              onClick={() => onSelectItem('pengaturan-absensi')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeItem === 'pengaturan-absensi'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-400 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span>Lokasi GPS & Jam Sekolah</span>
              </div>
            </button>

            {/* Menu Item: Dispensasi & Buka Kunci */}
            <button
              onClick={() => onSelectItem('permohonan-kunci')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
                activeItem === 'permohonan-kunci'
                  ? 'bg-[#243342] text-white border-[#0088cc]'
                  : 'hover:bg-[#202d3b] text-slate-400 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Persetujuan Izin & Kunci</span>
              </div>
            </button>
          </>
        )}

        {/* Common Menu Item: Pengumuman Sekolah */}
        <div className="my-1.5 border-t border-slate-800/80 mx-3"></div>
        <button
          onClick={() => onSelectItem('informasi')}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
            activeItem === 'informasi'
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

        {/* Menu Item: Panel Login */}
        <div className="my-1.5 border-t border-slate-800/80 mx-3"></div>
        <button
          onClick={() => onSelectItem('login-panel')}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
            activeItem === 'login-panel'
              ? 'bg-[#243342] text-white border-[#0088cc]'
              : 'hover:bg-[#202d3b] text-slate-400 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-cyan-400" />
            <span>Keluar ke Panel Login</span>
          </div>
        </button>
      </div>

      {/* Footer Tag for TKK Inviolata */}
      <div className="mt-auto p-4 border-t border-slate-800 text-[10px] text-slate-400">
        <p className="font-bold text-slate-300">TKK Inviolata Ruteng</p>
        <p>Kec. Langke Rembong, Kab. Manggarai, NTT</p>
      </div>
    </aside>
  );
};
