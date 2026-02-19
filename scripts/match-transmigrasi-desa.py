"""
Script untuk mencocokkan nama desa transmigrasi dengan shapefile BIG
"""
import geopandas as gpd
import pandas as pd
import json
import re
from difflib import SequenceMatcher

print("="*80)
print("MENCOCOKKAN DESA TRANSMIGRASI DENGAN SHAPEFILE BIG")
print("="*80)

# ============================================================
# 1. Load Shapefile
# ============================================================
print("\n[1] Loading shapefile (±1.1 GB, sabar ya)...")
shp_path = r"d:\GIS-Microservice\data\batas desa\Batas_Wilayah_KelurahanDesa_10K_AR.shp"
gdf = gpd.read_file(shp_path)

print(f"    Total desa di shapefile: {len(gdf):,}")
print(f"    Columns: {list(gdf.columns)}")
print(f"\n    Sample data (5 baris):")
print(gdf[['KDEPUM', 'NAMOBJ', 'WADMPR', 'WADMKK', 'WADMKC']].head())

# ============================================================
# 2. Daftar Desa Transmigrasi per Provinsi
# ============================================================
print("\n[2] Menyiapkan daftar desa transmigrasi...")

DESA_TRANSMIGRASI = {
    "Aceh": [
        "ALUE KEUMUNENG", "GOSONG TELAGA", "COT KRUET", "ALUE KUTA",
        "GAMPONG DATA CUT", "ALUE PUNTI", "BERATA", "SAMAR KILANG",
        "DARUSSALAM", "LANGKAHAN", "PANTE CERMIN", "SIGULAI",
        "PANTE CEUREUMEN", "BUKIT HANGU", "SUBUSSALAM",
        "KETUBONG TUNONG", "BUKET HAGU", "PUNTI PAYONG",
        "GEUMPANG", "GUNONG MEUSANAH", "KEUTUBONG TUNONG",
        "LAMPOH LADA", "RELAS PAMEU", "TEGET", "UJONG TANOH",
        "PINTU RIME GAYO", "DATA CUT"
    ],
    "Sumatera Barat": [
        "PADANG TAROK", "SIJUNJUNG"
    ],
    "Riau": [
        "MAKERUH"
    ],
    "Jambi": [
        "SEPINTUN"
    ],
    "Sumatera Selatan": [
        "JUD NGANTI", "SRI AGUNG", "TANABANG", "JATI SARI",
        "TEMPIRAI SELATAN", "KEBAN AGUNG", "SIMPANG TIGA"
    ],
    "Bengkulu": [
        "BUKIT MERBAU", "KEDATARAN", "MALAKONI"
    ],
    "Kepulauan Bangka Belitung": [
        "JEBUS"
    ],
    "Nusa Tenggara Barat": [
        "TONGO"
    ],
    "Nusa Tenggara Timur": [
        "KOTAKAWAW", "PALAHONANG", "SANABIBI", "LIDOR",
        "REMASINGFUI", "PEIBULAK", "LOONUNA", "ULUKLUBUK",
        "WEMARINGI", "YUBUWAI", "IKISEO GEZU", "KAPITAN MEO",
        "LAIMBARU", "LONGGE", "RUMBA", "LA'TAPU RUMBU", "REMANGSIFUI"
    ],
    "Kalimantan Barat": [
        "SIMPANG TIGA", "SUNGAI BERUANG", "KETUNGAU HULU",
        "SEMUNYING", "TANJUNG SANTAI", "TANJUNG SATAI",
        "NANGA BAYAN", "SEBETUNG PALUK", "NANGA KALIS",
        "BOYAN TANJUNG", "KELILING SEMULUNG"
    ],
    "Kalimantan Tengah": [
        "DADAHUP", "KAHINGAI"
    ],
    "Kalimantan Selatan": [
        "ANGSANA", "ANGASANA"
    ],
    "Kalimantan Timur": [
        "BATU AMPAR", "TEPIAN LANGSAT", "KLADEN", "KELADEN", "PASER"
    ],
    "Kalimantan Utara": [
        "SEPUNGGUR", "TANJUNG BUKA", "SAMBUNGAN"
    ],
    "Sulawesi Utara": [
        "MOTONGKAD", "WIOI"
    ],
    "Sulawesi Tengah": [
        "TORIRE", "KINDADAL", "BULUPOUNTU", "BOLUPUNTO", "KANCU'U",
        "KABERA", "DUNGKEAN", "BAHOEA", "RENO RENO", "JANJA",
        "UETANGKO", "SIDERA", "LEMBAN TANGOA", "TOKALA ATAS",
        "TOKALA", "MOIAN", "UMPANGA"
    ],
    "Sulawesi Selatan": [
        "LAGADING", "MAHALONA", "SUPI", "BEKKAE", "WALA",
        "LANTANG TALANG", "TANAKEKE", "WATU"
    ],
    "Sulawesi Tenggara": [
        "PUUHIALU", "PULUHIALU", "RAIMUNA", "KOLAKA", "RODA",
        "ANAUWA", "LAPOKAMATA", "PARUDONGKA", "LAKABU", "MOMUNTU",
        "WATUTINAWU", "LAEYA", "TONGAUNA", "PADALERE", "POHORUA"
    ],
    "Gorontalo": [
        "LITO", "BUKIT AREN", "MOTIHELUMO", "SANDALAN",
        "AYUMOLINGO", "PANGEA"
    ],
    "Sulawesi Barat": [
        "TANJUNG CINA", "SALUANDEAN", "SALUNDEANG", "RANO",
        "PIRIAN TAPIKO", "SINYONYOI", "ULUMANDA", "SALULISU", "RATTE"
    ],
    "Maluku": [
        "AIRMATAKABO", "SARI PUTIH"
    ],
    "Maluku Utara": [
        "WALEH", "MODAPUHI", "MURNI", "SUBAIM", "PATLEAN"
    ],
    "Papua": [
        "SENGGI"
    ],
    "Papua Barat": [
        "TOMAGE", "AURMIOS", "MEYES", "DEMBEK", "WERIANGGI",
        "MAIBUKI", "AITREM"
    ],
    "Papua Selatan": [
        "MUTING"
    ]
}

