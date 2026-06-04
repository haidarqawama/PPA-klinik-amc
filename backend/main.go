package main

import (
	"backend/config"
	"backend/models"
	"backend/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	config.ConnectDatabase()

	r := gin.Default()
	r.Use(cors.Default())

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Backend running",
		})
	})

	routes.SetupRoutes(r)

	config.SIK.AutoMigrate(
		&models.BarcodeItem{},
	)

	r.Run(":8080")
}