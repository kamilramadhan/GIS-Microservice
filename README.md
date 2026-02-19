# 🗺️ Dashboard GIS Transmigrasi Indonesia

Dashboard interaktif berbasis peta untuk menganalisis **potensi ekonomi komoditas** di seluruh provinsi Indonesia, dengan overlay **kawasan transmigrasi** dari data SIBARDUKTRANS Kementerian Transmigrasi RI.

![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?logo=javascript)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python)
![BPS](https://img.shields.io/badge/Data-BPS%20WebAPI-blue)
![BI](https://img.shields.io/badge/Data-Bank%20Indonesia-red)

---

## ✨ Fitur Utama

### 1. Commodity Productivity Heatmap (IPP)
- Visualisasi **Indeks Potensi Produktivitas** per provinsi
- Formula: `IPP = Produksi Provinsi ÷ Rata-rata Nasional`
- Data dari **BPS WebAPI** (2019–2026)
- Threshold: Rendah (< 0.90) · Sedang (0.90–1.10) · Tinggi (> 1.10)

### 2. Commodity Economic/Price Heatmap (IPE)
- Visualisasi **Indeks Potensi Ekonomi** berdasarkan harga komoditas
- Formula: `IPE = Harga Wilayah ÷ Harga Nasional`
- Data dari **Bank Indonesia** (scraping harga pangan harian)
- 10 komoditas: Beras Premium/Medium, Cabai Merah/Rawit, Bawang Merah/Putih, Daging Ayam/Sapi, Telur Ayam, Minyak Goreng
- Filter: Pasar Tradisional / Pasar Modern

### 3. Kawasan Transmigrasi Overlay
- **131 desa transmigrasi** dari 25 provinsi (sumber: SIBARDUKTRANS)
- Dicocokkan otomatis dengan shapefile BIG 83.518 desa (88.5% match rate)
- **2 mode tampilan** (A/B testing):
  - **Overlay** — Polygon hijau dashed menampilkan batas desa
  - **Pin** — Marker titik di centroid desa, lebih ringan di zoom jauh
- Popup interaktif: nama desa, kecamatan, kabupaten, provinsi, luas

### 4. Interaktivitas
- Klik provinsi → detail panel (produksi, luas panen, produktivitas, IPP/IPE)
- Slider bulan & dropdown tahun untuk time-series
- Hover highlight dengan tooltip
- Comparison card antar provinsi
- Interpretation box otomatis

---

## 🏗️ Arsitektur

```
Frontend (Vanilla JS + Leaflet.js)
├── index.html          # Layout 3-kolom (kontrol · peta · detail)
├── app.js              # ~2.300 baris — data loading, choropleth, overlay, UI
├── styles.css          # ~1.000 baris — responsive, Inter + JetBrains Mono
└── Data files
    ├── provinsi.json                          # GeoJSON 34 provinsi
    ├── data-produksi-padi-bps.json            # Produksi padi BPS (lokal)
    ├── data-harga-beras-bi-historical.json    # Harga komoditas BI (Jan 2025–Feb 2026)
    └── data-kawasan-transmigrasi.geojson      # 131 polygon desa transmigrasi

Backend (Microservices — Docker Compose)
├── api-gateway/        # Node.js — routing & CORS
├── price-service/      # Node.js — proxy harga BI
├── production-service/ # (reserved)
├── analytics-service/  # Go — analitik (reserved)
└── bi-scraper-service/ # Python — scraper harga pangan BI.go.id

Scripts (Data Processing)
├── match-transmigrasi-desa.py          # Matching nama desa transmigrasi ↔ shapefile
├── generate-transmigrasi-geojson.py    # Ekstrak geometri → GeoJSON ringan (258 KB)
├── transform-bps-data.js              # Transform data BPS → format frontend
├── transform-bi-csv-correct.py        # Transform CSV harga BI → JSON
└── scrape-bi-harga-pangan.ipynb       # Notebook scraping harga BI
```

---

## 🚀 Quick Start

### Frontend (tanpa backend)

```bash
cd frontend
python -m http.server 8080
# Buka http://localhost:8080
```

Dashboard langsung jalan dengan data lokal (BPS + BI sudah di-bundle).

### Full Stack (dengan Docker)

```bash
docker-compose up -d
# Frontend: http://localhost:8080
# API Gateway: http://localhost:3000
```

---

## 📊 Data Pipeline

### BPS Production Data
```
BPS WebAPI → transform-bps-data.js → data-produksi-padi-bps.json → IPP choropleth
```

### BI Price Data
```
BI.go.id → scrape-bi-harga-pangan.ipynb → CSV → transform-bi-csv-correct.py → data-harga-beras-bi-historical.json → IPE choropleth
```

### Kawasan Transmigrasi
```
SIBARDUKTRANS (190+ lokasi)
    ↓ match-transmigrasi-desa.py (fuzzy matching)
Shapefile BIG 83.518 desa
    ↓ generate-transmigrasi-geojson.py (simplify + strip Z)
data-kawasan-transmigrasi.geojson (131 polygon, 258 KB)
```

**Matching result:**
| Method | Count |
|--------|-------|
| Exact match | 84 |
| Fuzzy/contains | 54 |
| No match | 18 |
| **Total** | **138/156 (88.5%)** |

---

## 🗂️ Struktur Data

### `data/kawasan-transmigrasi.json`
```json
{
  "metadata": {
    "source": "SIBARDUKTRANS + Shapefile BIG 2023",
    "total_matched": 138,
    "match_stats": { "exact": 84, "fuzzy": 54, "unmatched": 18 }
  },
  "desa_transmigrasi": [
    {
      "kdepum": "52.07.04.2003",
      "nama_desa": "Tongo",
      "provinsi": "Nusa Tenggara Barat",
      "kabupaten": "Sumbawa Barat",
      "kecamatan": "Sekongkang",
      "match_type": "exact"
    }
  ]
}
```

### IPP & IPE Formula
| Indeks | Formula | Rendah | Sedang | Tinggi |
|--------|---------|--------|--------|--------|
| IPP | Produksi Prov ÷ Avg Nasional | < 0.90 | 0.90–1.10 | > 1.10 |
| IPE | Harga Wilayah ÷ Harga Nasional | < 0.90 | 0.90–1.10 | > 1.10 |

---

## ⚙️ Konfigurasi

Konfigurasi utama di `frontend/app.js`:

| Config | Default | Keterangan |
|--------|---------|------------|
| `SKIP_BPS_API` | `true` | Langsung pakai data lokal (skip CORS) |
| `USE_BI_LOCAL_DATA` | `true` | Pakai data BI lokal hasil scraping |
| `SIMPLIFY_TOLERANCE` | `0.001` | Toleransi simplifikasi geometri (~100m) |

---

## 🛠️ Regenerasi Data Transmigrasi

Jika data shapefile atau daftar transmigrasi berubah:

```bash
# 1. Matching nama desa → shapefile (memerlukan shapefile BIG di data/batas desa/)
python scripts/match-transmigrasi-desa.py

# 2. Generate GeoJSON dari hasil matching
python scripts/generate-transmigrasi-geojson.py
```

**Prasyarat Python:** `geopandas`, `shapely`, `fiona`, `pyproj`

---

## 📁 File Penting

| File | Ukuran | Deskripsi |
|------|--------|-----------|
| `frontend/app.js` | ~2.300 baris | Logic utama dashboard |
| `frontend/data-kawasan-transmigrasi.geojson` | 258 KB | 131 polygon desa transmigrasi |
| `frontend/data-harga-beras-bi-historical.json` | — | Harga 10 komoditas, Jan 2025–Feb 2026 |
| `data/transmigrasi-matched.json` | — | 138 desa yang berhasil dicocokkan |
| `data/transmigrasi-no-match.json` | — | 18 desa yang perlu review manual |
| `data/batas desa/` | ~1.1 GB | Shapefile BIG (tidak di-commit, .gitignore) |

---

## 📌 Tech Stack

- **Frontend:** Vanilla JavaScript, Leaflet.js 1.9.4, CSS3
- **Fonts:** Inter (UI) + JetBrains Mono (data/angka)
- **Data:** BPS WebAPI, Bank Indonesia, SIBARDUKTRANS, Shapefile BIG
- **Backend:** Node.js, Python, Go (microservices via Docker)
- **Infra:** Docker Compose, Nginx, Kubernetes configs
- **Geo Processing:** GeoPandas, Shapely, Fiona

---

*Data terakhir di-update: Februari 2026*
