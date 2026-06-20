package config

import (
	"backend/models"
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var SIK *gorm.DB

func ConnectDatabase() {

	var err error

	// =========================
	// CONNECT DATABASE SIK
	// =========================

	SIK, err =
		gorm.Open(
			mysql.Open(
				"root:@tcp(127.0.0.1:3306)/sik",
			),
			&gorm.Config{},
		)

	if err != nil {
		panic(err)
	}

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

	ensureIndex(
		"riwayat_barang_medis",
		"idx_rbm_dashboard_recent",
		"CREATE INDEX idx_rbm_dashboard_recent ON riwayat_barang_medis (kd_bangsal, tanggal, jam)",
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

	fmt.Println(
		"Database connected",
	)
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
