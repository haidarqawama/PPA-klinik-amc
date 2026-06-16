package controllers

import (
	"backend/config"
	"backend/models"
	"math"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	criticalStockThreshold = 20
	restockStockThreshold  = 50
	expiringSoonDays       = 30
)

func monitoringObservationDays(period string) int {
	switch period {
	case "day":
		return 30
	case "year":
		return 365
	case "all":
		return 365
	default:
		return 30
	}
}

func monitoringObservationLabel(period string, days int) string {
	switch period {
	case "day":
		return "30 hari terakhir"
	case "year":
		return "12 bulan terakhir"
	case "all":
		return "Semua waktu"
	default:
		return "30 hari terakhir"
	}
}

func monitoringMovementDateFilter(period string) string {
	switch period {
	case "year":
		return "AND pengeluaran_obat_bhp.tanggal >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)"
	case "all":
		return ""
	default:
		return "AND pengeluaran_obat_bhp.tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
	}
}

func monitoringBatchDateFilter(period string) string {
	switch period {
	case "year":
		return "AND data_batch.tgl_beli >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)"
	case "all":
		return ""
	default:
		return "AND data_batch.tgl_beli >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
	}
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

func coverageStatus(days float64, hasUsage bool) string {
	if !hasUsage {
		return "good"
	}
	if days < 7 {
		return "critical"
	}
	if days < 14 {
		return "warning"
	}
	return "good"
}

func GetMonitoringStock(c *gin.Context) {
	period := strings.ToLower(strings.TrimSpace(c.DefaultQuery("period", "month")))
	if period != "day" && period != "month" && period != "year" && period != "all" {
		period = "month"
	}

	observationDays := monitoringObservationDays(period)
	outDateFilter := monitoringMovementDateFilter(period)
	inDateFilter := monitoringBatchDateFilter(period)

	if period == "all" {
		var actualDays int
		if err := config.SIK.Raw(`
			SELECT GREATEST(
				DATEDIFF(
					CURDATE(),
					COALESCE(
						(SELECT MIN(earliest) FROM (
							SELECT MIN(tanggal) AS earliest
							FROM pengeluaran_obat_bhp
							WHERE tanggal IS NOT NULL
							UNION ALL
							SELECT MIN(tgl_beli) AS earliest
							FROM data_batch
							WHERE tgl_beli IS NOT NULL
						) ranges),
						CURDATE()
					)
				),
				1
			) AS days
		`).Scan(&actualDays).Error; err == nil && actualDays > 0 {
			observationDays = actualDays
		}
	}

	var summary models.MonitoringStockSummary
	var expiringSoonCount int64
	var expiredCount int64
	var lowStockItems []models.MonitoringStockLowItem
	var expiringItems []models.MonitoringStockExpiringItem
	var golonganStats []models.MonitoringStockGolonganStat
	var golonganValues []models.MonitoringStockGolonganValue
	var movementRows []models.MonitoringStockMovementRow

	if err := config.SIK.Raw(`
		SELECT
			COALESCE(SUM(IF(COALESCE(gudang_stok.total_stok, 0) < ?, 1, 0)), 0) AS critical_stock_count,
			COALESCE(SUM(IF(COALESCE(gudang_stok.total_stok, 0) >= ? AND COALESCE(gudang_stok.total_stok, 0) < ?, 1, 0)), 0) AS restock_needed_count
		FROM databarang
		`+gudangAPStockJoin+`
	`, criticalStockThreshold, criticalStockThreshold, restockStockThreshold).Scan(&summary).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil ringkasan monitoring stok", "detail": err.Error()})
		return
	}

	if err := config.SIK.Raw(`
		SELECT COUNT(*)
		FROM databarang
		WHERE expire BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
		`+validExpireDateWhere+`
	`, expiringSoonDays).Scan(&expiringSoonCount).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil data mendekati expired", "detail": err.Error()})
		return
	}

	if err := config.SIK.Raw(`
		SELECT COUNT(*)
		FROM databarang
		WHERE expire < CURDATE()
		`+validExpireDateWhere+`
	`).Scan(&expiredCount).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil data expired", "detail": err.Error()})
		return
	}

	summary.ExpiringSoonCount = expiringSoonCount
	summary.ExpiredCount = expiredCount

	if err := config.SIK.Raw(`
		SELECT
			databarang.kode_brng,
			databarang.nama_brng,
			COALESCE(gudang_stok.total_stok, 0) AS stok,
			COALESCE(golongan_barang.nama, 'Tidak Diketahui') AS golongan,
			CASE
				WHEN COALESCE(gudang_stok.total_stok, 0) < ? THEN 'critical'
				ELSE 'warning'
			END AS status
		FROM databarang
		`+gudangAPStockJoin+`
		LEFT JOIN golongan_barang
			ON databarang.kode_golongan = golongan_barang.kode
		WHERE COALESCE(gudang_stok.total_stok, 0) < ?
		ORDER BY COALESCE(gudang_stok.total_stok, 0) ASC
		LIMIT 50
	`, criticalStockThreshold, restockStockThreshold).Scan(&lowStockItems).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil barang hampir habis", "detail": err.Error()})
		return
	}

	if err := config.SIK.Raw(`
		SELECT
			databarang.kode_brng,
			databarang.nama_brng,
			DATE_FORMAT(databarang.expire, '%Y-%m-%d') AS expire,
			DATEDIFF(databarang.expire, CURDATE()) AS days_left,
			databarang.kode_brng AS batch,
			CASE
				WHEN databarang.expire < CURDATE() THEN 'expired'
				WHEN databarang.expire <= DATE_ADD(CURDATE(), INTERVAL ? DAY) THEN 'expiring_soon'
				ELSE 'normal'
			END AS status
		FROM databarang
		WHERE (
				databarang.expire < CURDATE()
				OR databarang.expire <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
			)
			AND databarang.expire IS NOT NULL
			AND databarang.expire <> ''
			AND databarang.expire <> '0000-00-00'
			AND databarang.expire >= '1990-01-01'
			AND YEAR(databarang.expire) >= 1990
			AND YEAR(databarang.expire) <= YEAR(CURDATE()) + 15
		ORDER BY databarang.expire ASC
		LIMIT 50
	`, expiringSoonDays, expiringSoonDays).Scan(&expiringItems).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil status expired barang", "detail": err.Error()})
		return
	}

	if err := config.SIK.Raw(`
		SELECT
			COALESCE(golongan_barang.nama, 'Tidak Diketahui') AS golongan,
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
	`).Scan(&golonganStats).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil statistik golongan", "detail": err.Error()})
		return
	}

	if err := config.SIK.Raw(`
		SELECT
			COALESCE(golongan_barang.nama, 'Tidak Diketahui') AS golongan,
			COUNT(DISTINCT databarang.kode_brng) AS item_count,
			CAST(COALESCE(SUM(IFNULL(gudangbarang.stok, 0)), 0) AS SIGNED) AS total_stock,
			COALESCE(SUM(IFNULL(gudangbarang.stok, 0) * databarang.h_beli), 0) AS inventory_value
		FROM databarang
		LEFT JOIN gudangbarang
			ON databarang.kode_brng = gudangbarang.kode_brng
			AND gudangbarang.kd_bangsal = 'AP'
		LEFT JOIN golongan_barang
			ON databarang.kode_golongan = golongan_barang.kode
		GROUP BY golongan_barang.nama
		ORDER BY inventory_value DESC
		LIMIT 20
	`).Scan(&golonganValues).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil nilai inventory per golongan", "detail": err.Error()})
		return
	}

	movementQuery := `
		SELECT
			databarang.kode_brng,
			databarang.nama_brng,
			COALESCE(gudang_stok.total_stok, 0) AS stok_akhir,
			COALESCE(keluar.total_keluar, 0) AS barang_keluar,
			COALESCE(masuk.total_masuk, 0) AS barang_masuk
		FROM databarang
		` + gudangAPStockJoin + `
		LEFT JOIN (
			SELECT
				detail_pengeluaran_obat_bhp.kode_brng,
				SUM(COALESCE(detail_pengeluaran_obat_bhp.jumlah, 0)) AS total_keluar
			FROM pengeluaran_obat_bhp
			JOIN detail_pengeluaran_obat_bhp
				ON pengeluaran_obat_bhp.no_keluar = detail_pengeluaran_obat_bhp.no_keluar
			WHERE pengeluaran_obat_bhp.tanggal IS NOT NULL
				` + outDateFilter + `
			GROUP BY detail_pengeluaran_obat_bhp.kode_brng
		) keluar ON databarang.kode_brng = keluar.kode_brng
		LEFT JOIN (
			SELECT
				data_batch.kode_brng,
				SUM(COALESCE(data_batch.jumlahbeli, 0)) AS total_masuk
			FROM data_batch
			WHERE data_batch.tgl_beli IS NOT NULL
				` + inDateFilter + `
			GROUP BY data_batch.kode_brng
		) masuk ON databarang.kode_brng = masuk.kode_brng
		WHERE COALESCE(gudang_stok.total_stok, 0) > 0
			OR COALESCE(keluar.total_keluar, 0) > 0
		ORDER BY COALESCE(keluar.total_keluar, 0) DESC
		LIMIT 30
	`

	if err := config.SIK.Raw(movementQuery).Scan(&movementRows).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil data pergerakan stok", "detail": err.Error()})
		return
	}

	turnoverItems := make([]models.MonitoringStockTurnover, 0, len(movementRows))
	coverageItems := make([]models.MonitoringStockCoverage, 0, len(movementRows))

	for _, row := range movementRows {
		persediaanAkhir := row.StokAkhir
		persediaanAwal := persediaanAkhir + row.BarangKeluar - row.BarangMasuk
		if persediaanAwal < 0 {
			persediaanAwal = 0
		}

		rataRata := (persediaanAwal + persediaanAkhir) / 2
		turnoverRatio := 0.0
		if rataRata > 0 && row.BarangKeluar > 0 {
			turnoverRatio = row.BarangKeluar / rataRata
		}

		avgDailyUsage := 0.0
		if observationDays > 0 && row.BarangKeluar > 0 {
			avgDailyUsage = row.BarangKeluar / float64(observationDays)
		}

		coverageDays := 0.0
		hasUsage := avgDailyUsage > 0
		if hasUsage {
			coverageDays = persediaanAkhir / avgDailyUsage
		}

		turnoverItems = append(turnoverItems, models.MonitoringStockTurnover{
			KodeBrng:           row.KodeBrng,
			NamaBrng:           row.NamaBrng,
			BarangKeluar:       round2(row.BarangKeluar),
			PersediaanAwal:     round2(persediaanAwal),
			PersediaanAkhir:    round2(persediaanAkhir),
			RataRataPersediaan: round2(rataRata),
			TurnoverRatio:      round2(turnoverRatio),
		})

		coverageItems = append(coverageItems, models.MonitoringStockCoverage{
			KodeBrng:                row.KodeBrng,
			NamaBrng:                row.NamaBrng,
			StokSaatIni:             round2(persediaanAkhir),
			RataRataPemakaianHarian: round2(avgDailyUsage),
			CoverageDays:            round2(coverageDays),
			Status:                  coverageStatus(coverageDays, hasUsage),
		})
	}

	response := models.MonitoringStockResponse{
		Summary:           summary,
		LowStockItems:     lowStockItems,
		ExpiringItems:     expiringItems,
		TurnoverItems:     turnoverItems,
		CoverageItems:     coverageItems,
		GolonganStats:     golonganStats,
		GolonganValues:    golonganValues,
		ObservationDays:   observationDays,
		ObservationPeriod: monitoringObservationLabel(period, observationDays),
	}

	c.JSON(200, gin.H{
		"data": response,
		"meta": gin.H{
			"period":             period,
			"observation_days":   observationDays,
			"observation_period": response.ObservationPeriod,
			"critical_threshold": criticalStockThreshold,
			"restock_threshold":  restockStockThreshold,
			"expiring_soon_days": expiringSoonDays,
			"stock_source":       "gudangbarang (kd_bangsal=AP)",
		},
	})
}

