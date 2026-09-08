import React, { useState, useEffect, useRef } from 'react';
import { User, GeofenceConfig } from '../../types';
import { MapPin, Navigation, Clock, UserCheck, Layers, GraduationCap } from 'lucide-react';
import L from 'leaflet';

interface TrackingLocationCardProps {
  users: User[];
  geofenceConfig: GeofenceConfig;
}

export const TrackingLocationCard: React.FC<TrackingLocationCardProps> = ({
  users,
  geofenceConfig,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    users[1]?.id || users[0]?.id || ''
  );
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  // Safely parse numerical base coordinates (in case geofenceConfig returns string values)
  const baseLat = Number(geofenceConfig?.latitude);
  const baseLng = Number(geofenceConfig?.longitude);
  const safeBaseLat = Number.isFinite(baseLat) ? baseLat : -8.6135;
  const safeBaseLng = Number.isFinite(baseLng) ? baseLng : 120.4689;
  const safeRadius = Number(geofenceConfig?.radiusMeters) || 80;

  // Coordinate offset based on selected teacher/staff in Ruteng
  const userIdx = users.findIndex((u) => u.id === selectedUserId);
  const offsetLat = (userIdx >= 0 ? userIdx : 0) % 2 === 0 ? 0.00015 : -0.00012;
  const offsetLng = (userIdx >= 0 ? userIdx : 0) % 3 === 0 ? 0.00012 : -0.00010;

  const userLat = safeBaseLat + offsetLat;
  const userLng = safeBaseLng + offsetLng;

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Guard against "Map container is already initialized"
    if ((mapContainerRef.current as any)._leaflet_id && !mapInstanceRef.current) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    if (!mapInstanceRef.current) {
      try {
        const map = L.map(mapContainerRef.current, {
          center: [userLat, userLng],
          zoom: 17,
          zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const tileUrl =
          mapType === 'satellite'
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        const tileLayer = L.tileLayer(tileUrl, {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        // Geofence Circle around TKK Inviolata Ruteng
        const circle = L.circle([safeBaseLat, safeBaseLng], {
          radius: safeRadius,
          color: '#0088cc',
          fillColor: '#0088cc',
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '4, 4',
        }).addTo(map);

        // Custom teacher pin icon
        const teacherName = selectedUser?.name ? selectedUser.name.split(' ')[0] : 'Guru';
        const customIcon = L.divIcon({
          className: 'custom-pin',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center;">
              <div style="background:#0088cc; width:28px; height:28px; border-radius:50%; border:3px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:bold;">
                🏫
              </div>
              <div style="background:#1e293b; color:#fff; font-size:9px; font-weight:bold; padding:2px 6px; border-radius:4px; margin-top:2px; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,0.2);">
                ${teacherName}
              </div>
            </div>
          `,
          iconSize: [70, 48],
          iconAnchor: [35, 30],
        });

        const marker = L.marker([userLat, userLng], { icon: customIcon }).addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;
        circleRef.current = circle;
      } catch (err) {
        console.error('Error initializing map in TrackingLocationCard:', err);
      }
    } else {
      const map = mapInstanceRef.current;
      map.setView([userLat, userLng], 17);

      if (circleRef.current) {
        circleRef.current.setLatLng([safeBaseLat, safeBaseLng]);
        circleRef.current.setRadius(safeRadius);
      }

      if (markerRef.current) {
        markerRef.current.setLatLng([userLat, userLng]);
        const teacherName = selectedUser?.name ? selectedUser.name.split(' ')[0] : 'Guru';
        const customIcon = L.divIcon({
          className: 'custom-pin',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center;">
              <div style="background:#0088cc; width:28px; height:28px; border-radius:50%; border:3px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:bold;">
                🏫
              </div>
              <div style="background:#1e293b; color:#fff; font-size:9px; font-weight:bold; padding:2px 6px; border-radius:4px; margin-top:2px; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,0.2);">
                ${teacherName}
              </div>
            </div>
          `,
          iconSize: [70, 48],
          iconAnchor: [35, 30],
        });
        markerRef.current.setIcon(customIcon);
      }

      if (tileLayerRef.current) {
        const tileUrl =
          mapType === 'satellite'
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        tileLayerRef.current.setUrl(tileUrl);
      }
    }
  }, [userLat, userLng, safeBaseLat, safeBaseLng, safeRadius, mapType, selectedUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#0088cc]" />
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm tracking-wide">
              Tracking Lokasi Guru TKK Inviolata
            </h3>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
            GPS Ruteng
          </span>
        </div>

        {/* User Info Details Table tailored to TKK Inviolata */}
        <div className="space-y-1 text-xs text-slate-700 mb-2.5">
          <div className="flex items-center">
            <span className="w-24 text-slate-400 text-[11px] font-medium">Nama Guru</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              :
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0088cc]"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.position})
                  </option>
                ))}
              </select>
            </span>
          </div>

          <div className="flex items-center">
            <span className="w-24 text-slate-400 text-[11px] font-medium">Tugas / Sentra</span>
            <span className="font-semibold text-slate-700">
              : {selectedUser?.position || 'Pengajar TK'}
            </span>
          </div>

          <div className="flex items-center">
            <span className="w-24 text-slate-400 text-[11px] font-medium">Waktu Presensi</span>
            <span className="font-semibold text-emerald-700">
              : {new Date().toLocaleTimeString('id-ID')} WITA (Tepat Waktu)
            </span>
          </div>
        </div>
      </div>

      {/* Map Display centered on TKK Inviolata Ruteng */}
      <div className="relative rounded-lg overflow-hidden border border-slate-200 h-44 sm:h-48 w-full bg-slate-100">
        {/* Map Type Switcher like Google Maps */}
        <div className="absolute top-2 left-2 z-[400] flex rounded bg-white shadow-md border border-slate-200 text-[10px] font-bold overflow-hidden">
          <button
            onClick={() => setMapType('streets')}
            className={`px-2.5 py-1 ${
              mapType === 'streets'
                ? 'bg-slate-800 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Peta
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 ${
              mapType === 'satellite'
                ? 'bg-slate-800 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Satelit
          </button>
        </div>

        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Radius badge at bottom left */}
        <div className="absolute bottom-1 left-2 z-[400] text-[9px] font-bold text-slate-700 bg-white/90 px-1.5 py-0.5 rounded shadow-xs pointer-events-none">
          Radius Aman: {geofenceConfig.radiusMeters}m dari Gedung TKK
        </div>
      </div>
    </div>
  );
};
