# 🏗️ GIS Transmigrasi - Microservice Architecture

## 📋 Overview

Dashboard GIS Transmigrasi telah di-refactor menjadi **Microservice Architecture** yang scalable, maintainable, dan production-ready.

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                         │
│  • index.html                                               │
│  • app.js (updated to call backend APIs)                   │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Node.js)                     │
│  Port: 3000                                                 │
│  • Route management                                         │
│  • Rate limiting                                            │
│  • Authentication (future)                                  │
└─────────────────────────────────────────────────────────────┘
         ↓              ↓              ↓              ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Price Service │ │Production Svc│ │Analytics Svc │ │  Geo Service │
│  (Node.js)   │ │  (Python)    │ │    (Go)      │ │  (Optional)  │
│  Port: 3001  │ │  Port: 3002  │ │  Port: 3003  │ │  Port: 3004  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
      ↓                  ↓                  ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   MongoDB    │ │  PostgreSQL  │ │    Redis     │
│  Port: 27017 │ │  Port: 5432  │ │  Port: 6379  │
└──────────────┘ └──────────────┘ └──────────────┘
```

## 🎯 Services

### 1. API Gateway (Port 3000)
**Technology:** Node.js + Express  
**Responsibility:**
- Central entry point for all API requests
- Route requests to appropriate microservices
- Rate limiting & security
- CORS handling

**Endpoints:**
- `/api/prices/*` → Price Service
- `/api/production/*` → Production Service
- `/api/analytics/*` → Analytics Service
- `/health` → Health check

### 2. Price Service (Port 3001)
**Technology:** Node.js + Express + MongoDB  
**Responsibility:**
- Commodity price management
- Bank Indonesia data integration
- Price caching
- IPE calculation

**Key Endpoints:**
- `GET /api/prices/:commodity` - Get prices for commodity
- `GET /api/prices/:commodity/:provinceCode` - Get price for specific province
- `GET /api/commodities` - List available commodities
- `POST /api/cache/clear` - Clear cache

**Database:** MongoDB
- Collection: `prices`
- Indexes: commodity, provinceCode, date

### 3. Production Service (Port 3002)
**Technology:** Python + FastAPI + PostgreSQL  
**Responsibility:**
- Rice production data from BPS
- Historical production tracking
- Production statistics

**Key Endpoints:**
- `GET /api/production/{year}` - Get production data by year
- `GET /api/production/{year}/{province_code}` - Province-specific data
- `GET /api/production/stats/{year}` - Statistics
- `POST /api/cache/clear` - Clear cache

**Database:** PostgreSQL
- Table: `productions`
- Indexes: province_code, year, month

### 4. Analytics Service (Port 3003)
**Technology:** Go + Gin  
**Responsibility:**
- IPE (Indeks Potensi Ekonomi) calculation
- Statistical analysis
- Performance-critical computations

**Key Endpoints:**
- `GET /api/ipe/:commodity` - Calculate IPE
- `GET /api/statistics/:commodity` - Get statistics
- `POST /api/cache/clear` - Clear cache

**Cache:** Redis

## 📦 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Gateway | Node.js + Express | Routing & proxy |
| Price Service | Node.js + Express | Commodity prices |
| Production Service | Python + FastAPI | BPS integration |
| Analytics Service | Go + Gin | High-performance analytics |
| Database (Prices) | MongoDB | Flexible price data |
| Database (Production) | PostgreSQL | Structured production data |
| Cache | Redis | Performance optimization |
| Container | Docker | Containerization |
| Orchestration | Docker Compose / Kubernetes | Deployment |

## 🚀 Quick Start

### Development Mode (Docker Compose)

```bash
# Clone repository
cd /Users/kamil/GIS-Transmigrasi

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access Points:
- **API Gateway:** http://localhost:3000
- **Price Service:** http://localhost:3001
- **Production Service:** http://localhost:3002
- **Analytics Service:** http://localhost:3003
- **Frontend (Nginx):** http://localhost:8080
- **MongoDB:** localhost:27017
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## 🛠️ Development Setup

### 1. API Gateway
```bash
cd backend/api-gateway
npm install
cp .env.example .env
npm run dev
```

### 2. Price Service
```bash
cd backend/services/price-service
npm install
cp .env.example .env
npm run dev
```

### 3. Production Service
```bash
cd backend/services/production-service
pip install -r requirements.txt
cp .env.example .env
python server.py
```

### 4. Analytics Service
```bash
cd backend/services/analytics-service
go mod download
cp .env.example .env
go run main.go
```

## 🐳 Docker Commands

### Build Images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build price-service
```

### Scale Services
```bash
# Scale price service to 3 instances
docker-compose up -d --scale price-service=3

# Scale analytics service to 2 instances
docker-compose up -d --scale analytics-service=2
```

### Database Management
```bash
# MongoDB shell
docker-compose exec mongo mongosh

# PostgreSQL shell
docker-compose exec postgres psql -U postgres -d gis_production

# Redis CLI
docker-compose exec redis redis-cli
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (minikube, GKE, EKS, AKS)
- kubectl configured

### Deploy
```bash
# Apply deployments
kubectl apply -f k8s/deployments.yaml

# Check status
kubectl get pods -n gis-transmigrasi
kubectl get services -n gis-transmigrasi

# View logs
kubectl logs -f <pod-name> -n gis-transmigrasi

# Scale deployment
kubectl scale deployment price-service --replicas=5 -n gis-transmigrasi
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
```bash
# API Gateway
curl http://localhost:3000/health

# Price Service
curl http://localhost:3001/health

# Production Service
curl http://localhost:3002/health

# Analytics Service
curl http://localhost:3003/health
```

### Response Format
```json
{
  "status": "healthy",
  "service": "price-service",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-01-26T10:00:00Z"
}
```

## 🔧 Configuration

### Environment Variables

#### API Gateway
```env
PORT=3000
NODE_ENV=production
PRICE_SERVICE_URL=http://price-service:3001
PRODUCTION_SERVICE_URL=http://production-service:3002
ANALYTICS_SERVICE_URL=http://analytics-service:3003
ALLOWED_ORIGINS=http://localhost:8000
```

#### Price Service
```env
PORT=3001
MONGODB_URI=mongodb://mongo:27017/gis_prices
NODE_ENV=production
```

#### Production Service
```env
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/gis_production
REDIS_HOST=redis
REDIS_PORT=6379
```

#### Analytics Service
```env
PORT=3003
REDIS_HOST=redis
REDIS_PORT=6379
```

## 🧪 Testing

### Integration Tests
```bash
# Test API Gateway
curl http://localhost:3000/health

# Test price fetching
curl http://localhost:3000/api/prices/beras_premium

# Test production data
curl http://localhost:3000/api/production/2023

# Test analytics
curl http://localhost:3000/api/analytics/ipe/beras_premium
```

## 📈 Performance

### Optimization Features
- **Caching:** Redis for frequently accessed data (6-hour TTL)
- **Database Indexes:** Optimized queries
- **Horizontal Scaling:** Scale services independently
- **Load Balancing:** Built-in with Kubernetes
- **Connection Pooling:** Database connections
- **Compression:** Gzip enabled

### Benchmarks (Target)
- API Gateway: <50ms response time
- Price Service: <100ms with cache, <500ms without
- Production Service: <200ms
- Analytics Service: <80ms (Go performance)

## 🔐 Security

### Implemented
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ Container isolation

### Recommended (Production)
- [ ] JWT authentication
- [ ] API key management
- [ ] SSL/TLS certificates
- [ ] Network policies (Kubernetes)
- [ ] Secrets management (Vault, AWS Secrets Manager)

## 📝 API Documentation

### Swagger/OpenAPI
Each service can be extended with Swagger documentation:

```javascript
// Add to each service
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Microservices

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Push to registry
        run: |
          docker-compose push
      
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/deployments.yaml
```

## 🛣️ Roadmap

### Phase 1: Core Services ✅
- [x] API Gateway
- [x] Price Service
- [x] Production Service
- [x] Analytics Service
- [x] Docker Compose setup

### Phase 2: Enhancement
- [ ] Real BI.go.id scraping (Price Service)
- [ ] Real BPS API integration (Production Service)
- [ ] Authentication & Authorization
- [ ] API documentation (Swagger)
- [ ] Monitoring (Prometheus + Grafana)

### Phase 3: Advanced Features
- [ ] Message queue (RabbitMQ/Kafka)
- [ ] Event-driven architecture
- [ ] GraphQL API
- [ ] WebSocket support for real-time updates
- [ ] ML-based forecasting service

## 🐛 Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs <service-name>

# Check ports
lsof -i :<port>

# Restart service
docker-compose restart <service-name>
```

### Database connection failed
```bash
# Check database status
docker-compose ps

# Restart databases
docker-compose restart mongo postgres redis
```

### Memory issues
```bash
# Check resource usage
docker stats

# Increase Docker memory limit
# Docker Desktop → Settings → Resources
```

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Health checks: `curl http://localhost:3000/health`
3. Database status: `docker-compose ps`

## 📄 License

MIT License - See LICENSE file

---

**Built with ❤️ for GIS Transmigrasi Dashboard**  
**Architecture:** Microservices  
**Status:** Production-Ready 🚀
