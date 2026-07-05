package config

import (
	"backend/models"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var SIK *gorm.DB

func ConnectDatabase() {

	var err error

	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading .env")
	}

	// =========================
	// SMART DATABASE CONNECTION
	// Try local first, fallback to remote
	// =========================

	maxRetries := 90
	retryInterval := 2 * time.Second

	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold: 200 * time.Millisecond,
			LogLevel:      logger.Warn,
		},
	)

	// Local database config
	localHost := os.Getenv("LOCAL_DB_HOST")
	if localHost == "" {
		localHost = "127.0.0.1"
	}
	localPort := os.Getenv("LOCAL_DB_PORT")
	if localPort == "" {
		localPort = "3306"
	}
	localUser := os.Getenv("LOCAL_DB_USER")
	if localUser == "" {
		localUser = "root"
	}
	localPass := os.Getenv("LOCAL_DB_PASSWORD")
	localDB := os.Getenv("LOCAL_DB_NAME")
	if localDB == "" {
		localDB = "sik"
	}

	// Remote database config
	remoteHost := os.Getenv("REMOTE_DB_HOST")
	if remoteHost == "" {
		remoteHost = "100.72.136.112"
	}
	remotePort := os.Getenv("REMOTE_DB_PORT")
	if remotePort == "" {
		remotePort = "3306"
	}
	remoteUser := os.Getenv("REMOTE_DB_USER")
	if remoteUser == "" {
		remoteUser = "root"
	}
	remotePass := os.Getenv("REMOTE_DB_PASSWORD")
	remoteDB := os.Getenv("REMOTE_DB_NAME")
	if remoteDB == "" {
		remoteDB = "sik"
	}

	// Try remote database (from .env)
	remoteDSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		remoteUser,
		remotePass,
		remoteHost,
		remotePort,
		remoteDB,
	)

	// Try local database first
	// In Docker: use host.docker.internal to access host machine
	// In local run: use 127.0.0.1
	localHosts := []string{localHost, "127.0.0.1"}
	localConnected := false

	fmt.Println("Attempting to connect to local database...")

	// Try each local host
	for _, lh := range localHosts {
		if localConnected {
			break
		}

		localDSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
			localUser,
			localPass,
			lh,
			localPort,
			localDB,
		)

		for i := 0; i < 3; i++ {
			SIK, err = gorm.Open(mysql.Open(localDSN), &gorm.Config{Logger: gormLogger})
			if err == nil {
				fmt.Printf("✅ Connected to LOCAL database (XAMPP) via %s\n", localHost)
				localConnected = true
				goto DatabaseConnected
			}
			fmt.Printf("Local database not available at %s, attempt %d/3 - Error: %v\n", localHost, i+1, err)
			time.Sleep(1 * time.Second)
		}
	}

	// Fallback to remote database
	fmt.Printf("\n🌐 Local database unavailable, connecting to REMOTE database (%s)...\n", remoteHost)

	for i := 0; i < maxRetries; i++ {
		SIK, err = gorm.Open(mysql.Open(remoteDSN), &gorm.Config{Logger: gormLogger})
		if err == nil {
			fmt.Printf("✅ Connected to REMOTE database (%s via Tailscale)\n", remoteHost)
			goto DatabaseConnected
		}
		fmt.Printf("Waiting for remote database... attempt %d/%d\n", i+1, maxRetries)
		time.Sleep(retryInterval)
	}

	if err != nil {
		panic(fmt.Sprintf(
			"Failed to connect to database (both local and remote failed): %v",
			err,
		))
	}

