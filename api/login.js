// api/login.js - Endpoint login untuk menghubungkan React ke database Neon
const { Pool } = require('pg');

// Membaca koneksi database dari file .env (DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Wajib untuk koneksi ke Neon
  }
});

module.exports = async (req, res) => {
  // 1. Mengatur CORS agar frontend (localhost:5173) bisa memanggil API ini
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Tangani preflight request (OPTIONS) yang dikirim browser
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Hanya terima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 4. Ambil email dan password dari body request
    const { email, password } = req.body;

    // Validasi sederhana: pastikan email dan password diisi
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    // 5. Cari user di database berdasarkan email
    const result = await pool.query(
      'SELECT id, role_id, full_name, email, password FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    // 6. Jika email tidak ditemukan
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email tidak ditemukan atau akun nonaktif' });
    }

    const user = result.rows[0];

    // 7. ⚠️ CEK PASSWORD (SEMENTARA PAKAI PLAIN TEXT)
    // Untuk testing awal, kita bandingkan langsung (plain text).
    // Di database, kita sudah ubah password admin menjadi 'admin123' agar mudah.
    // NANTI PRODUCTION: wajib pakai bcrypt.compare() untuk keamanan!
    if (password !== user.password) {
      return res.status(401).json({ error: 'Password salah' });
    }

    // 8. Hapus password dari object user sebelum dikirim ke frontend (biar aman)
    delete user.password;

    // 9. Kirim response sukses
    res.status(200).json({
      message: 'Login berhasil',
      user: user
    });

  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};