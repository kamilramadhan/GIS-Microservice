# 🤝 Contributing to GIS Transmigrasi Dashboard

Thank you for your interest in contributing! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a positive community
- Report unacceptable behavior to maintainers

---

## 🎯 How Can I Contribute?

### 🐛 Reporting Bugs

**Before submitting:**
1. Check [existing issues](https://github.com/0ryzal/GIS-Transmigrasi/issues)
2. Ensure you're using the latest version
3. Collect relevant information

**Bug Report Template:**
```markdown
**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: [e.g. macOS 14.0]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]

**Screenshots:**
If applicable
```

### 💡 Suggesting Features

**Feature Request Template:**
```markdown
**Feature Description:**
Clear description of the feature

**Problem it Solves:**
What problem does this address?

**Proposed Solution:**
How should it work?

**Alternatives Considered:**
Other options you've thought about

**Additional Context:**
Mockups, diagrams, etc.
```

### 📝 Improving Documentation

- Fix typos or clarify confusing sections
- Add examples or tutorials
- Translate to other languages
- Update outdated information

### 💻 Contributing Code

See [Development Setup](#development-setup) and [Pull Request Process](#pull-request-process)

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+ and pip
- **Go** 1.20+
- **Docker** and Docker Compose
- **Git**

### Fork & Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/GIS-Transmigrasi.git
cd GIS-Transmigrasi

# Add upstream remote
git remote add upstream https://github.com/0ryzal/GIS-Transmigrasi.git
```

### Install Dependencies

```bash
# API Gateway
cd backend/api-gateway
npm install

# Price Service
cd ../services/price-service
npm install

# Production Service
cd ../production-service
pip install -r requirements.txt

# Analytics Service
cd ../analytics-service
go mod download
```

### Running Locally

**Option 1: Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option 2: Manual (for development)**
```bash
# Terminal 1: API Gateway
cd backend/api-gateway
npm run dev

# Terminal 2: Price Service
cd backend/services/price-service
npm run dev

# Terminal 3: Production Service
cd backend/services/production-service
python server.py

# Terminal 4: Analytics Service
cd backend/services/analytics-service
go run main.go

# Terminal 5: Frontend
cd frontend
python3 -m http.server 8000
```

### Running Tests

```bash
# API Gateway tests
cd backend/api-gateway
npm test

# Price Service tests
cd backend/services/price-service
npm test

# Production Service tests
cd backend/services/production-service
pytest

# Analytics Service tests
cd backend/services/analytics-service
go test ./...
```

---

## 📁 Project Structure

```
GIS-Transmigrasi/
├── frontend/           # Frontend application
├── backend/
│   ├── api-gateway/    # Node.js API Gateway
│   └── services/
│       ├── price-service/      # Node.js + MongoDB
│       ├── production-service/ # Python + PostgreSQL
│       └── analytics-service/  # Go + Redis
├── data/              # Static data files
├── docs/              # Documentation
├── k8s/               # Kubernetes configs
└── docker-compose.yml # Docker orchestration
```

**Key Files:**
- `README.md` - Main documentation
- `docker-compose.yml` - Service orchestration
- `deploy.sh` - Deployment script
- `.gitignore` - Ignored files

---

## 📝 Coding Standards

### JavaScript/Node.js

```javascript
// Use ES6+ features
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Use descriptive names
const calculateIPE = (provincialPrice, nationalAverage) => {
  return provincialPrice / nationalAverage;
};

// Add JSDoc comments
/**
 * Calculate IPE (Indeks Potensi Ekonomi)
 * @param {number} provincialPrice - Price in specific province
 * @param {number} nationalAverage - National average price
 * @returns {number} IPE value
 */
```

### Python

```python
# Follow PEP 8
# Use type hints
def calculate_production_stats(data: list[dict]) -> dict:
    """
    Calculate production statistics.
    
    Args:
        data: List of production records
        
    Returns:
        Dictionary containing statistics
    """
    total = sum(item['production'] for item in data)
    return {'total': total, 'average': total / len(data)}

# Use meaningful variable names
provincial_production_data = fetch_bps_data()
```

### Go

```go
// Follow Go conventions
// Use camelCase for private, PascalCase for public
func calculateIPE(price float64, average float64) float64 {
    return price / average
}

// Add comments for exported functions
// CalculateStatistics computes statistics for commodity data
func CalculateStatistics(data []CommodityPrice) Statistics {
    // Implementation
}

// Use error handling
func fetchData(url string) ([]byte, error) {
    resp, err := http.Get(url)
    if err != nil {
        return nil, fmt.Errorf("failed to fetch: %w", err)
    }
    defer resp.Body.Close()
    return ioutil.ReadAll(resp.Body)
}
```

### General Guidelines

- **Naming:** Use descriptive, meaningful names
- **Comments:** Explain why, not what
- **Functions:** Keep them small and focused (< 50 lines)
- **DRY:** Don't Repeat Yourself
- **Error Handling:** Always handle errors gracefully
- **Testing:** Write tests for new features
- **Formatting:** Use consistent formatting (Prettier/Black/gofmt)

---

## 🔖 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
# Feature
feat(price-service): add caching for commodity prices

# Bug fix
fix(api-gateway): resolve CORS issue with frontend

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(analytics): optimize IPE calculation algorithm

# Multiple lines
feat(economic-heatmap): implement IPE visualization

- Add color coding for IPE values
- Integrate with price service API
- Add legend and tooltips

Closes #123
```

### Best Practices

- Use present tense ("add feature" not "added feature")
- Keep first line under 72 characters
- Reference issues: `Fixes #123`, `Closes #456`
- Explain what and why, not how

---

## 🔄 Pull Request Process

### 1. Create a Branch

```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

**Branch Naming:**
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Refactoring

### 2. Make Changes

- Write clear, focused commits
- Follow coding standards
- Add tests for new features
- Update documentation

### 3. Test Your Changes

```bash
# Run tests
npm test  # Node.js services
pytest    # Python services
go test   # Go services

# Test locally with Docker
docker-compose up --build

# Manual testing
# - Test all affected features
# - Check different browsers
# - Verify mobile responsiveness
```

### 4. Update Documentation

- Update README.md if needed
- Add/update API documentation
- Update CHANGELOG.md
- Add JSDoc/docstrings for new functions

### 5. Push & Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Then create Pull Request on GitHub:

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added unit tests
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] Tests passing
- [ ] No console errors

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

### 6. Review Process

- Maintainers will review your PR
- Address feedback promptly
- Keep discussions constructive
- Be patient - reviews take time

### 7. Merging

Once approved:
- PR will be merged by maintainers
- Delete your feature branch
- Update your fork

```bash
# After merge, update your fork
git checkout main
git pull upstream main
git push origin main
```

---

## 🧪 Testing Guidelines

### Unit Tests

Test individual functions/methods:

```javascript
// price-service/tests/ipe.test.js
describe('IPE Calculation', () => {
  test('calculates correct IPE for normal price', () => {
    const ipe = calculateIPE(12000, 10000);
    expect(ipe).toBe(1.2);
  });
});
```

### Integration Tests

Test service interactions:

```javascript
describe('Price Service API', () => {
  test('GET /api/prices/beras returns data', async () => {
    const response = await request(app).get('/api/prices/beras');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('prices');
  });
});
```

### E2E Tests

Test complete user flows:

```javascript
describe('Economic Heatmap', () => {
  test('displays price data on map', async () => {
    await page.goto('http://localhost:8080');
    await page.click('#economic-tab');
    const mapData = await page.evaluate(() => {
      return window.map.hasLayer(window.provinceLayer);
    });
    expect(mapData).toBe(true);
  });
});
```

---

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in commit history

---

## 📞 Getting Help

- **Questions:** [GitHub Discussions](https://github.com/0ryzal/GIS-Transmigrasi/discussions)
- **Issues:** [GitHub Issues](https://github.com/0ryzal/GIS-Transmigrasi/issues)
- **Documentation:** [docs/](docs/)

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

<div align="center">

**Thank You for Contributing! 🙏**

[⬅️ Back to README](README.md)

</div>
