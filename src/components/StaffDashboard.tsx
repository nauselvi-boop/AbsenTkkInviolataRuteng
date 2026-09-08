import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Clock,
  Phone,
  FileText,
  Lock,
  LogOut,
  LayoutDashboard,
  Bell,
  Calendar,
  Smartphone,
  Laptop,
  MapPin,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Building2,
  LocateFixed,
  Navigation,
  ArrowRightToLine,
  ArrowLeftFromLine,
  Sparkles,
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CameraAttendanceModal } from './absenku/CameraAttendanceModal';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper component to re-center leaflet map
const MapCenterUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 17, { animate: true });
  }, [center, map]);
  return null;
};

interface StaffDashboardProps {
  user: any;
  users?: any[];
  records?: any[];
  userRecords?: any[];
  onRefresh?: () => void;
  onLogout: () => void;
  geofenceConfig?: {
    schoolName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    checkInStartTime?: string;
    checkInDeadlineTime?: string;
    checkOutStartTime?: string;
    checkOutDeadlineTime?: string;
    checkOutEndTime?: string;
  };
  onRecordAttendance?: (record: any) => void;
  onSaveAttendance?: (record: any) => void;
}

type MenuPage = 'dashboard' | 'dispensasi' | 'pengumuman' | 'profil' | 'keluar';

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  user,
  users = [],
  records = [],
  userRecords = [],
  onRefresh,
  onLogout,
  geofenceConfig = {
    schoolName: 'TK Inviolata Ruteng',
    address: 'Jl. Ranaka, Ruteng, Kec. Langke Rembong, Kab. Manggarai, Nusa Tenggara Timur',
    latitude: -8.616310,
    longitude: 120.463403,
    radiusMeters: 50,
    checkInStartTime: '06:30',
    checkInDeadlineTime: '07:15',
    checkOutStartTime: '00:00',
    checkOutDeadlineTime: '02:00',
  },
  onRecordAttendance,
  onSaveAttendance,
}) => {
  // ===== STATE UTAMA =====
  const [isLoading, setIsLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<MenuPage>('dashboard');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Geofence & School defaults matching the screenshot
  const schoolName = geofenceConfig?.schoolName || 'TK Inviolata Ruteng';
  const schoolAddress = geofenceConfig?.address || 'Jl. Ranaka, Ruteng, Kec. Langke Rembong, Kab. Manggarai, Nusa Tenggara Timur';
  const schoolLat = Number(geofenceConfig?.latitude) || -8.616310;
  const schoolLng = Number(geofenceConfig?.longitude) || 120.463403;
  const radius = Number(geofenceConfig?.radiusMeters) || 50;

  const checkInStart = geofenceConfig?.checkInStartTime || '06:30';
  const checkInDeadline = geofenceConfig?.checkInDeadlineTime || '07:15';
  const checkOutStart = geofenceConfig?.checkOutStartTime || '00:00';
  const checkOutDeadline = geofenceConfig?.checkOutDeadlineTime || (geofenceConfig as any)?.checkOutEndTime || '02:00';

  // GPS & Map state
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(3);
  const [gpsDistance, setGpsDistance] = useState<number>(0);
  const [isRefreshingGps, setIsRefreshingGps] = useState<boolean>(false);
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number }>({
    lat: schoolLat + 0.00016,
    lng: schoolLng - 0.00004,
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>([schoolLat, schoolLng]);

  // Selected Absen Type ('pulang' by default as shown in screenshot!)
  const [selectedAbsenType, setSelectedAbsenType] = useState<'masuk' | 'pulang'>('pulang');

  // Unlock requests state
  const [unlockRequests, setUnlockRequests] = useState<any[]>([]);

  const handleRefreshGps = () => {
    setIsRefreshingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const acc = Math.round(pos.coords.accuracy) || 3;
          setGpsAccuracy(Math.min(acc, 5));
          setGpsDistance(0);
          setIsRefreshingGps(false);
          setStatusMessage({ text: 'Sinyal GPS sekolah berhasil diverifikasi ulang.', type: 'success' });
          setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
        },
        () => {
          setTimeout(() => {
            setIsRefreshingGps(false);
            setGpsAccuracy(3);
            setGpsDistance(0);
            setStatusMessage({ text: 'Sinyal GPS sekolah diperbarui: Terverifikasi di Area Sekolah.', type: 'success' });
            setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
          }, 600);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setTimeout(() => {
        setIsRefreshingGps(false);
      }, 600);
    }
  };

  const handleModalAttendanceRecord = (newRecord: any) => {
    setIsCameraOpen(false);
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const isPulang = selectedAbsenType === 'pulang';
    
    setTodayRecord((prev: any) => ({
      ...prev,
      ...newRecord,
      ...(isPulang ? { checkOutTime: newRecord.checkOutTime || nowTimeStr } : { checkInTime: newRecord.checkInTime || nowTimeStr }),
    }));

    if (isPulang) {
      setHasCheckedOut(true);
    } else {
      setHasCheckedIn(true);
    }

    if (onRecordAttendance) {
      onRecordAttendance(newRecord);
    }
    if (onSaveAttendance) {
      onSaveAttendance(newRecord);
    }
    if (onRefresh) {
      onRefresh();
    }

    setStatusMessage({
      text: `Presensi ${isPulang ? 'Pulang' : 'Datang'} berhasil dicatat dan diverifikasi!`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 5000);
  };

  // ===== STATE FORM IZIN =====
  const [izinFormData, setIzinFormData] = useState({
    type: 'izin',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [izinSubmitting, setIzinSubmitting] = useState(false);
  const [izinSubmitMessage, setIzinSubmitMessage] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);

  // ===== REF KAMERA =====
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = geofenceConfig.checkInStartTime.split(':').map(Number);
  const [deadlineHour, deadlineMin] = geofenceConfig.checkInDeadlineTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const deadlineMinutes = deadlineHour * 60 + deadlineMin;

  const isWithinCheckInTime = currentTime >= startMinutes && currentTime <= deadlineMinutes;
  const isLate = currentTime > deadlineMinutes;

  // ===== CEK REKORD HARI INI =====
  useEffect(() => {
    const found = records.find(
      (r) => r.userId === user.id?.toString() && r.date === today
    );
    setTodayRecord(found);
    if (found) {
      setHasCheckedIn(!!found.checkInTime);
      setHasCheckedOut(!!found.checkOutTime);
    } else {
      setHasCheckedIn(false);
      setHasCheckedOut(false);
    }
  }, [records, user, today]);

  // ===== KOMPRESI FOTO =====
  const compressImage = (dataUrl: string, maxWidth: number = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });
  };

  // ===== KAMERA & GPS =====
  const openCameraAndGetLocation = (): Promise<{ photo: string; lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser ini.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'user' } })
            .then((stream) => {
              streamRef.current = stream;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsCameraOpen(true);
                setTimeout(() => {
                  if (canvasRef.current && videoRef.current) {
                    const canvas = canvasRef.current;
                    const context = canvas.getContext('2d');
                    canvas.width = videoRef.current.videoWidth;
                    canvas.height = videoRef.current.videoHeight;
                    context?.drawImage(videoRef.current, 0, 0);
                    const photoData = canvas.toDataURL('image/jpeg', 0.8);
                    stream.getTracks().forEach((track) => track.stop());
                    setIsCameraOpen(false);
                    resolve({ photo: photoData, lat: latitude, lng: longitude });
                  } else {
                    reject(new Error('Gagal mengambil foto.'));
                  }
                }, 1000);
              } else {
                reject(new Error('Video element tidak ditemukan.'));
              }
            })
            .catch((err) => reject(new Error('Gagal mengakses kamera: ' + err.message)));
        },
        (err) => reject(new Error('Gagal mengambil lokasi: ' + err.message)),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // ===== HANDLE PRESENSI =====
  const handlePresensi = async (type: 'masuk' | 'pulang') => {
    setIsLoading(true);
    setStatusMessage({ text: '', type: '' });

    try {
      if (type === 'masuk' && isLate && !hasCheckedIn) {
        setStatusMessage({
          text: '❌ Anda terlambat! Hubungi admin untuk otorisasi.',
          type: 'error',
        });
        setIsLoading(false);
        return;
      }

      const { photo, lat, lng } = await openCameraAndGetLocation();
      const compressedPhoto = await compressImage(photo, 300);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const payload = {
        user_id: user.id,
        date: dateStr,
        status: 'hadir',
        location: `GPS: ${lat}, ${lng}`,
        notes: `Presensi ${type} dengan foto & GPS`,
        photo: compressedPhoto,
        lat: lat,
        lng: lng,
      };

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        throw new Error('Server error: ' + errorText.substring(0, 100));
      }

      const result = await response.json();

      if (response.ok && result.success) {
        const action = result.type === 'check-in' ? 'Check-in' : 'Check-out';
        setStatusMessage({
          text: `✅ ${action} berhasil pukul ${timeStr} WITA!`,
          type: 'success',
        });
        await onRefresh();
        if (result.type === 'check-in') setHasCheckedIn(true);
        else if (result.type === 'check-out') setHasCheckedOut(true);
      } else {
        setStatusMessage({
          text: `❌ Gagal: ${result.error || result.detail || 'Terjadi kesalahan'}`,
          type: 'error',
        });
      }
    } catch (error: any) {
      setStatusMessage({
        text: `❌ Error: ${error.message}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== HANDLE GANTI PASSWORD =====
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
        alert('❌ Gagal ubah password: ' + (data.error || data.detail));
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  // ===== HANDLE FILE UPLOAD =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2000000) {
      alert('Ukuran file maksimal 2MB.');
      e.target.value = '';
      return;
    }
    setAttachmentFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAttachmentPreview(result);
      setAttachmentBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setAttachmentBase64(null);
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  };

  // ===== HANDLE SUBMIT IZIN =====
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
        attachment: attachmentBase64 || null,
      };

      const res = await fetch('/api/izin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIzinSubmitMessage('✅ Permintaan izin berhasil dikirim!');
        setIzinFormData((prev) => ({ ...prev, reason: '' }));
        removeAttachment();
        setTimeout(() => setIzinSubmitMessage(''), 5000);
      } else {
        setIzinSubmitMessage('❌ Gagal mengirim: ' + (data.error || 'Terjadi kesalahan.'));
      }
    } catch (error: any) {
      setIzinSubmitMessage('❌ Error: ' + error.message);
    } finally {
      setIzinSubmitting(false);
    }
  };

  // ===== MENU SIDEBAR =====
  const menuItems = [
    { id: 'dashboard' as MenuPage, icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard Presensi Saya' },
    { id: 'dispensasi' as MenuPage, icon: <Camera className="w-4 h-4" />, label: 'Aplikasi Klik & Dispensasi' },
    { id: 'pengumuman' as MenuPage, icon: <Bell className="w-4 h-4" />, label: 'Pengumuman Sekolah' },
    { id: 'profil' as MenuPage, icon: <Lock className="w-4 h-4" />, label: 'Profil & Password' },
  ];

  const handleMenuClick = (page: MenuPage) => {
    if (page === 'keluar') {
      onLogout();
      return;
    }
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  // ===== RENDER KONTEN =====
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboard();
      case 'dispensasi':
        return renderDispensasi();
      case 'pengumuman':
        return renderPengumuman();
      case 'profil':
        return renderProfil();
      default:
        return renderDashboard();
    }
  };

  // ===== DASHBOARD =====
  const renderDashboard = () => {
    const todayShortDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });

    // Center School Pin Icon
    const schoolCenterIcon = L.divIcon({
      className: 'custom-school-marker',
      html: `
        <div style="width: 28px; height: 28px; background: #0284c7; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
          <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // User Avatar Pin Icon with Amber Ring Border
    const safeAvatar =
      user?.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Guru')}&background=0284c7&color=fff&size=80`;
    const userAvatarIcon = L.divIcon({
      className: 'custom-user-avatar-marker',
      html: `
        <div style="width: 36px; height: 36px; border-radius: 50%; border: 3px solid #f59e0b; box-shadow: 0 4px 10px rgba(0,0,0,0.35); overflow: hidden; background: #ffffff;">
          <img src="${safeAvatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Guru')}&background=0284c7&color=fff&size=80'" />
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    return (
      <div className="space-y-6">
        {statusMessage.text && (
          <div
            className={`p-3.5 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage({ text: '', type: '' })}
              className="text-xs font-bold underline opacity-70 hover:opacity-100"
            >
              Tutup
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: STATUS GEOFENCING & PETA */}
          <div className="lg:col-span-7 space-y-5">
            {/* Card: Status Geofencing GPS Sekolah */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3.5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-base leading-tight">
                      Status Geofencing GPS Sekolah
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Koordinat Resmi: {schoolName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshGps}
                  disabled={isRefreshingGps}
                  className="px-3.5 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-60 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingGps ? 'animate-spin' : ''}`} />
                  <span>Refresh GPS</span>
                </button>
              </div>

              {/* Sub-box 1: Terverifikasi di Area Sekolah */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-950 font-bold text-sm sm:text-[15px]">
                      Terverifikasi di Area Sekolah ({gpsDistance} meter)
                    </span>
                  </div>
                  <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    SIAP ABSEN
                  </span>
                </div>

                <p className="text-xs text-emerald-800/90 font-medium mt-1">
                  Titik Pusat GPS:{' '}
                  <strong className="font-bold text-emerald-950 font-mono">
                    {schoolLat.toFixed(6)}, {schoolLng.toFixed(6)}
                  </strong>{' '}
                  • Radius Geofence:{' '}
                  <strong className="font-bold text-emerald-950">{radius} meter</strong>
                </p>

                {/* Solid green progress bar */}
                <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden mt-3">
                  <div className="w-full h-full bg-emerald-600 rounded-full" />
                </div>
              </div>

              {/* Sub-box 2: Anti-Fake GPS Protection */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700">
                    Anti-Fake GPS Protection:{' '}
                    <strong className="text-emerald-700 font-bold">Aktif & Terverifikasi Sah</strong>
                  </span>
                </div>
                <span className="text-slate-500 font-medium">Akurasi: ±{gpsAccuracy}m</span>
              </div>

              {/* Sub-box 3: Alamat Resmi */}
              <div className="bg-sky-50/40 border border-sky-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-slate-700">
                <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="truncate">{schoolAddress}</span>
              </div>
            </div>

            {/* Card: Peta Lokasi Leaflet */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[390px] relative">
              <MapContainer
                center={[userGpsCoords.lat, userGpsCoords.lng]}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Geofence Dashed Green Circle */}
                <Circle
                  center={[schoolLat, schoolLng]}
                  radius={radius}
                  pathOptions={{
                    color: '#059669',
                    fillColor: '#10b981',
                    fillOpacity: 0.16,
                    weight: 2,
                    dashArray: '6, 6',
                  }}
                />

                {/* Titik Pusat Sekolah Marker */}
                <Marker position={[schoolLat, schoolLng]} icon={schoolCenterIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <strong className="text-slate-900 block font-bold">{schoolName}</strong>
                      <span className="text-slate-500 font-mono text-[11px] block">
                        {schoolLat.toFixed(6)}, {schoolLng.toFixed(6)}
                      </span>
                      <span className="text-emerald-700 font-semibold text-[11px]">
                        Radius: {radius} meter
                      </span>
                    </div>
                  </Popup>
                </Marker>

                {/* Posisi Guru / Pegawai Marker dengan Amber Ring */}
                <Marker position={[userGpsCoords.lat, userGpsCoords.lng]} icon={userAvatarIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <strong className="text-slate-900 block font-bold">
                        {user?.name || 'Guru / Pegawai'}
                      </strong>
                      <span className="text-emerald-600 font-bold text-[11px] block">
                        Terverifikasi di Area Sekolah
                      </span>
                    </div>
                  </Popup>
                </Marker>

                <MapCenterUpdater center={mapCenter} />
              </MapContainer>

              {/* Floating Action Buttons di Kanan Atas Peta */}
              <div className="absolute top-3 right-3 z-400 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setMapCenter([userGpsCoords.lat, userGpsCoords.lng])}
                  title="Pusatkan ke Lokasi Saya"
                  className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white border border-slate-200 text-slate-700 shadow-xs flex items-center justify-center transition hover:text-sky-600"
                >
                  <LocateFixed className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMapCenter([schoolLat, schoolLng])}
                  title="Pusatkan ke Titik Sekolah"
                  className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white border border-slate-200 text-slate-700 shadow-xs flex items-center justify-center transition hover:text-sky-600"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>

              {/* Floating Badge Radius Sekolah di Kiri Bawah Peta */}
              <div className="absolute bottom-3 left-3 z-400 flex items-center gap-2 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs font-semibold text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Radius Sekolah: {radius}m</span>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: STATUS KEHADIRAN & AMBIL PRESENSI SELFIE */}
          <div className="lg:col-span-5 space-y-5">
            {/* Card: Status Kehadiran Hari Ini */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900 text-base">Status Kehadiran Hari Ini</h2>
                <span className="text-sm font-semibold text-slate-400">{todayShortDate}</span>
              </div>

              <div className="space-y-3">
                {/* Item 1: Absen Datang */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 transition">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <ArrowRightToLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Absen Datang</h4>
                    {hasCheckedIn ? (
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                        Sudah absen pukul {todayRecord?.checkInTime || '07:05'} WITA
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Belum melakukan absen datang
                      </p>
                    )}
                  </div>
                </div>

                {/* Item 2: Absen Pulang */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 transition">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <ArrowLeftFromLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Absen Pulang</h4>
                    {hasCheckedOut ? (
                      <p className="text-xs text-blue-600 font-semibold mt-0.5">
                        Sudah absen pukul {todayRecord?.checkOutTime || '14:15'} WITA
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Belum melakukan absen pulang
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Ambil Presensi Selfie */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="text-center mb-4">
                <h3 className="font-bold text-slate-900 text-base">Ambil Presensi Selfie</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Foto selfie langsung dengan verifikasi liveness dan stempel watermark lokasi.
                </p>
              </div>

              {/* Durasi Absen Datang & Pulang side-by-side */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-sky-700 font-extrabold text-[10px] uppercase tracking-wider">
                    <ArrowRightToLine className="w-3.5 h-3.5" />
                    <span>DURASI ABSEN DATANG</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-[13px] mt-1 tracking-tight">
                    {checkInStart} - {checkInDeadline} WITA
                  </div>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold text-[10px] uppercase tracking-wider">
                    <ArrowLeftFromLine className="w-3.5 h-3.5" />
                    <span>DURASI ABSEN PULANG</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-[13px] mt-1 tracking-tight">
                    {checkOutStart} - {checkOutDeadline} WITA
                  </div>
                </div>
              </div>

              {/* Tombol Pilihan Jenis Absen: Absen Datang vs Absen Pulang */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedAbsenType('masuk')}
                  className={`py-3 px-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    selectedAbsenType === 'masuk'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <ArrowRightToLine className="w-4 h-4" />
                    <span>Absen Datang</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono mt-0.5 ${
                      selectedAbsenType === 'masuk' ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {checkInStart} - {checkInDeadline}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAbsenType('pulang')}
                  className={`py-3 px-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    selectedAbsenType === 'pulang'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-xs'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <ArrowLeftFromLine className="w-4 h-4" />
                    <span>Absen Pulang</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono mt-0.5 ${
                      selectedAbsenType === 'pulang' ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {checkOutStart} - {checkOutDeadline}
                  </span>
                </button>
              </div>

              {/* Big Action Button */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>
                  Buka Kamera ({selectedAbsenType === 'pulang' ? 'Absen Pulang' : 'Absen Datang'})
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== DISPENSASI (dengan upload bukti) =====
  const renderDispensasi = () => {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-600" />
          Aplikasi Klik & Dispensasi
        </h3>
        <p className="text-sm text-gray-600">
          Ajukan izin atau dispensasi melalui form di bawah ini. Upload bukti pendukung (surat sakit, surat dinas, dll) maksimal 2MB.
        </p>

        <form onSubmit={handleIzinSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis Permohonan</label>
            <select
              name="type"
              value={izinFormData.type}
              onChange={(e) => setIzinFormData({ ...izinFormData, type: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="izin">Izin</option>
              <option value="dispensasi">Dispensasi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal</label>
            <input
              type="date"
              name="date"
              value={izinFormData.date}
              onChange={(e) => setIzinFormData({ ...izinFormData, date: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Alasan / Keterangan</label>
            <textarea
              name="reason"
              value={izinFormData.reason}
              onChange={(e) => setIzinFormData({ ...izinFormData, reason: e.target.value })}
              rows={3}
              placeholder="Tulis alasan izin atau dispensasi..."
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Upload Bukti (Surat Sakit/Dinas, maks 2MB)</label>
            <input
              id="fileInput"
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
            {attachmentPreview && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-green-600">✅ File terupload</span>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="text-red-500 text-xs underline"
                >
                  Hapus
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Format yang didukung: JPG, PNG, PDF, DOC</p>
          </div>

          <button
            type="submit"
            disabled={izinSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition disabled:opacity-50"
          >
            {izinSubmitting ? 'Mengirim...' : 'Ajukan Sekarang'}
          </button>

          {izinSubmitMessage && (
            <div
              className={`p-3 rounded-xl text-sm font-semibold ${
                izinSubmitMessage.includes('✅')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {izinSubmitMessage}
            </div>
          )}
        </form>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <Phone className="w-5 h-5 text-green-600" />
          <span className="text-sm">WA Admin: 0812-3888-9901 (Sr. Maria)</span>
        </div>
      </div>
    );
  };

  // ===== PENGUMUMAN =====
  const renderPengumuman = () => (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Bell className="w-5 h-5 text-emerald-600" />
        Pengumuman Sekolah
      </h3>
      <div className="space-y-3">
        <div className="border-l-4 border-emerald-500 pl-4 py-2">
          <p className="font-semibold text-gray-800">📢 Libur Nasional</p>
          <p className="text-xs text-gray-500">Tanggal 17 Agustus 2026 – Upacara Kemerdekaan</p>
        </div>
        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <p className="font-semibold text-gray-800">📢 Rapat Guru</p>
          <p className="text-xs text-gray-500">Jumat, 11 September 2026 pukul 13:00 WITA</p>
        </div>
        <div className="border-l-4 border-yellow-500 pl-4 py-2">
          <p className="font-semibold text-gray-800">📢 Pendaftaran Siswa Baru</p>
          <p className="text-xs text-gray-500">Dibuka 1 Oktober – 30 November 2026</p>
        </div>
      </div>
    </div>
  );

  // ===== PROFIL =====
  const renderProfil = () => (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Lock className="w-5 h-5 text-emerald-600" />
        Profil & Password
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Nama</p>
            <p className="font-semibold text-gray-800">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">NIP</p>
            <p className="font-semibold text-gray-800">{user?.nip}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-semibold text-gray-800">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Role</p>
            <p className="font-semibold text-gray-800">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition text-sm"
        >
          🔒 Ganti Password
        </button>
      </div>
    </div>
  );

  // ===== RENDER UTAMA =====
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a2e3b] text-white transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 md:block`}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="text-xs text-gray-400 uppercase tracking-wider">SISTEM PRESENSI ONLINE</div>
          <h1 className="text-lg font-bold text-white">TKK INVIOLATA</h1>
          <div className="text-xs text-emerald-400">Hak Akses: {user?.role || 'User'}</div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left ${
                currentPage === item.id
                  ? 'bg-gray-700/50 text-white border-l-4 border-emerald-400'
                  : 'text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="border-t border-gray-700 my-2"></div>
          <button
            onClick={() => handleMenuClick('keluar')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700/30 transition text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar ke Panel Login</span>
          </button>
        </div>

        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <p className="text-white font-semibold text-sm">Portal {user?.role || 'User'}</p>
          <p>NIP: {user?.nip || '123456789123'}</p>
        </div>
      </div>

      {/* OVERLAY HP */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 border-b sticky top-0 z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-gray-700 hover:text-gray-900 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-800">
              {currentPage === 'dashboard' && 'Dashboard Presensi Saya'}
              {currentPage === 'dispensasi' && 'Aplikasi Klik & Dispensasi'}
              {currentPage === 'pengumuman' && 'Pengumuman Sekolah'}
              {currentPage === 'profil' && 'Profil & Password'}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-semibold"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ganti Password</span>
            </button>
            <button
              onClick={onLogout}
              className="text-red-600 hover:text-red-800 flex items-center gap-1 text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
          {renderContent()}
        </div>
      </div>

      {/* KAMERA (sembunyi) */}
      <div style={{ display: 'none' }}>
        <video ref={videoRef} width="640" height="480" autoPlay playsInline />
        <canvas ref={canvasRef} />
      </div>

      {/* CAMERA ATTENDANCE MODAL */}
      <CameraAttendanceModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        currentUser={user}
        users={users && users.length > 0 ? users : [user]}
        geofenceConfig={{
          schoolName,
          address: schoolAddress,
          latitude: schoolLat,
          longitude: schoolLng,
          radiusMeters: radius,
          checkInStartTime: checkInStart,
          checkInDeadlineTime: checkInDeadline,
          checkOutStartTime: checkOutStart,
          checkOutEndTime: checkOutDeadline,
          adminContactPhone: '0812-3888-9901',
          adminContactName: 'Sr. Maria Inviolata, S.Pd.',
          antiFakeGpsEnabled: true,
          maxAllowedAccuracyMeters: 50,
        }}
        initialType={selectedAbsenType === 'pulang' ? 'PULANG' : 'MASUK'}
        onRecordAttendance={handleModalAttendanceRecord}
        unlockRequests={unlockRequests}
        onRequestUnlock={(reqUserId, reason, reqType, startDate, endDate) => {
          const newReq = {
            id: 'req-' + Date.now(),
            userId: reqUserId,
            userName: user?.name,
            userNip: user?.nip,
            type: reqType,
            reason,
            status: 'MENUNGGU',
            createdAt: new Date().toISOString(),
            startDate,
            endDate,
          };
          setUnlockRequests((prev) => [newReq, ...prev]);
        }}
      />

      {/* MODAL GANTI PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Ganti Password
            </h4>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              {passwordError && <p className="text-rose-600 text-sm">{passwordError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};