import React, { useState, useEffect } from 'react';
import { LoginPanel } from './components/absenku/LoginPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { MainLayout } from './components/MainLayout';
import { MobileAbsenKuHome } from './components/absenku/MobileAbsenKuHome';
import { User, AttendanceRecord, GeofenceConfig } from './types';
import { INITIAL_USERS, DEFAULT_GEOFENCE, INITIAL_ATTENDANCE } from './data/mockData';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<'monitoring' | 'laporan' | 'pengguna' | 'geofence' | 'izin' | 'pengumuman' | 'profile'>('monitoring');
  const [reportPreset, setReportPreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig>(DEFAULT_GEOFENCE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [forceViewMode, setForceViewMode] = useState<'auto' | 'mobile' | 'desktop'>('auto');

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    const fetchGeofence = async () => {
      try {
        const res = await fetch('/api/geofence');
        const data = await res.json();
        if (data.success && data.data) {
          setGeofenceConfig({
            ...data.data,
            latitude: Number(data.data.latitude) || DEFAULT_GEOFENCE.latitude,
            longitude: Number(data.data.longitude) || DEFAULT_GEOFENCE.longitude,
            radiusMeters: Number(data.data.radiusMeters) || DEFAULT_GEOFENCE.radiusMeters,
          });
        }
      } catch (error) {
        console.error('Gagal fetch geofence:', error);
      }
    };
    fetchGeofence();

    setLoading(false);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      await fetchUsers();
      await fetchRecords();
    };
    fetchData();
  }, [user]);

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
            checkInLocation: { latitude: item.check_in_lat || 0, longitude: item.check_in_lng || 0, distanceMeters: 0 },
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

  const handleAddUser = async (newUser: any) => {
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
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
      const res = await fetch(`/api/users?id=${updatedUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedUser) });
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
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
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
      const res = await fetch('/api/users/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ users: newUsers }) });
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
      const res = await fetch('/api/geofence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeofenceConfig({
          ...data.data,
          latitude: Number(data.data.latitude) || DEFAULT_GEOFENCE.latitude,
          longitude: Number(data.data.longitude) || DEFAULT_GEOFENCE.longitude,
          radiusMeters: Number(data.data.radiusMeters) || DEFAULT_GEOFENCE.radiusMeters,
        });
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
    const loginUsers = users.length > 0 ? users : INITIAL_USERS;
    return <LoginPanel users={loginUsers} onLogin={handleLogin} />;
  }

  const userRole = user.role?.toLowerCase() || '';
  const isAdmin = userRole === 'admin' || userRole.includes('admin') || user.role === 'ADMIN_UTAMA' || user.role === 'Administrator' || user.role === 'Administrator Utama';

  // Responsive check: if accessed on HP / mobile screen, or forceViewMode is mobile
  const shouldShowMobileView =
    forceViewMode === 'mobile' || (forceViewMode === 'auto' && isMobileScreen);

  if (shouldShowMobileView) {
    return (
      <MobileAbsenKuHome
        currentUser={user}
        users={users.length > 0 ? users : INITIAL_USERS}
        records={records}
        geofenceConfig={geofenceConfig}
        onLogout={handleLogout}
        onRecordAttendance={(newRecord) => setRecords((prev) => [newRecord, ...prev])}
        onOpenDesktopView={() => setForceViewMode('desktop')}
        onNavigateTab={(tab, preset) => {
          if (preset) {
            setReportPreset(preset);
          }
          setAdminTab(tab as any);
          setForceViewMode('desktop');
        }}
      />
    );
  }

  if (isAdmin) {
    return (
      <MainLayout
        user={user}
        users={users.length > 0 ? users : INITIAL_USERS}
        records={records}
        onSelectUser={handleLogin}
        onLogout={handleLogout}
        activeTab={adminTab}
        onTabChange={setAdminTab}
        onSelectReportPreset={setReportPreset}
        geofenceConfig={geofenceConfig}
        onRecordAttendance={(newRecord) => setRecords((prev) => [newRecord, ...prev])}
        onSwitchToMobile={() => setForceViewMode('mobile')}
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
          reportPreset={reportPreset}
          onSelectReportPreset={setReportPreset}
        />
      </MainLayout>
    );
  }

  return (
    <StaffDashboard
      user={user}
      users={users.length > 0 ? users : INITIAL_USERS}
      records={records}
      onRefresh={handleRefresh}
      onLogout={handleLogout}
      geofenceConfig={geofenceConfig}
      onRecordAttendance={(newRecord) => setRecords((prev) => [newRecord, ...prev])}
    />
  );
}

export default App;