DatabaseConnected:

	// Connection pooling — critical for remote DB over Tailscale
	sqlDB, err := SIK.DB()
	if err != nil {
		panic(fmt.Sprintf("Failed to get underlying SQL DB: %v", err))
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)
	sqlDB.SetConnMaxIdleTime(3 * time.Minute)

	// =========================
	// AUTO CREATE TABLE BARCODE
	// =========================

	err =
		SIK.AutoMigrate(
			&models.BarcodeItem{},
		)

	if err != nil {

		fmt.Println(
			"Auto migrate barcode error:",
			err,
		)
	}

	// Migrate idx_rbm_dashboard_recent to covering index (includes keluar, masuk)
	// so history subqueries can check keluar > 0 / masuk > 0 without table lookups.
	var idxColCount int64
	SIK.Raw(`SELECT COUNT(*) FROM information_schema.statistics
		WHERE table_schema = DATABASE() AND table_name = 'riwayat_barang_medis'
		AND index_name = 'idx_rbm_dashboard_recent'`).Scan(&idxColCount)
	if idxColCount > 0 && idxColCount <= 3 {
		SIK.Exec("ALTER TABLE riwayat_barang_medis DROP INDEX idx_rbm_dashboard_recent")
	}

	ensureIndex(
		"riwayat_barang_medis",
		"idx_rbm_dashboard_recent",
		"CREATE INDEX idx_rbm_dashboard_recent ON riwayat_barang_medis (kd_bangsal, tanggal, jam, keluar, masuk)",
	)

	ensureIndex(
		"gudangbarang",
		"idx_gudangbarang_bangsal_brng",
		"CREATE INDEX idx_gudangbarang_bangsal_brng ON gudangbarang (kd_bangsal, kode_brng)",
	)

	ensureIndex(
		"databarang",
		"idx_databarang_expire",
		"CREATE INDEX idx_databarang_expire ON databarang (expire)",
	)

	ensureIndex(
		"databarang",
		"idx_databarang_kode_golongan",
		"CREATE INDEX idx_databarang_kode_golongan ON databarang (kode_golongan)",
	)

	// idx_databarang_price_lookup: Covers price columns (beliluar, ralan, jualbebas, utama)
	// Used in stock_history_summary value calculation with CASE/COALESCE on no_faktur
	ensureIndex(
		"databarang",
		"idx_databarang_price_lookup",
		"CREATE INDEX idx_databarang_price_lookup ON databarang (kode_brng, beliluar, ralan, jualbebas, utama)",
	)

	ensureIndex(
		"riwayat_barang_medis",
		"idx_rbm_stockin_summary",
		"CREATE INDEX idx_rbm_stockin_summary ON riwayat_barang_medis (kd_bangsal, kode_brng, masuk)",
	)

	ensureIndex(
		"riwayat_barang_medis",
		"idx_rbm_stockout_summary",
		"CREATE INDEX idx_rbm_stockout_summary ON riwayat_barang_medis (kd_bangsal, kode_brng, no_faktur, keluar)",
	)

	ensureIndex(
		"riwayat_barang_medis",
		"idx_rbm_stock_movement",
		"CREATE INDEX idx_rbm_stock_movement ON riwayat_barang_medis (kd_bangsal, tanggal, masuk, keluar)",
	)

	// Covering index for the stock-in history sub-query.
	ensureIndex(
		"riwayat_barang_medis",
		"idx_rbm_stockin_history",
		"CREATE INDEX idx_rbm_stockin_history ON riwayat_barang_medis (kd_bangsal, masuk, tanggal, jam, kode_brng, no_batch, no_faktur)",
	)

	// Optimized indexes for slow query fixes (< 50ms target)

	// idx_rbm_date_range: Covers dashboard_stock_movement monthly aggregation (tanggal + kd_bangsal GROUP BY)
	ensureIndex(
		"riwayat_barang_medis",
		"idx_rbm_date_range",
		"CREATE INDEX idx_rbm_date_range ON riwayat_barang_medis (tanggal, kd_bangsal, masuk, keluar)",
	)

	// idx_rbm_stockout_price: Covers stock_history_summary value calculation (CASE on no_faktur + price columns)
	// Enables index-only scan without join to databarang table
	ensureIndex(
		"riwayat_barang_medis",
		"idx_rbm_stockout_price",
		"CREATE INDEX idx_rbm_stockout_price ON riwayat_barang_medis (kd_bangsal, keluar, no_faktur, kode_brng)",
	)

	// idx_rbm_count_fast: Fast COUNT queries for stock_history_summary count_out/count_in
	// Reduces rows scanned from millions to filtered index leaf pages
	ensureIndex(
		"riwayat_barang_medis",
		"idx_rbm_count_fast",
		"CREATE INDEX idx_rbm_count_fast ON riwayat_barang_medis (kd_bangsal, keluar, masuk)",
	)

	ensureIndex(
		"barcode_obat",
		"idx_barcode_obat_lookup",
		"CREATE INDEX idx_barcode_obat_lookup ON barcode_obat (kode_brng, no_batch, no_faktur, barcode(100))",
	)

	// data_batch: heavily JOINed on (kode_brng, no_batch, no_faktur), filtered on tgl_kadaluarsa
	ensureIndex(
		"data_batch",
		"idx_databatch_lookup",
		"CREATE INDEX idx_databatch_lookup ON data_batch (kode_brng, no_batch, no_faktur)",
	)
	ensureIndex(
		"data_batch",
		"idx_databatch_expiry",
		"CREATE INDEX idx_databatch_expiry ON data_batch (tgl_kadaluarsa)",
	)

	// gudangbarang: covering index for batch-level stock queries
	ensureIndex(
		"gudangbarang",
		"idx_gudangbarang_batch_stock",
		"CREATE INDEX idx_gudangbarang_batch_stock ON gudangbarang (kd_bangsal, kode_brng, no_batch, no_faktur, stok)",
	)

	// databarang: nama_brng used in LIKE search across 4+ controllers
	ensureIndex(
		"databarang",
		"idx_databarang_nama_brng",
		"CREATE INDEX idx_databarang_nama_brng ON databarang (nama_brng)",
	)

	// idx_rbm_dashboard_recent (kd_bangsal, tanggal, jam, keluar, masuk) already exists above

	// =========================
	// CREATE SUMMARY TABLE FOR STOCK MOVEMENT
	// =========================
	SIK.Exec(`
		CREATE TABLE IF NOT EXISTS dashboard_stock_movement (
			month CHAR(7) NOT NULL,
			kd_bangsal VARCHAR(5) NOT NULL,
			barang_masuk DOUBLE NOT NULL DEFAULT 0,
			barang_keluar DOUBLE NOT NULL DEFAULT 0,
			PRIMARY KEY (month, kd_bangsal),
			INDEX idx_dcm_bangsal (kd_bangsal, month)
		)
	`)

	// =========================
	// CREATE SUMMARY TABLE FOR STOCK HISTORY (total qty, value & count)
	// =========================
	SIK.Exec(`
		CREATE TABLE IF NOT EXISTS stock_history_summary (
			id TINYINT UNSIGNED NOT NULL DEFAULT 1 PRIMARY KEY,
			total_qty_out DOUBLE NOT NULL DEFAULT 0,
			total_value_out DOUBLE NOT NULL DEFAULT 0,
			total_qty_in DOUBLE NOT NULL DEFAULT 0,
			total_value_in DOUBLE NOT NULL DEFAULT 0,
			total_count_out INT NOT NULL DEFAULT 0,
			total_count_in INT NOT NULL DEFAULT 0
		)
	`)
	// Migration: add count columns if table already exists
	SIK.Exec("ALTER TABLE stock_history_summary ADD COLUMN total_count_out INT NOT NULL DEFAULT 0")
	SIK.Exec("ALTER TABLE stock_history_summary ADD COLUMN total_count_in INT NOT NULL DEFAULT 0")

	// =========================
	// CREATE SUMMARY TABLE FOR MONITORING STOCK + DASHBOARD (pre-computed aggregates)
	// =========================
	SIK.Exec(`
		CREATE TABLE IF NOT EXISTS monitoring_stock_summary (
			id TINYINT UNSIGNED NOT NULL DEFAULT 1 PRIMARY KEY,
			critical_stock_count INT NOT NULL DEFAULT 0,
			restock_needed_count INT NOT NULL DEFAULT 0,
			expiring_soon_count INT NOT NULL DEFAULT 0,
			expired_count INT NOT NULL DEFAULT 0,
			total_items INT NOT NULL DEFAULT 0,
			total_stock INT NOT NULL DEFAULT 0,
			inventory_value DOUBLE NOT NULL DEFAULT 0,
			low_stock_count INT NOT NULL DEFAULT 0,
			golongan_stats JSON DEFAULT NULL,
			golongan_values JSON DEFAULT NULL,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`)
	SIK.Exec("ALTER TABLE monitoring_stock_summary ADD COLUMN golongan_stats JSON DEFAULT NULL")
	SIK.Exec("ALTER TABLE monitoring_stock_summary ADD COLUMN golongan_values JSON DEFAULT NULL")

	// Initial refresh
	RefreshStockMovementSummary()
	RefreshStockHistorySummaryIfEmpty()
	RefreshMonitoringSummary()
	SeedBatchNumbers()

	fmt.Println("Database connected")

	// Background refresh every 5 minutes
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			RefreshStockMovementSummary()
			RefreshMonitoringSummary()
		}
	}()
}

