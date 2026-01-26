"""
BI Price Scraper Service
FastAPI service that exposes web scraping functionality
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import logging
from datetime import datetime
from scraper import BIPriceScraper

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BI Price Scraper Service",
    description="Web scraping service for Bank Indonesia rice price data",
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

# In-memory cache
price_cache = {}
cache_timestamp = {}
CACHE_DURATION = 3600  # 1 hour in seconds


class ScrapeResponse(BaseModel):
    success: bool
    source: str
    commodity: str
    provinces_count: int
    scraped_at: Optional[str] = None
    generated_at: Optional[str] = None
    cached: bool = False


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "service": "BI Price Scraper",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "scrape": "/api/scrape/rice/{commodity_type}",
            "prices": "/api/prices/{commodity_type}",
            "refresh": "/api/refresh/{commodity_type}"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "bi-scraper",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/scrape/rice/{commodity_type}")
async def scrape_rice_prices(commodity_type: str, force_refresh: bool = False):
    """
    Scrape rice prices from BI website
    
    Args:
        commodity_type: beras_premium, beras_medium, etc.
        force_refresh: Force new scraping even if cache exists
    
    Returns:
        Scraped or cached price data
    """
    try:
        # Map commodity type
        commodity_map = {
            "beras_premium": "Beras Premium",
            "beras_medium": "Beras Medium",
        }
        
        bi_commodity_name = commodity_map.get(commodity_type.lower(), "Beras Premium")
        cache_key = f"rice_{commodity_type.lower()}"
        
        # Check cache
        if not force_refresh and cache_key in price_cache:
            cache_age = datetime.now().timestamp() - cache_timestamp.get(cache_key, 0)
            if cache_age < CACHE_DURATION:
                logger.info(f"✓ Returning cached data for {commodity_type} (age: {int(cache_age)}s)")
                cached_data = price_cache[cache_key].copy()
                cached_data['cached'] = True
                cached_data['cache_age_seconds'] = int(cache_age)
                return cached_data
        
        # Perform scraping
        logger.info(f"🔍 Starting scrape for {bi_commodity_name}...")
        scraper = BIPriceScraper()
        result = scraper.scrape_rice_prices(bi_commodity_name)
        
        # Cache the result
        price_cache[cache_key] = result
        cache_timestamp[cache_key] = datetime.now().timestamp()
        
        # Add metadata
        result['cached'] = False
        result['provinces_count'] = len(result.get('data', []))
        
        return result
        
    except Exception as e:
        logger.error(f"✗ Scraping failed: {e}")
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")


@app.get("/api/prices/{commodity_type}")
async def get_prices_with_ipe(commodity_type: str, year: Optional[int] = None, month: Optional[str] = None):
    """
    Get rice prices with IPE calculation
    
    Args:
        commodity_type: beras_premium, beras_medium
        year: Not used for BI data (always current)
        month: Specific month (jan, feb, etc.) or null for all months
    
    Returns:
        Price data with IPE per province
    """
    try:
        # Get scraped data
        scrape_result = await scrape_rice_prices(commodity_type, force_refresh=False)
        
        if not scrape_result.get('success'):
            raise HTTPException(status_code=500, detail="Failed to get price data")
        
        price_data = scrape_result.get('data', [])
        
        # Calculate IPE for requested month or current month
        if not month:
            month = datetime.now().strftime("%b").lower()  # Current month
        
        # Calculate national average price for the month
        month_prices = []
        for province in price_data:
            monthly_prices = province.get('prices', {})
            if month in monthly_prices:
                month_prices.append(monthly_prices[month])
        
        if not month_prices:
            raise HTTPException(status_code=404, detail=f"No price data for month: {month}")
        
        national_avg = sum(month_prices) / len(month_prices)
        
        # Calculate IPE for each province
        result_data = []
        for province in price_data:
            monthly_prices = province.get('prices', {})
            province_price = monthly_prices.get(month, 0)
            
            if province_price > 0:
                ipe = round(province_price / national_avg, 2)
                
                # Categorize
                if ipe < 0.90:
                    kategori = "rendah"
                elif ipe > 1.10:
                    kategori = "tinggi"
                else:
                    kategori = "normal"
                
                result_data.append({
                    "commodity": commodity_type,
                    "provinceCode": province['kode_prov'],
                    "provinceName": province['provinsi'],
                    "price": province_price,
                    "unit": "kg",
                    "marketType": "traditional",
                    "month": month,
                    "date": datetime.now().isoformat(),
                    "source": scrape_result.get('source', 'unknown'),
                    "harga_nasional": int(national_avg),
                    "ipe": ipe,
                    "kategori": kategori
                })
        
        return {
            "success": True,
            "source": scrape_result.get('source', 'unknown'),
            "month": month,
            "national_average": int(national_avg),
            "data": result_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Price calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Price calculation failed: {str(e)}")


@app.post("/api/refresh/{commodity_type}")
async def refresh_cache(commodity_type: str, background_tasks: BackgroundTasks):
    """Force refresh cached data in background"""
    cache_key = f"rice_{commodity_type.lower()}"
    
    # Delete cache
    if cache_key in price_cache:
        del price_cache[cache_key]
        del cache_timestamp[cache_key]
    
    # Trigger background scraping
    background_tasks.add_task(scrape_rice_prices, commodity_type, True)
    
    return {
        "success": True,
        "message": f"Cache refresh triggered for {commodity_type}",
        "status": "processing"
    }


@app.get("/api/cache/status")
def cache_status():
    """Get cache status for all commodities"""
    status = {}
    for key, timestamp in cache_timestamp.items():
        age = datetime.now().timestamp() - timestamp
        status[key] = {
            "cached": True,
            "age_seconds": int(age),
            "age_readable": f"{int(age / 60)} minutes",
            "provinces": len(price_cache.get(key, {}).get('data', [])),
            "expires_in": int(CACHE_DURATION - age) if age < CACHE_DURATION else 0
        }
    return {
        "cache_duration": CACHE_DURATION,
        "items": status
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3005)
