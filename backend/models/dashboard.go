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
	BarangMasuk  float64  `json:"barang_masuk"`
	BarangKeluar float64  `json:"barang_keluar"`
}

type DashboardRecentActivity struct {
	ID           int64  `json:"id"`
	Type         string `json:"type" gorm:"column:activity_type"`
	KodeBrng     string `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng     string `json:"nama_brng" gorm:"column:nama_brng"`
	Qty          int64  `json:"qty" gorm:"column:qty"`
	ActivityDate string `json:"activity_date" gorm:"column:activity_date"`
	ActivityTime string `json:"activity_time" gorm:"column:activity_time"`
	ReferenceNo  string `json:"reference_no" gorm:"column:reference_no"`
}

type DashboardResponse struct {
	Summary              DashboardSummary          `json:"summary"`
	GolonganDistribution []DashboardDistribution   `json:"golongan_distribution"`
	LocationStock        []DashboardLocation       `json:"location_stock"`
	StockMovement        []DashboardStockMovement  `json:"stock_movement"`
	RecentActivities     []DashboardRecentActivity `json:"recent_activities"`
}
