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

  // ===== MONITORING =====
  const renderMonitoring = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Guru & Staf</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalStaffCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pegawai aktif terdaftar</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Hadir Hari Ini</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{presentCount}</p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">
            {totalStaffCount > 0 ? Math.round((presentCount / totalStaffCount) * 100) : 0}% kehadiran
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase">Terlambat</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">{lateCount}</p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Lewat jam {geofenceConfig.checkInDeadlineTime}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-500 uppercase">Belum Absen</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2">{absentCount}</p>
          <p className="text-[11px] text-rose-700/80 mt-0.5">Guru & pegawai belum hadir</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Peta Pemantauan Lokasi Real-Time
              </h3>
              <p className="text-[11px] text-slate-500">Menampilkan zona geofence sekolah ({geofenceConfig.radiusMeters}m) dan koordinat absensi seluruh guru & staf hari ini.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Monitoring
            </div>
          </div>
          <GeofenceMap config={geofenceConfig} userLocation={null} allStaffLocations={staffPins} height="420px" />
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Titik hijau: Pusat Geofence {geofenceConfig.schoolName}</span>
            <span>Pin biru/oranye: Titik absensi live guru & staf hari ini</span>
          </div>
        </div>
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              Aktivitas Masuk Hari Ini
            </h3>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{todayRecords.length} Kehadiran</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[460px] pr-1">
            {todayRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">Belum ada guru atau pegawai yang melakukan absensi hari ini.</div>
            ) : (
              todayRecords.map((rec) => (
                <div key={rec.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={rec.checkInPhoto} alt={rec.userName} className="w-10 h-10 rounded-xl object-cover border border-emerald-500 shadow-xs" />
                      <div>
                        <p className="font-bold text-slate-900 text-xs leading-tight">{rec.userName}</p>
                        <p className="text-[10px] text-slate-500">{rec.userRole} • NIP: {rec.nip}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${rec.checkInStatus === 'TEPAT_WAKTU' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {rec.checkInStatus === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {rec.checkInTime} WIB
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      {rec.checkInLocation.distanceMeters}m (Lolos GPS)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

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