// RefreshMonitoringSummary pre-computes dashboard + monitoring stock aggregates.
// All these queries run in parallel against MySQL once, cached in 1 row.
// Without this, every page load runs 8+ queries over Tailscale (200ms each).
func RefreshMonitoringSummary() {
	type summaryRow struct {
		Critical int64
		Restock  int64
	}
	var row summaryRow
	SIK.Raw(`
		SELECT
			COALESCE(SUM(IF(COALESCE(gs.total_stok, 0) < 20, 1, 0)), 0) AS critical,
			COALESCE(SUM(IF(COALESCE(gs.total_stok, 0) >= 20 AND COALESCE(gs.total_stok, 0) < 50, 1, 0)), 0) AS restock
		FROM databarang
		LEFT JOIN (
			SELECT kode_brng, SUM(stok) AS total_stok
			FROM gudangbarang WHERE kd_bangsal = 'AP' AND stok > 0
			GROUP BY kode_brng
		) gs ON databarang.kode_brng = gs.kode_brng
	`).Scan(&row)

	type expireRow struct {
		ExpiringSoon int64
		Expired      int64
	}
	var exp expireRow
	SIK.Raw(`
		SELECT
			SUM(CASE WHEN expire BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS expiring_soon,
			SUM(CASE WHEN expire < CURDATE() THEN 1 ELSE 0 END) AS expired
		FROM databarang
		WHERE expire IS NOT NULL AND expire != '' AND expire != '0000-00-00'
			AND expire >= '1990-01-01' AND expire <= DATE_ADD(CURDATE(), INTERVAL 15 YEAR)
	`).Scan(&exp)

	type dashRow struct {
		TotalItems    int64
		TotalStock    int64
		InventoryVal  float64
		LowStockCount int64
	}
	var dash dashRow
	SIK.Raw(`
		SELECT
			COUNT(DISTINCT databarang.kode_brng) AS total_items,
			COALESCE(SUM(gs.total_stok), 0) AS total_stock,
			COALESCE(SUM(gs.total_stok * databarang.h_beli), 0) AS inventory_val,
			COALESCE(SUM(IF(COALESCE(gs.total_stok, 0) <= 50, 1, 0)), 0) AS low_stock_count
		FROM databarang
		LEFT JOIN (
			SELECT kode_brng, SUM(stok) AS total_stok
			FROM gudangbarang WHERE kd_bangsal = 'AP' AND stok > 0
			GROUP BY kode_brng
		) gs ON databarang.kode_brng = gs.kode_brng
	`).Scan(&dash)

	SIK.Exec(`
		INSERT INTO monitoring_stock_summary (id, critical_stock_count, restock_needed_count,
			expiring_soon_count, expired_count, total_items, total_stock, inventory_value, low_stock_count)
		VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			critical_stock_count = VALUES(critical_stock_count),
			restock_needed_count = VALUES(restock_needed_count),
			expiring_soon_count = VALUES(expiring_soon_count),
			expired_count = VALUES(expired_count),
			total_items = VALUES(total_items),
			total_stock = VALUES(total_stock),
			inventory_value = VALUES(inventory_value),
			low_stock_count = VALUES(low_stock_count),
			updated_at = NOW()
	`, row.Critical, row.Restock, exp.ExpiringSoon, exp.Expired, dash.TotalItems, dash.TotalStock, dash.InventoryVal, dash.LowStockCount)

	// Pre-compute golongan stats and values — store as JSON
	type golStat struct {
		Golongan   string
		TotalStock int64
	}
	var gstats []golStat
	SIK.Raw(`
		SELECT COALESCE(golongan_barang.nama, 'Tidak Diketahui') AS golongan,
			CAST(COALESCE(SUM(gs.total_stok), 0) AS SIGNED) AS total_stock
		FROM databarang
		LEFT JOIN (
			SELECT kode_brng, SUM(stok) AS total_stok
			FROM gudangbarang WHERE kd_bangsal = 'AP' AND stok > 0
			GROUP BY kode_brng
		) gs ON databarang.kode_brng = gs.kode_brng
		LEFT JOIN golongan_barang ON databarang.kode_golongan = golongan_barang.kode
		WHERE COALESCE(gs.total_stok, 0) > 0
		GROUP BY golongan_barang.nama
		ORDER BY total_stock DESC LIMIT 20
	`).Scan(&gstats)

	type golVal struct {
		Golongan       string
		ItemCount      int64
		TotalStock     int64
		InventoryValue float64
	}
	var gvals []golVal
	SIK.Raw(`
		SELECT COALESCE(golongan_barang.nama, 'Tidak Diketahui') AS golongan,
			COUNT(DISTINCT databarang.kode_brng) AS item_count,
			CAST(COALESCE(SUM(gs.total_stok), 0) AS SIGNED) AS total_stock,
			COALESCE(SUM(gs.total_stok * databarang.h_beli), 0) AS inventory_value
		FROM databarang
		LEFT JOIN (
			SELECT kode_brng, SUM(stok) AS total_stok
			FROM gudangbarang WHERE kd_bangsal = 'AP' AND stok > 0
			GROUP BY kode_brng
		) gs ON databarang.kode_brng = gs.kode_brng
		LEFT JOIN golongan_barang ON databarang.kode_golongan = golongan_barang.kode
		WHERE COALESCE(gs.total_stok, 0) > 0
		GROUP BY golongan_barang.nama
		ORDER BY inventory_value DESC LIMIT 20
	`).Scan(&gvals)

	// Build JSON strings to insert into MySQL JSON columns
	golStatsJSON := "["
	for i, s := range gstats {
		if i > 0 {
			golStatsJSON += ","
		}
		golStatsJSON += fmt.Sprintf(`{"golongan":"%s","total_stock":%d}`, s.Golongan, s.TotalStock)
	}
	golStatsJSON += "]"

	golValsJSON := "["
	for i, v := range gvals {
		if i > 0 {
			golValsJSON += ","
		}
		golValsJSON += fmt.Sprintf(`{"golongan":"%s","item_count":%d,"total_stock":%d,"inventory_value":%.2f}`, v.Golongan, v.ItemCount, v.TotalStock, v.InventoryValue)
	}
	golValsJSON += "]"

	SIK.Exec(`
		UPDATE monitoring_stock_summary SET
			golongan_stats = ?, golongan_values = ?,
			updated_at = NOW()
		WHERE id = 1
	`, golStatsJSON, golValsJSON)
}

