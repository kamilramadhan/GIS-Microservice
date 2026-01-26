# 📝 Changelog

All notable changes to GIS Transmigrasi Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-01-26

### 🎉 Major Release - Microservice Architecture

This is a complete architectural transformation from monolithic frontend to distributed microservices.

### ✨ Added

#### Architecture
- **Microservice Architecture** with 4 independent services
- **API Gateway** (Node.js + Express) for unified API access
- **Price Service** (Node.js + MongoDB) for commodity price management
- **Production Service** (Python + FastAPI + PostgreSQL) for BPS data
- **Analytics Service** (Go + Redis) for high-performance IPE calculations

#### Infrastructure
- Docker containerization for all services
- Docker Compose orchestration for local development
- Kubernetes deployment configurations
- Nginx reverse proxy for frontend serving
- Redis caching layer (6-hour TTL for prices)
- MongoDB for flexible price data storage
- PostgreSQL for structured production data

#### Features
- **Commodity Economic/Price Heatmap** with IPE calculation
- 10 commodity types support (Beras Premium/Medium, Gula, Minyak, etc.)
- Real-time IPE calculation (Harga Wilayah / Harga Nasional)
- Color-coded heatmap (Blue/Yellow/Red for price categories)
- Dashboard mode selector (Productivity/Economic/Opportunity)
- Health check endpoints for all services
- Auto-scaling support via Kubernetes HPA

#### Documentation
- Comprehensive microservices architecture guide
- API documentation for all services
- Docker deployment guide
- Kubernetes deployment guide
- Testing guide with integration examples
- Contributing guidelines
- Automated deployment script (`deploy.sh`)

#### Developer Experience
- One-command deployment with `./deploy.sh`
- Environment variable configuration
- Service-specific `.env` files
- Comprehensive `.gitignore`
- Development mode support

### 🔧 Changed

#### Project Structure
- **BREAKING:** Reorganized project structure
  - Moved frontend files to `frontend/` directory
  - Created `backend/` directory for microservices
  - Moved documentation to `docs/` directory
  - Moved data files to `data/` directory
  - Created `k8s/` directory for Kubernetes configs

#### File Changes
- Renamed `38 Provinsi Indonesia - Provinsi.json` → `data/provinsi.json`
- Moved `index.html` → `frontend/index.html`
- Moved `app.js` → `frontend/app.js`
- Moved `styles.css` → `frontend/styles.css`
- Moved `data-produksi-padi.json` → `data/data-produksi-padi.json`
- Merged multiple READMEs into single comprehensive `README.md`
- Removed redundant `QUICK-START.md` (merged into README)

#### Documentation
- Complete rewrite of `README.md` with badges and modern formatting
- Moved all technical docs to `docs/` directory
- Created `docs/README.md` as documentation index
- Renamed `TESTING-GUIDE.md` → `docs/testing.md`
- Renamed `MICROSERVICE-ARCHITECTURE.md` → `docs/microservices.md`

#### Configuration
- Updated `docker-compose.yml` to reference new file paths
- Updated `.gitignore` with comprehensive patterns
- Added health checks to all Docker services

### 🐛 Fixed
- Fixed CORS issues with API Gateway
- Fixed path references in Docker Compose volumes
- Improved error handling in all services
- Fixed cache TTL implementation

### 📊 Performance
- Implemented Redis caching (6h for prices, 24h for production)
- Database indexing for faster queries
- Gzip compression on Nginx
- Connection pooling for databases
- Optimized API Gateway routing

### 🔒 Security
- Added Helmet.js for security headers
- Implemented rate limiting on API Gateway
- Environment variable configuration for secrets
- Removed hardcoded credentials
- Updated `.gitignore` to exclude sensitive files

### 📚 Documentation Improvements
- Added comprehensive architecture diagrams
- Created API endpoint documentation
- Added deployment guides (Docker + Kubernetes)
- Created contributing guidelines
- Added testing documentation
- Created changelog (this file)

---

## [1.0.0] - 2026-01-20

### Initial Release - Monolithic Frontend

#### Features
- Interactive choropleth map with Leaflet.js
- Rice production data visualization from BPS
- Province-level data display (38 provinces)
- Time-series filtering (year and month selection)
- Interactive hover and click handlers
- Detail panel with provincial statistics
- BPS WebAPI integration with fallback to local data

#### Technical
- Vanilla JavaScript implementation
- Static HTML/CSS/JS architecture
- Direct BPS API calls from browser
- Local data caching
- GeoJSON province boundaries
- Responsive design

#### Files
- `index.html` - Main dashboard
- `app.js` - JavaScript logic
- `styles.css` - Styling
- `bps-config.dev.js` - BPS API configuration
- `38 Provinsi Indonesia - Provinsi.json` - Province GeoJSON
- `data-produksi-padi.json` - Local production data

---

## Version Format

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)
```

---

## Categories

- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security fixes and improvements

---

## Links

- [GitHub Repository](https://github.com/0ryzal/GIS-Transmigrasi)
- [Documentation](docs/)
- [Issue Tracker](https://github.com/0ryzal/GIS-Transmigrasi/issues)

---

<div align="center">

[⬅️ Back to README](README.md) • [📖 Documentation](docs/)

</div>
