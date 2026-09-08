import React, { useState, useEffect } from 'react';
import { AttendanceRecord, GeofenceConfig, User } from '../types';
import { GeofenceMap } from './GeofenceMap';
import { AttendanceReports } from './AttendanceReports';
import { UserManagement } from './UserManagement';
import { AdminGeofenceSettings } from './AdminGeofenceSettings';
import {
  Activity,
  Users,
  FileSpreadsheet,
  Settings,
  Clock,
  UserCheck,
  UserX,
  MapPin,
  ShieldCheck,
  CheckSquare,
  Megaphone,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Calendar,
  UserCog,
  Award,
  LogOut,
  LayoutDashboard,
  BarChart3,
  PersonStanding,
  MapPinned,
  ToggleRight,
  MessageSquareWarning,
  Bell,
  UserCircle,
} from 'lucide-react';

interface IzinRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_nip: string;
  type: string;
  reason: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  attachment?: string | null;
  admin_notes?: string;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  isPinned: boolean;
}

interface AdminDashboardProps {
  users: User[];
  records: AttendanceRecord[];
  geofenceConfig: GeofenceConfig;
  onSaveGeofenceConfig: (config: GeofenceConfig) => void;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onImportUsers: (newUsers: Omit<User, 'id' | 'createdAt'>[]) => void;
  activeTab: 'monitoring' | 'laporan' | 'pengguna' | 'geofence' | 'aktivasi_absen' | 'izin_tidak_masuk' | 'pengumuman' | 'profile';
  onTabChange: (tab: any) => void;
  onRefresh?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  records,
  geofenceConfig,
  onSaveGeofenceConfig,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onImportUsers,
  activeTab,
  onTabChange,
  onRefresh,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter((r) => r.date === todayStr);

  const staffUsers = users.filter((u) => u.role !== 'ADMIN');
  const totalStaffCount = staffUsers.length;
  const presentCount = todayRecords.length;
  const lateCount = todayRecords.filter((r) => r.checkInStatus === 'TERLAMBAT').length;
  const absentCount = Math.max(0, totalStaffCount - presentCount);

  const staffPins = todayRecords.map((r) => ({
    id: r.id,
    userName: r.userName,
    userRole: r.userRole,
    time: r.checkInTime,
    location: r.checkInLocation,
  }));

  // ===== STATE IZIN =====
  const [izinRequests, setIzinRequests] = useState<IzinRequest[]>([]);
  const [izinLoading, setIzinLoading] = useState(false);

