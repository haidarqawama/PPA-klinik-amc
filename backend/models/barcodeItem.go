package models

type BarcodeItem struct {

	KodeBrng string `gorm:"primaryKey;size:15"`

	Barcode string `gorm:"unique"`
}

func (BarcodeItem) TableName() string {
	return "barcode_obat"
}