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
  MapPin,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
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

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  user,
  records,
  onRefresh,
  onLogout,
  geofenceConfig = {
    schoolName: 'TKK Inviolata Ruteng',
    latitude: -8.6135,
    longitude: 120.4689,
    radiusMeters: 50,
    checkInStartTime: '06:30',
    checkInDeadlineTime: '07:15',
    checkOutStartTime: '12:30',
    checkOutDeadlineTime: '15:30',
  },
}) => {
  // ===== STATE =====
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

  // ===== STATE FORM IZIN =====
  const [izinFormData, setIzinFormData] = useState({
    type: 'terlambat_masuk',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const [izinSubmitting, setIzinSubmitting] = useState(false);
  const [izinSubmitMessage, setIzinSubmitMessage] = useState('');
  const [showIzinForm, setShowIzinForm] = useState(false);

  // ===== LIVE ADMIN INTEGRATION (UNLOCKS, ANNOUNCEMENTS, IZIN) =====
  const [isUnlockedByAdmin, setIsUnlockedByAdmin] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [myIzinList, setMyIzinList] = useState<any[]>([]);

  // ===== REF KAMERA =====
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ===== WAKTU =====
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [inStartHour, inStartMin] = geofenceConfig.checkInStartTime.split(':').map(Number);
  const [inDeadlineHour, inDeadlineMin] = geofenceConfig.checkInDeadlineTime.split(':').map(Number);
  const inStart = inStartHour * 60 + inStartMin;
  const inDeadline = inDeadlineHour * 60 + inDeadlineMin;

  const [outStartHour, outStartMin] = (geofenceConfig.checkOutStartTime || '12:30').split(':').map(Number);
  const [outDeadlineHour, outDeadlineMin] = (geofenceConfig.checkOutDeadlineTime || '15:30').split(':').map(Number);
  const outStart = outStartHour * 60 + outStartMin;
  const outDeadline = outDeadlineHour * 60 + outDeadlineMin;

  // ===== FETCH DATA INTEGRASI ADMIN SECARA REAL-TIME =====
  const fetchStaffData = async () => {
    try {
      // 1. Pengumuman dari Admin
      const resAnn = await fetch('/api/announcements');
      if (resAnn.ok) {
        const d = await resAnn.json();
        if (d.success && Array.isArray(d.data)) setAnnouncements(d.data);
      }

      // 2. Status Aktivasi Kunci oleh Admin
      const resUnlock = await fetch(`/api/attendance/unlocks?date=${today}`);
      if (resUnlock.ok) {
        const d = await resUnlock.json();
        if (d.success && Array.isArray(d.data)) {
          setIsUnlockedByAdmin(d.data.includes(String(user?.id)));
        }
      }

      // 3. Status Izin/Dispensasi Saya
      const resIzin = await fetch('/api/izin');
      if (resIzin.ok) {
        const d = await resIzin.json();
        if (d.success && Array.isArray(d.data)) {
          setMyIzinList(d.data.filter((item: any) => String(item.user_id) === String(user?.id)));
        }
      }
    } catch (err) {
      console.warn('Error fetching staff sync data:', err);
    }
  };

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(fetchStaffData, 8000);
    return () => clearInterval(interval);
  }, [user?.id, today]);

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

  // ===== HANDLE PRESENSI (dengan validasi radius) =====
  const handlePresensi = async (type: 'masuk' | 'pulang') => {
    setIsLoading(true);
    setStatusMessage({ text: '', type: '' });

    try {
      if (type === 'masuk' && currentTime > inDeadline && !hasCheckedIn && !isUnlockedByAdmin) {
        setStatusMessage({
          text: '⏰ Batas jam masuk telah lewat! Silakan ajukan izin keterlambatan ke Admin Utama agar tombol diaktifkan.',
          type: 'error',
        });
        setShowIzinForm(true);
        setIsLoading(false);
        return;
      }
      if (type === 'pulang' && currentTime > outDeadline && !hasCheckedOut && hasCheckedIn && !isUnlockedByAdmin) {
        setStatusMessage({
          text: '⏰ Batas jam pulang telah lewat! Silakan ajukan izin ke Admin Utama.',
          type: 'error',
        });
        setShowIzinForm(true);
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
        // Penanganan error khusus radius
        let errorMsg = result.error || result.detail || 'Terjadi kesalahan';
        if (errorMsg.toLowerCase().includes('radius') || errorMsg.includes('Luar Radius')) {
          errorMsg = '⚠️ Anda Berada Di Luar Radius TKK Inviolata';
        }
        setStatusMessage({
          text: `❌ ${errorMsg}`,
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
        setShowIzinForm(false);
        setIzinFormData({ ...izinFormData, reason: '' });
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
    const lat = geofenceConfig.latitude;
    const lng = geofenceConfig.longitude;
    const radius = geofenceConfig.radiusMeters;

    let warningMessage = '';
    let showIzinButton = false;

    if (!hasCheckedIn) {
      if (currentTime < inStart) {
        warningMessage = `⏳ Belum waktunya absen masuk. Buka pukul ${geofenceConfig.checkInStartTime} WITA.`;
      } else if (currentTime > inDeadline) {
        warningMessage = `⏰ Anda terlambat! Batas waktu masuk pukul ${geofenceConfig.checkInDeadlineTime} WITA. Silakan ajukan izin.`;
        showIzinButton = true;
      }
    } else if (hasCheckedIn && !hasCheckedOut) {
      if (currentTime < outStart) {
        warningMessage = `⏳ Belum waktunya absen pulang. Buka pukul ${geofenceConfig.checkOutStartTime || '12:30'} WITA.`;
      } else if (currentTime > outDeadline) {
        warningMessage = `⏰ Anda terlambat pulang! Batas waktu pulang pukul ${geofenceConfig.checkOutDeadlineTime || '15:30'} WITA. Silakan ajukan izin.`;
        showIzinButton = true;
      }
    }

    return (
      <div className="space-y-4">
        {/* Header Anti-Fake GPS */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl p-4 shadow-md">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Anti-Fake GPS Protection: Aktif & Terverifikasi Sah
          </h1>
          <p className="text-sm opacity-90 mt-1">
            Jl. Ranaka, Ruteng, Kec. Langke Rembong, Kab. Manggarai, Nusa Tenggara Timur
          </p>
        </div>

        {/* MAP + SIDEBAR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 bg-white rounded-2xl shadow-md overflow-hidden h-[400px] relative">
            <MapContainer
              center={[lat, lng]}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Circle
                center={[lat, lng]}
                radius={radius}
                pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.2 }}
              />
              <Marker position={[lat, lng]}>
                <Popup>
                  <b>{geofenceConfig.schoolName}</b><br />
                  Radius: {radius}m
                </Popup>
              </Marker>
            </MapContainer>
            <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg text-xs shadow">
              Radius Sekolah: {radius}m
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-emerald-500">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                DURASI ABSEN DATANG
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {geofenceConfig.checkInStartTime} - {geofenceConfig.checkInDeadlineTime} WITA
              </p>
              <button
                onClick={() => handlePresensi('masuk')}
                disabled={isLoading || hasCheckedIn || currentTime > inDeadline}
                className={`mt-2 w-full py-2 rounded-xl font-bold text-sm transition ${
                  hasCheckedIn || currentTime > inDeadline
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isLoading ? 'Memproses...' : '📸 Absen Datang'}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-blue-500">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                DURASI ABSEN PULANG
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {geofenceConfig.checkOutStartTime || '12:30'} - {geofenceConfig.checkOutDeadlineTime || '15:30'} WITA
              </p>
              <button
                onClick={() => handlePresensi('pulang')}
                disabled={isLoading || !hasCheckedIn || hasCheckedOut || currentTime > outDeadline}
                className={`mt-2 w-full py-2 rounded-xl font-bold text-sm transition ${
                  !hasCheckedIn || hasCheckedOut || currentTime > outDeadline
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? 'Memproses...' : '🏠 Absen Pulang'}
              </button>
            </div>

            {warningMessage && (
              <div className={`p-3 rounded-xl text-sm font-semibold ${showIzinButton ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800'}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p>{warningMessage}</p>
                    {showIzinButton && (
                      <button
                        onClick={() => setShowIzinForm(true)}
                        className="mt-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ajukan Izin
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FORM IZIN */}
        {showIzinForm && (
          <div className="bg-white rounded-2xl shadow-md p-5 border-2 border-amber-300">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-amber-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Formulir Pengajuan Izin / Dispensasi
              </h4>
              <button
                onClick={() => setShowIzinForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleIzinSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis Permohonan</label>
                <select
                  value={izinFormData.type}
                  onChange={(e) => setIzinFormData({ ...izinFormData, type: e.target.value })}
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-amber-500"
                >
                  <option value="terlambat_masuk">⏰ Terlambat Masuk</option>
                  <option value="terlambat_pulang">⏰ Terlambat Pulang</option>
                  <option value="tidak_masuk">🚫 Tidak Masuk</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={izinFormData.date}
                  onChange={(e) => setIzinFormData({ ...izinFormData, date: e.target.value })}
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Alasan / Keterangan</label>
                <textarea
                  value={izinFormData.reason}
                  onChange={(e) => setIzinFormData({ ...izinFormData, reason: e.target.value })}
                  rows={3}
                  placeholder="Tulis alasan..."
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Upload Bukti (Surat/Dokumen, max 2MB)</label>
                <div className="flex items-center gap-2">
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="flex-1 p-2 border rounded-xl"
                  />
                </div>
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
                <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG, PDF, DOC (maks 2MB)</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIzinForm(false)}
                  className="px-4 py-2 bg-gray-200 rounded-xl text-sm font-bold hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={izinSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition"
                >
                  {izinSubmitting ? 'Mengirim...' : 'Ajukan'}
                </button>
              </div>
              {izinSubmitMessage && (
                <div className={`p-2 rounded-xl text-sm font-semibold ${izinSubmitMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {izinSubmitMessage}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Banner Notifikasi Kunci Diaktifkan oleh Admin */}
        {isUnlockedByAdmin && (
          <div className="bg-emerald-50 border-2 border-emerald-500/60 p-4 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-sm">🎉 Tombol Presensi Diaktifkan oleh Admin Utama (Sr. Maria Inviolata)!</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Dispensasi / izin keterlambatan Anda telah disetujui. Tombol presensi telah dibuka khusus hari ini.
                </p>
              </div>
            </div>
            <span className="bg-emerald-600 text-white text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full shrink-0">
              KUNCI DIBUKA
            </span>
          </div>
        )}

        {/* Tombol Kamera */}
        <div className="bg-white rounded-2xl shadow-md p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-gray-700">Buka Kamera Presensi</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePresensi('masuk')}
              disabled={isLoading || hasCheckedIn || (currentTime > inDeadline && !isUnlockedByAdmin)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                hasCheckedIn
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : currentTime > inDeadline && !isUnlockedByAdmin
                  ? 'bg-amber-100 text-amber-700 border border-amber-300 cursor-not-allowed'
                  : isUnlockedByAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400 ring-offset-1'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              📸 Masuk {isUnlockedByAdmin ? '(Kunci Dibuka Admin)' : ''}
            </button>
            <button
              onClick={() => handlePresensi('pulang')}
              disabled={isLoading || !hasCheckedIn || hasCheckedOut || (currentTime > outDeadline && !isUnlockedByAdmin)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                !hasCheckedIn || hasCheckedOut || (currentTime > outDeadline && !isUnlockedByAdmin)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              🏠 Pulang
            </button>
          </div>
        </div>

        {statusMessage.text && (
          <div
            className={`p-3 rounded-xl text-sm font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {statusMessage.text}
          </div>
        )}
      </div>
    );
  };

  // ===== DISPENSASI =====
  const renderDispensasi = () => (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Camera className="w-5 h-5 text-emerald-600" />
        Aplikasi Klik & Dispensasi
      </h3>
      <p className="text-sm text-gray-600">Ajukan izin atau dispensasi melalui form di bawah ini.</p>
      <form onSubmit={handleIzinSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis Permohonan</label>
          <select
            value={izinFormData.type}
            onChange={(e) => setIzinFormData({ ...izinFormData, type: e.target.value })}
            className="w-full p-2 border rounded-xl"
          >
            <option value="terlambat_masuk">⏰ Terlambat Masuk</option>
            <option value="terlambat_pulang">⏰ Terlambat Pulang</option>
            <option value="tidak_masuk">🚫 Tidak Masuk</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal</label>
          <input
            type="date"
            value={izinFormData.date}
            onChange={(e) => setIzinFormData({ ...izinFormData, date: e.target.value })}
            className="w-full p-2 border rounded-xl"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Alasan / Keterangan</label>
          <textarea
            value={izinFormData.reason}
            onChange={(e) => setIzinFormData({ ...izinFormData, reason: e.target.value })}
            rows={3}
            placeholder="Tulis alasan..."
            className="w-full p-2 border rounded-xl"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Upload Bukti (max 2MB)</label>
          <input
            id="fileInputDispensasi"
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-xl"
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
        </div>
        <button
          type="submit"
          disabled={izinSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition disabled:opacity-50"
        >
          {izinSubmitting ? 'Mengirim...' : 'Ajukan Sekarang'}
        </button>
        {izinSubmitMessage && (
          <div className={`p-2 rounded-xl text-sm font-semibold ${izinSubmitMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {izinSubmitMessage}
          </div>
        )}
      </form>
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        <Phone className="w-5 h-5 text-green-600" />
        <span className="text-sm">WA Admin Utama: 0812-3888-9901 (Sr. Maria Inviolata)</span>
      </div>

      {/* Riwayat Permohonan Izin / Keterlambatan Saya */}
      <div className="pt-4 border-t border-slate-200">
        <h4 className="font-bold text-slate-800 text-sm mb-3">📋 Status Permohonan Izin / Kunci Presensi Saya</h4>
        {myIzinList.length === 0 ? (
          <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl">
            Belum ada permohonan izin yang Anda ajukan.
          </p>
        ) : (
          <div className="space-y-2">
            {myIzinList.map((item: any) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase">
                      {item.type === 'terlambat_masuk'
                        ? '⏰ Izin Terlambat Masuk'
                        : item.type === 'terlambat_pulang'
                        ? '⏰ Izin Pulang Cepat'
                        : '🚫 Izin Tidak Masuk'}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{item.reason}</p>
                  {item.admin_notes && (
                    <p className="text-[11px] text-emerald-700 mt-1 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                      💬 Balasan Admin: {item.admin_notes}
                    </p>
                  )}
                </div>
                <div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                      item.status === 'disetujui' || item.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'ditolak' || item.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status === 'disetujui' || item.status === 'APPROVED'
                      ? '✅ DISETUJUI'
                      : item.status === 'ditolak' || item.status === 'REJECTED'
                      ? '❌ DITOLAK'
                      : '⏳ MENUNGGU PERSETUJUAN'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ===== PENGUMUMAN DARI ADMIN =====
  const renderPengumuman = () => (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-600" />
          Pengumuman Sekolah (Resmi)
        </h3>
        <span className="text-xs font-medium text-slate-500">
          Dari: Admin Utama TKK Inviolata Ruteng
        </span>
      </div>

      <div className="space-y-3">
        {announcements && announcements.length > 0 ? (
          announcements.map((ann: any) => (
            <div
              key={ann.id}
              className={`p-4 rounded-xl border-l-4 shadow-2xs ${
                ann.category === 'URGENT'
                  ? 'border-red-500 bg-red-50/50'
                  : ann.category === 'ACADEMIC'
                  ? 'border-purple-500 bg-purple-50/50'
                  : 'border-[#0088cc] bg-blue-50/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white shadow-2xs text-slate-700">
                  {ann.category || 'INFO'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">{ann.date}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1.5">{ann.title}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.content}</p>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">
                Diterbitkan oleh: <span className="font-bold text-slate-700">{ann.author || 'Sr. Maria (Admin Utama)'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">
            Belum ada pengumuman terbaru dari pihak sekolah.
          </div>
        )}
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

      {/* OVERLAY (HP) */}
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