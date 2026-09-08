import React, { useState } from 'react';
import { User, AttendanceRecord, GeofenceConfig } from '../../types';
import {
  X,
  Plus,
  Trash2,
  FileSpreadsheet,
  CalendarDays,
  Save,
  MapPin,
  Clock,
  CheckCircle2,
  Sliders,
  Camera,
  GraduationCap,
  Users,
} from 'lucide-react';
import { exportAttendanceToExcel } from '../../utils/excelUtils';

// ======================= 1. MASTER DATA GURU & PEGAWAI =======================
export const MasterDataModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onAddUser: (u: Omit<User, 'id' | 'createdAt'>) => void;
  onDeleteUser: (id: string) => void;
}> = ({ isOpen, onClose, users, onAddUser, onDeleteUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState<'GURU' | 'PEGAWAI'>('GURU');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nip) return;
    onAddUser({
      name,
      nip,
      position: position || 'Guru Kelas TKK Inviolata',
      role,
      email: `${nip.toLowerCase()}@tkkinviolata.sch.id`,
      phone: '0812-3456-7890',
      status: 'AKTIF',
      avatarUrl: `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&fit=crop&q=80`,
    });
    setName('');
    setNip('');
    setPosition('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0088cc] flex items-center justify-center text-white font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Data Guru & Pegawai TKK Inviolata Ruteng
              </h3>
              <p className="text-xs text-slate-500">
                Kelola data tenaga pendidik, sentra kelas, NIP, dan akun presensi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold">
              Total {users.length} Guru & Pegawai Terdaftar
            </span>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 rounded-lg bg-[#0088cc] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#0077b5] transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? 'Batal Tambah' : 'Tambah Guru / Staf'}</span>
            </button>
          </div>

          {isAdding && (
            <form
              onSubmit={handleSubmit}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <h4 className="text-xs font-bold text-slate-700">
                Formulir Pendidik / Staf Baru TKK Inviolata
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="cth. Ibu Maria Goreti, S.Pd."
                    className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-[#0088cc] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">NIP / NUPTK / No. Induk</label>
                  <input
                    type="text"
                    required
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="cth. 19880415201402"
                    className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-[#0088cc] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Tugas Mengajar / Sentra</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="cth. Guru Kelompok A (TK-A)"
                    className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-[#0088cc] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Kategori Peran</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full border rounded-lg p-2 focus:ring-1 focus:ring-[#0088cc] focus:outline-none"
                  >
                    <option value="GURU">Guru / Tenaga Pendidik</option>
                    <option value="PEGAWAI">Tenaga Kependidikan / TU / Sarpras</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition"
              >
                Simpan ke Database TKK Inviolata
              </button>
            </form>
          )}

          {/* User List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="p-2.5">Nama Guru / Pegawai</th>
                  <th className="p-2.5">NIP</th>
                  <th className="p-2.5">Tugas / Unit</th>
                  <th className="p-2.5">Peran</th>
                  <th className="p-2.5 text-center">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-2.5 flex items-center gap-2">
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover border"
                      />
                      <span className="font-bold text-slate-800">{u.name}</span>
                    </td>
                    <td className="p-2.5 text-slate-500 font-mono">{u.nip}</td>
                    <td className="p-2.5 text-slate-600">{u.position}</td>
                    <td className="p-2.5">
                      <span className="bg-blue-50 text-[#0088cc] font-bold px-2 py-0.5 rounded text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-xs text-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ======================= 2. JADWAL SENTRA & KBM TKK INVIOLATA =======================
export const JadwalSentraModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  users: User[];
}> = ({ isOpen, onClose, users }) => {
  if (!isOpen) return null;

  const jadwalSentraList = [
    {
      hari: 'Senin',
      kegiatan: 'Upacara / Apel Pagi & Sentra Balok',
      kelompokA: 'Sentra Balok & Konstruksi',
      kelompokB: 'Sentra Persiapan & Huruf/Angka',
      pembimbing: 'Ibu Yuliana Nardi, S.Pd. & Ibu Fransiska, S.Pd.',
      waktu: '07:30 - 10:30 WITA',
    },
    {
      hari: 'Selasa',
      kegiatan: 'Sentra Bahan Alam & Eksplorasi',
      kelompokA: 'Eksplorasi Pasir & Air',
      kelompokB: 'Sentra Bahan Alam & Tanaman Ruteng',
      pembimbing: 'Ibu Fransiska Murni, S.Pd. AUD',
      waktu: '07:30 - 10:30 WITA',
    },
    {
      hari: 'Rabu',
      kegiatan: 'Sentra Seni, Musik & Tari Manggarai',
      kelompokA: 'Bernyanyi Lagu Rohani & Gerak Lagu',
      kelompokB: 'Tari Tradisional & Perkusi Sederhana',
      pembimbing: 'Ibu Maria Goreti, S.Pd.',
      waktu: '07:30 - 10:30 WITA',
    },
    {
      hari: 'Kamis',
      kegiatan: 'Sentra Main Peran & Nilai Karakter',
      kelompokA: 'Peran Makro (Keluarga & Pasar Tradisional)',
      kelompokB: 'Peran Mikro (Profesi & Gotong Royong)',
      pembimbing: 'Ibu Yuliana Nardi, S.Pd.',
      waktu: '07:30 - 10:30 WITA',
    },
    {
      hari: 'Jumat',
      kegiatan: 'Ibadat Pagi Bersama & Sentra Rohani/Agama',
      kelompokA: 'Doa Bapa Kami & Kasih Sesama',
      kelompokB: 'Kisah Sahabat Yesus & Lagu Pujian',
      pembimbing: 'Sr. Maria Inviolata, S.Pd. & Seluruh Guru',
      waktu: '07:30 - 10:00 WITA',
    },
    {
      hari: 'Sabtu',
      kegiatan: 'Senam Pagi Anak Ceria & Makan Sehat Bersama',
      kelompokA: 'Motorik Kasar & Cuci Tangan Sehat',
      kelompokB: 'Makan Bersama Menu Gizi 4 Sehat',
      pembimbing: 'Bpk. Fransiskus Deno & Seluruh Guru TKK',
      waktu: '07:30 - 09:30 WITA',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8e44ad] flex items-center justify-center text-white font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Jadwal Sentra & Kegiatan Belajar Mengajar TKK Inviolata
              </h3>
              <p className="text-xs text-slate-500">
                Kurikulum Merdeka Berbasis Sentra - TKK Inviolata Ruteng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#8e44ad] text-white font-semibold">
                <tr>
                  <th className="p-2.5">Hari</th>
                  <th className="p-2.5">Waktu</th>
                  <th className="p-2.5">Sentra / Kegiatan Inti</th>
                  <th className="p-2.5">Kelompok A (TK-A)</th>
                  <th className="p-2.5">Kelompok B (TK-B)</th>
                  <th className="p-2.5">Guru Pembimbing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jadwalSentraList.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{item.hari}</td>
                    <td className="p-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {item.waktu}
                    </td>
                    <td className="p-2.5 font-semibold text-purple-900">
                      {item.kegiatan}
                    </td>
                    <td className="p-2.5 text-slate-600">{item.kelompokA}</td>
                    <td className="p-2.5 text-slate-600">{item.kelompokB}</td>
                    <td className="p-2.5 text-slate-700 font-medium text-[11px]">
                      {item.pembimbing}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-xs text-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ======================= 3. PENGATURAN LOKASI GPS & JAM SEKOLAH =======================
export const PengaturanAbsensiModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  config: GeofenceConfig;
  onSave: (c: GeofenceConfig) => void;
}> = ({ isOpen, onClose, config, onSave }) => {
  const [lat, setLat] = useState(config.latitude);
  const [lng, setLng] = useState(config.longitude);
  const [radius, setRadius] = useState(config.radiusMeters);
  const [checkInStart, setCheckInStart] = useState(config.checkInStartTime || '06:30');
  const [checkInDeadline, setCheckInDeadline] = useState(config.checkInDeadlineTime || '07:30');
  const [checkOutStart, setCheckOutStart] = useState(config.checkOutStartTime || '12:30');
  const [checkOutEnd, setCheckOutEnd] = useState(config.checkOutEndTime || '15:30');
  const [adminPhone, setAdminPhone] = useState(config.adminContactPhone || '0812-3888-9901');
  const [adminName, setAdminName] = useState(config.adminContactName || 'Sr. Maria Inviolata, S.Pd.');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...config,
      latitude: Number(lat) || -8.6135,
      longitude: Number(lng) || 120.4689,
      radiusMeters: Number(radius) || 80,
      checkInStartTime: checkInStart,
      checkInDeadlineTime: checkInDeadline,
      checkOutStartTime: checkOutStart,
      checkOutEndTime: checkOutEnd,
      adminContactPhone: adminPhone,
      adminContactName: adminName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#27ae60] flex items-center justify-center text-white font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Batas Jam Absensi & Lokasi GPS
              </h3>
              <p className="text-xs text-slate-500">
                Konfigurasi durasi presensi masuk/pulang dan kontak admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="py-4 space-y-4 text-xs">
          {/* Geofence GPS Coordinates */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              Lokasi GPS & Radius Presensi
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Latitude Gedung TKK
                </label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-full border rounded-lg p-2 font-mono bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Longitude Gedung TKK
                </label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  className="w-full border rounded-lg p-2 font-mono bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-600 font-semibold">
                  Radius Validasi GPS: {radius} Meter
                </label>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Area Sekolah
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="5"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Attendance Windows (Masuk & Pulang) */}
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 text-[11px] uppercase tracking-wider">
                Batas Waktu Presensi Masuk (Datang)
              </span>
              <span className="text-[10px] text-rose-600 font-bold">
                Lewat Waktu = Kunci & Lapor Admin
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Jam Buka Presensi Masuk
                </label>
                <input
                  type="time"
                  value={checkInStart}
                  onChange={(e) => setCheckInStart(e.target.value)}
                  className="w-full border rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#0088cc] focus:outline-none font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Batas Akhir Presensi Masuk
                </label>
                <input
                  type="time"
                  value={checkInDeadline}
                  onChange={(e) => setCheckInDeadline(e.target.value)}
                  className="w-full border rounded-lg p-2 bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none font-bold text-rose-700"
                />
              </div>
            </div>
          </div>

          {/* Pulang window */}
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                Batas Waktu Presensi Pulang (Kepulangan)
              </span>
              <span className="text-[10px] text-amber-700 font-bold">
                Di Luar Jam = Konfirmasi Admin
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Mulai Jam Presensi Pulang
                </label>
                <input
                  type="time"
                  value={checkOutStart}
                  onChange={(e) => setCheckOutStart(e.target.value)}
                  className="w-full border rounded-lg p-2 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Batas Akhir Presensi Pulang
                </label>
                <input
                  type="time"
                  value={checkOutEnd}
                  onChange={(e) => setCheckOutEnd(e.target.value)}
                  className="w-full border rounded-lg p-2 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Contact Admin details */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              Kontak Admin Utama (Untuk Guru/Pegawai yang Terlambat)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Nama Admin Utama
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full border rounded-lg p-2 bg-white text-xs font-semibold focus:ring-1 focus:ring-[#0088cc] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  No. HP / WhatsApp Admin
                </label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full border rounded-lg p-2 bg-white text-xs font-mono font-bold text-[#0088cc] focus:ring-1 focus:ring-[#0088cc] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#27ae60] hover:bg-[#219150] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan Sekolah</span>
          </button>
        </form>
      </div>
    </div>
  );
};

// ======================= 4. PENGUMUMAN SEKOLAH =======================
export const InformasiUmumModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f39c12] flex items-center justify-center text-white font-bold">
              📢
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Pengumuman TKK Inviolata Ruteng
              </h3>
              <p className="text-xs text-slate-500">
                Papan informasi akademik dan agenda kegiatan sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
              IBADAT PAGI
            </span>
            <h4 className="font-bold text-amber-900 mt-1">
              Doa Pembukaan Hari & Nyanyian Pujian
            </h4>
            <p className="text-amber-800 mt-1">
              Seluruh pendidik diharapkan mendampingi siswa-siswi Kelompok A dan B
              di ruang sentra rohani pada pukul 07:15 WITA.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
              KURIKULUM TK
            </span>
            <h4 className="font-bold text-slate-800 mt-1">
              Pembagian Media Ajar Sentra Main Peran & Balok
            </h4>
            <p className="text-slate-600 mt-1">
              Media pembelajaran telah didistribusikan ke masing-masing kelas.
              Guru diharapkan mencatat perlengkapan yang digunakan.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-xs text-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ======================= 5. BUKTI SELFIE DETAIL =======================
export const SelfieDetailModal: React.FC<{
  record: AttendanceRecord | null;
  onClose: () => void;
}> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#0088cc]" />
            <h3 className="font-bold text-sm text-slate-800">
              Bukti Presensi Selfie & GPS TKK Inviolata
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-4/3 bg-slate-900">
            <img
              src={record.checkInPhoto}
              alt={record.userName}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3 h-3" />
              <span>Face Verified TKK</span>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/70 text-white font-mono text-[10px] px-2 py-1 rounded">
              {record.date} {record.checkInTime} WITA
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Guru / Staf:</span>
              <span className="font-bold text-slate-800">{record.userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">NIP / ID:</span>
              <span className="font-bold text-slate-800">{record.nip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Radius GPS Sekolah:</span>
              <span className="font-bold text-emerald-700">
                {record.checkInLocation.distanceMeters} Meter (Dalam Gedung TKK Inviolata)
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-xs text-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ======================= 6. PROFIL TKK INVIOLATA MODAL =======================
export const ProfilSekolahModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#d81b60] flex items-center justify-center text-white font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Profil TKK Inviolata Ruteng
              </h3>
              <p className="text-xs text-slate-500">
                Data Lembaga & Pengelola Sekolah Katolik Ruteng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <img
              src="/logo-tk1.png"
              alt="Logo TKK Inviolata Ruteng"
              className="w-16 h-16 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-xs"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.endsWith('.jpg')) {
                  target.src = '/logo-tk1.jpg';
                }
              }}
            />
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                TKK INVIOLATA RUTENG
              </h4>
              <p className="text-xs text-[#0088cc] font-semibold">
                NPSN: 50302341 • Terakreditasi A
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kec. Langke Rembong, Kab. Manggarai, Nusa Tenggara Timur
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-medium">Kepala Sekolah:</span>
              <span className="font-bold text-slate-800">Sr. Maria Inviolata, S.Pd.</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-medium">Status Lembaga:</span>
              <span className="font-bold text-slate-800">Swasta Katolik</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-medium">Waktu Presensi:</span>
              <span className="font-bold text-emerald-700">WITA (Waktu Indonesia Tengah)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-medium">Koordinat GPS TKK:</span>
              <span className="font-bold font-mono text-slate-800">-8.6135°, 120.4635°</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-medium">Radius Aman Geofence:</span>
              <span className="font-bold text-[#0088cc]">80 Meter dari Gedung</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-slate-500 font-medium">Kontak & Telepon:</span>
              <span className="font-bold text-slate-800">0812-3888-9901</span>
            </div>
          </div>

          <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl">
            <h5 className="font-bold text-xs text-sky-900 mb-1">Visi TKK Inviolata Ruteng:</h5>
            <p className="text-[11px] text-sky-800 leading-relaxed">
              Mewujudkan generasi anak usia dini yang beriman, berkarakter mulia, cerdas, kreatif, dan mandiri berlandaskan kasih persaudaraan Kristiani.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0088cc] text-white font-bold text-xs hover:bg-[#0077b5] transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