func RefreshStockHistorySummaryIfEmpty() {
	var total int64
	if err := SIK.Table("stock_history_summary").Count(&total).Error; err != nil {
		fmt.Println("Check stock history summary error:", err)
		return
	}
	if total == 0 {
		RefreshStockHistorySummary()
	}
}

func AddStockHistorySummaryOut(tx *gorm.DB, kodeBrng string, noFaktur string, qty float64) error {
	return tx.Exec(`
		INSERT INTO stock_history_summary (id, total_qty_out, total_value_out, total_count_out)
		SELECT 1, ?, ? * CASE
			WHEN ? = 'Apotek' THEN COALESCE(NULLIF(beliluar, 0), NULLIF(ralan, 0), NULLIF(jualbebas, 0), utama, 0)
			WHEN ? = 'Utama (BPJS)' THEN COALESCE(NULLIF(utama, 0), NULLIF(ralan, 0), NULLIF(jualbebas, 0), beliluar, 0)
			ELSE COALESCE(NULLIF(ralan, 0), NULLIF(jualbebas, 0), NULLIF(beliluar, 0), utama, 0)
		END, 1
		FROM databarang
		WHERE kode_brng = ?
		ON DUPLICATE KEY UPDATE
			total_qty_out = total_qty_out + VALUES(total_qty_out),
			total_value_out = total_value_out + VALUES(total_value_out),
			total_count_out = total_count_out + 1
	`, qty, qty, noFaktur, noFaktur, kodeBrng).Error
}

