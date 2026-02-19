/**
 * Transform BPS Scraping Results to Frontend Format
 * Converts BPS API response format to the frontend's expected data structure
 */

const fs = require('fs');
const path = require('path');

// Province code mapping from BPS format (4 digits) to simplified format (2 digits)
const PROVINCE_CODE_MAPPING = {
    '1100': '11', // Aceh
    '1200': '12', // Sumatera Utara
    '1300': '13', // Sumatera Barat
    '1400': '14', // Riau
    '1500': '15', // Jambi
    '1600': '16', // Sumatera Selatan
    '1700': '17', // Bengkulu
    '1800': '18', // Lampung
    '1900': '19', // Kepulauan Bangka Belitung
    '2100': '21', // Kepulauan Riau
    '3100': '31', // DKI Jakarta
    '3200': '32', // Jawa Barat
    '3300': '33', // Jawa Tengah
    '3400': '34', // DI Yogyakarta
    '3500': '35', // Jawa Timur
    '3600': '36', // Banten
    '5100': '51', // Bali
    '5200': '52', // Nusa Tenggara Barat
    '5300': '53', // Nusa Tenggara Timur
    '6100': '61', // Kalimantan Barat
    '6200': '62', // Kalimantan Tengah
    '6300': '63', // Kalimantan Selatan
    '6400': '64', // Kalimantan Timur
    '6500': '65', // Kalimantan Utara
    '7100': '71', // Sulawesi Utara
    '7200': '72', // Sulawesi Tengah
    '7300': '73', // Sulawesi Selatan
    '7400': '74', // Sulawesi Tenggara
    '7500': '75', // Gorontalo
    '7600': '76', // Sulawesi Barat
    '8100': '81', // Maluku
    '8200': '82', // Maluku Utara
    '9100': '91', // Papua Barat
    '9200': '92', // Papua Barat Daya
    '9400': '94', // Papua
    '9500': '95', // Papua Selatan
    '9600': '96', // Papua Tengah
    '9700': '97', // Papua Pegunungan
    '9999': '99'  // Indonesia (total)
};

const PROVINCE_NAMES = {
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
    '91': 'Papua Barat', '92': 'Papua Barat Daya',
    '94': 'Papua', '95': 'Papua Selatan',
    '96': 'Papua Tengah', '97': 'Papua Pegunungan'
};

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Parse datacontent key to extract components
 * Format: {provinceCode}{varCode}{yearCode}{monthCode}
 * Example: "6200250601258" = Kalimantan Tengah, var 2506, year 0125 (2025), month 8 (August)
 */
function parseDataKey(key) {
    // Province code is first 4 digits
    const provinceCode = key.substring(0, 4);

    // Variable code is next 4 digits (2506)
    const varCode = key.substring(4, 8);

    // Year code is next 4 digits (0125 = 2025)
    const yearCode = key.substring(8, 12);

    // Month code is remaining digits (1-13, where 13 = yearly total)
    const monthCode = parseInt(key.substring(12));

    return {
        provinceCode,
        varCode,
        yearCode,
        monthCode
    };
}

/**
 * Convert year code to actual year
 * Example: 125 -> "2025", 126 -> "2026"
 */
function convertYearCode(yearCode) {
    // Year code is already the year offset from 1900
    // 125 = 1900 + 125 = 2025
    const year = 1900 + parseInt(yearCode);
    return year.toString();
}

/**
 * Transform BPS data for a specific year
 */
function transformYearData(yearData, year) {
    const provincesData = {};

    // Initialize data structure for each province
    Object.values(PROVINCE_CODE_MAPPING).forEach(code => {
        if (code === '99') return; // Skip Indonesia total

        provincesData[code] = {
            kode_prov: code,
            provinsi: PROVINCE_NAMES[code],
            jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
            jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
        };
    });

    // Process datacontent
    const datacontent = yearData.data.datacontent;

    Object.entries(datacontent).forEach(([key, value]) => {
        const parsed = parseDataKey(key);

        // Skip if not a valid province or if it's yearly total (month 13)
        if (!PROVINCE_CODE_MAPPING[parsed.provinceCode] || parsed.monthCode === 13) {
            return;
        }

        const simplifiedCode = PROVINCE_CODE_MAPPING[parsed.provinceCode];
        if (simplifiedCode === '99') return; // Skip Indonesia total

        // Map month code (1-12) to month key
        if (parsed.monthCode >= 1 && parsed.monthCode <= 12) {
            const monthKey = MONTH_KEYS[parsed.monthCode - 1];
            provincesData[simplifiedCode][monthKey] = Math.round(value); // Round to nearest ton
        }
    });

    // Convert to array and filter out provinces with no data
    return Object.values(provincesData).filter(prov => {
        const hasData = MONTH_KEYS.some(month => prov[month] > 0);
        return hasData;
    });
}

/**
 * Main transformation function
 */
function transformBPSData(inputPath, outputPath) {
    console.log('🔄 Starting BPS data transformation...\n');

    // Read the scraping results
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const bpsData = JSON.parse(rawData);

    console.log(`📥 Loaded data from: ${inputPath}`);
    console.log(`   Years available: ${Object.keys(bpsData).filter(k => k.startsWith('th_')).join(', ')}\n`);

    // Transform data for each year
    const transformedData = {};

    Object.entries(bpsData).forEach(([key, yearData]) => {
        if (!key.startsWith('th_')) return;

        const year = convertYearCode(yearData.tahun_code);
        console.log(`🔄 Processing year ${year}...`);

        const yearProvinceData = transformYearData(yearData, year);

        transformedData[year] = {
            metadata: {
                source: "BPS - Badan Pusat Statistik",
                variable: yearData.data.var[0].label,
                unit: yearData.data.var[0].unit,
                year: year,
                last_update: yearData.data.last_update,
                data_availability: yearData.data['data-availability'],
                note: yearData.data.var[0].note,
                timestamp: yearData.timestamp
            },
            data: yearProvinceData
        };

        console.log(`   ✓ Processed ${yearProvinceData.length} provinces`);
    });

    // Write transformed data
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2), 'utf8');

    console.log(`\n✅ Transformation complete!`);
    console.log(`📤 Output saved to: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    Object.entries(transformedData).forEach(([year, data]) => {
        console.log(`   ${year}: ${data.data.length} provinces`);
    });
}

// Main execution
const inputPath = path.join(__dirname, '../data/bps-scraping-results-20260205_083134.json');
const outputPath = path.join(__dirname, '../frontend/data-produksi-padi-bps.json');

try {
    transformBPSData(inputPath, outputPath);
} catch (error) {
    console.error('❌ Error during transformation:', error);
    process.exit(1);
}
