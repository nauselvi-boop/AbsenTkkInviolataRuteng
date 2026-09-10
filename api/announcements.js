// api/announcements.js - Pengumuman Resmi Sekolah
import { neon } from '@neondatabase/serverless';

let inMemoryAnnouncements = [
  {
    id: 'ann-1',
    title: 'Pemberitahuan Upacara Hari Pendidikan',
    content: 'Seluruh guru dan staf pegawai wajib hadir pukul 06.45 WITA mengenakan seragam dinas lengkap.',
    date: new Date().toISOString().split('T')[0],
    author: 'Kepala Sekolah (Sr. Maria Inviolata)',
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ann-2',
    title: 'Pelaksanaan Geofence GPS Baru',
    content: 'Radius presensi resmi ditetapkan 50 meter di area kompleks TKK Inviolata Ruteng.',
    date: new Date().toISOString().split('T')[0],
    author: 'Administrator IT',
    priority: 'normal',
    createdAt: new Date().toISOString(),
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const idFromQuery = url.searchParams.get('id');

  const dbUrl = process.env.DATABASE_URL;
  const sql = (dbUrl && dbUrl.trim() && !dbUrl.includes('localhost')) ? neon(dbUrl) : null;

  try {
    // GET Announcements
    if (req.method === 'GET') {
      if (sql) {
        try {
          const result = await sql`
            SELECT id, title, content, date, author, priority, created_at AS "createdAt"
            FROM announcements
            ORDER BY created_at DESC
          `;
          if (result.length > 0) {
            return res.status(200).json({ success: true, data: result });
          }
        } catch (e) {
          console.warn('[Announcements] DB fetch error:', e.message);
        }
      }
      return res.status(200).json({ success: true, data: inMemoryAnnouncements });
    }

    // POST Announcement
    if (req.method === 'POST') {
      const { title, content, priority, author, date } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Judul dan isi pengumuman wajib diisi.' });
      }

      const newAnn = {
        id: `ann-${Date.now()}`,
        title,
        content,
        priority: priority || 'normal',
        author: author || 'Admin Utama',
        date: date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      inMemoryAnnouncements.unshift(newAnn);

      if (sql) {
        try {
          await sql`
            INSERT INTO announcements (id, title, content, date, author, priority, created_at)
            VALUES (${newAnn.id}, ${newAnn.title}, ${newAnn.content}, ${newAnn.date}, ${newAnn.author}, ${newAnn.priority}, NOW())
          `;
        } catch (e) {
          console.warn('[Announcements] DB insert error:', e.message);
        }
      }

      return res.status(201).json({ success: true, data: newAnn });
    }

    // DELETE Announcement
    if (req.method === 'DELETE') {
      const targetId = idFromQuery || req.body?.id;
      if (!targetId) {
        return res.status(400).json({ success: false, error: 'ID pengumuman wajib disertakan.' });
      }

      inMemoryAnnouncements = inMemoryAnnouncements.filter((a) => a.id !== targetId);

      if (sql) {
        try {
          await sql`DELETE FROM announcements WHERE id = ${targetId}`;
        } catch (e) {
          console.warn('[Announcements] DB delete error:', e.message);
        }
      }

      return res.status(200).json({ success: true, message: 'Pengumuman berhasil dihapus.' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