total_desa = sum(len(v) for v in DESA_TRANSMIGRASI.values())
print(f"    Total desa transmigrasi (unik): {total_desa}")
print(f"    Total provinsi: {len(DESA_TRANSMIGRASI)}")

# ============================================================
# 3. Normalisasi nama untuk matching
# ============================================================
def normalize_name(name):
    """Normalisasi nama desa untuk perbandingan"""
    if not name or not isinstance(name, str):
        return ""
    name = name.upper().strip()
    # Hapus SP. X, UPT, dll
    name = re.sub(r'\s+SP\.?\s*\d+\w*', '', name)
    name = re.sub(r'\bUPT\b', '', name)
    name = re.sub(r'\bDESA\b', '', name)
    name = re.sub(r'\bKAMPUNG\b', '', name)
    name = re.sub(r'\bGAMPONG\b', '', name)
    # Hapus karakter khusus
    name = re.sub(r'[^A-Z\s]', '', name)
    # Hapus spasi berlebih
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def similarity(a, b):
    """Hitung similarity ratio antara dua string"""
    return SequenceMatcher(None, a, b).ratio()

# ============================================================
# 4. Mapping nama provinsi shapefile ke daftar
# ============================================================
PROVINCE_MAPPING = {
    "ACEH": "Aceh",
    "SUMATERA BARAT": "Sumatera Barat",
    "SUMATRA BARAT": "Sumatera Barat",
    "RIAU": "Riau",
    "JAMBI": "Jambi",
    "SUMATERA SELATAN": "Sumatera Selatan",
    "SUMATRA SELATAN": "Sumatera Selatan",
    "BENGKULU": "Bengkulu",
    "KEPULAUAN BANGKA BELITUNG": "Kepulauan Bangka Belitung",
    "BANGKA BELITUNG": "Kepulauan Bangka Belitung",
    "NUSA TENGGARA BARAT": "Nusa Tenggara Barat",
    "NUSA TENGGARA TIMUR": "Nusa Tenggara Timur",
    "KALIMANTAN BARAT": "Kalimantan Barat",
    "KALIMANTAN TENGAH": "Kalimantan Tengah",
    "KALIMANTAN SELATAN": "Kalimantan Selatan",
    "KALIMANTAN TIMUR": "Kalimantan Timur",
    "KALIMANTAN UTARA": "Kalimantan Utara",
    "SULAWESI UTARA": "Sulawesi Utara",
    "SULAWESI TENGAH": "Sulawesi Tengah",
    "SULAWESI SELATAN": "Sulawesi Selatan",
    "SULAWESI TENGGARA": "Sulawesi Tenggara",
    "GORONTALO": "Gorontalo",
    "SULAWESI BARAT": "Sulawesi Barat",
    "MALUKU": "Maluku",
    "MALUKU UTARA": "Maluku Utara",
    "PAPUA": "Papua",
    "PAPUA BARAT": "Papua Barat",
    "PAPUA SELATAN": "Papua Selatan",
}

# ============================================================
# 5. Matching desa transmigrasi dengan shapefile
# ============================================================
print("\n[3] Mencocokkan desa transmigrasi dengan shapefile...")
print("="*80)

