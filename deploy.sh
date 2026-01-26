#!/bin/bash

# ==========================================
# GIS Transmigrasi - Microservice Deployment Script
# ==========================================

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║  GIS Transmigrasi Microservice Deployment     ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Check Docker
print_info "Checking Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install Docker first."
    exit 1
fi
print_success "Docker found"

# Check Docker Compose
print_info "Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    print_error "Docker Compose not found. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose found"

# Create .env files if not exist
print_info "Setting up environment files..."

if [ ! -f "backend/api-gateway/.env" ]; then
    cp backend/api-gateway/.env.example backend/api-gateway/.env
    print_success "Created API Gateway .env"
fi

if [ ! -f "backend/services/price-service/.env" ]; then
    cp backend/services/price-service/.env.example backend/services/price-service/.env
    print_success "Created Price Service .env"
fi

if [ ! -f "backend/services/production-service/.env" ]; then
    cp backend/services/production-service/.env.example backend/services/production-service/.env
    print_success "Created Production Service .env"
fi

if [ ! -f "backend/services/analytics-service/.env" ]; then
    cp backend/services/analytics-service/.env.example backend/services/analytics-service/.env
    print_success "Created Analytics Service .env"
fi

# Build and start services
print_info "Building Docker images..."
$DOCKER_COMPOSE_CMD build

print_success "Build completed"

print_info "Starting services..."
$DOCKER_COMPOSE_CMD up -d

print_success "Services started"

# Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 10

# Health checks
echo ""
echo "Health Checks:"
echo "────────────────"

check_service() {
    local service_name=$1
    local url=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        print_success "$service_name is healthy"
    else
        print_error "$service_name is not responding"
    fi
}

check_service "API Gateway" "http://localhost:3000/health"
check_service "Price Service" "http://localhost:3001/health"
check_service "Production Service" "http://localhost:3002/health"
check_service "Analytics Service" "http://localhost:3003/health"

# Show running containers
echo ""
echo "Running Services:"
echo "─────────────────"
$DOCKER_COMPOSE_CMD ps

# Show URLs
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║           Services Ready!                      ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "Access URLs:"
echo "  • API Gateway:         http://localhost:3000"
echo "  • Price Service:       http://localhost:3001"
echo "  • Production Service:  http://localhost:3002"
echo "  • Analytics Service:   http://localhost:3003"
echo "  • Frontend (Nginx):    http://localhost:8080"
echo ""
echo "Databases:"
echo "  • MongoDB:             localhost:27017"
echo "  • PostgreSQL:          localhost:5432"
echo "  • Redis:               localhost:6379"
echo ""
echo "Management:"
echo "  • View logs:   $DOCKER_COMPOSE_CMD logs -f"
echo "  • Stop:        $DOCKER_COMPOSE_CMD down"
echo "  • Restart:     $DOCKER_COMPOSE_CMD restart"
echo ""
print_success "Deployment completed successfully!"
