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

type MenuPage = 'dashboard' | 'dispensasi' | 'pengumuman' | 'profil' | 'keluar';

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
    const lat = geofenceConfig.latitude;
    const lng = geofenceConfig.longitude;
    const radius = geofenceConfig.radiusMeters;

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl p-4 shadow-md">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Anti-Fake GPS Protection: Aktif & Terverifikasi Sah
          </h1>
          <p className="text-sm opacity-90 mt-1">
            Jl. Ranaka, Ruteng, Kec. Langke Rembong, Kab. Manggarai, Nusa Tenggara Timur
          </p>
        </div>

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
                disabled={isLoading || hasCheckedIn || isLate}
                className={`mt-2 w-full py-2 rounded-xl font-bold text-sm transition ${
                  hasCheckedIn || isLate
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isLoading ? 'Memproses...' : '📸 Absen Datang'}
              </button>
              {isLate && !hasCheckedIn && (
                <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Melewati batas waktu
                </p>
              )}
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
                disabled={isLoading || !hasCheckedIn || hasCheckedOut}
                className={`mt-2 w-full py-2 rounded-xl font-bold text-sm transition ${
                  !hasCheckedIn || hasCheckedOut
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? 'Memproses...' : '🏠 Absen Pulang'}
              </button>
            </div>

            {isLate && !hasCheckedIn && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  PRESENSI TERKUNCI
                </h4>
                <p className="text-xs text-rose-600 mt-1">
                  Anda Terlambat – Silakan Hubungi Admin
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Durasi waktu presensi masuk ({geofenceConfig.checkInStartTime} - {geofenceConfig.checkInDeadlineTime} WITA) telah berakhir.
                  Lewat dari jam tersebut, <strong>hanya admin yang bisa mengizinkan absen</strong> di luar waktu yang ditentukan.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold">Otorisasi / Buka Kunci Admin</span>
                </div>
                <a
                  href="https://wa.me/6281238889901?text=Halo%20Admin%2C%20saya%20terlambat%20dan%20membutuhkan%20otorisasi%20presensi."
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Hubungi Admin via WA
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-gray-700">Buka Kamera Presensi</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePresensi('masuk')}
              disabled={isLoading || hasCheckedIn || isLate}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                hasCheckedIn || isLate
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              📸 Masuk
            </button>
            <button
              onClick={() => handlePresensi('pulang')}
              disabled={isLoading || !hasCheckedIn || hasCheckedOut}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                !hasCheckedIn || hasCheckedOut
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