results = {
    'exact_match': [],
    'fuzzy_match': [],
    'no_match': []
}

matched_codes = []  # Untuk output JSON

for provinsi, desa_list in DESA_TRANSMIGRASI.items():
    print(f"\n{'─'*60}")
    print(f"📍 {provinsi} ({len(desa_list)} desa)")
    print(f"{'─'*60}")

    # Filter shapefile by province
    prov_upper = provinsi.upper()

    # Cari di kolom WADMPR (nama provinsi di shapefile)
    gdf_prov = gdf[gdf['WADMPR'].str.upper().str.contains(prov_upper, na=False)]

    if gdf_prov.empty:
        # Coba variasi nama
        for shp_name, list_name in PROVINCE_MAPPING.items():
            if list_name == provinsi:
                gdf_prov = gdf[gdf['WADMPR'].str.upper().str.contains(shp_name, na=False)]
                if not gdf_prov.empty:
                    break

    if gdf_prov.empty:
        print(f"  ⚠ Provinsi '{provinsi}' TIDAK DITEMUKAN di shapefile!")
        for desa in desa_list:
            results['no_match'].append({
                'provinsi': provinsi,
                'desa_trans': desa,
                'reason': 'Provinsi tidak ditemukan'
            })
        continue

    print(f"  Total desa di shapefile untuk {provinsi}: {len(gdf_prov):,}")

    for desa_trans in desa_list:
        desa_norm = normalize_name(desa_trans)

        # Step 1: Exact match (NAMOBJ)
        exact = gdf_prov[gdf_prov['NAMOBJ'].str.upper().str.strip() == desa_trans.upper().strip()]

        if not exact.empty:
            row = exact.iloc[0]
            print(f"  ✅ EXACT: '{desa_trans}' → {row['NAMOBJ']} ({row['KDEPUM']}) [{row['WADMKK']}, {row['WADMKC']}]")
            results['exact_match'].append({
                'provinsi': provinsi,
                'desa_trans': desa_trans,
                'desa_shp': row['NAMOBJ'],
                'kdepum': row['KDEPUM'],
                'kabupaten': row['WADMKK'],
                'kecamatan': row['WADMKC']
            })
            matched_codes.append({
                'kdepum': row['KDEPUM'],
                'nama_desa': row['NAMOBJ'],
                'provinsi': provinsi,
                'kabupaten': str(row.get('WADMKK', '')),
                'kecamatan': str(row.get('WADMKC', '')),
                'match_type': 'exact'
            })
            continue

        # Step 2: Contains match
        contains = gdf_prov[gdf_prov['NAMOBJ'].str.upper().str.contains(desa_norm, na=False)]

        if not contains.empty and len(desa_norm) >= 4:
            # Jika ada multiple match, ambil yang paling mirip
            best_sim = 0
            best_row = None
            for _, row in contains.iterrows():
                sim = similarity(desa_norm, normalize_name(row['NAMOBJ']))
                if sim > best_sim:
                    best_sim = sim
                    best_row = row

            if best_row is not None and best_sim >= 0.5:
                print(f"  🔍 CONTAINS: '{desa_trans}' → {best_row['NAMOBJ']} ({best_row['KDEPUM']}) [{best_row['WADMKK']}, {best_row['WADMKC']}] (sim={best_sim:.2f})")
                results['fuzzy_match'].append({
                    'provinsi': provinsi,
                    'desa_trans': desa_trans,
                    'desa_shp': best_row['NAMOBJ'],
                    'kdepum': best_row['KDEPUM'],
                    'kabupaten': best_row['WADMKK'],
                    'kecamatan': best_row['WADMKC'],
                    'similarity': best_sim
                })
                matched_codes.append({
                    'kdepum': best_row['KDEPUM'],
                    'nama_desa': best_row['NAMOBJ'],
                    'provinsi': provinsi,
                    'kabupaten': str(best_row.get('WADMKK', '')),
                    'kecamatan': str(best_row.get('WADMKC', '')),
                    'match_type': 'contains',
                    'similarity': best_sim
                })
                continue

        # Step 3: Fuzzy match (similarity >= 0.7)
        best_sim = 0
        best_row = None

        # Sample jika terlalu banyak (performance)
        sample_size = min(len(gdf_prov), 5000)
        gdf_sample = gdf_prov.sample(n=sample_size, random_state=42) if len(gdf_prov) > sample_size else gdf_prov

        for _, row in gdf_sample.iterrows():
            shp_norm = normalize_name(row['NAMOBJ'])
            sim = similarity(desa_norm, shp_norm)
            if sim > best_sim:
                best_sim = sim
                best_row = row

        if best_sim >= 0.7 and best_row is not None:
            print(f"  🔶 FUZZY:  '{desa_trans}' → {best_row['NAMOBJ']} ({best_row['KDEPUM']}) [{best_row['WADMKK']}, {best_row['WADMKC']}] (sim={best_sim:.2f})")
            results['fuzzy_match'].append({
                'provinsi': provinsi,
                'desa_trans': desa_trans,
                'desa_shp': best_row['NAMOBJ'],
                'kdepum': best_row['KDEPUM'],
                'kabupaten': best_row['WADMKK'],
                'kecamatan': best_row['WADMKC'],
                'similarity': best_sim
            })
            matched_codes.append({
                'kdepum': best_row['KDEPUM'],
                'nama_desa': best_row['NAMOBJ'],
                'provinsi': provinsi,
                'kabupaten': str(best_row.get('WADMKK', '')),
                'kecamatan': str(best_row.get('WADMKC', '')),
                'match_type': 'fuzzy',
                'similarity': best_sim
            })
        else:
            # Tampilkan top 3 candidate terdekat
            candidates = []
            for _, row in gdf_sample.iterrows():
                shp_norm = normalize_name(row['NAMOBJ'])
                sim = similarity(desa_norm, shp_norm)
                candidates.append((sim, str(row['NAMOBJ']), str(row['KDEPUM'])))
            candidates.sort(key=lambda x: x[0], reverse=True)
            top3 = candidates[:3]

            print(f"  ❌ NO MATCH: '{desa_trans}' (norm: '{desa_norm}')")
            for sim, name, code in top3:
                print(f"       candidate: {name} ({code}) sim={sim:.2f}")

            results['no_match'].append({
                'provinsi': provinsi,
                'desa_trans': desa_trans,
                'desa_norm': desa_norm,
                'top_candidates': [(name, code, f"{sim:.2f}") for sim, name, code in top3]
            })

