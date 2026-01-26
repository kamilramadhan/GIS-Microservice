# 📚 Documentation Index

Welcome to GIS Transmigrasi Dashboard documentation!

## 📖 Table of Contents

### Getting Started
- [Quick Start Guide](../README.md#-quick-start) - Setup dalam 5 menit
- [Installation Guide](microservices.md#-quick-start) - Deployment lengkap

### Architecture & Design
- [🏛️ Microservices Architecture](microservices.md) - Complete architecture overview
  - Service breakdown
  - Tech stack details
  - Communication patterns
  - Deployment strategies

### Integration Guides
- [🔌 BPS API Integration](PANDUAN-BPS-API.md) - Badan Pusat Statistik WebAPI
  - API key setup
  - Data fetching
  - Caching strategy
  - Error handling

- [💰 Economic Heatmap Implementation](IMPLEMENTASI-ECONOMIC-HEATMAP.md) - IPE Calculation
  - IPE formula & methodology
  - Commodity data sources
  - Color coding system
  - Bank Indonesia integration

### Testing & Quality
- [🧪 Testing Guide](testing.md) - Testing strategies & test cases
  - Unit tests
  - Integration tests
  - E2E testing
  - Performance testing

### Maintenance
- [📝 Update Log](UPDATE-LOG.md) - Version history & changes
  - Release notes
  - Breaking changes
  - Migration guides

## 🎯 Quick Links

### For Developers
- [Backend Setup](microservices.md#-development-setup)
- [Frontend Development](../README.md#local-development)
- [API Endpoints](microservices.md#-api-documentation)

### For DevOps
- [Docker Deployment](microservices.md#-docker-commands)
- [Kubernetes Setup](microservices.md#️-kubernetes-deployment)
- [Monitoring](microservices.md#-monitoring--health-checks)

### For Users
- [Dashboard Features](../README.md#-dashboard-features)
- [How to Use](testing.md)
- [Troubleshooting](microservices.md#-troubleshooting)

## 📊 Documentation Structure

```
docs/
├── README.md (this file)              # Documentation index
├── microservices.md                   # Architecture & deployment
├── PANDUAN-BPS-API.md                 # BPS integration guide
├── IMPLEMENTASI-ECONOMIC-HEATMAP.md   # IPE implementation
├── testing.md                         # Testing guide
└── UPDATE-LOG.md                      # Change log
```

## 🔍 Search by Topic

### API & Integration
- [BPS WebAPI](PANDUAN-BPS-API.md)
- [Bank Indonesia Data](IMPLEMENTASI-ECONOMIC-HEATMAP.md)
- [REST API Endpoints](microservices.md#-api-documentation)

### Data & Analytics
- [IPE Calculation](IMPLEMENTASI-ECONOMIC-HEATMAP.md#formula-ipe)
- [Production Data](PANDUAN-BPS-API.md)
- [Price Data](IMPLEMENTASI-ECONOMIC-HEATMAP.md#sumber-data)

### Infrastructure
- [Docker Compose](microservices.md#using-docker-compose)
- [Kubernetes](microservices.md#using-kubernetes)
- [Database Setup](microservices.md#database-management)

### Development
- [Service Development](microservices.md#local-development)
- [Frontend Development](../README.md#frontend-only)
- [Testing](testing.md)

## 📞 Need Help?

- **Quick Questions:** Check [FAQ](microservices.md#-troubleshooting)
- **Technical Issues:** See [Troubleshooting Guide](microservices.md#-troubleshooting)
- **Bug Reports:** [GitHub Issues](https://github.com/0ryzal/GIS-Transmigrasi/issues)
- **Feature Requests:** [GitHub Issues](https://github.com/0ryzal/GIS-Transmigrasi/issues)

## 🤝 Contributing to Docs

Found an error or want to improve documentation?

1. Edit the relevant `.md` file
2. Submit a Pull Request
3. Follow [Markdown best practices](https://www.markdownguide.org/basic-syntax/)

---

<div align="center">

[⬅️ Back to Main README](../README.md)

**Built with ❤️ for Indonesia's Agricultural Development**

</div>
