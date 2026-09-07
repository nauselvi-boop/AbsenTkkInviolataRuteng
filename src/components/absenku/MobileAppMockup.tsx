import React, { useState, useEffect } from 'react';
import { AbsenKuLogo } from './AbsenKuLogo';
import { User, GeofenceConfig, AttendanceRecord, AttendanceUnlockRequest } from '../../types';
import { evaluateAttendanceTime } from '../../utils/attendanceTimeUtils';
import {
  Menu,
  Fingerprint,
  Megaphone,
  MessageSquare,
  CalendarDays,
  LogOut,
  X,
  Camera,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Calendar,
  Clock,
  GraduationCap,
  Lock,
  PhoneCall,
  MessageCircle,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface MobileAppMockupProps {
  onClose?: () => void;
  users: User[];
  currentUser?: User;
  geofenceConfig: GeofenceConfig;
  onRecordAttendance: (record: AttendanceRecord) => void;
  unlockRequests: AttendanceUnlockRequest[];
  onRequestUnlock: (userId: string, reason: string, type: 'MASUK' | 'PULANG') => void;
}

export const MobileAppMockup: React.FC<MobileAppMockupProps> = ({
  onClose,
  users,
  currentUser,
  geofenceConfig,
  onRecordAttendance,
  unlockRequests,
  onRequestUnlock,
}) => {
  const [activeScreen, setActiveScreen] = useState<
    'home' | 'absensi' | 'informasi' | 'diskusi' | 'jadwal'
  >('home');

  // Selected staff in mobile
  const [selectedUser, setSelectedUser] = useState<User>(
    currentUser?.role !== 'ADMIN'
      ? currentUser || users[1] || users[0]
      : users.find((u) => u.role !== 'ADMIN') || users[0]
  );

  // Sync if currentUser prop changes
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      setSelectedUser(currentUser);
    }
  }, [currentUser]);

  // Attendance Type: MASUK or PULANG
  const [attendanceType, setAttendanceType] = useState<'MASUK' | 'PULANG'>('MASUK');

  // Interactive Simulated Time for testing deadlines
  const [simulatedTime, setSimulatedTime] = useState<string>('07:15');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [absenSuccess, setAbsenSuccess] = useState(false);
  const [showExcuseForm, setShowExcuseForm] = useState(false);
  const [excuseReason, setExcuseReason] = useState('');

  // Chat discussion state tailored to TKK Inviolata Ruteng
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; time: string; isMe: boolean }[]
  >([
    {
      sender: 'Sr. Maria (Kepala TKK)',
      text: 'Selamat pagi Ibu-Ibu Guru. Hari ini ada doa pagi bersama anak-anak Kelompok A dan B di aula.',
      time: '06:45',
      isMe: false,
    },
    {
      sender: 'Ibu Yuliana',
      text: 'Selamat pagi Suster. Anak-anak TK-A sudah siap buku bernyanyi rohani.',
      time: '06:50',
      isMe: true,
    },
    {
      sender: 'Ibu Fransiska',
      text: 'TK-B juga siap. Alat peraga sentra balok sudah kami tata.',
      time: '06:52',
      isMe: false,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Evaluate time window
  const timeEval = evaluateAttendanceTime(
    simulatedTime,
    geofenceConfig,
    attendanceType
  );

  // Check if this user has an approved or pending unlock request
  const userUnlock = unlockRequests.find(
    (r) => r.userId === selectedUser.id && r.type === attendanceType
  );
  const isUnlockApproved = userUnlock?.status === 'DISETUJUI';
  const isUnlockPending = userUnlock?.status === 'MENUNGGU';

  // Can the user clock in right now?
  const canSubmitAttendance =
    timeEval.allowed || (timeEval.mustContactAdmin && isUnlockApproved);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setChatMessages([
      ...chatMessages,
      {
        sender: selectedUser.name.split(',')[0],
        text: inputMessage,
        time: simulatedTime,
        isMe: true,
      },
    ]);
    setInputMessage('');
  };

  const handleSimulateAbsen = () => {
    if (!canSubmitAttendance) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      let checkInStatus: 'TEPAT_WAKTU' | 'TERLAMBAT' | 'TERLAMBAT_DIIZINKAN' = 'TEPAT_WAKTU';
      let notes = 'Presensi TKK Inviolata Ruteng';

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
        checkInTime: attendanceType === 'MASUK' ? `${simulatedTime} WITA` : '07:15 WITA',
        checkOutTime: attendanceType === 'PULANG' ? `${simulatedTime} WITA` : undefined,
        checkInLocation: {
          latitude: geofenceConfig.latitude + 0.00008,
          longitude: geofenceConfig.longitude + 0.00008,
          accuracy: 8,
          distanceMeters: 12,
          isWithinGeofence: true,
          addressName: 'TKK Inviolata Ruteng (Area Sekolah)',
        },
        checkInPhoto:
          selectedUser.avatarUrl ||
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
        checkInStatus: checkInStatus,
        status: 'HADIR',
        notes: notes,
      };

      onRecordAttendance(newRec);
      setIsSubmitting(false);
      setAbsenSuccess(true);
    }, 1000);
  };

  const handleSubmitExcuse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excuseReason.trim()) return;
    onRequestUnlock(selectedUser.id, excuseReason.trim(), attendanceType);
    setExcuseReason('');
    setShowExcuseForm(false);
  };

  const quickExcuses = [
    'Kendaraan motor mogok dalam perjalanan',
    'Hujan lebat di wilayah Ruteng',
    'Tugas kedinasan / urusan dinas luar',
  ];

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[360px] mx-auto bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50">
      {/* Top Camera Speaker Notch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
        <div className="w-10 h-1 rounded-full bg-slate-800"></div>
      </div>

      {/* Close button for overlay/modal mode */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-40 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 shadow-md border border-slate-600"
          title="Tutup Pratinjau Mobile"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Time Simulation Bar */}
      <div className="bg-slate-800/90 text-slate-200 px-3 py-1.5 rounded-t-[32px] text-[10px] flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-1.5 font-mono">
          <Clock className="w-3 h-3 text-amber-400" />
          <span className="text-white font-bold">{simulatedTime} WITA</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSimulatedTime('07:15')}
            className={`px-1.5 py-0.5 rounded text-[9px] transition ${
              simulatedTime === '07:15'
                ? 'bg-emerald-500 text-white font-bold'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Waktu normal masuk tepat waktu (07:15)"
          >
            07:15 Tepat
          </button>
          <button
            onClick={() => setSimulatedTime('07:45')}
            className={`px-1.5 py-0.5 rounded text-[9px] transition ${
              simulatedTime === '07:45'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Waktu terlambat melewati batas (07:45)"
          >
            07:45 Lewat
          </button>
          <button
            onClick={() => setSimulatedTime('13:00')}
            className={`px-1.5 py-0.5 rounded text-[9px] transition ${
              simulatedTime === '13:00'
                ? 'bg-sky-500 text-white font-bold'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Waktu presensi pulang (13:00)"
          >
            13:00 Pulang
          </button>
        </div>
      </div>

      {/* Mobile Screen Container */}
      <div className="bg-[#f7f9fa] rounded-b-[36px] overflow-hidden flex flex-col h-[600px] relative font-sans text-slate-800 select-none">
        {/* Android Status Bar */}
        <div className="bg-[#0088cc] text-white px-5 pt-2 pb-1 text-[10px] font-semibold flex items-center justify-between z-20">
          <span>{simulatedTime}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px]">WITA</span>
            <span>4G LTE</span>
            <span>100%</span>
          </div>
        </div>

        {/* SCREEN 1: HOME */}
        {activeScreen === 'home' && (
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            {/* Header with blue geometric wave & TKK Inviolata Logo */}
            <div className="relative bg-gradient-to-br from-[#0088cc] via-[#0284c7] to-[#0369a1] text-white px-4 pt-2 pb-6 rounded-b-[28px] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">
                    TI
                  </div>
                  <span className="text-xs font-bold tracking-wide">
                    TKK Inviolata
                  </span>
                </div>

                {/* User quick switcher in mobile */}
                <select
                  value={selectedUser.id}
                  onChange={(e) => {
                    const u = users.find((x) => x.id === e.target.value);
                    if (u) setSelectedUser(u);
                  }}
                  className="bg-black/25 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/25 focus:outline-none max-w-[170px] truncate"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="text-slate-800 font-normal">
                      {u.name.split(',')[0]} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Centered Logo with TKK Inviolata Ruteng */}
              <div className="flex flex-col items-center justify-center pt-1 pb-1">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center p-2 mb-1.5 border border-white/30 shadow-inner">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full drop-shadow-sm"
                    fill="none"
                  >
                    <path
                      d="M50 10 C72 10 90 28 90 50 C90 72 72 90 50 90 C28 90 10 72 10 50 C10 36 17 24 28 17"
                      stroke="#ffffff"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                    <path
                      d="M32 30 C37 25 43 22 50 22 C65 22 78 35 78 50 C78 65 65 78 50 78 C35 78 22 65 22 50"
                      stroke="#e0f2fe"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                    <path
                      d="M35 50 C35 42 42 35 50 35 C58 35 65 42 65 50 C65 58 58 65 50 65 C45 65 40 60 40 55 C40 50 45 46 50 46"
                      stroke="#bae6fd"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="flex items-baseline">
                  <span className="text-xl font-light tracking-tight text-white">
                    absen
                  </span>
                  <span className="text-xl font-black tracking-tight text-white">
                    KU
                  </span>
                </div>
                <span className="text-[9px] tracking-widest text-white/95 uppercase font-bold mt-0.5">
                  TKK INVIOLATA RUTENG
                </span>
              </div>
            </div>

            {/* Role & Time Info Card */}
            <div className="px-4 py-2">
              <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs leading-tight">
                      {selectedUser.name}
                    </h5>
                    <span className="text-[10px] text-slate-500">
                      {selectedUser.position}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedUser.role === 'ADMIN'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : selectedUser.role === 'GURU'
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {selectedUser.role}
                </span>
              </div>
            </div>

            {/* 4 Main Square Buttons (2x2 Grid) */}
            <div className="px-4 grid grid-cols-2 gap-3 my-auto">
              {/* 1. PRESENSI (Blue circular icon) */}
              <button
                onClick={() => {
                  setAbsenSuccess(false);
                  setActiveScreen('absensi');
                }}
                className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col items-center justify-center shadow-xs hover:shadow-md transition active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center text-white mb-1.5 shadow-sm group-hover:scale-105 transition">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                  PRESENSI ONLINE
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  Masuk & Pulang
                </span>
              </button>

              {/* 2. PENGUMUMAN (Green circular icon) */}
              <button
                onClick={() => setActiveScreen('informasi')}
                className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col items-center justify-center shadow-xs hover:shadow-md transition active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#2ecc71] flex items-center justify-center text-white mb-1.5 shadow-sm group-hover:scale-105 transition">
                  <Megaphone className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                  PENGUMUMAN
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  Agenda Sekolah
                </span>
              </button>

              {/* 3. FORUM GURU (Red circular icon) */}
              <button
                onClick={() => setActiveScreen('diskusi')}
                className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col items-center justify-center shadow-xs hover:shadow-md transition active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e74c3c] flex items-center justify-center text-white mb-1.5 shadow-sm group-hover:scale-105 transition">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                  FORUM GURU
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  Diskusi Sekolah
                </span>
              </button>

              {/* 4. JADWAL SENTRA (Purple circular icon) */}
              <button
                onClick={() => setActiveScreen('jadwal')}
                className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col items-center justify-center shadow-xs hover:shadow-md transition active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#8e44ad] flex items-center justify-center text-white mb-1.5 shadow-sm group-hover:scale-105 transition">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                  JADWAL SENTRA
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  TK-A & TK-B
                </span>
              </button>
            </div>

            {/* Bottom Section */}
            <div className="p-4 pt-1">
              <button
                onClick={() => setActiveScreen('absensi')}
                className="w-full py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Kamera Presensi</span>
              </button>
              <div className="mt-2 text-center">
                <span className="text-[9px] text-slate-400 font-medium">
                  TKK Inviolata Ruteng - Manggarai, NTT
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: ABSENSI (With Strict Time Window & Contact Admin) */}
        {activeScreen === 'absensi' && (
          <div className="flex-1 flex flex-col justify-between p-3.5 overflow-y-auto">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveScreen('home')}
                    className="p-1 rounded-full hover:bg-slate-200"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-700" />
                  </button>
                  <span className="font-bold text-xs text-slate-800">
                    Presensi TKK Inviolata
                  </span>
                </div>

                {/* Toggle Masuk / Pulang */}
                <div className="flex bg-slate-200 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => {
                      setAttendanceType('MASUK');
                      setAbsenSuccess(false);
                    }}
                    className={`px-2 py-1 rounded-md transition ${
                      attendanceType === 'MASUK'
                        ? 'bg-[#0088cc] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => {
                      setAttendanceType('PULANG');
                      setAbsenSuccess(false);
                    }}
                    className={`px-2 py-1 rounded-md transition ${
                      attendanceType === 'PULANG'
                        ? 'bg-[#0088cc] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pulang
                  </button>
                </div>
              </div>

              {/* Time Window Status Banner */}
              <div className="my-2 space-y-1.5">
                <div
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs ${timeEval.badgeColor}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <div>
                      <span className="font-bold text-[11px] block">
                        Presensi {attendanceType}: {simulatedTime} WITA
                      </span>
                      <span className="text-[10px] opacity-90">
                        {attendanceType === 'MASUK'
                          ? `Batas Tepat Waktu: ${geofenceConfig.checkInDeadlineTime} WITA`
                          : `Jam Pulang: ${geofenceConfig.checkOutStartTime} - ${geofenceConfig.checkOutEndTime} WITA`}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/70">
                    {timeEval.badgeLabel}
                  </span>
                </div>

                {/* Approved unlock banner */}
                {isUnlockApproved && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">Dispensasi Disetujui Admin!</span>
                      <span className="text-[10px] text-emerald-700">
                        Kunci dibuka oleh {geofenceConfig.adminContactName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pending unlock banner */}
                {isUnlockPending && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                    <div>
                      <span className="font-bold block">Menunggu Konfirmasi Admin</span>
                      <span className="text-[10px] text-amber-700">
                        Pengajuan dispensasi sedang diverifikasi Admin Utama
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Simulated Camera Viewfinder */}
              <div className="relative aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden border-2 border-[#0088cc] flex flex-col items-center justify-center text-white my-1.5 shadow-inner">
                <img
                  src={selectedUser.avatarUrl}
                  alt="Camera Preview"
                  className="w-full h-full object-cover opacity-85"
                />

                {/* If locked due to overdue time */}
                {!canSubmitAttendance && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 mb-1.5">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-xs text-rose-300">
                      Presensi {attendanceType} Terkunci
                    </h5>
                    <p className="text-[10px] text-slate-300 mt-1 max-w-[220px]">
                      Melewati batas waktu yang ditentukan. Wajib menghubungi Admin Utama untuk verifikasi.
                    </p>
                  </div>
                )}

                {/* Face Scanning Box (When Allowed) */}
                {canSubmitAttendance && (
                  <div className="absolute inset-4 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="bg-black/60 text-emerald-300 font-mono text-[9px] px-2 py-0.5 rounded">
                      [ Wajah Terverifikasi 100% ]
                    </span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-[9px] px-2 py-1 rounded flex items-center justify-between text-slate-200 font-mono">
                  <span>Ruteng: -8.6135, 120.4635</span>
                  <span className="text-emerald-400 font-bold">12m (Area TKK)</span>
                </div>
              </div>

              {absenSuccess && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2 animate-in fade-in my-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Presensi {attendanceType} Berhasil Tercatat!</span>
                </div>
              )}

              {/* If Locked: Mandatory Contact Admin Actions */}
              {!canSubmitAttendance && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 my-1.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-900 font-bold text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Wajib Hubungi Admin Terlebih Dahulu</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {/* WhatsApp / Phone Button */}
                    <a
                      href={`https://wa.me/62${geofenceConfig.adminContactPhone.replace(/[^0-9]/g, '').replace(/^0/, '')}?text=${encodeURIComponent(
                        `Halo ${geofenceConfig.adminContactName}, saya ${selectedUser.name} ingin mengonfirmasi presensi ${attendanceType} di TKK Inviolata Ruteng karena melewati batas waktu.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#25D366] hover:bg-[#20b858] text-white p-2 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Telepon */}
                    <a
                      href={`tel:${geofenceConfig.adminContactPhone}`}
                      className="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                      <span>Telepon Admin</span>
                    </a>
                  </div>

                  {/* Pengajuan Form Toggle */}
                  <button
                    onClick={() => setShowExcuseForm(!showExcuseForm)}
                    className="w-full text-center text-[10px] text-[#0088cc] hover:underline font-bold pt-1 block"
                  >
                    {showExcuseForm ? 'Tutup Form Dispensasi' : '+ Ajukan Dispensasi Buka Kunci'}
                  </button>

                  {/* Excuse form inside phone */}
                  {showExcuseForm && (
                    <form onSubmit={handleSubmitExcuse} className="space-y-2 pt-1 border-t border-rose-200">
                      <input
                        type="text"
                        placeholder="Alasan keterlambatan..."
                        value={excuseReason}
                        onChange={(e) => setExcuseReason(e.target.value)}
                        className="w-full text-[10px] border border-slate-300 rounded-lg p-1.5 bg-white"
                        required
                      />
                      <div className="flex flex-wrap gap-1">
                        {quickExcuses.map((qx, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setExcuseReason(qx)}
                            className="text-[9px] bg-white border border-slate-300 hover:bg-amber-50 px-1.5 py-0.5 rounded text-slate-700"
                          >
                            {qx}
                          </button>
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded-lg bg-[#0088cc] text-white font-bold text-[10px] flex items-center justify-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Kirim Permohonan ke Admin</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Attendance Action Button */}
            <div className="pt-2">
              <button
                disabled={!canSubmitAttendance || isSubmitting}
                onClick={handleSimulateAbsen}
                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition ${
                  canSubmitAttendance
                    ? 'bg-[#0088cc] hover:bg-[#0077b5] text-white active:scale-98 cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {canSubmitAttendance ? (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Memverifikasi Presensi...'
                        : isUnlockApproved
                        ? `AMBIL FOTO & PRESENSI (Disetujui Admin)`
                        : `AMBIL FOTO & PRESENSI ${attendanceType}`}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>PRESENSI TERKUNCI (LEWAT BATAS)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: INFORMASI UMUM */}
        {activeScreen === 'informasi' && (
          <div className="flex-1 flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-3">
              <button
                onClick={() => setActiveScreen('home')}
                className="p-1 rounded-full hover:bg-slate-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <span className="font-bold text-sm text-slate-800">
                Pengumuman TKK Inviolata
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Aturan Kehadiran
                </span>
                <h5 className="font-bold text-slate-900 mt-1">
                  Ketentuan Batas Waktu Presensi
                </h5>
                <p className="text-[11px] text-slate-600 mt-1">
                  Presensi masuk dibuka pukul {geofenceConfig.checkInStartTime} - {geofenceConfig.checkInDeadlineTime} WITA. Guru & pegawai yang hadir melewati jam tersebut wajib menghubungi Admin Utama ({geofenceConfig.adminContactName}).
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  Agenda Sekolah
                </span>
                <h5 className="font-bold text-slate-900 mt-1">
                  Pembagian Sentra Bermain Anak
                </h5>
                <p className="text-[11px] text-slate-600 mt-1">
                  Kegiatan sentra dimulai pukul 07:30 WITA setelah doa pagi. Mohon guru kelas menyiapkan sarana sentra masing-masing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 4: DISKUSI FORUM GURU */}
        {activeScreen === 'diskusi' && (
          <div className="flex-1 flex flex-col justify-between p-3 overflow-y-auto">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <button
                onClick={() => setActiveScreen('home')}
                className="p-1 rounded-full hover:bg-slate-200"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" />
              </button>
              <span className="font-bold text-xs text-slate-800">
                Forum Pendidik TKK Inviolata
              </span>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className="text-[9px] text-slate-400 mb-0.5 px-1">
                    {msg.sender} • {msg.time}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-1.5 text-xs ${
                      msg.isMe
                        ? 'bg-[#0088cc] text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input message */}
            <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Tulis pesan..."
                className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-[#0088cc]"
              />
              <button
                onClick={handleSendMessage}
                className="bg-[#0088cc] text-white p-2 rounded-lg hover:bg-[#0077b5]"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: JADWAL SENTRA */}
        {activeScreen === 'jadwal' && (
          <div className="flex-1 flex flex-col p-3.5 overflow-y-auto">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 mb-2">
              <button
                onClick={() => setActiveScreen('home')}
                className="p-1 rounded-full hover:bg-slate-200"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" />
              </button>
              <span className="font-bold text-xs text-slate-800">
                Jadwal Sentra TKK Inviolata
              </span>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-bold text-purple-900 mb-1">
                  <span>Senin</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    07:30 - 10:30 WITA
                  </span>
                </div>
                <p className="text-[11px] text-slate-700">
                  Sentra Balok & Konstruksi (TK-A) • Sentra Persiapan (TK-B)
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-bold text-purple-900 mb-1">
                  <span>Selasa</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    07:30 - 10:30 WITA
                  </span>
                </div>
                <p className="text-[11px] text-slate-700">
                  Sentra Bahan Alam & Eksplorasi Lingkungan Ruteng
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-bold text-purple-900 mb-1">
                  <span>Rabu</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    07:30 - 10:30 WITA
                  </span>
                </div>
                <p className="text-[11px] text-slate-700">
                  Sentra Seni, Musik Rohani & Tari Budaya Manggarai
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
