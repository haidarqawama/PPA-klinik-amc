package models

type StockOutItem struct {
	KodeBrng    string  `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng    string  `json:"nama_brng" gorm:"column:nama_brng"`
	Barcode     string  `json:"barcode" gorm:"column:barcode"`
	Stok        float64 `json:"stok" gorm:"column:stok"`
	SellPrice   float64 `json:"sell_price" gorm:"column:sell_price"`
	HargaApotek float64 `json:"harga_apotek" gorm:"column:harga_apotek"`
	HargaUmum   float64 `json:"harga_umum" gorm:"column:harga_umum"`
	HargaUtama  float64 `json:"harga_utama" gorm:"column:harga_utama"`
	Satuan      string  `json:"satuan" gorm:"column:satuan"`
	Supplier    string  `json:"supplier" gorm:"column:supplier"`
	Golongan    string  `json:"golongan" gorm:"column:golongan"`
	Jenis       string  `json:"jenis" gorm:"column:jenis"`
	Expire      string  `json:"expire" gorm:"column:expire"`
}

type StockOutHistory struct {
	KodeBrng     string  `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng     string  `json:"nama_brng" gorm:"column:nama_brng"`
	Barcode      string  `json:"barcode" gorm:"column:barcode"`
	Qty          float64 `json:"qty" gorm:"column:qty"`
	Unit         string  `json:"unit" gorm:"column:unit"`
	SellPrice    float64 `json:"sell_price" gorm:"column:sell_price"`
	TotalRevenue float64 `json:"total_revenue" gorm:"column:total_revenue"`
	Date         string  `json:"date" gorm:"column:date"`
	Time         string  `json:"time" gorm:"column:time"`
	Destination  string  `json:"destination" gorm:"column:destination"`
	Operator     string  `json:"operator" gorm:"column:operator"`
	Note         string  `json:"note" gorm:"column:note"`
}

type StockOutPayload struct {
	KodeBrng    string  `json:"kode_brng"`
	Qty         float64 `json:"qty"`
	NoBatch     string  `json:"no_batch"`
	NoFaktur    string  `json:"no_faktur"`
	Destination string  `json:"destination"`
	Note        string  `json:"note"`
}

type StockOutHistorySummary struct {
	TotalQty   float64 `json:"total_qty" gorm:"column:total_qty"`
	TotalValue float64 `json:"total_value" gorm:"column:total_value"`
}

type StockOutBatchOption struct {
	NoBatch      string  `json:"no_batch" gorm:"column:no_batch"`
	NoFaktur     string  `json:"no_faktur" gorm:"column:no_faktur"`
	Expired      string  `json:"expired" gorm:"column:expired"`
	Sisa         float64 `json:"sisa" gorm:"column:sisa"`
	HargaBeli    float64 `json:"h_beli" gorm:"column:h_beli"`
	HargaJual    float64 `json:"sell_price" gorm:"column:sell_price"`
	HargaApotek  float64 `json:"harga_apotek" gorm:"column:harga_apotek"`
	HargaUmum    float64 `json:"harga_umum" gorm:"column:harga_umum"`
	HargaUtama   float64 `json:"harga_utama" gorm:"column:harga_utama"`
	TanggalMasuk string  `json:"tgl_beli" gorm:"column:tgl_beli"`
}
