package main

import (
	"backend/config"
	"backend/models"
	"backend/routes"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	config.ConnectDatabase()

	r := gin.Default()
	r.Use(cors.Default())

	// Log slow endpoints (>100ms)
	r.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()
		if elapsed := time.Since(start); elapsed > 100*time.Millisecond {
			log.Printf("SLOW [%s] %s %s %v", c.Request.Method, c.Request.URL.Path, c.Request.URL.RawQuery, elapsed)
		}
	})

	routes.SetupRoutes(r)

	// Serve frontend static files — priority: existing file, else index.html (SPA fallback)
	r.Use(func(c *gin.Context) {
		// Skip API routes
		if len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api" {
			c.Next()
			return
		}
		// Skip if already handled
		if c.Writer.Size() > 0 {
			return
		}

		// Serve static file directly, else SPA fallback to index.html
		directPath := "../frontend/out" + c.Request.URL.Path
		if _, err := os.Stat(directPath); err == nil {
			c.File(directPath)
		} else {
			spaPath := "../frontend/out" + strings.TrimRight(c.Request.URL.Path, "/") + "/index.html"
			if _, err := os.Stat(spaPath); err == nil {
				c.File(spaPath)
			} else {
				c.File("../frontend/out/index.html")
			}
		}
		c.Abort()
	})

	config.SIK.AutoMigrate(
		&models.BarcodeItem{},
		&models.ItemActivityLog{},
	)

	r.Run(":8080")
}
