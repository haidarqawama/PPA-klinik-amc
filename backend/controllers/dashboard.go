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
	var recentActivities []models.DashboardRecentActivity

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

	if err := config.SIK.Raw(`
        SELECT
            DATE_FORMAT(DATE_SUB(anchor.latest_month, INTERVAL month_offsets.month_offset MONTH), '%Y-%m') AS month,
            CAST(COALESCE(movement.barang_masuk, 0) AS SIGNED) AS barang_masuk,
            CAST(COALESCE(movement.barang_keluar, 0) AS SIGNED) AS barang_keluar
        FROM (
            SELECT COALESCE(MAX(tanggal), CURDATE()) AS latest_month
            FROM riwayat_barang_medis
            WHERE tanggal IS NOT NULL
                AND (
                    masuk > 0
                    OR keluar > 0
                )
                AND (
                    kd_bangsal = 'AP'
                    OR kd_bangsal IS NULL
                    OR kd_bangsal = ''
                )
        ) anchor
        JOIN (
            SELECT 4 AS month_offset
            UNION ALL SELECT 3
            UNION ALL SELECT 2
            UNION ALL SELECT 1
            UNION ALL SELECT 0
        ) month_offsets
        LEFT JOIN (
            SELECT
                DATE_FORMAT(riwayat_barang_medis.tanggal, '%Y-%m') AS month,
                COALESCE(SUM(riwayat_barang_medis.masuk), 0) AS barang_masuk,
                COALESCE(SUM(riwayat_barang_medis.keluar), 0) AS barang_keluar
            FROM riwayat_barang_medis
            WHERE riwayat_barang_medis.tanggal IS NOT NULL
                AND riwayat_barang_medis.tanggal >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m-01')
                AND (
                    riwayat_barang_medis.kd_bangsal = 'AP'
                    OR riwayat_barang_medis.kd_bangsal IS NULL
                    OR riwayat_barang_medis.kd_bangsal = ''
                )
            GROUP BY DATE_FORMAT(riwayat_barang_medis.tanggal, '%Y-%m')
        ) movement
            ON DATE_FORMAT(DATE_SUB(anchor.latest_month, INTERVAL month_offsets.month_offset MONTH), '%Y-%m') = movement.month
        ORDER BY month_offsets.month_offset DESC
    `).Scan(&stockMovement).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil pergerakan stok", "detail": err.Error()})
		return
	}

	if err := config.SIK.Raw(`
        SELECT
            0 AS id,
            CASE
                WHEN COALESCE(recent.masuk, 0) > 0 THEN 'masuk'
                ELSE 'keluar'
            END AS activity_type,
            recent.kode_brng,
            COALESCE(databarang.nama_brng, recent.kode_brng) AS nama_brng,
            CAST(
                CASE
                    WHEN COALESCE(recent.masuk, 0) > 0 THEN COALESCE(recent.masuk, 0)
                    ELSE COALESCE(recent.keluar, 0)
                END
                AS SIGNED
            ) AS qty,
            DATE_FORMAT(recent.tanggal, '%Y-%m-%d') AS activity_date,
            IFNULL(TIME_FORMAT(recent.jam, '%H:%i:%s'), '') AS activity_time,
            COALESCE(
                NULLIF(recent.no_faktur, ''),
                NULLIF(recent.no_batch, ''),
                NULLIF(recent.keterangan, ''),
                recent.posisi,
                ''
            ) AS reference_no
        FROM (
            SELECT
                kode_brng,
                masuk,
                keluar,
                tanggal,
                jam,
                no_faktur,
                no_batch,
                keterangan,
                posisi
            FROM riwayat_barang_medis
            WHERE tanggal IS NOT NULL
                AND (
                    masuk > 0
                    OR keluar > 0
                )
                AND kd_bangsal = 'AP'
            ORDER BY tanggal DESC, jam DESC
            LIMIT 10
        ) recent
        LEFT JOIN databarang
            ON recent.kode_brng = databarang.kode_brng
        ORDER BY recent.tanggal DESC, recent.jam DESC
    `).Scan(&recentActivities).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil aktivitas transaksi terbaru", "detail": err.Error()})
		return
	}

	summary.ExpiringSoonCount = expiringSoonCount
	summary.ExpiredCount = expiredCount

	response := models.DashboardResponse{
		Summary:              summary,
		GolonganDistribution: golonganDistribution,
		LocationStock:        locationStock,
		StockMovement:        stockMovement,
		RecentActivities:     recentActivities,
	}

	c.JSON(200, gin.H{
		"data": response,
	})
}
