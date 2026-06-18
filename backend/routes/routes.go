package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.GET("/api/items", controllers.GetItems)
	r.POST("/api/items", controllers.AddItem)
	r.GET("/api/items/:kodeBrng", controllers.GetItemByKode)
	r.GET("/api/masters", controllers.GetMasters)
	r.POST("/api/masters/:type", controllers.AddMaster)
	r.PUT("/api/masters/:type/:code", controllers.UpdateMaster)
	r.DELETE("/api/masters/:type/:code", controllers.DeleteMaster)
	r.GET("/api/suppliers", controllers.GetSuppliers)
	r.POST("/api/suppliers", controllers.AddSupplier)
	r.PUT("/api/suppliers/:id", controllers.UpdateSupplier)
	r.DELETE("/api/suppliers/:id", controllers.DeleteSupplier)
	r.PUT("/api/items/:kodeBrng", controllers.UpdateItem)
	r.DELETE("/api/items/:kodeBrng", controllers.DeleteItem)
	r.GET("/api/dashboard", controllers.GetDashboard)
	r.GET("/api/monitoring-stock", controllers.GetMonitoringStock)
	r.GET("/api/monitoring-stock/details", controllers.GetMonitoringStockDetails)
	r.GET("/api/stock-in/items", controllers.SearchStockInItems)
	r.GET("/api/stock-in/recent", controllers.GetRecentStockIn)
	r.GET("/api/stock-in/history", controllers.GetStockInHistory)
	r.POST("/api/stock-in", controllers.AddStockIn)
	r.GET("/api/stock-out/items", controllers.SearchStockOutItems)
	r.GET("/api/stock-out/recent", controllers.GetRecentStockOut)
	r.GET("/api/stock-out/history", controllers.GetStockOutHistory)
	r.POST("/api/stock-out", controllers.AddStockOut)
}
