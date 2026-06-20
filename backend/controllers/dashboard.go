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

type dashboardCacheKey struct {
	golonganPage    int
	golonganLimit   int
	activitiesPage  int
	activitiesLimit int
}

type dashboardCacheEntry struct {
	data      models.DashboardResponse
	timestamp time.Time
}

var (
	dashboardCache   = make(map[dashboardCacheKey]dashboardCacheEntry)
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

	cacheKey := dashboardCacheKey{
		golonganPage:    golonganPage,
		golonganLimit:   golonganLimit,
		activitiesPage:  activitiesPage,
		activitiesLimit: activitiesLimit,
	}

	// Serve cached response if still valid
	dashboardCacheMu.RLock()
	if entry, ok := dashboardCache[cacheKey]; ok && time.Since(entry.timestamp) < dashboardCacheTTL {
		dashboardCacheMu.RUnlock()
		c.JSON(200, gin.H{"data": entry.data})
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

	wg.Add(6)

	// 1. Summary metrics
	go func() {
		defer wg.Done()
		e := config.SIK.Raw(`
			SELECT
				COUNT(DISTINCT databarang.kode_brng) AS total_items,
				CAST(COALESCE(SUM(IFNULL(gudangbarang.stok, 0)), 0) AS SIGNED) AS total_stock,
				COALESCE(SUM(IFNULL(gudangbarang.stok, 0) * databarang.h_beli), 0) AS inventory_value,
				COALESCE(SUM(IF(COALESCE(gudangbarang.stok, 0) <= ?, 1, 0)), 0) AS low_stock_count
			FROM databarang
			LEFT JOIN gudangbarang
				ON databarang.kode_brng = gudangbarang.kode_brng
				AND gudangbarang.kd_bangsal = 'AP'
		`, 50).Scan(&summary).Error
		captureErr(e)
	}()

	// 2. Combined expiring + expired counts
	go func() {
		defer wg.Done()
		type expireCounts struct {
			ExpiringSoon int64 `gorm:"column:expiring_soon"`
			Expired      int64 `gorm:"column:expired"`
		}
		var counts expireCounts
		e := config.SIK.Raw(`
			SELECT
				SUM(CASE WHEN expire BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS expiring_soon,
				SUM(CASE WHEN expire < CURDATE() THEN 1 ELSE 0 END) AS expired
			FROM databarang
			WHERE expire IS NOT NULL
				AND expire <> ''
				AND expire <> '0000-00-00'
		`).Scan(&counts).Error
		if e != nil {
			captureErr(e)
			return
		}
		expiringSoonCount = counts.ExpiringSoon
		expiredCount = counts.Expired
	}()

	// 3. Golongan distribution (paginated)
	go func() {
		defer wg.Done()

		e := config.SIK.Raw(`
			SELECT COUNT(*) FROM (
				SELECT golongan_barang.nama
				FROM databarang
				LEFT JOIN gudangbarang
					ON databarang.kode_brng = gudangbarang.kode_brng
					AND gudangbarang.kd_bangsal = 'AP'
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
				CAST(COALESCE(SUM(IFNULL(gudangbarang.stok, 0)), 0) AS SIGNED) AS total_stock
			FROM databarang
			LEFT JOIN gudangbarang
				ON databarang.kode_brng = gudangbarang.kode_brng
				AND gudangbarang.kd_bangsal = 'AP'
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
	// 5. Stock movement (last 4 months)
	go func() {
		defer wg.Done()
		e := config.SIK.Raw(`
			SELECT
				DATE_FORMAT(tanggal, '%Y-%m') AS month,
				SUM(masuk)  AS barang_masuk,
				SUM(keluar) AS barang_keluar
			FROM riwayat_barang_medis
			WHERE kd_bangsal = 'AP'
				AND tanggal >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m-01')
				AND tanggal <  DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
			GROUP BY DATE_FORMAT(tanggal, '%Y-%m')
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
	dashboardCache[cacheKey] = dashboardCacheEntry{data: response, timestamp: time.Now()}
	dashboardCacheMu.Unlock()

	c.JSON(200, gin.H{
		"data": response,
	})
}
