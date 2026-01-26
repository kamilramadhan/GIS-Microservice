# 🚀 Quick Start - Testing Economic Heatmap

## Cara Menjalankan Dashboard

### Opsi 1: Python HTTP Server
```bash
cd /Users/kamil/GIS-Transmigrasi
python3 -m http.server 8000
```
Buka browser: `http://localhost:8000`

### Opsi 2: Live Server (VS Code Extension)
1. Install extension "Live Server"
2. Right-click `index.html`
3. Pilih "Open with Live Server"

### Opsi 3: NPX Serve
```bash
cd /Users/kamil/GIS-Transmigrasi
npx serve
```

## 🧪 Testing Checklist

### 1. Test Dashboard Selector
- [ ] Klik tab "Commodity Productivity Heatmap" → Peta menampilkan produksi padi
- [ ] Klik tab "Commodity Economic/Price Heatmap" → Peta berubah warna (biru/kuning/merah)
- [ ] Tab "Commodity Economic Opportunity Heatmap" → Disabled (coming soon)

### 2. Test Economic Mode Controls
- [ ] Pilih komoditas berbeda (Beras Premium, Cabai Merah, dll) → Peta update
- [ ] Pilih jenis pasar (Tradisional/Modern) → Data reload
- [ ] Ubah bulan → Peta update sesuai periode

### 3. Test Legend
- [ ] Mode Productivity: Legend menampilkan 6 tingkat produksi (ton)
- [ ] Mode Economic: Legend menampilkan 3 kategori IPE dengan interpretasi

### 4. Test Statistics Panel
- [ ] Mode Productivity: Tampil total, rata-rata, tertinggi, terendah
- [ ] Mode Economic: Tampil komoditas, harga rata-rata, distribusi (rendah/normal/tinggi)

### 5. Test Interactive Map
- [ ] Hover provinsi → Border biru, fillOpacity naik
- [ ] Click provinsi → Detail panel update, auto zoom
- [ ] Popup quick view → Tampil harga & IPE (mode economic)

### 6. Test Detail Panel
**Mode Economic:**
- [ ] Tampil nama provinsi & kode
- [ ] Tampil harga wilayah vs harga nasional
- [ ] Tampil selisih (Rp & %)
- [ ] Tampil IPE dengan badge kategori
- [ ] Tampil interpretasi ekonomi otomatis

### 7. Test Responsive Design
- [ ] Desktop (1200px+): 3 kolom layout
- [ ] Tablet (768-1200px): Stack layout
- [ ] Mobile (<768px): Single column, selector tabs vertical

## 🎯 Expected Results

### Commodity Economic/Price Heatmap Mode

#### Color Coding
- **Provinsi Biru**: Harga murah (IPE < 0.90) - Contoh: Jawa Timur, Sulawesi Selatan
- **Provinsi Kuning**: Harga normal (IPE 0.90-1.10) - Contoh: Jawa Barat, Banten
- **Provinsi Merah**: Harga mahal (IPE > 1.10) - Contoh: Papua, Maluku

#### Example: Beras Premium
```
Jawa Barat:  Rp 14,250  →  IPE: 1.02  →  KUNING (Normal)
Papua:       Rp 17,500  →  IPE: 1.25  →  MERAH (Tinggi)
Jawa Timur:  Rp 12,600  →  IPE: 0.90  →  BIRU (Rendah)
```

## 🐛 Troubleshooting

### Peta tidak muncul
**Solusi:**
1. Check console browser (F12)
2. Pastikan file `38 Provinsi Indonesia - Provinsi.json` ada
3. Pastikan tidak ada CORS error

### Data tidak load
**Solusi:**
1. Buka console → Lihat error message
2. Pastikan semua file JS ter-load (app.js, bps-config.dev.js)
3. Clear cache browser (Ctrl+Shift+R)

### Mode switching tidak bekerja
**Solusi:**
1. Check console untuk error JavaScript
2. Pastikan event listener ter-attach
3. Refresh halaman

## 📊 Demo Scenario

### Skenario: Analisis Harga Beras untuk Transmigrasi

1. **Klik tab "Commodity Economic/Price Heatmap"**
2. **Pilih komoditas: "Beras Premium"**
3. **Observasi peta:**
   - Jawa & Sumatera: Mayoritas kuning (harga normal)
   - Papua & Maluku: Merah (harga tinggi +25%)
   - Jawa Timur: Biru/kuning (harga rendah-normal)

4. **Klik provinsi Papua:**
   ```
   Harga Wilayah: Rp 17,500/kg
   Harga Nasional: Rp 14,000/kg
   Selisih: +Rp 3,500 (+25.0%)
   IPE: 1.25 (Tinggi)
   
   Interpretasi: Kawasan ini memiliki harga di atas rata-rata nasional,
   perlu strategi khusus untuk efisiensi biaya.
   ```

5. **Insight:**
   - Papua tidak ideal untuk transmigrasi (biaya hidup tinggi)
   - Jawa Timur/Tengah lebih ekonomis (harga rendah-normal)
   - Strategi: Fokus ke provinsi biru/kuning

## 📸 Screenshot Guidelines

Capture:
1. Dashboard selector dengan 3 tabs
2. Economic mode - peta dengan color coding IPE
3. Detail panel provinsi Papua (contoh harga tinggi)
4. Statistics panel dengan distribusi
5. Responsive mobile view

## ✅ Success Criteria

Dashboard dianggap berhasil jika:
- ✅ Mode switching bekerja smooth
- ✅ Warna peta update sesuai IPE
- ✅ Statistics update per mode
- ✅ Detail panel menampilkan interpretasi ekonomi
- ✅ Responsive di mobile/tablet
- ✅ No console errors

## 📝 Feedback

Jika menemukan bug atau ada saran improvement:
1. Check console error
2. Screenshot issue
3. Note scenario/steps to reproduce

---

**Ready to test!** 🎉
