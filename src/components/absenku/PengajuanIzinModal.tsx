import React, { useState } from 'react';
import {
  X,
  FileText,
  Calendar,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  HeartPulse,
  Briefcase,
  Unlock,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { User, AttendanceUnlockRequest } from '../../types';

interface PengajuanIzinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  requests: AttendanceUnlockRequest[];
  onSubmitRequest: (newReq: Omit<AttendanceUnlockRequest, 'id' | 'createdAt' | 'status'>) => void;
}

export const PengajuanIzinModal: React.FC<PengajuanIzinModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  requests,
  onSubmitRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Form State
  const [selectedType, setSelectedType] = useState<
    'IZIN_SAKIT' | 'IZIN_KEPERLUAN' | 'CUTI' | 'MASUK'
  >('IZIN_SAKIT');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('');
  const [isSuccessMessage, setIsSuccessMessage] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter requests submitted by this staff member
  const myRequests = requests.filter((r) => r.userId === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const currTimeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    onSubmitRequest({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      userPosition: currentUser.position,
      type: selectedType,
      startDate,
      endDate,
      requestTime: `${timeStr} WITA`,
      currentTime: currTimeStr,
      reason: reason.trim(),
    });

    setReason('');
    setIsSuccessMessage(true);
    setTimeout(() => {
      setIsSuccessMessage(false);
      setActiveTab('history');
    }, 1200);
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'IZIN_SAKIT':
        return 'Izin Sakit';
      case 'IZIN_KEPERLUAN':
        return 'Izin Keperluan Pribadi/Keluarga';
      case 'CUTI':
        return 'Permohonan Cuti';
      case 'MASUK':
      case 'DISPENSASI_MASUK':
        return 'Dispensasi Buka Kunci Presensi Masuk';
      case 'PULANG':
      case 'DISPENSASI_PULANG':
        return 'Dispensasi Buka Kunci Presensi Pulang';
      default:
        return 'Pengajuan Izin';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-900 to-[#0088cc] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Layanan Pengajuan Izin & Dispensasi
              </h3>
              <p className="text-xs text-sky-100">
                TKK Inviolata Ruteng • {currentUser.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'form'
                ? 'border-[#0088cc] text-[#0088cc] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Formulir Pengajuan Baru
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#0088cc] text-[#0088cc] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Riwayat Pengajuan Saya</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">
              {myRequests.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-700 space-y-4">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    Pengajuan berhasil dikirimkan ke Admin Utama TKK Inviolata!
                  </span>
                </div>
              )}

              {/* Step 1: Select Type of Leave */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  1. Pilih Kategori Izin / Dispensasi:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Izin Sakit */}
                  <div
                    onClick={() => setSelectedType('IZIN_SAKIT')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      selectedType === 'IZIN_SAKIT'
                        ? 'border-[#0088cc] bg-sky-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        Izin Sakit
                      </h5>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Kondisi kesehatan kurang baik / istirahat medis
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Izin Keperluan */}
                  <div
                    onClick={() => setSelectedType('IZIN_KEPERLUAN')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      selectedType === 'IZIN_KEPERLUAN'
                        ? 'border-[#0088cc] bg-sky-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0088cc] flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        Izin Keperluan
                      </h5>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Acara keluarga mendesak / dinas kependidikan
                      </p>
                    </div>
                  </div>

                  {/* Option 3: Cuti */}
                  <div
                    onClick={() => setSelectedType('CUTI')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      selectedType === 'CUTI'
                        ? 'border-[#0088cc] bg-sky-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        Permohonan Cuti
                      </h5>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Cuti tahunan / cuti melahirkan / khusus
                      </p>
                    </div>
                  </div>

                  {/* Option 4: Dispensasi Keterlambatan */}
                  <div
                    onClick={() => setSelectedType('MASUK')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      selectedType === 'MASUK'
                        ? 'border-[#0088cc] bg-sky-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Unlock className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        Buka Kunci Presensi
                      </h5>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Dispensasi terlambat karena kendala jalan/cuaca
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Mulai:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0088cc]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Selesai:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0088cc]"
                    required
                  />
                </div>
              </div>

              {/* Step 3: Detailed Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan & Keterangan Lengkap:
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan izin secara jelas dan santun untuk pertimbangan Kepala TKK Inviolata Ruteng..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-[#0088cc] resize-none"
                  required
                />
              </div>

              {/* Note about admin review */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-slate-700 text-[11px] leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Pengajuan ini akan langsung masuk ke panel <b>Admin Utama (Sr. Maria Inviolata, S.Pd.)</b> untuk diverifikasi dan disetujui.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!reason.trim()}
                className="w-full py-2.5 px-4 bg-[#0088cc] hover:bg-[#0077b5] disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                <span>Kirimkan Pengajuan Izin</span>
              </button>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {myRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">
                    Belum Ada Pengajuan Izin
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Pengajuan izin atau dispensasi yang Anda buat akan muncul di sini.
                  </p>
                </div>
              ) : (
                myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">
                          {getTypeName(req.type)}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Diajukan: {req.requestTime || req.createdAt}
                          {req.startDate && ` • Periode: ${req.startDate} s/d ${req.endDate || req.startDate}`}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          req.status === 'DISETUJUI'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : req.status === 'DITOLAK'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                        }`}
                      >
                        {req.status === 'DISETUJUI' && <CheckCircle2 className="w-3 h-3" />}
                        {req.status === 'DITOLAK' && <XCircle className="w-3 h-3" />}
                        {req.status === 'MENUNGGU' && <Clock className="w-3 h-3" />}
                        <span>
                          {req.status === 'DISETUJUI'
                            ? 'Disetujui Admin'
                            : req.status === 'DITOLAK'
                            ? 'Ditolak Admin'
                            : 'Menunggu Persetujuan'}
                        </span>
                      </span>
                    </div>

                    <p className="text-slate-700 text-xs bg-white p-2.5 rounded-lg border border-slate-200/80">
                      "{req.reason}"
                    </p>

                    {req.adminNotes && (
                      <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 text-[11px] text-sky-900">
                        <span className="font-bold">Catatan Admin:</span> {req.adminNotes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Kontak Admin TKK Inviolata: 0812-3888-9901</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
