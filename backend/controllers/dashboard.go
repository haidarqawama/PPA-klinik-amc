package controllers

import (
	"backend/config"
	"backend/models"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

const dashboardCacheTTL = 30 * time.Second

var (
	dashboardCache   = make(map[models.DashboardCacheKey]models.DashboardCacheEntry)
	dashboardCacheMu sync.RWMutex
)

func parseIntDefault(value string, defaultValue int) int {
	if value == "" {
		return defaultValue
	}
	n, err := strconv.Atoi(value)
	if err != nil || n < 1 {
		return defaultValue
	}
	return n
}

func GetDashboard(c *gin.Context) {
	golonganPage := parseIntDefault(c.Query("golongan_page"), 1)
	golonganLimit := parseIntDefault(c.Query("golongan_limit"), 10)
	activitiesPage := parseIntDefault(c.Query("activities_page"), 1)
	activitiesLimit := parseIntDefault(c.Query("activities_limit"), 10)

	cacheKey := models.DashboardCacheKey{
		GolonganPage:    golonganPage,
		GolonganLimit:   golonganLimit,
		ActivitiesPage:  activitiesPage,
		ActivitiesLimit: activitiesLimit,
	}

	// Serve cached response if still valid
	dashboardCacheMu.RLock()
	if entry, ok := dashboardCache[cacheKey]; ok && time.Since(entry.Timestamp) < dashboardCacheTTL {
		dashboardCacheMu.RUnlock()
		c.JSON(200, gin.H{"data": entry.Data})
		return
	}
	dashboardCacheMu.RUnlock()

	var (
		summary              models.DashboardSummary
		expiringSoonCount    int64
		expiredCount         int64
		golonganDistribution []models.DashboardDistribution
		golonganTotal        int64
		locationStock        []models.DashboardLocation
		stockMovement        []models.DashboardStockMovement
		recentActivities     []models.DashboardRecentActivity
		activitiesTotal      int64
	)

	var wg sync.WaitGroup
	var errMu sync.Mutex
	var firstErr error

	captureErr := func(e error) {
		if e == nil {
			return
		}
		errMu.Lock()
		if firstErr == nil {
			firstErr = e
		}
		errMu.Unlock()
	}

	wg.Add(5)

	// 1 + 2. Summary + stock change from pre-computed table
	go func() {
		defer wg.Done()
		type sRow struct {
			TotalItems     int64   `gorm:"column:total_items"`
			TotalStock     int64   `gorm:"column:total_stock"`
			InventoryValue float64 `gorm:"column:inventory_value"`
			LowStockCount  int64   `gorm:"column:low_stock_count"`
			ExpiringSoon   int64   `gorm:"column:expiring_soon_count"`
			Expired        int64   `gorm:"column:expired_count"`
		}
		var row sRow
		e := config.SIK.Raw(`
			SELECT total_items, total_stock, inventory_value, low_stock_count,
				expiring_soon_count, expired_count
			FROM monitoring_stock_summary WHERE id = 1
		`).Scan(&row).Error
		if e != nil {
			captureErr(e)
			return
		}
		summary.TotalItems = row.TotalItems
		summary.TotalStock = row.TotalStock
		summary.InventoryValue = row.InventoryValue
		summary.LowStockCount = row.LowStockCount
		expiringSoonCount = row.ExpiringSoon
		expiredCount = row.Expired

		// Stock change vs previous month
		type movRow struct {
			Masuk  float64
			Keluar float64
		}
		var m movRow
		config.SIK.Raw(`
			SELECT COALESCE(SUM(barang_masuk), 0) AS masuk, COALESCE(SUM(barang_keluar), 0) AS keluar
			FROM dashboard_stock_movement
			WHERE kd_bangsal = 'AP'
				AND month >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')
				AND month < DATE_FORMAT(CURDATE(), '%Y-%m')
		`).Scan(&m)
		netChange := m.Masuk - m.Keluar
		prevStock := row.TotalStock - int64(netChange)
		if prevStock > 0 {
			pct := float64(row.TotalStock-prevStock) / float64(prevStock) * 100
			summary.StockChangePercent = &pct
		}
	}()

	// 3. Golongan distribution (paginated)
	go func() {
		defer wg.Done()

		e := config.SIK.Raw(`
			SELECT COUNT(*) FROM (
				SELECT golongan_barang.nama
				FROM databarang
				`+gudangAPStockJoin+`
				LEFT JOIN golongan_barang
					ON databarang.kode_golongan = golongan_barang.kode
				GROUP BY golongan_barang.nama
			) grouped
		`).Scan(&golonganTotal).Error
		if e != nil {
			captureErr(e)
			return
		}

		e = config.SIK.Raw(`
			SELECT
				COALESCE(golongan_barang.nama, 'Tidak Diketahui') AS label,
				COUNT(DISTINCT databarang.kode_brng) AS item_count,
				CAST(COALESCE(SUM(gudang_stok.total_stok), 0) AS SIGNED) AS total_stock
			FROM databarang
			`+gudangAPStockJoin+`
			LEFT JOIN golongan_barang
				ON databarang.kode_golongan = golongan_barang.kode
			GROUP BY golongan_barang.nama
			ORDER BY total_stock DESC
			LIMIT ? OFFSET ?
		`, golonganLimit, (golonganPage-1)*golonganLimit).Scan(&golonganDistribution).Error
		captureErr(e)
	}()

	// 4. Location stock
	go func() {
		defer wg.Done()
		e := config.SIK.Raw(`
			SELECT
				COALESCE(gudangbarang.kd_bangsal, 'AP') AS location,
				CAST(COALESCE(SUM(gudangbarang.stok), 0) AS SIGNED) AS total_stock
			FROM gudangbarang
			GROUP BY gudangbarang.kd_bangsal
			ORDER BY total_stock DESC
		`).Scan(&locationStock).Error
		captureErr(e)
	}()

	// 5. Stock movement (last 5 months)
	go func() {
		defer wg.Done()
		e := config.SIK.Raw(`
			SELECT
				month,
				barang_masuk,
				barang_keluar
			FROM (
				SELECT
					month,
					barang_masuk,
					barang_keluar
				FROM dashboard_stock_movement
				WHERE kd_bangsal = 'AP'
					AND month <= DATE_FORMAT(CURDATE(), '%Y-%m')
				ORDER BY month DESC
				LIMIT 5
			) AS recent_months
			ORDER BY month ASC
		`).Scan(&stockMovement).Error
		captureErr(e)
	}()

	// 6. Recent activities today (paginated)
	go func() {
		defer wg.Done()

		e := config.SIK.Raw(`
			SELECT COUNT(*)
			FROM riwayat_barang_medis r
			WHERE r.kd_bangsal = 'AP'
				AND r.tanggal = CURDATE()
				AND (
					r.masuk > 0
					OR r.keluar > 0
				)
		`).Scan(&activitiesTotal).Error
		if e != nil {
			captureErr(e)
			return
		}

		e = config.SIK.Raw(`
			SELECT
				0 AS id,
				CASE
					WHEN COALESCE(r.masuk, 0) > 0 THEN 'masuk'
					ELSE 'keluar'
				END AS activity_type,
				r.kode_brng,
				COALESCE(databarang.nama_brng, r.kode_brng) AS nama_brng,
				CAST(
					CASE
						WHEN COALESCE(r.masuk, 0) > 0 THEN COALESCE(r.masuk, 0)
						ELSE COALESCE(r.keluar, 0)
					END
					AS SIGNED
				) AS qty,
				DATE_FORMAT(r.tanggal, '%Y-%m-%d') AS activity_date,
				IFNULL(TIME_FORMAT(r.jam, '%H:%i:%s'), '') AS activity_time,
				COALESCE(
					NULLIF(r.no_faktur, ''),
					NULLIF(r.no_batch, ''),
					NULLIF(r.keterangan, ''),
					r.posisi,
					''
				) AS reference_no
			FROM riwayat_barang_medis r
			LEFT JOIN databarang
				ON r.kode_brng = databarang.kode_brng
			WHERE r.kd_bangsal = 'AP'
				AND r.tanggal = CURDATE()
				AND (
					r.masuk > 0
					OR r.keluar > 0
				)
			ORDER BY r.tanggal DESC, r.jam DESC
			LIMIT ? OFFSET ?
		`, activitiesLimit, (activitiesPage-1)*activitiesLimit).Scan(&recentActivities).Error
		captureErr(e)
	}()

	wg.Wait()

	if firstErr != nil {
		c.JSON(500, gin.H{"error": "Gagal memuat dashboard", "detail": firstErr.Error()})
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
		Pagination: models.DashboardPaginationMeta{
			Golongan: models.DashboardPagination{
				Page:       golonganPage,
				Limit:      golonganLimit,
				Total:      golonganTotal,
				TotalPages: (golonganTotal + int64(golonganLimit) - 1) / int64(golonganLimit),
			},
			Activities: models.DashboardPagination{
				Page:       activitiesPage,
				Limit:      activitiesLimit,
				Total:      activitiesTotal,
				TotalPages: (activitiesTotal + int64(activitiesLimit) - 1) / int64(activitiesLimit),
			},
		},
	}

	dashboardCacheMu.Lock()
	dashboardCache[cacheKey] = models.DashboardCacheEntry{Data: response, Timestamp: time.Now()}
	dashboardCacheMu.Unlock()

	c.JSON(200, gin.H{
		"data": response,
	})
}