func AddStockHistorySummaryIn(tx *gorm.DB, kodeBrng string, qty float64) error {
	return tx.Exec(`
		INSERT INTO stock_history_summary (id, total_qty_in, total_value_in, total_count_in)
		SELECT 1, ?, ? * COALESCE(h_beli, 0), 1
		FROM databarang
		WHERE kode_brng = ?
		ON DUPLICATE KEY UPDATE
			total_qty_in = total_qty_in + VALUES(total_qty_in),
			total_value_in = total_value_in + VALUES(total_value_in),
			total_count_in = total_count_in + 1
	`, qty, qty, kodeBrng).Error
}

// RefreshStockMovementSummary rebuilds the monthly stock movement summary table
func RefreshStockMovementSummary() {
	err := SIK.Exec(`
		INSERT INTO dashboard_stock_movement (month, kd_bangsal, barang_masuk, barang_keluar)
		SELECT
			DATE_FORMAT(tanggal, '%Y-%m') AS month,
			kd_bangsal,
			SUM(masuk)  AS barang_masuk,
			SUM(keluar) AS barang_keluar
		FROM riwayat_barang_medis
		WHERE tanggal >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m-01')
		GROUP BY DATE_FORMAT(tanggal, '%Y-%m'), kd_bangsal
		ON DUPLICATE KEY UPDATE
			barang_masuk  = VALUES(barang_masuk),
			barang_keluar = VALUES(barang_keluar)
	`).Error
	if err != nil {
		fmt.Println("Refresh stock movement summary error:", err)
	}
}

