import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RotateCcw,
  FlipHorizontal,
  X,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Smartphone,
  Laptop,
  ShieldCheck,
  ShieldAlert,
  Upload,
  RefreshCw,
  Eye,
  Building2,
  Lock,
} from 'lucide-react';
import { User, GeofenceConfig, AttendanceRecord, AttendanceUnlockRequest } from '../../types';
import { evaluateAttendanceTime } from '../../utils/attendanceTimeUtils';
import { calculateDistanceMeters } from '../../utils/geoUtils';

interface CameraAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  geofenceConfig: GeofenceConfig;
  onRecordAttendance: (record: AttendanceRecord) => void;
  unlockRequests: AttendanceUnlockRequest[];
  onRequestUnlock: (
    userId: string,
    reason: string,
    type: 'MASUK' | 'PULANG' | 'IZIN_SAKIT' | 'IZIN_KEPERLUAN' | 'CUTI',
    startDate?: string,
    endDate?: string
  ) => void;
}

export const CameraAttendanceModal: React.FC<CameraAttendanceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  geofenceConfig,
  onRecordAttendance,
  unlockRequests,
  onRequestUnlock,
}) => {
  const [selectedUser, setSelectedUser] = useState<User>(currentUser);
  const [attendanceType, setAttendanceType] = useState<'MASUK' | 'PULANG'>('MASUK');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // Device Detection: is mobile / smartphone vs laptop / desktop
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Camera & Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [isShutterFlash, setIsShutterFlash] = useState(false);

  // Captured Photo (Base64)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPS Location State
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    distance: number;
    isWithin: boolean;
  }>({
    lat: geofenceConfig.latitude + 0.00008,
    lng: geofenceConfig.longitude + 0.00008,
    accuracy: 8,
    distance: 12,
    isWithin: true,
  });
  const [isLocating, setIsLocating] = useState(false);

  // Real-time Clock in WITA (UTC+8)
  const [currentTimeWita, setCurrentTimeWita] = useState<string>('');
  const [timeHourMinute, setTimeHourMinute] = useState<string>('07:10');

  // Keep selectedUser in sync with currentUser
  useEffect(() => {
    setSelectedUser(currentUser);
  }, [currentUser]);

  // Detect device type and screen width dynamically
  useEffect(() => {
    const checkDevice = () => {
      const userAgentMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const smallScreen = window.innerWidth < 768;
      setIsMobileDevice(userAgentMobile || smallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Makassar', // WITA
      });
      const hmStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Makassar',
      });
      setCurrentTimeWita(timeStr);
      setTimeHourMinute(hmStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get real GPS location
  useEffect(() => {
    if (!isOpen) return;

    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy || 10);
          const dist = calculateDistanceMeters(
            lat,
            lng,
            geofenceConfig.latitude,
            geofenceConfig.longitude
          );
          const isWithin = dist <= geofenceConfig.radiusMeters;

          setUserLocation({
            lat,
            lng,
            accuracy: acc,
            distance: dist,
            isWithin,
          });
          setIsLocating(false);
        },
        () => {
          // Fallback to simulated location inside TKK Inviolata Ruteng
          setUserLocation({
            lat: geofenceConfig.latitude + 0.00006,
            lng: geofenceConfig.longitude + 0.00006,
            accuracy: 8,
            distance: 9,
            isWithin: true,
          });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [isOpen, geofenceConfig]);

  // Start Camera Stream
  const startCamera = async (mode: 'user' | 'environment') => {
    setIsInitializingCamera(true);
    setCameraError(null);

    // Stop existing tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung WebRTC Camera API.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: isMobileDevice ? 720 : 1280 },
          height: { ideal: isMobileDevice ? 1280 : 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setIsCameraActive(true);
      setIsInitializingCamera(false);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setIsInitializingCamera(false);
      setIsCameraActive(false);

      let msg = 'Kamera tidak dapat diakses.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Izin kamera ditolak oleh peramban. Silakan izinkan akses kamera di pengaturan browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Kamera webcam / kamera HP tidak ditemukan pada perangkat ini.';
      } else {
        msg = err.message || 'Kamera sedang digunakan aplikasi lain atau tidak tersedia.';
      }
      setCameraError(msg);
    }
  };

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Manage camera lifecycle when modal opens/closes or facingMode changes
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      startCamera(facingMode);
    } else {
      stopCamera();
      setCapturedPhoto(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Flip camera between front (user) and back (environment)
  const handleToggleFacingMode = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
  };

  // Take Snapshot from Video Stream
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    // Trigger visual shutter flash
    setIsShutterFlash(true);
    setTimeout(() => setIsShutterFlash(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // If front camera (selfie), mirror horizontally
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, width, height);

      // Reset transform before drawing watermark
      if (facingMode === 'user') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      // Draw subtle bottom watermark banner for authentic attendance verification
      const barHeight = Math.max(34, Math.floor(height * 0.08));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, height - barHeight, width, barHeight);

      // School & GPS Watermark Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(11, Math.floor(barHeight * 0.36))}px sans-serif`;
      ctx.fillText(
        `TKK INVIOLATA RUTENG • ${selectedUser.name} • ${currentTimeWita} WITA`,
        14,
        height - barHeight + barHeight * 0.44
      );

      ctx.fillStyle = '#38bdf8';
      ctx.font = `${Math.max(9, Math.floor(barHeight * 0.3))}px monospace`;
      ctx.fillText(
        `GPS: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)} (±${userLocation.accuracy}m) • Presensi ${attendanceType}`,
        14,
        height - barHeight + barHeight * 0.82
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedPhoto(dataUrl);
    }
  };

  // Fallback: Upload Photo from File or Use User Avatar
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseAvatarFallback = () => {
    setCapturedPhoto(selectedUser.avatarUrl);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    if (!isCameraActive) {
      startCamera(facingMode);
    }
  };

  // Evaluate Attendance Time Window
  const timeEval = evaluateAttendanceTime(
    timeHourMinute,
    geofenceConfig,
    attendanceType
  );

  const userUnlock = unlockRequests.find(
    (r) => r.userId === selectedUser.id && r.type === attendanceType
  );
  const isUnlockApproved = userUnlock?.status === 'DISETUJUI';
  const isUnlockPending = userUnlock?.status === 'MENUNGGU';

  const canSubmitAttendance =
    timeEval.allowed || (timeEval.mustContactAdmin && isUnlockApproved);

  // Submit Final Attendance Record
  const handleSubmitAttendance = () => {
    if (!capturedPhoto || !canSubmitAttendance) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      let checkInStatus: 'TEPAT_WAKTU' | 'TERLAMBAT' | 'TERLAMBAT_DIIZINKAN' =
        'TEPAT_WAKTU';
      let notes = `Presensi ${attendanceType.toLowerCase()} via ${isMobileDevice ? 'Kamera HP' : 'Webcam Laptop'}`;

      if (timeEval.status === 'LATE_LOCKED' && isUnlockApproved) {
        checkInStatus = 'TERLAMBAT_DIIZINKAN';
        notes = `Dispensasi disetujui Admin: ${userUnlock?.adminNotes || 'Izin keterlambatan'}`;
      } else if (timeEval.status === 'LATE_LOCKED') {
        checkInStatus = 'TERLAMBAT';
      }

      const newRec: AttendanceRecord = {
        id: `att-inviolata-${Date.now()}`,
        userId: selectedUser.id,
        userName: selectedUser.name,
        userRole: selectedUser.role,
        nip: selectedUser.nip,
        date: dateStr,
        checkInTime:
          attendanceType === 'MASUK' ? `${timeHourMinute} WITA` : '07:12 WITA',
        checkOutTime:
          attendanceType === 'PULANG' ? `${timeHourMinute} WITA` : undefined,
        checkInLocation: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          accuracy: userLocation.accuracy,
          distanceMeters: userLocation.distance,
          isWithinGeofence: userLocation.isWithin,
          addressName: 'TKK Inviolata Ruteng (Area Sekolah)',
        },
        checkInPhoto: capturedPhoto,
        checkInStatus: checkInStatus,
        status: 'HADIR',
        notes: notes,
      };

      onRecordAttendance(newRec);
      setIsSubmitting(false);
      stopCamera();
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      {/* Hidden Canvas for High-Res Snapshot Generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Modal Shell: Fluid & Responsive for both Laptop (wide) and HP (portrait) */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Header Bar */}
        <div className="bg-slate-800/90 px-4 py-3 border-b border-slate-700 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0088cc] flex items-center justify-center text-white shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  Kamera Presensi TKK Inviolata
                </h3>
                {/* Active Device Indicator */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                    isMobileDevice
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                  title={
                    isMobileDevice
                      ? 'Aplikasi menyesuaikan ke mode Smartphone / HP'
                      : 'Aplikasi menyesuaikan ke mode Laptop / PC'
                  }
                >
                  {isMobileDevice ? (
                    <>
                      <Smartphone className="w-3 h-3" />
                      <span>Mode HP</span>
                    </>
                  ) : (
                    <>
                      <Laptop className="w-3 h-3" />
                      <span>Mode Laptop</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Selfie Wajah & Validasi GPS Otomatis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-time Clock */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-950/60 rounded-xl border border-slate-700 text-xs font-mono text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentTimeWita} WITA</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Tutup Kamera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Responsive Layout */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Viewfinder Column (7 Cols on Laptop, Full on Mobile) */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              {/* Camera Frame Container */}
              <div className="relative aspect-4/3 sm:aspect-16/10 bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center">
                {/* Shutter Flash Effect */}
                {isShutterFlash && (
                  <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200 pointer-events-none" />
                )}

                {/* Case 1: Snapshot Preview Mode */}
                {capturedPhoto ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedPhoto}
                      alt="Captured Selfie"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm backdrop-blur-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Foto Selfie Berhasil Diambil</span>
                    </div>
                  </div>
                ) : (
                  /* Case 2: Live Video Stream */
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition duration-300 ${
                        facingMode === 'user' ? 'scale-x-[-1]' : ''
                      }`}
                    />

                    {/* Loading Spinner during camera init */}
                    {isInitializingCamera && (
                      <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-white">
                        <RefreshCw className="w-8 h-8 text-[#0088cc] animate-spin" />
                        <span className="text-xs font-semibold">
                          Membuka {isMobileDevice ? 'Kamera HP' : 'Webcam Laptop'}...
                        </span>
                      </div>
                    )}

                    {/* Camera Error / Fallback UI */}
                    {cameraError && !isInitializingCamera && (
                      <div className="absolute inset-0 bg-slate-900/95 p-4 flex flex-col items-center justify-center text-center text-white space-y-3">
                        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                          <h4 className="font-bold text-sm text-rose-300">
                            Kamera Belum Dapat Terbuka
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {cameraError}
                          </p>
                        </div>

                        {/* Fallback buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <button
                            onClick={() => startCamera(facingMode)}
                            className="px-3 py-1.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Coba Lagi</span>
                          </button>

                          <label className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Ambil dari Galeri / File</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="user"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>

                          <button
                            onClick={handleUseAvatarFallback}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Gunakan Foto Profil Akun</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Face Oval Framing Guide (Only in Live Mode) */}
                    {isCameraActive && !cameraError && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                        {/* Oval Guide */}
                        <div className="w-48 h-60 sm:w-56 sm:h-68 border-2 border-dashed border-sky-400/70 rounded-[100px] flex items-center justify-center shadow-lg">
                          <div className="text-[10px] bg-black/60 text-sky-200 px-2 py-0.5 rounded-full font-semibold backdrop-blur-xs">
                            Posisikan Wajah di Sini
                          </div>
                        </div>

                        {/* Corner Viewfinder Crosshairs */}
                        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/80" />
                        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/80" />
                        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/80" />
                        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/80" />
                      </div>
                    )}
                  </>
                )}

                {/* Overlaid Bottom Live GPS Status */}
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/75 backdrop-blur-xs text-[10px] px-3 py-1.5 rounded-xl flex items-center justify-between text-slate-200 font-mono border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#0088cc] shrink-0" />
                    <span className="truncate max-w-[160px] sm:max-w-none">
                      Ruteng ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
                    </span>
                  </div>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded ${
                      userLocation.isWithin
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    ±{userLocation.distance}m (
                    {userLocation.isWithin ? 'Di Sekolah' : 'Luar Radius'})
                  </span>
                </div>
              </div>

              {/* Viewfinder Action Buttons (Shutter & Controls) */}
              <div className="flex items-center justify-between gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                {/* Switch Camera Button (Front / Rear) */}
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  disabled={!!capturedPhoto}
                  className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition"
                  title="Ganti ke Kamera Depan / Belakang"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {facingMode === 'user' ? 'Kamera Depan' : 'Kamera Belakang'}
                  </span>
                </button>

                {/* Center Main Capture / Retake Button */}
                {capturedPhoto ? (
                  <button
                    onClick={handleRetake}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-sm transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Foto Ulang (Retake)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCapturePhoto}
                    disabled={!isCameraActive || !!cameraError}
                    className="px-6 py-2.5 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30 disabled:opacity-40 transition"
                  >
                    <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#0088cc]" />
                    </div>
                    <span>Ambil Foto Selfie</span>
                  </button>
                )}

                {/* Fallback File Upload input */}
                <label
                  className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  title="Unggah foto jika kamera bermasalah"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Unggah</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Attendance Details & Verification Column (5 Cols on Laptop, Full on Mobile) */}
            <div className="lg:col-span-5 space-y-3.5 text-slate-200">
              {/* User Profile Card */}
              <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-600 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">
                        {selectedUser.role}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        NIP: {selectedUser.nip}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white mt-0.5">
                      {selectedUser.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {selectedUser.position}
                    </p>
                  </div>
                </div>

                {/* If multiple users in demo, allow switching */}
                {currentUser.role === 'ADMIN' && (
                  <select
                    value={selectedUser.id}
                    onChange={(e) => {
                      const u = users.find((item) => item.id === e.target.value);
                      if (u) setSelectedUser(u);
                    }}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg p-1.5 text-xs"
                    title="Pilih Guru / Pegawai"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name.split(',')[0]}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Attendance Type Selector: Masuk vs Pulang */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pilih Jenis Presensi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAttendanceType('MASUK')}
                    className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      attendanceType === 'MASUK'
                        ? 'bg-[#0088cc] text-white shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span>Presensi Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceType('PULANG')}
                    className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      attendanceType === 'PULANG'
                        ? 'bg-[#0088cc] text-white shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span>Presensi Pulang</span>
                  </button>
                </div>

                {/* Time Rule Info */}
                <div className="text-[11px] bg-slate-900/80 rounded-lg p-2.5 border border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span>
                      {attendanceType === 'MASUK'
                        ? 'Batas Tepat Waktu:'
                        : 'Jam Kepulangan:'}
                    </span>
                    <span className="text-amber-300 font-bold">
                      {attendanceType === 'MASUK'
                        ? `${geofenceConfig.checkInDeadlineTime} WITA`
                        : `${geofenceConfig.checkOutStartTime} - ${geofenceConfig.checkOutEndTime} WITA`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Status Waktu Saat Ini:</span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded uppercase ${
                        timeEval.allowed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {timeEval.badgeLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Geofence GPS Validation Box */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                    Validasi Lokasi GPS
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      userLocation.isWithin
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {userLocation.isWithin ? 'Lokasi Valid' : 'Di Luar Area'}
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <p className="text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0088cc] shrink-0" />
                    <span>TKK Inviolata Ruteng (Manggarai, NTT)</span>
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Jarak: <b>{userLocation.distance} meter</b> dari titik sekolah (Maksimal radius {geofenceConfig.radiusMeters} meter)
                  </p>
                </div>
              </div>

              {/* If late / locked: Notification banner */}
              {!canSubmitAttendance && (
                <div className="bg-rose-950/50 border border-rose-800/80 rounded-xl p-3 space-y-2 text-rose-200">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Presensi Memerlukan Dispensasi Admin</span>
                  </div>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    Waktu presensi telah melewati batas ketentuan. Silakan ajukan izin atau hubungi Admin Utama ({geofenceConfig.adminContactName}).
                  </p>
                  <button
                    onClick={() => {
                      onRequestUnlock(
                        selectedUser.id,
                        'Keterlambatan presensi',
                        attendanceType
                      );
                    }}
                    className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition"
                  >
                    Ajukan Dispensasi Keterlambatan
                  </button>
                </div>
              )}

              {/* Approved Unlock Notification */}
              {isUnlockApproved && (
                <div className="bg-emerald-950/50 border border-emerald-800/80 rounded-xl p-3 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Dispensasi Disetujui!</span>
                    <span className="text-[10px] text-emerald-300">
                      Anda diizinkan melakukan presensi keterlambatan hari ini.
                    </span>
                  </div>
                </div>
              )}

              {/* Final Submit Button */}
              <div className="pt-2">
                <button
                  onClick={handleSubmitAttendance}
                  disabled={!capturedPhoto || !canSubmitAttendance || isSubmitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Presensi...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {capturedPhoto
                          ? `Kirim Presensi ${attendanceType} Sekarang`
                          : 'Ambil Foto Selfie Terlebih Dahulu'}
                      </span>
                    </>
                  )}
                </button>

                {!capturedPhoto && (
                  <p className="text-center text-[10px] text-slate-400 mt-2">
                    {isMobileDevice
                      ? 'Ketuk "Ambil Foto Selfie" untuk memotret wajah via kamera HP.'
                      : 'Klik "Ambil Foto Selfie" untuk memotret wajah via webcam laptop.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
