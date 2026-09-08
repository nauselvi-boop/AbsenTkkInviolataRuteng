import React, { useState } from 'react';
import {
  Menu,
  X,
  Megaphone,
  MessageSquare,
  LogOut,
  Calendar,
  FileSpreadsheet,
  Users,
  Sliders,
  ShieldCheck,
  Building2,
  ChevronRight,
  Download,
  CreditCard,
  Camera,
  CheckCircle2,
  ArrowLeft,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  Briefcase,
  Monitor,
} from 'lucide-react';
import { User, AttendanceRecord, GeofenceConfig } from '../../types';
import {
  exportAttendanceDaily,
  exportAttendanceWeekly,
  exportAttendanceMonthly,
  exportAttendanceToExcel,
} from '../../utils/excelUtils';
import { CameraAttendanceModal } from './CameraAttendanceModal';

interface MobileAbsenKuHomeProps {
  currentUser: User;
  users: User[];
  records: AttendanceRecord[];
  geofenceConfig: GeofenceConfig;
  onLogout: () => void;
  onRecordAttendance: (record: AttendanceRecord) => void;
  onOpenDesktopView?: () => void;
  onNavigateTab?: (tab: string, preset?: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL') => void;
}

export const MobileAbsenKuHome: React.FC<MobileAbsenKuHomeProps> = ({
  currentUser,
  users,
  records,
  geofenceConfig,
  onLogout,
  onRecordAttendance,
  onOpenDesktopView,
  onNavigateTab,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [excelSubmenuOpen, setExcelSubmenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'none' | 'informasi' | 'diskusi' | 'gaji' | 'rekap-mobile'
  >('none');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedAbsenType, setSelectedAbsenType] = useState<'MASUK' | 'PULANG'>('MASUK');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = records.find(
    (r) => r.userId === currentUser.id && r.date === todayStr
  );

  const handleExport = (type: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL') => {
    if (type === 'TODAY') {
      exportAttendanceDaily(records);
      setDownloadNotice('Rekap Harian');
    } else if (type === 'WEEK') {
      exportAttendanceWeekly(records);
      setDownloadNotice('Rekap Mingguan');
    } else if (type === 'MONTH') {
      exportAttendanceMonthly(records);
      setDownloadNotice('Rekap Bulanan');
    } else {
      exportAttendanceToExcel(records);
      setDownloadNotice('Semua Rekap');
    }

    setTimeout(() => setDownloadNotice(null), 2500);
  };

  const handleOpenAttendance = () => {
    // If not checked in yet, default to MASUK; otherwise PULANG
    if (!todayRecord || !todayRecord.checkInTime) {
      setSelectedAbsenType('MASUK');
    } else {
      setSelectedAbsenType('PULANG');
    }
    setIsCameraOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col justify-between select-none relative font-sans max-w-md mx-auto shadow-2xl border-x border-slate-200">
      {/* 1. TOP MOBILE HEADER with Blue Gradient Waves and Absenku Logo */}
      <header className="relative bg-gradient-to-b from-[#0077c8] via-[#0088cc] to-[#0099e6] text-white pt-2 pb-7 px-4 shadow-md overflow-hidden">
        {/* Background Decorative Tech Waves / Curved Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
          <svg
            className="w-full h-full scale-125 object-cover"
            viewBox="0 0 400 200"
            fill="none"
          >
            <path
              d="M-50 40 C100 120 250 -20 450 60 L450 220 L-50 220 Z"
              fill="white"
              fillOpacity="0.15"
            />
            <path
              d="M-20 80 C120 180 280 20 480 110 L480 220 L-20 220 Z"
              fill="white"
              fillOpacity="0.2"
            />
            <path
              d="M0 0 L400 200 M50 -20 L450 180 M-30 40 L370 240"
              stroke="white"
              strokeWidth="1.5"
              strokeOpacity="0.15"
            />
          </svg>
        </div>

        {/* Top Bar: Hamburger Menu Button & Quick Status */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 -ml-1 text-white hover:bg-white/20 active:bg-white/30 rounded-lg transition"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>

          {onOpenDesktopView && (
            <button
              onClick={onOpenDesktopView}
              className="flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 text-white font-medium px-2 py-1 rounded-full transition backdrop-blur-xs"
              title="Beralih ke tampilan desktop admin penuh"
            >
              <Monitor className="w-3 h-3" />
              <span>Mode Desktop</span>
            </button>
          )}
        </div>

        {/* Center: Logo absenku Professional (Exact match to uploaded image ho.png) */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-2 pb-1">
          {/* Fingerprint / Spiral Icon */}
          <div className="w-16 h-16 mb-1.5 flex items-center justify-center drop-shadow-md">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
              {/* Outer Spiral Loop */}
              <path
                d="M50 10 C72 10 90 28 90 50 C90 72 72 90 50 90 C28 90 10 72 10 50 C10 36 17 24 28 17"
                stroke="#ffffff"
                strokeWidth="8.5"
                strokeLinecap="round"
              />
              {/* Middle Spiral */}
              <path
                d="M32 30 C37 25 43 22 50 22 C65 22 78 35 78 50 C78 65 65 78 50 78 C35 78 22 65 22 50"
                stroke="#e0f2fe"
                strokeWidth="8.5"
                strokeLinecap="round"
              />
              {/* Center Spiral */}
              <path
                d="M36 50 C36 42 42 36 50 36 C58 36 64 42 64 50 C64 58 58 64 50 64 C44 64 40 60 40 54 C40 48 45 44 50 44"
                stroke="#ffffff"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* absenku Text */}
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-baseline drop-shadow-sm font-sans">
            absenku
          </h1>

          {/* Professional Subtitle */}
          <span className="text-xs font-normal text-white/95 tracking-wide -mt-0.5 font-sans">
            Professional
          </span>
        </div>
      </header>

      {/* 2. MAIN CONTENT: 4 Large Square Feature Buttons (2x2 Grid) */}
      <main className="flex-1 px-5 py-6 flex flex-col justify-center">
        {/* Toast Download Notice */}
        {downloadNotice && (
          <div className="mb-4 p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{downloadNotice} berhasil diunduh (.xlsx)!</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 w-full">
          {/* Card 1: ABSENSI (Blue circular icon) */}
          <button
            onClick={handleOpenAttendance}
            className="bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition group aspect-square"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1565c0] flex items-center justify-center text-white mb-2.5 shadow-md group-hover:scale-105 transition">
              {/* Attendance icon: Calendar + Clock / Check */}
              <div className="relative">
                <Calendar className="w-7 h-7 sm:w-8 sm:h-8" />
                <Clock className="w-4 h-4 absolute -bottom-1 -right-1 bg-[#1565c0] rounded-full p-0.5 text-amber-300" />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-black tracking-wider text-slate-800 uppercase">
              ABSENSI
            </span>
          </button>

          {/* Card 2: INFORMASI (Green circular icon) */}
          <button
            onClick={() => setActiveModal('informasi')}
            className="bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition group aspect-square"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#2e7d32] flex items-center justify-center text-white mb-2.5 shadow-md group-hover:scale-105 transition">
              <Megaphone className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-xs sm:text-sm font-black tracking-wider text-slate-800 uppercase">
              INFORMASI
            </span>
          </button>

          {/* Card 3: DISKUSI (Red circular icon) */}
          <button
            onClick={() => setActiveModal('diskusi')}
            className="bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition group aspect-square"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#d32f2f] flex items-center justify-center text-white mb-2.5 shadow-md group-hover:scale-105 transition">
              <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-xs sm:text-sm font-black tracking-wider text-slate-800 uppercase">
              DISKUSI
            </span>
          </button>

          {/* Card 4: INFORMASI GAJI (Orange circular icon) */}
          <button
            onClick={() => setActiveModal('gaji')}
            className="bg-white hover:bg-slate-50 active:scale-95 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition group aspect-square"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#f57c00] flex items-center justify-center text-white mb-2.5 shadow-md group-hover:scale-105 transition">
              <CreditCard className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-xs sm:text-sm font-black tracking-wider text-slate-800 uppercase">
              INFORMASI GAJI
            </span>
          </button>
        </div>

        {/* 3. WIDE AMBER/YELLOW EXIT BUTTON: KELUAR */}
        <div className="mt-7 w-full">
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 bg-[#ff9800] hover:bg-[#f57c00] active:bg-[#e65100] text-white font-bold text-sm tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-98"
          >
            <LogOut className="w-5 h-5 rotate-180" />
            <span>KELUAR</span>
          </button>
        </div>
      </main>

      {/* 4. SOLID BLUE FOOTER BAR (Exact Match to uploaded image ho.png) */}
      <footer className="bg-[#0077c8] text-white py-2.5 px-4 text-center">
        <p className="text-[11px] font-semibold tracking-wide text-white/95">
          Design &amp; Mobile Sensing by Absenku
        </p>
      </footer>

      {/* ================= SLIDE-OVER MOBILE DRAWER ================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[80vw] bg-[#1a2229] text-slate-200 h-full flex flex-col z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-[#243342] border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    currentUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
                  }
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-white/20"
                />
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white truncate">
                    {currentUser.name}
                  </h4>
                  <p className="text-[10px] text-amber-400 font-mono">
                    {currentUser.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation List */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-slate-800 text-xs">
              <div className="py-1">
                {/* Beranda Mobile */}
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-white font-semibold bg-[#243342]"
                >
                  <Building2 className="w-4 h-4 text-[#0088cc]" />
                  <span>Beranda Mobile</span>
                </button>

                {/* Buka Kamera Presensi */}
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    handleOpenAttendance();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-[#202d3b] hover:text-white"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Ambil Presensi Selfie</span>
                </button>
              </div>

              {/* SECTION: REKAP ABSENSI EXCEL (WITH HARIAN, MINGGUAN, BULANAN) */}
              <div className="py-1">
                <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Laporan &amp; Rekap Excel
                </div>

                {/* Parent Menu Item */}
                <div className="w-full">
                  <button
                    onClick={() => setExcelSubmenuOpen(!excelSubmenuOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-slate-200 hover:bg-[#202d3b] hover:text-white font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Rekap Absensi Excel</span>
                    </div>
                    {/* Icon Segitiga */}
                    <svg
                      className={`w-3 h-3 text-amber-400 transition-transform ${
                        excelSubmenuOpen ? 'rotate-90' : ''
                      }`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="6,4 18,12 6,20" />
                    </svg>
                  </button>

                  {/* Submenu Accordion */}
                  {excelSubmenuOpen && (
                    <div className="bg-[#12181f] py-1 pl-8 pr-3 space-y-1 text-[11px] border-l-2 border-[#0088cc] ml-4 my-1">
                      {/* Rekap Harian */}
                      <div
                        onClick={() => {
                          setDrawerOpen(false);
                          if (onNavigateTab) onNavigateTab('laporan', 'TODAY');
                          handleExport('TODAY');
                        }}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          Rekap Harian
                        </span>
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                      </div>

                      {/* Rekap Mingguan */}
                      <div
                        onClick={() => {
                          setDrawerOpen(false);
                          if (onNavigateTab) onNavigateTab('laporan', 'WEEK');
                          handleExport('WEEK');
                        }}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          Rekap Mingguan
                        </span>
                        <Download className="w-3.5 h-3.5 text-sky-400" />
                      </div>

                      {/* Rekap Bulanan */}
                      <div
                        onClick={() => {
                          setDrawerOpen(false);
                          if (onNavigateTab) onNavigateTab('laporan', 'MONTH');
                          handleExport('MONTH');
                        }}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                          Rekap Bulanan
                        </span>
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ADMIN FEATURES IF ROLE IS ADMIN */}
              {currentUser.role === 'ADMIN' && (
                <div className="py-1">
                  <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Kelola Admin
                  </div>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      if (onNavigateTab) onNavigateTab('pengguna');
                      else if (onOpenDesktopView) onOpenDesktopView();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-[#202d3b] hover:text-white"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Data Guru &amp; Pegawai</span>
                  </button>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      if (onNavigateTab) onNavigateTab('geofence');
                      else if (onOpenDesktopView) onOpenDesktopView();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-[#202d3b] hover:text-white"
                  >
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span>Lokasi GPS &amp; Jam</span>
                  </button>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      if (onNavigateTab) onNavigateTab('izin');
                      else if (onOpenDesktopView) onOpenDesktopView();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-[#202d3b] hover:text-white"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Persetujuan Izin</span>
                  </button>
                </div>
              )}

              {/* OTHER ITEMS */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setActiveModal('informasi');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-[#202d3b] hover:text-white"
                >
                  <Megaphone className="w-4 h-4 text-slate-400" />
                  <span>Pengumuman Sekolah</span>
                </button>

                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setActiveModal('diskusi');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-[#202d3b] hover:text-white"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Forum Guru</span>
                </button>

                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setActiveModal('gaji');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-[#202d3b] hover:text-white"
                >
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Informasi Gaji</span>
                </button>
              </div>

              {/* Mode Desktop & Logout */}
              <div className="py-2">
                {onOpenDesktopView && (
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenDesktopView();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sky-400 hover:bg-[#202d3b]"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Buka Tampilan Desktop Penuh</span>
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-[#202d3b]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INFORMASI ================= */}
      {activeModal === 'informasi' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-[#2e7d32] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                <h3 className="font-bold text-sm">Informasi &amp; Pengumuman</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto text-xs text-slate-700">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">
                  Agenda Sekolah
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                  Doa Bersama &amp; Pertemuan Sentra TK
                </h4>
                <p className="mt-1 text-slate-600">
                  Seluruh guru TK-A dan TK-B diharapkan hadir tepat pukul 06.45 WITA untuk apel pagi dan pengarahan di aula TKK Inviolata Ruteng.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Pemberitahuan
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                  Rekapitulasi Presensi Bulanan
                </h4>
                <p className="mt-1 text-slate-600">
                  Data absensi bulan ini telah divalidasi oleh sistem GPS geofence sekolah. Mohon pastikan foto selfie datang dan pulang selalu tervalidasi.
                </p>
              </div>
            </div>
            <div className="p-3 bg-slate-100 border-t border-slate-200 text-right">
              <button
                onClick={() => setActiveModal('none')}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DISKUSI ================= */}
      {activeModal === 'diskusi' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="bg-[#d32f2f] text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-bold text-sm">Forum Diskusi Guru</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                <span className="font-bold text-slate-800">Sr. Maria (Kepala Sekolah):</span>
                <p className="mt-0.5 text-slate-700">
                  Selamat pagi Ibu-Ibu Guru. Mohon periksa kelengkapan alat bermain sentra balok dan seni hari ini.
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">06:45 WITA</span>
              </div>
              <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl ml-4">
                <span className="font-bold text-slate-800">Ibu Yuliana Nardi:</span>
                <p className="mt-0.5 text-slate-700">
                  Siap Suster, anak-anak TK-A sudah bersiap untuk bernyanyi rohani dan menggambar bebas.
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">06:52 WITA</span>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 text-right">
              <button
                onClick={() => setActiveModal('none')}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Tutup Diskusi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INFORMASI GAJI ================= */}
      {activeModal === 'gaji' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-[#f57c00] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-bold text-sm">Informasi Gaji &amp; Tunjangan</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Penerima:</span>
                  <span className="font-bold text-slate-800">{currentUser.name}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-500 font-medium">Jabatan:</span>
                  <span className="text-slate-700">{currentUser.position}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-slate-500 font-medium">NIP:</span>
                  <span className="font-mono text-slate-700">{currentUser.nip}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                <div className="p-2.5 flex items-center justify-between bg-slate-50 font-bold">
                  <span>Periode Bulan Ini</span>
                  <span className="text-emerald-700">TERPROSES</span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">Gaji Pokok / Honor Yayasan</span>
                  <span className="font-semibold text-slate-800">Rp 2.850.000</span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">Tunjangan Kehadiran Penuh</span>
                  <span className="font-semibold text-slate-800">Rp 500.000</span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">Tunjangan Jabatan Sentra</span>
                  <span className="font-semibold text-slate-800">Rp 350.000</span>
                </div>
                <div className="p-2.5 flex items-center justify-between bg-amber-50/60 font-bold text-slate-900">
                  <span>Total Diterima</span>
                  <span className="text-amber-800 font-bold text-sm">Rp 3.700.000</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * Slip gaji resmi diterbitkan oleh Bagian Keuangan Yayasan Persekolahan TKK Inviolata Ruteng.
              </p>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 text-right">
              <button
                onClick={() => setActiveModal('none')}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA ATTENDANCE MODAL FOR MOBILE */}
      <CameraAttendanceModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        currentUser={currentUser}
        users={users}
        geofenceConfig={geofenceConfig}
        initialType={selectedAbsenType}
        onRecordAttendance={(rec) => {
          onRecordAttendance(rec);
          setIsCameraOpen(false);
          setDownloadNotice(`Presensi ${selectedAbsenType} Berhasil!`);
        }}
        unlockRequests={[]}
        onRequestUnlock={() => {}}
      />
    </div>
  );
};
