// api/attendance.js - Presensi Kehadiran, Aktivasi Ulang, & Unlocks
import { neon } from '@neondatabase/serverless';

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let inMemoryAttendance = [
  {
    id: 101,
    user_id: 1,
    user_name: 'Sr. Maria Inviolata, S.Pd.',
    nip: '198804152014022003',
    user_role: 'GURU',
    attendance_date: new Date().toISOString().split('T')[0],
    check_in_time: '06:55:12',
    check_in_lat: -8.6165151,
    check_in_lng: 120.4608927,
    check_out_time: null,
    status: 'tepat_waktu',
    location: 'TKK Inviolata Ruteng (Area Sekolah)',
    notes: 'Presensi GPS Mobile',
  },
  {
    id: 102,
    user_id: 2,
    user_name: 'Yohana D. Jelita, S.Pd.',
    nip: '197910202008012015',
    user_role: 'GURU',
    attendance_date: new Date().toISOString().split('T')[0],
    check_in_time: '07:02:40',
    check_in_lat: -8.6165151,
    check_in_lng: 120.4608927,
    check_out_time: null,
    status: 'tepat_waktu',
    location: 'TKK Inviolata Ruteng (Area Sekolah)',
    notes: 'Presensi GPS Mobile',
  },
];

let inMemoryUnlocks = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const isUnlockPath = pathname.endsWith('/unlocks') || url.searchParams.has('unlocks');
  const isActivatePath = pathname.endsWith('/activate') || url.searchParams.has('activate');

  const dbUrl = process.env.DATABASE_URL;
  const sql = (dbUrl && dbUrl.trim() && !dbUrl.includes('localhost')) ? neon(dbUrl) : null;

  try {
    // ---- GET ----
    if (req.method === 'GET') {
      // 1. Endpoint Unlocks
      if (isUnlockPath) {
        const dateParam = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
        const activeUnlocks = inMemoryUnlocks.filter((u) => u.date === dateParam);
        return res.status(200).json({ success: true, data: activeUnlocks });
      }

      // 2. Normal Attendance Records
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
              a.check_out_time,
              a.check_out_lat,
              a.check_out_lng,
              a.check_out_photo_path,
              a.status,
              a.notes,
              a.location,
              COALESCE(u.full_name, 'Guru / Pegawai') AS user_name,
              COALESCE(u.nip, '-') AS nip,
              COALESCE(r.name, 'Guru') AS user_role
            FROM attendance a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY a.attendance_date DESC, a.check_in_time DESC
          `;
          if (result.length > 0) {
            return res.status(200).json({ success: true, data: result });
          }
        } catch (dbErr) {
          console.warn('[Attendance] DB fetch error, using in-memory:', dbErr.message);
        }
      }
      return res.status(200).json({ success: true, data: inMemoryAttendance });
    }

    // ---- POST ----
    if (req.method === 'POST') {
      // 1. Aktivasi Ulang Tombol Absen
      if (isActivatePath) {
        const { user_id, date, admin_name, notes } = req.body;
        if (!user_id || !date) {
          return res.status(400).json({ success: false, error: 'user_id dan date wajib diisi' });
        }

        const unlockRecord = {
          id: `unlock-${Date.now()}`,
          userId: parseInt(user_id),
          date,
          activatedAt: new Date().toISOString(),
          adminName: admin_name || 'Admin',
          notes: notes || 'Tombol absen diaktifkan oleh admin',
        };
        inMemoryUnlocks = inMemoryUnlocks.filter((u) => !(u.userId === parseInt(user_id) && u.date === date));
        inMemoryUnlocks.push(unlockRecord);

        // Reset check_out_time di memory
        const memIdx = inMemoryAttendance.findIndex((a) => a.user_id === parseInt(user_id) && a.attendance_date === date);
        if (memIdx !== -1) {
          inMemoryAttendance[memIdx].check_out_time = null;
        }

        if (sql) {
          try {
            await sql`
              UPDATE attendance
              SET check_out_time = NULL, updated_at = NOW()
              WHERE user_id = ${parseInt(user_id)} AND attendance_date = ${date}
            `;
          } catch (dbErr) {
            console.warn('[Attendance activate] DB error:', dbErr.message);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Tombol absen berhasil diaktifkan kembali.',
          data: unlockRecord,
        });
      }

      // 2. Normal Presensi (Check-in / Check-out)
      const { user_id, date, status, location, notes, photo, lat, lng, type } = req.body;
      if (!user_id || !date) {
        return res.status(400).json({ success: false, error: 'user_id dan date wajib diisi' });
      }

      const formattedDate = date.includes('T') ? date.split('T')[0] : date;
      const numUserId = parseInt(user_id);
      const nowIso = new Date().toISOString();

      // Cek apakah sudah ada record hari ini di DB atau memory
      let existingRecord = null;
      const memIdx = inMemoryAttendance.findIndex(
        (a) => a.user_id === numUserId && String(a.attendance_date).split('T')[0] === formattedDate
      );
      if (memIdx !== -1) {
        existingRecord = inMemoryAttendance[memIdx];
      }

      if (!existingRecord && sql) {
        try {
          const dbCheck = await sql`
            SELECT * FROM attendance 
            WHERE user_id = ${numUserId} AND attendance_date = ${formattedDate}
            LIMIT 1
          `;
          if (dbCheck && dbCheck.length > 0) {
            existingRecord = dbCheck[0];
            const alreadyExists = inMemoryAttendance.some((a) => String(a.id) === String(existingRecord.id));
            if (!alreadyExists) {
              inMemoryAttendance.unshift(existingRecord);
            }
          }
        } catch (dbErr) {
          console.warn('[Attendance check existing] DB error:', dbErr.message);
        }
      }

      if (!existingRecord) {
        // CHECK-IN BARU
        const newRecord = {
          id: Date.now(),
          user_id: numUserId,
          attendance_date: formattedDate,
          check_in_time: nowIso,
          check_in_lat: lat || -8.6165151,
          check_in_lng: lng || 120.4608927,
          check_in_photo_path: photo || null,
          check_out_time: null,
          status: status || 'hadir',
          location: location || 'TKK Inviolata Ruteng (Area Sekolah)',
          notes: notes || 'Presensi Masuk',
        };

        if (sql) {
          try {
            const insertRes = await sql`
              INSERT INTO attendance (
                user_id, attendance_date, check_in_time, status, location, notes,
                check_in_lat, check_in_lng, check_in_photo_path, created_at, updated_at
              ) VALUES (
                ${numUserId}, ${formattedDate}, ${nowIso}, ${status || 'hadir'},
                ${location || null}, ${notes || null}, ${lat || null}, ${lng || null},
                ${photo || null}, NOW(), NOW()
              )
              RETURNING id
            `;
            if (insertRes && insertRes.length > 0) {
              newRecord.id = insertRes[0].id;
            }
          } catch (dbErr) {
            console.warn('[Attendance Check-in] DB error:', dbErr.message);
          }
        }

        inMemoryAttendance = inMemoryAttendance.filter((a) => String(a.id) !== String(newRecord.id));
        inMemoryAttendance.unshift(newRecord);

        return res.status(200).json({
          success: true,
          message: 'Presensi Masuk berhasil dicatat.',
          data: newRecord,
          type: 'check-in',
        });
      } else {
        // CHECK-OUT
        if (existingRecord.check_out_time !== null && existingRecord.check_out_time !== undefined) {
          return res.status(400).json({
            success: false,
            error: 'Anda sudah melakukan presensi pulang hari ini.',
          });
        }

        existingRecord.check_out_time = nowIso;
        existingRecord.check_out_lat = lat || -8.6165151;
        existingRecord.check_out_lng = lng || 120.4608927;
        if (photo) existingRecord.check_out_photo_path = photo;

        if (sql) {
          try {
            await sql`
              UPDATE attendance
              SET 
                check_out_time = ${nowIso},
                check_out_lat = ${lat || null},
                check_out_lng = ${lng || null},
                check_out_photo_path = ${photo || null},
                updated_at = NOW()
              WHERE (id = ${existingRecord.id} OR (user_id = ${numUserId} AND attendance_date = ${formattedDate}))
            `;
          } catch (dbErr) {
            console.warn('[Attendance Check-out] DB error:', dbErr.message);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Presensi Pulang berhasil dicatat.',
          data: existingRecord,
          type: 'check-out',
        });
      }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Error di api/attendance:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
