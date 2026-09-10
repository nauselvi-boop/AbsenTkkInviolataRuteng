import React, { useState } from 'react';
import {
  School,
  FileSpreadsheet,
  Users,
  MapPin,
  CheckSquare,
  Megaphone,
  UserCog,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { AdminDashboard } from '../AdminDashboard';
import { User, AttendanceRecord, GeofenceConfig } from '../../types';

interface MobileAbsenKuHomeProps {
  user: any;
  onLogout: () => void;
  onNavigate?: (tab: string) => void;
  // Props untuk AdminDashboard
  users: User[];
  records: AttendanceRecord[];
  geofenceConfig: GeofenceConfig;
  onSaveGeofenceConfig: (config: GeofenceConfig) => void;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onImportUsers: (newUsers: Omit<User, 'id' | 'createdAt'>[]) => void;
  adminTab: 'monitoring' | 'laporan' | 'pengguna' | 'geofence' | 'izin_terlambat' | 'izin_tidak_masuk' | 'pengumuman' | 'profile';
  setAdminTab: (tab: any) => void;
}

export const MobileAbsenKuHome: React.FC<MobileAbsenKuHomeProps> = ({
  user,
  onLogout,
  onNavigate,
  users,
  records,
  geofenceConfig,
  onSaveGeofenceConfig,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onImportUsers,
  adminTab,
  setAdminTab,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isIzinOpen, setIsIzinOpen] = useState(false);

  const menuItems = [
    { icon: <School className="w-5 h-5" />, label: 'Beranda / Monitoring', tabId: 'monitoring' },
    { icon: <FileSpreadsheet className="w-5 h-5" />, label: 'Rekap Absensi Excel', tabId: 'laporan' },
    { icon: <Users className="w-5 h-5" />, label: 'Data Guru & Pegawai', tabId: 'pengguna' },
    { icon: <MapPin className="w-5 h-5" />, label: 'Lokasi GPS & Jam Sekolah', tabId: 'geofence' },
    {
      icon: <CheckSquare className="w-5 h-5" />,
      label: 'Persetujuan Izin & Kunci',
      isDropdown: true,
      subItems: [
        { label: 'Izin Terlambat', tabId: 'aktivasi_absen' },
        { label: 'Izin Tidak Masuk', tabId: 'izin_tidak_masuk' },
      ],
    },
    { icon: <Megaphone className="w-5 h-5" />, label: 'Pengumuman Sekolah', tabId: 'pengumuman' },
    { icon: <UserCog className="w-5 h-5" />, label: 'Profil & Password', tabId: 'profile' },
  ];

  const handleMenuClick = (tabId: string) => {
    setAdminTab(tabId as any);
    if (onNavigate) onNavigate(tabId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <header className="bg-[#1a2e3b] text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-2">
          <School className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-lg">absenKU</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-1">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR MENU */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#1a2e3b] text-white z-40 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-lg">absenKU</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 py-1 text-xs text-gray-400 uppercase tracking-wider">
            Hak Akses: {user?.role || 'Admin'} (Penuh)
          </div>

          {menuItems.map((item, idx) => {
            if (item.isDropdown) {
              return (
                <div key={idx}>
                  <button
                    onClick={() => setIsIzinOpen(!isIzinOpen)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm transition text-left text-gray-300 hover:bg-gray-700/30 border-b border-gray-700/50"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {isIzinOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isIzinOpen && (
                    <div className="bg-gray-800/50">
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.tabId}
                          onClick={() => handleMenuClick(sub.tabId)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left text-gray-300 hover:bg-gray-700/30 pl-10 border-b border-gray-700/30"
                        >
                          <span className="text-emerald-400">▸</span>
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.tabId}
                onClick={() => handleMenuClick(item.tabId)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition text-left text-gray-300 hover:bg-gray-700/30 border-b border-gray-700/50"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              onLogout();
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700/30 transition text-left border-b border-gray-700/50"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>

        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=8B5CF6&color=fff&size=40`}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="text-white font-semibold text-sm">{user?.name || 'User'}</p>
              <p className="text-gray-400 text-[10px]">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KONTEN UTAMA (AdminDashboard) */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <AdminDashboard
          currentUser={user}
          users={users}
          records={records}
          geofenceConfig={geofenceConfig}
          onSaveGeofenceConfig={onSaveGeofenceConfig}
          onAddUser={onAddUser}
          onUpdateUser={onUpdateUser}
          onDeleteUser={onDeleteUser}
          onImportUsers={onImportUsers}
          activeTab={adminTab}
          onTabChange={setAdminTab}
        />
      </div>
    </div>
  );
};