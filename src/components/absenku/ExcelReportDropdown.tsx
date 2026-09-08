import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  CalendarRange,
  Download,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { AttendanceRecord } from '../../types';
import {
  exportAttendanceDaily,
  exportAttendanceWeekly,
  exportAttendanceMonthly,
  exportAttendanceToExcel,
} from '../../utils/excelUtils';

interface ExcelReportDropdownProps {
  records: AttendanceRecord[];
  activeTab?: string;
  onNavigateToReport: (preset: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL') => void;
  variant?: 'sidebar' | 'button';
  className?: string;
}

export const ExcelReportDropdown: React.FC<ExcelReportDropdownProps> = ({
  records,
  activeTab,
  onNavigateToReport,
  variant = 'sidebar',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const timeoutRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleDownload = (
    e: React.MouseEvent,
    type: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL'
  ) => {
    e.stopPropagation();
    if (type === 'TODAY') {
      exportAttendanceDaily(records);
      setDownloadSuccess('Rekap Harian');
    } else if (type === 'WEEK') {
      exportAttendanceWeekly(records);
      setDownloadSuccess('Rekap Mingguan');
    } else if (type === 'MONTH') {
      exportAttendanceMonthly(records);
      setDownloadSuccess('Rekap Bulanan');
    } else {
      exportAttendanceToExcel(records);
      setDownloadSuccess('Rekap Keseluruhan');
    }

    setTimeout(() => {
      setDownloadSuccess(null);
      setIsOpen(false);
    }, 1500);
  };

  const handleSelectOption = (
    preset: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL',
    andDownload = false
  ) => {
    onNavigateToReport(preset);
    if (andDownload) {
      if (preset === 'TODAY') exportAttendanceDaily(records);
      else if (preset === 'WEEK') exportAttendanceWeekly(records);
      else if (preset === 'MONTH') exportAttendanceMonthly(records);
      else exportAttendanceToExcel(records);
    }
    setIsOpen(false);
  };

  if (variant === 'button') {
    return (
      <div
        ref={containerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition overflow-hidden">
          <button
            onClick={() => handleSelectOption('ALL')}
            className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs text-slate-700 hover:text-[#0088cc] transition"
            title="Buka Rekap Absensi Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#0088cc]" />
            <span>Unduh Rekap</span>
          </button>
          <button
            onClick={toggleOpen}
            className="px-2 py-1.5 border-l border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
            title="Pilih Rekap Harian, Mingguan, atau Bulanan"
          >
            <svg
              className={`w-3 h-3 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 16l-6-6h12z" />
            </svg>
          </button>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 text-xs">
            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1 text-[#0088cc]">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Pilihan Rekap Excel
              </span>
              <span className="text-[10px] text-slate-400">.xlsx</span>
            </div>

            <div className="p-1 space-y-0.5">
              {/* Rekap Harian */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group cursor-pointer transition">
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={() => handleSelectOption('TODAY')}
                >
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      Rekap Harian
                      <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-normal">
                        Hari Ini
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {todayStr}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDownload(e, 'TODAY')}
                  className="p-1.5 rounded-md hover:bg-emerald-600 hover:text-white text-emerald-600 transition"
                  title="Unduh Excel Rekap Harian"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rekap Mingguan */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group cursor-pointer transition">
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={() => handleSelectOption('WEEK')}
                >
                  <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <CalendarRange className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      Rekap Mingguan
                      <span className="text-[9px] px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded font-normal">
                        7 Hari
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Minggu berjalan
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDownload(e, 'WEEK')}
                  className="p-1.5 rounded-md hover:bg-sky-600 hover:text-white text-sky-600 transition"
                  title="Unduh Excel Rekap Mingguan"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rekap Bulanan */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group cursor-pointer transition">
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={() => handleSelectOption('MONTH')}
                >
                  <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      Rekap Bulanan
                      <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-normal">
                        1 Bulan
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {currentMonthStr}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDownload(e, 'MONTH')}
                  className="p-1.5 rounded-md hover:bg-indigo-600 hover:text-white text-indigo-600 transition"
                  title="Unduh Excel Rekap Bulanan"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {downloadSuccess && (
              <div className="mt-1 mx-2 p-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[10px] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {downloadSuccess} berhasil diunduh!
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Sidebar Menu Item Variant
  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition border-l-4 ${
          activeTab === 'laporan'
            ? 'bg-[#243342] text-white border-[#0088cc]'
            : 'hover:bg-[#202d3b] text-slate-300 border-transparent'
        }`}
      >
        {/* Left: Clicking text opens general reports */}
        <div
          onClick={() => handleSelectOption('ALL')}
          className="flex items-center gap-3 flex-1 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          <span>Rekap Absensi Excel</span>
        </div>

        {/* Right: Triangle (Segitiga) Icon button */}
        <div
          onClick={toggleOpen}
          className="p-1 -mr-1 rounded hover:bg-white/15 text-slate-400 hover:text-amber-400 transition cursor-pointer flex items-center justify-center"
          title="Arahkan kursor atau klik icon segitiga untuk pilihan Rekap Harian, Mingguan & Bulanan"
        >
          {/* Distinct Solid Triangle Icon */}
          <svg
            className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-200 ${
              isOpen ? 'rotate-90 text-amber-300' : 'hover:scale-125'
            }`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <polygon points="6,4 18,12 6,20" />
          </svg>
        </div>
      </div>

      {/* Floating Popover on Hover/Click */}
      {isOpen && (
        <div
          className="absolute left-full top-0 ml-1.5 w-64 bg-[#1e293b] text-slate-100 rounded-xl shadow-2xl border border-slate-700/80 p-2 z-50 animate-in fade-in slide-in-from-left-2 backdrop-blur-md"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="px-2.5 py-1.5 border-b border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wide">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Opsi Rekap Excel</span>
            </div>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              Format .xlsx
            </span>
          </div>

          <div className="mt-1.5 space-y-1">
            {/* 1. Rekap Harian */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 group transition">
              <div
                className="flex items-center gap-2.5 flex-1 cursor-pointer"
                onClick={() => handleSelectOption('TODAY')}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white group-hover:text-emerald-300 flex items-center gap-1.5 transition">
                    Rekap Harian
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-normal">
                      Hari Ini
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {todayStr}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => handleDownload(e, 'TODAY')}
                className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white transition ml-2 shrink-0"
                title="Unduh File Excel Rekap Harian"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Rekap Mingguan */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-sky-500/50 group transition">
              <div
                className="flex items-center gap-2.5 flex-1 cursor-pointer"
                onClick={() => handleSelectOption('WEEK')}
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                  <CalendarRange className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white group-hover:text-sky-300 flex items-center gap-1.5 transition">
                    Rekap Mingguan
                    <span className="text-[9px] px-1.5 py-0.2 bg-sky-500/20 text-sky-300 rounded font-normal">
                      7 Hari
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Minggu berjalan
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => handleDownload(e, 'WEEK')}
                className="p-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white transition ml-2 shrink-0"
                title="Unduh File Excel Rekap Mingguan"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Rekap Bulanan */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 group transition">
              <div
                className="flex items-center gap-2.5 flex-1 cursor-pointer"
                onClick={() => handleSelectOption('MONTH')}
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white group-hover:text-indigo-300 flex items-center gap-1.5 transition">
                    Rekap Bulanan
                    <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-normal">
                      1 Bulan
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentMonthStr}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => handleDownload(e, 'MONTH')}
                className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition ml-2 shrink-0"
                title="Unduh File Excel Rekap Bulanan"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          {downloadSuccess ? (
            <div className="mt-2 p-1.5 bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 rounded text-[10px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{downloadSuccess} terunduh (.xlsx)!</span>
            </div>
          ) : (
            <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Klik nama untuk lihat tabel</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1 cursor-pointer hover:underline" onClick={() => handleSelectOption('ALL')}>
                Buka Semua <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
