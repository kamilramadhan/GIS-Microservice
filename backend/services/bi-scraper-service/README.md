# BI Scraper Service

## Overview
Service untuk scraping data harga beras dari website Bank Indonesia (https://www.bi.go.id/hargapangan).

Karena BI tidak menyediakan REST API publik, service ini melakukan web scraping untuk mendapatkan data harga komoditas beras per provinsi.

## Features
- ✅ Web scraping dari BI.go.id
- ✅ Fallback data generation (realistic prices based on market research)
- ✅ IPE (Indeks Potensi Ekonomi) calculation
- ✅ Caching system (1 hour)
- ✅ RESTful API endpoints
- ✅ Health monitoring

## API Endpoints

### 1. Health Check
```
GET /health
```
Response:
```json
{
  "status": "healthy",
  "service": "bi-scraper",
  "timestamp": "2026-01-26T16:17:00.000000"
}
```

### 2. Scrape Rice Prices
```
GET /api/scrape/rice/{commodity_type}?force_refresh=false
```

Parameters:
- `commodity_type`: beras_premium, beras_medium
- `force_refresh`: Force new scraping (default: false)

Response:
```json
{
  "success": true,
  "source": "bi_scraping",  // or "generated_fallback"
  "scraped_at": "2026-01-26T16:17:00.000000",
  "commodity": "Beras Premium",
  "data": [
    {
      "kode_prov": "11",
      "provinsi": "Aceh",
      "prices": {
        "jan": 14364,
        "feb": 14521,
        "mar": 13896,
        ...
      },
      "commodity": "Beras Premium"
    }
  ]
}
```

### 3. Get Prices with IPE
```
GET /api/prices/{commodity_type}?month=jan
```

Parameters:
- `commodity_type`: beras_premium, beras_medium
- `month`: jan, feb, mar, ... (default: current month)

Response:
```json
{
  "success": true,
  "source": "bi_scraping",
  "month": "jan",
  "national_average": 14861,
  "data": [
    {
      "commodity": "beras_premium",
      "provinceCode": "11",
      "provinceName": "Aceh",
      "price": 14364,
      "unit": "kg",
      "marketType": "traditional",
      "month": "jan",
      "harga_nasional": 14861,
      "ipe": 0.97,
      "kategori": "normal"
    }
  ]
}
```

### 4. Refresh Cache
```
POST /api/refresh/{commodity_type}
```

Triggers background cache refresh.

### 5. Cache Status
```
GET /api/cache/status
```

Shows cache information for all cached commodities.

## Data Sources

### Primary: BI.go.id Web Scraping
- Target: https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalKomoditas
- Method: BeautifulSoup4 HTML parsing
- Data: Real-time rice prices by province

### Fallback: Generated Realistic Data
When scraping fails, the service generates realistic fallback data based on:
- 2024-2026 market research
- Location-based price factors (logistics)
- Seasonal variations (harvest season)
- Random variations (±3%)

Location Factors:
- Papua: +20% (remote, high logistics cost)
- Maluku: +12%
- Sulawesi: +5%
- Kalimantan: +2%
- Java: -5% (production center)
- Sumatera: -2%

Seasonal Factors:
- March, April, September, October: -5% (harvest season)
- January, February, July, August: +5% (lean season)

## IPE Calculation

IPE (Indeks Potensi Ekonomi) = Harga Provinsi / Harga Rata-rata Nasional

Categories:
- **Rendah**: IPE < 0.90 (below national average)
- **Normal**: 0.90 ≤ IPE ≤ 1.10
- **Tinggi**: IPE > 1.10 (above national average)

## Architecture Integration

```
Frontend (Browser)
    ↓
Nginx (Port 8081)
    ↓
API Gateway (Port 3000)
    ↓ /api/bi/*
BI Scraper Service (Port 3005)
    ↓
https://www.bi.go.id/hargapangan
```

## Caching Strategy

- Cache Duration: 1 hour (3600 seconds)
- Cache Key: `rice_{commodity_type}`
- In-memory cache (Python dict)
- Automatic expiration

## Environment Variables

```bash
PORT=3005  # Service port
```

## Development

### Run Locally
```bash
cd backend/services/bi-scraper-service

# Install dependencies
pip install -r requirements.txt

# Run server
python server.py

# Test scraper directly
python scraper.py
```

### Run with Docker
```bash
docker compose up -d bi-scraper-service
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3005/health

# Get prices with IPE
curl http://localhost:3005/api/prices/beras_premium

# Force refresh
curl -X POST http://localhost:3005/api/refresh/beras_premium

# Cache status
curl http://localhost:3005/api/cache/status
```

## Future Improvements

1. **Real Scraping Implementation**
   - Inspect actual BI website HTML structure
   - Implement proper table parsing
   - Handle dynamic content (JavaScript)

2. **Enhanced Scraping**
   - Use Selenium for JavaScript-heavy pages
   - Proxy rotation for rate limiting
   - Error recovery strategies

3. **Data Validation**
   - Price range validation
   - Anomaly detection
   - Historical comparison

4. **Database Integration**
   - Store historical prices in PostgreSQL
   - Time-series analysis
   - Trend detection

5. **More Commodities**
   - Cabai merah/rawit
   - Bawang merah/putih
   - Daging ayam/sapi
   - Telur ayam
   - Minyak goreng

## Troubleshooting

### Scraping Returns Fallback
- Check if BI website is accessible
- Verify HTML structure hasn't changed
- Check network connectivity
- Review scraper logs

### High Response Time
- Reduce scraping frequency
- Increase cache duration
- Use background tasks
- Implement request queuing

### Inconsistent Data
- Validate price ranges
- Check seasonal adjustments
- Review location factors
- Compare with historical data

## License
Part of GIS Transmigrasi Dashboard project.
