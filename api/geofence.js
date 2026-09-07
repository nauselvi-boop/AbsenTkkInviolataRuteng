// api/geofence.js
import { neon } from '@neondatabase/serverless';

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
      if (result.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            schoolName: 'TKK Inviolata Ruteng',
            latitude: -8.6135,
            longitude: 120.4689,
            radiusMeters: 50,
            checkInStartTime: '06:30',
            checkInDeadlineTime: '07:15',
            checkOutStartTime: '12:30',
            checkOutDeadlineTime: '15:30',
          },
        });
      }
      return res.status(200).json({ success: true, data: result[0] });
    }

    // ---- POST ----
    if (req.method === 'POST') {
      const { 
        schoolName, 
        latitude, 
        longitude, 
        radiusMeters, 
        checkInStartTime, 
        checkInDeadlineTime,
        checkOutStartTime,
        checkOutDeadlineTime 
      } = req.body;

      if (!schoolName || latitude === undefined || longitude === undefined || !radiusMeters) {
        return res.status(400).json({ success: false, error: 'Semua field wajib diisi.' });
      }

      // Format waktu
      const formatTime = (time) => {
        if (!time) return null;
        const parts = time.split(':');
        if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`;
        return time;
      };

      const inStart = formatTime(checkInStartTime) || '06:30:00';
      const inDeadline = formatTime(checkInDeadlineTime) || '07:15:00';
      const outStart = formatTime(checkOutStartTime) || '12:30:00';
      const outDeadline = formatTime(checkOutDeadlineTime) || '15:30:00';

      // Hapus config lama
      await sql`DELETE FROM geo_fencing_config`;

      // Insert baru
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
          ${inStart}::TIME,
          ${inDeadline}::TIME,
          ${outStart}::TIME,
          ${outDeadline}::TIME,
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

      return res.status(200).json({ success: true, data: result[0] });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error di api/geofence:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      detail: error.message,
    });
  }
}