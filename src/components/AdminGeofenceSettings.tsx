import React, { useState, useEffect } from 'react';
import { GeofenceConfig } from '../types';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface AdminGeofenceSettingsProps {
  config: GeofenceConfig;
  onSaveConfig: (config: GeofenceConfig) => Promise<void>;
}

export const AdminGeofenceSettings: React.FC<AdminGeofenceSettingsProps> = ({
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<GeofenceConfig>(config);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'radiusMeters' || name === 'latitude' || name === 'longitude') ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      await onSaveConfig({
        ...formData,
        latitude: Number(formData.latitude) || -8.6135,
        longitude: Number(formData.longitude) || 120.4689,
        radiusMeters: Number(formData.radiusMeters) || 50,
      });
      setMessage({ text: '✅ Konfigurasi berhasil disimpan!', type: 'success' });
    } catch (error: any) {
      setMessage({ text: `❌ Gagal menyimpan: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const lat = Number(formData.latitude) || -8.6135;
  const lng = Number(formData.longitude) || 120.4689;
  const radius = Number(formData.radiusMeters) || 50;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">🏫 Konfigurasi Geofencing & Jam Sekolah</h3>

        {/* MAP */}
        <div className="h-[300px] rounded-xl overflow-hidden mb-6 border border-slate-200">
          <MapContainer center={[lat, lng]} zoom={17} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle center={[lat, lng]} radius={radius} pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.2 }} />
            <Marker position={[lat, lng]}>
              <Popup><b>{formData.schoolName}</b><br />Radius: {radius}m</Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Sekolah */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Sekolah</label>
              <input type="text" name="schoolName" value={formData.schoolName || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500" required />
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Radius Geofence (meter)</label>
              <input type="number" name="radiusMeters" value={formData.radiusMeters || 50} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500" required min="10" max="500" />
            </div>

            {/* Latitude */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Latitude</label>
              <input type="number" step="any" name="latitude" value={formData.latitude || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500" required />
            </div>

            {/* Longitude */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Longitude</label>
              <input type="number" step="any" name="longitude" value={formData.longitude || ''} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500" required />
            </div>

            {/* Jam Mulai Absen Datang */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mulai Buka Absen Datang</label>
              <input type="time" name="checkInStartTime" value={formData.checkInStartTime || '06:30'} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500" required />
            </div>

            {/* Batas Jam Tepat Waktu */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Batas Jam Tepat Waktu</label>
              <input type="time" name="checkInDeadlineTime" value={formData.checkInDeadlineTime || '07:15'} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500" required />
            </div>

            {/* Jam Mulai Absen Pulang */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mulai Buka Absen Pulang</label>
              <input type="time" name="checkOutStartTime" value={formData.checkOutStartTime || '12:30'} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500" required />
            </div>

            {/* Batas Akhir Absen Pulang */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Batas Akhir Absen Pulang</label>
              <input type="time" name="checkOutDeadlineTime" value={formData.checkOutDeadlineTime || '15:30'} onChange={handleChange} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500" required />
            </div>
          </div>

          {/* Info Anti-Fake GPS */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-gray-700">
            <p className="font-semibold text-blue-800">🛡️ Proteksi Anti-Fake GPS</p>
            <p className="text-xs text-gray-600 mt-1">Deteksi Lokasi Palsu / Mock GPS – Mencegah manipulasi lokasi & teleportasi sinyal.</p>
            <p className="text-xs text-gray-600 mt-1">Guru & pegawai harus berada maksimal <strong>{radius}m</strong> dari titik pusat sekolah.</p>
          </div>

          {/* Tombol */}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition disabled:opacity-50">
              {isLoading ? 'Menyimpan...' : '💾 Simpan Konfigurasi'}
            </button>
            {message && <span className={`text-sm font-semibold ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>{message.text}</span>}
          </div>
        </form>
      </div>
    </div>
  );
};