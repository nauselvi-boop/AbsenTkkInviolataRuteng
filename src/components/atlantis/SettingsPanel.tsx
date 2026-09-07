import React from 'react';
import { X, Check, Sliders, Palette, Layout, ShieldCheck, Sparkles } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeThemeColor: string;
  onChangeThemeColor: (color: string) => void;
  activeMode: 'atlantis' | 'absensi';
  onChangeMode: (mode: 'atlantis' | 'absensi') => void;
}

const THEME_COLORS = [
  { name: 'Atlantis Royal Blue', hex: '#1572E8' },
  { name: 'Emerald Kindergarten', hex: '#059669' },
  { name: 'Purple Luxury', hex: '#6861CE' },
  { name: 'Dark Navy', hex: '#1A2035' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  activeThemeColor,
  onChangeThemeColor,
  activeMode,
  onChangeMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#6861CE]/10 text-[#6861CE]">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Template Customizer
                </h3>
                <p className="text-[11px] text-slate-400">
                  Atlantis Bootstrap 4 Dashboard
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-6 text-xs">
            {/* View Mode Selector */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2.5">
                Dashboard Mode:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChangeMode('atlantis')}
                  className={`p-3 rounded-xl border text-left transition ${
                    activeMode === 'atlantis'
                      ? 'border-[#1572E8] bg-blue-50/70 text-[#1572E8] font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-xs">Atlantis Demo</p>
                  <p className="text-[10px] opacity-80 mt-0.5">Sesuai Gambar</p>
                </button>

                <button
                  onClick={() => onChangeMode('absensi')}
                  className={`p-3 rounded-xl border text-left transition ${
                    activeMode === 'absensi'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-xs">Absensi TK</p>
                  <p className="text-[10px] opacity-80 mt-0.5">GPS & Selfie Cam</p>
                </button>
              </div>
            </div>

            {/* Header Color Palette */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2.5">
                Header Theme Color:
              </label>
              <div className="space-y-2">
                {THEME_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => onChangeThemeColor(col.hex)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition ${
                      activeThemeColor === col.hex
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="font-semibold text-slate-800 text-xs">
                        {col.name}
                      </span>
                    </div>
                    {activeThemeColor === col.hex && (
                      <Check className="w-4 h-4 text-slate-900" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Summary Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-600 text-[11px]">
              <div className="flex items-center justify-between font-semibold">
                <span>Versi Template:</span>
                <span className="text-slate-900">Atlantis v1.0.0</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Teknologi:</span>
                <span className="text-slate-900">React 19 + Tailwind CSS</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Fitur Terhubung:</span>
                <span className="text-emerald-700 font-bold">Presensi TK & Excel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
