"""
Generate Transmigration Area GeoJSON from Shapefile
===================================================

Membaca file kawasan-transmigrasi.json (template data desa transmigrasi)
dan mengekstrak geometri dari shapefile Batas_Wilayah_KelurahanDesa_10K_AR.shp
untuk menghasilkan GeoJSON yang ringan untuk overlay di peta Leaflet.

Usage:
    python scripts/generate-transmigrasi-geojson.py

Output:
    frontend/data-kawasan-transmigrasi.geojson
"""

import json
import os
import sys
import time

try:
    import geopandas as gpd
    from shapely.geometry import mapping
except ImportError:
    print("ERROR: geopandas dan shapely diperlukan.")
    print("Install: pip install geopandas shapely fiona pyproj")
    sys.exit(1)

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
SHAPEFILE_PATH = os.path.join(ROOT_DIR, "data", "batas desa", "Batas_Wilayah_KelurahanDesa_10K_AR.shp")
TEMPLATE_PATH = os.path.join(ROOT_DIR, "data", "kawasan-transmigrasi.json")
OUTPUT_PATH = os.path.join(ROOT_DIR, "frontend", "data-kawasan-transmigrasi.geojson")

# Geometry simplification tolerance (degrees, ~100m at equator)
SIMPLIFY_TOLERANCE = 0.001


def load_template():
    """Load daftar kode desa transmigrasi dari template JSON."""
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    desa_list = data.get('desa_transmigrasi', [])
    if not desa_list:
        print("WARNING: Tidak ada desa dalam template kawasan-transmigrasi.json")
        return [], []

    # Build lookup: kdepum -> desa info
    kode_list = []
    desa_info = []
    for d in desa_list:
        # New format uses kdepum; fallback to kdebps for backward compat
        kode = d.get('kdepum', d.get('kdebps', ''))
        kode = str(kode).replace('.', '').replace(' ', '').strip()
        if kode and kode != 'nan':
            kode_list.append(kode)
            desa_info.append(d)

    print(f"Template: {len(kode_list)} desa transmigrasi")
    return kode_list, desa_info


def extract_and_simplify(kode_desa_list):
    """Extract desa geometries from shapefile and simplify."""
    print(f"Loading shapefile: {SHAPEFILE_PATH}")
    print("(File besar ~1.1GB, mohon tunggu...)")

    start = time.time()
    gdf = gpd.read_file(SHAPEFILE_PATH)
    elapsed = time.time() - start
    print(f"Shapefile loaded: {len(gdf)} desa dalam {elapsed:.1f}s")

    # Normalize KDEPUM column (strip dots and spaces)
    gdf['KDEPUM_NORM'] = gdf['KDEPUM'].astype(str).str.replace('.', '', regex=False).str.replace(' ', '', regex=False).str.strip()

    # Filter to transmigration villages using KDEPUM
    mask = gdf['KDEPUM_NORM'].isin(kode_desa_list)
    filtered = gdf[mask].copy()

    print(f"Matched: {len(filtered)} dari {len(kode_desa_list)} kode desa")

    if len(filtered) == 0:
        # Report unmatched codes for debugging
        print("\nKode desa yang tidak ditemukan:")
        for k in kode_desa_list[:10]:
            print(f"  - {k}")
        return None

    # Report unmatched
    matched_pum = set(gdf[mask]['KDEPUM_NORM'].tolist())
    unmatched = set(kode_desa_list) - matched_pum
    if unmatched:
        print(f"\nPeringatan: {len(unmatched)} kode desa tidak ditemukan di shapefile:")
        for k in list(unmatched)[:10]:
            print(f"  - {k}")

    # Simplify geometry for web performance
    print(f"Simplifying geometry (tolerance={SIMPLIFY_TOLERANCE})...")
    filtered['geometry'] = filtered['geometry'].simplify(SIMPLIFY_TOLERANCE, preserve_topology=True)

    # Drop Z coordinate if present (Leaflet doesn't need Z)
    from shapely.ops import transform as shapely_transform
    def drop_z(geom):
        from shapely.geometry import shape
        from shapely import wkt
        return shape(json.loads(json.dumps(mapping(geom))))  # Round-trip removes Z

    # Helper to sanitize NaN/None values for JSON
    import math
    def safe_str(val, default=''):
        if val is None:
            return default
        s = str(val)
        if s in ('nan', 'NaN', 'None', ''):
            return default
        return s

    def safe_float(val, default=0):
        if val is None:
            return default
        try:
            f = float(val)
            return default if math.isnan(f) or math.isinf(f) else round(f, 2)
        except (ValueError, TypeError):
            return default

    # Build GeoJSON manually to control output
    features = []
    for _, row in filtered.iterrows():
        geom = row['geometry']
        # Remove Z coordinates by converting through GeoJSON
        geom_json = mapping(geom)
        # Strip Z values from coordinates
        geom_json = strip_z_coordinates(geom_json)

        nama = safe_str(row.get('WADMKD')) or safe_str(row.get('NAMOBJ'))

        feature = {
            "type": "Feature",
            "properties": {
                "kode_desa": safe_str(row.get('KDEPUM')) or safe_str(row.get('KDEBPS')),
                "nama_desa": nama,
                "kecamatan": safe_str(row.get('WADMKC')),
                "kabupaten": safe_str(row.get('WADMKK')),
                "provinsi": safe_str(row.get('WADMPR')),
                "luas_km2": safe_float(row.get('LUAS'))
            },
            "geometry": geom_json
        }
        features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    return geojson


