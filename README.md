<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# AbsenKU Profesional - TKK Inviolata Ruteng

Sistem Informasi Presensi Online TKK Inviolata Ruteng dengan Live Tracking GPS Geofencing, Verifikasi Selfie Kamera, Statistik Kehadiran Realtime, dan Rekap Laporan Excel.

## 🚀 Panduan Deploy ke GitHub & Vercel

### 1. Push ke GitHub
```bash
git add .
git commit -m "feat: AbsenKU siap deploy ke Vercel"
git push origin main
```

### 2. Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com) dan login.
2. Klik **Add New...** > **Project**, lalu pilih repositori GitHub Anda.
3. Konfigurasi proyek di Vercel:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. (Opsional) Tambahkan Environment Variable jika menggunakan database Neon PostgreSQL:
   - `DATABASE_URL`: `postgres://...`
   *(Catatan: Jika `DATABASE_URL` belum diisi, aplikasi otomatis menggunakan penyimpanan in-memory cadangan sehingga aplikasi tetap berjalan lancar tanpa error).*
5. Klik **Deploy**.

---

## 🔑 Akun Login Bawaan

| Peran (Role) | Email | Password |
|---|---|---|
| **Admin Utama** | `admin@inviolata.sch.id` | `admin123` |
| **Guru** | `maria@inviolata.sch.id` | `password123` (atau `guru123`) |
| **Pegawai** | `antonius@inviolata.sch.id` | `password123` (atau `guru123`) |
