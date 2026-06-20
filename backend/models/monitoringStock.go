package models

type MonitoringStockSummary struct {
	CriticalStockCount int64 `json:"critical_stock_count"`
	RestockNeededCount int64 `json:"restock_needed_count"`
	ExpiringSoonCount  int64 `json:"expiring_soon_count"`
	ExpiredCount       int64 `json:"expired_count"`
}

type MonitoringStockLowItem struct {
	KodeBrng string  `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng string  `json:"nama_brng" gorm:"column:nama_brng"`
	Stok     float64 `json:"stok" gorm:"column:stok"`
	Golongan string  `json:"golongan" gorm:"column:golongan"`
	Status   string  `json:"status" gorm:"column:status"`
	Satuan   string  `json:"satuan" gorm:"column:satuan"`
}

type MonitoringStockExpiringItem struct {
	KodeBrng string `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng string `json:"nama_brng" gorm:"column:nama_brng"`
	Expire   string `json:"expire" gorm:"column:expire"`
	DaysLeft int    `json:"days_left" gorm:"column:days_left"`
	Batch    string `json:"batch" gorm:"column:batch"`
	Status   string `json:"status" gorm:"column:status"`
}

type MonitoringStockTurnover struct {
	KodeBrng           string  `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng           string  `json:"nama_brng" gorm:"column:nama_brng"`
	BarangKeluar       float64 `json:"barang_keluar" gorm:"column:barang_keluar"`
	PersediaanAwal     float64 `json:"persediaan_awal" gorm:"column:persediaan_awal"`
	PersediaanAkhir    float64 `json:"persediaan_akhir" gorm:"column:persediaan_akhir"`
	RataRataPersediaan float64 `json:"rata_rata_persediaan" gorm:"column:rata_rata_persediaan"`
	TurnoverRatio      float64 `json:"turnover_ratio" gorm:"column:turnover_ratio"`
	Satuan             string  `json:"satuan" gorm:"column:satuan"`
}

type MonitoringStockCoverage struct {
	KodeBrng                string  `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng                string  `json:"nama_brng" gorm:"column:nama_brng"`
	StokSaatIni             float64 `json:"stok_saat_ini" gorm:"column:stok_saat_ini"`
	RataRataPemakaianHarian float64 `json:"rata_rata_pemakaian_harian" gorm:"column:rata_rata_pemakaian_harian"`
	CoverageDays            float64 `json:"coverage_days" gorm:"column:coverage_days"`
	Status                  string  `json:"status" gorm:"column:status"`
	Satuan                  string  `json:"satuan" gorm:"column:satuan"`
}

type MonitoringStockGolonganValue struct {
	Golongan       string  `json:"golongan" gorm:"column:golongan"`
	ItemCount      int64   `json:"item_count" gorm:"column:item_count"`
	TotalStock     int64   `json:"total_stock" gorm:"column:total_stock"`
	InventoryValue float64 `json:"inventory_value" gorm:"column:inventory_value"`
}

type MonitoringStockGolonganStat struct {
	Golongan   string `json:"golongan" gorm:"column:golongan"`
	TotalStock int64  `json:"total_stock" gorm:"column:total_stock"`
}

type MonitoringStockMovementRow struct {
	KodeBrng     string  `gorm:"column:kode_brng"`
	NamaBrng     string  `gorm:"column:nama_brng"`
	StokAkhir    float64 `gorm:"column:stok_akhir"`
	BarangKeluar float64 `gorm:"column:barang_keluar"`
	BarangMasuk  float64 `gorm:"column:barang_masuk"`
	Satuan       string  `gorm:"column:satuan"`
}

type MonitoringStockResponse struct {
	Summary           MonitoringStockSummary         `json:"summary"`
	LowStockItems     []MonitoringStockLowItem       `json:"low_stock_items"`
	ExpiringItems     []MonitoringStockExpiringItem  `json:"expiring_items"`
	TurnoverItems     []MonitoringStockTurnover      `json:"turnover_items"`
	CoverageItems     []MonitoringStockCoverage      `json:"coverage_items"`
	GolonganStats     []MonitoringStockGolonganStat  `json:"golongan_stats"`
	GolonganValues    []MonitoringStockGolonganValue `json:"golongan_values"`
	ObservationDays   int                            `json:"observation_days"`
	ObservationPeriod string                         `json:"observation_period"`
}
