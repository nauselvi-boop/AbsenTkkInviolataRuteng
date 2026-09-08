// api/attendance.js
import { neon } from '@neondatabase/serverless';

// Fungsi Haversine untuk menghitung jarak (meter) antara dua koordinat
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // ---- GET ----
    if (req.method === 'GET') {
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
      return res.status(200).json({ success: true, data: result });
    }

    // ---- POST ----
    if (req.method === 'POST') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      
      // Endpoint aktivasi
      if (url.pathname.endsWith('/activate')) {
        const { user_id, date } = req.body;
        if (!user_id || !date) {
          return res.status(400).json({ success: false, error: 'user_id dan date wajib diisi' });
        }
        const existing = await sql`
          SELECT id, check_out_time FROM attendance
          WHERE user_id = ${user_id} AND attendance_date = ${date}
        `;
        if (existing.length > 0) {
          await sql`
            UPDATE attendance
            SET check_out_time = NULL, updated_at = NOW()
            WHERE id = ${existing[0].id}
          `;
        } else {
          await sql`
            INSERT INTO attendance (user_id, attendance_date, status, created_at, updated_at)
            VALUES (${user_id}, ${date}, 'pending', NOW(), NOW())
          `;
        }
        return res.status(200).json({ success: true, message: 'Tombol absen diaktifkan kembali' });
      }

      // ---- Normal POST (check-in / check-out) ----
      const { user_id, date, status, location, notes, photo, lat, lng } = req.body;

      console.log('📥 Data diterima:', { user_id, date, status, location, notes, lat, lng, photoLength: photo?.length });

      if (!user_id || !date) {
        return res.status(400).json({ success: false, error: 'user_id dan date wajib diisi' });
      }

      let formattedDate = date;
      if (date.includes('T')) {
        formattedDate = date.split('T')[0];
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
        return res.status(400).json({ success: false, error: 'Format tanggal harus YYYY-MM-DD' });
      }

      // Cek user
      const userCheck = await sql`SELECT id FROM users WHERE id = ${user_id}`;
      if (userCheck.length === 0) {
        return res.status(400).json({ success: false, error: 'User tidak terdaftar' });
      }

      // ---- Validasi Radius Geofence ----
      // Ambil konfigurasi geofence terbaru
      const geoConfig = await sql`
        SELECT latitude, longitude, radius_meters 
        FROM geo_fencing_config 
        ORDER BY id DESC LIMIT 1
      `;
      if (geoConfig.length > 0 && lat !== undefined && lng !== undefined) {
        const { latitude: schoolLat, longitude: schoolLng, radius_meters: maxRadius } = geoConfig[0];
        const distance = calculateDistance(lat, lng, schoolLat, schoolLng);
        console.log(`📏 Jarak ke sekolah: ${distance}m (Maks: ${maxRadius}m)`);
        if (distance > maxRadius) {
          return res.status(400).json({
            success: false,
            error: 'Anda Berada Di Luar Radius TKK Inviolata',
            detail: `Jarak Anda ${Math.round(distance)}m, maksimal ${maxRadius}m`
          });
        }
      }

      // Cek existing record
      const existing = await sql`
        SELECT id, check_in_time, check_out_time 
        FROM attendance 
        WHERE user_id = ${user_id} AND attendance_date = ${formattedDate}
      `;

      // ---- CHECK-IN ----
      if (existing.length === 0) {
        const now = new Date();
        const checkInTime = now.toISOString();

        let photoData = photo;
        if (photo && photo.length > 500000) {
          console.log('⚠️ Foto terlalu besar, diabaikan');
          photoData = null;
        }

        const result = await sql`
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
            ${checkInTime},
            ${status || 'hadir'},
            ${location || null},
            ${notes || null},
            ${lat || null},
            ${lng || null},
            ${photoData || null},
            NOW(),
            NOW()
          )
          RETURNING *
        `;
        console.log('✅ Check-in berhasil:', result[0]);
        return res.status(200).json({
          success: true,
          message: 'Check-in berhasil',
          data: result[0],
          type: 'check-in',
        });
      }

      // ---- CHECK-OUT ----
      const record = existing[0];
      if (record.check_out_time !== null) {
        console.log('❌ Sudah check-out hari ini');
        return res.status(400).json({
          success: false,
          error: 'Anda sudah melakukan check-out hari ini. Tidak bisa absen lagi.',
        });
      }

      if (record.check_in_time !== null && record.check_out_time === null) {
        const now = new Date();
        const checkOutTime = now.toISOString();

        const result = await sql`
          UPDATE attendance
          SET 
            check_out_time = ${checkOutTime},
            updated_at = NOW()
          WHERE id = ${record.id}
          RETURNING *
        `;
        console.log('✅ Check-out berhasil:', result[0]);
        return res.status(200).json({
          success: true,
          message: 'Check-out berhasil',
          data: result[0],
          type: 'check-out',
        });
      }

      return res.status(400).json({ success: false, error: 'Status absensi tidak valid' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error di API attendance:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      detail: error.message,
    });
  }
}