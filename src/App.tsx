import React, { useState, useEffect } from 'react';
import { LoginPanel } from './components/absenku/LoginPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { MainLayout } from './components/MainLayout';
import { MobileAbsenKuHome } from './components/absenku/MobileAbsenKuHome';
import { MobileStaffDashboard } from './components/absenku/MobileStaffDashboard';
import { MobileAppMockup } from './components/absenku/MobileAppMockup';
import { User, AttendanceRecord, GeofenceConfig, AttendanceUnlockRequest } from './types';

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
  latitude: -8.61631,
  longitude: 120.463403,
  radiusMeters: 50,
  checkInStartTime: '06:30',
  checkInDeadlineTime: '07:15',
  checkOutStartTime: '12:30',
  checkOutDeadlineTime: '15:30',
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<
    'monitoring' | 'laporan' | 'pengguna' | 'geofence' | 'aktivasi_absen' | 'izin_tidak_masuk' | 'pengumuman' | 'profile'
  >('monitoring');
  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig>(DEFAULT_GEOFENCE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Dual Showcase State (Laptop di Belakang + HP di Depan seperti di gambar)
  const [viewMode, setViewMode] = useState<'showcase' | 'desktop' | 'mobile'>('showcase');
  const [showPhoneMockup, setShowPhoneMockup] = useState(true);

  // Unlock / Dispensasi Requests State
  const [unlockRequests, setUnlockRequests] = useState<AttendanceUnlockRequest[]>([
    {
      id: 'req-init-1',
      userId: '2',
      userName: 'Ibu Yuliana',
      userRole: 'GURU',
      requestTime: '07:22 WITA',
      attendanceType: 'MASUK',
      reason: 'Kendaraan motor mogok dalam perjalanan ke sekolah',
      status: 'APPROVED',
      adminNotes: 'Dispensasi disetujui oleh Sr. Maria. Silakan presensi.',
      respondedAt: '07:25 WITA',
    },
  ]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
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

          const checkInTimeStr = item.check_in_time
            ? new Date(item.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            : undefined;

          let checkInStatus: 'TEPAT_WAKTU' | 'TERLAMBAT' | 'TERLAMBAT_DIIZINKAN' = 'TEPAT_WAKTU';
          if (item.status === 'terlambat' || item.status === 'TERLAMBAT') {
            checkInStatus = 'TERLAMBAT';
          } else if (
            item.status === 'AKTIF_TERLAMBAT' ||
            item.notes?.toLowerCase().includes('dispensasi') ||
            item.notes?.toLowerCase().includes('diaktifkan')
          ) {
            checkInStatus = 'TERLAMBAT_DIIZINKAN';
          } else if (item.check_in_time) {
            const d = new Date(item.check_in_time);
            const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const [h, m] = timeStr.split(':').map(Number);
            const [dh, dm] = (geofenceConfig?.checkInDeadlineTime || '07:15').split(':').map(Number);
            if (h * 60 + m > dh * 60 + dm) {
              checkInStatus = 'TERLAMBAT';
            }
          }

          return {
            id: item.id.toString(),
            userId: item.user_id.toString(),
            userName: userName,
            userRole: userRole,
            nip: userNip,
            date: item.attendance_date.split('T')[0],
            checkInTime: checkInTimeStr,
            checkInLocation: {
              latitude: item.check_in_lat || 0,
              longitude: item.check_in_lng || 0,
              distanceMeters: 0,
            },
            checkInStatus: checkInStatus,
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

  const handleQuickSwitchUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleRequestUnlock = async (userId: string, reason: string, type: 'MASUK' | 'PULANG') => {
    const reqUser = users.find((u) => String(u.id) === String(userId)) || user;
    const newReq: AttendanceUnlockRequest = {
      id: `req-${Date.now()}`,
      userId: userId,
      userName: reqUser?.name || 'Staf',
      userRole: reqUser?.role || 'GURU',
      requestTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
      attendanceType: type,
      reason: reason,
      status: 'PENDING',
    };
    setUnlockRequests((prev) => [newReq, ...prev]);

    try {
      await fetch('/api/izin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_name: reqUser?.name || 'Staf',
          user_nip: reqUser?.nip || '1988000000000',
          type: type === 'MASUK' ? 'terlambat_masuk' : 'terlambat_pulang',
          reason: reason,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      await fetchRecords();
    } catch (err) {
      console.warn('Izin request sync fallback:', err);
    }
  };

  const handleRecordAttendanceFromMobile = async (newRec: AttendanceRecord) => {
    setRecords((prev) => [
      newRec,
      ...prev.filter((r) => !(r.userId === newRec.userId && r.date === newRec.date)),
    ]);
    await fetchRecords();
  };

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

  const userRole = user.role?.toLowerCase() || '';
  const isAdmin =
    userRole === 'admin' ||
    userRole.includes('admin') ||
    user.role === 'ADMIN_UTAMA' ||
    user.role === 'Administrator' ||
    user.role === 'Administrator Utama';

  const isForceMobile = viewMode === 'mobile' || isMobile;

  // Render Mobile Mockup element for Showcase (Gambar HP di depan seperti di gambar referensi)
  const mobileMockupElement = (
    <MobileAppMockup
      users={users.length > 0 ? users : DUMMY_USERS}
      currentUser={user}
      geofenceConfig={geofenceConfig}
      onRecordAttendance={handleRecordAttendanceFromMobile}
      unlockRequests={unlockRequests}
      onRequestUnlock={handleRequestUnlock}
      onClose={() => setShowPhoneMockup(false)}
    />
  );

  if (isForceMobile) {
    if (isAdmin) {
      return (
        <div className="relative min-h-screen bg-slate-900">
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
        </div>
      );
    } else {
      return (
        <div className="relative min-h-screen bg-slate-900">
          <MobileStaffDashboard
            user={user}
            records={records}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
            geofenceConfig={geofenceConfig}
          />
        </div>
      );
    }
  }

  if (isAdmin) {
    return (
      <MainLayout
        user={user}
        onLogout={handleLogout}
        activeTab={adminTab}
        onTabChange={setAdminTab}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        allUsers={users.length > 0 ? users : DUMMY_USERS}
        onQuickSwitchUser={handleQuickSwitchUser}
        mobileMockupElement={mobileMockupElement}
        showPhoneMockup={showPhoneMockup}
        onTogglePhoneMockup={() => setShowPhoneMockup(!showPhoneMockup)}
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
          onRefresh={handleRefresh}
        />
      </MainLayout>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar Guru & Pegawai dengan View Switcher & Akun Tester */}
      <div className="bg-[#0088cc] text-white px-4 py-2.5 flex items-center justify-between text-xs shadow-md border-b border-[#0077b5] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold tracking-wider uppercase">PORTAL GURU & PEGAWAI</span>
          <span className="bg-emerald-400 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
            TKK INVIOLATA RUTENG
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-[#0072aa] p-0.5 rounded-lg border border-white/20 text-xs">
            <button
              onClick={() => setViewMode('showcase')}
              className={`px-3 py-1 rounded-md font-bold transition ${
                viewMode === 'showcase' ? 'bg-white text-[#0088cc] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Showcase (Laptop + HP)
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-3 py-1 rounded-md font-bold transition ${
                viewMode === 'desktop' ? 'bg-white text-[#0088cc] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Laptop Saja
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1 rounded-md font-bold transition ${
                viewMode === 'mobile' ? 'bg-white text-[#0088cc] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              HP Saja
            </button>
          </div>
          {users.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#0072aa] px-2 py-1 rounded-lg border border-white/20">
              <span className="text-[10px] text-white/80 font-semibold">Simulasi Akun:</span>
              <select
                value={user.id}
                onChange={(e) => {
                  const f = users.find((u) => String(u.id) === e.target.value);
                  if (f) handleQuickSwitchUser(f);
                }}
                className="bg-white text-slate-800 text-[11px] font-bold rounded px-1.5 py-0.5 border-none outline-none cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <StaffDashboard
          user={user}
          records={records}
          onRefresh={handleRefresh}
          onLogout={handleLogout}
          geofenceConfig={geofenceConfig}
        />
      </div>

      {/* Floating Interactive Phone Mockup for Staff in Showcase Mode */}
      {viewMode === 'showcase' && showPhoneMockup && (
        <aside className="fixed right-6 bottom-4 z-40">
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-t-xl text-[11px] font-bold flex items-center justify-between border-t border-x border-slate-700 shadow-lg">
            <span>📱 Simulasi HP Guru/Pegawai</span>
            <button
              onClick={() => setShowPhoneMockup(false)}
              className="hover:text-red-400 p-0.5"
              title="Tutup HP"
            >
              ✕
            </button>
          </div>
          <div className="bg-slate-950 p-2 rounded-b-[40px] shadow-2xl border-b border-x border-slate-700 max-h-[85vh] overflow-y-auto">
            {mobileMockupElement}
          </div>
        </aside>
      )}
    </div>
  );
}

export default App;