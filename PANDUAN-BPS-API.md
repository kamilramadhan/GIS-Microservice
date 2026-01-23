# Panduan Integrasi BPS WebAPI

## Langkah-Langkah Setup

### 1. Registrasi dan Dapatkan API Key

1. Kunjungi [https://webapi.bps.go.id](https://webapi.bps.go.id)
2. Klik tombol **"Daftar"** atau **"Register"**
3. Isi formulir pendaftaran:
   - Nama lengkap
   - Email aktif
   - Institusi/Organisasi
   - Tujuan penggunaan
4. Verifikasi email yang dikirimkan oleh BPS
5. Login ke dashboard menggunakan kredensial Anda
6. Copy **API Key** dari dashboard

### 2. Konfigurasi API Key

#### Option A: Menggunakan File Konfigurasi (Recommended)

```bash
# Copy template konfigurasi
cp bps-config.example.js bps-config.js

# Edit file bps-config.js
nano bps-config.js
```

Isi API key Anda:
```javascript
CONFIG.BPS_API.API_KEY = 'abcd1234efgh5678ijkl'; // Ganti dengan API key Anda
```

Tambahkan script di `index.html` sebelum `app.js`:
```html
<!-- BPS Configuration (optional, jika menggunakan custom config) -->
<script src="bps-config.js"></script>

<!-- Custom JavaScript -->
<script src="app.js"></script>
```

#### Option B: Langsung di app.js

Edit file `app.js` baris ~18:
```javascript
API_KEY: 'MASUKKAN_API_KEY_ANDA_DISINI',
```

### 3. Struktur Endpoint BPS

#### Endpoint Utama

```
Base URL: https://webapi.bps.go.id/v1/api
```

#### Mendapatkan List Data

```
GET /list/model/data/domain/{domain_id}/key/{api_key}
```

**Parameter:**
- `domain_id`: Kode wilayah (0000 untuk Indonesia, 32 untuk Jawa Barat, dll)
- `api_key`: API key Anda

**Contoh Request:**
```javascript
const url = `https://webapi.bps.go.id/v1/api/list/model/data/domain/0000/key/${apiKey}`;

fetch(url)
  .then(response => response.json())
  .then(data => console.log(data));
```

#### Mendapatkan Variable List

```
GET /list/model/var/lang/{lang}/domain/{domain_id}/key/{api_key}
```

**Parameter:**
- `lang`: Bahasa (ind/eng)
- `domain_id`: Kode wilayah
- `api_key`: API key Anda

### 4. Mapping Subject ID untuk Produksi Padi

BPS menggunakan Subject ID untuk mengkategorikan data:

```javascript
// Subject untuk Tanaman Pangan
SUBJECT_ID: '53'

// Indikator spesifik untuk Produksi Padi
INDICATOR_ID: '5203'
```

Untuk mendapatkan data produksi padi, gunakan kombinasi:
- Subject: 53 (Tanaman Pangan)
- Indicator: Produksi (dalam ton)
- Turvar: Nama provinsi atau kode wilayah

### 5. Format Response BPS

Response dari BPS API biasanya dalam format:

```json
{
  "data-availability": "available",
  "data": [
    {
      "label": "Nama Provinsi",
      "turvar": "3200", // Kode wilayah
      "turcol": "2023", // Tahun
      "value": "1850000" // Nilai produksi
    }
  ],
  "datacollection": "...",
  "datalastupdate": "2024-01-15",
  "title": "Produksi Padi"
}
```

### 6. Transformasi Data

Dashboard ini memerlukan format:

```json
{
  "kode_prov": "32",
  "provinsi": "Jawa Barat",
  "jan": 1850000,
  "feb": 1920000,
  // ... bulan lainnya
}
```

Fungsi transformasi sudah ada di `BPSDataService.transformBPSData()`.

### 7. Caching Strategy

Untuk mengurangi API calls dan mematuhi rate limit:

```javascript
// Cache disimpan di localStorage
// Duration: 24 jam (configurable)

// Clear cache secara manual:
const bpsService = new BPSDataService();
bpsService.clearCache();
```

### 8. Rate Limiting

BPS API memiliki batasan:
- **Request limit**: ~100 requests/hari (tergantung tier)
- **Concurrent requests**: 1 request/detik

Dashboard sudah implement:
- ✓ Exponential backoff untuk retry
- ✓ Request queueing
- ✓ Automatic rate limit handling

### 9. Error Handling

```javascript
try {
  const data = await bpsService.getData(year);
  // Data berhasil dimuat dari BPS
} catch (error) {
  // Fallback ke data lokal
  console.warn('BPS API unavailable, using local data');
}
```

Dashboard otomatis fallback ke `data-produksi-padi.json` jika:
- API key tidak valid
- Rate limit tercapai
- Network error
- BPS server down

### 10. Testing Connection

Buat file `test-bps-api.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test BPS API</title>
</head>
<body>
    <h1>BPS API Connection Test</h1>
    <button onclick="testAPI()">Test Connection</button>
    <pre id="result"></pre>

    <script>
        async function testAPI() {
            const apiKey = 'YOUR_API_KEY'; // Ganti dengan API key Anda
            const url = `https://webapi.bps.go.id/v1/api/list/model/data/domain/0000/key/${apiKey}`;
            
            try {
                const response = await fetch(url);
                const data = await response.json();
                
                document.getElementById('result').textContent = 
                    JSON.stringify(data, null, 2);
                    
                console.log('✓ Connection successful!');
            } catch (error) {
                document.getElementById('result').textContent = 
                    'Error: ' + error.message;
                    
                console.error('✗ Connection failed:', error);
            }
        }
    </script>
</body>
</html>
```

## Troubleshooting

### Error: "Invalid API Key"

**Solusi:**
1. Pastikan API key sudah benar
2. Cek apakah sudah verifikasi email
3. Login ke dashboard BPS dan regenerate key

### Error: 429 Too Many Requests

**Solusi:**
1. Tunggu beberapa menit
2. Enable caching di konfigurasi
3. Kurangi frekuensi refresh data

### Error: CORS

**Solusi:**
BPS API biasanya sudah mengizinkan CORS. Jika masih ada masalah:
1. Jalankan melalui web server (bukan file://)
2. Gunakan proxy server jika diperlukan

### Data Tidak Sesuai Format

**Solusi:**
1. Cek struktur response dari BPS
2. Sesuaikan fungsi `transformBPSData()` di `app.js`
3. Log response untuk debugging:
   ```javascript
   console.log('BPS Response:', bpsResponse);
   ```

## Best Practices

1. **Jangan hardcode API key di kode**
   - Gunakan file konfigurasi terpisah
   - Tambahkan ke .gitignore

2. **Gunakan caching**
   - Set cache duration sesuai kebutuhan
   - Clear cache saat update data

3. **Handle errors gracefully**
   - Selalu sediakan fallback
   - Informasikan user jika terjadi error

4. **Monitor API usage**
   - Log setiap API call
   - Track rate limit

5. **Update data secara periodik**
   - Schedule update otomatis
   - Implementasi background sync

## Resources

- [BPS WebAPI Documentation](https://webapi.bps.go.id/documentation/)
- [BPS Data Portal](https://www.bps.go.id)
- [Subject Code List](https://webapi.bps.go.id/subject/)

## Support

Jika mengalami kesulitan:
1. Cek dokumentasi resmi BPS
2. Hubungi support BPS: [webapi@bps.go.id]
3. Review console logs untuk error messages
