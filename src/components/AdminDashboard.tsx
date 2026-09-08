import React, { useState, useEffect } from 'react';
import { AttendanceRecord, GeofenceConfig, User, AttendanceUnlockRequest } from '../types';
import { AttendanceReports } from './AttendanceReports';
import { UserManagement } from './UserManagement';
import { AdminGeofenceSettings } from './AdminGeofenceSettings';
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  ShieldCheck,
  CheckSquare,
  Megaphone,
  CheckCircle,
  XCircle,
  FileText,
  Building2,
  Download,
} from 'lucide-react';
import { AbsenKuLogo } from './absenku/AbsenKuLogo';
import { ActionMenuGrid } from './absenku/ActionMenuGrid';
import { TrackingLocationCard } from './absenku/TrackingLocationCard';
import {
  MasterDataModal,
  JadwalSentraModal,
  PengaturanAbsensiModal,
  InformasiUmumModal,
  ProfilSekolahModal,
  SelfieDetailModal,
} from './absenku/AbsenKuModals';
import { PermohonanBukaKunciModal } from './absenku/PermohonanBukaKunciModal';
import { exportAttendanceToExcel } from '../utils/excelUtils';
import { ExcelReportDropdown } from './absenku/ExcelReportDropdown';

// Tipe data izin
interface IzinRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_nip: string;
  type: string;
  reason: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  attachment?: string;
  admin_notes?: string;
  created_at: string;
}

