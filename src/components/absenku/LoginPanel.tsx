import React, { useState, useEffect } from 'react';
import { User as UserType } from '../../types';
import {
  User,
  Lock,
  Check,
  Sparkles,
  Shield,
  GraduationCap,
  Users,
  Phone,
  X,
  Eye,
  EyeOff,
  Search,
  UserCheck,
} from 'lucide-react';

interface LoginPanelProps {
  users: UserType[];
  onLogin: (user: UserType) => void;
  onBypass?: () => void;
  defaultUser?: UserType;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({
  users,
  onLogin,
  onBypass,
  defaultUser,
}) => {
  const [email, setEmail] = useState<string>(
    defaultUser ? defaultUser.email : 'kepala@tkkinviolata.sch.id'
  );
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);

  // State untuk pencarian cepat
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Filter user berdasarkan query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.nip && u.nip.toLowerCase().includes(query)) ||
        (u.role && u.role.toLowerCase().includes(query))
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Daftar guru & pegawai (kecuali admin)
  const staffUsers = users.filter((u) => u.role !== 'ADMIN');

  // Fungsi login dari hasil pencarian atau daftar
  const handleUserSelect = (user: UserType) => {
    onLogin(user);
    setSearchQuery('');
    setFilteredUsers([]);
  };

  // Admin & Guru & Pegawai untuk tombol demo
  const adminUser = users.find((u) => u.role === 'ADMIN') || users[0];
  const guruUser = users.find((u) => u.role === 'GURU') || users[1];
  const pegawaiUser = users.find((u) => u.role === 'PEGAWAI') || users[users.length - 1];

  const handleQuickSelect = (user: UserType, defaultPass: string) => {
    setEmail(user.email);
    setPassword(defaultPass);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Silakan masukkan Email atau NIP Anda.');
      return;
    }

    const cleanInput = email.trim().toLowerCase();
    const foundUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.nip.toLowerCase() === cleanInput
    );

    if (foundUser) {
      onLogin(foundUser);
    } else {
      if (cleanInput.includes('guru') || cleanInput.includes('yuliana')) {
        onLogin(guruUser);
      } else if (
        cleanInput.includes('pegawai') ||
        cleanInput.includes('tu') ||
        cleanInput.includes('yohanes')
      ) {
        onLogin(pegawaiUser);
      } else {
        onLogin(adminUser);
      }
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      <div className="absolute inset-0 bg-gradient-to-b from-[#b7eaf7] via-[#9ee2f3] to-[#7ecee3] -z-10" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/40 blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#52bad4]/30 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-cyan-200/30 blur-2xl pointer-events-none -z-10" />

      <div className="w-full max-w-[390px] sm:max-w-[420px] relative mt-10">
        <div className="relative rounded-[36px] border-[3.5px] border-[#36495b] bg-[#d3ebf6]/90 backdrop-blur-md shadow-2xl p-4 sm:p-5 pt-14">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-white border-[3.5px] border-[#36495b] shadow-md flex items-center justify-center z-10 overflow-hidden p-1.5">
            <img
              src="/logo-tk1.png"
              alt="Logo TKK Inviolata Ruteng"
              className="w-full h-full object-contain rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.endsWith('.jpg')) {
                  target.src = '/logo-tk1.jpg';
                }
              }}
            />
          </div>

          <div className="border border-[#36495b]/40 rounded-[26px] p-5 sm:p-6 pt-7 sm:pt-8 flex flex-col justify-between">
            {/* School Brand Title */}
            <div className="text-center mb-4">
              <h2 className="text-[#2c3e50] font-extrabold text-sm tracking-wider uppercase">
                TKK INVIOLATA RUTENG
              </h2>
              <p className="text-[#4e6072] text-[11px] font-semibold">
                Sistem Presensi Online Pendidik & Tenaga Kependidikan
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="bg-[#4e6072] hover:bg-[#465768] focus-within:bg-[#465768] transition rounded-xl px-4 py-3 flex items-center gap-3.5 text-white shadow-inner">
                <User className="w-5 h-5 text-white shrink-0" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Email"
                  className="bg-transparent text-white placeholder-slate-300 outline-none w-full text-sm font-medium tracking-wide"
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password */}
              <div className="bg-[#4e6072] hover:bg-[#465768] focus-within:bg-[#465768] transition rounded-xl px-4 py-3 flex items-center gap-3.5 text-white shadow-inner">
                <Lock className="w-5 h-5 text-white shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Password"
                  className="bg-transparent text-white placeholder-slate-300 outline-none w-full text-sm font-medium tracking-wide"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-300 hover:text-white transition focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMessage && (
                <div className="text-rose-700 text-xs font-semibold text-center bg-rose-100/80 py-1.5 px-3 rounded-lg border border-rose-300">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 rounded-xl border-2 border-[#36495b] bg-[#cceaf7] hover:bg-white active:bg-[#bee3f4] text-[#2c3e50] font-bold text-base tracking-[0.22em] uppercase transition duration-150 active:scale-[0.99] shadow-xs flex items-center justify-center cursor-pointer"
              >
                LOGIN
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px] text-[#425567] font-bold tracking-wider uppercase">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border border-[#36495b] flex items-center justify-center transition ${
                      rememberMe ? 'bg-[#36495b] text-white' : 'bg-transparent'
                    }`}
                  >
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="group-hover:text-[#253340] transition">REMEMBER</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="hover:text-[#202c38] transition underline-offset-2 hover:underline focus:outline-none"
                >
                  FORGOT PASSWORD
                </button>
              </div>
            </form>

            {/* ===== PENCARIAN CEPAT ===== */}
            <div className="relative mt-6 border-t border-[#36495b]/30 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-[#36495b]" />
                <span className="font-bold text-[#36495b] text-[11px] uppercase tracking-wider">
                  Cepat Masuk
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari Nama, NIP, atau Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full p-2.5 pl-9 rounded-xl border border-[#36495b]/40 bg-white/90 focus:bg-white focus:border-[#36495b] text-sm outline-none transition placeholder:text-slate-400"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              {searchQuery.trim() !== '' && filteredUsers.length > 0 && isSearchFocused && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left border-b border-slate-100 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                        {user.role === 'ADMIN' ? 'AD' : user.role === 'GURU' ? 'GR' : 'PG'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.nip} • {user.role}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.trim() !== '' && filteredUsers.length === 0 && isSearchFocused && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-4 text-center text-sm text-slate-500">
                  Tidak ditemukan
                </div>
              )}
            </div>

            {/* ===== DAFTAR GURU & PEGAWAI (BARU) ===== */}
            <div className="mt-4 border-t border-[#36495b]/30 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#36495b]" />
                <span className="font-bold text-[#36495b] text-[11px] uppercase tracking-wider">
                  Daftar Guru & Pegawai
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {staffUsers.length === 0 ? (
                  <p className="col-span-2 text-xs text-slate-400 text-center py-2">
                    Belum ada guru atau pegawai terdaftar.
                  </p>
                ) : (
                  staffUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition text-left text-xs"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
                        {user.role === 'GURU' ? 'GR' : 'PG'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.nip}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Demo (tetap) */}
        <div className="mt-5 bg-white/70 backdrop-blur-md border border-[#36495b]/30 rounded-2xl p-3.5 shadow-sm text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[#36495b] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Pilih Akun Demo TKK Inviolata:</span>
            </span>
            {onBypass && (
              <button
                onClick={onBypass}
                className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold underline"
              >
                Masuk Langsung
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSelect(adminUser, 'admin123')}
              className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                email === adminUser.email
                  ? 'bg-[#36495b] text-white border-[#36495b] shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-[10px] shrink-0">
                ADM
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[11px] truncate">Admin Utama</p>
                <p className="text-[9px] opacity-75 truncate">Sr. Maria</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect(guruUser, 'guru123')}
              className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                email === guruUser.email
                  ? 'bg-[#36495b] text-white border-[#36495b] shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-[#0088cc] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                GRU
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[11px] truncate">Guru TK</p>
                <p className="text-[9px] opacity-75 truncate">Ibu Yuliana</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect(pegawaiUser, 'pegawai123')}
              className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                email === pegawaiUser.email
                  ? 'bg-[#36495b] text-white border-[#36495b] shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-700 border-slate-300'
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                PEG
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[11px] truncate">Pegawai TU</p>
                <p className="text-[9px] opacity-75 truncate">Bpk. Yohanes</p>
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 font-medium mt-3">
          Sistem Informasi Presensi Online • TKK Inviolata Ruteng
        </p>
      </div>

      {/* Modal Forgot Password */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#36495b]" />
                <span>Bantuan Lupa Kata Sandi</span>
              </h4>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Untuk keamanan akun tenaga pendidik dan kependidikan <b>TKK Inviolata Ruteng</b>, pengaturan ulang kata sandi
              dilakukan secara terverifikasi melalui Admin Utama sekolah.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1 text-slate-700">
              <p className="font-bold text-amber-900">Kontak Admin Utama:</p>
              <p>• Penanggung Jawab: Sr. Maria Inviolata, S.Pd.</p>
              <p>• Telepon / WA: 0812-3888-9901</p>
              <p>• Jam Layanan: 07:00 - 15:30 WITA</p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href="https://wa.me/6281238889901?text=Halo%20Admin%20TKK%20Inviolata%2C%20saya%20memerlukan%20bantuan%20reset%20kata%20sandi%20akun%20presensi."
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] hover:bg-[#20b858] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hubungi via WhatsApp</span>
              </a>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};