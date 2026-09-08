import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { GeofenceConfig, LocationData } from '../types';
import { MapPin, Navigation, School, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface GeofenceMapProps {
  config: GeofenceConfig;
  userLocation: LocationData | null;
  onSelectCoordinates?: (lat: number, lng: number) => void;
  interactiveSelect?: boolean;
  height?: string;
  allStaffLocations?: Array<{
    id: string;
    userName: string;
    userRole: string;
    time: string;
    location: LocationData;
  }>;
}

export const GeofenceMap: React.FC<GeofenceMapProps> = ({
  config,
  userLocation,
  onSelectCoordinates,
  interactiveSelect = false,
  height = '360px',
  allStaffLocations = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const schoolMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const staffMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id && !mapInstanceRef.current) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    const schoolLat = Number(config.latitude) || -8.6135;
    const schoolLng = Number(config.longitude) || 120.4689;
    const schoolRadius = Number(config.radiusMeters) || 50;

    if (!mapInstanceRef.current) {
      // Initialize map centered at school coordinates
      const map = L.map(mapContainerRef.current, {
        center: [schoolLat, schoolLng],
        zoom: 17,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // School custom HTML marker
      const schoolIcon = L.divIcon({
        className: 'custom-school-marker',
        html: `
          <div style="background-color: #059669; color: white; padding: 6px; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 2px solid white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10"/>
              <path d="M6 10h10"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const schoolMarker = L.marker([schoolLat, schoolLng], {
        icon: schoolIcon,
      })
        .addTo(map)
        .bindPopup(`<b>${config.schoolName}</b><br/>Pusat Geofence TK`);

      schoolMarkerRef.current = schoolMarker;

      // Geofence Circle
      const circle = L.circle([schoolLat, schoolLng], {
        radius: schoolRadius,
        color: '#10b981',
        fillColor: '#34d399',
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '4, 4',
      }).addTo(map);

      circleRef.current = circle;

      // Layer group for staff pins
      const staffGroup = L.layerGroup().addTo(map);
      staffMarkersGroupRef.current = staffGroup;

      if (interactiveSelect && onSelectCoordinates) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onSelectCoordinates(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      // Clean up map when unmounting
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Update center and geofence circle when config changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const schoolLat = Number(config.latitude) || -8.6135;
    const schoolLng = Number(config.longitude) || 120.4689;
    const schoolRadius = Number(config.radiusMeters) || 50;

    if (schoolMarkerRef.current) {
      schoolMarkerRef.current.setLatLng([schoolLat, schoolLng]);
      schoolMarkerRef.current.setPopupContent(`<b>${config.schoolName}</b><br/>Radius: ${schoolRadius} meter`);
    }

    if (circleRef.current) {
      circleRef.current.setLatLng([schoolLat, schoolLng]);
      circleRef.current.setRadius(schoolRadius);
    }
  }, [config.latitude, config.longitude, config.radiusMeters, config.schoolName]);

  // Update user current location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (userLocation) {
      const isInside = userLocation.isWithinGeofence;
      const markerColor = isInside ? '#2563eb' : '#ef4444';

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative;">
            <div style="background-color: ${markerColor}; color: white; padding: 6px; border-radius: 9999px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 2.5px solid white;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div style="position: absolute; top: -6px; right: -6px; width: 12px; height: 12px; border-radius: 9999px; background-color: ${isInside ? '#10b981' : '#ef4444'}; border: 2px solid white;"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
        userMarkerRef.current.setIcon(userIcon);
      } else {
        userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
          icon: userIcon,
        }).addTo(map);
      }

      userMarkerRef.current.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px;">
          <strong style="color: ${isInside ? '#059669' : '#dc2626'}">
            ${isInside ? '✔ Di Dalam Area Sekolah' : '✖ Di Luar Area Sekolah'}
          </strong><br/>
          Jarak: <b>${userLocation.distanceMeters} meter</b><br/>
          Akurasi GPS: ±${userLocation.accuracy}m
        </div>
      `);
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // Update staff markers if on admin live monitoring
  useEffect(() => {
    if (!staffMarkersGroupRef.current) return;
    const group = staffMarkersGroupRef.current;
    group.clearLayers();

    allStaffLocations.forEach((staff) => {
      const isInside = staff.location.isWithinGeofence;
      const staffIcon = L.divIcon({
        className: 'staff-live-marker',
        html: `
          <div style="background-color: ${isInside ? '#0284c7' : '#f97316'}; color: white; padding: 4px; border-radius: 8px; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.25); white-space: nowrap;">
            ${staff.userRole === 'GURU' ? '👩‍🏫' : '👨‍💼'} ${staff.userName.split(' ')[0]}
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      L.marker([staff.location.latitude, staff.location.longitude], { icon: staffIcon })
        .addTo(group)
        .bindPopup(`
          <div style="font-size: 12px;">
            <b>${staff.userName}</b> (${staff.userRole})<br/>
            Waktu Absen: ${staff.time}<br/>
            Jarak: ${staff.location.distanceMeters}m<br/>
            Status: ${isInside ? 'Dalam Area' : 'Luar Area'}
          </div>
        `);
    });
  }, [allStaffLocations]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Quick Floating Status Pill */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-2 text-xs">
        <School className="w-4 h-4 text-emerald-600 shrink-0" />
        <div>
          <p className="font-semibold text-slate-800 leading-tight">{config.schoolName}</p>
          <p className="text-slate-500 text-[11px]">Radius Geofence: <span className="font-semibold text-emerald-700">{config.radiusMeters} meter</span></p>
        </div>
      </div>

      {userLocation && (
        <div className={`absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border ${userLocation.isWithinGeofence ? 'border-emerald-300 text-emerald-800' : 'border-rose-300 text-rose-800'} flex items-center gap-2 text-xs`}>
          {userLocation.isWithinGeofence ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <div>
            <p className="font-bold leading-tight">
              {userLocation.isWithinGeofence ? 'Lokasi Anda Di Dalam Area TK' : 'Lokasi Anda Di Luar Radius TK'}
            </p>
            <p className="text-[11px] opacity-80">
              Jarak: <span className="font-semibold">{userLocation.distanceMeters}m</span> (Batas: {config.radiusMeters}m)
            </p>
          </div>
        </div>
      )}

      {interactiveSelect && (
        <div className="absolute top-3 right-3 z-[1000] bg-blue-600 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow pointer-events-none flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Klik pada peta untuk menetapkan koordinat
        </div>
      )}
    </div>
  );
};
