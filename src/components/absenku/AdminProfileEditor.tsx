import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Lock,
  Mail,
  Phone,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Camera,
  Save,
  Eye,
  EyeOff,
  Building,
  BadgeCheck,
  RefreshCw,
  Award,
} from 'lucide-react';
import { User } from '../../types';

interface AdminProfileEditorProps {
  currentUser?: User;
  users: User[];
  onUpdateUser: (updatedUser: User) => Promise<void> | void;
}

export const AdminProfileEditor: React.FC<AdminProfileEditorProps> = ({
  currentUser,
  users,
  onUpdateUser,
}) => {
  // Temukan user admin yang sedang aktif
  const adminUser =
    currentUser ||
    users.find((u) => {
      const r = (u.role || '').toUpperCase();
      return r === 'ADMIN' || r === 'ADMINISTRATOR' || r === 'ADMIN_UTAMA';
    }) ||
    users[0];

  // State Form Profil
  const [name, setName] = useState(adminUser?.name || 'Sr. Maria Inviolata, S.Pd.');
  const [nip, setNip] = useState(adminUser?.nip || '197508152002122001');
  const [email, setEmail] = useState(adminUser?.email || 'admin@tkkinviolata.sch.id');
  const [phone, setPhone] = useState(adminUser?.phone || '0812-3888-9901');
  const [position, setPosition] = useState(
    adminUser?.position || 'Kepala Sekolah & Administrator Utama'
  );
  const [avatarUrl, setAvatarUrl] = useState(
    adminUser?.avatarUrl ||
      'https://ui-avatars.com/api/?name=Sr+Maria+Inviolata&background=0088cc&color=fff&size=128'
  );

  // State Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // File input ref untuk upload avatar
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sinkronisasi jika akun admin yang diedit berganti
  useEffect(() => {
    if (adminUser) {
      setName(adminUser.name || '');
      setNip(adminUser.nip || '');
      setEmail(adminUser.email || '');
      setPhone(adminUser.phone || '');
      setPosition(adminUser.position || 'Kepala Sekolah & Administrator Utama');
      if (adminUser.avatarUrl) {
        setAvatarUrl(adminUser.avatarUrl);
      }
    }
  }, [adminUser?.id]);

  // Handler Upload Foto dari Perangkat (Laptop/HP)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      setAlertMessage({
        type: 'error',
        text: 'Format file tidak didukung. Harap pilih file gambar (JPG, PNG, WEBP).',
      });
      return;
    }

    // Validasi ukuran file (maks 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setAlertMessage({
        type: 'error',
        text: 'Ukuran file gambar terlalu besar. Maksimal ukuran adalah 3MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      setAlertMessage({
        type: 'success',
        text: 'Foto profil berhasil dipilih. Klik "Simpan Perubahan" untuk menerapkan.',
      });
    };
    reader.onerror = () => {
      setAlertMessage({
        type: 'error',
        text: 'Gagal memproses file foto. Silakan coba lagi.',
      });
    };
    reader.readAsDataURL(file);
  };

  // Generate Avatar Otomatis dari Nama
  const handleGenerateAvatar = () => {
    const cleanName = encodeURIComponent(name.trim() || 'Admin');
    const generated = `https://ui-avatars.com/api/?name=${cleanName}&background=0088cc&color=fff&size=128&bold=true`;
    setAvatarUrl(generated);
  };

  // Evaluasi kekuatan password
  const getPasswordStrength = () => {
    if (!newPassword) return null;
    if (newPassword.length < 6) return { label: 'Terlalu Pendek (Min 6)', color: 'text-red-500 bg-red-50' };
    if (newPassword.length < 8) return { label: 'Cukup', color: 'text-amber-600 bg-amber-50' };
    return { label: 'Kuat', color: 'text-emerald-600 bg-emerald-50' };
  };

  const passwordStrength = getPasswordStrength();
  const isPasswordMatching = newPassword === confirmPassword;

  // Submit Form Profil & Password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);

    // Validasi data profil
    if (!name.trim()) {
      setAlertMessage({ type: 'error', text: 'Nama Lengkap wajib diisi.' });
      return;
    }
    if (!email.trim()) {
      setAlertMessage({ type: 'error', text: 'Alamat Email wajib diisi.' });
      return;
    }

    // Validasi password jika diisi
    if (newPassword.trim() !== '') {
      if (newPassword.length < 6) {
        setAlertMessage({
          type: 'error',
          text: 'Kata sandi baru minimal harus 6 karakter.',
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        setAlertMessage({
          type: 'error',
          text: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const updatedData: User & { password?: string } = {
        ...adminUser,
        name: name.trim(),
        nip: nip.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        position: position.trim(),
        avatarUrl: avatarUrl,
      };

      if (newPassword.trim() !== '') {
        updatedData.password = newPassword.trim();
      }

      await onUpdateUser(updatedData);

      setAlertMessage({
        type: 'success',
        text: '✅ Profil dan Kata Sandi Administrator berhasil diperbarui!',
      });

      // Bersihkan input password setelah berhasil
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error saving admin profile:', err);
      setAlertMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan saat menyimpan perubahan.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0088cc] to-[#005f8f] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0 shadow-inner">
            <Shield className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Profil & Kata Sandi Administrator
              </h2>
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Akses Penuh
              </span>
            </div>
            <p className="text-xs text-white/80">
              Kelola data identitas resmi Administrator Utama TKK Inviolata Ruteng dan perbarui kata sandi akun login.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl px-3 py-2 text-right shrink-0">
          <p className="text-[10px] uppercase font-bold text-white/70">Role Akun</p>
          <p className="text-xs font-extrabold text-amber-300">ADMINISTRATOR UTAMA</p>
        </div>
      </div>

      {/* Alert Notifikasi */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium transition-all ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alertMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{alertMessage.text}</div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Foto Profil & Info Identitas Utama (7 Kolom) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <UserIcon className="w-5 h-5 text-[#0088cc]" />
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Data Lengkap Administrator
                </h3>
                <p className="text-xs text-slate-500">
                  Data ini digunakan sebagai identitas resmi pimpinan sekolah pada sistem presensi.
                </p>
              </div>
            </div>

            {/* Avatar & Foto Profil */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-[#0088cc] hover:bg-[#0072aa] text-white p-2 rounded-xl shadow-md transition hover:scale-105"
                  title="Upload Foto Baru"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Foto Profil Resmi</h4>
                  <p className="text-xs text-slate-500">
                    Gunakan foto formal dengan latar rapi. Format PNG, JPG atau WEBP (Maks 3MB).
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#0088cc]" />
                    <span>Upload Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateAvatar}
                    className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition"
                    title="Buat avatar inisial dari nama yang dimasukkan"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                    <span>Avatar Inisial</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields Profil */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap & Gelar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Sr. Maria Inviolata, S.Pd."
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088cc] rounded-xl text-xs font-medium text-slate-800 outline-none transition"
                  />
                </div>
              </div>

              {/* NIP / NUPTK */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP / NUPTK / No. Induk Pegawai
                </label>
                <div className="relative">
                  <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="197508152002122001"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088cc] rounded-xl text-xs font-medium text-slate-800 outline-none transition"
                  />
                </div>
              </div>

              {/* Jabatan / Posisi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jabatan Resmi
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Kepala Sekolah / Admin Utama"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088cc] rounded-xl text-xs font-medium text-slate-800 outline-none transition"
                  />
                </div>
              </div>

              {/* Email Resmi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Email (Akun Login) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tkkinviolata.sch.id"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088cc] rounded-xl text-xs font-medium text-slate-800 outline-none transition"
                  />
                </div>
              </div>

              {/* Nomor Telepon / WA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor HP / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-3888-9901"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088cc] rounded-xl text-xs font-medium text-slate-800 outline-none transition"
                  />
                </div>
              </div>

              {/* Instansi / Lembaga (Readonly) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lembaga / Satuan Pendidikan
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled
                    value="TKK Inviolata Ruteng - Kab. Manggarai, NTT"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Pengaturan Password & Keamanan (5 Kolom) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Ubah Kata Sandi (Password)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kosongkan jika tidak ingin mengubah kata sandi lama Anda.
                  </p>
                </div>
              </div>

              {/* Input Password Baru */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Kata Sandi Baru
                  </label>
                  {passwordStrength && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${passwordStrength.color}`}
                    >
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru (min 6 karakter)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088cc] rounded-xl text-xs font-medium text-slate-800 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Input Konfirmasi Password Baru */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  {newPassword && confirmPassword && (
                    <span
                      className={`text-[10px] font-bold ${
                        isPasswordMatching ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {isPasswordMatching ? '✓ Cocok' : '✕ Tidak Cocok'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 outline-none transition ${
                      confirmPassword && !isPasswordMatching
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-slate-200 focus:bg-white focus:border-[#0088cc]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pedoman Keamanan Kata Sandi</span>
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Gunakan kombinasi huruf kapital, angka, dan simbol untuk menjaga keamanan akun pimpinan sekolah dari akses tidak sah.
                </p>
              </div>
            </div>

            {/* Ringkasan Hak Akses Administrator */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Hak Istimewa Administrator</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Verifikasi dan monitoring selfie GPS guru & pegawai</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Persetujuan & penolakan izin dan dispensasi</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Aktivasi buka kunci absen terlambat / geofence</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Export rekapitulasi kehadiran resmi dalam format Excel</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tombol Simpan Aksi */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#0088cc] hover:bg-[#0072aa] disabled:bg-slate-300 text-white font-bold px-6 py-3 rounded-xl shadow-md flex items-center gap-2 text-xs transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil & Password</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
