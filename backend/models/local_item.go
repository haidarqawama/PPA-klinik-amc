package models

import "time"

type LocalItem struct {
	ID uint `json:"id" gorm:"primaryKey"`

	KodeBarang string `json:"kode_barang"`

	NamaBarang string `json:"nama_barang"`

	Supplier string `json:"supplier"`

	Satuan string `json:"satuan"`

	Kategori string `json:"kategori"`

	Golongan string `json:"golongan"`

	Jenis string `json:"jenis"`

	HargaBeli float64 `json:"harga_beli"`

	HargaUmum int `json:"harga_umum"`

	HargaUtama int `json:"harga_utama"`

	HargaBeliLuar int `json:"harga_beli_luar"`

	Stok int `json:"stok"`

	Expired *time.Time `json:"expired"`

	Barcode string `json:"barcode"`

	CreatedAt string `json:"created_at"`
}

func (LocalItem) TableName() string {
	return "items"
}