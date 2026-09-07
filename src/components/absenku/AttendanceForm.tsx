import React, { useState } from 'react';

interface AttendanceFormProps {
  userId?: number;
  onSuccess?: () => void;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({ userId = 1, onSuccess }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('hadir');
  const [location, setLocation] = useState('Kantor');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, date, status, location, notes }),
      });
      const result = await res.json();
      if (res.ok) {
        setMessage('✅ Absensi berhasil!');
        setMessageType('success');
        if (onSuccess) onSuccess();
      } else {
        setMessage('❌ Gagal: ' + (result.detail || result.error));
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage('❌ Error: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium">Tanggal</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border rounded">
          <option value="hadir">Hadir</option>
          <option value="izin">Izin</option>
          <option value="sakit">Sakit</option>
          <option value="alpha">Alpha</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Lokasi</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kantor / Rumah" className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium">Catatan (Opsional)</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan" className="w-full p-2 border rounded" />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Menyimpan...' : 'Simpan Absensi'}
      </button>
      {message && (
        <div className={`p-2 rounded ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}
    </form>
  );
};