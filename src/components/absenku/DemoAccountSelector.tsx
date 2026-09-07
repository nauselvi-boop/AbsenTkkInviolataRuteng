import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import {
  User as UserIcon,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  ChevronDown,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface DemoAccountSelectorProps {
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
}

export const DemoAccountSelector: React.FC<DemoAccountSelectorProps> = ({
  currentUser,
  users,
  onSelectUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Quick Demo Accounts
  const adminUser = users.find((u) => u.role === 'ADMIN') || users[0];
  const guruUser = users.find((u) => u.role === 'GURU') || users[1];
  const pegawaiUser = users.find((u) => u.role === 'PEGAWAI') || users[4] || users[0];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return {
          bg: 'bg-amber-400 text-slate-900 border-amber-500',
          label: 'Admin Utama',
          icon: <ShieldCheck className="w-3 h-3 text-slate-900" />,
        };
      case 'GURU':
        return {
          bg: 'bg-sky-100 text-sky-800 border-sky-300',
          label: 'Guru TK',
          icon: <GraduationCap className="w-3 h-3 text-sky-700" />,
        };
      case 'PEGAWAI':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          label: 'Pegawai TU',
          icon: <Briefcase className="w-3 h-3 text-emerald-700" />,
        };
    }
  };

  const activeBadge = getRoleBadge(currentUser.role);

  return (
    <div className="relative">
      {/* Trigger Button in Navbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-black/20 hover:bg-black/30 border border-white/20 px-2.5 py-1 rounded-lg text-white transition shadow-xs group"
        title="Klik untuk ganti akun demo (Admin, Guru, Pegawai)"
      >
        <div className="relative">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-6 h-6 rounded-full object-cover border border-white/40"
          />
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[11px] font-bold leading-tight flex items-center gap-1">
            {currentUser.name.split(',')[0]}
          </span>
          <span className="text-[9px] text-amber-300 font-semibold tracking-wide uppercase flex items-center gap-1">
            {activeBadge.label}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-white/70 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-2">
            {/* Header */}
            <div className="bg-slate-900 text-white p-3.5 px-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 tracking-wider uppercase block">
                  Pilihan Akun Demo
                </span>
                <h4 className="font-bold text-xs text-slate-100">
                  Pilih Peran untuk Pengujian Sistem
                </h4>
              </div>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>

            {/* Quick 3 Roles */}
            <div className="p-3 space-y-2 border-b border-slate-100 bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                Akun Demo Utama:
              </span>

              {/* 1. Admin Utama */}
              <button
                onClick={() => {
                  onSelectUser(adminUser);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                  currentUser.id === adminUser.id
                    ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                    : 'bg-white hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">
                        {adminUser.name}
                      </span>
                      <span className="text-[9px] bg-amber-400 text-slate-900 font-extrabold px-1.5 py-0.2 rounded">
                        Admin
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Kelola batas jam, GPS, buka kunci & laporan
                    </p>
                  </div>
                </div>
                {currentUser.id === adminUser.id && (
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                )}
              </button>

              {/* 2. Guru TK */}
              <button
                onClick={() => {
                  onSelectUser(guruUser);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                  currentUser.id === guruUser.id
                    ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-400'
                    : 'bg-white hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-800 font-bold">
                    <GraduationCap className="w-4 h-4 text-sky-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">
                        {guruUser.name}
                      </span>
                      <span className="text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded border border-sky-300">
                        Guru
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Presensi masuk & pulang dengan batas waktu
                    </p>
                  </div>
                </div>
                {currentUser.id === guruUser.id && (
                  <Check className="w-4 h-4 text-sky-600 shrink-0" />
                )}
              </button>

              {/* 3. Pegawai TU */}
              <button
                onClick={() => {
                  onSelectUser(pegawaiUser);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                  currentUser.id === pegawaiUser.id
                    ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                    : 'bg-white hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold">
                    <Briefcase className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">
                        {pegawaiUser.name}
                      </span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                        Pegawai
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Presensi staf TU & administrasi sekolah
                    </p>
                  </div>
                </div>
                {currentUser.id === pegawaiUser.id && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>
            </div>

            {/* All Staff List option */}
            <div className="p-3 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Semua Pendidik & Staf ({users.length}):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      setIsOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left text-xs transition ${
                      currentUser.id === u.id
                        ? 'bg-slate-100 font-bold text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">
                      {u.name} ({u.position})
                    </span>
                    {currentUser.id === u.id && (
                      <Check className="w-3.5 h-3.5 text-slate-900 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
