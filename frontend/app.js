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
    LOCAL_DATA_PATH: 'data-produksi-padi-bps.json',

    // Development Mode: Skip BPS API (avoid CORS errors)
    // Set to true untuk langsung pakai local data tanpa coba BPS API dulu
    SKIP_BPS_API: true,  // ✅ Set true untuk development/testing

    // BI Price Data (Local)
    BI_PRICE_LOCAL_DATA: 'data-harga-beras-bi-historical.json',  // ✅ Historis Jan 2025 - Feb 2026
    USE_BI_LOCAL_DATA: true,  // ✅ Gunakan data lokal hasil scraping BI.go.id

    // Kawasan Transmigrasi overlay
    TRANSMIGRASI_GEOJSON_PATH: 'data-kawasan-transmigrasi.geojson',

    // Color scales untuk visualisasi
    COLOR_SCALES: {
        productivity: [
            { threshold: 0, color: '#4299e1', label: 'Potensi rendah', description: '< 0.90' },
            { threshold: 0.90, color: '#fed976', label: 'Potensi sedang', description: '0.90 - 1.10' },
            { threshold: 1.10, color: '#f56565', label: 'Potensi tinggi', description: '> 1.10' }
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
    currentYear: '2025',
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
    lastUpdate: null,
    // Kawasan Transmigrasi
    transmigrasiData: null,
    transmigrasiLayer: null,
    transmigrasiPinLayer: null,
    transmigrasiVisible: false,
    transmigrasiMode: 'overlay' // 'overlay' or 'pin'
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
     * Get price data for Beras (rice) by month
     * Returns IPE (Indeks Potensi Ekonomi) by province
     */
    async getPriceData(year, month) {
        const cacheKey = `beras_${year}_${month}`;

        if (CONFIG.BI_PRICE_API.USE_CACHE) {
            const cached = this.getCachedData(cacheKey);
            if (cached && !this.isCacheExpired(cached.timestamp)) {
                console.log('✓ Using cached price data');
                return cached.data;
            }
        }

        // Load dari local data jika enabled
        if (CONFIG.USE_BI_LOCAL_DATA) {
            console.log('📂 Loading BI price data from local file...');
            try {
                const localData = await this.loadLocalBIData(year, month);
                if (localData && localData.length > 0) {
                    console.log(`✓ Loaded ${localData.length} provinces from local BI data`);
                    this.setCachedData(cacheKey, localData);
                    return localData;
                }
            } catch (localError) {
                console.warn('⚠ Failed to load local BI data:', localError);
            }
        }

        console.log('→ Fetching price data from backend API...');
        try {
            // Call BI Scraper API for real BI.go.id data
            const apiUrl = `/api/bi/prices/beras`;
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
     *
     * STATUS: UNDER DEVELOPMENT
     * Target URL: https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalKomoditas
     *
     * Implementation plan:
     * 1. Web scraping dari halaman BI.go.id (backend/services/bi-scraper-service)
     * 2. Backend proxy service untuk distribute data
     * 3. Cache management untuk efisiensi
     */
    async fetchPriceData(commodity, year, month, marketType) {
        console.warn('🚧 BI Price Data - Not yet available');
        console.warn('🔄 Web scraper for BI.go.id is under development');

        // Return empty array - no data available yet
        return [];
    }

    /**
     * Load BI price data dari local JSON file (historis atau current)
     * Prioritas: data-harga-beras-bi-historical.json (preferred) → data-harga-beras-bi.json
     */
    async loadLocalBIData(year, month) {
        try {
            // Try historical data first (recommended)
            let response = await fetch(CONFIG.BI_PRICE_LOCAL_DATA);
            if (!response.ok) {
                // Fallback to alternative file jika available
                response = await fetch('data-harga-beras-bi.json');
                if (!response.ok) {
                    throw new Error(`Failed to load BI price data`);
                }
            }

            const jsonData = await response.json();

            // Get data for the specified year
            const yearData = jsonData[year];
            if (!yearData) {
                console.warn(`No data for year ${year}`);
                return [];
            }

            // month parameter is already a key like 'jan', 'feb', etc.
            const monthKey = month || 'jan';

            // Transform to economic index format
            // Get national average for this month from data
            const nationalAvg = yearData.national_averages ? (yearData.national_averages[monthKey] || 0) : 0;

            const economicIndex = yearData.data.map(item => {
                const price = item[monthKey] || 0;
                const basePrice = nationalAvg > 0 ? nationalAvg : this.getBasePrice('beras_premium');

                // Calculate IPE (Indeks Potensi Ekonomi)
                // IPE = Harga_Provinsi / Harga_Nasional
                // > 1.00 = lebih mahal dari rata-rata (merah jika > 1.10)
                // < 1.00 = lebih murah dari rata-rata (biru jika < 0.90)
                const ipe = basePrice > 0 ? price / basePrice : 0;

                // Kategorisasi
                let kategori = 'Sedang';
                if (ipe > 1.10) kategori = 'Tinggi';
                else if (ipe < 0.90) kategori = 'Rendah';

                // Collect all monthly prices for this province
                const monthlyPrices = {};
                CONFIG.MONTH_KEYS.forEach(mk => {
                    monthlyPrices[mk] = item[mk] || 0;
                });

                return {
                    kode_prov: item.province_code,
                    provinsi: item.province_name,
                    harga: price,
                    satuan: 'Rp/kg',
                    ipe: Math.round(ipe * 100) / 100,
                    kategori: kategori,
                    harga_nasional: basePrice,
                    national_averages: yearData.national_averages || {},
                    ...monthlyPrices
                };
            }).filter(item => item.harga > 0); // Filter out provinces with no data

            console.log('✓ BI Local data loaded:', {
                source: yearData.metadata.source,
                period: `${monthKey} ${year}`,
            });

            return economicIndex;

        } catch (error) {
            console.error('Error loading local BI data:', error);
            throw error;
        }
    }

    /**
     * Generate realistic mock price data - DISABLED
     * Fitur ini dinonaktifkan karena sedang development web scraper BI.go.id
     *
     * @deprecated Use real BI.go.id scraping data instead
     * @returns Empty array - no mock data
     */
    generateMockPriceData(commodity) {
        console.warn('🚧 Mock price data generation is disabled.');
        console.warn('⚠️  Economic/Price Heatmap requires real data from BI.go.id');
        console.warn('🔄 Web scraper development in progress...');

        // Return empty array - no mock data
        return [];
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
    // Skip BPS API jika SKIP_BPS_API = true (development mode)
    if (CONFIG.SKIP_BPS_API) {
        console.log('ℹ️  Development mode: Using local data (BPS API skipped)');
        await loadLocalProductionData();
        return;
    }

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

        await loadLocalProductionData();
    }
}

/**
 * Load production data dari file lokal
 */
async function loadLocalProductionData() {
    const localResponse = await fetch(CONFIG.LOCAL_DATA_PATH);
    if (!localResponse.ok) {
        throw new Error('Failed to load local data');
    }

    const localJson = await localResponse.json();

    // New data structure has years as top-level keys
    if (localJson[AppState.currentYear]) {
        AppState.productionData = localJson[AppState.currentYear].data;
        AppState.dataSource = 'local-bps';
        AppState.lastUpdate = localJson[AppState.currentYear].metadata.last_update;
    } else {
        // Fallback to old structure or first available year
        if (localJson.data) {
            AppState.productionData = localJson.data;
        } else {
            // Use first available year
            const firstYear = Object.keys(localJson).find(k => localJson[k].data);
            if (firstYear) {
                AppState.productionData = localJson[firstYear].data;
                console.warn(`⚠ Year ${AppState.currentYear} not available, using ${firstYear}`);
            }
        }
        AppState.dataSource = 'local';
    }

    console.log('✓ Production data loaded from local source:', {
        year: AppState.currentYear,
        provinces: AppState.productionData?.length || 0,
        source: AppState.dataSource
    });
}

/**
 * Load price data from Bank Indonesia
 *
 * NOTE: Currently under development - BI.go.id web scraping
 * URL Target: https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalKomoditas
 */
async function loadEconomicData() {
    console.log('📊 Loading Economic/Price data from BI.go.id...');

    try {
        const biService = new BIPriceService();
        AppState.economicIndexData = await biService.getPriceData(
            AppState.currentYear,
            AppState.currentMonth
        );

        // Check if data is empty
        if (!AppState.economicIndexData || AppState.economicIndexData.length === 0) {
            console.warn('⚠️  No price data available for selected period');
            AppState.dataSource = 'none';
            AppState.economicIndexData = [];
            return;
        }

        AppState.dataSource = 'bi-local';
        AppState.lastUpdate = new Date().toISOString();

        console.log('✓ Economic data loaded from BI:', {
            commodity: AppState.currentCommodity,
            year: AppState.currentYear,
            month: AppState.currentMonth,
            provinces: AppState.economicIndexData.length
        });

    } catch (error) {
        console.error('✗ Failed to load economic data:', error);
        AppState.dataSource = 'none';
        AppState.economicIndexData = [];
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
        const provincialProduction = provinceData[month] || 0;
        const nationalAverage = getNationalAverageProduction(month);
        if (nationalAverage === 0) return 0;
        const ipp = provincialProduction / nationalAverage;
        return ipp;
    } else if (AppState.currentMode === 'economic') {
        return provinceData.ipe || 0;
    }

    return 0;
}

function getNationalAverageProduction(month) {
    if (!AppState.productionData || AppState.productionData.length === 0) return 0;
    const productions = AppState.productionData.map(p => p[month] || 0);
    const total = productions.reduce((sum, val) => sum + val, 0);
    return total / productions.length;
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
        ? CONFIG.COLOR_SCALES.productivity
        : CONFIG.COLOR_SCALES.economic;

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
        const ipp = getValue(kodeProv, AppState.currentMonth);
        const lookup = createDataLookup();
        const provinceData = lookup.get(kodeProv);
        const production = provinceData ? provinceData[AppState.currentMonth] : 0;
        let kategori = 'Sedang';
        if (ipp > 1.10) kategori = 'Tinggi';
        else if (ipp < 0.90) kategori = 'Rendah';
        popupContent = `
            <div class="popup-title">${feature.properties.PROVINSI}</div>
            <div class="popup-production">${formatNumber(production)} ton</div>
            <div class="popup-unit">Produksi (${monthName})</div>
            <div class="popup-unit">IPP: ${ipp.toFixed(2)} (${kategori})</div>
        `;
    } else if (AppState.currentMode === 'economic') {
        const lookup = createDataLookup();
        const provinceData = lookup.get(kodeProv);

        if (provinceData) {
            popupContent = `
                <div class="popup-title">${feature.properties.PROVINSI}</div>
                <div class="popup-production">Rp ${formatNumber(provinceData.harga)} /kg</div>
                <div class="popup-unit">Harga Beras (${monthName})</div>
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

    // Create custom pane for transmigrasi overlay (above choropleth)
    AppState.map.createPane('transmigrasiPane');
    AppState.map.getPane('transmigrasiPane').style.zIndex = 450;
    AppState.map.getPane('transmigrasiPane').style.pointerEvents = 'auto';

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

    // Load transmigrasi data (non-blocking)
    loadTransmigrasiData();

    console.log('Map initialized successfully');
}

// ==========================================
// 6b. KAWASAN TRANSMIGRASI OVERLAY
// ==========================================

/**
 * Load transmigration area GeoJSON data
 */
async function loadTransmigrasiData() {
    try {
        const response = await fetch(CONFIG.TRANSMIGRASI_GEOJSON_PATH);
        if (!response.ok) {
            console.warn('Transmigrasi GeoJSON not found:', response.status);
            return;
        }
        AppState.transmigrasiData = await response.json();
        const count = AppState.transmigrasiData.features ? AppState.transmigrasiData.features.length : 0;
        console.log(`✓ Transmigrasi data loaded: ${count} desa`);

        // Update count in UI
        const countEl = document.getElementById('transmigrasiCount');
        if (countEl) {
            countEl.textContent = `${count} desa`;
        }
    } catch (err) {
        console.warn('Failed to load transmigrasi data:', err);
    }
}

/**
 * Create/update transmigration overlay layer
 */
function createTransmigrasiLayer() {
    if (!AppState.transmigrasiData || !AppState.map) return;

    // Remove existing layer if any
    if (AppState.transmigrasiLayer) {
        AppState.map.removeLayer(AppState.transmigrasiLayer);
        AppState.transmigrasiLayer = null;
    }

    AppState.transmigrasiLayer = L.geoJSON(AppState.transmigrasiData, {
        pane: 'transmigrasiPane',
        style: function(feature) {
            return {
                color: '#16a34a',
                weight: 2,
                opacity: 0.9,
                fillColor: '#22c55e',
                fillOpacity: 0.35,
                dashArray: '5, 5'
            };
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties || {};
            const popupContent = `
                <div class="transmigrasi-popup-title">${props.nama_desa || 'Desa Transmigrasi'}</div>
                <div class="transmigrasi-popup-body">
                    <div><span class="label">Kecamatan:</span> <span class="value">${props.kecamatan || '-'}</span></div>
                    <div><span class="label">Kabupaten:</span> <span class="value">${props.kabupaten || '-'}</span></div>
                    <div><span class="label">Provinsi:</span> <span class="value">${props.provinsi || '-'}</span></div>
                    <div><span class="label">Luas:</span> <span class="value">${props.luas_km2 ? props.luas_km2 + ' km²' : '-'}</span></div>
                    <div><span class="label">Kode Desa:</span> <span class="value">${props.kode_desa || '-'}</span></div>
                </div>
            `;
            layer.bindPopup(popupContent, {
                className: 'transmigrasi-popup',
                maxWidth: 250
            });

            layer.on({
                mouseover: function(e) {
                    e.target.setStyle({
                        weight: 3,
                        fillOpacity: 0.5,
                        color: '#15803d'
                    });
                    e.target.bringToFront();
                },
                mouseout: function(e) {
                    AppState.transmigrasiLayer.resetStyle(e.target);
                }
            });
        }
    });

    if (AppState.transmigrasiVisible && AppState.transmigrasiMode === 'overlay') {
        AppState.transmigrasiLayer.addTo(AppState.map);
    }
}

/**
 * Create pin/marker layer for transmigration areas (Mode B)
 */
function createTransmigrasiPinLayer() {
    if (!AppState.transmigrasiData || !AppState.map) return;

    // Remove existing pin layer
    if (AppState.transmigrasiPinLayer) {
        AppState.map.removeLayer(AppState.transmigrasiPinLayer);
        AppState.transmigrasiPinLayer = null;
    }

    const markers = [];

    AppState.transmigrasiData.features.forEach(function(feature) {
        if (!feature.geometry) return;

        const props = feature.properties || {};

        // Calculate centroid from geometry
        let lat, lng;
        const geomType = feature.geometry.type;
        const coords = feature.geometry.coordinates;

        if (geomType === 'Point') {
            lng = coords[0];
            lat = coords[1];
        } else if (geomType === 'Polygon') {
            // Simple centroid: average of exterior ring
            const ring = coords[0];
            let sumLat = 0, sumLng = 0;
            ring.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
            lng = sumLng / ring.length;
            lat = sumLat / ring.length;
        } else if (geomType === 'MultiPolygon') {
            // Centroid of first polygon
            const ring = coords[0][0];
            let sumLat = 0, sumLng = 0;
            ring.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
            lng = sumLng / ring.length;
            lat = sumLat / ring.length;
        } else {
            return;
        }

        // Create custom div icon (green dot)
        const icon = L.divIcon({
            className: 'transmigrasi-pin-icon',
            html: '<div class="pin-dot"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            popupAnchor: [0, -10]
        });

        const marker = L.marker([lat, lng], {
            icon: icon,
            pane: 'transmigrasiPane'
        });

        const popupContent = `
            <div class="transmigrasi-popup-title">${props.nama_desa || 'Desa Transmigrasi'}</div>
            <div class="transmigrasi-popup-body">
                <div><span class="label">Kecamatan:</span> <span class="value">${props.kecamatan || '-'}</span></div>
                <div><span class="label">Kabupaten:</span> <span class="value">${props.kabupaten || '-'}</span></div>
                <div><span class="label">Provinsi:</span> <span class="value">${props.provinsi || '-'}</span></div>
                <div><span class="label">Luas:</span> <span class="value">${props.luas_km2 ? props.luas_km2 + ' km²' : '-'}</span></div>
                <div><span class="label">Kode:</span> <span class="value">${props.kode_desa || '-'}</span></div>
            </div>
        `;
        marker.bindPopup(popupContent, {
            className: 'transmigrasi-popup',
            maxWidth: 250
        });

        markers.push(marker);
    });

    AppState.transmigrasiPinLayer = L.layerGroup(markers);

    if (AppState.transmigrasiVisible && AppState.transmigrasiMode === 'pin') {
        AppState.transmigrasiPinLayer.addTo(AppState.map);
    }
}

/**
 * Toggle transmigration layer visibility
 */
function toggleTransmigrasiLayer(visible) {
    AppState.transmigrasiVisible = visible;
    const infoEl = document.getElementById('transmigrasiInfo');
    const modeEl = document.getElementById('transmigrasiModeSelector');

    if (visible) {
        showActiveTransmigrasiMode();
        if (infoEl) infoEl.style.display = 'block';
        if (modeEl) modeEl.style.display = 'flex';
    } else {
        removeAllTransmigrasiLayers();
        if (infoEl) infoEl.style.display = 'none';
        if (modeEl) modeEl.style.display = 'none';
    }
}

/**
 * Switch transmigration display mode (overlay ↔ pin)
 */
function switchTransmigrasiMode(mode) {
    AppState.transmigrasiMode = mode;

    // Update button active states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.transmode === mode);
    });

    if (AppState.transmigrasiVisible) {
        removeAllTransmigrasiLayers();
        showActiveTransmigrasiMode();
    }
}

/** Remove both overlay and pin layers from map */
function removeAllTransmigrasiLayers() {
    if (AppState.transmigrasiLayer) {
        AppState.map.removeLayer(AppState.transmigrasiLayer);
    }
    if (AppState.transmigrasiPinLayer) {
        AppState.map.removeLayer(AppState.transmigrasiPinLayer);
    }
}

/** Show the currently active transmigrasi mode */
function showActiveTransmigrasiMode() {
    if (!AppState.transmigrasiData) return;

    if (AppState.transmigrasiMode === 'overlay') {
        if (!AppState.transmigrasiLayer) createTransmigrasiLayer();
        if (AppState.transmigrasiLayer) {
            AppState.transmigrasiLayer.addTo(AppState.map);
        }
    } else if (AppState.transmigrasiMode === 'pin') {
        if (!AppState.transmigrasiPinLayer) createTransmigrasiPinLayer();
        if (AppState.transmigrasiPinLayer) {
            AppState.transmigrasiPinLayer.addTo(AppState.map);
        }
    }
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

        // Update popup content based on current mode
        const kodeProv = layer.feature.properties.KODE_PROV;
        const monthName = CONFIG.MONTH_NAMES[AppState.currentMonth];
        let popupContent = '';

        if (AppState.currentMode === 'economic') {
            const lookup = createDataLookup();
            const provinceData = lookup.get(kodeProv);
            if (provinceData) {
                popupContent = `
                    <div class="popup-title">${layer.feature.properties.PROVINSI}</div>
                    <div class="popup-production">Rp ${formatNumber(provinceData.harga)} /kg</div>
                    <div class="popup-unit">Harga Beras (${monthName})</div>
                    <div class="popup-unit">IPE: ${provinceData.ipe} (${provinceData.kategori})</div>
                `;
            } else {
                popupContent = `
                    <div class="popup-title">${layer.feature.properties.PROVINSI}</div>
                    <div class="popup-production">-</div>
                    <div class="popup-unit">Data tidak tersedia</div>
                `;
            }
        } else {
            const ipp = getValue(kodeProv, AppState.currentMonth);
            const lookup = createDataLookup();
            const provinceData = lookup.get(kodeProv);
            const production = provinceData ? provinceData[AppState.currentMonth] : 0;
            let kategori = 'Sedang';
            if (ipp > 1.10) kategori = 'Tinggi';
            else if (ipp < 0.90) kategori = 'Rendah';
            popupContent = `
                <div class="popup-title">${layer.feature.properties.PROVINSI}</div>
                <div class="popup-production">${formatNumber(production)} ton</div>
                <div class="popup-unit">Produksi (${monthName})</div>
                <div class="popup-unit">IPP: ${ipp.toFixed(2)} (${kategori})</div>
            `;
        }

        layer.setPopupContent(popupContent);
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

    // Keep transmigrasi layer on top
    if (AppState.transmigrasiVisible && AppState.transmigrasiLayer) {
        AppState.transmigrasiLayer.bringToFront();
    }
}

/**
 * Update panel detail provinsi
 */
function updateDetailPanel(kodeProv, provinsiName) {
    const detailContainer = document.getElementById('provinceDetail');

    // Check if in economic mode with no data
    if (AppState.currentMode === 'economic' && (!AppState.economicIndexData || AppState.economicIndexData.length === 0)) {
        detailContainer.innerHTML = `
            <div class="detail-content" style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🚧</div>
                <h3 style="color: #667eea; margin-bottom: 1rem;">Data Dalam Pengembangan</h3>
                <p style="color: #64748b; line-height: 1.6; margin-bottom: 1.5rem;">
                    Fitur Economic/Price Heatmap sedang dalam tahap development.<br>
                    Web scraper untuk data Bank Indonesia masih dalam proses implementasi.
                </p>
                <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; font-size: 0.9rem;">
                    <div style="font-weight: 600; color: #475569; margin-bottom: 0.5rem;">Target Data Source:</div>
                    <div style="color: #64748b; word-break: break-all; font-size: 0.85rem;">
                        https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalKomoditas
                    </div>
                </div>
            </div>
        `;
        return;
    }

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
    const nationalAverage = getNationalAverageProduction(AppState.currentMonth);
    const ipp = nationalAverage > 0 ? currentProduction / nationalAverage : 0;

    // Determine category
    let category = 'Potensi Sedang';
    let categoryColor = '#fed976';
    if (ipp > 1.10) {
        category = 'Potensi Tinggi';
        categoryColor = '#f56565';
    } else if (ipp < 0.90) {
        category = 'Potensi Rendah';
        categoryColor = '#4299e1';
    }

    // Generate monthly data list
    const monthlyDataHTML = CONFIG.MONTH_KEYS.map(monthKey => {
        const isActive = monthKey === AppState.currentMonth;
        const value = provinceData[monthKey];

        return `
            <div class="monthly-data-item ${isActive ? 'active' : ''}">
                <span class="month-value">${formatNumber(value)} ton</span>
                <span class="month-name">${CONFIG.MONTH_NAMES[monthKey]}</span>
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
                <div class="detail-production-label">IPP (Indeks Potensi Produktivitas)</div>
                <div class="detail-production-value">${(ipp).toFixed(2)}</div>
                <div class="detail-production-unit" style="display: inline-block; background: ${categoryColor}; color: white; padding: 4px 16px; border-radius: 20px; font-weight: 600; font-size: 0.8rem; margin-top: 4px;">${category}</div>
            </div>

            <div class="detail-chart">
                <h4 class="detail-chart-title">Produksi ${monthName}</h4>
                <div class="detail-comparison">
                    <div class="comparison-card primary">
                        <div class="comparison-label">Provinsi</div>
                        <div class="comparison-value">${formatNumber(currentProduction)}</div>
                        <div class="comparison-unit">ton</div>
                    </div>
                    <div class="comparison-card secondary">
                        <div class="comparison-label">Rata-rata Nasional</div>
                        <div class="comparison-value">${formatNumber(nationalAverage.toFixed(0))}</div>
                        <div class="comparison-unit">ton</div>
                    </div>
                </div>
            </div>

            <div class="detail-chart">
                <h4 class="detail-chart-title">Data Bulanan ${AppState.currentYear}</h4>
                <div class="monthly-data-list">
                    ${monthlyDataHTML}
                </div>
            </div>

            <div class="interpretation-box">
                <strong>Interpretasi</strong>
                <div class="interpretation-text">
                ${ipp < 0.90 ?
                    '⚠ Produksi provinsi ini di bawah rata-rata nasional, perlu perhatian untuk peningkatan produktivitas.' :
                    ipp > 1.10 ?
                    '✓ Produksi provinsi ini di atas rata-rata nasional, berpotensi menjadi lumbung pangan.' :
                    '● Produksi provinsi ini dalam kisaran normal rata-rata nasional.'
                }
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
    const ipe = provinceData.ipe;

    // Determine category (IPE is ratio: 1.00 = same as national avg)
    let category = 'Harga Sedang';
    let categoryColor = '#fed976';
    if (ipe > 1.10) {
        category = 'Harga Tinggi';
        categoryColor = '#f56565';
    } else if (ipe < 0.90) {
        category = 'Harga Rendah';
        categoryColor = '#4299e1';
    }

    // Generate monthly price data list
    const monthlyDataHTML = CONFIG.MONTH_KEYS.map(monthKey => {
        const isActive = monthKey === AppState.currentMonth;
        const price = provinceData[monthKey] || 0;
        const displayPrice = price > 0 ? `Rp ${formatNumber(price)}` : '-';

        return `
            <div class="monthly-data-item ${isActive ? 'active' : ''}">
                <span class="month-value">${displayPrice}</span>
                <span class="month-name">${CONFIG.MONTH_NAMES[monthKey]}</span>
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
                <div class="detail-production-label">IPE (Indeks Potensi Ekonomi)</div>
                <div class="detail-production-value">${(ipe).toFixed(2)}</div>
                <div class="detail-production-unit" style="display: inline-block; background: ${categoryColor}; color: white; padding: 4px 16px; border-radius: 20px; font-weight: 600; font-size: 0.8rem; margin-top: 4px;">${category}</div>
            </div>

            <div class="detail-chart">
                <h4 class="detail-chart-title">Harga Beras ${monthName}</h4>
                <div class="detail-comparison">
                    <div class="comparison-card primary">
                        <div class="comparison-label">Provinsi</div>
                        <div class="comparison-value">Rp ${formatNumber(provinceData.harga)}</div>
                        <div class="comparison-unit">/kg</div>
                    </div>
                    <div class="comparison-card secondary">
                        <div class="comparison-label">Rata-rata Nasional</div>
                        <div class="comparison-value">Rp ${formatNumber(provinceData.harga_nasional)}</div>
                        <div class="comparison-unit">/kg</div>
                    </div>
                </div>
            </div>

            <div class="detail-chart">
                <h4 class="detail-chart-title">Data Bulanan ${AppState.currentYear}</h4>
                <div class="monthly-data-list">
                    ${monthlyDataHTML}
                </div>
            </div>

            <div class="interpretation-box">
                <strong>Interpretasi</strong>
                <div class="interpretation-text">
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
    const nationalAvg = getNationalAverageProduction(AppState.currentMonth);

    const total = productions.reduce((sum, val) => sum + val, 0);
    const avg = total / productions.length;
    const max = Math.max(...productions);
    const min = Math.min(...productions);

    const maxProvince = AppState.productionData.find(p => p[AppState.currentMonth] === max);
    const minProvince = AppState.productionData.find(p => p[AppState.currentMonth] === min);

    const maxIPP = nationalAvg > 0 ? (max / nationalAvg) : 0;
    const minIPP = nationalAvg > 0 ? (min / nationalAvg) : 0;

    // Count provinces by IPP category
    const lowProd = AppState.productionData.filter(p => {
        const ipp = nationalAvg > 0 ? p[AppState.currentMonth] / nationalAvg : 0;
        return ipp < 0.90;
    }).length;
    const normalProd = AppState.productionData.filter(p => {
        const ipp = nationalAvg > 0 ? p[AppState.currentMonth] / nationalAvg : 0;
        return ipp >= 0.90 && ipp <= 1.10;
    }).length;
    const highProd = AppState.productionData.filter(p => {
        const ipp = nationalAvg > 0 ? p[AppState.currentMonth] / nationalAvg : 0;
        return ipp > 1.10;
    }).length;

    container.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Total Produksi:</span>
            <span class="stat-value">${formatNumber(total)} ton</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Rata-rata Nasional:</span>
            <span class="stat-value">${formatNumber(Math.round(avg))} ton</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Tertinggi:</span>
            <span class="stat-value">${maxProvince.provinsi}<br>${formatNumber(max)} ton (IPP: ${maxIPP.toFixed(2)})</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Terendah:</span>
            <span class="stat-value">${minProvince.provinsi}<br>${formatNumber(min)} ton (IPP: ${minIPP.toFixed(2)})</span>
        </div>
        <div class="stat-item" style="grid-column: 1 / -1; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
            <span class="stat-label">Distribusi:</span>
            <span class="stat-value">
                <span style="color: #4299e1;">● ${lowProd} rendah</span> |
                <span style="color: #eab308;">● ${normalProd} sedang</span> |
                <span style="color: #f56565;">● ${highProd} tinggi</span>
            </span>
        </div>
    `;
}

/**
 * Update statistics for economic mode
 */
function updateEconomicStatistics(container, title) {
    title.textContent = 'Statistik Harga Nasional';

    // Check if data is available
    if (!AppState.economicIndexData || AppState.economicIndexData.length === 0) {
        container.innerHTML = `
            <div class="development-notice" style="grid-column: 1 / -1; padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚧</div>
                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">
                    Fitur Dalam Pengembangan
                </div>
                <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 1rem;">
                    Economic/Price Heatmap sedang dalam tahap development
                </div>
                <div style="font-size: 0.85rem; opacity: 0.8; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 6px; margin-top: 1rem;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">📍 Target Data Source:</div>
                    <div style="word-break: break-all; font-family: monospace; font-size: 0.8rem;">
                        https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalKomoditas
                    </div>
                </div>
                <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 1rem;">
                    🔄 Web scraper untuk data Bank Indonesia sedang dikembangkan
                </div>
            </div>
        `;
        return;
    }

    const prices = AppState.economicIndexData.map(p => p.harga);
    const ipes = AppState.economicIndexData.map(p => p.ipe);

    const avgPrice = prices.reduce((sum, val) => sum + val, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    const maxProvince = AppState.economicIndexData.find(p => p.harga === maxPrice);
    const minProvince = AppState.economicIndexData.find(p => p.harga === minPrice);

    // Count provinces by category
    const lowPrice = AppState.economicIndexData.filter(p => p.kategori === 'Rendah').length;
    const normalPrice = AppState.economicIndexData.filter(p => p.kategori === 'Sedang').length;
    const highPrice = AppState.economicIndexData.filter(p => p.kategori === 'Tinggi').length;

    const commodityName = 'Beras (Semua Kualitas)';
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
            updateDataSourceFooter(); // Update footer based on mode and data source
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

    // Transmigrasi layer toggle handler
    const transmigrasiToggle = document.getElementById('transmigrasiToggle');
    if (transmigrasiToggle) {
        transmigrasiToggle.addEventListener('change', (e) => {
            toggleTransmigrasiLayer(e.target.checked);
            console.log('Transmigrasi layer:', e.target.checked ? 'ON' : 'OFF');
        });
    }

    // Transmigrasi A/B mode buttons
    document.querySelectorAll('.mode-btn[data-transmode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.transmode;
            switchTransmigrasiMode(mode);
            console.log('Transmigrasi mode:', mode);
        });
    });
}

/**
 * Update control panel visibility based on current mode
 */
function updateControlVisibility() {
    const commodityGroup = document.getElementById('commodityGroup');
    const marketTypeGroup = document.getElementById('marketTypeGroup');
    const controlPanelTitle = document.getElementById('controlPanelTitle');

    // Always hide commodity and market type selectors (not used - only Beras monthly data)
    commodityGroup.style.display = 'none';
    marketTypeGroup.style.display = 'none';
    controlPanelTitle.textContent = 'Filter & Kontrol';
}

/**
 * Update legend based on current mode
 */
function updateLegend() {
    const legendContainer = document.getElementById('legendContainer');

    if (AppState.currentMode === 'productivity') {
        legendContainer.innerHTML = `
            <h3 class="legend-title">Legenda IPP (Indeks Potensi Produktivitas)</h3>
            <div class="legend-items">
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #4299e1;"></span>
                    <span class="legend-text">Potensi Rendah (&lt; 0.90)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #fed976;"></span>
                    <span class="legend-text">Potensi Sedang (0.90 - 1.10)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: #f56565;"></span>
                    <span class="legend-text">Potensi Tinggi (&gt; 1.10)</span>
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

                // New data structure has years as top-level keys
                if (json[AppState.currentYear]) {
                    AppState.productionData = json[AppState.currentYear].data;
                    AppState.dataSource = 'local-bps';
                    AppState.lastUpdate = json[AppState.currentYear].metadata.last_update;
                } else {
                    // Fallback to old structure or first available year
                    if (json.data) {
                        AppState.productionData = json.data;
                    } else {
                        // Use first available year
                        const firstYear = Object.keys(json).find(k => json[k].data);
                        if (firstYear) {
                            AppState.productionData = json[firstYear].data;
                            console.warn(`⚠ Year ${AppState.currentYear} not available, using ${firstYear}`);
                        }
                    }
                    AppState.dataSource = 'local';
                }

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

    let sourceText;

    // Handle economic mode with no data
    if (AppState.currentMode === 'economic' && AppState.dataSource === 'none') {
        sourceText = `🚧 Economic Mode: Under Development - BI.go.id web scraper in progress`;
    }
    // Handle BPS WebAPI
    else if (AppState.dataSource === 'bps') {
        sourceText = `Data dari BPS WebAPI | Terakhir diperbarui: ${new Date(AppState.lastUpdate).toLocaleString('id-ID')}`;
    }
    // Handle local BPS data
    else if (AppState.dataSource === 'local-bps') {
        sourceText = `Data dari BPS (${AppState.currentYear}) | Terakhir diperbarui: ${new Date(AppState.lastUpdate).toLocaleString('id-ID')}`;
    }
    // Handle BI data (when available)
    else if (AppState.dataSource === 'bi') {
        sourceText = `Data dari Bank Indonesia | Terakhir diperbarui: ${new Date(AppState.lastUpdate).toLocaleString('id-ID')}`;
    }
    // Default fallback
    else {
        sourceText = `Data lokal (simulasi) | BPS API tidak tersedia`;
    }

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

    // Step 0: Clear stale cache (IPE formula changed from percentage to ratio)
    const CACHE_VERSION = 'v3_ratio';
    if (localStorage.getItem('cache_version') !== CACHE_VERSION) {
        console.log('🗑️ Clearing stale cache (formula updated)...');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('bi_price_data') || key.startsWith('bps_production_data')) {
                localStorage.removeItem(key);
            }
        });
        localStorage.setItem('cache_version', CACHE_VERSION);
    }

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
