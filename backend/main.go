package main

import (
	"backend/config"
	"backend/controllers"
	"backend/models"

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

	r.GET("/api/items", controllers.GetItems)

	r.POST(
		"/api/items",
		controllers.AddItem,
	)

	r.GET(
		"/api/dashboard",
		controllers.GetDashboard,
	)

	r.GET(
		"/api/masters",
		controllers.GetMasters,
	)

	r.GET(
		"/api/suppliers",
		controllers.GetSuppliers,
	)

	r.POST(
		"/api/suppliers",
		controllers.AddSupplier,
	)

	r.PUT(
		"/api/suppliers/:id",
		controllers.UpdateSupplier,
	)

	r.DELETE(
		"/api/suppliers/:id",
		controllers.DeleteSupplier,
	)

	config.SIK.AutoMigrate(
		&models.BarcodeItem{},
	)

	r.Run(":8081")
}
