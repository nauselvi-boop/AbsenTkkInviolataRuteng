import React from 'react';
import {
  Users,
  CalendarDays,
  FileBarChart,
  Megaphone,
  Fingerprint,
  GraduationCap,
} from 'lucide-react';

interface ActionMenuGridProps {
  onOpenMasterData: () => void;
  onOpenJadwalSentra: () => void;
  onOpenLaporan: () => void;
  onOpenInformasiUmum: () => void;
  onOpenPengaturanAbsensi: () => void;
  onOpenPengaturanProfile: () => void;
}

export const ActionMenuGrid: React.FC<ActionMenuGridProps> = ({
  onOpenMasterData,
  onOpenJadwalSentra,
  onOpenLaporan,
  onOpenInformasiUmum,
  onOpenPengaturanAbsensi,
  onOpenPengaturanProfile,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
      {/* 1. DATA GURU & PEGAWAI (Blue) */}
      <button
        onClick={onOpenMasterData}
        className="flex items-center gap-3 p-1.5 pr-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 text-left group"
      >
        <div className="w-12 h-12 rounded-lg bg-[#0088cc] group-hover:bg-[#0077b5] flex items-center justify-center text-white shrink-0 shadow-xs transition">
          <Users className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-slate-700 text-xs sm:text-sm tracking-wider uppercase">
            DATA GURU & PEGAWAI
          </span>
          <p className="text-[10px] text-slate-400 truncate">
            Pendidik & Tenaga Kependidikan TKK
          </p>
        </div>
      </button>

      {/* 2. JADWAL SENTRA & KBM (Purple) */}
      <button
        onClick={onOpenJadwalSentra}
        className="flex items-center gap-3 p-1.5 pr-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 text-left group"
      >
        <div className="w-12 h-12 rounded-lg bg-[#8e44ad] group-hover:bg-[#7d3c98] flex items-center justify-center text-white shrink-0 shadow-xs transition">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-slate-700 text-xs sm:text-sm tracking-wider uppercase">
            JADWAL SENTRA & KBM
          </span>
          <p className="text-[10px] text-slate-400 truncate">
            Sentra Balok, Alam, Seni & Rohani
          </p>
        </div>
      </button>

      {/* 3. REKAP ABSENSI TK (Red) */}
      <button
        onClick={onOpenLaporan}
        className="flex items-center gap-3 p-1.5 pr-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 text-left group"
      >
        <div className="w-12 h-12 rounded-lg bg-[#e74c3c] group-hover:bg-[#c0392b] flex items-center justify-center text-white shrink-0 shadow-xs transition">
          <FileBarChart className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-slate-700 text-xs sm:text-sm tracking-wider uppercase">
            REKAP ABSENSI TK
          </span>
          <p className="text-[10px] text-slate-400 truncate">
            Laporan Kehadiran & Unduh Excel
          </p>
        </div>
      </button>

      {/* 4. PENGUMUMAN SEKOLAH (Orange) */}
      <button
        onClick={onOpenInformasiUmum}
        className="flex items-center gap-3 p-1.5 pr-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 text-left group"
      >
        <div className="w-12 h-12 rounded-lg bg-[#f39c12] group-hover:bg-[#d68910] flex items-center justify-center text-white shrink-0 shadow-xs transition">
          <Megaphone className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-slate-700 text-xs sm:text-sm tracking-wider uppercase">
            PENGUMUMAN SEKOLAH
          </span>
          <p className="text-[10px] text-slate-400 truncate">
            Agenda Kegiatan & Informasi TKK
          </p>
        </div>
      </button>

      {/* 5. LOKASI & JAM KERJA (Green) */}
      <button
        onClick={onOpenPengaturanAbsensi}
        className="flex items-center gap-3 p-1.5 pr-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 text-left group"
      >
        <div className="w-12 h-12 rounded-lg bg-[#27ae60] group-hover:bg-[#229954] flex items-center justify-center text-white shrink-0 shadow-xs transition">
          <Fingerprint className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-slate-700 text-xs sm:text-sm tracking-wider uppercase">
            LOKASI & JAM KERJA
          </span>
          <p className="text-[10px] text-slate-400 truncate">
            Geofence GPS TKK Inviolata & Jadwal
          </p>
        </div>
      </button>

      {/* 6. PROFIL TKK INVIOLATA (Magenta/Pink) */}
      <button
        onClick={onOpenPengaturanProfile}
        className="flex items-center gap-3 p-1.5 pr-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 text-left group"
      >
        <div className="w-12 h-12 rounded-lg bg-[#d81b60] group-hover:bg-[#c2185b] flex items-center justify-center text-white shrink-0 shadow-xs transition">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-slate-700 text-xs sm:text-sm tracking-wider uppercase">
            PROFIL TKK INVIOLATA
          </span>
          <p className="text-[10px] text-slate-400 truncate">
            Data Lembaga & Pengelola Sekolah
          </p>
        </div>
      </button>
    </div>
  );
};
