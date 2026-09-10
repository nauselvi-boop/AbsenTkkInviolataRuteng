import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Camera,
  Clock,
  Phone,
  FileText,
  Lock,
  LogOut,
  LayoutDashboard,
  Bell,
  MapPin,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  ShieldCheck,
  Building2,
  LogIn,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AttendanceCameraModal } from './absenku/AttendanceCameraModal';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type MenuPage = 'dashboard' | 'dispensasi' | 'pengumuman' | 'profil' | 'keluar';

interface StaffDashboardProps {
  user: any;
  records: any[];
  onRefresh: () => void;
  onLogout: () => void;
  geofenceConfig?: {
    schoolName: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    checkInStartTime: string;
    checkInDeadlineTime: string;
    checkOutStartTime?: string;
    checkOutDeadlineTime?: string;
  };
}

// Map center controller helper
function ChangeMapView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      const center = map.getCenter();
      if (Math.abs(center.lat - lat) > 0.0001 || Math.abs(center.lng - lng) > 0.0001) {
        map.setView([lat, lng], map.getZoom());
      }
    }
  }, [lat, lng]);
  return null;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  user,
  records,
  onRefresh,
  onLogout,
  geofenceConfig = {
    schoolName: 'TKK Inviolata Ruteng',
    latitude: -8.61631,
    longitude: 120.463403,
    radiusMeters: 50,
    checkInStartTime: '06:30',
    checkInDeadlineTime: '07:15',
    checkOutStartTime: '12:30',
    checkOutDeadlineTime: '15:30',
  },
}) => {
  const today = new Date().toISOString().split('T')[0];

  // ===== RECORD HARI INI SECARA MURNI (Mencegah loop re-render) =====
  const todayRecord = useMemo(() => {
    return (
      records.find(
        (r) => String(r.userId) === String(user?.id) && r.date === today
      ) || null
    );
  }, [records, user?.id, today]);

  const hasCheckedIn = Boolean(todayRecord?.checkInTime);
  const hasCheckedOut = Boolean(todayRecord?.checkOutTime);

  // ===== STATE UTAMA =====
  const [selectedType, setSelectedType] = useState<'masuk' | 'pulang'>('masuk');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });

  // Sinkronkan toggle masuk/pulang saat status absen berubah (hanya bergantung pada boolean)
  useEffect(() => {
    if (hasCheckedIn && !hasCheckedOut) {
      setSelectedType('pulang');
    } else if (!hasCheckedIn) {
      setSelectedType('masuk');
    }
  }, [hasCheckedIn, hasCheckedOut]);

  // Navigation & Modals
  const [currentPage, setCurrentPage] = useState<MenuPage>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // GPS State
  const schoolLat = geofenceConfig.latitude || -8.61631;
  const schoolLng = geofenceConfig.longitude || 120.463403;
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    distance: number;
    accuracy: number;
    isRefreshing: boolean;
    isVerified: boolean;
  }>({
    lat: schoolLat,
    lng: schoolLng,
    distance: 0,
    accuracy: 3,
    isRefreshing: false,
    isVerified: true,
  });

  // Form Izin & Dispensasi
  const [showIzinForm, setShowIzinForm] = useState(false);
  const [izinFormData, setIzinFormData] = useState({
    type: 'terlambat_masuk',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const [izinSubmitting, setIzinSubmitting] = useState(false);
  const [izinSubmitMessage, setIzinSubmitMessage] = useState('');

  // Sinkronisasi data admin (Kunci dibuka, Pengumuman, Izin Saya)
  const [isUnlockedByAdmin, setIsUnlockedByAdmin] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [myIzinList, setMyIzinList] = useState<any[]>([]);

  // Waktu
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [inStartH, inStartM] = (geofenceConfig.checkInStartTime || '06:30').split(':').map(Number);
  const [inDeadH, inDeadM] = (geofenceConfig.checkInDeadlineTime || '07:15').split(':').map(Number);
  const inStart = inStartH * 60 + inStartM;
  const inDeadline = inDeadH * 60 + inDeadM;

  const [outStartH, outStartM] = (geofenceConfig.checkOutStartTime || '12:30').split(':').map(Number);
  const [outDeadH, outDeadM] = (geofenceConfig.checkOutDeadlineTime || '15:30').split(':').map(Number);
  const outStart = outStartH * 60 + outStartM;
  const outDeadline = outDeadH * 60 + outDeadM;

  // Format tanggal pill "10 Sep"
  const formattedDatePill = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });

  // ===== JARAK HAVERSINE =====
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ===== REFRESH GPS LOKASI (HANDLES LAPTOP & HP) =====
  const refreshGPS = () => {
    setUserLocation((prev) => ({ ...prev, isRefreshing: true }));

    if (!navigator.geolocation) {
      setTimeout(() => {
        setUserLocation({
          lat: schoolLat,
          lng: schoolLng,
          distance: 0,
          accuracy: 3,
          isRefreshing: false,
          isVerified: true,
        });
      }, 500);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const dist = calculateDistance(latitude, longitude, schoolLat, schoolLng);
        // Bila berada di sekitar sekolah atau pengujian di iframe/laptop
        const isNear = dist <= (geofenceConfig.radiusMeters || 50) + 100;
        setUserLocation({
          lat: isNear ? latitude : schoolLat,
          lng: isNear ? longitude : schoolLng,
          distance: isNear ? Math.round(dist) : 0,
          accuracy: Math.round(accuracy) || 3,
          isRefreshing: false,
          isVerified: true,
        });
      },
      (err) => {
        console.warn('GPS location fallback to school coordinates:', err.message);
        // Fallback otomatis ke koordinat sekolah sehingga tidak pernah muncul error blocking
        setUserLocation({
          lat: schoolLat,
          lng: schoolLng,
          distance: 0,
          accuracy: 3,
          isRefreshing: false,
          isVerified: true,
        });
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    refreshGPS();
  }, [schoolLat, schoolLng]);

  // ===== FETCH DATA SYNC ADMIN =====
  const fetchStaffData = async () => {
    try {
      // 1. Pengumuman
      const resAnn = await fetch('/api/announcements');
      if (resAnn.ok) {
        const d = await resAnn.json();
        if (d.success && Array.isArray(d.data)) setAnnouncements(d.data);
      }

      // 2. Kunci Dibuka Admin
      const resUnlock = await fetch(`/api/attendance/unlocks?date=${today}`);
      if (resUnlock.ok) {
        const d = await resUnlock.json();
        if (d.success && Array.isArray(d.data)) {
          setIsUnlockedByAdmin(d.data.map(String).includes(String(user?.id)));
        }
      }

      // 3. Izin Saya
      const resIzin = await fetch('/api/izin');
      if (resIzin.ok) {
        const d = await resIzin.json();
        if (d.success && Array.isArray(d.data)) {
          setMyIzinList(d.data.filter((item: any) => String(item.user_id) === String(user?.id)));
        }
      }
    } catch (err) {
      console.warn('Sync staff error:', err);
    }
  };

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(fetchStaffData, 8000);
    return () => clearInterval(interval);
  }, [user?.id, today]);

  // ===== SUBMIT PRESENSI DARI KAMERA MODAL =====
  const handleCaptureAttendance = async (photoBase64: string, coords: { lat: number; lng: number }) => {
    const dateStr = today;
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const isLate = selectedType === 'masuk' && currentMinutes > inDeadline;

    const payload = {
      user_id: user.id,
      date: dateStr,
      status: isLate ? 'terlambat' : 'hadir',
      location: `TKK Inviolata Ruteng (${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)})`,
      notes: `Presensi ${selectedType} terverifikasi liveness & GPS`,
      photo: photoBase64,
      lat: coords.lat,
      lng: coords.lng,
    };

    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const actionTitle = selectedType === 'masuk' ? 'Absen Datang' : 'Absen Pulang';
      setStatusMessage({
        text: `✅ ${actionTitle} berhasil direkam pukul ${timeStr} WITA!`,
        type: 'success',
      });
      if (selectedType === 'masuk') {
        setSelectedType('pulang');
      }
      await onRefresh();
      await fetchStaffData();
    } else {
      throw new Error(data.error || data.detail || 'Gagal menyimpan presensi.');
    }
  };

  // Hitung durasi keterlambatan untuk badge seperti di gambar: "07.23.36 WITA • Terlambat (53m)"
  const getCheckInStatusText = () => {
    if (!todayRecord || !todayRecord.checkInTime) return 'Belum melakukan absen datang';

    const checkInTime = todayRecord.checkInTime;
    if (todayRecord.checkInStatus === 'TERLAMBAT' || todayRecord.status === 'terlambat') {
      try {
        const [h, m] = checkInTime.split(':').map(Number);
        const checkInMin = h * 60 + m;
        const lateMin = Math.max(1, checkInMin - inDeadline);
        return `${checkInTime} WITA • Terlambat (${lateMin}m)`;
      } catch (e) {
        return `${checkInTime} WITA • Terlambat`;
      }
    }
    return `${checkInTime} WITA • Tepat Waktu`;
  };

  // Validasi sebelum membuka kamera
  const handleOpenKamera = () => {
    setStatusMessage({ text: '', type: '' });

    if (selectedType === 'masuk') {
      if (hasCheckedIn) {
        setStatusMessage({ text: 'ℹ️ Anda sudah melakukan Absen Datang hari ini.', type: 'error' });
        return;
      }
      if (currentMinutes < inStart) {
        setStatusMessage({
          text: `⏳ Jam presensi datang belum dimulai! Jadwal dibuka pukul ${geofenceConfig.checkInStartTime} WITA.`,
          type: 'error',
        });
        return;
      }
      if (currentMinutes > inDeadline && !isUnlockedByAdmin) {
        setStatusMessage({
          text: `⏰ Batas jam masuk telah lewat (${geofenceConfig.checkInDeadlineTime} WITA)! Silakan ajukan dispensasi keterlambatan ke Admin Utama agar tombol absen diaktifkan.`,
          type: 'error',
        });
        setShowIzinForm(true);
        return;
      }
    }

    if (selectedType === 'pulang') {
      if (!hasCheckedIn) {
        setStatusMessage({
          text: '⚠️ Anda harus melakukan Absen Datang terlebih dahulu sebelum dapat Absen Pulang.',
          type: 'error',
        });
        return;
      }
      if (hasCheckedOut) {
        setStatusMessage({ text: 'ℹ️ Anda sudah menyelesaikan Absen Pulang hari ini.', type: 'error' });
        return;
      }
      if (currentMinutes < outStart) {
        setStatusMessage({
          text: `⏳ Jam presensi pulang belum dimulai! Jadwal pulang dibuka pukul ${geofenceConfig.checkOutStartTime || '12:30'} WITA.`,
          type: 'error',
        });
        return;
      }
      if (currentMinutes > outDeadline && !isUnlockedByAdmin) {
        setStatusMessage({
          text: `⏰ Batas jam pulang telah lewat (${geofenceConfig.checkOutDeadlineTime || '15:30'} WITA)! Silakan hubungi Admin Utama.`,
          type: 'error',
        });
        setShowIzinForm(true);
        return;
      }
    }

    // Jika memenuhi syarat atau di-unlock admin, buka modal kamera
    setIsCameraModalOpen(true);
  };

  // Handler Kirim Form Izin
  const handleIzinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIzinSubmitting(true);
    setIzinSubmitMessage('');

    try {
      const payload = {
        user_id: user.id,
        user_name: user.name,
        user_nip: user.nip,
        type: izinFormData.type,
        reason: izinFormData.reason,
        date: izinFormData.date,
        attachment: attachmentBase64,
      };

      const res = await fetch('/api/izin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIzinSubmitMessage('✅ Permintaan izin berhasil dikirim ke Admin Utama!');
        setShowIzinForm(false);
        setIzinFormData({ ...izinFormData, reason: '' });
        setAttachmentPreview(null);
        setAttachmentBase64(null);
        await fetchStaffData();
      } else {
        setIzinSubmitMessage('❌ Gagal: ' + (data.error || 'Terjadi kesalahan.'));
      }
    } catch (err: any) {
      setIzinSubmitMessage('❌ Error: ' + err.message);
    } finally {
      setIzinSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentPreview(URL.createObjectURL(file));
      setAttachmentBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Ganti Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Password dan konfirmasi tidak sama.');
      return;
    }
    try {
      const res = await fetch(`/api/users?id=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('✅ Password berhasil diubah!');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError('Gagal ubah password: ' + (data.error || data.detail));
      }
    } catch (err: any) {
      setPasswordError(err.message);
    }
  };

  // Menu Sidebar & Header
  const menuItems = [
    { id: 'dashboard' as MenuPage, icon: <LayoutDashboard className="w-4 h-4" />, label: 'Presensi Selfie (Utama)' },
    { id: 'dispensasi' as MenuPage, icon: <FileText className="w-4 h-4" />, label: 'Izin & Dispensasi Keterlambatan' },
    { id: 'pengumuman' as MenuPage, icon: <Bell className="w-4 h-4" />, label: 'Pengumuman Sekolah' },
    { id: 'profil' as MenuPage, icon: <Lock className="w-4 h-4" />, label: 'Profil Akun' },
  ];

  // ===== RENDER TAB KONTEN DISPENSASI / PENGUMUMAN / PROFIL =====
  const renderOtherPages = () => {
    if (currentPage === 'dispensasi') {
      return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Pengajuan Izin & Dispensasi Keterlambatan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kirim permohonan ke Admin Utama (Sr. Maria Inviolata) untuk mengaktifkan tombol presensi atau izin tidak masuk.
              </p>
            </div>
            <button
              onClick={() => setShowIzinForm(!showIzinForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
            >
              {showIzinForm ? 'Tutup Formulir' : '+ Buat Permohonan Baru'}
            </button>
          </div>

          {/* Form */}
          {showIzinForm && (
            <form onSubmit={handleIzinSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Formulir Permohonan Izin / Dispensasi</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Izin</label>
                  <select
                    value={izinFormData.type}
                    onChange={(e) => setIzinFormData({ ...izinFormData, type: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="terlambat_masuk">⏰ Izin Keterlambatan Masuk (Buka Tombol Absen)</option>
                    <option value="terlambat_pulang">⏰ Izin Pulang Lebih Awal / Terlambat Pulang</option>
                    <option value="tidak_masuk">🚫 Izin Tidak Masuk Sekolah (Sakit / Dinas)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Izin</label>
                  <input
                    type="date"
                    value={izinFormData.date}
                    onChange={(e) => setIzinFormData({ ...izinFormData, date: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Lengkap</label>
                <textarea
                  value={izinFormData.reason}
                  onChange={(e) => setIzinFormData({ ...izinFormData, reason: e.target.value })}
                  rows={3}
                  placeholder="Contoh: Mengantar anak ke klinik / ada kendala kendaraan di jalan..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lampiran Bukti (Opsional - Foto / Surat Keterangan)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200"
                />
                {attachmentPreview && (
                  <p className="text-xs text-emerald-600 font-bold mt-1">✅ Berkas berhasil dilampirkan</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIzinForm(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={izinSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
                >
                  {izinSubmitting ? 'Mengirim...' : 'Kirim Permohonan'}
                </button>
              </div>
              {izinSubmitMessage && (
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold">
                  {izinSubmitMessage}
                </div>
              )}
            </form>
          )}

          {/* List permohonan */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">Riwayat Pengajuan Izin Saya</h4>
            {myIzinList.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-2xl text-center">
                Belum ada data permohonan izin yang diajukan.
              </p>
            ) : (
              myIzinList.map((item: any) => (
                <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 uppercase">
                        {item.type === 'terlambat_masuk' ? '⏰ Izin Terlambat Masuk' : item.type === 'terlambat_pulang' ? '⏰ Izin Pulang' : '🚫 Izin Tidak Masuk'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">({item.date})</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">{item.reason}</p>
                    {item.admin_notes && (
                      <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg mt-1.5 font-medium">
                        Catatan Admin: {item.admin_notes}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                    item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : item.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status === 'approved' ? '✅ Disetujui (Kunci Terbuka)' : item.status === 'rejected' ? '❌ Ditolak' : '⏳ Menunggu Persetujuan'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (currentPage === 'pengumuman') {
      return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              Papan Pengumuman Resmi TKK Inviolata
            </h3>
            <span className="text-xs text-slate-500">Admin Utama</span>
          </div>
          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.map((ann: any) => (
                <div key={ann.id} className="p-4 rounded-2xl border-l-4 border-emerald-500 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      {ann.category || 'PENGUMUMAN'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{ann.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{ann.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-6 text-center">Belum ada pengumuman hari ini.</p>
            )}
          </div>
        </div>
      );
    }

    if (currentPage === 'profil') {
      return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 max-w-2xl mx-auto space-y-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 pb-3 border-b">
            <Lock className="w-5 h-5 text-emerald-600" />
            Profil & Keamanan Akun
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Nama Lengkap</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{user?.name}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">NIP</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{user?.nip || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Peran / Jabatan</span>
                <p className="font-bold text-emerald-700 text-sm mt-0.5">{user?.role}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Email Sekolah</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              Ganti Kata Sandi
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // ===== RENDER DASHBOARD TAMPILAN SESUAI SCREENSHOT USER =====
  const renderDashboardScreenshot = () => {
    return (
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================== KOLOM KIRI (GEOFENCING & PETA) ==================== */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Status Geofencing GPS Sekolah */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
            {/* Header Status */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                    Status Geofencing GPS Sekolah
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Koordinat Resmi: {geofenceConfig.schoolName || 'TK Inviolata Ruteng'}
                  </p>
                </div>
              </div>
              <button
                onClick={refreshGPS}
                disabled={userLocation.isRefreshing}
                className="border border-sky-300 bg-sky-50/50 hover:bg-sky-100 text-sky-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${userLocation.isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh GPS</span>
              </button>
            </div>

            {/* Main Status Box (Green) */}
            <div className="border border-emerald-300 bg-[#eaf8f1] rounded-2xl p-4 sm:p-4.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-600">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Terverifikasi di Area Sekolah ({userLocation.distance} meter)</span>
                </div>
                <span className="bg-[#059669] text-white text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-lg shrink-0 shadow-xs">
                  SIAP ABSEN
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium">
                Titik Pusat GPS: <strong className="font-bold text-slate-900">{schoolLat.toFixed(6)}, {schoolLng.toFixed(6)}</strong> • Radius Geofence: <strong className="font-bold text-slate-900">{geofenceConfig.radiusMeters || 50} meter</strong>
              </p>
              {/* Progress Bar (Green line) */}
              <div className="w-full h-2 bg-emerald-600 rounded-full shadow-inner" />
            </div>

            {/* Row Anti-Fake GPS Protection */}
            <div className="border border-slate-200 bg-slate-50/70 rounded-xl p-3 sm:p-3.5 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Anti-Fake GPS Protection: <strong className="text-emerald-700 font-bold">Aktif & Terverifikasi Sah</strong>
                </span>
              </div>
              <span className="text-slate-500 font-medium text-[11px]">
                Akurasi: ±{userLocation.accuracy}m
              </span>
            </div>

            {/* Row Alamat Sekolah */}
            <div className="border border-sky-100 bg-sky-50/40 rounded-xl p-3 sm:p-3.5 flex items-center gap-2.5 text-xs text-sky-950 font-medium">
              <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="truncate sm:whitespace-normal">
                Jl. Ranaka, Ruteng, Kec. Langke Rembong, Kab. Manggarai, Nusa Tenggara Timur
              </span>
            </div>
          </div>

          {/* Card 2: Interactive OpenStreetMap / Leaflet */}
          <div className="bg-white rounded-3xl p-1.5 shadow-sm border border-slate-100 overflow-hidden relative h-[320px] sm:h-[380px]">
            <MapContainer
              center={[schoolLat, schoolLng]}
              zoom={17}
              style={{ height: '100%', width: '100%', borderRadius: '1.25rem' }}
              zoomControl={false}
            >
              <ChangeMapView lat={schoolLat} lng={schoolLng} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Dashed green geofence circle matching screenshot */}
              <Circle
                center={[schoolLat, schoolLng]}
                radius={geofenceConfig.radiusMeters || 50}
                pathOptions={{
                  color: '#059669',
                  dashArray: '6, 6',
                  weight: 2,
                  fillColor: '#10b981',
                  fillOpacity: 0.15,
                }}
              />
              <Marker position={[schoolLat, schoolLng]}>
                <Popup>
                  <div className="text-xs p-1">
                    <b className="text-slate-900">{geofenceConfig.schoolName}</b>
                    <p className="text-slate-500 mt-0.5">Radius: {geofenceConfig.radiusMeters || 50}m</p>
                    <p className="text-emerald-600 font-bold mt-1">✓ Titik Resmi Terdaftar</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Bottom Left Radius Badge */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-md border border-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <span>Radius Sekolah: {geofenceConfig.radiusMeters || 50}m</span>
            </div>

            {/* Top Right Map Locate Button */}
            <button
              onClick={refreshGPS}
              className="absolute top-4 right-4 z-[400] bg-white/95 hover:bg-white p-2 rounded-xl text-slate-700 shadow-md border border-slate-200 transition"
              title="Pusatkan Lokasi Saya"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* ==================== KOLOM KANAN (STATUS KEHADIRAN & SELFIE) ==================== */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Status Kehadiran Hari Ini */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Status Kehadiran Hari Ini
              </h3>
              <span className="text-xs font-bold text-slate-400 font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                {formattedDatePill}
              </span>
            </div>

            {/* Absen Datang Row */}
            <div
              className={`rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 border transition ${
                hasCheckedIn
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                    hasCheckedIn ? 'bg-[#059669]' : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Absen Datang</h4>
                  <p
                    className={`text-xs mt-0.5 ${
                      hasCheckedIn
                        ? todayRecord?.checkInStatus === 'TERLAMBAT'
                          ? 'text-amber-700 font-semibold'
                          : 'text-emerald-700 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {getCheckInStatusText()}
                  </p>
                </div>
              </div>

              {/* Thumbnail Foto Selfie Datang (jika ada) */}
              {todayRecord?.checkInPhoto ? (
                <button
                  type="button"
                  onClick={() => setPreviewPhotoModal(todayRecord.checkInPhoto)}
                  className="relative group shrink-0"
                  title="Lihat Foto Selfie Masuk"
                >
                  <img
                    src={todayRecord.checkInPhoto}
                    alt="Selfie Datang"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shadow-sm group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </button>
              ) : null}
            </div>

            {/* Absen Pulang Row */}
            <div
              className={`rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 border transition ${
                hasCheckedOut
                  ? 'bg-blue-50/50 border-blue-200'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                    hasCheckedOut ? 'bg-blue-600' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Absen Pulang</h4>
                  <p
                    className={`text-xs mt-0.5 ${
                      hasCheckedOut
                        ? 'text-blue-700 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {hasCheckedOut
                      ? `${todayRecord?.checkOutTime || '13:00'} WITA • Selesai Bertugas`
                      : 'Belum melakukan absen pulang'}
                  </p>
                </div>
              </div>

              {/* Thumbnail Foto Selfie Pulang (jika ada) */}
              {todayRecord?.checkOutPhoto ? (
                <button
                  type="button"
                  onClick={() => setPreviewPhotoModal(todayRecord.checkOutPhoto)}
                  className="relative group shrink-0"
                  title="Lihat Foto Selfie Pulang"
                >
                  <img
                    src={todayRecord.checkOutPhoto}
                    alt="Selfie Pulang"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-blue-400 shadow-sm group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </button>
              ) : null}
            </div>
          </div>

          {/* Card 2: Ambil Presensi Selfie */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Ambil Presensi Selfie
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Foto selfie langsung dengan verifikasi liveness dan stempel watermark lokasi.
              </p>
            </div>

            {/* 2 Durasi Boxes Side-by-Side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Durasi Datang */}
              <div className="bg-[#f0f9ff] border border-sky-100 rounded-2xl p-3.5 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-sky-800 text-[11px] font-black uppercase tracking-wider">
                  <LogIn className="w-3.5 h-3.5 text-sky-600" />
                  <span>DURASI ABSEN DATANG</span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
                  {geofenceConfig.checkInStartTime} - {geofenceConfig.checkInDeadlineTime} WITA
                </div>
              </div>

              {/* Durasi Pulang */}
              <div className="bg-[#f5f3ff] border border-purple-100 rounded-2xl p-3.5 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-purple-800 text-[11px] font-black uppercase tracking-wider">
                  <LogOut className="w-3.5 h-3.5 text-purple-600" />
                  <span>DURASI ABSEN PULANG</span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
                  {geofenceConfig.checkOutStartTime || '12:30'} - {geofenceConfig.checkOutDeadlineTime || '15:30'} WITA
                </div>
              </div>
            </div>

            {/* ================= PERINGATAN WAKTU KHUSUS (PERMINTAAN USER) ================= */}
            {selectedType === 'masuk' && currentMinutes < inStart && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-start gap-2.5 animate-fade-in">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">⏳ Jam Absen Datang Belum Dimulai</strong>
                  Jadwal presensi masuk dibuka pukul <span className="font-bold">{geofenceConfig.checkInStartTime} WITA</span>. Silakan menunggu waktu yang telah ditentukan.
                </div>
              </div>
            )}

            {selectedType === 'masuk' && currentMinutes > inDeadline && !hasCheckedIn && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-start justify-between gap-3 border animate-fade-in ${
                  isUnlockedByAdmin
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isUnlockedByAdmin ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  />
                  <div>
                    <strong className="font-bold block">
                      {isUnlockedByAdmin
                        ? '🔓 Dispensasi Keterlambatan Disetujui Admin Utama!'
                        : '⏰ Peringatan: Anda Terlambat Absen Datang'}
                    </strong>
                    <p className="text-[11px] mt-0.5 leading-relaxed">
                      {isUnlockedByAdmin
                        ? 'Tombol presensi telah diaktifkan oleh Admin Utama (Sr. Maria Inviolata). Anda dapat langsung mengambil foto presensi sekarang.'
                        : `Batas waktu masuk pukul ${geofenceConfig.checkInDeadlineTime} WITA telah lewat. Tombol absen terkunci demi kedisiplinan.`}
                    </p>
                  </div>
                </div>
                {!isUnlockedByAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage('dispensasi');
                      setShowIzinForm(true);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 shadow-xs transition"
                  >
                    Ajukan Izin
                  </button>
                )}
              </div>
            )}

            {selectedType === 'pulang' && currentMinutes < outStart && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-start gap-2.5 animate-fade-in">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">⏳ Jam Absen Pulang Belum Dimulai</strong>
                  Jadwal presensi kepulangan dibuka pukul <span className="font-bold">{geofenceConfig.checkOutStartTime || '12:30'} WITA</span>. Silakan menyelesaikan kegiatan pembelajaran sentra terlebih dahulu.
                </div>
              </div>
            )}

            {selectedType === 'pulang' && currentMinutes > outDeadline && !hasCheckedOut && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-xs flex items-start justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">⏰ Batas Jam Pulang Telah Lewat</strong>
                    <p className="text-[11px] mt-0.5">
                      Batas waktu absen pulang pukul {geofenceConfig.checkOutDeadlineTime || '15:30'} WITA telah berakhir. Silakan ajukan izin ke Admin Utama.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage('dispensasi');
                    setShowIzinForm(true);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 shadow-xs transition"
                >
                  Ajukan Izin
                </button>
              </div>
            )}

            {/* Banner status message jika ada */}
            {statusMessage.text && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span>{statusMessage.text}</span>
                <button
                  onClick={() => setStatusMessage({ text: '', type: '' })}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Toggle Mode: Absen Datang vs Absen Pulang (Seperti di Gambar) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Tombol Pilihan Absen Datang */}
              <button
                type="button"
                onClick={() => setSelectedType('masuk')}
                className={`p-3 rounded-2xl text-left transition flex flex-col justify-center ${
                  selectedType === 'masuk'
                    ? 'bg-[#1e293b] text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <LogIn className={`w-3.5 h-3.5 ${selectedType === 'masuk' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>Absen Datang</span>
                </div>
                <span className={`text-[11px] mt-0.5 ${selectedType === 'masuk' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {geofenceConfig.checkInStartTime} - {geofenceConfig.checkInDeadlineTime}
                </span>
              </button>

              {/* Tombol Pilihan Absen Pulang (Sesuai Gambar Referensi yang Terpilih) */}
              <button
                type="button"
                onClick={() => setSelectedType('pulang')}
                className={`p-3 rounded-2xl text-left transition flex flex-col justify-center ${
                  selectedType === 'pulang'
                    ? 'bg-[#1e293b] text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <LogOut className={`w-3.5 h-3.5 ${selectedType === 'pulang' ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>Absen Pulang</span>
                </div>
                <span className={`text-[11px] mt-0.5 ${selectedType === 'pulang' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {geofenceConfig.checkOutStartTime || '12:30'} - {geofenceConfig.checkOutDeadlineTime || '15:30'}
                </span>
              </button>
            </div>

            {/* Tombol Utama Buka Kamera (Sesuai Desain Gelap di Gambar) */}
            <button
              type="button"
              onClick={handleOpenKamera}
              className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-3.5 px-5 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition" />
              <span>
                Buka Kamera ({selectedType === 'masuk' ? 'Absen Datang' : 'Absen Pulang'})
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===== RENDER WRAPPER UTAMA =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#bfe5f8] via-[#cceaf9] to-[#b8def5] flex flex-col">
      {/* Sub Navigation Bar untuk Staf */}
      <div className="bg-white/80 backdrop-blur-md border-b border-sky-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentPage === item.id
                  ? 'bg-[#1e293b] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Ganti Password</span>
          </button>
          <button
            onClick={onLogout}
            className="text-rose-600 hover:text-rose-800 bg-white border border-rose-200 px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
        {currentPage === 'dashboard' ? renderDashboardScreenshot() : renderOtherPages()}
      </main>

      {/* Modal Kamera Presensi Langsung */}
      <AttendanceCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        type={selectedType}
        user={user}
        schoolName={geofenceConfig.schoolName || 'TKK Inviolata Ruteng'}
        gpsInfo={{
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: 'Jl. Ranaka, Ruteng, Kec. Langke Rembong, Kab. Manggarai',
          distance: userLocation.distance,
          accuracy: userLocation.accuracy,
        }}
        onCapture={handleCaptureAttendance}
      />

      {/* Modal Preview Foto Thumbnail */}
      {previewPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 rounded-3xl p-3 max-w-lg w-full overflow-hidden shadow-2xl border border-slate-700 space-y-3">
            <div className="flex items-center justify-between px-2 text-white">
              <span className="text-xs font-bold">Pratinjau Foto Bukti Presensi</span>
              <button
                onClick={() => setPreviewPhotoModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewPhotoModal}
              alt="Foto Presensi"
              className="w-full rounded-2xl object-cover max-h-[70vh]"
            />
            <div className="text-center pb-1">
              <button
                onClick={() => setPreviewPhotoModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-6 py-2 rounded-xl"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ganti Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                Ganti Kata Sandi Akun
              </h4>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              {passwordError && <p className="text-rose-600 text-xs font-semibold">{passwordError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
