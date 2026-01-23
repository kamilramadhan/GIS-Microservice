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
    GEOJSON_PATH: '38 Provinsi Indonesia - Provinsi.json',
    
    // BPS API Configuration
    BPS_API: {
        BASE_URL: 'https://webapi.bps.go.id/v1/api',
        // APP ID - dapatkan dari dashboard BPS setelah registrasi
        APP_ID: '0a94470ebd2b059f522da5b53a491575', // Ganti dengan APP ID yang valid dari dashboard BPS
        
        // Subject codes untuk tanaman pangan
        SUBJECT: {
            PADI: '53', // Tanaman Pangan
            INDICATOR: '5203', // Produksi Padi
        },
        
        // Domain untuk Indonesia (semua provinsi)
        DOMAIN: '0000',
        
        // Endpoints (gunakan APP ID sebagai parameter key)
        ENDPOINTS: {
            LIST_DATA: '/list/model/data/domain/{domain}/key/{appid}',
            VERTICAL_VAR: '/list/model/var/lang/ind/domain/{domain}/key/{appid}'
        },
        
        // Cache settings
        CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 jam
        USE_CACHE: true
    },
    
    // Fallback ke data lokal jika BPS API tidak tersedia
    USE_LOCAL_FALLBACK: true,
    LOCAL_DATA_PATH: 'data-produksi-padi.json',
    
    // Color scheme untuk choropleth (YlOrRd palette)
    COLOR_SCALE: [
        { threshold: 0, color: '#fff5eb' },
        { threshold: 100000, color: '#fed976' },
        { threshold: 300000, color: '#feb24c' },
        { threshold: 600000, color: '#fd8d3c' },
        { threshold: 1000000, color: '#f03b20' },
        { threshold: 2000000, color: '#bd0026' }
    ],
    
    // Mapping bulan
    MONTH_NAMES: {
        jan: 'Januari', feb: 'Februari', mar: 'Maret',
        apr: 'April', may: 'Mei', jun: 'Juni',
        jul: 'Juli', aug: 'Agustus', sep: 'September',
        oct: 'Oktober', nov: 'November', dec: 'Desember'
    },
    
    MONTH_KEYS: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
    
    // Mapping kode provinsi BPS
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
    }
};

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================

