import React from 'react';
import { AtlantisTab } from './AtlantisSidebar';
import { AtlantisDashboardView } from './AtlantisDashboardView';
import { User, AttendanceRecord, GeofenceConfig } from '../../types';
import { UserManagement } from '../UserManagement';
import { AttendanceReports } from '../AttendanceReports';
import { AdminGeofenceSettings } from '../AdminGeofenceSettings';
import { GeofenceMap } from '../GeofenceMap';
import { StaffDashboard } from '../StaffDashboard';
import {
  Layers,
  Columns,
  Edit3,
  Table as TableIcon,
  MapPin,
  BarChart2,
  Calendar as CalendarIcon,
  Monitor,
  Mail,
  CheckCircle2,
  Clock,
  School,
  Sparkles,
} from 'lucide-react';

interface AtlantisContentRouterProps {
  activeTab: AtlantisTab;
  users: User[];
  records: AttendanceRecord[];
  geofenceConfig: GeofenceConfig;
  onSaveGeofenceConfig: (cfg: GeofenceConfig) => void;
  onAddUser: (u: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onImportUsers: (newUsers: Omit<User, 'id' | 'createdAt'>[]) => void;
  onOpenSettings: () => void;
}

export const AtlantisContentRouter: React.FC<AtlantisContentRouterProps> = ({
  activeTab,
  users,
  records,
  geofenceConfig,
  onSaveGeofenceConfig,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onImportUsers,
  onOpenSettings,
}) => {
  // Main Dashboard Tab: Exact match with screenshot
  if (activeTab === 'dashboard') {
    return <AtlantisDashboardView onOpenSettings={onOpenSettings} />;
  }

  // Tables Tab
  if (activeTab === 'tables') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-[#EBEDF2] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Tables Management</h2>
          <p className="text-xs text-slate-400 mb-4">
            Data Guru, Pegawai, dan Rekapitulasi Presensi
          </p>
          <AttendanceReports users={users} records={records} />
        </div>
      </div>
    );
  }

  // Maps Tab: Real Geofence Map
  if (activeTab === 'maps') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-[#EBEDF2] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#1572E8]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Live GPS & Geofence Map</h2>
              <p className="text-xs text-slate-400">
                Peta batas radius kehadiran {geofenceConfig.schoolName} ({geofenceConfig.radiusMeters} meter)
              </p>
            </div>
          </div>
          <GeofenceMap
            config={geofenceConfig}
            currentUserLocation={{
              latitude: geofenceConfig.latitude,
              longitude: geofenceConfig.longitude,
              accuracy: 10,
              timestamp: Date.now(),
            }}
            allStaffLocations={users.slice(1).map((u, i) => ({
              userId: u.id,
              userName: u.name,
              avatarUrl: u.avatarUrl,
              latitude: geofenceConfig.latitude + (i % 2 === 0 ? 0.0003 : -0.0003) * (i + 1),
              longitude: geofenceConfig.longitude + (i % 3 === 0 ? 0.0002 : -0.0002) * (i + 1),
              isInsideGeofence: i < 3,
              timestamp: Date.now() - i * 600000,
            }))}
          />
        </div>
      </div>
    );
  }

  // Forms Tab: Geofence Settings & Add User
  if (activeTab === 'forms') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <AdminGeofenceSettings
          config={geofenceConfig}
          onSave={onSaveGeofenceConfig}
        />
      </div>
    );
  }

  // Base / User Management
  if (activeTab === 'base') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <UserManagement
          users={users}
          onAddUser={onAddUser}
          onUpdateUser={onUpdateUser}
          onDeleteUser={onDeleteUser}
          onImportUsers={onImportUsers}
        />
      </div>
    );
  }

  // Absensi TK Integration Tab
  if (activeTab === 'absensi-tk') {
    const guruUser = users.find((u) => u.role === 'GURU') || users[0];
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <School className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="font-bold text-emerald-900 text-sm">Mode Absensi Guru & Pegawai</p>
              <p className="text-xs text-emerald-700">Dilengkapi validasi kamera live selfie, liveness check, dan koordinat GPS.</p>
            </div>
          </div>
        </div>

        <StaffDashboard
          user={guruUser}
          geofenceConfig={geofenceConfig}
          userRecords={records.filter((r) => r.userId === guruUser.id)}
          onSaveAttendance={() => {}}
        />
      </div>
    );
  }

  // Default fallback for other components (Widgets, Charts, Calendar, Email)
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-[#EBEDF2] p-8 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1572E8] flex items-center justify-center mx-auto mb-4">
          <Monitor className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 capitalize">
          {activeTab.replace('-', ' ')} Component
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Halaman modul {activeTab} siap disesuaikan dalam template Atlantis Admin Dashboard.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-5 py-2 bg-[#1572E8] text-white rounded-xl text-xs font-semibold hover:bg-[#1265cf]"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
};
