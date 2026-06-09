package controllers

import (
	"backend/config"
	"backend/models"

	"github.com/gin-gonic/gin"
)

func GetDashboard(c *gin.Context) {
	var summary models.DashboardSummary
	var expiringSoonCount int64
	var expiredCount int64
	var golonganDistribution []models.DashboardDistribution
	var locationStock []models.DashboardLocation
	var stockMovement []models.DashboardStockMovement

	if err := config.SIK.Raw(`
        SELECT
            COUNT(DISTINCT databarang.kode_brng) AS total_items,
            CAST(COALESCE(SUM(IFNULL(gudangbarang.stok, 0)), 0) AS SIGNED) AS total_stock,
            COALESCE(SUM(IFNULL(gudangbarang.stok, 0) * databarang.h_beli), 0) AS inventory_value,
            COALESCE(SUM(IF(COALESCE(gudangbarang.stok, 0) <= ?, 1, 0)), 0) AS low_stock_count
        FROM databarang
        LEFT JOIN gudangbarang
            ON databarang.kode_brng = gudangbarang.kode_brng
            AND gudangbarang.kd_bangsal = 'AP'
    `, 50).Scan(&summary).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil ringkasan dashboard", "detail": err.Error()})
		return
	}

	if err := config.SIK.Raw(`
        SELECT
            COUNT(*)
        FROM databarang
        WHERE expire IS NOT NULL
            AND expire <> ''
            AND expire BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `).Scan(&expiringSoonCount).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil data expiring soon", "detail": err.Error()})
		return
	}

	if err := config.SIK.Raw(`
        SELECT
            COUNT(*)
        FROM databarang
        WHERE expire IS NOT NULL
            AND expire <> ''
            AND expire < CURDATE()
    `).Scan(&expiredCount).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil data obat expired", "detail": err.Error()})
		return
	}

	if err := config.SIK.Raw(`
        SELECT
            COALESCE(golongan_barang.nama, 'Tidak Diketahui') AS label,
            COUNT(DISTINCT databarang.kode_brng) AS item_count,
            CAST(COALESCE(SUM(IFNULL(gudangbarang.stok, 0)), 0) AS SIGNED) AS total_stock
        FROM databarang
        LEFT JOIN gudangbarang
            ON databarang.kode_brng = gudangbarang.kode_brng
            AND gudangbarang.kd_bangsal = 'AP'
        LEFT JOIN golongan_barang
            ON databarang.kode_golongan = golongan_barang.kode
        GROUP BY golongan_barang.nama
        ORDER BY total_stock DESC
        LIMIT 20
    `).Scan(&golonganDistribution).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil distribusi golongan", "detail": err.Error()})
		return
	}

	if err := config.SIK.Raw(`
        SELECT
            COALESCE(gudangbarang.kd_bangsal, 'AP') AS location,
            CAST(COALESCE(SUM(gudangbarang.stok), 0) AS SIGNED) AS total_stock
        FROM gudangbarang
        GROUP BY gudangbarang.kd_bangsal
        ORDER BY total_stock DESC
    `).Scan(&locationStock).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil data lokasi stok", "detail": err.Error()})
		return
	}

	summary.ExpiringSoonCount = expiringSoonCount
	summary.ExpiredCount = expiredCount

	response := models.DashboardResponse{
		Summary:              summary,
		GolonganDistribution: golonganDistribution,
		LocationStock:        locationStock,
		StockMovement:        stockMovement,
	}

	c.JSON(200, gin.H{
		"data": response,
	})
}