const AppState = {
    currentMonth: 'may',
    currentYear: '2023',
    productionData: null,
    geoJsonData: null,
    map: null,
    geoJsonLayer: null,
    selectedProvince: null,
    dataSource: 'loading', // 'bps', 'local', or 'loading'
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
 * Memuat data dari BPS atau fallback ke data lokal
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
        
        // Load production data
        try {
            // Coba BPS API terlebih dahulu
            const bpsService = new BPSDataService();
            AppState.productionData = await bpsService.getData(AppState.currentYear);
            AppState.dataSource = 'bps';
            AppState.lastUpdate = new Date().toISOString();
            
            console.log('✓ Data loaded from BPS API:', {
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
            
            console.log('✓ Data loaded from local source');
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
 * Data Joining Strategy: Menggabungkan GeoJSON dengan Data Produksi
 * 
 * Key Insight: Menggunakan KODE_PROV sebagai primary key untuk joining
 * Algoritma: O(n) time complexity menggunakan Map untuk lookup efisien
 */
function createProductionLookup() {
    const lookup = new Map();
    
    AppState.productionData.forEach(province => {
        lookup.set(province.kode_prov, province);
    });
    
    return lookup;
}

/**
 * Mendapatkan nilai produksi untuk provinsi tertentu pada bulan tertentu
 */
function getProduction(kodeProv, month) {
    const lookup = createProductionLookup();
    const provinceData = lookup.get(kodeProv);
    
    return provinceData ? provinceData[month] : 0;
}

// ==========================================
// 4. CHOROPLETH COLOR MAPPING
// ==========================================

/**
 * Menentukan warna berdasarkan nilai produksi
 * Implementasi: Binary search bisa digunakan untuk optimasi jika scale besar
 * Saat ini: Linear search cukup efisien untuk 6 threshold
 */
function getColor(production) {
    for (let i = CONFIG.COLOR_SCALE.length - 1; i >= 0; i--) {
        if (production >= CONFIG.COLOR_SCALE[i].threshold) {
            return CONFIG.COLOR_SCALE[i].color;
        }
    }
    return CONFIG.COLOR_SCALE[0].color;
}

/**
 * Styling function untuk setiap feature di GeoJSON
 */
function styleFeature(feature) {
    const kodeProv = feature.properties.KODE_PROV;
    const production = getProduction(kodeProv, AppState.currentMonth);
    
    return {
        fillColor: getColor(production),
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
    
    // Popup untuk quick view
    const kodeProv = feature.properties.KODE_PROV;
    const production = getProduction(kodeProv, AppState.currentMonth);
    const monthName = CONFIG.MONTH_NAMES[AppState.currentMonth];
    
    layer.bindPopup(`
        <div class="popup-title">${feature.properties.PROVINSI}</div>
        <div class="popup-production">${formatNumber(production)}</div>
        <div class="popup-unit">ton (${monthName})</div>
    `);
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
    const lookup = createProductionLookup();
    const provinceData = lookup.get(kodeProv);
    
    if (!provinceData) {
        detailContainer.innerHTML = '<p>Data tidak tersedia</p>';
        return;
    }
    
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
    
    detailContainer.innerHTML = `
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
                <h4 class="detail-chart-title">Data Bulanan 2023</h4>
                <div class="monthly-data-list">
                    ${monthlyDataHTML}
                </div>
            </div>
        </div>
    `;
}

/**
 * Update statistik nasional
 */
function updateStatistics() {
    const productions = AppState.productionData.map(p => p[AppState.currentMonth]);
    
    const total = productions.reduce((sum, val) => sum + val, 0);
    const avg = total / productions.length;
    const max = Math.max(...productions);
    const min = Math.min(...productions);
    
    document.getElementById('totalProduction').textContent = formatNumber(total) + ' ton';
    document.getElementById('avgProduction').textContent = formatNumber(Math.round(avg)) + ' ton';
    
    const maxProvince = AppState.productionData.find(p => p[AppState.currentMonth] === max);
    const minProvince = AppState.productionData.find(p => p[AppState.currentMonth] === min);
    
    document.getElementById('maxProduction').textContent = 
        `${maxProvince.provinsi} (${formatNumber(max)})`;
    document.getElementById('minProduction').textContent = 
        `${minProvince.provinsi} (${formatNumber(min)})`;
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
    
    // Year change handler
    yearSelect.addEventListener('change', async (e) => {
        AppState.currentYear = e.target.value;
        console.log('Year changed to:', AppState.currentYear);
        
        // Reload data untuk tahun baru
        showLoading(true);
        const success = await loadProductionData();
        
        if (success) {
            updateChoropleth();
        }
        
        showLoading(false);
    });
    
    // Dropdown change handler
    monthSelect.addEventListener('change', (e) => {
        AppState.currentMonth = e.target.value;
        
        // Sync slider
        const monthIndex = CONFIG.MONTH_KEYS.indexOf(AppState.currentMonth);
        monthSlider.value = monthIndex;
        sliderValue.textContent = CONFIG.MONTH_NAMES[AppState.currentMonth];
        
        updateChoropleth();
    });
    
    // Slider change handler
    monthSlider.addEventListener('input', (e) => {
        const monthIndex = parseInt(e.target.value);
        AppState.currentMonth = CONFIG.MONTH_KEYS[monthIndex];
        
        // Sync dropdown
        monthSelect.value = AppState.currentMonth;
        sliderValue.textContent = CONFIG.MONTH_NAMES[AppState.currentMonth];
        
        updateChoropleth();
    });
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
    
    // Step 4: Initial statistics
    updateStatistics();
    
    console.log('GIS Dashboard initialized successfully!');
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
