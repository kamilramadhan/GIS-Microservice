/**
 * ==========================================
 * Dashboard GIS - Produksi Padi Indonesia
 * ==========================================
 * 
 * Arsitektur Modular untuk Visualisasi Peta Choropleth
 * dengan Filter Time-Series dan Interaktivitas Tinggi
 * 
 * @author Senior Frontend Engineer & GIS Specialist
 * @version 1.0.0
 */

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================

const CONFIG = {
    // Koordinat pusat peta Indonesia
    MAP_CENTER: [-2.5, 118.0],
    MAP_ZOOM: 5,
    MAP_MIN_ZOOM: 4,
    MAP_MAX_ZOOM: 8,
    
    // Path ke file data
    GEOJSON_PATH: 'provinsi.json',
    
    // BPS API Configuration
    BPS_API: {
        BASE_URL: 'https://webapi.bps.go.id/v1/api',
        APP_ID: '0a94470ebd2b059f522da5b53a491575',
        SUBJECT: {
            PADI: '53',
            INDICATOR: '5203',
        },
        DOMAIN: '0000',
        ENDPOINTS: {
            LIST_DATA: '/list/model/data/domain/{domain}/key/{appid}',
            VERTICAL_VAR: '/list/model/var/lang/ind/domain/{domain}/key/{appid}'
        },
        CACHE_DURATION: 24 * 60 * 60 * 1000,
        USE_CACHE: true
    },
    
    // Bank Indonesia Price API Configuration
    BI_PRICE_API: {
        BASE_URL: 'https://www.bi.go.id/hargapangan',
        ENDPOINTS: {
            TRADITIONAL_MARKET: '/TabelHarga/PasarTradisionalKomoditas',
            MODERN_MARKET: '/TabelHarga/PasarModernKomoditas'
        },
        // Mapping komoditas ke ID BI
        COMMODITY_MAPPING: {
            'beras_premium': { id: '1', name: 'Beras Premium' },
            'beras_medium': { id: '2', name: 'Beras Medium' },
            'cabai_merah': { id: '3', name: 'Cabai Merah' },
            'cabai_rawit': { id: '4', name: 'Cabai Rawit' },
            'bawang_merah': { id: '5', name: 'Bawang Merah' },
            'bawang_putih': { id: '6', name: 'Bawang Putih' },
            'daging_ayam': { id: '7', name: 'Daging Ayam' },
            'daging_sapi': { id: '8', name: 'Daging Sapi' },
            'telur_ayam': { id: '9', name: 'Telur Ayam' },
            'minyak_goreng': { id: '10', name: 'Minyak Goreng' }
        },
        CACHE_DURATION: 6 * 60 * 60 * 1000, // 6 jam untuk data harga
        USE_CACHE: true
    },
    
    // Fallback ke data lokal
    USE_LOCAL_FALLBACK: true,
    LOCAL_DATA_PATH: 'data-produksi-padi.json',
    
    // Color schemes
    COLOR_SCHEMES: {
        productivity: [
            { threshold: 0, color: '#fff5eb' },
            { threshold: 100000, color: '#fed976' },
            { threshold: 300000, color: '#feb24c' },
            { threshold: 600000, color: '#fd8d3c' },
            { threshold: 1000000, color: '#f03b20' },
            { threshold: 2000000, color: '#bd0026' }
        ],
        economic: [
            { threshold: 0, color: '#4299e1', label: 'Harga rendah', description: '< 0.90' },
            { threshold: 0.90, color: '#fed976', label: 'Harga normal', description: '0.90 - 1.10' },
            { threshold: 1.10, color: '#f56565', label: 'Harga tinggi', description: '> 1.10' }
        ]
    },
    
    // Mapping bulan
    MONTH_NAMES: {
        jan: 'Januari', feb: 'Februari', mar: 'Maret',
        apr: 'April', may: 'Mei', jun: 'Juni',
        jul: 'Juli', aug: 'Agustus', sep: 'September',
        oct: 'Oktober', nov: 'November', dec: 'Desember'
    },
    
    MONTH_KEYS: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
    
    // Mapping kode provinsi
    PROVINCE_CODE_MAPPING: {
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
    },
    
    // Mapping nama provinsi BI ke kode provinsi
    BI_PROVINCE_MAPPING: {
        'Aceh': '11', 'Sumatera Utara': '12', 'Sumatera Barat': '13',
        'Riau': '14', 'Jambi': '15', 'Sumatera Selatan': '16',
        'Bengkulu': '17', 'Lampung': '18', 'Bangka Belitung': '19',
        'Kepulauan Riau': '21', 'DKI Jakarta': '31', 'Jawa Barat': '32',
        'Jawa Tengah': '33', 'DI Yogyakarta': '34', 'Jawa Timur': '35',
        'Banten': '36', 'Bali': '51', 'Nusa Tenggara Barat': '52',
        'Nusa Tenggara Timur': '53', 'Kalimantan Barat': '61',
        'Kalimantan Tengah': '62', 'Kalimantan Selatan': '63',
        'Kalimantan Timur': '64', 'Kalimantan Utara': '65',
        'Sulawesi Utara': '71', 'Sulawesi Tengah': '72',
        'Sulawesi Selatan': '73', 'Sulawesi Tenggara': '74',
        'Gorontalo': '75', 'Sulawesi Barat': '76',
        'Maluku': '81', 'Maluku Utara': '82',
        'Papua': '92', 'Papua Barat': '93'
    }
};

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================
// ==========================================
// 2. STATE MANAGEMENT
// ==========================================

const AppState = {
    currentMode: 'productivity', // 'productivity', 'economic', 'opportunity'
    currentMonth: 'may',
    currentYear: '2023',
    currentCommodity: 'beras_premium',
    currentMarketType: 'traditional',
    productionData: null,
    priceData: null,
    economicIndexData: null,
    geoJsonData: null,
    map: null,
    geoJsonLayer: null,
    selectedProvince: null,
    dataSource: 'loading',
    lastUpdate: null
};

// ==========================================
// 3. DATA LOADING & PROCESSING
// ==========================================

/**
 * BPS Data Service Class
 * Handles caching, rate limiting, and data fetching from BPS API
 */
class BPSDataService {
    constructor() {
        this.cacheKey = 'bps_production_data';
        this.cacheDuration = CONFIG.BPS_API.CACHE_DURATION;
    }
    
