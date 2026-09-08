import React, { useState, useEffect } from 'react';
import { LoginPanel } from './components/absenku/LoginPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { MainLayout } from './components/MainLayout';
import { MobileAbsenKuHome } from './components/absenku/MobileAbsenKuHome';
import { MobileStaffDashboard } from './components/absenku/MobileStaffDashboard';
import { User, AttendanceRecord, GeofenceConfig } from './types';

// Data dummy sebagai fallback jika API gagal atau users kosong
const DUMMY_USERS: User[] = [
  {
    id: 1,
    name: 'Sr. Maria',
    email: 'admin@tkkinviolata.sch.id',
    nip: '198804152014022003',
    role: 'ADMIN',
    avatarUrl: 'https://ui-avatars.com/api/?name=Sr.+Maria&background=8B5CF6&color=fff&size=40',
    phone: '081238889901',
  },
  {
    id: 2,
    name: 'Ibu Yuliana',
    email: 'guru@tkkinviolata.sch.id',
    nip: '198805162015032004',
    role: 'GURU',
    avatarUrl: 'https://ui-avatars.com/api/?name=Ibu+Yuliana&background=10B981&color=fff&size=40',
    phone: '081234567890',
  },
  {
    id: 3,
    name: 'Bpk. Yohanes',
    email: 'pegawai@tkkinviolata.sch.id',
    nip: '198807172016042005',
    role: 'PEGAWAI',
    avatarUrl: 'https://ui-avatars.com/api/?name=Bpk.+Yohanes&background=3B82F6&color=fff&size=40',
    phone: '081298765432',
  },
];

const DEFAULT_GEOFENCE: GeofenceConfig = {
  schoolName: 'TKK Inviolata Ruteng',
  latitude: -8.6135,
  longitude: 120.4689,
  radiusMeters: 50,
  checkInStartTime: '06:30',
  checkInDeadlineTime: '07:15',
  checkOutStartTime: '12:30',
  checkOutDeadlineTime: '15:30',
};

