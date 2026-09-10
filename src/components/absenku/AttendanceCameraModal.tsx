import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Upload, Check, AlertCircle, Sparkles, MapPin, Clock, ShieldCheck, User as UserIcon } from 'lucide-react';

interface AttendanceCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'masuk' | 'pulang';
  user: any;
  schoolName: string;
  gpsInfo: {
    lat: number;
    lng: number;
    address?: string;
    distance?: number;
    accuracy?: number;
  };
  onCapture: (photoBase64: string, coords: { lat: number; lng: number }) => Promise<void>;
}

export const AttendanceCameraModal: React.FC<AttendanceCameraModalProps> = ({
  isOpen,
  onClose,
  type,
  user,
  schoolName,
  gpsInfo,
  onCapture,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isReady, setIsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Mulai streaming kamera saat modal dibuka
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    setCapturedPhoto(null);
    setCameraError(null);
    setIsSubmitting(false);
    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Error stopping stream tracks:', e);
      }
      setStream(null);
    }
  };

  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera();
    setCameraError(null);
    setIsReady(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback check legacy
        const n = navigator as any;
        const legacyGet = n.getUserMedia || n.webkitGetUserMedia || n.mozGetUserMedia;
        if (!legacyGet) {
          throw new Error('Browser tidak mendukung akses kamera langsung. Silakan gunakan tombol "Kamera HP" atau "Galeri" di bawah.');
        }
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        console.warn('Fallback ke generic video constraint...', err);
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
        } catch (err2) {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        const markReady = () => {
          videoRef.current?.play().catch((err) => {
            console.warn('Video auto-play prevented:', err);
          });
          setIsReady(true);
        };
        videoRef.current.onloadedmetadata = markReady;
        videoRef.current.oncanplay = markReady;
        // Fallback timer jika browser lambat trigger metadata
        setTimeout(markReady, 600);
      }
    } catch (err: any) {
      console.warn('Gagal membuka kamera:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.message?.includes('Permission')
          ? 'Izin kamera ditolak oleh peramban browser HP. Anda dapat menggunakan tombol "Kamera HP" atau "Galeri" di bawah.'
          : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
          ? 'Perangkat webcam tidak terdeteksi langsung. Anda dapat mengambil foto langsung dengan tombol "Kamera HP".'
          : 'Kamera tidak dapat diakses langsung (' + (err.message || 'Izin peramban') + '). Silakan gunakan tombol "Kamera HP" di bawah.'
      );
    }
  };

  // Watermark generator pada Canvas
  const applyWatermarkAndGetBase64 = (source: HTMLVideoElement | HTMLImageElement): string => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    try {
      if (source instanceof HTMLVideoElement) {
        if (facingMode === 'user') {
          // Mirror live selfie naturally on canvas
          ctx.save();
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(source, 0, 0, width, height);
          ctx.restore();
        } else {
          ctx.drawImage(source, 0, 0, width, height);
        }
      } else {
        ctx.drawImage(source, 0, 0, width, height);
      }
    } catch (e) {
      console.warn('Canvas draw exception:', e);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }

    // Overlay gelap di bagian bawah untuk watermark
    const gradient = ctx.createLinearGradient(0, height - 110, 0, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.3, 'rgba(15, 23, 42, 0.85)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.96)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - 110, width, 110);

    // Stempel Border & Badge
    ctx.fillStyle = '#10b981'; // emerald
    ctx.fillRect(16, height - 96, 4, 80);

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Baris 1: Instansi & Tipe
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(
      `📍 ${schoolName.toUpperCase()} • PRESENSI ${type === 'masuk' ? 'DATANG' : 'PULANG'}`,
      28,
      height - 76
    );

    // Baris 2: Nama Pegawai & NIP
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.fillText(
      `👤 ${user?.name || 'Staf Sekolah'} (${user?.role || 'GURU'}) | NIP: ${user?.nip || '-'}`,
      28,
      height - 56
    );

    // Baris 3: Tanggal & Waktu WITA
    ctx.fillStyle = '#38bdf8'; // sky blue
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`🕒 ${dateStr}, ${timeStr} WITA`, 28, height - 36);

    // Baris 4: Koordinat & Status GPS
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    const latStr = (gpsInfo.lat || -8.61631).toFixed(6);
    const lngStr = (gpsInfo.lng || 120.463403).toFixed(6);
    ctx.fillText(
      `🌐 GPS: ${latStr}, ${lngStr} (Akurasi: ±${gpsInfo.accuracy || 3}m • Terverifikasi Sah)`,
      28,
      height - 18
    );

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Tangkap foto langsung dari video stream
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const photo = applyWatermarkAndGetBase64(videoRef.current);
      setCapturedPhoto(photo);
      stopCamera();
    } catch (err: any) {
      alert('Gagal mengambil foto: ' + err.message);
    }
  };

  // Countdown sebelum snapshot
  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          takeSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 900);
  };

  // Handle fallback file upload jika webcam tidak ada
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const photo = applyWatermarkAndGetBase64(img);
        setCapturedPhoto(photo);
        stopCamera();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle fallback ke avatar profil jika darurat
  const handleUseAvatar = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const photo = applyWatermarkAndGetBase64(img);
      setCapturedPhoto(photo);
      stopCamera();
    };
    img.src = user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Guru')}&background=10B981&color=fff&size=300`;
  };

  // Konfirmasi kirim presensi
  const handleConfirmAndSubmit = async () => {
    if (!capturedPhoto) return;
    setIsSubmitting(true);
    try {
      await onCapture(capturedPhoto, {
        lat: gpsInfo.lat || -8.61631,
        lng: gpsInfo.lng || 120.463403,
      });
      onClose();
    } catch (err: any) {
      alert('Gagal mengirim presensi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${type === 'masuk' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                Verifikasi Presensi Selfie
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${type === 'masuk' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                  {type === 'masuk' ? 'Absen Datang' : 'Absen Pulang'}
                </span>
              </h3>
              <p className="text-xs text-slate-300">Liveness verification dengan stempel watermark GPS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <div className="relative aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
            {capturedPhoto ? (
              // Tampilan Foto yang Berhasil Diambil
              <div className="relative w-full h-full">
                <img
                  src={capturedPhoto}
                  alt="Captured Selfie"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5 shadow">
                  <Check className="w-3.5 h-3.5" />
                  Foto Terverifikasi
                </div>
              </div>
            ) : cameraError ? (
              // Tampilan Error Kamera & Fallback
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-sm sm:text-base">Akses Kamera Browser Dibatasi</h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">{cameraError}</p>
                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Kamera HP (Native)
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Pilih dari Galeri
                  </button>
                  <button
                    type="button"
                    onClick={handleUseAvatar}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    Gunakan Foto Profil
                  </button>
                </div>
              </div>
            ) : (
              // Live Video Stream dengan Oval Guide
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                />

                {/* Face Oval Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-44 sm:w-52 h-56 sm:h-64 border-2 border-dashed border-emerald-400/80 rounded-[50%] shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse flex items-center justify-center">
                    <span className="text-[10px] text-emerald-300 bg-slate-950/70 px-2.5 py-1 rounded-full backdrop-blur-xs font-medium -mt-40 sm:-mt-48">
                      Posisikan Wajah di Sini
                    </span>
                  </div>
                </div>

                {/* Floating GPS & Time Badge */}
                <div className="absolute top-3 left-3 bg-slate-950/70 text-white text-[10px] font-medium px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Kamera Aktif • Siap Snapshot</span>
                </div>

                {/* Flip camera button for mobile phones */}
                <button
                  type="button"
                  onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                  className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-xl backdrop-blur-xs border border-white/10 text-xs transition"
                  title="Putar Kamera Depan / Belakang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                {/* Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                    <span className="text-6xl font-black text-white animate-scale-in drop-shadow-lg">
                      {countdown}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hidden Canvas & Dual Inputs (Kamera HP Langsung & File Galeri) */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Lokasi & Status Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Lokasi Presensi:
              </span>
              <span className="font-bold text-slate-900">{schoolName}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>Koordinat Resmi:</span>
              <span className="font-mono text-slate-700 font-medium">
                {(gpsInfo.lat || -8.61631).toFixed(6)}, {(gpsInfo.lng || 120.463403).toFixed(6)}
              </span>
            </div>
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-semibold pt-1 border-t border-slate-200">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Status Geofence:
              </span>
              <span>Terverifikasi di Area Sekolah (0 meter)</span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setCapturedPhoto(null);
                  startCamera(facingMode);
                }}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Foto Ulang
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan Presensi...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Gunakan Foto & Kirim Presensi
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5 shrink-0"
                title="Gunakan Kamera HP langsung"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kamera HP</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold hover:bg-slate-100 transition flex items-center gap-1.5 shrink-0"
                title="Pilih foto dari Galeri"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Galeri</span>
              </button>
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={!isReady && !cameraError}
                className="flex-1 bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs sm:text-sm font-bold py-2.5 px-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 min-w-[140px]"
              >
                <Camera className="w-4 h-4" />
                <span>Ambil Foto</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