    /**
     * Main method untuk mendapatkan data
     * Cek cache dulu, jika expired fetch dari API
     */
    async getData(year = '2023') {
        if (CONFIG.BPS_API.USE_CACHE) {
            const cached = this.getCachedData(year);
            if (cached && !this.isCacheExpired(cached.timestamp)) {
                console.log('✓ Using cached BPS data for year:', year);
                return cached.data;
            }
        }
        
        console.log('→ Fetching fresh data from BPS API...');
        try {
            const freshData = await this.fetchFromBPS(year);
            this.setCachedData(year, freshData);
            return freshData;
        } catch (error) {
            console.error('✗ BPS API fetch failed:', error);
            
            // Fallback ke cached data meskipun expired
            const cached = this.getCachedData(year);
            if (cached) {
                console.log('⚠ Using expired cache as fallback');
                return cached.data;
            }
            
            throw error;
        }
    }
    
    /**
     * Fetch data dari BPS API
     */
    async fetchFromBPS(year) {
        const url = this.buildAPIUrl(year);
        
        const response = await this.fetchWithRetry(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`BPS API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return this.transformBPSData(data);
    }
    
    /**
     * Build API URL dengan parameter yang tepat
     */
    buildAPIUrl(year) {
        const { BASE_URL, APP_ID, DOMAIN, ENDPOINTS } = CONFIG.BPS_API;
        
        // Untuk production, gunakan endpoint BPS yang sebenarnya
        // Format: /list/model/data/domain/{domain}/key/{appid}
        const endpoint = ENDPOINTS.LIST_DATA
            .replace('{domain}', DOMAIN)
            .replace('{appid}', APP_ID);
        
        // Tambahkan parameter tahun
        return `${BASE_URL}${endpoint}?year=${year}`;
    }
    
    /**
     * Fetch dengan retry mechanism untuk handle rate limiting
     */
    async fetchWithRetry(url, options = {}, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                
                // Handle rate limiting (429 Too Many Requests)
                if (response.status === 429) {
                    const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
                    console.log(`⏳ Rate limited. Waiting ${waitTime/1000}s...`);
                    await this.sleep(waitTime);
                    continue;
                }
                
                return response;
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                
                const waitTime = 1000 * (i + 1);
                console.log(`⏳ Retry ${i + 1}/${maxRetries} after ${waitTime/1000}s...`);
                await this.sleep(waitTime);
            }
        }
    }
    
    /**
     * Transform data dari format BPS ke format internal
     */
    transformBPSData(bpsResponse) {
        // NOTE: Struktur response BPS berbeda-beda tergantung endpoint
        // Ini adalah template yang perlu disesuaikan dengan response actual
        
        if (!bpsResponse || !bpsResponse.data) {
            console.warn('Invalid BPS response structure');
            return [];
        }
        
        // Transform setiap data point
        return bpsResponse.data.map(item => {
            // Extract kode provinsi dari turvar atau turcol
            const kodeProv = this.extractProvinceCode(item);
            const provinsi = CONFIG.PROVINCE_CODE_MAPPING[kodeProv] || 'Unknown';
            
            // Extract data bulanan
            const monthlyData = this.extractMonthlyData(item);
            
            return {
                kode_prov: kodeProv,
                provinsi: provinsi,
                ...monthlyData
            };
        });
    }
    
    /**
     * Extract kode provinsi dari data BPS
     */
    extractProvinceCode(item) {
        // BPS format: kode wilayah biasanya 4-6 digit
        // Provinsi: 2 digit pertama
        
        if (item.kode_wilayah) {
            return item.kode_wilayah.substring(0, 2);
        }
        
        if (item.turvar) {
            // Cari pattern 2 digit di awal
            const match = item.turvar.match(/^(\d{2})/);
            return match ? match[1] : '00';
        }
        
        return '00';
    }
    
    /**
     * Extract data produksi bulanan
     */
    extractMonthlyData(item) {
        const monthlyData = {};
        
        // Mapping dari nama bulan BPS ke key internal
        const monthMapping = {
            'Januari': 'jan', 'Februari': 'feb', 'Maret': 'mar',
            'April': 'apr', 'Mei': 'may', 'Juni': 'jun',
            'Juli': 'jul', 'Agustus': 'aug', 'September': 'sep',
            'Oktober': 'oct', 'November': 'nov', 'Desember': 'dec'
        };
        
        // Jika data dalam format array dengan bulan
        if (Array.isArray(item.data_bulanan)) {
            item.data_bulanan.forEach(month => {
                const monthKey = monthMapping[month.bulan];
                if (monthKey) {
                    monthlyData[monthKey] = parseFloat(month.nilai) || 0;
                }
            });
        } else {
            // Jika data dalam format object langsung
            Object.keys(monthMapping).forEach(monthName => {
                const key = monthMapping[monthName];
                monthlyData[key] = parseFloat(item[key] || item[monthName]) || 0;
            });
        }
        
        // Pastikan semua bulan ada (set ke 0 jika tidak ada data)
        CONFIG.MONTH_KEYS.forEach(key => {
            if (!(key in monthlyData)) {
                monthlyData[key] = 0;
            }
        });
        
        return monthlyData;
    }
    
    /**
     * Cache management
     */
    getCachedData(year) {
        try {
            const cached = localStorage.getItem(`${this.cacheKey}_${year}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('Cache read error:', error);
            return null;
        }
    }
    
    setCachedData(year, data) {
        try {
            localStorage.setItem(`${this.cacheKey}_${year}`, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Cache write error:', error);
        }
    }
    
    isCacheExpired(timestamp) {
        return (Date.now() - timestamp) > this.cacheDuration;
    }
    
    clearCache() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.cacheKey)) {
                localStorage.removeItem(key);
            }
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Bank Indonesia Price Data Service Class
 * Handles fetching commodity price data and calculating economic index (IPE)
 */
class BIPriceService {
    constructor() {
        this.cacheKey = 'bi_price_data';
        this.cacheDuration = CONFIG.BI_PRICE_API.CACHE_DURATION;
    }
    