// RefreshStockHistorySummary pre-computes total qty, value & count for stock-in/out history.
// Avoids scanning all rows on every API request — reads from this table in <1ms.
func RefreshStockHistorySummary() {
	// Stock out: group by (kode_brng, no_faktur) to avoid row multiplication,
	// then apply price CASE per group.
	err := SIK.Exec(`
		INSERT INTO stock_history_summary (id, total_qty_out, total_value_out, total_count_out)
		SELECT 1,
			COALESCE(SUM(r.total_keluar), 0),
			COALESCE(SUM(r.total_keluar * CASE
				WHEN r.no_faktur = 'Apotek' THEN COALESCE(NULLIF(d.beliluar, 0), NULLIF(d.ralan, 0), NULLIF(d.jualbebas, 0), d.utama, 0)
				WHEN r.no_faktur = 'Utama (BPJS)' THEN COALESCE(NULLIF(d.utama, 0), NULLIF(d.ralan, 0), NULLIF(d.jualbebas, 0), d.beliluar, 0)
				ELSE COALESCE(NULLIF(d.ralan, 0), NULLIF(d.jualbebas, 0), NULLIF(d.beliluar, 0), d.utama, 0)
			END), 0),
			COALESCE(SUM(r.total_count), 0)
		FROM (
			SELECT kode_brng, no_faktur, SUM(keluar) AS total_keluar, COUNT(*) AS total_count
			FROM riwayat_barang_medis FORCE INDEX (idx_rbm_stockout_price)
			WHERE kd_bangsal = 'AP' AND keluar > 0
			GROUP BY kode_brng, no_faktur
		) r
		LEFT JOIN databarang d ON r.kode_brng = d.kode_brng
		ON DUPLICATE KEY UPDATE
			total_qty_out = VALUES(total_qty_out),
			total_value_out = VALUES(total_value_out),
			total_count_out = VALUES(total_count_out)
	`).Error
	if err != nil {
		fmt.Println("Refresh stock history summary (out) error:", err)
	}

	// Stock in: single-pass aggregate over riwayat_barang_medis + databarang.
	err = SIK.Exec(`
		INSERT INTO stock_history_summary (id, total_qty_in, total_value_in, total_count_in)
		SELECT 1,
			COALESCE(SUM(r.masuk), 0),
			COALESCE(SUM(r.masuk * COALESCE(d.h_beli, 0)), 0),
			COUNT(*)
		FROM riwayat_barang_medis r
		LEFT JOIN databarang d ON r.kode_brng = d.kode_brng
		WHERE r.kd_bangsal = 'AP' AND r.masuk > 0
		ON DUPLICATE KEY UPDATE
			total_qty_in = VALUES(total_qty_in),
			total_value_in = VALUES(total_value_in),
			total_count_in = VALUES(total_count_in)
	`).Error
	if err != nil {
		fmt.Println("Refresh stock history summary (in) error:", err)
	}
}