# ============================================================
# 6. RINGKASAN
# ============================================================
print("\n" + "="*80)
print("RINGKASAN MATCHING")
print("="*80)
print(f"  ✅ Exact match:   {len(results['exact_match']):3d} desa")
print(f"  🔍 Fuzzy match:   {len(results['fuzzy_match']):3d} desa")
print(f"  ❌ No match:      {len(results['no_match']):3d} desa")
print(f"  {'─'*40}")
print(f"  📊 Total matched: {len(results['exact_match']) + len(results['fuzzy_match'])} / {total_desa} ({(len(results['exact_match']) + len(results['fuzzy_match'])) / total_desa * 100:.1f}%)")

# ============================================================
# 7. Simpan hasil
# ============================================================
# Simpan matched codes ke JSON (untuk generate GeoJSON)
output_matched = r"d:\GIS-Microservice\data\transmigrasi-matched.json"
with open(output_matched, 'w', encoding='utf-8') as f:
    json.dump(matched_codes, f, ensure_ascii=False, indent=2)
print(f"\n✅ Matched codes saved: {output_matched} ({len(matched_codes)} desa)")

# Simpan full report
output_report = r"d:\GIS-Microservice\data\transmigrasi-matching-report.json"
with open(output_report, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2, default=str)
print(f"✅ Full report saved: {output_report}")

# Simpan no-match list untuk review manual
output_nomatch = r"d:\GIS-Microservice\data\transmigrasi-no-match.json"
with open(output_nomatch, 'w', encoding='utf-8') as f:
    json.dump(results['no_match'], f, ensure_ascii=False, indent=2, default=str)
print(f"✅ No-match list saved: {output_nomatch} ({len(results['no_match'])} desa perlu review)")

# ============================================================
# 8. Update kawasan-transmigrasi.json
# ============================================================
kawasan_output = r"d:\GIS-Microservice\data\kawasan-transmigrasi.json"
kawasan_data = {
    "metadata": {
        "source": "SIBARDUKTRANS Kementerian Transmigrasi RI + Shapefile BIG 2023",
        "total_matched": len(matched_codes),
        "total_provinces": len(DESA_TRANSMIGRASI),
        "match_stats": {
            "exact": len(results['exact_match']),
            "fuzzy": len(results['fuzzy_match']),
            "unmatched": len(results['no_match'])
        },
        "generated": pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
    },
    "desa_transmigrasi": matched_codes
}

with open(kawasan_output, 'w', encoding='utf-8') as f:
    json.dump(kawasan_data, f, ensure_ascii=False, indent=2)
print(f"✅ Kawasan transmigrasi updated: {kawasan_output}")

print("\n" + "="*80)
print("SELESAI! Jalankan generate-transmigrasi-geojson.py untuk buat GeoJSON layer")
print("="*80)