    /**
     * Get price data for specific commodity and date
     * Returns IPE (Indeks Potensi Ekonomi) by province
     */
    async getPriceData(commodity, year, month, marketType = 'traditional') {
        const cacheKey = `${commodity}_${year}_${month}_${marketType}`;
        
        if (CONFIG.BI_PRICE_API.USE_CACHE) {
            const cached = this.getCachedData(cacheKey);
            if (cached && !this.isCacheExpired(cached.timestamp)) {
                console.log('✓ Using cached price data');
                return cached.data;
            }
        }
        
        console.log('→ Fetching price data from backend API...');
        try {
            // Call BI Scraper API for real BI.go.id data
            const apiUrl = `/api/bi/prices/${commodity}`;
            console.log(`📡 Calling BI Scraper API: ${apiUrl}`);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📦 BI Scraper API Response:', {
                success: result.success,
                source: result.source,
                month: result.month,
                dataCount: result.data?.length
            });
            
            if (!result.success || !result.data) {
                throw new Error('Invalid API response');
            }
            
            // Transform API data to format expected by frontend
            const economicIndex = result.data.map(item => ({
                kode_prov: item.provinceCode,
                provinsi: item.provinceName,
                harga: item.price,
                satuan: item.unit,
                ipe: item.ipe,
                kategori: item.kategori,
                harga_nasional: item.harga_nasional
            }));
            
            console.log('✅ Transformed BI data sample:', economicIndex[0]);
            console.log(`📊 Data source: ${result.source} (${result.month})`);
            
