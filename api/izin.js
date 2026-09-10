// api/izin.js - Permohonan Izin & Dispensasi Guru / Pegawai
import { neon } from '@neondatabase/serverless';

let inMemoryIzin = [
  {
    id: 1,
    user_id: 3,
    user_name: 'Petrus K. Nggarang, S.Pd.',
    user_nip: '199203102019031008',
    type: 'dinas_luar',
    reason: 'Menghadiri Rapat Koordinasi Kurikulum PAUD/TK di Dinas Pendidikan Kabupaten Manggarai',
    date: new Date().toISOString().split('T')[0],
    status: 'approved',
    admin_notes: 'Disetujui. Harap menyerahkan laporan hasil rakor.',
    created_at: new Date().toISOString(),
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const queryUserId = url.searchParams.get('user_id');
  const queryId = url.searchParams.get('id');

  const dbUrl = process.env.DATABASE_URL;
  const sql = (dbUrl && dbUrl.trim() && !dbUrl.includes('localhost')) ? neon(dbUrl) : null;

  try {
    // --- GET ---
    if (req.method === 'GET') {
      if (sql) {
        try {
          let result;
          if (queryUserId) {
            result = await sql`
              SELECT * FROM izin_dispensasi
              WHERE user_id = ${parseInt(queryUserId)}
              ORDER BY created_at DESC
            `;
          } else {
            result = await sql`
              SELECT * FROM izin_dispensasi
              ORDER BY created_at DESC
            `;
          }
          if (result.length > 0) return res.status(200).json({ success: true, data: result });
        } catch (e) {
          console.warn('[Izin] DB fetch error:', e.message);
        }
      }

      if (queryUserId) {
        const filtered = inMemoryIzin.filter((i) => i.user_id === parseInt(queryUserId));
        return res.status(200).json({ success: true, data: filtered });
      }
      return res.status(200).json({ success: true, data: inMemoryIzin });
    }

    // --- POST (Pengajuan Izin) ---
    if (req.method === 'POST') {
      const { user_id, user_name, user_nip, type, reason, date, attachment } = req.body;
      if (!user_id || !type || !reason || !date) {
        return res.status(400).json({ success: false, error: 'Semua field wajib diisi.' });
      }

      const newIzin = {
        id: Date.now(),
        user_id: parseInt(user_id),
        user_name: user_name || 'Guru',
        user_nip: user_nip || '-',
        type,
        reason,
        date,
        status: 'pending',
        attachment: attachment ? attachment.slice(0, 500000) : null,
        admin_notes: null,
        created_at: new Date().toISOString(),
      };
      inMemoryIzin.unshift(newIzin);

      if (sql) {
        try {
          await sql`
            INSERT INTO izin_dispensasi (user_id, user_name, user_nip, type, reason, date, status, attachment, created_at, updated_at)
            VALUES (${parseInt(user_id)}, ${user_name}, ${user_nip}, ${type}, ${reason}, ${date}, 'pending', ${attachment ? attachment.slice(0, 500000) : null}, NOW(), NOW())
          `;
        } catch (dbErr) {
          console.warn('[Izin POST] DB insert error:', dbErr.message);
        }
      }

      return res.status(201).json({ success: true, data: newIzin });
    }

    // --- PUT (Persetujuan / Penolakan Admin) ---
    if (req.method === 'PUT') {
      const { id, status, admin_notes } = req.body;
      const targetId = parseInt(id || queryId);
      if (!targetId || !status) {
        return res.status(400).json({ success: false, error: 'ID dan status wajib diisi.' });
      }

      const idx = inMemoryIzin.findIndex((i) => i.id === targetId);
      if (idx !== -1) {
        inMemoryIzin[idx].status = status;
        if (admin_notes !== undefined) inMemoryIzin[idx].admin_notes = admin_notes;
      }

      if (sql) {
        try {
          await sql`
            UPDATE izin_dispensasi
            SET status = ${status}, admin_notes = ${admin_notes || null}, updated_at = NOW()
            WHERE id = ${targetId}
          `;
        } catch (dbErr) {
          console.warn('[Izin PUT] DB update error:', dbErr.message);
        }
      }

      const updated = inMemoryIzin.find((i) => i.id === targetId) || { id: targetId, status, admin_notes };
      return res.status(200).json({ success: true, data: updated });
    }

    // --- DELETE ---
    if (req.method === 'DELETE') {
      const targetId = parseInt(queryId || req.body?.id);
      if (!targetId) return res.status(400).json({ success: false, error: 'ID wajib disertakan.' });

      inMemoryIzin = inMemoryIzin.filter((i) => i.id !== targetId);

      if (sql) {
        try {
          await sql`DELETE FROM izin_dispensasi WHERE id = ${targetId}`;
        } catch (e) {
          console.warn('[Izin DELETE] DB error:', e.message);
        }
      }

      return res.status(200).json({ success: true, message: 'Izin berhasil dihapus.' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Error di api/izin:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
