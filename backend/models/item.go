package models

type Item struct {
	KodeBrng      string   `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng      string   `json:"nama_brng" gorm:"column:nama_brng"`
	StokMinimal   float64  `json:"stokminimal" gorm:"column:stokminimal"`
	Expire        *string  `json:"expire" gorm:"column:expire"`
	HBeli         float64  `json:"h_beli" gorm:"column:h_beli"`
	Ralan         float64  `json:"ralan" gorm:"column:ralan"`
	Utama 		  float64 `json:"utama" gorm:"column:utama"`
	Beliluar 	  float64 `json:"beliluar" gorm:"column:beliluar"`
	Barcode 	  string `json:"barcode" gorm:"column:barcode"`
	KodeKategori  *string  `json:"kode_kategori" gorm:"column:kode_kategori"`
	KodeGolongan  *string  `json:"kode_golongan" gorm:"column:kode_golongan"`
	KDJns         *string `json:"kdjns" gorm:"column:kdjns"`
	KodeIndustri  *string `json:"kode_industri" gorm:"column:kode_industri"`
	Stok          float64  `json:"stok" gorm:"column:stok"`
	KodeSat *string `json:"kode_sat" gorm:"column:kode_sat"`
	Supplier *string `json:"supplier"`
	Satuan   *string `json:"satuan"`
	Jenis    *string `json:"jenis"`
	Kategori *string `json:"kategori"`
	Golongan *string `json:"golongan"`
}

func (Item) TableName() string {
	return "databarang"
}