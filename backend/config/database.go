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

	ensureIndex(
		"barcode_obat",
		"idx_barcode_obat_lookup",
		"CREATE INDEX idx_barcode_obat_lookup ON barcode_obat (kode_brng, no_batch, no_faktur, barcode(100))",
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

	// Initial refresh
	RefreshStockMovementSummary()
	RefreshStockHistorySummary()

	fmt.Println("Database connected")

	// Background refresh every 5 minutes
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			RefreshStockMovementSummary()
			RefreshStockHistorySummary()
		}
	}()
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
		INSERT INTO stock_history_summary (id, total_qty_out, total_value_out)
		SELECT 1,
			COALESCE(SUM(t.total_keluar), 0),
			COALESCE(SUM(t.total_keluar * CASE
				WHEN t.no_faktur = 'Apotek' THEN COALESCE(NULLIF(databarang.beliluar, 0), NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0)
				WHEN t.no_faktur = 'Utama (BPJS)' THEN COALESCE(NULLIF(databarang.utama, 0), NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.beliluar, 0)
				ELSE COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), NULLIF(databarang.beliluar, 0), databarang.utama, 0)
			END), 0)
		FROM (
			SELECT r.kode_brng, r.no_faktur, SUM(r.keluar) AS total_keluar
			FROM riwayat_barang_medis r
			WHERE r.kd_bangsal = 'AP' AND r.keluar > 0
			GROUP BY r.kode_brng, r.no_faktur
		) AS t
		LEFT JOIN databarang ON t.kode_brng = databarang.kode_brng
		ON DUPLICATE KEY UPDATE
			total_qty_out = VALUES(total_qty_out),
			total_value_out = VALUES(total_value_out)
	`).Error
	if err != nil {
		fmt.Println("Refresh stock history summary (out) error:", err)
	}

	// Stock out count (number of rows, not groups)
	err = SIK.Exec(`
		INSERT INTO stock_history_summary (id, total_count_out)
		SELECT 1, COUNT(*)
		FROM riwayat_barang_medis
		WHERE kd_bangsal = 'AP' AND keluar > 0
		ON DUPLICATE KEY UPDATE
			total_count_out = VALUES(total_count_out)
	`).Error
	if err != nil {
		fmt.Println("Refresh stock history summary (out count) error:", err)
	}

	// Stock in: group by kode_brng, then apply h_beli.
	err = SIK.Exec(`
		INSERT INTO stock_history_summary (id, total_qty_in, total_value_in)
		SELECT 1,
			COALESCE(SUM(t.total_masuk), 0),
			COALESCE(SUM(t.total_masuk * COALESCE(databarang.h_beli, 0)), 0)
		FROM (
			SELECT r.kode_brng, SUM(r.masuk) AS total_masuk
			FROM riwayat_barang_medis r
			WHERE r.kd_bangsal = 'AP' AND r.masuk > 0
			GROUP BY r.kode_brng
		) AS t
		LEFT JOIN databarang ON t.kode_brng = databarang.kode_brng
		ON DUPLICATE KEY UPDATE
			total_qty_in = VALUES(total_qty_in),
			total_value_in = VALUES(total_value_in)
	`).Error
	if err != nil {
		fmt.Println("Refresh stock history summary (in) error:", err)
	}

	// Stock in count (number of rows, not groups)
	err = SIK.Exec(`
		INSERT INTO stock_history_summary (id, total_count_in)
		SELECT 1, COUNT(*)
		FROM riwayat_barang_medis
		WHERE kd_bangsal = 'AP' AND masuk > 0
		ON DUPLICATE KEY UPDATE
			total_count_in = VALUES(total_count_in)
	`).Error
	if err != nil {
		fmt.Println("Refresh stock history summary (in count) error:", err)
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
