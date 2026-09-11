import React, { useState, useEffect } from 'react';
import { Clock, LogOut, Smartphone, Laptop, Monitor } from 'lucide-react';
import { LoginPanel } from './components/absenku/LoginPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { MainLayout } from './components/MainLayout';
import { MobileAbsenKuHome } from './components/absenku/MobileAbsenKuHome';
import { MobileStaffDashboard } from './components/absenku/MobileStaffDashboard';
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
  const [deviceMode, setDeviceMode] = useState<'auto' | 'mobile' | 'laptop'>('auto');
  const [screenIsMobile, setScreenIsMobile] = useState(false);

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
    if (typeof window === 'undefined') return;
    try {
      const savedMode = localStorage.getItem('device_view_mode') as 'auto' | 'mobile' | 'laptop';
      if (savedMode && ['auto', 'mobile', 'laptop'].includes(savedMode)) {
        setDeviceMode(savedMode);
      }
      const mediaQuery = window.matchMedia('(max-width: 768px)');
      setScreenIsMobile(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent | MediaQueryList) => setScreenIsMobile(e.matches);
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      } else if (typeof (mediaQuery as any).addListener === 'function') {
        (mediaQuery as any).addListener(handler);
        return () => (mediaQuery as any).removeListener(handler);
      }
    } catch (err) {
      console.warn('Media query init error:', err);
    }
  }, []);

  const isMobile = deviceMode === 'mobile' ? true : deviceMode === 'laptop' ? false : screenIsMobile;

  const handleSetDeviceMode = (mode: 'auto' | 'mobile' | 'laptop') => {
    setDeviceMode(mode);
    localStorage.setItem('device_view_mode', mode);
  };

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

    // Auto-polling data presensi setiap 4 detik agar admin & staf langsung tersinkronisasi
    const pollInterval = setInterval(() => {
      if (user) {
        fetchRecords();
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [user?.id]);

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

  const formatTimeSafe = (timeVal: any): string | undefined => {
    if (!timeVal) return undefined;
    if (typeof timeVal === 'string') {
      const match = timeVal.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}:${match[3] || '00'}`;
      }
      try {
        const d = new Date(timeVal);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        }
      } catch (e) {}
    } else if (timeVal instanceof Date && !isNaN(timeVal.getTime())) {
      return timeVal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
    return String(timeVal);
  };

  const formatDateSafe = (dateVal: any): string => {
    if (!dateVal) return new Date().toLocaleDateString('en-CA');
    if (typeof dateVal === 'string') {
      return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal.slice(0, 10);
    }
    if (dateVal instanceof Date) {
      const y = dateVal.getFullYear();
      const m = String(dateVal.getMonth() + 1).padStart(2, '0');
      const d = String(dateVal.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return String(dateVal);
  };

  const fetchRecords = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const seenIds = new Set<string>();
        const uniqueItems = data.data.filter((item: any) => {
          const idStr = String(item.id);
          if (seenIds.has(idStr)) return false;
          seenIds.add(idStr);
          return true;
        });

        const formatted = uniqueItems.map((item: any) => {
          const foundUser = users.find(u => 
            String(u.id) === String(item.user_id) || 
            (u.nip && item.nip && u.nip.trim() !== '-' && u.nip.trim() === item.nip.trim()) ||
            (u.name && item.user_name && u.name.toLowerCase().trim() === item.user_name.toLowerCase().trim())
          ) || null;

          const userName = foundUser?.name || item.user_name || 'Guru / Pegawai';
          const userNip = foundUser?.nip || item.nip || '-';
          const rawRole = (foundUser?.role || item.user_role || 'GURU').toUpperCase();
          const userRole = rawRole.includes('ADMIN') ? 'ADMIN' : rawRole.includes('PEGAWAI') ? 'PEGAWAI' : 'GURU';
          const avatar = foundUser?.avatarUrl || item.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0088cc&color=fff&size=40`;

          const checkInTimeStr = formatTimeSafe(item.check_in_time);
          const checkOutTimeStr = formatTimeSafe(item.check_out_time);

          let checkInStatus: 'TEPAT_WAKTU' | 'TERLAMBAT' | 'TERLAMBAT_DIIZINKAN' = 'TEPAT_WAKTU';
          if (item.status === 'terlambat' || item.status === 'TERLAMBAT') {
            checkInStatus = 'TERLAMBAT';
          } else if (
            item.status === 'AKTIF_TERLAMBAT' ||
            item.notes?.toLowerCase().includes('dispensasi') ||
            item.notes?.toLowerCase().includes('diaktifkan')
          ) {
            checkInStatus = 'TERLAMBAT_DIIZINKAN';
          } else if (checkInTimeStr) {
            const [h, m] = checkInTimeStr.split(':').map(Number);
            const [dh, dm] = (geofenceConfig?.checkInDeadlineTime || '07:15').split(':').map(Number);
            if (!isNaN(h) && !isNaN(m) && !isNaN(dh) && !isNaN(dm) && h * 60 + m > dh * 60 + dm) {
              checkInStatus = 'TERLAMBAT';
            }
          }

          return {
            id: item.id.toString(),
            userId: item.user_id.toString(),
            userName: userName,
            userRole: userRole,
            nip: userNip,
            date: formatDateSafe(item.attendance_date),
            checkInTime: checkInTimeStr,
            checkInLocation: {
              latitude: Number(item.check_in_lat) || 0,
              longitude: Number(item.check_in_lng) || 0,
              distanceMeters: 0,
            },
            checkInStatus: checkInStatus,
            checkInPhoto: item.check_in_photo_path || item.photo || avatar,
            checkOutTime: checkOutTimeStr,
            checkOutPhoto: item.check_out_photo_path || null,
            checkOutLocation: item.check_out_lat
              ? {
                  latitude: Number(item.check_out_lat),
                  longitude: Number(item.check_out_lng),
                  distanceMeters: 0,
                }
              : null,
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

  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      setTimeStr(`${now.toLocaleDateString('id-ID', options)} WITA`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

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
        if (user && String(user.id) === String(updatedUser.id)) {
          const merged = { ...user, ...updatedUser };
          setUser(merged);
          localStorage.setItem('user', JSON.stringify(merged));
        }
      } else {
        alert('❌ Gagal update: ' + (data.error || data.detail));
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

  const renderDeviceSwitcher = () => (
    <div className="fixed bottom-3 right-3 z-[9999] bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md text-white px-2.5 py-1.5 rounded-2xl shadow-xl border border-slate-700/80 flex items-center gap-1.5 text-[11px] select-none transition-all">
      <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">Mode:</span>
      <button
        type="button"
        onClick={() => handleSetDeviceMode('auto')}
        className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
          deviceMode === 'auto'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
        title={`Deteksi Otomatis Layar (Saat ini: ${screenIsMobile ? 'HP' : 'Laptop'})`}
      >
        <Monitor className="w-3 h-3" />
        <span>Auto ({screenIsMobile ? 'HP' : 'Laptop'})</span>
      </button>
      <button
        type="button"
        onClick={() => handleSetDeviceMode('mobile')}
        className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
          deviceMode === 'mobile'
            ? 'bg-sky-600 text-white shadow-xs'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
        title="Paksa Tampilan HP / Mobile"
      >
        <Smartphone className="w-3 h-3" />
        <span>HP</span>
      </button>
      <button
        type="button"
        onClick={() => handleSetDeviceMode('laptop')}
        className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
          deviceMode === 'laptop'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
        title="Paksa Tampilan Laptop / Desktop"
      >
        <Laptop className="w-3 h-3" />
        <span>Laptop</span>
      </button>
    </div>
  );

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
    return (
      <>
        <LoginPanel users={loginUsers} onLogin={handleLogin} />
        {renderDeviceSwitcher()}
      </>
    );
  }

  const userRole = user.role?.toLowerCase() || '';
  const isAdmin =
    userRole === 'admin' ||
    userRole.includes('admin') ||
    user.role === 'ADMIN_UTAMA' ||
    user.role === 'Administrator' ||
    user.role === 'Administrator Utama';

  const isForceMobile = isMobile;

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
          {renderDeviceSwitcher()}
        </div>
      );
    } else {
      return (
        <div className="relative min-h-screen bg-slate-100 flex flex-col">
          <MobileStaffDashboard
            user={user}
            records={records}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
            geofenceConfig={geofenceConfig}
          />
          {renderDeviceSwitcher()}
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
      >
        <AdminDashboard
          currentUser={user}
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
        {renderDeviceSwitcher()}
      </MainLayout>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-100 flex flex-col">
      {/* Top Bar Guru & Pegawai Khas AbsenKu (#0088cc) */}
      <div className="bg-[#0088cc] text-white px-4 py-2.5 flex items-center justify-between text-xs shadow-md border-b border-[#0077b5] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white shadow-xs border border-white/20">
            {user.role === 'GURU' ? 'GR' : 'PG'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider uppercase text-white">PORTAL GURU & PEGAWAI</span>
              <span className="bg-emerald-400 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                ONLINE
              </span>
            </div>
            <p className="text-[10px] text-white/80">TKK INVIOLATA RUTENG</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {timeStr && (
            <div className="hidden md:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl text-[11px] font-mono border border-white/15">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>{timeStr}</span>
            </div>
          )}

          {/* User Pill & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/20">
            <img
              src={
                user?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10B981&color=fff&size=36`
              }
              alt="Avatar"
              className="w-7 h-7 rounded-full border border-white object-cover shadow-2xs"
            />
            <div className="hidden sm:block leading-tight text-left">
              <span className="font-bold text-xs block">{user?.name}</span>
              <span className="text-[10px] text-white/70 block">
                {user.role === 'GURU' ? 'Tenaga Pendidik' : 'Pegawai Tata Usaha'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl bg-red-600/80 hover:bg-red-700 text-white transition ml-1 shadow-2xs"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
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
      {renderDeviceSwitcher()}
    </div>
  );
}

export default App;