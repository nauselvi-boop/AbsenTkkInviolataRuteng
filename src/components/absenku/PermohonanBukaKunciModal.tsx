import React, { useState } from 'react';
import { AttendanceUnlockRequest, User } from '../../types';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Send,
  MessageSquare,
  Phone,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';

interface PermohonanBukaKunciModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: AttendanceUnlockRequest[];
  onApproveRequest: (requestId: string, adminNotes?: string) => void;
  onRejectRequest: (requestId: string) => void;
  currentUser: User;
  onSendNewRequest?: (
    reason: string,
    type: 'MASUK' | 'PULANG' | 'IZIN_SAKIT' | 'IZIN_KEPERLUAN' | 'CUTI',
    startDate?: string,
    endDate?: string
  ) => void;
}

export const PermohonanBukaKunciModal: React.FC<PermohonanBukaKunciModalProps> = ({
  isOpen,
  onClose,
  requests,
  onApproveRequest,
  onRejectRequest,
  currentUser,
  onSendNewRequest,
}) => {
  const [newReason, setNewReason] = useState('');
  const [requestType, setRequestType] = useState<
    'MASUK' | 'PULANG' | 'IZIN_SAKIT' | 'IZIN_KEPERLUAN' | 'CUTI'
  >('MASUK');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [adminNoteInput, setAdminNoteInput] = useState<{ [id: string]: string }>({});

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'ADMIN';
  const pendingCount = requests.filter((r) => r.status === 'MENUNGGU').length;

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) return;
    if (onSendNewRequest) {
      onSendNewRequest(newReason.trim(), requestType, startDate, endDate);
      setNewReason('');
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'IZIN_SAKIT':
        return 'Izin Sakit';
      case 'IZIN_KEPERLUAN':
        return 'Izin Keperluan / Dinas';
      case 'CUTI':
        return 'Permohonan Cuti';
      case 'MASUK':
      case 'DISPENSASI_MASUK':
        return 'Dispensasi Masuk (Keterlambatan)';
      case 'PULANG':
      case 'DISPENSASI_PULANG':
        return 'Dispensasi Pulang Cepat';
      default:
        return 'Pengajuan Izin';
    }
  };

  const quickReasons = [
    'Kendaraan bermasalah di perjalanan ke Ruteng',
    'Cuaca hujan lebat & jalan berkabut di wilayah Manggarai',
    'Izin istirahat sakit / demam',
    'Keperluan mendesak keluarga di Ruteng',
    'Tugas kedinasan luar TKK Inviolata',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                <span>Dispensasi & Buka Kunci Presensi</span>
                {pendingCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {pendingCount} Menunggu
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300">
                {isAdmin
                  ? 'Verifikasi persetujuan keterlambatan guru dan pegawai'
                  : 'Pengajuan dispensasi presensi di luar batas waktu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800 text-xs">
          {/* If Non-Admin, show submission form */}
          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Form Pengajuan Izin & Dispensasi Presensi</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Pilih jenis permohonan yang diajukan ke Admin Utama (Sr. Maria Inviolata, S.Pd.) untuk persetujuan kehadiran.
              </p>

              <form onSubmit={handleSubmitNew} className="space-y-3">
                {/* Type Selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Pengajuan:
                  </label>
                  <select
                    value={requestType}
                    onChange={(e) =>
                      setRequestType(
                        e.target.value as
                          | 'MASUK'
                          | 'PULANG'
                          | 'IZIN_SAKIT'
                          | 'IZIN_KEPERLUAN'
                          | 'CUTI'
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-[#0088cc] focus:border-transparent font-medium"
                  >
                    <option value="MASUK">Dispensasi Masuk (Keterlambatan Hadir)</option>
                    <option value="PULANG">Dispensasi Pulang (Di Luar Jam)</option>
                    <option value="IZIN_SAKIT">Izin Sakit (Surat / Kondisi Medis)</option>
                    <option value="IZIN_KEPERLUAN">Izin Keperluan Keluarga / Dinas Luar</option>
                    <option value="CUTI">Permohonan Cuti Tahunan / Khusus</option>
                  </select>
                </div>

                {/* Date range for leave */}
                {(requestType === 'IZIN_SAKIT' ||
                  requestType === 'IZIN_KEPERLUAN' ||
                  requestType === 'CUTI') && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 text-[11px] mb-0.5">
                        Mulai Tanggal:
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 text-[11px] mb-0.5">
                        Sampai Tanggal:
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alasan / Keterangan:
                  </label>
                  <textarea
                    rows={2}
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="Tuliskan keterangan izin atau keterlambatan..."
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-[#0088cc] focus:border-transparent"
                    required
                  />
                </div>

                {/* Quick pills */}
                <div className="flex flex-wrap gap-1.5">
                  {quickReasons.map((qr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewReason(qr)}
                      className="text-[10px] bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded-md transition text-left"
                    >
                      + {qr}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirimkan Pengajuan ke Admin</span>
                </button>
              </form>
            </div>
          )}

          {/* List of Requests */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
              <span>Daftar Pengajuan Izin & Dispensasi</span>
              <span className="text-slate-400 font-normal text-xs">
                Total: {requests.length} pengajuan
              </span>
            </h4>

            {requests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Belum ada pengajuan izin atau buka kunci presensi.
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className={`rounded-xl border p-3.5 transition ${
                      req.status === 'MENUNGGU'
                        ? 'bg-amber-50/60 border-amber-200'
                        : req.status === 'DISETUJUI'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs">
                            {req.userName}
                          </h5>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {req.userPosition} • <span className="text-[#0088cc] font-bold">{getTypeName(req.type)}</span>
                            {req.startDate && ` (${req.startDate} s/d ${req.endDate || req.startDate})`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            req.status === 'MENUNGGU'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : req.status === 'DISETUJUI'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {req.status === 'MENUNGGU'
                            ? 'Menunggu Persetujuan'
                            : req.status === 'DISETUJUI'
                            ? 'Disetujui Admin'
                            : 'Ditolak'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          <span>{req.requestTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 rounded-lg p-2.5 border border-slate-200/80 mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Alasan & Keterangan:
                      </span>
                      <p className="text-slate-800 text-xs">{req.reason}</p>
                    </div>

                    {req.adminNotes && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 rounded-lg p-2 border border-emerald-200 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Catatan Admin: {req.adminNotes}</span>
                      </div>
                    )}

                    {/* Admin Action Buttons */}
                    {isAdmin && req.status === 'MENUNGGU' && (
                      <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="Catatan persetujuan (opsional)..."
                          value={adminNoteInput[req.id] || ''}
                          onChange={(e) =>
                            setAdminNoteInput({
                              ...adminNoteInput,
                              [req.id]: e.target.value,
                            })
                          }
                          className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() =>
                              onApproveRequest(req.id, adminNoteInput[req.id])
                            }
                            className="flex-1 sm:flex-none px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui Permohonan</span>
                          </button>
                          <button
                            onClick={() => onRejectRequest(req.id)}
                            className="flex-1 sm:flex-none px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1 border border-slate-200 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-3.5 h-3.5 text-[#0088cc]" />
            <span>Kontak Admin Utama: <b>0812-3888-9901</b> (Sr. Maria Inviolata)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