def strip_z_coordinates(geom):
    """Recursively strip Z coordinates from GeoJSON geometry."""
    geom_type = geom.get('type', '')
    coords = geom.get('coordinates')

    if coords is None:
        # GeometryCollection
        if 'geometries' in geom:
            geom['geometries'] = [strip_z_coordinates(g) for g in geom['geometries']]
        return geom

    def strip_z_from_coord(coord):
        """Strip Z from a single coordinate tuple."""
        if isinstance(coord, (list, tuple)):
            if len(coord) > 0 and isinstance(coord[0], (int, float)):
                # This is a coordinate point [x, y] or [x, y, z]
                return list(coord[:2])
            else:
                # This is a list of coordinates
                return [strip_z_from_coord(c) for c in coord]
        return coord

    geom['coordinates'] = strip_z_from_coord(coords)
    return geom


def generate_demo_geojson():
    """Generate a small demo GeoJSON without requiring the shapefile."""
    print("Generating demo GeoJSON (shapefile tidak tersedia atau template kosong)...")

    # Sample transmigration areas (illustrative polygons)
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "kode_desa": "DEMO001",
                    "nama_desa": "Desa Demo Transmigrasi 1",
                    "kecamatan": "Kecamatan Demo",
                    "kabupaten": "Kabupaten Demo",
                    "provinsi": "Kalimantan Selatan",
                    "luas_km2": 15.5
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[115.4, -3.3], [115.45, -3.3], [115.45, -3.25], [115.4, -3.25], [115.4, -3.3]]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "kode_desa": "DEMO002",
                    "nama_desa": "Desa Demo Transmigrasi 2",
                    "kecamatan": "Kecamatan Demo",
                    "kabupaten": "Kabupaten Demo",
                    "provinsi": "Kalimantan Timur",
                    "luas_km2": 22.3
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[116.8, -1.5], [116.85, -1.5], [116.85, -1.45], [116.8, -1.45], [116.8, -1.5]]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "kode_desa": "DEMO003",
                    "nama_desa": "Desa Demo Transmigrasi 3",
                    "kecamatan": "Kecamatan Demo",
                    "kabupaten": "Kabupaten Demo",
                    "provinsi": "Sulawesi Tengah",
                    "luas_km2": 18.7
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[121.5, -1.4], [121.55, -1.4], [121.55, -1.35], [121.5, -1.35], [121.5, -1.4]]]
                }
            }
        ]
    }
    return geojson


def main():
    print("=" * 60)
    print("Generate Kawasan Transmigrasi GeoJSON")
    print("=" * 60)

    # Check if shapefile exists
    shapefile_exists = os.path.exists(SHAPEFILE_PATH)
    if not shapefile_exists:
        print(f"WARNING: Shapefile tidak ditemukan: {SHAPEFILE_PATH}")

    # Load template
    kode_desa_list, desa_info = load_template()

    if kode_desa_list and shapefile_exists:
        # Extract real data from shapefile
        geojson = extract_and_simplify(kode_desa_list)
        if geojson is None:
            print("\nFallback ke demo GeoJSON...")
            geojson = generate_demo_geojson()
    else:
        # Generate demo data
        geojson = generate_demo_geojson()

    # Add metadata from kawasan-transmigrasi.json
    try:
        with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
            tmpl = json.load(f)
        if 'metadata' in tmpl:
            geojson['metadata'] = tmpl['metadata']
    except:
        pass

    # Write output
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False)

    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"\nOutput: {OUTPUT_PATH}")
    print(f"Size: {file_size / 1024:.1f} KB")
    print(f"Features: {len(geojson['features'])}")
    print("Done!")


if __name__ == '__main__':
    main()
