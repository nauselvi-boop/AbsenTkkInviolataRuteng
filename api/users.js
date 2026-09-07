// api/users.js
import { neon } from '@neondatabase/serverless';

// Helper: dapatkan role_id dari nama role
async function getRoleId(sql, roleName) {
  const result = await sql`
    SELECT id FROM roles WHERE LOWER(name) = LOWER(${roleName})
  `;
  if (result.length === 0) {
    throw new Error(`Role "${roleName}" tidak ditemukan. Pastikan tabel roles berisi: ADMIN, GURU, PEGAWAI`);
  }
  return result[0].id;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const query = Object.fromEntries(url.searchParams);

    console.log('📥 Request:', req.method, req.url);

    // --- GET (semua user atau satu user) ---
    if (req.method === 'GET') {
      let result;
      if (query.id) {
        // Ambil satu user dengan JOIN roles
        result = await sql`
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
          WHERE u.id = ${parseInt(query.id)}
        `;
        if (result.length === 0) {
          return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
        }
        return res.status(200).json({ success: true, data: result[0] });
      }

      // Ambil semua user
      result = await sql`
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
      return res.status(200).json({ success: true, data: result });
    }

    // --- POST (tambah user) ---
    if (req.method === 'POST') {
      // Handle import (jika path diakhiri /import)
      if (path.endsWith('/import')) {
        const { users } = req.body;
        if (!users || !Array.isArray(users)) {
          return res.status(400).json({ success: false, error: 'Format salah, kirim array users' });
        }

        const results = [];
        for (const u of users) {
          const { nip, name, email, role, phone, password } = u;
          if (!nip || !name || !email || !role || !password) continue;
          try {
            const roleId = await getRoleId(sql, role);
            const inserted = await sql`
              INSERT INTO users (nip, full_name, email, role_id, phone, password, is_active, created_at)
              VALUES (${nip}, ${name}, ${email}, ${roleId}, ${phone || null}, ${password}, true, NOW())
              RETURNING id, full_name AS name, email, nip, phone
            `;
            if (inserted.length > 0) results.push(inserted[0]);
          } catch (e) {
            console.error('Gagal import user:', u, e.message);
          }
        }
        return res.status(200).json({ success: true, data: results, count: results.length });
      }

      // Tambah satu user
      const { nip, name, email, role, phone, password } = req.body;

      console.log('📥 Data diterima:', { nip, name, email, role, phone, password: '***' });

      // Validasi
      if (!nip || !name || !email || !role || !password) {
        return res.status(400).json({
          success: false,
          error: 'Semua field wajib diisi (nip, name, email, role, password)'
        });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password minimal 6 karakter' });
      }

      // Cek duplikat email atau nip
      const existing = await sql`
        SELECT id FROM users WHERE email = ${email} OR nip = ${nip}
      `;
      if (existing.length > 0) {
        return res.status(409).json({ success: false, error: 'Email atau NIP sudah terdaftar' });
      }

      // Dapatkan role_id
      const roleId = await getRoleId(sql, role);

      // Insert user
      const result = await sql`
        INSERT INTO users (nip, full_name, email, role_id, phone, password, is_active, created_at)
        VALUES (${nip}, ${name}, ${email}, ${roleId}, ${phone || null}, ${password}, true, NOW())
        RETURNING id, full_name AS name, email, nip, phone
      `;

      console.log('✅ User berhasil disimpan:', result[0]);
      return res.status(200).json({ success: true, data: result[0] });
    }

    // --- PUT (update user) ---
    if (req.method === 'PUT') {
      const userId = query.id;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'Parameter id diperlukan' });
      }

      const { nip, name, email, role, phone, password, is_active } = req.body;

      // Cek user ada
      const check = await sql`SELECT id FROM users WHERE id = ${parseInt(userId)}`;
      if (check.length === 0) {
        return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
      }

      let updateFields = [];
      const values = [];

      if (nip !== undefined) { updateFields.push(`nip = $${values.length + 1}`); values.push(nip); }
      if (name !== undefined) { updateFields.push(`full_name = $${values.length + 1}`); values.push(name); }
      if (email !== undefined) { updateFields.push(`email = $${values.length + 1}`); values.push(email); }
      if (role !== undefined) {
        const roleId = await getRoleId(sql, role);
        updateFields.push(`role_id = $${values.length + 1}`);
        values.push(roleId);
      }
      if (phone !== undefined) { updateFields.push(`phone = $${values.length + 1}`); values.push(phone); }
      if (password !== undefined && password.length >= 6) {
        updateFields.push(`password = $${values.length + 1}`);
        values.push(password);
      }
      if (is_active !== undefined) { updateFields.push(`is_active = $${values.length + 1}`); values.push(is_active); }

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, error: 'Tidak ada field yang diupdate' });
      }

      values.push(parseInt(userId));
      const queryStr = `
        UPDATE users
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING id, full_name AS name, email, nip, phone, is_active
      `;

      const result = await sql.query(queryStr, values);
      return res.status(200).json({ success: true, data: result[0] });
    }

    // --- DELETE user ---
    if (req.method === 'DELETE') {
      const userId = query.id;
      if (!userId) {
        return res.status(400).json({ success: false, error: 'Parameter id diperlukan' });
      }

      const result = await sql`
        DELETE FROM users WHERE id = ${parseInt(userId)} RETURNING id
      `;
      if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
      }
      return res.status(200).json({ success: true, data: { deletedId: result[0].id } });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ ERROR di api/users:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      detail: error.message
    });
  }
}