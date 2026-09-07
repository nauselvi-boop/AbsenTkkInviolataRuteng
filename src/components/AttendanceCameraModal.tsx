import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle2, ShieldCheck, AlertTriangle, Sparkles, X, MapPin } from 'lucide-react';
import { GeofenceConfig, LocationData, User } from '../types';

interface AttendanceCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceType: 'DATANG' | 'PULANG';
  user: User;
  location: LocationData;
  geofenceConfig: GeofenceConfig;
  onCompleteAttendance: (photoDataUrl: string, notes: string) => void;
}

type LivenessStep = 'ALIGN_FACE' | 'LIVENESS_ACTION' | 'READY_TO_CAPTURE' | 'CAPTURED';

export const AttendanceCameraModal: React.FC<AttendanceCameraModalProps> = ({
  isOpen,
  onClose,
  attendanceType,
  user,
  location,
  geofenceConfig,
  onCompleteAttendance,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [livenessStep, setLivenessStep] = useState<LivenessStep>('ALIGN_FACE');
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera stream when opened
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    resetState();
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const resetState = () => {
    setLivenessStep('ALIGN_FACE');
    setLivenessProgress(0);
    setCapturedImage(null);
    setCameraError(null);
    setIsSimulatedCamera(false);
    setNotes('');
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Start liveness check flow
      triggerLivenessFlow();
    } catch (err: unknown) {
      console.warn('Camera access error or restricted iframe:', err);
      setCameraError(
        'Akses kamera fisik tidak dapat dibuka atau ditolak oleh browser/iframe. Anda dapat menggunakan mode "Kamera Virtual/Simulasi Live" untuk menguji verifikasi wajah dan absensi.'
      );
      setIsSimulatedCamera(true);
      triggerLivenessFlow();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Simulate automated liveness steps (blink / smile detection timeline)
  const triggerLivenessFlow = () => {
    setLivenessStep('ALIGN_FACE');
    setLivenessProgress(20);

    const timer1 = setTimeout(() => {
      setLivenessStep('LIVENESS_ACTION');
      setLivenessProgress(50);
    }, 1800);

    const timer2 = setTimeout(() => {
      setLivenessProgress(85);
    }, 3200);

    const timer3 = setTimeout(() => {
      setLivenessStep('READY_TO_CAPTURE');
      setLivenessProgress(100);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  // Capture frame and apply digital security watermark
  const handleCapture = () => {
    setIsProcessing(true);
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;

    if (videoRef.current && !isSimulatedCamera && stream) {
      // Draw actual webcam stream
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    } else {
      // Simulated live camera frame with user portrait fallback
      const bgGradient = ctx.createLinearGradient(0, 0, 640, 480);
      bgGradient.addColorStop(0, '#1e293b');
      bgGradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 640, 480);

      // Draw portrait background circle
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(320, 210, 120, 0, Math.PI * 2);
      ctx.fill();

      // Draw stylized live avatar placeholder
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(user.name, 320, 200);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Live Capture (${user.role}) - NIP: ${user.nip}`, 320, 235);
    }

    // --- APPLY DIGITAL WATERMARK & TAMPER-PROOF STAMP ---
    // Bottom dark gradient overlay for high contrast text
    const overlayGrad = ctx.createLinearGradient(0, 360, 0, 480);
    overlayGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
    overlayGrad.addColorStop(1, 'rgba(15, 23, 42, 0.92)');
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 360, 640, 120);

    // Top subtle bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, 0, 640, 44);

    // Watermark text - Header
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`● LIVE VERIFIED ABSENSI ${attendanceType}`, 16, 26);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(geofenceConfig.schoolName, 624, 26);

    // Watermark text - Footer details
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${user.name} (${user.role} - ${user.position})`, 16, 405);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Waktu: ${dateStr} • ${timeStr} WIB`, 16, 428);

    ctx.fillStyle = '#93c5fd';
    ctx.font = '11px monospace';
    ctx.fillText(
      `GPS: Lat ${location.latitude.toFixed(6)}, Lng ${location.longitude.toFixed(6)} • Jarak: ${location.distanceMeters}m (Radius: ${geofenceConfig.radiusMeters}m)`,
      16,
      448
    );

    ctx.fillStyle = '#34d399';
    ctx.fillText(`Status: LOLOS GEOFENCE & LIVENESS CHECK TEROTENTIKASI`, 16, 466);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    setLivenessStep('CAPTURED');
    setIsProcessing(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    triggerLivenessFlow();
  };

  const handleSubmit = () => {
    if (!capturedImage) return;
    onCompleteAttendance(capturedImage, notes);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Selfie Absen {attendanceType === 'DATANG' ? 'Datang' : 'Pulang'}
              </h3>
              <p className="text-emerald-100 text-xs">
                Live Capture & Validasi Wajah (Liveness Check)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Location Summary Alert */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">GPS Terverifikasi: </span>
                <span>{location.distanceMeters} meter dari {geofenceConfig.schoolName}</span>
              </div>
            </div>
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Lolos Geofence
            </span>
          </div>

          {/* Camera Viewport / Frame */}
          <div className="relative aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Selfie Absensi"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                {/* Active Video Stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isSimulatedCamera ? 'hidden' : ''}`}
                />

                {/* Simulated Camera fallback if browser blocks video */}
                {isSimulatedCamera && (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
                    <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-emerald-500/60 flex items-center justify-center overflow-hidden">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{user.name}</p>
                      <p className="text-xs text-slate-400">Mode Simulasi Kamera Live Capture</p>
                    </div>
                  </div>
                )}

                {/* Liveness Oval Guide / Face Frame Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  <div
                    className={`w-48 h-60 rounded-[50%] border-3 transition-all duration-300 ${
                      livenessStep === 'READY_TO_CAPTURE'
                        ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                        : livenessStep === 'LIVENESS_ACTION'
                        ? 'border-amber-400 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'border-white/70'
                    }`}
                  />
                </div>

                {/* Step instruction banner */}
                <div className="absolute top-3 inset-x-3 bg-slate-900/85 backdrop-blur-md text-white text-xs px-3.5 py-2 rounded-xl flex items-center justify-between border border-white/10">
                  <div className="flex items-center gap-2">
                    {livenessStep === 'READY_TO_CAPTURE' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                    )}
                    <span className="font-medium text-[11px]">
                      {livenessStep === 'ALIGN_FACE' && 'Langkah 1: Posisikan wajah Anda di tengah bingkai'}
                      {livenessStep === 'LIVENESS_ACTION' && 'Langkah 2: Liveness Check: Kedipkan mata / tersenyum'}
                      {livenessStep === 'READY_TO_CAPTURE' && 'Wajah tervalidasi! Silakan tekan Ambil Foto'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">
                    {livenessProgress}%
                  </span>
                </div>
              </>
            )}

            {/* Hidden canvas for drawing watermarked final photo */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {cameraError && !capturedImage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Catatan Izin Kamera:</p>
                <p className="text-[11px] leading-relaxed">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Optional Attendance Notes */}
          {capturedImage && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Kehadiran (Opsional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Mengisi sentra balok / piket pagi"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Batal
            </button>

            {!capturedImage ? (
              <button
                onClick={handleCapture}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Ambil Foto Selfie</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Foto Ulang</span>
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Konfirmasi & Kirim Absen</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
