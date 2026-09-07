// api/izin.js
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const sql = neon(process.env.DATABASE_URL);

    if (req.method === 'GET') {
      const { user_id } = req.query;
      let result;
      if (user_id) {
        result = await sql`
          SELECT * FROM izin_dispensasi
          WHERE user_id = ${parseInt(user_id)}
          ORDER BY created_at DESC
        `;
      } else {
        result = await sql`
          SELECT * FROM izin_dispensasi
          ORDER BY created_at DESC
        `;
      }
      return res.status(200).json({ success: true, data: result });
    }

    if (req.method === 'POST') {
      const { user_id, user_name, user_nip, type, reason, date, attachment } = req.body;
      if (!user_id || !type || !reason || !date) {
        return res.status(400).json({ success: false, error: 'Semua field wajib diisi.' });
      }
      // Batasi ukuran attachment (maks 2MB)
      if (attachment && attachment.length > 2000000) {
        return res.status(400).json({ success: false, error: 'Ukuran file terlalu besar (maks 2MB).' });
      }
      const result = await sql`
        INSERT INTO izin_dispensasi (user_id, user_name, user_nip, type, reason, date, status, attachment, created_at, updated_at)
        VALUES (${user_id}, ${user_name}, ${user_nip}, ${type}, ${reason}, ${date}, 'pending', ${attachment || null}, NOW(), NOW())
        RETURNING *
      `;
      return res.status(200).json({ success: true, data: result[0] });
    }

    if (req.method === 'PUT') {
      const { id, status, admin_notes } = req.body;
      if (!id || !status) {
        return res.status(400).json({ success: false, error: 'ID dan status wajib diisi.' });
      }
      const result = await sql`
        UPDATE izin_dispensasi
        SET status = ${status}, admin_notes = ${admin_notes || null}, updated_at = NOW()
        WHERE id = ${parseInt(id)}
        RETURNING *
      `;
      if (result.length === 0) {
        return res.status(404).json({ success: false, error: 'Data tidak ditemukan.' });
      }
      return res.status(200).json({ success: true, data: result[0] });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error di api/izin:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      detail: error.message,
    });
  }
}