  // ===== STATE PENGUMUMAN =====
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Libur Nasional',
      content: 'Upacara Kemerdekaan 17 Agustus 2026',
      date: '2026-08-17',
      isPinned: true,
    },
    {
      id: '2',
      title: 'Rapat Guru',
      content: 'Jumat, 11 September 2026 pukul 13:00 WITA',
      date: '2026-09-11',
      isPinned: false,
    },
  ]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', date: '' });

  // ===== FETCH IZIN =====
  useEffect(() => {
    if (activeTab === 'izin_tidak_masuk' || activeTab === 'aktivasi_absen') {
      fetchIzin();
    }
  }, [activeTab]);

  const fetchIzin = async () => {
    setIzinLoading(true);
    try {
      const res = await fetch('/api/izin');
      const data = await res.json();
      if (data.success) {
        setIzinRequests(data.data);
      }
    } catch (error) {
      console.error('Gagal fetch izin:', error);
    } finally {
      setIzinLoading(false);
    }
  };

  const handleApproveIzin = async (id: number) => {
    try {
      const res = await fetch('/api/izin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Izin disetujui.');
        await fetchIzin();
      } else {
        alert('❌ Gagal approve: ' + data.error);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleRejectIzin = async (id: number) => {
    try {
      const res = await fetch('/api/izin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('❌ Izin ditolak.');
        await fetchIzin();
      } else {
        alert('❌ Gagal reject: ' + data.error);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const openAttachment = (base64: string) => {
    if (!base64) return;
    window.open(base64, '_blank');
  };

  const handleAktivasiAbsen = async (userId: string) => {
    try {
      const res = await fetch('/api/attendance/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, date: todayStr }),
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Tombol absen diaktifkan kembali.');
        await fetchIzin();
        if (onRefresh) onRefresh();
      } else {
        alert('❌ Gagal aktivasi: ' + data.error);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert('Judul dan konten wajib diisi.');
      return;
    }
    const newItem: Announcement = {
      id: Date.now().toString(),
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      date: newAnnouncement.date || new Date().toISOString().split('T')[0],
      isPinned: false,
    };
    setAnnouncements([newItem, ...announcements]);
    setNewAnnouncement({ title: '', content: '', date: '' });
    alert('✅ Pengumuman berhasil ditambahkan.');
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('Hapus pengumuman ini?')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  // ===== RENDER TAB CONTENT =====
  const renderTabContent = () => {
    switch (activeTab) {
      case 'monitoring':
        return renderMonitoring();
      case 'laporan':
        return <AttendanceReports records={records} isPersonalView={false} />;
      case 'pengguna':
        return (
          <UserManagement
            users={users}
            onAddUser={onAddUser}
            onUpdateUser={onUpdateUser}
            onDeleteUser={onDeleteUser}
            onImportUsers={onImportUsers}
          />
        );
      case 'geofence':
        return <AdminGeofenceSettings config={geofenceConfig} onSaveConfig={onSaveGeofenceConfig} />;
      case 'aktivasi_absen':
        return renderAktivasiAbsen();
      case 'izin_tidak_masuk':
        return renderIzinTidakMasuk();
      case 'pengumuman':
        return renderPengumuman();
      case 'profile':
        return (
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="text-xl font-bold">Profil Admin</h3>
            <p>Nama: {users.find(u => u.role === 'ADMIN')?.name || '-'}</p>
            <p>Email: {users.find(u => u.role === 'ADMIN')?.email || '-'}</p>
            <p>NIP: {users.find(u => u.role === 'ADMIN')?.nip || '-'}</p>
          </div>
        );
      default:
        return <div>Halaman tidak ditemukan.</div>;
    }
  };

  // ===== DASHBOARD UTAMA – LAYOUT BARU (SESUAI GAMBAR) =====
  const renderMonitoring = () => {
    const adminUser = users.find(u => u.role === 'ADMIN');

    // Data untuk grafik sederhana (contoh)
    const weeklyData = [
      { day: 'Sen', count: 12 },
      { day: 'Sel', count: 15 },
      { day: 'Rab', count: 10 },
      { day: 'Kam', count: 14 },
      { day: 'Jum', count: 8 },
      { day: 'Sab', count: 0 },
    ];
    const maxCount = Math.max(...weeklyData.map(d => d.count), 1);

    return (
      <div className="space-y-6">
        {/* Header Section (Biru) */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Admin</h1>
              <p className="text-blue-100 text-sm mt-1">Monitoring Kehadiran Guru & Pegawai TKK Inviolata</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Hari Ini</p>
                <p className="font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Cards Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Data Guru & Pegawai</h4>
                <p className="text-sm text-gray-500">Pendidik & Tenaga Kependidikan TKK</p>
                <button onClick={() => onTabChange('pengguna')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">
                  Kelola →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Rekap Absensi TK</h4>
                <p className="text-sm text-gray-500">Laporan Kehadiran & Unduh Excel</p>
                <button onClick={() => onTabChange('laporan')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">
                  Lihat →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <MapPin className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg">Lokasi & Jam Kerja</h4>
                <p className="text-sm text-gray-500">Geofence GPS TKK Inviolata & Jadwal</p>
                <button onClick={() => onTabChange('geofence')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">
                  Atur →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Tracking & Report */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3) - Tracking Lokasi */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Tracking Lokasi Guru TKK Inviolata
            </h3>

            <div className="bg-gray-50 p-3 rounded-xl mb-4">
              <p className="font-semibold text-gray-700 text-sm">
                Nama: Ibu Yuliana Nardi, S.Pd. (Guru Kelompok A (TK-A))
              </p>
              <p className="text-xs text-gray-500">Tugas / Sentra: Guru Kelompok A (TK-A)</p>
              <p className="text-xs text-emerald-600 font-medium">Waktu Presensi: 12.06.51 WITA (Tepat Waktu)</p>
            </div>

            <div className="h-[350px] rounded-xl overflow-hidden border border-slate-200">
              <GeofenceMap
                config={geofenceConfig}
                userLocation={null}
                allStaffLocations={staffPins}
                height="100%"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Radius Aman: {geofenceConfig.radiusMeters}m dari Gedung TKK</span>
              <span>Leaflet | © OpenStreetMap</span>
            </div>
          </div>

          {/* Right Column (1/3) - Report Absensi & Info */}
          <div className="space-y-6">
            {/* Report Absensi Weekly */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Report Absensi Weekly
              </h3>
              <div className="flex items-end justify-between h-40 gap-2">
                {weeklyData.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-full bg-blue-200 rounded-t-lg" style={{ height: `${(item.count / maxCount) * 100}%` }} />
                    <span className="text-xs text-gray-500">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kartu Admin, Jadwal, Pengumuman */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Admin Utama
              </h4>
              <p className="text-sm text-gray-700 mt-2 font-semibold">{adminUser?.name || 'Sr. Maria Inviolata, S.Pd.'}</p>
              <p className="text-xs text-gray-500">{adminUser?.email || 'admin@tkkinviolata.sch.id'}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Jadwal Sentra & KBM
              </h4>
              <p className="text-sm text-gray-600 mt-2">Sentra Balok, Alam, Seni & Rohani</p>
              <p className="text-xs text-gray-400 mt-1">Kurikulum Merdeka</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                Pengumuman Sekolah
              </h4>
              <p className="text-sm text-gray-600 mt-2">Agenda Kegiatan & Informasi TKK</p>
              <button onClick={() => onTabChange('pengumuman')} className="mt-2 text-sm text-emerald-600 font-semibold hover:underline">
                Baca →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== AKTIVASI TOMBOL ABSEN =====
  const renderAktivasiAbsen = () => {
    const terlambatUsers = staffUsers.filter(u => {
      const record = records.find(r => r.userId === u.id.toString() && r.date === todayStr);
      return !record || record.checkInStatus === 'TERLAMBAT';
    });

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Aktivasi Tombol Absen (Untuk Terlambat)
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Daftar guru/pegawai yang terlambat hari ini. Klik <strong>"Aktivasi"</strong> untuk membuka kunci tombol absen mereka.
        </p>
        {terlambatUsers.length === 0 ? (
          <p className="text-slate-400">Semua guru/pegawai tepat waktu hari ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3 text-left">Nama</th>
                  <th className="p-3 text-left">NIP</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {terlambatUsers.map((u) => {
                  const record = records.find(r => r.userId === u.id.toString() && r.date === todayStr);
                  return (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-xs">{u.nip}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${record ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          {record ? 'Terlambat' : 'Belum Absen'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleAktivasiAbsen(u.id.toString())}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition"
                        >
                          Aktivasi
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ===== IZIN TIDAK MASUK =====
  const renderIzinTidakMasuk = () => {
    const filtered = izinRequests.filter(req => req.type === 'tidak_masuk');

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          Izin Tidak Masuk Sekolah
        </h3>
        <p className="text-sm text-slate-600 mb-4">Daftar permohonan izin tidak masuk sekolah (sakit, dinas, dll) dengan bukti upload.</p>

        {izinLoading ? (
          <p className="text-center text-slate-500">Memuat data...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-400">Tidak ada permohonan izin tidak masuk.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3 text-left">Nama</th>
                  <th className="p-3 text-left">NIP</th>
                  <th className="p-3 text-left">Tanggal</th>
                  <th className="p-3 text-left">Alasan</th>
                  <th className="p-3 text-left">Bukti</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{req.user_name}</td>
                    <td className="p-3 text-xs">{req.user_nip}</td>
                    <td className="p-3 text-xs">{req.date}</td>
                    <td className="p-3 text-xs max-w-xs truncate">{req.reason}</td>
                    <td className="p-3 text-center">
                      {req.attachment ? (
                        <button
                          onClick={() => openAttachment(req.attachment!)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Lihat
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">Tidak ada</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {req.status === 'pending' ? '⏳ Menunggu' : req.status === 'approved' ? '✅ Disetujui' : '❌ Ditolak'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {req.status === 'pending' && (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleApproveIzin(req.id)} className="text-green-600 hover:text-green-800 p-1" title="Setujui">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRejectIzin(req.id)} className="text-red-600 hover:text-red-800 p-1" title="Tolak">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ===== PENGUMUMAN =====
  const renderPengumuman = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-emerald-600" />
        Pengumuman Sekolah
      </h3>

      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-slate-700 mb-2">Tambah Pengumuman Baru</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Judul"
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
            className="p-2 border rounded-xl"
          />
          <input
            type="text"
            placeholder="Konten"
            value={newAnnouncement.content}
            onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
            className="p-2 border rounded-xl"
          />
          <input
            type="date"
            value={newAnnouncement.date}
            onChange={(e) => setNewAnnouncement(prev => ({ ...prev, date: e.target.value }))}
            className="p-2 border rounded-xl"
          />
        </div>
        <button
          onClick={handleAddAnnouncement}
          className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengumuman
        </button>
      </div>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-slate-400">Belum ada pengumuman.</p>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className={`border rounded-xl p-4 ${ann.isPinned ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    {ann.title}
                    {ann.isPinned && <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">📌 PIN</span>}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">{ann.content}</p>
                  <p className="text-xs text-slate-400 mt-1">{ann.date}</p>
                </div>
                <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-500 hover:text-red-700 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ===== RENDER UTAMA =====
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1e3a8a] text-white flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold">absenKU</h1>
            <p className="text-xs text-blue-200">TKK Inviolata</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {[
            { id: 'monitoring', label: 'Monitoring', icon: <LayoutDashboard className="w-5 h-5" /> },
            { id: 'laporan', label: 'Laporan Rekap', icon: <BarChart3 className="w-5 h-5" /> },
            { id: 'pengguna', label: 'Kelola Guru', icon: <PersonStanding className="w-5 h-5" /> },
            { id: 'geofence', label: 'Geofencing', icon: <MapPinned className="w-5 h-5" /> },
            { id: 'aktivasi_absen', label: 'Aktivasi Absen', icon: <ToggleRight className="w-5 h-5" /> },
            { id: 'izin_tidak_masuk', label: 'Izin Tidak Masuk', icon: <MessageSquareWarning className="w-5 h-5" /> },
            { id: 'pengumuman', label: 'Pengumuman', icon: <Bell className="w-5 h-5" /> },
            { id: 'profile', label: 'Profil Admin', icon: <UserCircle className="w-5 h-5" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === item.id
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header (optional, sudah ada di dalam monitoring) */}
        <div className="mb-6">
          {/* Konten dinamis sesuai tab */}
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};