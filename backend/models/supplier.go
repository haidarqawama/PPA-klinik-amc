package models

type Supplier struct {

	KodeIndustri string `json:"kode_industri" gorm:"column:kode_industri"`

	NamaIndustri string `json:"nama_industri" gorm:"column:nama_industri"`

	Alamat string `json:"alamat" gorm:"column:alamat"`

	Kota string `json:"kota" gorm:"column:kota"`

	NoTelp string `json:"no_telp" gorm:"column:no_telp"`
}