            this.setCachedData(cacheKey, economicIndex);
            return economicIndex;
        } catch (error) {
            console.error('✗ Backend API fetch failed:', error);
            
            // Fallback ke cached data
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                console.log('⚠ Using expired cache as fallback');
                return cached.data;
            }
            
            // Return mock data as final fallback
            return this.generateMockPriceData(commodity);
        }
    }
    
    /**
     * Fetch data dari BI (Note: BI tidak punya public REST API, perlu scraping)
     * Untuk demo, gunakan mock data yang realistis
     */
    async fetchPriceData(commodity, year, month, marketType) {
        // BI.go.id tidak menyediakan REST API publik
        // Dalam implementasi production, perlu:
        // 1. Web scraping dari halaman BI
        // 2. Atau gunakan proxy/backend service
        // 3. Atau manual data entry
        
        // Untuk demo, generate realistic mock data
        return this.generateMockPriceData(commodity);
    }
    
    /**
     * Generate realistic mock price data
     * Data berdasarkan harga pasar riil 2023-2024
     */
    generateMockPriceData(commodity) {
        const commodityInfo = CONFIG.BI_PRICE_API.COMMODITY_MAPPING[commodity];
        const basePrice = this.getBasePrice(commodity);
        
        const provinces = Object.keys(CONFIG.PROVINCE_CODE_MAPPING);
        const priceData = [];
        
        provinces.forEach(code => {
            const provinceName = CONFIG.PROVINCE_CODE_MAPPING[code];
            
            // Generate price dengan variasi realistis per provinsi
            // Pulau yang sama cenderung punya harga mirip
            const variation = this.getProvinceVariation(code);
            const price = basePrice * (1 + variation);
            
            priceData.push({
                kode_prov: code,
                provinsi: provinceName,
                harga: Math.round(price),
                satuan: this.getUnit(commodity)
            });
        });
        
        return priceData;
    }
    
    /**
     * Get base price for commodity (harga acuan nasional)
     * Berdasarkan data riil Bank Indonesia
     */
    getBasePrice(commodity) {
        const basePrices = {
            'beras_premium': 14000,  // Rp per kg
            'beras_medium': 12000,
            'cabai_merah': 45000,
            'cabai_rawit': 55000,
            'bawang_merah': 35000,
            'bawang_putih': 28000,
            'daging_ayam': 38000,
            'daging_sapi': 130000,
            'telur_ayam': 28000,
            'minyak_goreng': 16000
        };
        
        return basePrices[commodity] || 10000;
    }
    
    /**
     * Get unit for commodity
     */
    getUnit(commodity) {
        const units = {
            'beras_premium': 'kg',
            'beras_medium': 'kg',
            'cabai_merah': 'kg',
            'cabai_rawit': 'kg',
            'bawang_merah': 'kg',
            'bawang_putih': 'kg',
            'daging_ayam': 'kg',
            'daging_sapi': 'kg',
            'telur_ayam': 'kg',
            'minyak_goreng': 'liter'
        };
        
        return units[commodity] || 'kg';
    }
    
    /**
     * Get price variation by province
     * Berdasarkan faktor geografis dan ekonomi
     */
    getProvinceVariation(code) {
        // Pulau utama
        const island = this.getIsland(code);
        
        // Base variation by island (Jakarta = 0, others relative to Jakarta)
        const islandVariations = {
            'jawa': 0,
            'sumatera': 0.05,   // 5% lebih mahal (transportasi)
            'kalimantan': 0.08,  // 8% lebih mahal
            'sulawesi': 0.10,    // 10% lebih mahal
            'bali_nusa': 0.07,   // 7% lebih mahal
            'maluku': 0.15,      // 15% lebih mahal (remote)
            'papua': 0.25        // 25% lebih mahal (sangat remote)
        };
        
        const baseVariation = islandVariations[island] || 0.10;
        
        // Add random variation (-3% to +3%)
        const randomVariation = (Math.random() - 0.5) * 0.06;
        
        return baseVariation + randomVariation;
    }
    
    /**
     * Determine island group from province code
     */
    getIsland(code) {
        const islandMap = {
            'jawa': ['31', '32', '33', '34', '35', '36'],
            'sumatera': ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21'],
            'kalimantan': ['61', '62', '63', '64', '65'],
            'sulawesi': ['71', '72', '73', '74', '75', '76'],
            'bali_nusa': ['51', '52', '53'],
            'maluku': ['81', '82'],
            'papua': ['91', '92', '93', '94', '95', '96']
        };
        
        for (const [island, codes] of Object.entries(islandMap)) {
            if (codes.includes(code)) return island;
        }
        
        return 'jawa';
    }
    
    /**
     * Calculate IPE (Indeks Potensi Ekonomi)
     * IPE = Harga Wilayah / Harga Rata-rata Nasional
     * 
     * Interpretasi:
     * - IPE < 0.90: Harga rendah (biru)
     * - IPE 0.90-1.10: Harga normal (kuning)
     * - IPE > 1.10: Harga tinggi (merah)
     */
    calculateEconomicIndex(priceData) {
        // Calculate national average
        const totalPrice = priceData.reduce((sum, item) => sum + item.harga, 0);
        const avgPrice = totalPrice / priceData.length;
        
        // Calculate IPE for each province
        return priceData.map(item => ({
            ...item,
            harga_nasional: Math.round(avgPrice),
            ipe: parseFloat((item.harga / avgPrice).toFixed(2)),
            kategori: this.categorizeIPE(item.harga / avgPrice)
        }));
    }
    
    /**
     * Categorize IPE value
     */
    categorizeIPE(ipe) {
        if (ipe < 0.90) return 'rendah';
        if (ipe <= 1.10) return 'normal';
        return 'tinggi';
    }
    
    /**
     * Cache management (same as BPSDataService)
     */
    getCachedData(key) {
        try {
            const cached = localStorage.getItem(`${this.cacheKey}_${key}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('Cache read error:', error);
            return null;
        }
    }
    
    setCachedData(key, data) {
        try {
            localStorage.setItem(`${this.cacheKey}_${key}`, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Cache write error:', error);
        }
    }
    
    isCacheExpired(timestamp) {
        return (Date.now() - timestamp) > this.cacheDuration;
    }
    
    clearCache() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.cacheKey)) {
                localStorage.removeItem(key);
            }
        });
    }
}

/**
 * Memuat data dari BPS atau BI sesuai mode yang aktif
 */
async function loadData() {
    showLoading(true);
    
    try {
        // Load GeoJSON (lokal)
        const geoJsonResponse = await fetch(CONFIG.GEOJSON_PATH);
        if (!geoJsonResponse.ok) {
            throw new Error('Failed to load GeoJSON');
        }
        AppState.geoJsonData = await geoJsonResponse.json();
        
        // Load data based on current mode
        if (AppState.currentMode === 'productivity') {
            await loadProductivityData();
        } else if (AppState.currentMode === 'economic') {
            await loadEconomicData();
        }
        
        updateDataSourceFooter();
        showLoading(false);
        return true;
        
    } catch (error) {
        console.error('✗ Critical error loading data:', error);
        showLoading(false);
        showError('Gagal memuat data. Silakan refresh halaman atau cek koneksi internet.');
        return false;
    }
}

/**
 * Load production data from BPS
 */
async function loadProductivityData() {
    try {
        // Coba BPS API terlebih dahulu
        const bpsService = new BPSDataService();
        AppState.productionData = await bpsService.getData(AppState.currentYear);
        AppState.dataSource = 'bps';
        AppState.lastUpdate = new Date().toISOString();
        
        console.log('✓ Production data loaded from BPS API:', {
            year: AppState.currentYear,
            provinces: AppState.productionData.length
        });
        
    } catch (bpsError) {
        console.warn('⚠ BPS API unavailable, using local fallback');
        
        if (!CONFIG.USE_LOCAL_FALLBACK) {
            throw new Error('BPS API failed and local fallback is disabled');
        }
        
        // Fallback ke data lokal
        const localResponse = await fetch(CONFIG.LOCAL_DATA_PATH);
        if (!localResponse.ok) {
            throw new Error('Failed to load local fallback data');
        }
        
        const localJson = await localResponse.json();
        AppState.productionData = localJson.data;
        AppState.dataSource = 'local';
        AppState.lastUpdate = localJson.metadata?.lastUpdated || 'Unknown';
        
        console.log('✓ Production data loaded from local source');
    }
}

/**
 * Load price data from Bank Indonesia
 */
async function loadEconomicData() {
    try {
        const biService = new BIPriceService();
        AppState.economicIndexData = await biService.getPriceData(
            AppState.currentCommodity,
            AppState.currentYear,
            AppState.currentMonth,
            AppState.currentMarketType
        );
        AppState.dataSource = 'bi';
        AppState.lastUpdate = new Date().toISOString();
        
        console.log('✓ Economic data loaded from BI:', {
            commodity: AppState.currentCommodity,
            provinces: AppState.economicIndexData.length
        });
        
    } catch (error) {
        console.error('✗ Failed to load economic data:', error);
        throw error;
    }
}


/**
 * Data Joining Strategy: Menggabungkan GeoJSON dengan Data
 * Mendukung mode productivity dan economic
 */
function createDataLookup() {
    const lookup = new Map();
    
    if (AppState.currentMode === 'productivity') {
        AppState.productionData?.forEach(province => {
            lookup.set(province.kode_prov, province);
        });
    } else if (AppState.currentMode === 'economic') {
        AppState.economicIndexData?.forEach(province => {
            lookup.set(province.kode_prov, province);
        });
    }
    
    return lookup;
}

/**
 * Mendapatkan nilai untuk provinsi tertentu (produksi atau IPE)
 */
function getValue(kodeProv, month) {
    const lookup = createDataLookup();
    const provinceData = lookup.get(kodeProv);
    
    if (!provinceData) return 0;
    
    if (AppState.currentMode === 'productivity') {
        return provinceData[month] || 0;
    } else if (AppState.currentMode === 'economic') {
        return provinceData.ipe || 0;
    }
    
    return 0;
}

/**
 * Legacy function for backward compatibility
 */
function getProduction(kodeProv, month) {
    return getValue(kodeProv, month);
}

// ==========================================
// 4. CHOROPLETH COLOR MAPPING
// ==========================================

/**
 * Menentukan warna berdasarkan nilai (produksi atau IPE)
 */
function getColor(value) {
    const colorScale = AppState.currentMode === 'productivity' 
        ? CONFIG.COLOR_SCHEMES.productivity 
        : CONFIG.COLOR_SCHEMES.economic;
    
    for (let i = colorScale.length - 1; i >= 0; i--) {
        if (value >= colorScale[i].threshold) {
            return colorScale[i].color;
        }
    }
    return colorScale[0].color;
}

/**
 * Styling function untuk setiap feature di GeoJSON
 */
function styleFeature(feature) {
    const kodeProv = feature.properties.KODE_PROV;
    const value = getValue(kodeProv, AppState.currentMonth);
    
    return {
        fillColor: getColor(value),
        weight: 1,
        opacity: 1,
        color: '#ffffff',
        fillOpacity: 0.7
    };
}

// ==========================================
// 5. INTERACTIVITY HANDLERS
// ==========================================

/**
 * Highlight effect saat mouse hover
 */
function highlightFeature(e) {
    const layer = e.target;
    
    layer.setStyle({
        weight: 3,
        color: '#2563eb',
        fillOpacity: 0.9
    });
    
    layer.bringToFront();
}

/**
 * Reset style saat mouse leave
 */
function resetHighlight(e) {
    AppState.geoJsonLayer.resetStyle(e.target);
}

/**
 * Handler saat provinsi diklik
 * Menampilkan detail di panel samping
 */
function onProvinceClick(e) {
    const feature = e.target.feature;
    const kodeProv = feature.properties.KODE_PROV;
    const provinsiName = feature.properties.PROVINSI;
    
    AppState.selectedProvince = kodeProv;
    updateDetailPanel(kodeProv, provinsiName);
    
    // Zoom ke provinsi yang diklik
    AppState.map.fitBounds(e.target.getBounds(), {
        padding: [50, 50],
        maxZoom: 7
    });
}

/**
 * Binding semua event handlers ke setiap feature
 */
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: onProvinceClick
    });
    
    // Popup untuk quick view - mendukung kedua mode
    const kodeProv = feature.properties.KODE_PROV;
    const monthName = CONFIG.MONTH_NAMES[AppState.currentMonth];
    
    let popupContent = '';
    
    if (AppState.currentMode === 'productivity') {
        const production = getValue(kodeProv, AppState.currentMonth);
        popupContent = `
            <div class="popup-title">${feature.properties.PROVINSI}</div>
            <div class="popup-production">${formatNumber(production)}</div>
            <div class="popup-unit">ton (${monthName})</div>
        `;
    } else if (AppState.currentMode === 'economic') {
        const lookup = createDataLookup();
        const provinceData = lookup.get(kodeProv);
        
        if (provinceData) {
            const commodityName = CONFIG.BI_PRICE_API.COMMODITY_MAPPING[AppState.currentCommodity]?.name || 'Komoditas';
            popupContent = `
                <div class="popup-title">${feature.properties.PROVINSI}</div>
                <div class="popup-production">Rp ${formatNumber(provinceData.harga)}</div>
                <div class="popup-unit">${commodityName} (${monthName})</div>
                <div class="popup-unit">IPE: ${provinceData.ipe} (${provinceData.kategori})</div>
            `;
        }
    }
    
    layer.bindPopup(popupContent);
}

// ==========================================
// 6. MAP INITIALIZATION
// ==========================================

/**
 * Inisialisasi Leaflet Map
 */
function initializeMap() {
    // Create map instance
    AppState.map = L.map('map', {
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.MAP_ZOOM,
        minZoom: CONFIG.MAP_MIN_ZOOM,
        maxZoom: CONFIG.MAP_MAX_ZOOM,
        zoomControl: true
    });
    
    // Add base tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(AppState.map);
    
    // Add GeoJSON layer dengan styling dan interaktivitas
    AppState.geoJsonLayer = L.geoJSON(AppState.geoJsonData, {
        style: styleFeature,
        onEachFeature: onEachFeature
    }).addTo(AppState.map);
    
    console.log('Map initialized successfully');
}

// ==========================================
// 7. UI UPDATE FUNCTIONS
// ==========================================

/**
 * Update peta choropleth saat bulan berubah
 * Efficient approach: Hanya update style tanpa re-render keseluruhan
 */
function updateChoropleth() {
    if (!AppState.geoJsonLayer) return;
    
    AppState.geoJsonLayer.eachLayer(layer => {
        const style = styleFeature(layer.feature);
        layer.setStyle(style);
        
        // Update popup content
        const kodeProv = layer.feature.properties.KODE_PROV;
        const production = getProduction(kodeProv, AppState.currentMonth);
        const monthName = CONFIG.MONTH_NAMES[AppState.currentMonth];
        
        layer.setPopupContent(`
            <div class="popup-title">${layer.feature.properties.PROVINSI}</div>
            <div class="popup-production">${formatNumber(production)}</div>
            <div class="popup-unit">ton (${monthName})</div>
        `);
    });
    
    // Update statistics
    updateStatistics();
    
    // Update detail panel jika ada provinsi yang dipilih
    if (AppState.selectedProvince) {
        const feature = findFeatureByKode(AppState.selectedProvince);
        if (feature) {
            updateDetailPanel(AppState.selectedProvince, feature.properties.PROVINSI);
        }
    }
}

/**
 * Update panel detail provinsi
 */
function updateDetailPanel(kodeProv, provinsiName) {
    const detailContainer = document.getElementById('provinceDetail');
    const lookup = createDataLookup();
    const provinceData = lookup.get(kodeProv);
    
    if (!provinceData) {
        detailContainer.innerHTML = '<p>Data tidak tersedia</p>';
        return;
    }
    
    if (AppState.currentMode === 'productivity') {
        updateProductivityDetailPanel(detailContainer, provinceData, provinsiName, kodeProv);
    } else if (AppState.currentMode === 'economic') {
        updateEconomicDetailPanel(detailContainer, provinceData, provinsiName, kodeProv);
    }
}

/**
 * Update detail panel for productivity mode
 */
function updateProductivityDetailPanel(container, provinceData, provinsiName, kodeProv) {
    const currentProduction = provinceData[AppState.currentMonth];
    const monthName = CONFIG.MONTH_NAMES[AppState.currentMonth];
    
    // Generate monthly data list
    const monthlyDataHTML = CONFIG.MONTH_KEYS.map(monthKey => {
        const isActive = monthKey === AppState.currentMonth;
        const value = provinceData[monthKey];
        
        return `
            <div class="monthly-data-item ${isActive ? 'active' : ''}">
                <span class="month-name">${CONFIG.MONTH_NAMES[monthKey]}</span>
                <span class="month-value">${formatNumber(value)}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="detail-content">
            <div class="detail-header">
                <h3 class="detail-province-name">${provinsiName}</h3>
                <p class="detail-province-code">Kode Provinsi: ${kodeProv}</p>
            </div>
            
            <div class="detail-production">
                <div class="detail-production-label">Produksi ${monthName}</div>
                <div class="detail-production-value">${formatNumber(currentProduction)}</div>
                <div class="detail-production-unit">ton</div>
            </div>
            
            <div class="detail-chart">
                <h4 class="detail-chart-title">Data Bulanan ${AppState.currentYear}</h4>
                <div class="monthly-data-list">
                    ${monthlyDataHTML}
                </div>
            </div>
        </div>
    `;
}

/**
 * Update detail panel for economic mode
 */
function updateEconomicDetailPanel(container, provinceData, provinsiName, kodeProv) {
    const monthName = CONFIG.MONTH_NAMES[AppState.currentMonth];
    const commodityName = CONFIG.BI_PRICE_API.COMMODITY_MAPPING[AppState.currentCommodity]?.name || 'Komoditas';
    
    // Calculate difference from national average
    const diffFromNational = provinceData.harga - provinceData.harga_nasional;
    const diffPercent = ((diffFromNational / provinceData.harga_nasional) * 100).toFixed(1);
    
    // Determine category styling
    let categoryBadge = '';
    if (provinceData.kategori === 'rendah') {
        categoryBadge = '<span style="background: #4299e1; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.875rem;">Harga Rendah</span>';
    } else if (provinceData.kategori === 'normal') {
        categoryBadge = '<span style="background: #eab308; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.875rem;">Harga Normal</span>';
    } else {
        categoryBadge = '<span style="background: #f56565; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.875rem;">Harga Tinggi</span>';
    }
    
    const diffSymbol = diffFromNational >= 0 ? '+' : '';
    const diffColor = diffFromNational >= 0 ? '#f56565' : '#4299e1';
    
    container.innerHTML = `
        <div class="detail-content">
            <div class="detail-header">
                <h3 class="detail-province-name">${provinsiName}</h3>
                <p class="detail-province-code">Kode Provinsi: ${kodeProv}</p>
            </div>
            
            <div class="detail-production">
                <div class="detail-production-label">${commodityName} (${monthName})</div>
                <div class="detail-production-value">Rp ${formatNumber(provinceData.harga)}</div>
                <div class="detail-production-unit">per ${provinceData.satuan}</div>
            </div>
            
            <div class="detail-chart">
                <h4 class="detail-chart-title">Analisis Harga</h4>
                <div class="monthly-data-list">
                    <div class="monthly-data-item active">
                        <span class="month-name">Harga Wilayah</span>
                        <span class="month-value">Rp ${formatNumber(provinceData.harga)}</span>
                    </div>
                    <div class="monthly-data-item">
                        <span class="month-name">Harga Nasional</span>
                        <span class="month-value">Rp ${formatNumber(provinceData.harga_nasional)}</span>
                    </div>
                    <div class="monthly-data-item">
                        <span class="month-name">Selisih</span>
                        <span class="month-value" style="color: ${diffColor};">
                            ${diffSymbol}Rp ${formatNumber(Math.abs(diffFromNational))} (${diffSymbol}${diffPercent}%)
                        </span>
                    </div>
                    <div class="monthly-data-item">
                        <span class="month-name">IPE</span>
                        <span class="month-value" style="font-weight: 700; color: var(--primary-color);">
                            ${provinceData.ipe}
                        </span>
                    </div>
                    <div class="monthly-data-item" style="grid-column: 1 / -1; margin-top: 0.5rem;">
                        <span class="month-name">Kategori</span>
                        <div>${categoryBadge}</div>
                    </div>
                </div>
                
                <div style="margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; font-size: 0.875rem;">
                    <strong>Interpretasi:</strong><br>
                    ${provinceData.ipe < 0.90 ? 
                        '✓ Kawasan ini memiliki harga di bawah rata-rata nasional, berpotensi memberikan margin ekonomi lebih tinggi.' : 
                        provinceData.ipe > 1.10 ? 
                        '⚠ Kawasan ini memiliki harga di atas rata-rata nasional, perlu strategi khusus untuk efisiensi biaya.' : 
                        '● Kawasan ini memiliki harga normal sesuai rata-rata nasional.'
                    }
                </div>
            </div>
        </div>
    `;
}

/**
 * Update statistik nasional - mendukung mode productivity dan economic
 */
function updateStatistics() {
    const statsContainer = document.getElementById('statsContainer');
    const statsTitle = document.getElementById('statsTitle');
    
    if (AppState.currentMode === 'productivity') {
        updateProductivityStatistics(statsContainer, statsTitle);
    } else if (AppState.currentMode === 'economic') {
        updateEconomicStatistics(statsContainer, statsTitle);
    }
}

/**
 * Update statistics for productivity mode
 */
function updateProductivityStatistics(container, title) {
    if (!AppState.productionData || AppState.productionData.length === 0) return;
    
    title.textContent = 'Statistik Nasional Produksi';
    
    const productions = AppState.productionData.map(p => p[AppState.currentMonth]);
    
    const total = productions.reduce((sum, val) => sum + val, 0);
    const avg = total / productions.length;
    const max = Math.max(...productions);
    const min = Math.min(...productions);
    
    const maxProvince = AppState.productionData.find(p => p[AppState.currentMonth] === max);
    const minProvince = AppState.productionData.find(p => p[AppState.currentMonth] === min);
    
    container.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Total Produksi:</span>
            <span class="stat-value">${formatNumber(total)} ton</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Rata-rata:</span>
            <span class="stat-value">${formatNumber(Math.round(avg))} ton</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Tertinggi:</span>
            <span class="stat-value">${maxProvince.provinsi} (${formatNumber(max)})</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Terendah:</span>
            <span class="stat-value">${minProvince.provinsi} (${formatNumber(min)})</span>
        </div>
    `;
}

/**
 * Update statistics for economic mode
 */
function updateEconomicStatistics(container, title) {
    if (!AppState.economicIndexData || AppState.economicIndexData.length === 0) return;
    
    title.textContent = 'Statistik Harga Nasional';
    
    const prices = AppState.economicIndexData.map(p => p.harga);
    const ipes = AppState.economicIndexData.map(p => p.ipe);
    
    const avgPrice = prices.reduce((sum, val) => sum + val, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    
    const maxProvince = AppState.economicIndexData.find(p => p.harga === maxPrice);
    const minProvince = AppState.economicIndexData.find(p => p.harga === minPrice);
    
    // Count provinces by category
    const lowPrice = AppState.economicIndexData.filter(p => p.kategori === 'rendah').length;
    const normalPrice = AppState.economicIndexData.filter(p => p.kategori === 'normal').length;
    const highPrice = AppState.economicIndexData.filter(p => p.kategori === 'tinggi').length;
    
    const commodityName = CONFIG.BI_PRICE_API.COMMODITY_MAPPING[AppState.currentCommodity]?.name || 'Komoditas';
    const unit = AppState.economicIndexData[0]?.satuan || 'kg';
    
    container.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Komoditas:</span>
            <span class="stat-value">${commodityName}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Harga Rata-rata:</span>
            <span class="stat-value">Rp ${formatNumber(Math.round(avgPrice))}/${unit}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Harga Tertinggi:</span>
            <span class="stat-value">${maxProvince.provinsi}<br>Rp ${formatNumber(maxPrice)} (IPE: ${maxProvince.ipe})</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Harga Terendah:</span>
            <span class="stat-value">${minProvince.provinsi}<br>Rp ${formatNumber(minPrice)} (IPE: ${minProvince.ipe})</span>
        </div>
        <div class="stat-item" style="grid-column: 1 / -1; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
            <span class="stat-label">Distribusi:</span>
            <span class="stat-value">
                <span style="color: #4299e1;">● ${lowPrice} rendah</span> | 
                <span style="color: #eab308;">● ${normalPrice} normal</span> | 
                <span style="color: #f56565;">● ${highPrice} tinggi</span>
            </span>
        </div>
    `;
}

// ==========================================
// 8. EVENT LISTENERS
// ==========================================

/**
 * Setup event listeners untuk kontrol UI
 */
function setupEventListeners() {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const monthSlider = document.getElementById('monthSlider');
    const sliderValue = document.getElementById('sliderValue');
    const commoditySelect = document.getElementById('commoditySelect');
    const marketTypeSelect = document.getElementById('marketTypeSelect');
    
    // Dashboard mode selector
    const selectorTabs = document.querySelectorAll('.selector-tab');
    selectorTabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            const mode = tab.dataset.mode;
            if (tab.disabled || mode === AppState.currentMode) return;
            
            // Update active tab
            selectorTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update mode
            AppState.currentMode = mode;
            
            // Show/hide relevant controls
            updateControlVisibility();
            
            // Reload data for new mode
            showLoading(true);
            await loadData();
            updateChoropleth();
            updateLegend();
            updateStatistics();
            showLoading(false);
        });
    });
    
    // Commodity change handler (for economic mode)
    if (commoditySelect) {
        commoditySelect.addEventListener('change', async (e) => {
            AppState.currentCommodity = e.target.value;
            console.log('Commodity changed to:', AppState.currentCommodity);
            
            showLoading(true);
            await loadEconomicData();
            updateChoropleth();
            updateStatistics();
            showLoading(false);
        });
    }
    
    // Market type change handler (for economic mode)
    if (marketTypeSelect) {
        marketTypeSelect.addEventListener('change', async (e) => {
            AppState.currentMarketType = e.target.value;
            console.log('Market type changed to:', AppState.currentMarketType);
            
            showLoading(true);
            await loadEconomicData();
            updateChoropleth();
            updateStatistics();
            showLoading(false);
        });
    }
    
    // Year change handler
    yearSelect.addEventListener('change', async (e) => {
        AppState.currentYear = e.target.value;
        console.log('Year changed to:', AppState.currentYear);
        
        // Reload data untuk tahun baru
        showLoading(true);
        await loadData();
        updateChoropleth();
        updateStatistics();
        showLoading(false);
    });
    
    // Dropdown change handler
    monthSelect.addEventListener('change', (e) => {
        AppState.currentMonth = e.target.value;
        
        // Sync slider
        const monthIndex = CONFIG.MONTH_KEYS.indexOf(AppState.currentMonth);
        monthSlider.value = monthIndex;
        sliderValue.textContent = CONFIG.MONTH_NAMES[AppState.currentMonth];
        
        // Update map if in economic mode (price changes by month)
        if (AppState.currentMode === 'economic') {
            showLoading(true);
            loadEconomicData().then(() => {
                updateChoropleth();
                updateStatistics();
                showLoading(false);
            });
        } else {
            updateChoropleth();
            updateStatistics();
        }
    });
    
    // Slider change handler
    monthSlider.addEventListener('input', (e) => {
        const monthIndex = parseInt(e.target.value);
        AppState.currentMonth = CONFIG.MONTH_KEYS[monthIndex];
        
        // Sync dropdown
        monthSelect.value = AppState.currentMonth;
        sliderValue.textContent = CONFIG.MONTH_NAMES[AppState.currentMonth];
        
        // Update map if in economic mode
        if (AppState.currentMode === 'economic') {
            showLoading(true);
            loadEconomicData().then(() => {
                updateChoropleth();
                updateStatistics();
                showLoading(false);
            });
        } else {
            updateChoropleth();
            updateStatistics();
        }
    });
}

/**
 * Update control panel visibility based on current mode
 */
function updateControlVisibility() {
    const commodityGroup = document.getElementById('commodityGroup');
    const marketTypeGroup = document.getElementById('marketTypeGroup');
    const controlPanelTitle = document.getElementById('controlPanelTitle');
    
    if (AppState.currentMode === 'economic') {
        commodityGroup.style.display = 'block';
        marketTypeGroup.style.display = 'block';
        controlPanelTitle.textContent = 'Filter Harga & Kontrol';
    } else {
        commodityGroup.style.display = 'none';
        marketTypeGroup.style.display = 'none';
        controlPanelTitle.textContent = 'Filter & Kontrol';
    }
}

/**
 * Update legend based on current mode
 */
function updateLegend() {
    const legendContainer = document.getElementById('legendContainer');
    
    if (AppState.currentMode === 'productivity') {
        legendContainer.innerHTML = `
            <h3 class="legend-title">Legenda Produksi (ton)</h3>
            <div class="legend-items">
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #fff5eb;"></span>
                    <span class="legend-text">&lt; 100.000</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #fed976;"></span>
                    <span class="legend-text">100.000 - 300.000</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #feb24c;"></span>
                    <span class="legend-text">300.000 - 600.000</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #fd8d3c;"></span>
                    <span class="legend-text">600.000 - 1.000.000</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #f03b20;"></span>
                    <span class="legend-text">1.000.000 - 2.000.000</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #bd0026;"></span>
                    <span class="legend-text">&gt; 2.000.000</span>
                </div>
            </div>
        `;
    } else if (AppState.currentMode === 'economic') {
        legendContainer.innerHTML = `
            <h3 class="legend-title">Legenda IPE (Indeks Potensi Ekonomi)</h3>
            <div class="legend-items">
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #4299e1;"></span>
                    <span class="legend-text">Harga Rendah (&lt; 0.90)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #fed976;"></span>
                    <span class="legend-text">Harga Normal (0.90 - 1.10)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #f56565;"></span>
                    <span class="legend-text">Harga Tinggi (&gt; 1.10)</span>
                </div>
            </div>
            <div style="margin-top: 1rem; padding: 0.75rem; background: #f0f9ff; border-radius: 0.5rem; font-size: 0.875rem;">
                <strong>Interpretasi IPE:</strong><br>
                • 1.00 = sama dengan nasional<br>
                • &gt; 1.00 = lebih mahal dari nasional<br>
                • &lt; 1.00 = lebih murah dari nasional
            </div>
        `;
    }
}

/**
 * Load production data untuk tahun tertentu
 */
async function loadProductionData() {
    try {
        const bpsService = new BPSDataService();
        AppState.productionData = await bpsService.getData(AppState.currentYear);
        AppState.dataSource = 'bps';
        AppState.lastUpdate = new Date().toISOString();
        
        updateDataSourceFooter();
        
        console.log('✓ Production data loaded for year:', AppState.currentYear);
        return true;
        
    } catch (error) {
        console.warn('⚠ Failed to load production data, using fallback');
        
        // Fallback ke data lokal jika tersedia
        if (CONFIG.USE_LOCAL_FALLBACK) {
            try {
                const response = await fetch(CONFIG.LOCAL_DATA_PATH);
                const json = await response.json();
                AppState.productionData = json.data;
                AppState.dataSource = 'local';
                
                updateDataSourceFooter();
                return true;
            } catch (fallbackError) {
                console.error('✗ Fallback also failed:', fallbackError);
                return false;
            }
        }
        
        return false;
    }
}

// ==========================================
// 9. UTILITY FUNCTIONS
// ==========================================

/**
 * Format angka dengan thousand separator
 */
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Mencari feature berdasarkan kode provinsi
 */
function findFeatureByKode(kodeProv) {
    return AppState.geoJsonData.features.find(
        f => f.properties.KODE_PROV === kodeProv
    );
}

/**
 * Show/hide loading indicator
 */
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

/**
 * Show error message
 */
function showError(message) {
    alert(message); // Bisa diganti dengan toast notification yang lebih elegan
}

/**
 * Update data source di footer
 */
function updateDataSourceFooter() {
    const footerElement = document.getElementById('dataSource');
    if (!footerElement) return;
    
    const sourceText = AppState.dataSource === 'bps' 
        ? `Data dari BPS WebAPI | Terakhir diperbarui: ${new Date(AppState.lastUpdate).toLocaleString('id-ID')}`
        : `Data lokal (simulasi) | BPS API tidak tersedia`;
    
    footerElement.textContent = sourceText;
}

// ==========================================
// 10. APPLICATION INITIALIZATION
// ==========================================

/**
 * Main initialization function
 * Orchestrates the entire application startup
 */
async function initializeApp() {
    console.log('Initializing GIS Dashboard...');
    
    // Step 1: Load data
    const dataLoaded = await loadData();
    if (!dataLoaded) {
        console.error('Failed to initialize: Data loading error');
        return;
    }
    
    // Step 2: Initialize map
    initializeMap();
    
    // Step 3: Setup UI controls
    setupEventListeners();
    
    // Step 4: Initialize legend and statistics
    updateLegend();
    updateStatistics();
    
    // Step 5: Set initial control visibility
    updateControlVisibility();
    
    console.log('✓ GIS Dashboard initialized successfully in', AppState.currentMode, 'mode!');
}

// ==========================================
// 11. START APPLICATION
// ==========================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ==========================================
// 12. EXTENSION POINTS FOR BPS API
// ==========================================

/**
 * FUTURE IMPLEMENTATION: API Integration
 * 
 * Fungsi ini akan menggantikan loadData() saat integrasi dengan WebAPI BPS
 * 
 * Endpoint BPS yang relevan:
 * - https://webapi.bps.go.id/v1/api/list/model/data/domain/{domain_id}/key/{api_key}
 * - Subject ID untuk Produksi Padi: 53 (Tanaman Pangan)
 * 
 * Strategi Implementasi:
 * 1. Gunakan async/await untuk API calls
 * 2. Implement caching dengan localStorage untuk mengurangi API calls
 * 3. Handle rate limiting dari BPS API
 * 4. Implement error handling dan retry mechanism
 * 5. Add loading indicators
 */
async function loadDataFromBPSAPI(apiKey) {
    // Template untuk future implementation
    const BPS_CONFIG = {
        BASE_URL: 'https://webapi.bps.go.id/v1/api',
        SUBJECT_ID: '53', // Tanaman Pangan
        DOMAIN_ID: '0000', // Indonesia
    };
    
    try {
        // Example endpoint structure
        const url = `${BPS_CONFIG.BASE_URL}/list/model/data/domain/${BPS_CONFIG.DOMAIN_ID}/key/${apiKey}`;
        
        // Implement actual API call here
        // const response = await fetch(url);
        // const data = await response.json();
        
        // Transform BPS data structure to match current format
        // return transformBPSData(data);
        
        console.log('BPS API integration ready for implementation');
    } catch (error) {
        console.error('BPS API Error:', error);
        throw error;
    }
}

/**
 * Transform BPS API response to internal data structure
 */
function transformBPSData(bpsResponse) {
    // Mapping logic dari struktur BPS ke struktur internal
    // Contoh transformasi:
    // {
    //   kode_prov: extract from BPS turvar/turcol
    //   provinsi: nama provinsi
    //   jan-dec: nilai produksi per bulan
    // }
    
    return {
        metadata: {
            source: 'BPS WebAPI',
            lastUpdated: new Date().toISOString()
        },
        data: [] // Transformed data array
    };
}
