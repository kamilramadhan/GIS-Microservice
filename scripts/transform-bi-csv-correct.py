#!/usr/bin/env python3
import csv
import json
from datetime import datetime

# Province mapping (from CSV row number to code and name)
PROVINCE_MAP = {
    2: ("11", "Aceh"),
    3: ("12", "Sumatera Utara"),
    4: ("13", "Sumatera Barat"),
    5: ("14", "Riau"),
    6: ("21", "Kepulauan Riau"),
    7: ("15", "Jambi"),
    8: ("17", "Bengkulu"),
    9: ("16", "Sumatera Selatan"),
    10: ("19", "Kepulauan Bangka Belitung"),
    11: ("18", "Lampung"),
    12: ("36", "Banten"),
    13: ("32", "Jawa Barat"),
    14: ("31", "DKI Jakarta"),
    15: ("33", "Jawa Tengah"),
    16: ("34", "DI Yogyakarta"),
    17: ("35", "Jawa Timur"),
    18: ("51", "Bali"),
    19: ("52", "Nusa Tenggara Barat"),
    20: ("53", "Nusa Tenggara Timur"),
    21: ("61", "Kalimantan Barat"),
    22: ("63", "Kalimantan Selatan"),
    23: ("62", "Kalimantan Tengah"),
    24: ("64", "Kalimantan Timur"),
    25: ("65", "Kalimantan Utara"),
    26: ("75", "Gorontalo"),
    27: ("73", "Sulawesi Selatan"),
    28: ("74", "Sulawesi Tenggara"),
    29: ("72", "Sulawesi Tengah"),
    30: ("71", "Sulawesi Utara"),
    31: ("76", "Sulawesi Barat"),
    32: ("81", "Maluku"),
    33: ("82", "Maluku Utara"),
    34: ("94", "Papua"),
    35: ("91", "Papua Barat"),
}

MONTH_NAMES = {
    1: "jan", 2: "feb", 3: "mar", 4: "apr", 5: "may", 6: "jun",
    7: "jul", 8: "aug", 9: "sep", 10: "oct", 11: "nov", 12: "dec"
}

def parse_price(price_str):
    """Convert price string with comma to float"""
    if price_str == "-" or price_str == "":
        return 0
    return float(price_str.replace(",", ""))

print("[1] Reading CSV...")
csv_path = "../data/Tabel Harga Berdasarkan Komoditas (1).csv"

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter=';')
    rows = list(reader)

print(f"    CSV loaded: {len(rows)} rows, {len(rows[0])} columns")

# Extract headers and dates
headers = rows[0]
dates = []
for col in headers[2:]:  # Skip No and Komoditas
    month, year = col.split('/')
    dates.append((int(year), int(month)))

print(f"    Parsed {len(dates)} dates ✅")
print(f"    Date range: {dates[0][0]}-{dates[0][1]:02d} to {dates[-1][0]}-{dates[-1][1]:02d}")

# Extract national average (row 1, after header row 0)
national_avg_row = rows[1]  # "I;Semua Provinsi;..."
national_prices_by_month = {}  # {(year, month): price}

for col_idx in range(2, len(national_avg_row)):
    year, month = dates[col_idx - 2]
    price = parse_price(national_avg_row[col_idx])
    national_prices_by_month[(year, month)] = price

print(f"[2] National averages extracted: {len(national_prices_by_month)} months")
for (year, month), price in sorted(national_prices_by_month.items())[:3]:
    print(f"    {year}-{month:02d}: {price}")

# Build data structure by year
data_by_year = {}

for row_idx, row in enumerate(rows[2:], start=2):  # Skip header and national avg row
    if row_idx not in PROVINCE_MAP:
        continue

    province_code, province_name = PROVINCE_MAP[row_idx]

    # Process each month
    for col_idx in range(2, len(row)):
        year, month = dates[col_idx - 2]
        month_key = MONTH_NAMES[month]

        if year not in data_by_year:
            data_by_year[year] = {
                "metadata": {
                    "source": "Bank Indonesia - Harga Pangan",
                    "commodity": "Beras (Semua Kualitas)",
                    "unit": "Rupiah per Kg",
                    "data_type": "monthly",
                    "note": "Data harga historis dari Pasar Tradisional",
                    "last_update": "2026-02-19 22:36:35"
                },
                "national_averages": {},  # Store per-month national averages
                "data": []
            }

        # Store national average for this month
        if not (year, month) in data_by_year[year]["national_averages"]:
            data_by_year[year]["national_averages"][(year, month)] = national_prices_by_month.get((year, month), 0)

        # Find or create province entry
        province_entry = None
        for entry in data_by_year[year]["data"]:
            if entry["province_code"] == province_code:
                province_entry = entry
                break

        if province_entry is None:
            province_entry = {
                "province_code": province_code,
                "province_name": province_name,
                "jan": 0, "feb": 0, "mar": 0, "apr": 0, "may": 0, "jun": 0,
                "jul": 0, "aug": 0, "sep": 0, "oct": 0, "nov": 0, "dec": 0,
            }
            data_by_year[year]["data"].append(province_entry)

        # Set price
        province_entry[month_key] = parse_price(row[col_idx])

print(f"[3] Processing {len(data_by_year)} years...")
for year in sorted(data_by_year.keys()):
    print(f"    {year}: {len(data_by_year[year]['data'])} provinces, {len(data_by_year[year]['national_averages'])} months")

# Convert national_averages dict to simple dict with month keys
for year in data_by_year:
    natl_avg = {}
    for month in range(1, 13):
        month_key = MONTH_NAMES[month]
        natl_avg[month_key] = data_by_year[year]["national_averages"].get((year, month), 0)
    data_by_year[year]["national_averages"] = natl_avg

# Save JSON
output_path = "../frontend/data-harga-beras-bi-historical.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(data_by_year, f, indent=2, ensure_ascii=False)

print(f"✓ Saved: {output_path}")

# Verify
print(f"[4] Verification:")
for year in sorted(data_by_year.keys()):
    sample = data_by_year[year]["data"][2]  # Sumatera Barat (index 2)
    print(f"    {year}: {sample['province_name']}")
    print(f"      Jan price: {sample['jan']}")
    print(f"      National average Jan: {data_by_year[year]['national_averages'].get('jan', 0)}")

print("\n✅ Transform Complete!")
