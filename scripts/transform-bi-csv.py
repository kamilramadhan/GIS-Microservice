#!/usr/bin/env python3
import json
from datetime import datetime
import csv

# Province mapping
PROVINCE_CODE_MAPPING = {
    'Aceh': '11', 'Sumatera Utara': '12', 'Sumatera Barat': '13', 'Riau': '14', 'Jambi': '15',
    'Sumatera Selatan': '16', 'Bengkulu': '17', 'Lampung': '18', 'Kepulauan Bangka Belitung': '19', 'Kepulauan Riau': '21',
    'DKI Jakarta': '31', 'Jawa Barat': '32', 'Jawa Tengah': '33', 'DI Yogyakarta': '34', 'Jawa Timur': '35', 'Banten': '36',
    'Bali': '51', 'Nusa Tenggara Barat': '52', 'Nusa Tenggara Timur': '53',
    'Kalimantan Barat': '61', 'Kalimantan Tengah': '62', 'Kalimantan Selatan': '63', 'Kalimantan Timur': '64', 'Kalimantan Utara': '65',
    'Sulawesi Utara': '71', 'Sulawesi Tengah': '72', 'Sulawesi Selatan': '73', 'Sulawesi Tenggara': '74', 'Gorontalo': '75', 'Sulawesi Barat': '76',
    'Maluku': '81', 'Maluku Utara': '82', 'Papua': '94', 'Papua Barat': '91'
}

csv_file = '../data/Tabel Harga Berdasarkan Komoditas (1).csv'

print("="*70)
print("Transform BI CSV → Economic Heatmap Format")
print("="*70)

# Read CSV
all_rows = []
headers = []
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter=';')
    for i, row in enumerate(reader):
        if i == 0:
            headers = row
        else:
            all_rows.append(row)

print(f"\n[1] CSV Loaded: {len(all_rows)} rows, {len(headers)} columns")

# Parse dates (MM/YYYY format)
date_headers = headers[2:]
parsed_dates = []
for date_str in date_headers:
    try:
        date_clean = date_str.strip()
        parts = date_clean.split('/')
        # Format: MM/YYYY
        date_obj = datetime(int(parts[1]), int(parts[0]), 1)
        parsed_dates.append(date_obj)
    except:
        parsed_dates.append(None)

print(f"    Parsed {len([d for d in parsed_dates if d])} dates")

# Organize by period
data_by_period = {}
print(f"\n[2] Processing {len(all_rows)} provinces...")

for row in all_rows:
    if len(row) < 2:
        continue

    province_name = row[1].strip()
    if 'semua' in province_name.lower():
        continue

    prov_code = PROVINCE_CODE_MAPPING.get(province_name)
    if not prov_code:
        print(f"    ⚠ Not mapped: {province_name}")
        continue

    for date_idx, date_obj in enumerate(parsed_dates):
        if date_obj is None or (2 + date_idx) >= len(row):
            continue

        year_month = date_obj.strftime('%Y-%m')
        month_key = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'][date_obj.month-1]

        if year_month not in data_by_period:
            data_by_period[year_month] = {
                'year': date_obj.year,
                'month': date_obj.month,
                'provinces': {}
            }

        try:
            price_str = row[2 + date_idx].replace(',', '').strip()
            price = float(price_str) if price_str not in ['-', '', 'nan'] else 0
        except:
            price = 0

        if prov_code not in data_by_period[year_month]['provinces']:
            data_by_period[year_month]['provinces'][prov_code] = {
                'province_code': prov_code,
                'province_name': province_name,
                'price': price
            }

print(f"    Found {len(data_by_period)} periods")

# Transform to frontend format
print(f"\n[3] Transform to frontend format...")

frontend_data = {}
for year_month in sorted(data_by_period.keys()):
    period_data = data_by_period[year_month]
    year = str(period_data['year'])
    month = period_data['month']
    month_key = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'][month-1]

    if year not in frontend_data:
        frontend_data[year] = {
            'metadata': {
                'source': 'Bank Indonesia - Harga Pangan',
                'commodity': 'Beras (Semua Kualitas)',
                'unit': 'Rupiah per Kg',
                'data_type': 'monthly',
                'note': 'Data harga historis dari Pasar Tradisional'
            },
            'data': {}
        }

    for prov_code, prov_data in period_data['provinces'].items():
        if prov_code not in frontend_data[year]['data']:
            frontend_data[year]['data'][prov_code] = {
                'province_code': prov_code,
                'province_name': prov_data['province_name'],
                'jan': 0, 'feb': 0, 'mar': 0, 'apr': 0, 'may': 0, 'jun': 0,
                'jul': 0, 'aug': 0, 'sep': 0, 'oct': 0, 'nov': 0, 'dec': 0
            }

        if prov_data['price'] > 0:
            frontend_data[year]['data'][prov_code][month_key] = round(prov_data['price'], 2)

# Convert to list
for year in frontend_data:
    frontend_data[year]['data'] = list(frontend_data[year]['data'].values())
    frontend_data[year]['metadata']['last_update'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

# Save
output_file = '../frontend/data-harga-beras-bi-historical.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(frontend_data, f, ensure_ascii=False, indent=2)

print(f"\n✓ Saved: {output_file}")

# Preview
print(f"\n[4] Preview:")
for year in sorted(frontend_data.keys()):
    provinces = frontend_data[year]['data']
    print(f"    {year}: {len(provinces)} provinces")
    if provinces:
        sample = provinces[0]
        prices = {m: sample[m] for m in ['jan','feb','mar'] if sample[m] > 0}
        print(f"      Sample {sample['province_code']}: {prices}")

print("\n" + "="*70)
print("✅ Transform Complete!")
print("="*70)
