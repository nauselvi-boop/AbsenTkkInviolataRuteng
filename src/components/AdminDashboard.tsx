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
  Camera,
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

  // ===== APPROVE / REJECT IZIN =====
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

  // ===== LIHAT ATTACHMENT =====
  const openAttachment = (base64: string) => {
    if (!base64) return;
    window.open(base64, '_blank');
  };

  // ===== AKTIVASI TOMBOL ABSEN =====
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

  // ===== PENGUMUMAN =====
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

  // ===== DASHBOARD UTAMA (MONITORING) – TAMPILAN BARU LEBIH MENARIK =====
  const renderMonitoring = () => {
    return (
      <div className="space-y-6">
        {/* Statistik Ringkas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Guru & Staf</p>
              <p className="text-2xl font-bold text-gray-800">{totalStaffCount}</p>
              <p className="text-xs text-gray-400">Pegawai aktif terdaftar</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hadir Hari Ini</p>
              <p className="text-2xl font-bold text-blue-600">{presentCount}</p>
              <p className="text-xs text-gray-400">{totalStaffCount > 0 ? Math.round((presentCount / totalStaffCount) * 100) : 0}% kehadiran</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Terlambat</p>
              <p className="text-2xl font-bold text-amber-600">{lateCount}</p>
              <p className="text-xs text-gray-400">Lewat jam {geofenceConfig.checkInDeadlineTime}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-full">
              <UserX className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Belum Absen</p>
              <p className="text-2xl font-bold text-rose-600">{absentCount}</p>
              <p className="text-xs text-gray-400">Belum hadir</p>
            </div>
          </div>
        </div>

        {/* Kartu Peta & Aktivitas Masuk */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Peta Pemantauan Real-Time
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Live
              </span>
            </div>
            <div className="h-[350px] rounded-xl overflow-hidden">
              <GeofenceMap
                config={geofenceConfig}
                userLocation={null}
                allStaffLocations={staffPins}
                height="100%"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Radius: {geofenceConfig.radiusMeters}m</span>
              <span>Pin: lokasi absensi hari ini</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Aktivitas Masuk
              </h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{todayRecords.length} hari ini</span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {todayRecords.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Belum ada absensi hari ini.</p>
              ) : (
                todayRecords.slice(0, 10).map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3 border-b border-gray-100 pb-2">
                    <img src={rec.checkInPhoto} alt={rec.userName} className="w-10 h-10 rounded-full object-cover border" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{rec.userName}</p>
                      <p className="text-xs text-gray-500">{rec.checkInTime} • {rec.userRole}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rec.checkInStatus === 'TEPAT_WAKTU' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {rec.checkInStatus === 'TEPAT_WAKTU' ? 'Tepat' : 'Terlambat'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Kartu-Kartu Cepat (sesuai gambar) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Data Guru & Pegawai</h4>
                <p className="text-sm text-gray-500">Pendidik & Tenaga Kependidikan</p>
              </div>
            </div>
            <button onClick={() => onTabChange('pengguna')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Kelola →</button>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Jadwal Sentra & KBM</h4>
                <p className="text-sm text-gray-500">Balok, Alam, Seni & Rohani</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">Kurikulum Merdeka</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-full">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Rekap Absensi TK</h4>
                <p className="text-sm text-gray-500">Laporan Kehadiran & Unduh</p>
              </div>
            </div>
            <button onClick={() => onTabChange('laporan')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Lihat →</button>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <Megaphone className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Pengumuman Sekolah</h4>
                <p className="text-sm text-gray-500">Agenda & Informasi</p>
              </div>
            </div>
            <button onClick={() => onTabChange('pengumuman')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Baca →</button>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-full">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Lokasi & Jam Kerja</h4>
                <p className="text-sm text-gray-500">Geofence & Jadwal</p>
              </div>
            </div>
            <button onClick={() => onTabChange('geofence')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Atur →</button>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-full">
                <UserCog className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Profil & Password</h4>
                <p className="text-sm text-gray-500">Data Admin</p>
              </div>
            </div>
            <button onClick={() => onTabChange('profile')} className="mt-3 text-sm text-emerald-600 font-semibold hover:underline">Edit →</button>
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
    <div className="space-y-6">
      {/* Sub-Navigation Tabs (atas) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {[
          { id: 'monitoring', icon: <Activity className="w-4 h-4" />, label: 'Monitoring Real-Time & Peta' },
          { id: 'laporan', icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Laporan Rekap Excel' },
          { id: 'pengguna', icon: <Users className="w-4 h-4" />, label: 'Kelola Guru & Pegawai' },
          { id: 'geofence', icon: <Settings className="w-4 h-4" />, label: 'Pengaturan Geofencing TK' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
};