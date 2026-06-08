package controllers

import (
	"backend/config"
	"backend/models"
	"fmt"

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

	// Debug: Check if tables have data
	var debugCount1, debugCount2 int64
	config.SIK.Raw("SELECT COUNT(*) FROM data_batch").Scan(&debugCount1)
	config.SIK.Raw("SELECT COUNT(*) FROM pengeluaran_obat_bhp").Scan(&debugCount2)
	fmt.Printf("DEBUG: data_batch count: %d, pengeluaran_obat_bhp count: %d\n", debugCount1, debugCount2)

	if err := config.SIK.Raw(`
        SELECT
            COALESCE(DATE_FORMAT(t.bulan, '%b %Y'), 'Unknown') AS month,
            CAST(COALESCE(SUM(CASE WHEN t.tipe = 'masuk' THEN t.jumlah ELSE 0 END), 0) AS SIGNED) AS barang_masuk,
            CAST(COALESCE(SUM(CASE WHEN t.tipe = 'keluar' THEN t.jumlah ELSE 0 END), 0) AS SIGNED) AS barang_keluar
        FROM (
            SELECT DATE_FORMAT(data_batch.tgl_beli, '%Y-%m-01') AS bulan, SUM(COALESCE(data_batch.jumlahbeli, 0)) AS jumlah, 'masuk' AS tipe
            FROM data_batch
            WHERE data_batch.tgl_beli IS NOT NULL
            AND data_batch.tgl_beli >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
            GROUP BY DATE_FORMAT(data_batch.tgl_beli, '%Y-%m-01')
            
            UNION ALL
            
            SELECT DATE_FORMAT(pengeluaran_obat_bhp.tanggal, '%Y-%m-01') AS bulan, SUM(COALESCE(detail_pengeluaran_obat_bhp.jumlah, 0)) AS jumlah, 'keluar' AS tipe
            FROM pengeluaran_obat_bhp
            JOIN detail_pengeluaran_obat_bhp ON pengeluaran_obat_bhp.no_keluar = detail_pengeluaran_obat_bhp.no_keluar
            WHERE pengeluaran_obat_bhp.tanggal IS NOT NULL
            AND pengeluaran_obat_bhp.tanggal >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
            GROUP BY DATE_FORMAT(pengeluaran_obat_bhp.tanggal, '%Y-%m-01')
        ) t
        GROUP BY t.bulan
        ORDER BY t.bulan ASC
    `).Scan(&stockMovement).Error; err != nil {
		fmt.Println("DEBUG: Error scanning stockMovement:", err)
		c.JSON(500, gin.H{"error": "Gagal mengambil data pergerakan stok", "detail": err.Error()})
		return
	}

	fmt.Printf("DEBUG: stockMovement count: %d\n", len(stockMovement))
	if len(stockMovement) > 0 {
		fmt.Printf("DEBUG: First record: %+v\n", stockMovement[0])
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
