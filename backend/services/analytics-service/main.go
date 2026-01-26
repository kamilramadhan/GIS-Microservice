package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
)

// ==========================================
// STRUCTS
// ==========================================

type ProvincePrice struct {
	ProvinceCode string  `json:"province_code"`
	ProvinceName string  `json:"province_name"`
	Price        float64 `json:"price"`
	Unit         string  `json:"unit"`
}

type IPEData struct {
	ProvinceCode    string  `json:"kode_prov"`
	ProvinceName    string  `json:"provinsi"`
	Price           float64 `json:"harga"`
	NationalPrice   float64 `json:"harga_nasional"`
	IPE             float64 `json:"ipe"`
	Category        string  `json:"kategori"`
	Unit            string  `json:"satuan"`
}

type AnalyticsResponse struct {
	Success bool        `json:"success"`
	Source  string      `json:"source"`
	Data    interface{} `json:"data"`
}

// ==========================================
// REDIS CLIENT
// ==========================================

var (
	ctx         = context.Background()
	redisClient *redis.Client
)

func initRedis() {
	redisHost := getEnv("REDIS_HOST", "localhost")
	redisPort := getEnv("REDIS_PORT", "6379")

	redisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password: "",
		DB:       0,
	})

	_, err := redisClient.Ping(ctx).Result()
	if err != nil {
		log.Printf("⚠ Redis not available: %v", err)
	} else {
		log.Println("✓ Redis connected")
	}
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func calculateIPE(prices []ProvincePrice) []IPEData {
	// Calculate national average
	var total float64
	for _, p := range prices {
		total += p.Price
	}
	avgPrice := total / float64(len(prices))

	// Calculate IPE for each province
	result := make([]IPEData, len(prices))
	for i, p := range prices {
		ipe := p.Price / avgPrice
		result[i] = IPEData{
			ProvinceCode:  p.ProvinceCode,
			ProvinceName:  p.ProvinceName,
			Price:         math.Round(p.Price),
			NationalPrice: math.Round(avgPrice),
			IPE:           math.Round(ipe*100) / 100,
			Category:      categorizeIPE(ipe),
			Unit:          p.Unit,
		}
	}

	return result
}

func categorizeIPE(ipe float64) string {
	if ipe < 0.90 {
		return "rendah"
	} else if ipe <= 1.10 {
		return "normal"
	}
	return "tinggi"
}

func calculateStatistics(data []IPEData, month string) map[string]interface{} {
	var total, max, min float64
	var maxProvince, minProvince string
	lowCount, normalCount, highCount := 0, 0, 0

	for i, d := range data {
		if i == 0 {
			max = d.Price
			min = d.Price
			maxProvince = d.ProvinceName
			minProvince = d.ProvinceName
		}

		total += d.Price

		if d.Price > max {
			max = d.Price
			maxProvince = d.ProvinceName
		}
		if d.Price < min {
			min = d.Price
			minProvince = d.ProvinceName
		}

		switch d.Category {
		case "rendah":
			lowCount++
		case "normal":
			normalCount++
		case "tinggi":
			highCount++
		}
	}

	avg := total / float64(len(data))

	return map[string]interface{}{
		"average": math.Round(avg),
		"max": map[string]interface{}{
			"value":    max,
			"province": maxProvince,
		},
		"min": map[string]interface{}{
			"value":    min,
			"province": minProvince,
		},
		"distribution": map[string]int{
			"low":    lowCount,
			"normal": normalCount,
			"high":   highCount,
		},
	}
}

// ==========================================
// ROUTES
// ==========================================

func healthCheck(c *gin.Context) {
	redisStatus := "disconnected"
	if redisClient != nil {
		if _, err := redisClient.Ping(ctx).Result(); err == nil {
			redisStatus = "connected"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"service":   "analytics-service",
		"redis":     redisStatus,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func calculateIPEHandler(c *gin.Context) {
	commodity := c.Param("commodity")
	
	// Try cache first
	cacheKey := fmt.Sprintf("ipe_%s", commodity)
	if redisClient != nil {
		cached, err := redisClient.Get(ctx, cacheKey).Result()
		if err == nil {
			var data []IPEData
			if err := json.Unmarshal([]byte(cached), &data); err == nil {
				c.JSON(http.StatusOK, AnalyticsResponse{
					Success: true,
					Source:  "cache",
					Data:    data,
				})
				return
			}
		}
	}

	// Mock data - in production, fetch from Price Service
	prices := []ProvincePrice{
		{"32", "Jawa Barat", 14250, "kg"},
		{"33", "Jawa Tengah", 13800, "kg"},
		{"35", "Jawa Timur", 12600, "kg"},
		{"92", "Papua", 17500, "kg"},
		{"73", "Sulawesi Selatan", 13200, "kg"},
	}

	// Calculate IPE
	ipeData := calculateIPE(prices)

	// Cache result (6 hours)
	if redisClient != nil {
		data, _ := json.Marshal(ipeData)
		redisClient.Set(ctx, cacheKey, data, 6*time.Hour)
	}

	c.JSON(http.StatusOK, AnalyticsResponse{
		Success: true,
		Source:  "calculated",
		Data:    ipeData,
	})
}

func getStatistics(c *gin.Context) {
	_ = c.Param("commodity") // commodity parameter (currently unused in mock)
	month := c.DefaultQuery("month", "may")

	// Mock IPE data
	ipeData := []IPEData{
		{"32", "Jawa Barat", 14250, 14000, 1.02, "normal", "kg"},
		{"33", "Jawa Tengah", 13800, 14000, 0.99, "normal", "kg"},
		{"35", "Jawa Timur", 12600, 14000, 0.90, "rendah", "kg"},
		{"92", "Papua", 17500, 14000, 1.25, "tinggi", "kg"},
	}

	stats := calculateStatistics(ipeData, month)

	c.JSON(http.StatusOK, AnalyticsResponse{
		Success: true,
		Source:  "calculated",
		Data:    stats,
	})
}

func clearCache(c *gin.Context) {
	if redisClient != nil {
		if err := redisClient.FlushDB(ctx).Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to clear cache",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Cache cleared",
	})
}

// ==========================================
// MAIN
// ==========================================

func main() {
	// Load .env
	godotenv.Load()

	// Initialize Redis
	initRedis()

	// Setup Gin
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Routes
	router.GET("/health", healthCheck)
	router.GET("/api/ipe/:commodity", calculateIPEHandler)
	router.GET("/api/statistics/:commodity", getStatistics)
	router.POST("/api/cache/clear", clearCache)

	// Start server
	port := getEnv("PORT", "3003")
	fmt.Printf(`
╔═══════════════════════════════════════════════╗
║   Analytics Service (Microservice)            ║
║   Port: %s                                   ║
╚═══════════════════════════════════════════════╝

Analytics Service ready at http://localhost:%s
`, port, port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
