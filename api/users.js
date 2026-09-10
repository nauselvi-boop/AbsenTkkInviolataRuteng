// api/users.js - Manajemen Data Tenaga Pendidik & Kependidikan
import { neon } from '@neondatabase/serverless';

let inMemoryUsers = [
  {
    id: 1,
    nip: '198804152014022003',
    name: 'Sr. Maria Inviolata, S.Pd.',
    email: 'maria@inviolata.sch.id',
    role: 'GURU',
    phone: '081234567890',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    is_active: true,
  },
  {
    id: 2,
    nip: '197910202008012015',
    name: 'Yohana D. Jelita, S.Pd.',
    email: 'yohana@inviolata.sch.id',
    role: 'GURU',
    phone: '082345678901',
    avatarUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150',
    is_active: true,
  },
  {
    id: 3,
    nip: '199203102019031008',
    name: 'Petrus K. Nggarang, S.Pd.',
    email: 'petrus@inviolata.sch.id',
    role: 'GURU',
    phone: '083456789012',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    is_active: true,
  },
  {
    id: 4,
    nip: '198506142010012022',
    name: 'Theresia M. Sinar, A.Ma.',
    email: 'theresia@inviolata.sch.id',
    role: 'GURU',
    phone: '084567890123',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    is_active: true,
  },
  {
    id: 5,
    nip: '199008252016041002',
    name: 'Antonius B. Jebarus, S.Kom.',
    email: 'antonius@inviolata.sch.id',
    role: 'PEGAWAI',
    phone: '085678901234',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    is_active: true,
  },
  {
    id: 999,
    nip: 'ADMIN001',
    name: 'Admin Utama (Kepala Sekolah)',
    email: 'admin@inviolata.sch.id',
    role: 'ADMIN',
    phone: '081299990001',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    is_active: true,
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const queryId = url.searchParams.get('id');

  const dbUrl = process.env.DATABASE_URL;
  const sql = (dbUrl && dbUrl.trim() && !dbUrl.includes('localhost')) ? neon(dbUrl) : null;

  try {
    // --- GET (Semua atau Satu User) ---
    if (req.method === 'GET') {
      if (queryId) {
        const numId = parseInt(queryId);
        if (sql) {
          try {
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
              WHERE u.id = ${numId}
            `;
            if (result.length > 0) return res.status(200).json({ success: true, data: result[0] });
          } catch (e) {
            console.warn('[Users] DB fetch error:', e.message);
          }
        }
        const found = inMemoryUsers.find((u) => u.id === numId);
        if (!found) return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
        return res.status(200).json({ success: true, data: found });
      }

      if (sql) {
        try {
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
            ORDER BY u.id ASC
          `;
          if (result.length > 0) return res.status(200).json({ success: true, data: result });
        } catch (e) {
          console.warn('[Users] DB fetch all error:', e.message);
        }
      }
      return res.status(200).json({ success: true, data: inMemoryUsers });
    }

    // --- POST (Tambah / Import) ---
    if (req.method === 'POST') {
      if (pathname.endsWith('/import')) {
        const { users } = req.body;
        if (!users || !Array.isArray(users)) {
          return res.status(400).json({ success: false, error: 'Format salah, kirim array users' });
        }
        const imported = [];
        for (const u of users) {
          const newU = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            nip: u.nip || `NIP-${Date.now()}`,
            name: u.name || 'Guru Baru',
            email: u.email || `user${Date.now()}@inviolata.sch.id`,
            role: (u.role || 'GURU').toUpperCase(),
            phone: u.phone || '-',
            is_active: true,
          };
          inMemoryUsers.push(newU);
          imported.push(newU);
        }
        return res.status(200).json({ success: true, data: imported, count: imported.length });
      }

      const { nip, name, email, role, phone, password } = req.body;
      if (!nip || !name || !email || !role) {
        return res.status(400).json({ success: false, error: 'Field NIP, Nama, Email, dan Role wajib diisi.' });
      }

      const newUser = {
        id: Date.now(),
        nip,
        name,
        email,
        role: role.toUpperCase(),
        phone: phone || '-',
        is_active: true,
      };
      inMemoryUsers.push(newUser);

      if (sql) {
        try {
          await sql`
            INSERT INTO users (nip, full_name, email, role_id, phone, password, is_active, created_at)
            VALUES (
              ${nip}, ${name}, ${email},
              ${role.toUpperCase() === 'ADMIN' ? 1 : role.toUpperCase() === 'GURU' ? 2 : 3},
              ${phone || null}, ${password || 'password123'}, true, NOW()
            )
          `;
        } catch (dbErr) {
          console.warn('[Users POST] DB insert error:', dbErr.message);
        }
      }

      return res.status(201).json({ success: true, data: newUser });
    }

    // --- PUT (Update User) ---
    if (req.method === 'PUT') {
      const targetId = parseInt(queryId || req.body?.id);
      if (!targetId) return res.status(400).json({ success: false, error: 'ID user diperlukan' });

      const idx = inMemoryUsers.findIndex((u) => u.id === targetId);
      if (idx !== -1) {
        inMemoryUsers[idx] = { ...inMemoryUsers[idx], ...req.body };
      }

      if (sql) {
        try {
          const { nip, name, email, role, phone, password } = req.body;
          if (password) {
            await sql`UPDATE users SET password = ${password}, updated_at = NOW() WHERE id = ${targetId}`;
          }
          if (name || email || nip) {
            await sql`
              UPDATE users 
              SET 
                full_name = COALESCE(${name || null}, full_name),
                email = COALESCE(${email || null}, email),
                nip = COALESCE(${nip || null}, nip),
                phone = COALESCE(${phone || null}, phone),
                updated_at = NOW()
              WHERE id = ${targetId}
            `;
          }
        } catch (dbErr) {
          console.warn('[Users PUT] DB update error:', dbErr.message);
        }
      }

      const updated = inMemoryUsers.find((u) => u.id === targetId) || req.body;
      return res.status(200).json({ success: true, data: updated });
    }

    // --- DELETE (Hapus User) ---
    if (req.method === 'DELETE') {
      const targetId = parseInt(queryId || req.body?.id);
      if (!targetId) return res.status(400).json({ success: false, error: 'ID user diperlukan' });

      inMemoryUsers = inMemoryUsers.filter((u) => u.id !== targetId);

      if (sql) {
        try {
          await sql`DELETE FROM users WHERE id = ${targetId}`;
        } catch (dbErr) {
          console.warn('[Users DELETE] DB error:', dbErr.message);
        }
      }

      return res.status(200).json({ success: true, message: 'User berhasil dihapus', deletedId: targetId });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Error di api/users:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