func GetMonitoringStockDetails(c *gin.Context) {
	detailType := strings.ToLower(strings.TrimSpace(c.Query("type")))
	search := strings.ToLower(strings.TrimSpace(c.Query("search")))

	if detailType == "" {
		c.JSON(400, gin.H{"error": "Parameter type harus diisi ('critical', 'restock', 'expiring_soon', atau 'expired')"})
		return
	}

	db := config.SIK

	switch detailType {
	case "critical":
		var items []models.MonitoringStockLowItem
		queryStr := `
			SELECT
				databarang.kode_brng,
				databarang.nama_brng,
				COALESCE(gudang_stok.total_stok, 0) AS stok,
				COALESCE(golongan_barang.nama, 'Tidak Diketahui') AS golongan,
				'critical' AS status
			FROM databarang
			` + gudangAPStockJoin + `
			LEFT JOIN golongan_barang
				ON databarang.kode_golongan = golongan_barang.kode
			WHERE COALESCE(gudang_stok.total_stok, 0) < ?
		`
		var args []interface{}
		args = append(args, criticalStockThreshold)

		if search != "" {
			queryStr += " AND (LOWER(databarang.nama_brng) LIKE ? OR LOWER(databarang.kode_brng) LIKE ?)"
			args = append(args, "%"+search+"%", "%"+search+"%")
		}

		queryStr += " ORDER BY COALESCE(gudang_stok.total_stok, 0) ASC"

		if err := db.Raw(queryStr, args...).Scan(&items).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal mengambil data stok kritis", "detail": err.Error()})
			return
		}
		c.JSON(200, gin.H{"data": items})

	case "restock":
		var items []models.MonitoringStockLowItem
		queryStr := `
			SELECT
				databarang.kode_brng,
				databarang.nama_brng,
				COALESCE(gudang_stok.total_stok, 0) AS stok,
				COALESCE(golongan_barang.nama, 'Tidak Diketahui') AS golongan,
				'warning' AS status
			FROM databarang
			` + gudangAPStockJoin + `
			LEFT JOIN golongan_barang
				ON databarang.kode_golongan = golongan_barang.kode
			WHERE COALESCE(gudang_stok.total_stok, 0) >= ? AND COALESCE(gudang_stok.total_stok, 0) < ?
		`
		var args []interface{}
		args = append(args, criticalStockThreshold, restockStockThreshold)

		if search != "" {
			queryStr += " AND (LOWER(databarang.nama_brng) LIKE ? OR LOWER(databarang.kode_brng) LIKE ?)"
			args = append(args, "%"+search+"%", "%"+search+"%")
		}

		queryStr += " ORDER BY COALESCE(gudang_stok.total_stok, 0) ASC"

		if err := db.Raw(queryStr, args...).Scan(&items).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal mengambil data perlu restock", "detail": err.Error()})
			return
		}
		c.JSON(200, gin.H{"data": items})

	case "expiring_soon":
		var items []models.MonitoringStockExpiringItem
		queryStr := `
			SELECT
				databarang.kode_brng,
				databarang.nama_brng,
				DATE_FORMAT(databarang.expire, '%Y-%m-%d') AS expire,
				DATEDIFF(databarang.expire, CURDATE()) AS days_left,
				databarang.kode_brng AS batch,
				'expiring_soon' AS status
			FROM databarang
			WHERE databarang.expire BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
			` + validExpireDateWhere + `
		`
		var args []interface{}
		args = append(args, expiringSoonDays)

		if search != "" {
			queryStr += " AND (LOWER(databarang.nama_brng) LIKE ? OR LOWER(databarang.kode_brng) LIKE ?)"
			args = append(args, "%"+search+"%", "%"+search+"%")
		}

		queryStr += " ORDER BY databarang.expire ASC"

		if err := db.Raw(queryStr, args...).Scan(&items).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal mengambil data mendekati expired", "detail": err.Error()})
			return
		}
		c.JSON(200, gin.H{"data": items})

	case "expired":
		var items []models.MonitoringStockExpiringItem
		queryStr := `
			SELECT
				databarang.kode_brng,
				databarang.nama_brng,
				DATE_FORMAT(databarang.expire, '%Y-%m-%d') AS expire,
				DATEDIFF(databarang.expire, CURDATE()) AS days_left,
				databarang.kode_brng AS batch,
				'expired' AS status
			FROM databarang
			WHERE databarang.expire < CURDATE()
			` + validExpireDateWhere + `
		`
		var args []interface{}

		if search != "" {
			queryStr += " AND (LOWER(databarang.nama_brng) LIKE ? OR LOWER(databarang.kode_brng) LIKE ?)"
			args = append(args, "%"+search+"%", "%"+search+"%")
		}

		queryStr += " ORDER BY databarang.expire ASC"

		if err := db.Raw(queryStr, args...).Scan(&items).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal mengambil data expired", "detail": err.Error()})
			return
		}
		c.JSON(200, gin.H{"data": items})

	default:
		c.JSON(400, gin.H{"error": "Parameter type tidak valid. Harus 'critical', 'restock', 'expiring_soon', atau 'expired'"})
	}
}
