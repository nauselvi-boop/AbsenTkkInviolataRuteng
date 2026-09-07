import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  School,
  ShieldCheck,
  Camera,
  MapPin,
  FileSpreadsheet,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface LoginViewProps {
  users: User[];
  onSelectUser: (user: User) => void;
  schoolName: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onSelectUser,
  schoolName,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const found = users.find(
      (u) =>
        u.nip.toLowerCase() === identifier.trim().toLowerCase() ||
        u.email.toLowerCase() === identifier.trim().toLowerCase()
    );

    if (found) {
      onSelectUser(found);
    } else {
      setErrorMsg('NIP atau email tidak ditemukan. Silakan gunakan tombol demo di bawah.');
    }
  };

  const adminUser = users.find((u) => u.role === 'ADMIN') || users[0];
  const guruUser = users.find((u) => u.role === 'GURU') || users[1];
  const pegawaiUser = users.find((u) => u.role === 'PEGAWAI') || users[4];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* App Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/20 mb-4">
          <School className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Website Absensi TK
        </h1>
        <p className="text-sm font-semibold text-emerald-700 mt-0.5">{schoolName}</p>
        <p className="text-xs text-slate-500 mt-1">
          Sistem Absensi Online GPS Geofencing, Live Selfie Liveness, & Manajemen Multi-Role
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200 space-y-6">
          {/* Quick Demo Role Selection (One-Click Testing) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pilih Akun Demo (Akses Cepat):
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Admin Button */}
              {adminUser && (
                <button
                  type="button"
                  onClick={() => onSelectUser(adminUser)}
                  className="flex items-center justify-between p-3 rounded-2xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={adminUser.avatarUrl}
                      alt={adminUser.name}
                      className="w-10 h-10 rounded-xl object-cover border border-purple-300 shrink-0"
                    />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{adminUser.name}</p>
                      <p className="text-[11px] text-purple-800 font-semibold">
                        Role: ADMIN (Akses Penuh & Geofence)
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition" />
                </button>
              )}

              {/* Guru Button */}
              {guruUser && (
                <button
                  type="button"
                  onClick={() => onSelectUser(guruUser)}
                  className="flex items-center justify-between p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={guruUser.avatarUrl}
                      alt={guruUser.name}
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-300 shrink-0"
                    />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{guruUser.name}</p>
                      <p className="text-[11px] text-emerald-800 font-semibold">
                        Role: GURU (Selfie Live + Rekap Pribadi)
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition" />
                </button>
              )}

              {/* Pegawai Button */}
              {pegawaiUser && (
                <button
                  type="button"
                  onClick={() => onSelectUser(pegawaiUser)}
                  className="flex items-center justify-between p-3 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={pegawaiUser.avatarUrl}
                      alt={pegawaiUser.name}
                      className="w-10 h-10 rounded-xl object-cover border border-blue-300 shrink-0"
                    />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{pegawaiUser.name}</p>
                      <p className="text-[11px] text-blue-800 font-semibold">
                        Role: PEGAWAI (Staf TU / Keamanan / Sarpras)
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition" />
                </button>
              )}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase">
              atau masuk dengan NIP
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Form Login Manual */}
          <form onSubmit={handleManualLogin} className="space-y-3.5 text-xs">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium text-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NIP atau Email Terdaftar
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 198804152014022003"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition text-xs flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Masuk ke Akun</span>
            </button>
          </form>

          {/* Features Highlights Checklist */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Validasi GPS Geofence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Selfie Liveness Check</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Anti-Fake GPS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import/Export Excel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
