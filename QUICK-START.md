# 🚀 Quick Start Guide

## Langkah Cepat Mulai Menggunakan Dashboard

### 1️⃣ Jalankan Dashboard (Tanpa Setup BPS)

Dashboard sudah bisa langsung digunakan dengan data lokal:

```bash
# Masuk ke direktori
cd "KP MCI GIS"

# Jalankan web server
python -m http.server 8000

# Atau gunakan PHP
php -S localhost:8000

# Atau gunakan Node.js
npx http-server -p 8000
```

Buka browser: **http://localhost:8000**

Dashboard akan otomatis menggunakan data lokal sebagai fallback.

---

### 2️⃣ Setup BPS API (Untuk Data Real)

Jika ingin data real dari BPS:

#### A. Dapatkan API Key (5 menit)

1. Buka [https://webapi.bps.go.id](https://webapi.bps.go.id)
2. Klik **"Daftar"**
3. Isi form dan verifikasi email
4. Login dan copy **API Key**

#### B. Test Connection (Opsional tapi Recommended)

```bash
# Buka file test
open test-bps-connection.html
```

Paste API key Anda dan klik **"Test Connection"**.  
Jika berhasil ✅, lanjut ke step C.

#### C. Setup Config

**Opsi 1: File Terpisah (Recommended)**
```bash
# Copy template
cp bps-config.example.js bps-config.js

# Edit file
nano bps-config.js
```

Isi API key:
```javascript
CONFIG.BPS_API.API_KEY = 'paste_api_key_disini';
```

Uncomment di [index.html](index.html) baris 107:
```html
<!-- Hapus comment ini -->
<script src="bps-config.js"></script>
```

**Opsi 2: Langsung di app.js**

Edit [app.js](app.js) baris ~18:
```javascript
API_KEY: 'paste_api_key_disini',
```

#### D. Refresh Dashboard

Reload halaman dan dashboard akan fetch data dari BPS! 🎉

---

### 3️⃣ Fitur-Fitur Dashboard

#### Pilih Tahun
Dropdown di kiri atas untuk memilih tahun data (2019-2023)

#### Pilih Bulan
- Gunakan **dropdown** atau
- Gunakan **slider** dengan gradient warna

#### Lihat Detail Provinsi
- **Hover** untuk quick view
- **Klik** untuk detail lengkap di panel kanan

#### Statistik
Panel kiri bawah menampilkan:
- Total produksi nasional
- Rata-rata per provinsi
- Provinsi tertinggi/terendah

---

## ❓ Troubleshooting Cepat

### Dashboard Tidak Muncul?
- Pastikan jalankan lewat web server (bukan double-click file)
- Cek console browser (F12) untuk error

### BPS API Tidak Berfungsi?
```bash
# Test connection
open test-bps-connection.html

# Atau cek browser console
Console → Network → Cari request ke "webapi.bps.go.id"
```

Kemungkinan penyebab:
- API key salah → regenerate di dashboard BPS
- Rate limit → tunggu 24 jam atau gunakan cache
- BPS server down → dashboard auto-fallback ke data lokal

### Data Tidak Update?
```javascript
// Clear cache (di browser console)
localStorage.clear();
location.reload();
```

---

## 📚 Dokumentasi Lengkap

- **Panduan BPS API**: [PANDUAN-BPS-API.md](PANDUAN-BPS-API.md)
- **Update Log**: [UPDATE-LOG.md](UPDATE-LOG.md)
- **README**: [README.md](README.md)

---

## 🎯 Tips & Tricks

### 1. Cache Management
Data dari BPS di-cache 24 jam untuk efisiensi:
```javascript
// Clear cache via console
const bpsService = new BPSDataService();
bpsService.clearCache();
```

### 2. Cek Data Source
Footer di bawah menunjukkan apakah data dari:
- **BPS WebAPI** (real-time)
- **Data lokal** (fallback)

### 3. Keyboard Shortcuts
- **Tab**: Navigate antar kontrol
- **Arrow Keys**: Adjust slider
- **Esc**: Close popup

---

## 💡 Pro Tips

1. **Selalu test API key** sebelum production
2. **Enable caching** untuk hemat quota API
3. **Monitor console** untuk debug
4. **Backup data lokal** sebagai fallback

---

**Need Help?** Check browser console (F12 → Console) untuk detail error messages.
