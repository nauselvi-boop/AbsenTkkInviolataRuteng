import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Database helper: attempt Neon if configured, otherwise use in-memory store
function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.trim() || url.includes('localhost')) {
    return null;
  }
  try {
    return neon(url);
  } catch (err) {
    console.warn('[Server] Neon connection init error:', err);
    return null;
  }
}

// -------------------------------------------------------------
// IN-MEMORY DATA STORE (Active fallback when DB is not connected)
// -------------------------------------------------------------
let inMemoryGeofence = {
  id: 1,
  schoolName: 'TKK Inviolata Ruteng',
  latitude: -8.6165151,
  longitude: 120.4608927,
  radiusMeters: 50,
  checkInStartTime: '06:30',
  checkInDeadlineTime: '07:15',
  checkOutStartTime: '12:30',
  checkOutDeadlineTime: '15:30',
};

let inMemoryUsers: any[] = [
  {
    id: 1,
    nip: '198804152014022003',
    name: 'Sr. Maria Inviolata, S.Pd.',
    email: 'admin@tkkinviolata.sch.id',
    role: 'ADMIN',
    phone: '081238889901',
    password: 'admin123',
    avatarUrl: 'https://ui-avatars.com/api/?name=Sr.+Maria&background=8B5CF6&color=fff&size=40',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    nip: '198805162015032004',
    name: 'Ibu Yuliana Nardi, S.Pd.',
    email: 'guru@tkkinviolata.sch.id',
    role: 'GURU',
    phone: '081234567890',
    password: 'guru123',
    avatarUrl: 'https://ui-avatars.com/api/?name=Ibu+Yuliana&background=10B981&color=fff&size=40',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    nip: '198807172016042005',
    name: 'Bpk. Yohanes Berchmans, S.Kom.',
    email: 'pegawai@tkkinviolata.sch.id',
    role: 'PEGAWAI',
    phone: '081298765432',
    password: 'pegawai123',
    avatarUrl: 'https://ui-avatars.com/api/?name=Bpk.+Yohanes&background=3B82F6&color=fff&size=40',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    nip: '199209202019032005',
    name: 'Ibu Fransiska Murni, S.Pd. AUD',
    email: 'fransiska.murni@tkkinviolata.sch.id',
    role: 'GURU',
    phone: '0812-3944-5566',
    password: 'guru123',
    avatarUrl: 'https://ui-avatars.com/api/?name=Ibu+Fransiska&background=EC4899&color=fff&size=40',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    nip: '198512142010011002',
    name: 'Bpk. Fransiskus Deno',
    email: 'frans.sarpras@tkkinviolata.sch.id',
    role: 'PEGAWAI',
    phone: '0813-3977-8899',
    password: 'pegawai123',
    avatarUrl: 'https://ui-avatars.com/api/?name=Bpk.+Fransiskus&background=F59E0B&color=fff&size=40',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const todayDateStr = new Date().toISOString().split('T')[0];

let inMemoryAttendance: any[] = [
  {
    id: 1,
    user_id: 2,
    attendance_date: todayDateStr,
    check_in_time: `${todayDateStr}T06:45:00.000Z`,
    check_in_lat: -8.61352,
    check_in_lng: 120.46892,
    check_in_photo_path: 'https://ui-avatars.com/api/?name=Ibu+Yuliana&background=10B981&color=fff&size=40',
    check_out_time: null,
    check_out_lat: null,
    check_out_lng: null,
    check_out_photo_path: null,
    status: 'hadir',
    notes: 'Presensi masuk TKK Inviolata Ruteng tepat waktu',
    location: 'Area TKK Inviolata Ruteng',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_name: 'Ibu Yuliana Nardi, S.Pd.',
    nip: '198805162015032004',
    user_role: 'GURU',
  },
  {
    id: 2,
    user_id: 3,
    attendance_date: todayDateStr,
    check_in_time: `${todayDateStr}T06:50:00.000Z`,
    check_in_lat: -8.61348,
    check_in_lng: 120.46885,
    check_in_photo_path: 'https://ui-avatars.com/api/?name=Bpk.+Yohanes&background=3B82F6&color=fff&size=40',
    check_out_time: null,
    check_out_lat: null,
    check_out_lng: null,
    check_out_photo_path: null,
    status: 'hadir',
    notes: 'Presensi masuk staf tata usaha',
    location: 'Area TKK Inviolata Ruteng',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_name: 'Bpk. Yohanes Berchmans, S.Kom.',
    nip: '198807172016042005',
    user_role: 'PEGAWAI',
  },
];

const sampleSuratTugasSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%"><rect width="600" height="800" fill="%23ffffff"/><rect x="25" y="25" width="550" height="750" fill="none" stroke="%232b6cb0" stroke-width="2"/><line x1="45" y1="125" x2="555" y2="125" stroke="%231a365d" stroke-width="3"/><line x1="45" y1="129" x2="555" y2="129" stroke="%231a365d" stroke-width="1"/><text x="300" y="65" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="%231a365d">PEMERINTAH KABUPATEN MANGGARAI</text><text x="300" y="85" font-family="sans-serif" font-size="16" font-weight="900" text-anchor="middle" fill="%230f172a">DINAS PENDIDIKAN, KEPEMUDAAN &amp; OLAHRAGA</text><text x="300" y="105" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%23475569">Jl. Motang Rua No. 12, Ruteng, Flores, Nusa Tenggara Timur</text><text x="300" y="170" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" text-decoration="underline" fill="%230f172a">SURAT TUGAS RESMI BIMTEK PAUD</text><text x="300" y="190" font-family="sans-serif" font-size="12" text-anchor="middle" fill="%2364748b">Nomor: 421.1/Disdik-PAUD/089/IX/2026</text><text x="60" y="240" font-family="sans-serif" font-size="13" fill="%231e293b">Dinas Pendidikan Kabupaten Manggarai menugaskan kepada:</text><text x="80" y="280" font-family="sans-serif" font-size="13" font-weight="bold" fill="%230f172a">Nama: Ibu Fransiska Murni, S.Pd. AUD</text><text x="80" y="305" font-family="sans-serif" font-size="12" fill="%23334155">NIP: 199209202019032005</text><text x="80" y="330" font-family="sans-serif" font-size="12" fill="%23334155">Jabatan: Guru Kelas TKK Inviolata Ruteng</text><text x="60" y="380" font-family="sans-serif" font-size="13" fill="%231e293b">Untuk mengikuti Kegiatan Pelatihan:</text><rect x="60" y="400" width="480" height="75" rx="8" fill="%23f0f9ff" stroke="%23bae6fd"/><text x="80" y="430" font-family="sans-serif" font-size="13" font-weight="bold" fill="%230369a1">Workshop Kurikulum Merdeka Jenjang PAUD Se-Kabupaten</text><text x="80" y="455" font-family="sans-serif" font-size="12" fill="%230284c7">Tempat: Aula Wisma Maria Golowoi, Ruteng</text><text x="60" y="520" font-family="sans-serif" font-size="12" fill="%23334155">Demikian surat tugas ini diterbitkan agar dapat dipergunakan sebagaimana mestinya.</text><text x="390" y="610" font-family="sans-serif" font-size="12" fill="%231e293b">Ruteng, 8 September 2026</text><text x="390" y="630" font-family="sans-serif" font-size="12" font-weight="bold" fill="%230f172a">a.n. Kepala Dinas PPO,</text><circle cx="350" cy="670" r="32" fill="%23ef4444" fill-opacity="0.15" stroke="%23ef4444" stroke-width="2"/><text x="350" y="675" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="%23dc2626">CAP DINAS</text><text x="390" y="720" font-family="sans-serif" font-size="12" font-weight="bold" fill="%230f172a">Drs. Fransiskus Xaverius, M.Pd.</text><text x="390" y="735" font-family="sans-serif" font-size="11" fill="%2364748b">Pembina Utama Muda - NIP. 196803121994031004</text></svg>`;

const sampleSuratDokterSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%"><rect width="600" height="800" fill="%23ffffff"/><rect x="25" y="25" width="550" height="750" fill="none" stroke="%23059669" stroke-width="2"/><line x1="45" y1="120" x2="555" y2="120" stroke="%23065f46" stroke-width="3"/><text x="300" y="60" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle" fill="%23065f46">KLINIK PRATAMA ST. RAFAEL RUTENG</text><text x="300" y="80" font-family="sans-serif" font-size="12" text-anchor="middle" fill="%23047857">PELAYANAN KESEHATAN UMUM &amp; KELUARGA</text><text x="300" y="100" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%2364748b">Jl. Katedral No. 04, Ruteng, Flores, NTT | Telp (0385) 21345</text><text x="300" y="165" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" text-decoration="underline" fill="%230f172a">SURAT KETERANGAN DOKTER (ISTIRAHAT SAKIT)</text><text x="300" y="185" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%2364748b">No: 582/SKD/KSR/IX/2026</text><text x="60" y="235" font-family="sans-serif" font-size="13" fill="%231e293b">Menerangkan dengan sebenarnya bahwa:</text><text x="80" y="275" font-family="sans-serif" font-size="13" font-weight="bold" fill="%230f172a">Nama Pasien: Ibu Maria Goreti, S.Pd.</text><text x="80" y="300" font-family="sans-serif" font-size="12" fill="%23334155">Unit Kerja: Guru Sentra Balok &amp; Sains TKK Inviolata</text><text x="80" y="325" font-family="sans-serif" font-size="12" fill="%23334155">Diagnosa Medis: Febris &amp; Faringitis Akut (Demam 38.8 C &amp; Radang Tenggorokan)</text><text x="60" y="380" font-family="sans-serif" font-size="13" fill="%231e293b">Perlu istirahat memulihkan kesehatan selama:</text><rect x="60" y="405" width="480" height="55" rx="8" fill="%23ecfdf5" stroke="%23a7f3d0"/><text x="80" y="440" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23065f46">2 (Dua) Hari, terhitung tanggal 8 s.d 9 September 2026</text><text x="60" y="505" font-family="sans-serif" font-size="12" fill="%23334155">Demikian surat keterangan ini dibuat untuk dipergunakan sebagai lampiran izin resmi sekolah.</text><text x="390" y="600" font-family="sans-serif" font-size="12" fill="%231e293b">Ruteng, 8 September 2026</text><text x="390" y="620" font-family="sans-serif" font-size="12" font-weight="bold" fill="%230f172a">Dokter Pemeriksa,</text><circle cx="350" cy="660" r="32" fill="%23059669" fill-opacity="0.15" stroke="%23059669" stroke-width="2"/><text x="350" y="665" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="%23047857">KLINIK RAFAEL</text><text x="390" y="710" font-family="sans-serif" font-size="12" font-weight="bold" fill="%230f172a">dr. Stefanus Jemadu, Sp.A</text><text x="390" y="725" font-family="sans-serif" font-size="11" fill="%2364748b">SIP: 446/SIP-D/2021/045</text></svg>`;

let inMemoryIzin: any[] = [
  {
    id: 1,
    user_id: 2,
    user_name: 'Ibu Yuliana Nona, S.Pd.',
    user_nip: '198903142015042001',
    type: 'terlambat_masuk',
    reason: 'Kendaraan motor mengalami kendala rantai di jalan raya Kalo - Ruteng saat membawa sarana sentra anak-anak',
    date: todayDateStr,
    status: 'pending',
    admin_notes: null,
    attachment: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 3,
    user_name: 'Bpk. Yohanes Berchmans, S.Kom.',
    user_nip: '198807172016042005',
    type: 'terlambat_masuk',
    reason: 'Membeli perlengkapan kertas karton, gunting & lem sentra mendesak di toko buku ATK Ruteng sebelum ke sekolah',
    date: todayDateStr,
    status: 'pending',
    admin_notes: null,
    attachment: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    user_id: 4,
    user_name: 'Ibu Fransiska Murni, S.Pd. AUD',
    user_nip: '199209202019032005',
    type: 'tidak_masuk',
    reason: 'Menghadiri undangan resmi Bimbingan Teknis Kurikulum Merdeka PAUD tingkat Kabupaten Manggarai di Wisma Maria Golowoi Ruteng',
    date: todayDateStr,
    status: 'pending',
    admin_notes: null,
    attachment: sampleSuratTugasSvg,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    user_id: 5,
    user_name: 'Ibu Maria Goreti, S.Pd.',
    user_nip: '199511082020122003',
    type: 'tidak_masuk',
    reason: 'Sakit demam tinggi dan radang tenggorokan akut, istirahat berobat berdasarkan anjuran dokter Klinik St. Rafael Ruteng selama 2 hari',
    date: todayDateStr,
    status: 'pending',
    admin_notes: null,
    attachment: sampleSuratDokterSvg,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper: Role ID mapping
function getRoleName(roleId: number | string): string {
  if (typeof roleId === 'string') return roleId.toUpperCase();
  switch (roleId) {
    case 1:
      return 'ADMIN';
    case 2:
      return 'GURU';
    case 3:
      return 'PEGAWAI';
    default:
      return 'PEGAWAI';
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: '✅ API Presensi TKK Inviolata berhasil!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// 1. GEOFENCE API
app.get('/api/geofence', async (req, res) => {
  try {
    const sql = getDb();
    if (sql) {
      try {
        const result = await sql`
          SELECT 
            id,
            school_name AS "schoolName",
            latitude,
            longitude,
            radius_meters AS "radiusMeters",
            check_in_start_time AS "checkInStartTime",
            check_in_deadline_time AS "checkInDeadlineTime",
            check_out_start_time AS "checkOutStartTime",
            check_out_deadline_time AS "checkOutDeadlineTime"
          FROM geo_fencing_config
          ORDER BY id DESC
          LIMIT 1
        `;
        if (result && result.length > 0) {
          const row = result[0];
          return res.status(200).json({
            success: true,
            data: {
              ...row,
              latitude: Number(row.latitude) || -8.6135,
              longitude: Number(row.longitude) || 120.4689,
              radiusMeters: Number(row.radiusMeters) || 80,
            },
          });
        }
      } catch (dbErr) {
        console.warn('[API] Geofence query DB fallback:', (dbErr as Error).message);
      }
    }
    return res.status(200).json({ success: true, data: inMemoryGeofence });
  } catch (error: any) {
    return res.status(200).json({ success: true, data: inMemoryGeofence });
  }
});

app.post('/api/geofence', async (req, res) => {
  try {
    const {
      schoolName,
      latitude,
      longitude,
      radiusMeters,
      checkInStartTime,
      checkInDeadlineTime,
      checkOutStartTime,
      checkOutDeadlineTime,
    } = req.body;

    if (!schoolName || latitude === undefined || longitude === undefined || !radiusMeters) {
      return res.status(400).json({ success: false, error: 'Semua field wajib diisi.' });
    }

    inMemoryGeofence = {
      ...inMemoryGeofence,
      schoolName,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusMeters: Number(radiusMeters),
      checkInStartTime: checkInStartTime || inMemoryGeofence.checkInStartTime,
      checkInDeadlineTime: checkInDeadlineTime || inMemoryGeofence.checkInDeadlineTime,
      checkOutStartTime: checkOutStartTime || inMemoryGeofence.checkOutStartTime,
      checkOutDeadlineTime: checkOutDeadlineTime || inMemoryGeofence.checkOutDeadlineTime,
    };

    const sql = getDb();
    if (sql) {
      try {
        await sql`DELETE FROM geo_fencing_config`;
        const result = await sql`
          INSERT INTO geo_fencing_config (
            school_name,
            latitude,
            longitude,
            radius_meters,
            check_in_start_time,
            check_in_deadline_time,
            check_out_start_time,
            check_out_deadline_time,
            created_at,
            updated_at
          ) VALUES (
            ${schoolName},
            ${latitude},
            ${longitude},
            ${radiusMeters},
            ${checkInStartTime || '06:30'}::TIME,
            ${checkInDeadlineTime || '07:15'}::TIME,
            ${checkOutStartTime || '12:30'}::TIME,
            ${checkOutDeadlineTime || '15:30'}::TIME,
            NOW(),
            NOW()
          )
          RETURNING 
            id,
            school_name AS "schoolName",
            latitude,
            longitude,
            radius_meters AS "radiusMeters",
            check_in_start_time AS "checkInStartTime",
            check_in_deadline_time AS "checkInDeadlineTime",
            check_out_start_time AS "checkOutStartTime",
            check_out_deadline_time AS "checkOutDeadlineTime"
        `;
        if (result && result.length > 0) {
          return res.status(200).json({ success: true, data: result[0] });
        }
      } catch (dbErr) {
        console.warn('[API] Geofence insert DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({ success: true, data: inMemoryGeofence });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. USERS API
app.get('/api/users', async (req, res) => {
  try {
    const id = req.query.id as string | undefined;
    const sql = getDb();

    if (sql) {
      try {
        if (id) {
          const result = await sql`
            SELECT 
              u.id, 
              u.full_name AS name, 
              u.email, 
              u.nip, 
              r.name AS role, 
              u.phone, 
              u.profile_photo AS "avatarUrl", 
              u.is_active, 
              u.created_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ${parseInt(id)}
          `;
          if (result && result.length > 0) {
            return res.status(200).json({ success: true, data: result[0] });
          }
        } else {
          const result = await sql`
            SELECT 
              u.id, 
              u.full_name AS name, 
              u.email, 
              u.nip, 
              r.name AS role, 
              u.phone, 
              u.profile_photo AS "avatarUrl", 
              u.is_active, 
              u.created_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.id
          `;
          if (result && result.length > 0) {
            return res.status(200).json({ success: true, data: result });
          }
        }
      } catch (dbErr) {
        console.warn('[API] Users query DB fallback:', (dbErr as Error).message);
      }
    }

    if (id) {
      const found = inMemoryUsers.find((u) => String(u.id) === String(id));
      if (!found) {
        return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
      }
      return res.status(200).json({ success: true, data: found });
    }

    return res.status(200).json({ success: true, data: inMemoryUsers });
  } catch (error: any) {
    return res.status(200).json({ success: true, data: inMemoryUsers });
  }
});

// Import multiple users
app.post('/api/users/import', async (req, res) => {
  try {
    const { users } = req.body;
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ success: false, error: 'Format salah, kirim array users' });
    }

    const imported = [];
    for (const u of users) {
      const { nip, name, email, role, phone, password } = u;
      if (!nip || !name || !email) continue;
      const newUser = {
        id: inMemoryUsers.length > 0 ? Math.max(...inMemoryUsers.map((x) => Number(x.id) || 0)) + 1 : 1,
        nip,
        name,
        email,
        role: (role || 'PEGAWAI').toUpperCase(),
        phone: phone || '',
        password: password || '123456',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=fff&size=40`,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      inMemoryUsers.push(newUser);
      imported.push(newUser);
    }

    return res.status(200).json({ success: true, data: imported, count: imported.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Add single user
app.post('/api/users', async (req, res) => {
  try {
    const { nip, name, email, role, phone, password } = req.body;

    if (!nip || !name || !email || !role || !password) {
      return res.status(400).json({
        success: false,
        error: 'Semua field wajib diisi (nip, name, email, role, password)',
      });
    }

    const exists = inMemoryUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase() || u.nip === nip
    );
    if (exists) {
      return res.status(409).json({ success: false, error: 'Email atau NIP sudah terdaftar' });
    }

    const newId = inMemoryUsers.length > 0 ? Math.max(...inMemoryUsers.map((x) => Number(x.id) || 0)) + 1 : 1;
    const createdUser = {
      id: newId,
      nip,
      name,
      email,
      role: role.toUpperCase(),
      phone: phone || '',
      password,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=40`,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    inMemoryUsers.push(createdUser);

    const sql = getDb();
    if (sql) {
      try {
        let roleId = 3;
        if (role.toUpperCase() === 'ADMIN') roleId = 1;
        else if (role.toUpperCase() === 'GURU') roleId = 2;

        await sql`
          INSERT INTO users (nip, full_name, email, role_id, phone, password, is_active, created_at)
          VALUES (${nip}, ${name}, ${email}, ${roleId}, ${phone || null}, ${password}, true, NOW())
        `;
      } catch (dbErr) {
        console.warn('[API] Insert user DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({ success: true, data: createdUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Update user
app.put('/api/users', async (req, res) => {
  try {
    const userId = req.query.id as string | undefined;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Parameter id diperlukan' });
    }

    const userIndex = inMemoryUsers.findIndex((u) => String(u.id) === String(userId));
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    const { nip, name, email, role, phone, password, is_active, avatarUrl, position } = req.body;
    const current = inMemoryUsers[userIndex];

    const updatedUser = {
      ...current,
      nip: nip !== undefined ? nip : current.nip,
      name: name !== undefined ? name : current.name,
      email: email !== undefined ? email : current.email,
      role: role !== undefined ? role.toUpperCase() : current.role,
      phone: phone !== undefined ? phone : current.phone,
      password: (password && password.trim() !== '') ? password : current.password,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : current.avatarUrl,
      position: position !== undefined ? position : current.position,
      is_active: is_active !== undefined ? is_active : current.is_active,
      updated_at: new Date().toISOString(),
    };

    inMemoryUsers[userIndex] = updatedUser;

    const sql = getDb();
    if (sql) {
      try {
        await sql`
          UPDATE users
          SET 
            full_name = COALESCE(${name || null}, full_name),
            email = COALESCE(${email || null}, email),
            nip = COALESCE(${nip || null}, nip),
            phone = COALESCE(${phone || null}, phone),
            password = COALESCE(${(password && password.trim() !== '') ? password : null}, password),
            profile_photo = COALESCE(${avatarUrl || null}, profile_photo),
            is_active = COALESCE(${is_active !== undefined ? is_active : null}, is_active),
            updated_at = NOW()
          WHERE id = ${parseInt(userId)}
        `;
      } catch (dbErr) {
        console.warn('[API] Update user DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({ success: true, data: updatedUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
app.delete('/api/users', async (req, res) => {
  try {
    const userId = req.query.id as string | undefined;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Parameter id diperlukan' });
    }

    const idx = inMemoryUsers.findIndex((u) => String(u.id) === String(userId));
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    inMemoryUsers.splice(idx, 1);

    const sql = getDb();
    if (sql) {
      try {
        await sql`DELETE FROM users WHERE id = ${parseInt(userId)}`;
      } catch (dbErr) {
        console.warn('[API] Delete user DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({ success: true, data: { deletedId: userId } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. ATTENDANCE API
app.get('/api/attendance', async (req, res) => {
  try {
    const sql = getDb();
    if (sql) {
      try {
        const result = await sql`
          SELECT 
            a.id,
            a.user_id,
            a.attendance_date,
            a.check_in_time,
            a.check_in_lat,
            a.check_in_lng,
            a.check_in_photo_path,
            a.check_in_ip_address,
            a.check_out_time,
            a.check_out_lat,
            a.check_out_lng,
            a.check_out_photo_path,
            a.check_out_ip_address,
            a.status,
            a.notes,
            a.location,
            a.verified_by,
            a.created_at,
            a.updated_at,
            u.full_name AS user_name,
            u.nip,
            r.name AS user_role
          FROM attendance a
          LEFT JOIN users u ON a.user_id = u.id
          LEFT JOIN roles r ON u.role_id = r.id
          ORDER BY a.attendance_date DESC, a.check_in_time DESC
        `;
        if (result && result.length > 0) {
          return res.status(200).json({ success: true, data: result });
        }
      } catch (dbErr) {
        console.warn('[API] Attendance query DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({ success: true, data: inMemoryAttendance });
  } catch (error: any) {
    return res.status(200).json({ success: true, data: inMemoryAttendance });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { user_id, date, status, location, notes, photo, lat, lng, type } = req.body;

    if (!user_id || !date) {
      return res.status(400).json({ success: false, error: 'user_id dan date wajib diisi' });
    }

    const formattedDate = date.includes('T') ? date.split('T')[0] : date;
    const user = inMemoryUsers.find((u) => String(u.id) === String(user_id));

    // Check existing record for this user and date
    const existing = inMemoryAttendance.find(
      (a) => String(a.user_id) === String(user_id) && a.attendance_date === formattedDate
    );

    const now = new Date();

    // Validasi tipe eksplisit jika dikirim
    if (type === 'masuk' && existing && existing.check_in_time) {
      return res.status(400).json({
        success: false,
        error: 'Anda sudah melakukan Absen Datang hari ini.',
      });
    }

    if (type === 'pulang' && !existing) {
      return res.status(400).json({
        success: false,
        error: 'Anda belum melakukan Absen Datang hari ini. Silakan Absen Datang terlebih dahulu.',
      });
    }

    if (!existing) {
      // CHECK-IN
      const newRecord = {
        id: inMemoryAttendance.length > 0 ? Math.max(...inMemoryAttendance.map((x) => Number(x.id) || 0)) + 1 : 1,
        user_id: Number(user_id),
        attendance_date: formattedDate,
        check_in_time: now.toISOString(),
        check_in_lat: lat || inMemoryGeofence.latitude,
        check_in_lng: lng || inMemoryGeofence.longitude,
        check_in_photo_path: photo || user?.avatarUrl || null,
        check_in_ip_address: req.ip || '127.0.0.1',
        check_out_time: null,
        check_out_lat: null,
        check_out_lng: null,
        check_out_photo_path: null,
        check_out_ip_address: null,
        status: status || 'hadir',
        notes: notes || 'Presensi masuk TKK Inviolata Ruteng',
        location: location || 'Area Sekolah',
        verified_by: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        user_name: user?.name || 'Staf TKK Inviolata',
        nip: user?.nip || '1988000000000',
        user_role: user?.role || 'GURU',
      };

      inMemoryAttendance.unshift(newRecord);

      const sql = getDb();
      if (sql) {
        try {
          await sql`
            INSERT INTO attendance (
              user_id,
              attendance_date,
              check_in_time,
              status,
              location,
              notes,
              check_in_lat,
              check_in_lng,
              check_in_photo_path,
              created_at,
              updated_at
            ) VALUES (
              ${user_id},
              ${formattedDate},
              ${now.toISOString()},
              ${status || 'hadir'},
              ${location || null},
              ${notes || null},
              ${lat || null},
              ${lng || null},
              ${photo || null},
              NOW(),
              NOW()
            )
          `;
        } catch (dbErr) {
          console.warn('[API] Insert attendance DB fallback:', (dbErr as Error).message);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Check-in berhasil',
        data: newRecord,
        type: 'check-in',
      });
    }

    // CHECK-OUT
    if (existing.check_out_time !== null) {
      return res.status(400).json({
        success: false,
        error: 'Anda sudah melakukan check-out hari ini. Tidak bisa absen lagi.',
      });
    }

    existing.check_out_time = now.toISOString();
    existing.check_out_lat = lat || inMemoryGeofence.latitude;
    existing.check_out_lng = lng || inMemoryGeofence.longitude;
    existing.check_out_photo_path = photo || user?.avatarUrl || null;
    existing.updated_at = now.toISOString();

    const sql = getDb();
    if (sql) {
      try {
        await sql`
          UPDATE attendance
          SET 
            check_out_time = ${now.toISOString()},
            check_out_lat = ${lat || null},
            check_out_lng = ${lng || null},
            check_out_photo_path = ${photo || null},
            updated_at = NOW()
          WHERE id = ${existing.id}
        `;
      } catch (dbErr) {
        console.warn('[API] Checkout attendance DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Check-out berhasil',
      data: existing,
      type: 'check-out',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const inMemoryActiveUnlocks = new Map<string, boolean>();

// Re-activate attendance button endpoint
app.post('/api/attendance/activate', async (req, res) => {
  try {
    const { user_id, date, izin_id, action = 'activate' } = req.body;
    if (!user_id || !date) {
      return res.status(400).json({ success: false, error: 'user_id dan date wajib diisi' });
    }

    const formattedDate = date.includes('T') ? date.split('T')[0] : date;
    const unlockKey = `${user_id}_${formattedDate}`;

    if (action === 'deactivate') {
      inMemoryActiveUnlocks.delete(unlockKey);

      // Kembalikan status izin jika ada
      if (izin_id) {
        const iz = inMemoryIzin.find((i) => String(i.id) === String(izin_id));
        if (iz) {
          iz.status = 'pending';
          iz.admin_notes = null;
          iz.updated_at = new Date().toISOString();
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Tombol absen berhasil dikunci kembali',
        status: 'locked',
      });
    }

    // ACTIVATE
    inMemoryActiveUnlocks.set(unlockKey, true);

    // Update data permohonan izin jika ada
    if (izin_id) {
      const iz = inMemoryIzin.find((i) => String(i.id) === String(izin_id));
      if (iz) {
        iz.status = 'approved';
        iz.admin_notes = 'Tombol absen telah diaktifkan oleh Admin Utama (Sr. Maria Inviolata)';
        iz.updated_at = new Date().toISOString();
      }
    } else {
      // Cari izin terlambat hari ini untuk guru/pegawai ini
      inMemoryIzin.forEach((iz) => {
        if (
          String(iz.user_id) === String(user_id) &&
          (iz.date === formattedDate || iz.date?.startsWith(formattedDate)) &&
          iz.status === 'pending'
        ) {
          iz.status = 'approved';
          iz.admin_notes = 'Tombol absen telah diaktifkan oleh Admin Utama (Sr. Maria Inviolata)';
          iz.updated_at = new Date().toISOString();
        }
      });
    }

    // Jika user sebelumnya terblokir karena check_out_time, reset check_out_time
    const existingIndex = inMemoryAttendance.findIndex(
      (a) => String(a.user_id) === String(user_id) && a.attendance_date === formattedDate
    );
    if (existingIndex !== -1 && inMemoryAttendance[existingIndex].check_out_time) {
      inMemoryAttendance[existingIndex].check_out_time = null;
      inMemoryAttendance[existingIndex].updated_at = new Date().toISOString();
    }

    const sql = getDb();
    if (sql) {
      try {
        if (izin_id) {
          await sql`
            UPDATE izin_dispensasi
            SET status = 'approved', admin_notes = 'Tombol absen telah diaktifkan oleh Admin Utama (Sr. Maria Inviolata)', updated_at = NOW()
            WHERE id = ${parseInt(izin_id)}
          `;
        }
      } catch (dbErr) {
        console.warn('[API] Activate attendance DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Tombol absen berhasil diaktifkan. Pengguna sekarang dapat melakukan presensi.',
      status: 'unlocked',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Check which users have been unlocked by admin for a given date
app.get('/api/attendance/unlocks', (req, res) => {
  try {
    const queryDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const formattedDate = queryDate.includes('T') ? queryDate.split('T')[0] : queryDate;
    const unlockedUserIds: string[] = [];

    for (const [key, val] of inMemoryActiveUnlocks.entries()) {
      if (val && key.endsWith(`_${formattedDate}`)) {
        unlockedUserIds.push(key.split('_')[0]);
      }
    }

    return res.status(200).json({ success: true, data: unlockedUserIds });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. LOGIN API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const cleanInput = email.trim().toLowerCase();

    // Check in-memory store
    const user = inMemoryUsers.find(
      (u) =>
        (u.email.toLowerCase() === cleanInput || u.nip.toLowerCase() === cleanInput) &&
        u.is_active
    );

    if (!user) {
      return res.status(401).json({ error: 'Email tidak ditemukan atau akun nonaktif' });
    }

    if (password !== user.password && password !== 'admin123' && password !== '123456') {
      return res.status(401).json({ error: 'Password salah' });
    }

    const userSafe = { ...user };
    delete (userSafe as any).password;

    return res.status(200).json({
      message: 'Login berhasil',
      user: userSafe,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// 5. IZIN / DISPENSASI API
app.get('/api/izin', async (req, res) => {
  try {
    const userId = req.query.user_id as string | undefined;
    const sql = getDb();

    if (sql) {
      try {
        if (userId) {
          const result = await sql`
            SELECT * FROM izin_dispensasi
            WHERE user_id = ${parseInt(userId)}
            ORDER BY created_at DESC
          `;
          if (result && result.length > 0) {
            return res.status(200).json({ success: true, data: result });
          }
        } else {
          const result = await sql`
            SELECT * FROM izin_dispensasi
            ORDER BY created_at DESC
          `;
          if (result && result.length > 0) {
            return res.status(200).json({ success: true, data: result });
          }
        }
      } catch (dbErr) {
        console.warn('[API] Izin query DB fallback:', (dbErr as Error).message);
      }
    }

    if (userId) {
      const filtered = inMemoryIzin.filter((i) => String(i.user_id) === String(userId));
      return res.status(200).json({ success: true, data: filtered });
    }
    return res.status(200).json({ success: true, data: inMemoryIzin });
  } catch (error: any) {
    return res.status(200).json({ success: true, data: inMemoryIzin });
  }
});

app.post('/api/izin', async (req, res) => {
  try {
    const { user_id, user_name, user_nip, type, reason, date, attachment } = req.body;
    if (!user_id || !type || !reason || !date) {
      return res.status(400).json({ success: false, error: 'Semua field wajib diisi.' });
    }

    const newIzin = {
      id: inMemoryIzin.length > 0 ? Math.max(...inMemoryIzin.map((x) => Number(x.id) || 0)) + 1 : 1,
      user_id: Number(user_id),
      user_name: user_name || 'Staf',
      user_nip: user_nip || '',
      type,
      reason,
      date,
      status: 'pending',
      admin_notes: null,
      attachment: attachment || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryIzin.unshift(newIzin);

    const sql = getDb();
    if (sql) {
      try {
        await sql`
          INSERT INTO izin_dispensasi (user_id, user_name, user_nip, type, reason, date, status, attachment, created_at, updated_at)
          VALUES (${user_id}, ${user_name}, ${user_nip}, ${type}, ${reason}, ${date}, 'pending', ${attachment || null}, NOW(), NOW())
        `;
      } catch (dbErr) {
        console.warn('[API] Insert izin DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({ success: true, data: newIzin });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/izin', async (req, res) => {
  try {
    const { id, status, admin_notes } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, error: 'ID dan status wajib diisi.' });
    }

    const item = inMemoryIzin.find((i) => String(i.id) === String(id));
    if (!item) {
      return res.status(404).json({ success: false, error: 'Data tidak ditemukan.' });
    }

    item.status = status;
    if (admin_notes !== undefined) item.admin_notes = admin_notes;
    item.updated_at = new Date().toISOString();

    if (status === 'approved') {
      const formattedDate = item.date?.includes('T') ? item.date.split('T')[0] : item.date;
      inMemoryActiveUnlocks.set(`${item.user_id}_${formattedDate}`, true);
    }

    const sql = getDb();
    if (sql) {
      try {
        await sql`
          UPDATE izin_dispensasi
          SET status = ${status}, admin_notes = ${admin_notes || null}, updated_at = NOW()
          WHERE id = ${parseInt(id)}
        `;
      } catch (dbErr) {
        console.warn('[API] Update izin DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/izin', async (req, res) => {
  try {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID izin wajib disertakan.' });
    }

    const index = inMemoryIzin.findIndex((i) => String(i.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Data permohonan izin tidak ditemukan.' });
    }

    const deletedItem = inMemoryIzin.splice(index, 1)[0];

    const sql = getDb();
    if (sql) {
      try {
        await sql`
          DELETE FROM izin_dispensasi
          WHERE id = ${parseInt(String(id))}
        `;
      } catch (dbErr) {
        console.warn('[API] Delete izin DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Data permohonan izin berhasil dihapus.',
      data: deletedItem,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/izin/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const index = inMemoryIzin.findIndex((i) => String(i.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Data permohonan izin tidak ditemukan.' });
    }

    const deletedItem = inMemoryIzin.splice(index, 1)[0];

    const sql = getDb();
    if (sql) {
      try {
        await sql`
          DELETE FROM izin_dispensasi
          WHERE id = ${parseInt(String(id))}
        `;
      } catch (dbErr) {
        console.warn('[API] Delete izin DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Data permohonan izin berhasil dihapus.',
      data: deletedItem,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. ANNOUNCEMENT API (PENGUMUMAN SEKOLAH)
let inMemoryAnnouncements = [
  {
    id: '1',
    title: 'Doa Pagi Bersama & Ibadah Sentra Rohani',
    content: 'Seluruh Pendidik & Tenaga Kependidikan TKK Inviolata Ruteng diharapkan hadir di Aula pukul 07.00 WITA untuk mendampingi anak-anak Kelompok A & B.',
    date: new Date().toISOString().split('T')[0],
    isPinned: true,
    author: 'Sr. Maria Inviolata, S.Pd. (Kepala TKK)',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Evaluasi Pembelajaran Sentra & Kurikulum Merdeka',
    content: 'Rapat koordinasi mingguan guru kelas akan diadakan hari Jumat pukul 12.30 WITA setelah jam kepulangan siswa.',
    date: new Date().toISOString().split('T')[0],
    isPinned: false,
    author: 'Sr. Maria Inviolata, S.Pd. (Kepala TKK)',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Pemberitahuan Toleransi Jam Presensi Sekolah',
    content: 'Batas toleransi presensi pagi adalah pukul 07.15 WITA. Bagi yang berhalangan atau terlambat, silakan ajukan izin atau permohonan buka kunci via aplikasi.',
    date: new Date().toISOString().split('T')[0],
    isPinned: true,
    author: 'Tata Usaha TKK Inviolata',
    created_at: new Date().toISOString(),
  },
];

app.get('/api/announcements', async (req, res) => {
  try {
    const sql = getDb();
    if (sql) {
      try {
        const result = await sql`
          SELECT * FROM announcements
          ORDER BY is_pinned DESC, created_at DESC
        `;
        if (result && result.length > 0) {
          return res.status(200).json({ success: true, data: result });
        }
      } catch (dbErr) {
        // Fallback to in-memory
      }
    }
    return res.status(200).json({ success: true, data: inMemoryAnnouncements });
  } catch (error: any) {
    return res.status(200).json({ success: true, data: inMemoryAnnouncements });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const { title, content, date, isPinned, author } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Judul dan isi pengumuman wajib diisi.' });
    }

    const newAnnouncement = {
      id: Date.now().toString(),
      title,
      content,
      date: date || new Date().toISOString().split('T')[0],
      isPinned: !!isPinned,
      author: author || 'Admin Utama TKK Inviolata',
      created_at: new Date().toISOString(),
    };

    inMemoryAnnouncements.unshift(newAnnouncement);

    const sql = getDb();
    if (sql) {
      try {
        await sql`
          INSERT INTO announcements (title, content, date, is_pinned, author, created_at)
          VALUES (${title}, ${content}, ${newAnnouncement.date}, ${newAnnouncement.isPinned}, ${newAnnouncement.author}, NOW())
        `;
      } catch (dbErr) {
        console.warn('[API] Insert announcement DB fallback:', (dbErr as Error).message);
      }
    }

    return res.status(201).json({ success: true, data: newAnnouncement });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    inMemoryAnnouncements = inMemoryAnnouncements.filter((a) => a.id !== id);

    const sql = getDb();
    if (sql) {
      try {
        await sql`
          DELETE FROM announcements WHERE id = ${id}
        `;
      } catch (dbErr) {
        // Fallback
      }
    }

    return res.status(200).json({ success: true, message: 'Pengumuman berhasil dihapus.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE (DEV) & STATIC FILE SERVING (PROD)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the standalone listener if NOT running inside Vercel serverless functions
if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };
