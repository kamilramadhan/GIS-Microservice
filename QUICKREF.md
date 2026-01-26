# 🚀 Quick Reference Card

## ⚡ One-Line Commands

```bash
# Start everything
./deploy.sh

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart price-service
```

---

## 📍 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 Frontend | http://localhost:8080 | Main dashboard |
| 🔌 API Gateway | http://localhost:3000 | API entry point |
| 💰 Price Service | http://localhost:3001 | Commodity prices |
| 📊 Production Service | http://localhost:3002 | BPS production data |
| 📈 Analytics Service | http://localhost:3003 | IPE calculations |

---

## 🔍 Health Checks

```bash
# Check all services
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

---

## 📊 API Endpoints

### Price Service
```bash
# Get all commodities
GET http://localhost:3000/api/prices/commodities

# Get commodity prices
GET http://localhost:3000/api/prices/beras_premium

# Get specific province price
GET http://localhost:3000/api/prices/beras_premium/31
```

### Production Service
```bash
# Get production data by year
GET http://localhost:3000/api/production/2023

# Get province production
GET http://localhost:3000/api/production/2023/31

# Get statistics
GET http://localhost:3000/api/production/stats/2023
```

### Analytics Service
```bash
# Calculate IPE
GET http://localhost:3000/api/analytics/ipe/beras_premium

# Get statistics
GET http://localhost:3000/api/analytics/statistics/beras_premium
```

---

## 🐳 Docker Commands

```bash
# Build all
docker-compose build

# Start detached
docker-compose up -d

# View logs (specific service)
docker-compose logs -f price-service

# Exec into container
docker-compose exec price-service sh

# Scale service
docker-compose up -d --scale price-service=3

# Remove everything
docker-compose down -v
```

---

## 🗄️ Database Access

```bash
# MongoDB
docker-compose exec mongo mongosh
> use gis_prices
> db.prices.find()

# PostgreSQL
docker-compose exec postgres psql -U postgres -d gis_production
> \dt
> SELECT * FROM productions;

# Redis
docker-compose exec redis redis-cli
> KEYS *
> GET price:beras_premium
```

---

## ☸️ Kubernetes Commands

```bash
# Deploy
kubectl apply -f k8s/deployments.yaml

# Check pods
kubectl get pods -n gis-transmigrasi

# Check services
kubectl get svc -n gis-transmigrasi

# View logs
kubectl logs -f <pod-name> -n gis-transmigrasi

# Scale deployment
kubectl scale deployment price-service --replicas=5 -n gis-transmigrasi

# Delete all
kubectl delete namespace gis-transmigrasi
```

---

## 🧪 Testing

```bash
# Frontend (open browser)
http://localhost:8080

# Test API
curl http://localhost:3000/api/prices/beras_premium
curl http://localhost:3000/api/production/2023
curl http://localhost:3000/api/analytics/ipe/beras_premium
```

---

## 🛠️ Development

```bash
# Frontend only
cd frontend
python3 -m http.server 8000

# API Gateway
cd backend/api-gateway
npm run dev

# Price Service
cd backend/services/price-service
npm run dev

# Production Service
cd backend/services/production-service
python server.py

# Analytics Service
cd backend/services/analytics-service
go run main.go
```

---

## 📁 Project Structure

```
GIS-Transmigrasi/
├── frontend/          # HTML, JS, CSS
├── backend/
│   ├── api-gateway/   # Node.js gateway
│   └── services/
│       ├── price-service/      # Node.js + MongoDB
│       ├── production-service/ # Python + PostgreSQL
│       └── analytics-service/  # Go + Redis
├── data/              # JSON data files
├── docs/              # Documentation
├── k8s/               # Kubernetes configs
├── docker-compose.yml # Docker orchestration
└── deploy.sh          # Deployment script
```

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Docker issues
```bash
# Clean up
docker system prune -a

# Rebuild
docker-compose up -d --build --force-recreate
```

### Database connection failed
```bash
# Restart databases
docker-compose restart mongo postgres redis

# Check logs
docker-compose logs mongo
docker-compose logs postgres
docker-compose logs redis
```

---

## 📚 Documentation

- [Main README](README.md)
- [Architecture Guide](docs/microservices.md)
- [Testing Guide](docs/testing.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

## 🎯 Common Tasks

### Add new commodity
1. Edit `backend/services/price-service/server.js`
2. Add commodity to `commodities` array
3. Restart: `docker-compose restart price-service`

### Update province data
1. Edit `data/provinsi.json`
2. Rebuild: `docker-compose up -d --build nginx`

### Change port
1. Edit `docker-compose.yml`
2. Update port mapping: `"NEW_PORT:3000"`
3. Restart: `docker-compose up -d`

---

<div align="center">

**📖 For detailed guides, see [docs/](docs/)**

[⬅️ Back to README](README.md)

</div>
