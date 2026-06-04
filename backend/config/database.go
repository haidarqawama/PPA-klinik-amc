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

	fmt.Println(
		"Database connected",
	)
}