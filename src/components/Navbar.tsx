import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import {
  School,
  Clock,
  LogOut,
  ChevronDown,
  UserCheck,
  Shield,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
  schoolName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onLogout,
  schoolName,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'GURU':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PEGAWAI':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">
                SI-ABSEN TK
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">
                GPS + Selfie
              </span>
            </div>
            <p className="text-slate-500 text-[11px] font-medium leading-tight">
              {schoolName}
            </p>
          </div>
        </div>

        {/* Center: Live Digital Clock */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-mono font-bold text-slate-800 tracking-wider">
            {timeStr} WIB
          </span>
        </div>

        {/* Right: User Profile & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl hover:bg-slate-100 border border-slate-200 transition"
              title="Ganti Peran / Akun Pengguna"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover border border-slate-200"
              />
              <div className="text-left hidden sm:block">
                <p className="font-bold text-slate-900 text-xs leading-tight">
                  {currentUser.name.split(',')[0]}
                </p>
                <span
                  className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                    currentUser.role
                  )}`}
                >
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Pilih Peran Demo untuk Evaluasi:
                  </p>
                </div>

                <div className="py-1 space-y-1 max-h-60 overflow-y-auto">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${
                        u.id === currentUser.id
                          ? 'bg-emerald-50 text-emerald-900 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-7 h-7 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold text-xs leading-tight">
                          {u.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {u.position}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${getRoleBadgeStyle(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
