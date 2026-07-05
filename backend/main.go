package main

import (
	"backend/config"
	"backend/models"
	"backend/routes"
	"log"
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

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Backend running",
		})
	})

	routes.SetupRoutes(r)

	config.SIK.AutoMigrate(
		&models.BarcodeItem{},
		&models.ItemActivityLog{},
	)

	r.Run(":8080")
}
