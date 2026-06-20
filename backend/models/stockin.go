package models

type StockInItem struct {
	KodeBrng string  `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng string  `json:"nama_brng" gorm:"column:nama_brng"`
	Barcode  string  `json:"barcode" gorm:"column:barcode"`
	Stok     float64 `json:"stok" gorm:"column:stok"`
	HBeli    float64 `json:"h_beli" gorm:"column:h_beli"`
	Satuan   string  `json:"satuan" gorm:"column:satuan"`
	Supplier string  `json:"supplier" gorm:"column:supplier"`
	Golongan string  `json:"golongan" gorm:"column:golongan"`
	Expire   string  `json:"expire" gorm:"column:expire"`
}

type StockInRecent struct {
	KodeBrng string  `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng string  `json:"nama_brng" gorm:"column:nama_brng"`
	Qty      float64 `json:"qty" gorm:"column:qty"`
	Price    float64 `json:"price" gorm:"column:price"`
	Date     string  `json:"date" gorm:"column:date"`
	Time     string  `json:"time" gorm:"column:time"`
	Supplier string  `json:"supplier" gorm:"column:supplier"`
	Note     string  `json:"note" gorm:"column:note"`
}

type StockInHistory struct {
	KodeBrng  string  `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng  string  `json:"nama_brng" gorm:"column:nama_brng"`
	Barcode   string  `json:"barcode" gorm:"column:barcode"`
	Qty       float64 `json:"qty" gorm:"column:qty"`
	Unit      string  `json:"unit" gorm:"column:unit"`
	BuyPrice  float64 `json:"buy_price" gorm:"column:buy_price"`
	TotalCost float64 `json:"total_cost" gorm:"column:total_cost"`
	Expired   string  `json:"expired" gorm:"column:expired"`
	Date      string  `json:"date" gorm:"column:date"`
	Time      string  `json:"time" gorm:"column:time"`
	Supplier  string  `json:"supplier" gorm:"column:supplier"`
	Operator  string  `json:"operator" gorm:"column:operator"`
	Note      string  `json:"note" gorm:"column:note"`
}

type StockInSummary struct {
	TotalQty   float64 `json:"total_qty"`
	TotalValue float64 `json:"total_value"`
}

type StockInPayload struct {
	KodeBrng         string  `json:"kode_brng"`
	Qty              float64 `json:"qty"`
	Price            float64 `json:"price"`
	TanggalPembelian string  `json:"tanggal_pembelian"`
	Expired          string  `json:"expired"`
	NoBatch          string  `json:"no_batch"`
	NoFaktur         string  `json:"no_faktur"`
	Note             string  `json:"note"`
}
