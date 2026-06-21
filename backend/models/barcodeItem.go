package models

type BarcodeItem struct {
	KodeBrng string `gorm:"primaryKey;size:15"`
	NoBatch  string `gorm:"primaryKey;size:50"`
	NoFaktur string `gorm:"primaryKey;size:50"`
	Barcode  string `gorm:"column:barcode"`
}

func (BarcodeItem) TableName() string {
	return "barcode_obat"
}
