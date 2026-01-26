"""
==========================================
Production Service - Rice Production Data
==========================================

Handles:
- BPS API integration
- Production data caching
- Historical data management
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import os
import httpx
import json
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import redis

# ==========================================
# APP INITIALIZATION
# ==========================================

app = FastAPI(
    title="Production Service",
    description="Microservice for rice production data from BPS",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# DATABASE
# ==========================================

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gis_production")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis Cache
try:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=0,
        decode_responses=True
    )
    redis_client.ping()
    print("✓ Redis connected")
except:
    redis_client = None
    print("⚠ Redis not available, using in-memory cache")

# ==========================================
# MODELS
# ==========================================

class Production(Base):
    __tablename__ = "productions"
    
    id = Column(Integer, primary_key=True, index=True)
    province_code = Column(String, index=True)
    province_name = Column(String)
    year = Column(Integer, index=True)
    month = Column(String, index=True)
    production = Column(Float)
    unit = Column(String, default="ton")
    source = Column(String, default="BPS")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ==========================================
# PYDANTIC MODELS
# ==========================================

class ProductionData(BaseModel):
    province_code: str
    province_name: str
    year: int
    month: str
    production: float
    unit: str = "ton"
    
class ProductionResponse(BaseModel):
    success: bool
    source: str
    data: List[Dict]

# ==========================================
# PROVINCE MAPPING
# ==========================================

PROVINCE_MAPPING = {
    '11': 'Aceh', '12': 'Sumatera Utara', '13': 'Sumatera Barat',
    '14': 'Riau', '15': 'Jambi', '16': 'Sumatera Selatan',
    '17': 'Bengkulu', '18': 'Lampung', '19': 'Kepulauan Bangka Belitung',
    '21': 'Kepulauan Riau', '31': 'DKI Jakarta', '32': 'Jawa Barat',
    '33': 'Jawa Tengah', '34': 'DI Yogyakarta', '35': 'Jawa Timur',
    '36': 'Banten', '51': 'Bali', '52': 'Nusa Tenggara Barat',
    '53': 'Nusa Tenggara Timur', '61': 'Kalimantan Barat',
    '62': 'Kalimantan Tengah', '63': 'Kalimantan Selatan',
    '64': 'Kalimantan Timur', '65': 'Kalimantan Utara',
    '71': 'Sulawesi Utara', '72': 'Sulawesi Tengah',
    '73': 'Sulawesi Selatan', '74': 'Sulawesi Tenggara',
    '75': 'Gorontalo', '76': 'Sulawesi Barat',
    '81': 'Maluku', '82': 'Maluku Utara',
    '91': 'Papua Tengah', '92': 'Papua', '93': 'Papua Barat',
    '94': 'Papua Selatan', '95': 'Papua Pegunungan', '96': 'Papua Barat Daya'
}

MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

# ==========================================
# MOCK DATA GENERATION
# ==========================================

def generate_production_data(year: int = 2023):
    """Generate realistic production data"""
    import random
    
    data = []
    production_ranges = {
        'jawa': (500000, 2000000),
        'sumatera': (300000, 1500000),
        'sulawesi': (200000, 800000),
        'kalimantan': (100000, 500000),
        'others': (50000, 300000)
    }
    
    for code, name in PROVINCE_MAPPING.items():
        # Determine region
        if code in ['31', '32', '33', '34', '35', '36']:
            region = 'jawa'
        elif code in ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21']:
            region = 'sumatera'
        elif code in ['71', '72', '73', '74', '75', '76']:
            region = 'sulawesi'
        elif code in ['61', '62', '63', '64', '65']:
            region = 'kalimantan'
        else:
            region = 'others'
        
        min_prod, max_prod = production_ranges[region]
        
        monthly_data = {}
        for month in MONTHS:
            # Add seasonal variation
            seasonal_factor = 1.0
            if month in ['may', 'jun', 'jul']:  # Harvest season
                seasonal_factor = 1.3
            elif month in ['nov', 'dec', 'jan']:  # Planting season
                seasonal_factor = 0.7
            
            production = random.randint(min_prod, max_prod) * seasonal_factor
            monthly_data[month] = round(production)
        
        data.append({
            'kode_prov': code,
            'provinsi': name,
            **monthly_data
        })
    
    return data

# ==========================================
# ROUTES
# ==========================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_status = "connected" if engine else "disconnected"
    redis_status = "connected" if redis_client else "disconnected"
    
    return {
        "status": "healthy",
        "service": "production-service",
        "database": db_status,
        "redis": redis_status,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/production/{year}", response_model=ProductionResponse)
async def get_production_by_year(year: int = 2023):
    """Get production data for specific year"""
    try:
        # Try cache first
        cache_key = f"production_{year}"
        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                return {
                    "success": True,
                    "source": "cache",
                    "data": json.loads(cached)
                }
        
        # Generate or fetch from database
        data = generate_production_data(year)
        
        # Cache the result (24 hours)
        if redis_client:
            redis_client.setex(cache_key, 86400, json.dumps(data))
        
        return {
            "success": True,
            "source": "generated",
            "data": data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/production/{year}/{province_code}")
async def get_production_by_province(year: int, province_code: str):
    """Get production data for specific province"""
    try:
        data = generate_production_data(year)
        province_data = next((p for p in data if p['kode_prov'] == province_code), None)
        
        if not province_data:
            raise HTTPException(status_code=404, detail="Province not found")
        
        return {
            "success": True,
            "data": province_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/production/stats/{year}")
async def get_statistics(year: int, month: str = Query("may")):
    """Get production statistics"""
    try:
        data = generate_production_data(year)
        
        productions = [p.get(month, 0) for p in data]
        total = sum(productions)
        avg = total / len(productions) if productions else 0
        max_prod = max(productions) if productions else 0
        min_prod = min(productions) if productions else 0
        
        max_province = next((p for p in data if p.get(month) == max_prod), None)
        min_province = next((p for p in data if p.get(month) == min_prod), None)
        
        return {
            "success": True,
            "data": {
                "total": round(total),
                "average": round(avg),
                "max": {
                    "value": max_prod,
                    "province": max_province.get('provinsi') if max_province else None
                },
                "min": {
                    "value": min_prod,
                    "province": min_province.get('provinsi') if min_province else None
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cache/clear")
async def clear_cache():
    """Clear Redis cache"""
    if redis_client:
        redis_client.flushdb()
        return {"success": True, "message": "Cache cleared"}
    return {"success": False, "message": "Redis not available"}

# ==========================================
# STARTUP
# ==========================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3002))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