function App() {
  // State utama
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<
    'monitoring' | 'laporan' | 'pengguna' | 'geofence' | 'izin_terlambat' | 'izin_tidak_masuk' | 'pengumuman' | 'profile'
  >('monitoring');
  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig>(DEFAULT_GEOFENCE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi perangkat mobile menggunakan matchMedia (lebih akurat)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 1. Load user dari localStorage dan fetch geofence config
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    // Fetch geofence config dari database
    const fetchGeofence = async () => {
      try {
        const res = await fetch('/api/geofence');
        const data = await res.json();
        if (data.success && data.data) {
          setGeofenceConfig(data.data);
        }
      } catch (error) {
        console.error('Gagal fetch geofence:', error);
      }
    };
    fetchGeofence();

    setLoading(false);
    setIsInitialized(true);
  }, []);

  // 2. Fetch users dan records secara berurutan
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      await fetchUsers();
      await fetchRecords();
    };
    fetchData();
  }, [user]);

  // ---- Fungsi fetch data ----
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setUsers(data.data);
        }
      }
    } catch (error) {
      console.error('Gagal fetch users:', error);
    }
  };

  const fetchRecords = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      if (data.success) {
        const formatted = data.data.map((item: any) => {
          const foundUser = users.find(u => u.id === item.user_id) || null;
          const userName = foundUser?.name || item.user_name || 'Unknown';
          const userNip = foundUser?.nip || item.nip || '0000000000000';
          const userRole = foundUser?.role || item.user_role || 'STAFF';
          const avatar = foundUser?.avatarUrl || `https://ui-avatars.com/api/?name=${userName}&background=gray&color=fff&size=40`;

          return {
            id: item.id.toString(),
            userId: item.user_id.toString(),
            userName: userName,
            userRole: userRole,
            nip: userNip,
            date: item.attendance_date.split('T')[0],
            checkInTime: new Date(item.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            checkInLocation: {
              latitude: item.check_in_lat || 0,
              longitude: item.check_in_lng || 0,
              distanceMeters: 0,
            },
            checkInStatus: 'TEPAT_WAKTU',
            checkInPhoto: avatar,
            status: item.status || 'hadir',
            notes: item.notes || '',
            location: item.location || '',
          };
        });
        setRecords(formatted);
      }
    } catch (error) {
      console.error('Gagal fetch absensi:', error);
    }
  };

  // ---- Login / Logout ----
  const handleLogin = (selectedUser: User) => {
    setUser(selectedUser);
    localStorage.setItem('user', JSON.stringify(selectedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setRecords([]);
  };

  const handleRefresh = async () => {
    await fetchUsers();
    await fetchRecords();
  };

  // ---- CRUD Users ----
  const handleAddUser = async (newUser: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchUsers();
        alert('✅ User berhasil ditambahkan!');
      } else {
        alert('❌ Gagal tambah user: ' + (data.error || data.detail));
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Terjadi kesalahan saat menambahkan user.');
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const res = await fetch(`/api/users?id=${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchUsers();
        alert('✅ User berhasil diupdate!');
      } else {
        alert('❌ Gagal update user: ' + (data.error || data.detail));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) return;
    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchUsers();
        alert('✅ User berhasil dihapus!');
      } else {
        alert('❌ Gagal hapus user: ' + (data.error || data.detail));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleImportUsers = async (newUsers: any[]) => {
    try {
      const res = await fetch('/api/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: newUsers }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchUsers();
        alert('✅ Import berhasil!');
      } else {
        alert('❌ Gagal import: ' + (data.error || data.detail));
      }
    } catch (error) {
      console.error('Error importing users:', error);
    }
  };

  const handleSaveGeofence = async (config: GeofenceConfig) => {
    try {
      const res = await fetch('/api/geofence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeofenceConfig(data.data);
        alert('✅ Konfigurasi berhasil disimpan!');
      } else {
        throw new Error(data.error || 'Gagal menyimpan konfigurasi');
      }
    } catch (error: any) {
      console.error('Error saving geofence:', error);
      alert('❌ ' + error.message);
      throw error;
    }
  };

  // ---- Render ----
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const loginUsers = users.length > 0 ? users : DUMMY_USERS;
    return <LoginPanel users={loginUsers} onLogin={handleLogin} />;
  }

  // ---- Deteksi Admin ----
  const userRole = user.role?.toLowerCase() || '';
  const isAdmin =
    userRole === 'admin' ||
    userRole.includes('admin') ||
    user.role === 'ADMIN_UTAMA' ||
    user.role === 'Administrator' ||
    user.role === 'Administrator Utama';

  // ---- RENDER MOBILE ----
  if (isMobile) {
    if (isAdmin) {
      return (
        <MobileAbsenKuHome
          user={user}
          onLogout={handleLogout}
          onNavigate={setAdminTab}
          users={users}
          records={records}
          geofenceConfig={geofenceConfig}
          onSaveGeofenceConfig={handleSaveGeofence}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onImportUsers={handleImportUsers}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
        />
      );
    } else {
      return (
        <MobileStaffDashboard
          user={user}
          records={records}
          onRefresh={handleRefresh}
          onLogout={handleLogout}
          geofenceConfig={geofenceConfig}
        />
      );
    }
  }

  // ---- RENDER DESKTOP ----
  if (isAdmin) {
    return (
      <MainLayout
        user={user}
        onLogout={handleLogout}
        activeTab={adminTab}
        onTabChange={setAdminTab}
      >
        <AdminDashboard
          users={users}
          records={records}
          geofenceConfig={geofenceConfig}
          onSaveGeofenceConfig={handleSaveGeofence}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onImportUsers={handleImportUsers}
          activeTab={adminTab}
          onTabChange={setAdminTab}
        />
      </MainLayout>
    );
  }

  return (
    <StaffDashboard
      user={user}
      records={records}
      onRefresh={handleRefresh}
      onLogout={handleLogout}
      geofenceConfig={geofenceConfig}
    />
  );
}

export default App;