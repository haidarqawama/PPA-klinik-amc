package models

type DashboardSummary struct {
	TotalItems        int64   `json:"total_items"`
	TotalStock        int64   `json:"total_stock"`
	LowStockCount     int64   `json:"low_stock_count"`
	ExpiringSoonCount int64   `json:"expiring_soon_count"`
	ExpiredCount      int64   `json:"expired_count"`
	InventoryValue    float64 `json:"inventory_value"`
}

type DashboardDistribution struct {
	Label      string `json:"label"`
	ItemCount  int64  `json:"item_count,omitempty"`
	TotalStock int64  `json:"total_stock"`
}

type DashboardLocation struct {
	Location   string `json:"sslocation"`
	TotalStock int64  `json:"total_stock"`
}

type DashboardStockMovement struct {
	Month        string `json:"month"`
	BarangMasuk  int64  `json:"barang_masuk"`
	BarangKeluar int64  `json:"barang_keluar"`
}

type DashboardResponse struct {
	Summary              DashboardSummary         `json:"summary"`
	GolonganDistribution []DashboardDistribution  `json:"golongan_distribution"`
	LocationStock        []DashboardLocation      `json:"location_stock"`
	StockMovement        []DashboardStockMovement `json:"stock_movement"`
}
