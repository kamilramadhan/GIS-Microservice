/**
 * ==========================================
 * Price Service - Commodity Price Management
 * ==========================================
 * 
 * Handles:
 * - Fetching price data from Bank Indonesia
 * - Caching price data
 * - IPE (Indeks Potensi Ekonomi) calculation
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const cache = new NodeCache({ stdTTL: 21600 }); // 6 hours cache

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ==========================================
// DATABASE
// ==========================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gis_prices';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✓ MongoDB connected (Price Service)'))
  .catch(err => console.error('✗ MongoDB connection error:', err));

// Price Schema
const priceSchema = new mongoose.Schema({
  commodity: { type: String, required: true, index: true },
  provinceCode: { type: String, required: true, index: true },
  provinceName: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  marketType: { type: String, enum: ['traditional', 'modern'], default: 'traditional' },
  date: { type: Date, default: Date.now, index: true },
  source: { type: String, default: 'BI' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

priceSchema.index({ commodity: 1, date: -1 });
priceSchema.index({ provinceCode: 1, commodity: 1, date: -1 });

const Price = mongoose.model('Price', priceSchema);

// ==========================================
// PROVINCE MAPPING
// ==========================================

const PROVINCE_MAPPING = {
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
};

// ==========================================
// PRICE GENERATION (Mock realistic data)
// ==========================================

function generateRealisticPrices(commodity, marketType = 'traditional') {
  const basePrices = {
    'beras_premium': 14000,
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

  const basePrice = basePrices[commodity] || 10000;
  const prices = [];

  Object.entries(PROVINCE_MAPPING).forEach(([code, name]) => {
    const islandVariation = getIslandVariation(code);
    const randomVariation = (Math.random() - 0.5) * 0.06;
    const price = Math.round(basePrice * (1 + islandVariation + randomVariation));

    prices.push({
      commodity,
      provinceCode: code,
      provinceName: name,
      price,
      unit: getUnit(commodity),
      marketType,
      date: new Date(),
      source: 'Generated'
    });
  });

  return prices;
}

function getIslandVariation(code) {
  const islandMap = {
    'jawa': { codes: ['31', '32', '33', '34', '35', '36'], variation: 0 },
    'sumatera': { codes: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21'], variation: 0.05 },
    'kalimantan': { codes: ['61', '62', '63', '64', '65'], variation: 0.08 },
    'sulawesi': { codes: ['71', '72', '73', '74', '75', '76'], variation: 0.10 },
    'bali_nusa': { codes: ['51', '52', '53'], variation: 0.07 },
    'maluku': { codes: ['81', '82'], variation: 0.15 },
    'papua': { codes: ['91', '92', '93', '94', '95', '96'], variation: 0.25 }
  };

  for (const island of Object.values(islandMap)) {
    if (island.codes.includes(code)) return island.variation;
  }
  return 0.10;
}

function getUnit(commodity) {
  return commodity === 'minyak_goreng' ? 'liter' : 'kg';
}

// ==========================================
// IPE CALCULATION
// ==========================================

function calculateIPE(prices) {
  const totalPrice = prices.reduce((sum, p) => sum + p.price, 0);
  const avgPrice = totalPrice / prices.length;

  return prices.map(p => ({
    ...p,
    harga_nasional: Math.round(avgPrice),
    ipe: parseFloat((p.price / avgPrice).toFixed(2)),
    kategori: categorizeIPE(p.price / avgPrice)
  }));
}

function categorizeIPE(ipe) {
  if (ipe < 0.90) return 'rendah';
  if (ipe <= 1.10) return 'normal';
  return 'tinggi';
}

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'healthy',
    service: 'price-service',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Get prices for specific commodity
app.get('/api/prices/:commodity', async (req, res) => {
  try {
    const { commodity } = req.params;
    const { marketType = 'traditional', year, month } = req.query;

    const cacheKey = `prices_${commodity}_${marketType}_${year}_${month}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        source: 'cache',
        data: cached
      });
    }

    // Try to get from database (recent data within 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let prices = await Price.find({
      commodity,
      marketType,
      date: { $gte: sixHoursAgo }
    }).lean();

    // If no recent data, generate new
    if (!prices || prices.length === 0) {
      const generatedPrices = generateRealisticPrices(commodity, marketType);
      
      // Save to database
      await Price.insertMany(generatedPrices);
      prices = generatedPrices;
    }

    // Calculate IPE
    const pricesWithIPE = calculateIPE(prices);

    // Cache the result
    cache.set(cacheKey, pricesWithIPE);

    res.json({
      success: true,
      source: 'database',
      data: pricesWithIPE
    });

  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prices',
      message: error.message
    });
  }
});

// Get price for specific province
app.get('/api/prices/:commodity/:provinceCode', async (req, res) => {
  try {
    const { commodity, provinceCode } = req.params;
    const { marketType = 'traditional' } = req.query;

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const price = await Price.findOne({
      commodity,
      provinceCode,
      marketType,
      date: { $gte: sixHoursAgo }
    }).lean();

    if (!price) {
      return res.status(404).json({
        success: false,
        error: 'Price data not found'
      });
    }

    res.json({
      success: true,
      data: price
    });

  } catch (error) {
    console.error('Error fetching province price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch province price',
      message: error.message
    });
  }
});

// Get available commodities
app.get('/api/commodities', (req, res) => {
  const commodities = [
    { id: 'beras_premium', name: 'Beras Premium' },
    { id: 'beras_medium', name: 'Beras Medium' },
    { id: 'cabai_merah', name: 'Cabai Merah' },
    { id: 'cabai_rawit', name: 'Cabai Rawit' },
    { id: 'bawang_merah', name: 'Bawang Merah' },
    { id: 'bawang_putih', name: 'Bawang Putih' },
    { id: 'daging_ayam', name: 'Daging Ayam' },
    { id: 'daging_sapi', name: 'Daging Sapi' },
    { id: 'telur_ayam', name: 'Telur Ayam' },
    { id: 'minyak_goreng', name: 'Minyak Goreng' }
  ];

  res.json({
    success: true,
    data: commodities
  });
});

// Clear cache (admin endpoint)
app.post('/api/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   Price Service (Microservice)                ║
║   Port: ${PORT}                              ║
╚═══════════════════════════════════════════════╝

Price Service ready at http://localhost:${PORT}
  `);
});