// Tipe data pengumuman
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
  activeTab: 'monitoring' | 'laporan' | 'pengguna' | 'geofence' | 'izin' | 'pengumuman' | 'profile';
  onTabChange: (tab: any) => void;
  reportPreset?: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
  onSelectReportPreset?: (preset: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH') => void;
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
  reportPreset = 'ALL',
  onSelectReportPreset,
}) => {
  const [internalReportPreset, setInternalReportPreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>(reportPreset);

  useEffect(() => {
    if (reportPreset) {
      setInternalReportPreset(reportPreset);
    }
  }, [reportPreset]);

  const handleNavigateToReportWithPreset = (preset: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL') => {
    setInternalReportPreset(preset);
    if (onSelectReportPreset) {
      onSelectReportPreset(preset);
    }
    onTabChange('laporan');
  };
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter((r) => r.date === todayStr);

  const staffUsers = users.filter((u) => u.role !== 'ADMIN');
  const totalStaffCount = staffUsers.length;
  const presentCount = todayRecords.length;
  const lateCount = todayRecords.filter((r) => r.checkInStatus === 'TERLAMBAT').length;
  const absentCount = Math.max(0, totalStaffCount - presentCount);

  // ---- Modals State ----
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [isJadwalSentraOpen, setIsJadwalSentraOpen] = useState(false);
  const [isInformasiUmumOpen, setIsInformasiUmumOpen] = useState(false);
  const [isPengaturanAbsensiOpen, setIsPengaturanAbsensiOpen] = useState(false);
  const [isProfilSekolahOpen, setIsProfilSekolahOpen] = useState(false);
  const [isDispensasiOpen, setIsDispensasiOpen] = useState(false);
  const [selectedSelfieRecord, setSelectedSelfieRecord] = useState<AttendanceRecord | null>(null);

  // ---- State Izin & Kunci ----
  const [izinRequests, setIzinRequests] = useState<IzinRequest[]>([]);
  const [izinLoading, setIzinLoading] = useState(false);

  // State for Dispensasi / Unlock Requests
  const [unlockRequests, setUnlockRequests] = useState<AttendanceUnlockRequest[]>([
    {
      id: 'req-1',
      userId: users.find((u) => u.role !== 'ADMIN')?.id || '2',
      userName: 'Ibu Yuliana Nardi, S.Pd.',
      userRole: 'GURU',
      requestType: 'MASUK',
      reason: 'GPS HP sempat lemah saat tiba di gerbang TKK Inviolata pukul 07.15 WITA',
      requestedAt: new Date().toISOString(),
      status: 'MENUNGGU',
    },
  ]);

  // ---- State Pengumuman ----
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
      title: 'Rapat Guru Sentra & KBM',
      content: 'Jumat, 11 September 2026 pukul 12:30 WITA di Ruang Guru TKK Inviolata',
      date: '2026-09-11',
      isPinned: false,
    },
  ]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', date: '' });

  // Fetch Izin saat tab aktif
  useEffect(() => {
    if (activeTab === 'izin') {
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
    } catch (err) {
      console.error('Gagal memuat izin:', err);
    } finally {
      setIzinLoading(false);
    }
  };

  const handleApproveIzin = async (id: number) => {
    try {
      const res = await fetch(`/api/izin/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: 'Disetujui oleh Kepala Sekolah' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchIzin();
      }
    } catch (err) {
      console.error('Gagal approve izin:', err);
    }
  };

  const handleRejectIzin = async (id: number) => {
    try {
      const res = await fetch(`/api/izin/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: 'Ditolak' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchIzin();
      }
    } catch (err) {
      console.error('Gagal reject izin:', err);
    }
  };

  const handleApproveUnlock = (requestId: string) => {
    setUnlockRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'DISETUJUI' } : r))
    );
  };

  const handleRejectUnlock = (requestId: string) => {
    setUnlockRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'DITOLAK' } : r))
    );
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    const newItem: Announcement = {
      id: Date.now().toString(),
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      date: newAnnouncement.date || todayStr,
      isPinned: false,
    };
    setAnnouncements([newItem, ...announcements]);
    setNewAnnouncement({ title: '', content: '', date: '' });
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter((a) => a.id !== id));
  };

  const handleExportExcel = () => {
    exportAttendanceToExcel(
      records,
      `Rekap_Presensi_TKK_Inviolata_${todayStr}.xlsx`
    );
  };

  const openAttachment = (url: string) => {
    const w = window.open();
    if (w) {
      w.document.write(`<img src="${url}" style="max-width:100%; height:auto;" />`);
    }
  };

  // ---- 1. MONITORING TAB (Exact Match to Screenshot) ----
  const renderMonitoring = () => (
    <div className="space-y-4">
      {/* Top Breadcrumb Card */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 text-slate-800">
          <Building2 className="w-4 h-4 text-[#0088cc]" />
          <h2 className="font-bold text-xs sm:text-sm">
            Dashboard Presensi TKK Inviolata Ruteng
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDispensasiOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Daftar Dispensasi</span>
          </button>
          <ExcelReportDropdown
            records={records}
            variant="button"
            onNavigateToReport={handleNavigateToReportWithPreset}
          />
        </div>
      </div>

      {/* Two-Column Grid matching Screenshot 2026-09-05 120732.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: absenKU Card with 6 Action Buttons */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            {/* Swirl Logo + absenKU */}
            <div className="flex items-center gap-2.5">
              <AbsenKuLogo size="md" variant="dark" />
            </div>

            {/* Admin Utama Profile */}
            <div className="text-right">
              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-0.5">
                Admin Utama
              </span>
              <p className="font-bold text-slate-800 text-xs sm:text-sm">
                Sr. Maria Inviolata, S.Pd.
              </p>
            </div>
          </div>

          {/* 6 Action Menu Buttons */}
          <div className="mt-4 flex-1">
            <ActionMenuGrid
              onOpenMasterData={() => setIsMasterDataOpen(true)}
              onOpenJadwalSentra={() => setIsJadwalSentraOpen(true)}
              onOpenLaporan={() => onTabChange('laporan')}
              onOpenInformasiUmum={() => setIsInformasiUmumOpen(true)}
              onOpenPengaturanAbsensi={() => setIsPengaturanAbsensiOpen(true)}
              onOpenPengaturanProfile={() => setIsProfilSekolahOpen(true)}
            />
          </div>
        </div>

        {/* Right Column: Tracking Lokasi Guru TKK Inviolata */}
        <div className="lg:col-span-5 flex flex-col">
          <TrackingLocationCard
            users={users}
            geofenceConfig={geofenceConfig}
          />
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Guru & Staf
            </span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{totalStaffCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Pendidik & Pegawai aktif</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Hadir Hari Ini
            </span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{presentCount}</p>
          <p className="text-[10px] text-emerald-700/80 mt-0.5">
            {totalStaffCount > 0 ? Math.round((presentCount / totalStaffCount) * 100) : 0}% kehadiran
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Terlambat
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-amber-600 mt-1">{lateCount}</p>
          <p className="text-[10px] text-amber-700/80 mt-0.5">Lewat jam {geofenceConfig.checkInDeadlineTime}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
              Belum Absen
            </span>
            <UserX className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-xl font-extrabold text-rose-600 mt-1">{absentCount}</p>
          <p className="text-[10px] text-rose-700/80 mt-0.5">Belum tap presensi masuk</p>
        </div>
      </div>

      {/* Aktivitas Presensi Hari Ini */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0088cc]" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-800">
              Aktivitas Presensi Terkini Hari Ini
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {todayRecords.length} catatan hari ini
          </span>
        </div>

        {todayRecords.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            Belum ada data presensi hari ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {todayRecords.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {rec.checkInPhoto ? (
                    <img
                      src={rec.checkInPhoto}
                      alt={rec.userName}
                      onClick={() => setSelectedSelfieRecord(rec)}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition"
                      title="Klik untuk melihat bukti foto selfie"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {rec.userName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 text-xs">{rec.userName}</p>
                    <p className="text-[10px] text-slate-500">
                      NIP: {rec.nip} • {rec.userRole}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.checkInStatus === 'TEPAT_WAKTU'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rec.checkInTime} WITA ({rec.checkInStatus === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'})
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    GPS: {rec.checkInLocation.distanceMeters}m (Radius {geofenceConfig.radiusMeters}m)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ---- 2. IZIN & KUNCI TAB ----
  const renderIzin = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
        <CheckSquare className="w-5 h-5 text-[#0088cc]" />
        Persetujuan Izin & Kunci Presensi
      </h3>
      {izinLoading ? (
        <p className="text-center text-slate-500">Memuat data...</p>
      ) : izinRequests.length === 0 ? (
        <p className="text-center text-slate-400">Tidak ada permintaan izin aktif saat ini.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="p-3 text-left">Nama</th>
                <th className="p-3 text-left">NIP</th>
                <th className="p-3 text-left">Tanggal</th>
                <th className="p-3 text-left">Jenis</th>
                <th className="p-3 text-left">Alasan</th>
                <th className="p-3 text-left">Bukti</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {izinRequests.map((req) => (
                <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium">{req.user_name}</td>
                  <td className="p-3 text-xs">{req.user_nip}</td>
                  <td className="p-3 text-xs">{req.date}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        req.type === 'dispensasi'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {req.type === 'dispensasi' ? '🔓 Dispensasi' : '📝 Izin'}
                    </span>
                  </td>
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
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        req.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : req.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status === 'pending'
                        ? '⏳ Menunggu'
                        : req.status === 'approved'
                        ? '✅ Disetujui'
                        : '❌ Ditolak'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {req.status === 'pending' && (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleApproveIzin(req.id)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Setujui"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectIzin(req.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Tolak"
                        >
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

  // ---- 3. PENGUMUMAN TAB ----
  const renderPengumuman = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-[#0088cc]" />
        Pengumuman Sekolah TKK Inviolata
      </h3>

      <div className="bg-slate-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-slate-700 mb-2">Tambah Pengumuman Baru</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Judul Pengumuman"
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
            className="border border-slate-200 rounded-lg p-2 text-sm bg-white"
          />
          <input
            type="text"
            placeholder="Isi Pengumuman"
            value={newAnnouncement.content}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
            className="border border-slate-200 rounded-lg p-2 text-sm bg-white"
          />
          <input
            type="date"
            value={newAnnouncement.date}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, date: e.target.value })}
            className="border border-slate-200 rounded-lg p-2 text-sm bg-white"
          />
        </div>
        <button
          onClick={handleAddAnnouncement}
          className="mt-3 bg-[#0088cc] hover:bg-[#0077b5] text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Publikasikan Pengumuman
        </button>
      </div>

      <div className="space-y-3">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="border border-slate-200 p-4 rounded-xl flex justify-between items-start hover:bg-slate-50 transition"
          >
            <div>
              <h5 className="font-bold text-slate-800 text-sm">{item.title}</h5>
              <p className="text-slate-600 text-xs mt-1">{item.content}</p>
              <span className="text-[10px] text-slate-400 mt-2 block">{item.date}</span>
            </div>
            <button
              onClick={() => handleDeleteAnnouncement(item.id)}
              className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ---- TAB SWITCHER DISPATCH ----
  const renderTabContent = () => {
    switch (activeTab) {
      case 'monitoring':
        return renderMonitoring();
      case 'laporan':
        return (
          <AttendanceReports
            records={records}
            isPersonalView={false}
            initialDatePreset={reportPreset || internalReportPreset}
          />
        );
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
      case 'izin':
        return renderIzin();
      case 'pengumuman':
        return renderPengumuman();
      case 'profile':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-xl font-bold text-slate-800">Profil Administrator Utama</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-500 w-32 inline-block">Nama:</span>
                {users.find((u) => u.role === 'ADMIN')?.name || 'Sr. Maria Inviolata, S.Pd.'}
              </p>
              <p>
                <span className="font-semibold text-slate-500 w-32 inline-block">Jabatan:</span>
                Kepala Sekolah & Penanggung Jawab
              </p>
              <p>
                <span className="font-semibold text-slate-500 w-32 inline-block">Email:</span>
                {users.find((u) => u.role === 'ADMIN')?.email || 'kepala@tkkinviolata.sch.id'}
              </p>
              <p>
                <span className="font-semibold text-slate-500 w-32 inline-block">NIP:</span>
                {users.find((u) => u.role === 'ADMIN')?.nip || '197805122002122001'}
              </p>
              <p>
                <span className="font-semibold text-slate-500 w-32 inline-block">Lembaga:</span>
                TKK Inviolata Ruteng (Manggarai, NTT)
              </p>
            </div>
          </div>
        );
      default:
        return <div>Halaman tidak ditemukan.</div>;
    }
  };

  return (
    <div className="space-y-4">
      {renderTabContent()}

      {/* ================= MODALS ACCESSED VIA ACTION BUTTONS ================= */}
      {/* 1. Master Data Guru & Pegawai Modal */}
      <MasterDataModal
        isOpen={isMasterDataOpen}
        onClose={() => setIsMasterDataOpen(false)}
        users={users}
        onAddUser={onAddUser}
        onUpdateUser={onUpdateUser}
        onDeleteUser={onDeleteUser}
        onImportUsers={onImportUsers}
      />

      {/* 2. Jadwal Sentra & KBM Modal */}
      <JadwalSentraModal
        isOpen={isJadwalSentraOpen}
        onClose={() => setIsJadwalSentraOpen(false)}
      />

      {/* 3. Informasi Umum / Pengumuman Sekolah Modal */}
      <InformasiUmumModal
        isOpen={isInformasiUmumOpen}
        onClose={() => setIsInformasiUmumOpen(false)}
      />

      {/* 4. Pengaturan Absensi / Geofence GPS Modal */}
      <PengaturanAbsensiModal
        isOpen={isPengaturanAbsensiOpen}
        onClose={() => setIsPengaturanAbsensiOpen(false)}
        config={geofenceConfig}
        onSaveConfig={onSaveGeofenceConfig}
      />

      {/* 5. Profil TKK Inviolata Ruteng Modal */}
      <ProfilSekolahModal
        isOpen={isProfilSekolahOpen}
        onClose={() => setIsProfilSekolahOpen(false)}
      />

      {/* 6. Dispensasi & Buka Kunci Presensi Modal */}
      <PermohonanBukaKunciModal
        isOpen={isDispensasiOpen}
        onClose={() => setIsDispensasiOpen(false)}
        requests={unlockRequests}
        onApproveRequest={handleApproveUnlock}
        onRejectRequest={handleRejectUnlock}
        currentUser={users.find((u) => u.role === 'ADMIN') || users[0]}
      />

      {/* 7. Selfie Detail Preview Modal */}
      <SelfieDetailModal
        record={selectedSelfieRecord}
        onClose={() => setSelectedSelfieRecord(null)}
      />
    </div>
  );
};