func ensureIndex(tableName string, indexName string, createSQL string) {
	var total int64

	err := SIK.
		Raw(`
			SELECT COUNT(1)
			FROM information_schema.statistics
			WHERE table_schema = DATABASE()
				AND table_name = ?
				AND index_name = ?
		`, tableName, indexName).
		Scan(&total).Error

	if err != nil {
		fmt.Println("Check index error:", err)
		return
	}

	if total > 0 {
		return
	}

	if err := SIK.Exec(createSQL).Error; err != nil {
		fmt.Println("Create index error:", err)
	}
}

// SeedBatchNumbers generates no_batch and no_faktur for items in gudangbarang
// that don't have them yet, and inserts corresponding entries into data_batch.
// It only runs once – if all items already have batch numbers it skips.
func SeedBatchNumbers() {
	var count int64
	SIK.Raw(`
		SELECT COUNT(*)
		FROM gudangbarang g
		JOIN databarang d ON g.kode_brng = d.kode_brng
		WHERE g.kd_bangsal = 'AP'
		  AND g.stok > 0
		  AND (g.no_batch IS NULL OR g.no_batch = '')
	`).Scan(&count)

	if count == 0 {
		fmt.Println("✅ SeedBatchNumbers: semua barang sudah memiliki no_batch")
		return
	}

	fmt.Printf("⚙️  SeedBatchNumbers: %d barang tanpa batch, generating...\n", count)

	var maxBTC int
	SIK.Raw("SELECT COALESCE(MAX(CAST(SUBSTRING(no_batch,4) AS UNSIGNED)), 0) FROM gudangbarang WHERE no_batch REGEXP '^BTC[0-9]+$'").Scan(&maxBTC)

	today := time.Now().Format("0201")
	var maxPMF int
	SIK.Raw("SELECT COALESCE(MAX(CAST(SUBSTRING(no_faktur,10) AS UNSIGNED)), 0) FROM gudangbarang WHERE no_faktur LIKE ?", "PMF"+today+"-%").Scan(&maxPMF)

	type itemToBatch struct {
		KodeBrng  string  `gorm:"column:kode_brng"`
		KdBangsal string  `gorm:"column:kd_bangsal"`
		Stok      float64 `gorm:"column:stok"`
	}
	var items []itemToBatch
	SIK.Raw(`
		SELECT g.kode_brng, g.kd_bangsal, g.stok
		FROM gudangbarang g
		JOIN databarang d ON g.kode_brng = d.kode_brng
		WHERE g.kd_bangsal = 'AP' AND g.stok > 0
		  AND (g.no_batch IS NULL OR g.no_batch = '')
		ORDER BY g.kode_brng
	`).Scan(&items)

	tx := SIK.Begin()
	if tx.Error != nil {
		fmt.Println("❌ SeedBatchNumbers: gagal memulai transaksi:", tx.Error)
		return
	}

	for i, item := range items {
		batchNo := fmt.Sprintf("BTC%06d", maxBTC+i+1)
		fakturNo := fmt.Sprintf("PMF%s-%04d", today, maxPMF+i+1)

		// Update satu baris gudangbarang per iterasi (LIMIT 1) agar tiap baris
		// dapat no_batch berbeda meskipun kode_brng-nya sama.
		tx.Exec("UPDATE gudangbarang SET no_batch = ?, no_faktur = ? WHERE kode_brng = ? AND kd_bangsal = ? AND (no_batch IS NULL OR no_batch = '') LIMIT 1",
			batchNo, fakturNo, item.KodeBrng, item.KdBangsal)

		tx.Exec("UPDATE riwayat_barang_medis SET no_batch = ?, no_faktur = ? WHERE kode_brng = ? AND (no_batch IS NULL OR no_batch = '') LIMIT 1",
			batchNo, fakturNo, item.KodeBrng)
	}

	var dataBatchExists int64
	SIK.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'data_batch'").Scan(&dataBatchExists)

	if dataBatchExists == 0 {
		fmt.Println("⚠️  SeedBatchNumbers: tabel data_batch belum ada, skip insert ke data_batch")
		if err := tx.Commit().Error; err != nil {
			tx.Rollback()
			fmt.Println("❌ SeedBatchNumbers: gagal commit:", err)
			return
		}
		fmt.Printf("✅ SeedBatchNumbers: berhasil generate batch untuk %d barang (data_batch tidak tersedia)", len(items))
		return
	}

	err := tx.Exec(`
		INSERT IGNORE INTO data_batch (
			no_batch, kode_brng, tgl_beli, tgl_kadaluarsa, asal, no_faktur,
			dasar, h_beli, ralan, kelas1, kelas2, kelas3, utama, vip, vvip,
			beliluar, jualbebas, karyawan, jumlahbeli, sisa
		)
		SELECT
			g.no_batch, g.kode_brng,
			CURDATE(),
			COALESCE(NULLIF(d.expire, ''), NULLIF(d.expire, '0000-00-00'), '0000-00-00'),
			'Penerimaan',
			g.no_faktur,
			COALESCE(d.dasar, 0), COALESCE(d.h_beli, 0),
			COALESCE(d.ralan, 0), COALESCE(d.kelas1, 0), COALESCE(d.kelas2, 0), COALESCE(d.kelas3, 0),
			COALESCE(d.utama, 0), COALESCE(d.vip, 0), COALESCE(d.vvip, 0),
			COALESCE(d.beliluar, 0), COALESCE(d.jualbebas, 0), COALESCE(d.karyawan, 0),
			ROUND(SUM(g.stok), 2), ROUND(SUM(g.stok), 2)
		FROM gudangbarang g
		LEFT JOIN databarang d ON g.kode_brng = d.kode_brng
		WHERE g.kd_bangsal = 'AP' AND g.stok > 0 AND g.no_batch != ''
		GROUP BY g.kode_brng, g.no_batch, g.no_faktur
	`).Error
	if err != nil {
		tx.Rollback()
		fmt.Println("❌ SeedBatchNumbers: gagal insert data_batch:", err)
		return
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		fmt.Println("❌ SeedBatchNumbers: gagal commit:", err)
		return
	}

	fmt.Printf("✅ SeedBatchNumbers: berhasil generate batch untuk %d barang\n", len(items))
}
