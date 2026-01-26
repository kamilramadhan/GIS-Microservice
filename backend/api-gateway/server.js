/**
 * ==========================================
 * API Gateway - GIS Transmigrasi Dashboard
 * ==========================================
 * 
 * Central entry point untuk semua microservices
 * Handles routing, authentication, rate limiting
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8000', 'http://localhost:5500'],
  credentials: true
}));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ==========================================
// SERVICE ENDPOINTS
// ==========================================

const SERVICES = {
  PRICE: process.env.PRICE_SERVICE_URL || 'http://localhost:3001',
  PRODUCTION: process.env.PRODUCTION_SERVICE_URL || 'http://localhost:3002',
  ANALYTICS: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003',
  GEO: process.env.GEO_SERVICE_URL || 'http://localhost:3004',
  BI_SCRAPER: process.env.BI_SCRAPER_SERVICE_URL || 'http://localhost:3005'
};

// ==========================================
// PROXY ROUTES
// ==========================================

// BI Scraper Service Routes (untuk real-time BI data)
app.use('/api/bi', createProxyMiddleware({
  target: SERVICES.BI_SCRAPER,
  changeOrigin: true,
  pathRewrite: {
    '^/api/bi': '/api'
  },
  onError: (err, req, res) => {
    console.error('BI Scraper Service Error:', err);
    res.status(503).json({ 
      error: 'BI Scraper service unavailable',
      message: 'Unable to connect to BI scraper service'
    });
  }
}));

// Price Service Routes
app.use('/api/prices', createProxyMiddleware({
  target: SERVICES.PRICE,
  changeOrigin: true,
  pathRewrite: {
    '^/api/prices': '/api/prices'
  },
  onError: (err, req, res) => {
    console.error('Price Service Error:', err);
    res.status(503).json({ 
      error: 'Price service unavailable',
      message: 'Unable to connect to price service'
    });
  }
}));

// Production Service Routes
app.use('/api/production', createProxyMiddleware({
  target: SERVICES.PRODUCTION,
  changeOrigin: true,
  pathRewrite: {
    '^/api/production': '/api/production'
  },
  onError: (err, req, res) => {
    console.error('Production Service Error:', err);
    res.status(503).json({ 
      error: 'Production service unavailable',
      message: 'Unable to connect to production service'
    });
  }
}));

// Analytics Service Routes
app.use('/api/analytics', createProxyMiddleware({
  target: SERVICES.ANALYTICS,
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics': '/api'
  },
  onError: (err, req, res) => {
    console.error('Analytics Service Error:', err);
    res.status(503).json({ 
      error: 'Analytics service unavailable',
      message: 'Unable to connect to analytics service'
    });
  }
}));

// GeoJSON Service Routes
app.use('/api/geo', createProxyMiddleware({
  target: SERVICES.GEO,
  changeOrigin: true,
  pathRewrite: {
    '^/api/geo': '/api'
  },
  onError: (err, req, res) => {
    console.error('Geo Service Error:', err);
    res.status(503).json({ 
      error: 'Geo service unavailable',
      message: 'Unable to connect to geo service'
    });
  }
}));

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', async (req, res) => {
  const services = {};
  
  // Check each service health
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const response = await fetch(`${url}/health`, { timeout: 2000 });
      services[name.toLowerCase()] = response.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      services[name.toLowerCase()] = 'unavailable';
    }
  }
  
  const allHealthy = Object.values(services).every(status => status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'GIS Transmigrasi API Gateway',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      prices: '/api/prices',
      production: '/api/production',
      analytics: '/api/analytics',
      geo: '/api/geo',
      health: '/health'
    }
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.url} not found`,
    availableRoutes: ['/api/prices', '/api/production', '/api/analytics', '/api/geo']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   GIS Transmigrasi API Gateway                ║
║   Port: ${PORT}                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                  ║
╚═══════════════════════════════════════════════╝

Services:
  • Price Service      → ${SERVICES.PRICE}
  • Production Service → ${SERVICES.PRODUCTION}
  • Analytics Service  → ${SERVICES.ANALYTICS}
  • Geo Service        → ${SERVICES.GEO}

API Gateway ready at http://localhost:${PORT}
Health check: http://localhost:${PORT}/health
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
