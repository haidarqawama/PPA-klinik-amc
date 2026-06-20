package models

// ItemPriceSnapshot represents price data for an item
type ItemPriceSnapshot struct {
	Dasar     float64 `gorm:"column:dasar"`
	HBeli     float64 `gorm:"column:h_beli"`
	Ralan     float64 `gorm:"column:ralan"`
	Kelas1    float64 `gorm:"column:kelas1"`
	Kelas2    float64 `gorm:"column:kelas2"`
	Kelas3    float64 `gorm:"column:kelas3"`
	Utama     float64 `gorm:"column:utama"`
	Vip       float64 `gorm:"column:vip"`
	Vvip      float64 `gorm:"column:vvip"`
	Beliluar  float64 `gorm:"column:beliluar"`
	Jualbebas float64 `gorm:"column:jualbebas"`
	Karyawan  float64 `gorm:"column:karyawan"`
}

type Item struct {
	KodeBrng      string  `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng      string  `json:"nama_brng" gorm:"column:nama_brng"`
	StokMinimal   float64 `json:"stokminimal" gorm:"column:stokminimal"`
	Expire        *string `json:"expire" gorm:"column:expire"`
	HBeli         float64 `json:"h_beli" gorm:"column:h_beli"`
	Ralan         float64 `json:"ralan" gorm:"column:ralan"`
	Utama         float64 `json:"utama" gorm:"column:utama"`
	Beliluar      float64 `json:"beliluar" gorm:"column:beliluar"`
	Barcode       string  `json:"barcode" gorm:"column:barcode"`
	KodeKategori  *string `json:"kode_kategori" gorm:"column:kode_kategori"`
	KodeGolongan  *string `json:"kode_golongan" gorm:"column:kode_golongan"`
	KDJns         *string `json:"kdjns" gorm:"column:kdjns"`
	KodeIndustri  *string `json:"kode_industri" gorm:"column:kode_industri"`
	Stok          float64 `json:"stok" gorm:"column:stok"`
	KodeSat       *string `json:"kode_sat" gorm:"column:kode_sat"`
	Supplier      *string `json:"supplier" gorm:"column:supplier"`
	Satuan        *string `json:"satuan" gorm:"column:satuan"`
	Jenis         *string `json:"jenis" gorm:"column:jenis"`
	Kategori      *string `json:"kategori" gorm:"column:kategori"`
	Golongan      *string `json:"golongan" gorm:"column:golongan"`
	NoBatch       *string `json:"no_batch" gorm:"column:no_batch"`
	NoFaktur      *string `json:"no_faktur" gorm:"column:no_faktur"`
	TglBeli       *string `json:"tgl_beli" gorm:"column:tgl_beli"`
	TglKadaluarsa *string `json:"tgl_kadaluarsa" gorm:"column:tgl_kadaluarsa"`
}

func (Item) TableName() string {
	return "databarang"
}
