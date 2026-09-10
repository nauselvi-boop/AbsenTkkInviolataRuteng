import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface CameraAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photo: string, lat: number, lng: number) => void;
  user: any;
  isLoading?: boolean;
}

export const CameraAttendanceModal: React.FC<CameraAttendanceModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  user,
  isLoading = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhoto(null);
      setError(null);
      startCamera();
      getLocation();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }
    } catch (err: any) {
      setError('Gagal mengakses kamera: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraReady(false);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setError('Gagal mengambil lokasi: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    setPhoto(photoData);
    if (location) {
      onCapture(photoData, location.lat, location.lng);
    } else {
      onCapture(photoData, 0, 0);
    }
    setTimeout(() => onClose(), 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              Kamera Presensi TKK Inviolata
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Selfie Wajah & Validasi GPS Otomatis</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Informasi User */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <p className="font-semibold text-gray-700">{user?.name || 'User'}</p>
            <p className="text-gray-500 text-xs">{user?.role} • NIP: {user?.nip || '-'}</p>
          </div>

          {/* Pilihan Jenis Presensi */}
          <div className="bg-blue-50 rounded-xl p-3 text-sm">
            <p className="font-semibold text-blue-800">PILIH JENIS PRESENSI:</p>
            <div className="flex gap-3 mt-2">
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">Presensi Masuk</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">Presensi Pulang</span>
            </div>
          </div>

          {/* Video Kamera */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {!isCameraReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
                <p>Memulai kamera...</p>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-black/70">
                <div className="text-center p-4">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            {photo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
                <p className="text-white text-sm ml-2">Foto berhasil diambil</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Status Lokasi */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="text-gray-600">
              {location ? (
                `📍 Lokasi: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
              ) : (
                '⏳ Mengambil lokasi...'
              )}
            </span>
          </div>

          {/* Waktu & Radius */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <p className="text-gray-600">🕒 12:00:00 - 12:30:00 WITA</p>
            <p className="text-red-600 font-semibold">⏰ LEWAT JAM PULANG</p>
            <div className="bg-amber-50 p-2 rounded-lg text-amber-800 text-xs mt-2">
              <p className="font-semibold">📍 Di Luar Area</p>
              <p>Maksimal radius 20 meter dari sekolah</p>
            </div>
          </div>

          {/* Layanan Dispensasi */}
          <div className="bg-purple-50 rounded-xl p-3 text-sm text-purple-800 space-y-2">
            <p className="font-semibold">📋 Layanan Dispensasi Admin</p>
            <p className="text-xs">Melewati batas ketentuan. Silakan ajukan ke Admin Utama (Sr. Maria Inviolata, S.Pd.).</p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition">
              Dispensasi Keterlambatan
            </button>
          </div>

          {/* Tombol Aksi */}
          <button
            onClick={capturePhoto}
            disabled={!isCameraReady || isLoading || !!photo}
            className={`w-full py-3 rounded-xl font-bold text-white transition ${
              !isCameraReady || isLoading || photo
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? 'Memproses...' : photo ? '✅ Berhasil' : '📸 Ambil Foto & Presensi'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
};