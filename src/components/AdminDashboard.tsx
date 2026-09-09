import React, { useState, useEffect } from 'react';
import { AttendanceRecord, GeofenceConfig, User } from '../types';
import { GeofenceMap } from './GeofenceMap';
import { AttendanceReports } from './AttendanceReports';
import { UserManagement } from './UserManagement';
import { AdminGeofenceSettings } from './AdminGeofenceSettings';
import { ActionMenuGrid } from './absenku/ActionMenuGrid';
import { TrackingLocationCard } from './absenku/TrackingLocationCard';
import { ReportRealtimeTable } from './absenku/ReportRealtimeTable';
import { AbsenKuLogo } from './absenku/AbsenKuLogo';
import { SelfieDetailModal, ProfilSekolahModal } from './absenku/AbsenKuModals';
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
  Unlock,
  Lock,
  Search,
  RefreshCw,
  Sparkles,
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
  activeTab: 'monitoring' | 'laporan' | 'pengguna' | 'geofence' | 'aktivasi_absen' | 'izin_terlambat' | 'izin_tidak_masuk' | 'pengumuman' | 'profile';
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

  // ===== STATE IZIN & AKTIVASI KUNCI ABSEN =====
  const [izinRequests, setIzinRequests] = useState<IzinRequest[]>([]);
  const [izinLoading, setIzinLoading] = useState(false);
  const [unlockedUserIds, setUnlockedUserIds] = useState<string[]>([]);
  const [aktivasiNotification, setAktivasiNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [searchTermIzin, setSearchTermIzin] = useState('');
  const [filterIzinStatus, setFilterIzinStatus] = useState<'all' | 'pending' | 'unlocked'>('all');

  // ===== STATE MODAL & DETAIL =====
  const [selectedSelfieRecord, setSelectedSelfieRecord] = useState<AttendanceRecord | null>(null);
  const [isProfilModalOpen, setIsProfilModalOpen] = useState(false);

  // ===== STATE PENGUMUMAN =====
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', date: '' });

  // ===== FETCH STATUS KUNCI ABSEN HARI INI =====
  const fetchUnlocks = async () => {
    try {
      const res = await fetch(`/api/attendance/unlocks?date=${todayStr}`);
      if (res.ok) {
        const d = await res.json();
        if (d.success && Array.isArray(d.data)) {
          setUnlockedUserIds(d.data.map(String));
        }
      }
    } catch (err) {
      console.warn('Gagal fetch status unlocks:', err);
    }
  };

  // ===== FETCH IZIN & ANNOUNCEMENTS =====
  useEffect(() => {
    fetchAnnouncements();
    fetchUnlocks();
  }, []);

  useEffect(() => {
    if (activeTab === 'izin_tidak_masuk' || activeTab === 'aktivasi_absen' || activeTab === 'izin_terlambat') {
      fetchIzin();
      fetchUnlocks();
    }
    if (activeTab === 'pengumuman' || activeTab === 'monitoring') {
      fetchAnnouncements();
    }
  }, [activeTab]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAnnouncements(data.data);
        }
      }
    } catch (error) {
      console.warn('Gagal fetch pengumuman:', error);
    }
  };

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

  // AKTIFKAN TOMBOL ABSEN UNTUK GURU / PEGAWAI TERTENTU
  const handleAktivasiAbsen = async (userId: string | number, izinId?: number, userName?: string) => {
    try {
      const res = await fetch('/api/attendance/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, date: todayStr, izin_id: izinId, action: 'activate' }),
      });
      const data = await res.json();
      if (data.success) {
        setAktivasiNotification({
          text: `✅ Tombol absen untuk "${userName || 'Guru/Pegawai'}" berhasil diaktifkan! Pengguna yang bersangkutan sekarang dapat melakukan presensi masuk di aplikasi/portal.`,
          type: 'success',
        });
        setUnlockedUserIds((prev) => Array.from(new Set([...prev, String(userId)])));
        await fetchIzin();
        await fetchUnlocks();
        if (onRefresh) onRefresh();
      } else {
        setAktivasiNotification({
          text: `❌ Gagal aktivasi tombol: ${data.error}`,
          type: 'error',
        });
      }
    } catch (error: any) {
      setAktivasiNotification({
        text: `❌ Error aktivasi: ${error.message}`,
        type: 'error',
      });
    }
  };

  // KUNCI KEMBALI JIKA DIBATALKAN
  const handleDeaktivasiAbsen = async (userId: string | number, izinId?: number, userName?: string) => {
    try {
      const res = await fetch('/api/attendance/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, date: todayStr, izin_id: izinId, action: 'deactivate' }),
      });
      const data = await res.json();
      if (data.success) {
        setAktivasiNotification({
          text: `🔒 Tombol absen untuk "${userName || 'Guru/Pegawai'}" berhasil dikunci kembali.`,
          type: 'success',
        });
        setUnlockedUserIds((prev) => prev.filter((id) => id !== String(userId)));
        await fetchIzin();
        await fetchUnlocks();
        if (onRefresh) onRefresh();
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  // AKTIFKAN SEMUA YANG MENUNGGU (KONDISI MASSAL/DARURAT)
  const handleAktivasiSemua = async (pendingList: any[]) => {
    if (pendingList.length === 0) return;
    try {
      for (const item of pendingList) {
        await fetch('/api/attendance/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: item.user_id, date: todayStr, izin_id: item.id, action: 'activate' }),
        });
      }
      setAktivasiNotification({
        text: `✅ Berhasil mengaktifkan tombol absen untuk ${pendingList.length} guru & pegawai sekaligus!`,
        type: 'success',
      });
      await fetchIzin();
      await fetchUnlocks();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Error aktivasi massal: ' + err.message);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert('Judul dan konten wajib diisi.');
      return;
    }
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          date: newAnnouncement.date || new Date().toISOString().split('T')[0],
          isPinned: false,
          author: 'Sr. Maria Inviolata, S.Pd. (Admin Utama)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAnnouncements();
        setNewAnnouncement({ title: '', content: '', date: '' });
        alert('✅ Pengumuman berhasil dipublikasikan ke Guru & Pegawai!');
      } else {
        alert('❌ Gagal tambah pengumuman: ' + data.error);
      }
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm('Hapus pengumuman ini?')) {
      try {
        const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchAnnouncements();
        }
      } catch (error) {
        console.error('Gagal hapus pengumuman:', error);
      }
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
      case 'izin_terlambat':
        return renderIzinTerlambat();
      case 'izin_tidak_masuk':
        return renderIzinTidakMasuk();
      case 'pengumuman':
        return renderPengumuman();
      case 'profile':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Profil Admin Utama</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>Nama Lengkap:</strong> {users.find((u) => u.role === 'ADMIN')?.name || 'Sr. Maria Inviolata, S.Pd.'}</p>
              <p><strong>Jabatan:</strong> Kepala Sekolah / Admin Utama TKK Inviolata Ruteng</p>
              <p><strong>Email:</strong> {users.find((u) => u.role === 'ADMIN')?.email || 'admin@tkkinviolata.sch.id'}</p>
              <p><strong>NIP:</strong> {users.find((u) => u.role === 'ADMIN')?.nip || '197508152002122001'}</p>
            </div>
          </div>
        );
      default:
        return <div>Halaman tidak ditemukan.</div>;
    }
  };

  // ===== DASHBOARD UTAMA – LAYOUT PERSIS SEPERTI GAMBAR (LAPTOP) =====
  const renderMonitoring = () => {
    return (
      <div className="space-y-6">
        {/* Banner Kartu Header @absenku profesional */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AbsenKuLogo variant="large" />
            <div className="border-l border-slate-200 pl-4">
              <h2 className="text-xs uppercase font-extrabold tracking-widest text-[#0088cc]">
                SISTEM PRESENSI ONLINE TKK INVIOLATA RUTENG
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring Realtime Kehadiran Guru & Pegawai berbasis Face Selfie & GPS Geofence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-blue-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0088cc]" />
              <span><strong>{totalStaffCount}</strong> Guru & Pegawai</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span><strong>{presentCount}</strong> Hadir</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-rose-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-600" />
              <span><strong>{absentCount}</strong> Belum Hadir</span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Action Menu (Left) & Tracking Location (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Action Menu Grid (7 Columns) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0088cc]"></span>
                <span>Menu Navigasi Utama Admin</span>
              </h3>
              <span className="text-[11px] text-slate-500">Klik menu untuk mengakses fitur</span>
            </div>

            <ActionMenuGrid
              onOpenMasterData={() => onTabChange('pengguna')}
              onOpenJadwalSentra={() => onTabChange('aktivasi_absen')}
              onOpenLaporan={() => onTabChange('laporan')}
              onOpenInformasiUmum={() => onTabChange('pengumuman')}
              onOpenPengaturanAbsensi={() => onTabChange('geofence')}
              onOpenPengaturanProfile={() => setIsProfilModalOpen(true)}
            />
          </div>

          {/* Tracking Location Card (5 Columns) */}
          <div className="lg:col-span-5">
            <TrackingLocationCard users={users} geofenceConfig={geofenceConfig} />
          </div>
        </div>

        {/* Report Absensi Realtime Table */}
        <ReportRealtimeTable
          users={users}
          records={records}
          onOpenSelfieModal={(rec) => setSelectedSelfieRecord(rec)}
        />
      </div>
    );
  };

  // ===== PERSETUJUAN IZIN TERLAMBAT & AKTIVASI TOMBOL ABSEN =====
  const renderIzinTerlambat = () => {
    // Filter izin terlambat
    const terlambatRequests = izinRequests.filter(
      (req) => req.type === 'terlambat_masuk' || req.type === 'terlambat' || req.type.toLowerCase().includes('terlambat')
    );

    // Hitung status
    const pendingRequests = terlambatRequests.filter((req) => !unlockedUserIds.includes(String(req.user_id)));
    const unlockedRequests = terlambatRequests.filter((req) => unlockedUserIds.includes(String(req.user_id)));

    // Filter pencarian & status
    const filteredList = terlambatRequests.filter((req) => {
      const matchSearch =
        req.user_name.toLowerCase().includes(searchTermIzin.toLowerCase()) ||
        (req.user_nip && req.user_nip.toLowerCase().includes(searchTermIzin.toLowerCase())) ||
        req.reason.toLowerCase().includes(searchTermIzin.toLowerCase());

      const isUnlocked = unlockedUserIds.includes(String(req.user_id));
      if (filterIzinStatus === 'pending') return matchSearch && !isUnlocked;
      if (filterIzinStatus === 'unlocked') return matchSearch && isUnlocked;
      return matchSearch;
    });

    // Staff lain yang belum absen hari ini (untuk opsi aktivasi manual langsung)
    const staffBelumAbsen = staffUsers.filter((u) => {
      const hasRecord = records.some((r) => r.userId === u.id.toString() && r.date === todayStr);
      return !hasRecord;
    });

    return (
      <div className="space-y-6">
        {/* Banner Alert Sukses / Info */}
        {aktivasiNotification && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all ${
              aktivasiNotification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg ${
                  aktivasiNotification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {aktivasiNotification.type === 'success' ? '✓' : '!'}
              </div>
              <p className="text-sm font-medium">{aktivasiNotification.text}</p>
            </div>
            <button
              onClick={() => setAktivasiNotification(null)}
              className="text-xs font-bold px-3 py-1 rounded-lg bg-white/70 hover:bg-white text-slate-700 transition"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Card Header & Penjelasan Workflow */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Persetujuan Izin Terlambat & Buka Kunci Absen
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Admin Utama menerima pengajuan izin terlambat dari Guru & Pegawai. Tombol absen di aplikasi staf terkunci otomatis jika terlambat dan baru dapat digunakan setelah Admin mengaktifkannya.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchIzin();
                  fetchUnlocks();
                }}
                disabled={izinLoading}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${izinLoading ? 'animate-spin' : ''}`} />
                <span>Segarkan Data</span>
              </button>

              {pendingRequests.length > 0 && (
                <button
                  onClick={() => handleAktivasiSemua(pendingRequests)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shadow-emerald-200 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aktifkan Semua ({pendingRequests.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Stat Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Pengajuan Terlambat</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{terlambatRequests.length}</p>
              </div>
              <Clock className="w-6 h-6 text-slate-400" />
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 font-medium">Menunggu Diaktifkan (Terkunci)</p>
                <p className="text-xl font-black text-amber-800 mt-0.5">{pendingRequests.length}</p>
              </div>
              <Lock className="w-6 h-6 text-amber-600" />
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 font-medium">Sudah Diaktifkan (Bisa Absen)</p>
                <p className="text-xl font-black text-emerald-800 mt-0.5">{unlockedRequests.length}</p>
              </div>
              <Unlock className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
                <button
                  onClick={() => setFilterIzinStatus('all')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterIzinStatus === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({terlambatRequests.length})
                </button>
                <button
                  onClick={() => setFilterIzinStatus('pending')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterIzinStatus === 'pending' ? 'bg-white text-amber-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Menunggu ({pendingRequests.length})
                </button>
                <button
                  onClick={() => setFilterIzinStatus('unlocked')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterIzinStatus === 'unlocked' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sudah Diaktifkan ({unlockedRequests.length})
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama atau NIP guru/pegawai..."
                value={searchTermIzin}
                onChange={(e) => setSearchTermIzin(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Tabel Data Guru & Pegawai Pengaju Izin Terlambat */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Daftar Permohonan Izin Terlambat ({filteredList.length})
            </h4>
            <span className="text-xs text-slate-500">Tanggal: {todayStr}</span>
          </div>

          {izinLoading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              Memuat data permohonan izin terlambat...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Tidak ada pengajuan izin terlambat yang cocok</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Semua guru & pegawai hadir tepat waktu atau belum ada pengajuan baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Guru / Pegawai</th>
                    <th className="p-4">Alasan Keterlambatan</th>
                    <th className="p-4">Tanggal & Waktu</th>
                    <th className="p-4 text-center">Status Tombol Absen</th>
                    <th className="p-4 text-center">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((req) => {
                    const isUnlocked = unlockedUserIds.includes(String(req.user_id));
                    const staffData = staffUsers.find((u) => u.id.toString() === req.user_id.toString());
                    const roleLabel = staffData?.role === 'STAFF' ? 'Pegawai' : 'Guru';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Nama Lengkap & NIP */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                              {req.user_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{req.user_name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span className="font-mono">{req.user_nip || 'NIP: -'}</span>
                                <span>•</span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                  {roleLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Alasan Keterlambatan */}
                        <td className="p-4">
                          <div className="max-w-xs">
                            <p className="text-xs text-slate-800 font-medium line-clamp-2">{req.reason}</p>
                            {req.attachment && (
                              <button
                                onClick={() => openAttachment(req.attachment!)}
                                className="mt-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                Lampiran Bukti
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Tanggal & Waktu Pengajuan */}
                        <td className="p-4">
                          <p className="text-xs font-semibold text-slate-700">{req.date}</p>
                          <p className="text-[11px] text-slate-400">
                            {req.created_at ? new Date(req.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WITA
                          </p>
                        </td>

                        {/* Status Tombol Absen di Aplikasi Guru/Pegawai */}
                        <td className="p-4 text-center">
                          {isUnlocked ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Unlock className="w-3.5 h-3.5" />
                              Sudah Diaktifkan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Lock className="w-3.5 h-3.5" />
                              Terkunci (Menunggu)
                            </span>
                          )}
                        </td>

                        {/* Aksi Tombol: Aktifkan Absen */}
                        <td className="p-4 text-center">
                          {isUnlocked ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-xs font-medium text-emerald-700">Dapat Absen</span>
                              <button
                                onClick={() => handleDeaktivasiAbsen(req.user_id, req.id, req.user_name)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200 transition"
                                title="Kunci kembali jika dibatalkan"
                              >
                                Kunci Lagi
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAktivasiAbsen(req.user_id, req.id, req.user_name)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-200 transition"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Aktifkan Absen</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section Buka Absen Langsung untuk Guru/Pegawai yang Belum Absen */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <UserCog className="w-4 h-4 text-slate-600" />
                Aktivasi Langsung untuk Guru & Pegawai Lain (Tanpa Form Izin)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin juga dapat mengaktifkan tombol absen secara langsung jika guru/pegawai menyampaikan keterlambatan secara lisan atau WhatsApp.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              {staffBelumAbsen.length} Guru/Pegawai Belum Absen
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffBelumAbsen.slice(0, 6).map((staff) => {
              const isUnlocked = unlockedUserIds.includes(String(staff.id));
              return (
                <div
                  key={staff.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{staff.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{staff.nip || staff.email}</p>
                  </div>
                  {isUnlocked ? (
                    <button
                      onClick={() => handleDeaktivasiAbsen(staff.id, undefined, staff.name)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition shrink-0"
                    >
                      Kunci Lagi
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAktivasiAbsen(staff.id, undefined, staff.name)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition shrink-0 flex items-center gap-1"
                    >
                      <Unlock className="w-3 h-3" />
                      Aktifkan
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
          {
            id: 'izin_terlambat',
            icon: <Clock className="w-4 h-4" />,
            label: 'Izin Terlambat & Buka Absen',
            badge: izinRequests.filter((r) => (r.type === 'terlambat_masuk' || r.type === 'terlambat' || r.type.includes('terlambat')) && !unlockedUserIds.includes(String(r.user_id))).length,
          },
          {
            id: 'izin_tidak_masuk',
            icon: <FileText className="w-4 h-4" />,
            label: 'Izin Tidak Masuk',
            badge: izinRequests.filter((r) => r.type === 'tidak_masuk' && r.status === 'pending').length,
          },
          { id: 'laporan', icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Laporan Rekap Excel' },
          { id: 'pengguna', icon: <Users className="w-4 h-4" />, label: 'Kelola Guru & Pegawai' },
          { id: 'geofence', icon: <Settings className="w-4 h-4" />, label: 'Pengaturan Geofencing TK' },
          { id: 'pengumuman', icon: <Megaphone className="w-4 h-4" />, label: 'Pengumuman' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {Boolean(tab.badge && tab.badge > 0) && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === tab.id ? 'bg-white text-emerald-700' : 'bg-amber-500 text-white'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {renderTabContent()}

      {/* Modal Detail Selfie */}
      {selectedSelfieRecord && (
        <SelfieDetailModal
          record={selectedSelfieRecord}
          onClose={() => setSelectedSelfieRecord(null)}
        />
      )}

      {/* Modal Profil Sekolah */}
      {isProfilModalOpen && (
        <ProfilSekolahModal onClose={() => setIsProfilModalOpen(false)} />
      )}
    </div>
  );
};