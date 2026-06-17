package controllers

import (
	"backend/config"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StockOutItem struct {
	KodeBrng  string  `json:"kode_brng" gorm:"column:kode_brng"`
	NamaBrng  string  `json:"nama_brng" gorm:"column:nama_brng"`
	Barcode   string  `json:"barcode" gorm:"column:barcode"`
	Stok      float64 `json:"stok" gorm:"column:stok"`
	SellPrice float64 `json:"sell_price" gorm:"column:sell_price"`
	Satuan    string  `json:"satuan" gorm:"column:satuan"`
	Supplier  string  `json:"supplier" gorm:"column:supplier"`
	Golongan  string  `json:"golongan" gorm:"column:golongan"`
	Jenis     string  `json:"jenis" gorm:"column:jenis"`
	Expire    string  `json:"expire" gorm:"column:expire"`
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
	Destination string  `json:"destination"`
	Note        string  `json:"note"`
}

type StockOutHistorySummary struct {
	TotalQty   float64 `json:"total_qty" gorm:"column:total_qty"`
	TotalValue float64 `json:"total_value" gorm:"column:total_value"`
}

func SearchStockOutItems(c *gin.Context) {
	search := c.Query("search")

	var items []StockOutItem
	query := config.SIK.
		Table("databarang").
		Select(`
			databarang.kode_brng,
			databarang.nama_brng,
			COALESCE(barcode_obat.barcode, '') AS barcode,
			COALESCE(gudangbarang.stok, 0) AS stok,
			COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0) AS sell_price,
			COALESCE(kodesatuan.satuan, databarang.kode_sat, '') AS satuan,
			COALESCE(industrifarmasi.nama_industri, '') AS supplier,
			COALESCE(golongan_barang.nama, '') AS golongan,
			COALESCE(jenis.nama, '') AS jenis,
			COALESCE(DATE_FORMAT(databarang.expire, '%Y-%m-%d'), '') AS expire
		`).
		Joins("LEFT JOIN gudangbarang ON databarang.kode_brng = gudangbarang.kode_brng AND gudangbarang.kd_bangsal = 'AP'").
		Joins("LEFT JOIN barcode_obat ON databarang.kode_brng = barcode_obat.kode_brng").
		Joins("LEFT JOIN kodesatuan ON databarang.kode_sat = kodesatuan.kode_sat").
		Joins("LEFT JOIN industrifarmasi ON databarang.kode_industri = industrifarmasi.kode_industri").
		Joins("LEFT JOIN golongan_barang ON databarang.kode_golongan = golongan_barang.kode").
		Joins("LEFT JOIN jenis ON databarang.kdjns = jenis.kdjns").
		Where("COALESCE(gudangbarang.stok, 0) > 0")

	if search != "" {
		query = query.Where(`
			databarang.kode_brng LIKE ?
			OR databarang.nama_brng LIKE ?
			OR barcode_obat.barcode LIKE ?
		`, "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.
		Order("databarang.nama_brng ASC").
		Limit(20).
		Scan(&items).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mencari barang keluar", "detail": err.Error()})
		return
	}

	c.JSON(200, gin.H{"data": items})
}

func GetRecentStockOut(c *gin.Context) {
	var rows []StockOutHistory

	if err := stockOutHistoryQuery().
		Order("r.tanggal DESC, r.jam DESC").
		Limit(10).
		Scan(&rows).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil riwayat barang keluar", "detail": err.Error()})
		return
	}

	c.JSON(200, gin.H{"data": rows})
}

func GetStockOutHistory(c *gin.Context) {
	search := c.Query("search")
	date := c.Query("date")
	page := 1
	limit := 100

	if rawPage := c.Query("page"); rawPage != "" {
		parsedPage, err := strconv.Atoi(rawPage)
		if err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	if rawLimit := c.Query("limit"); rawLimit != "" {
		parsedLimit, err := strconv.Atoi(rawLimit)
		if err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	query := stockOutHistoryQuery()

	if search != "" {
		likeSearch := "%" + search + "%"
		query = query.Where(`
			r.kode_brng LIKE ?
			OR databarang.nama_brng LIKE ?
			OR barcode_obat.barcode LIKE ?
			OR r.petugas LIKE ?
			OR r.no_faktur LIKE ?
			OR r.keterangan LIKE ?
		`, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch)
	}

	if date != "" {
		query = query.Where("r.tanggal = ?", date)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal menghitung riwayat barang keluar", "detail": err.Error()})
		return
	}

	var summary StockOutHistorySummary
	if err := stockOutHistorySummaryQuery(search, date).Scan(&summary).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal menghitung total riwayat barang keluar", "detail": err.Error()})
		return
	}

	totalPages := 0
	if total > 0 {
		totalPages = int((total + int64(limit) - 1) / int64(limit))
	}

	if totalPages > 0 && page > totalPages {
		page = totalPages
	}

	var rows []StockOutHistory
	if err := query.
		Order("r.tanggal DESC, r.jam DESC").
		Limit(limit).
		Offset((page - 1) * limit).
		Scan(&rows).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil riwayat barang keluar", "detail": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"data":        rows,
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
		"total_qty":   summary.TotalQty,
		"total_value": summary.TotalValue,
	})
}

func AddStockOut(c *gin.Context) {
	var payload StockOutPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if payload.KodeBrng == "" || payload.Qty <= 0 || payload.Destination == "" {
		c.JSON(400, gin.H{"error": "barang, jumlah keluar, dan tujuan wajib diisi"})
		return
	}

	var stokAwal float64
	config.SIK.
		Table("gudangbarang").
		Select("COALESCE(stok, 0)").
		Where("kode_brng = ? AND kd_bangsal = 'AP'", payload.KodeBrng).
		Scan(&stokAwal)

	if stokAwal < payload.Qty {
		c.JSON(400, gin.H{"error": "stok tidak mencukupi"})
		return
	}

	stokAkhir := stokAwal - payload.Qty
	if err := config.SIK.Table("gudangbarang").
		Where("kode_brng = ? AND kd_bangsal = 'AP'", payload.KodeBrng).
		Update("stok", stokAkhir).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal memperbarui stok", "detail": err.Error()})
		return
	}

	now := time.Now()
	if err := config.SIK.Table("riwayat_barang_medis").Create(map[string]interface{}{
		"kode_brng":  payload.KodeBrng,
		"stok_awal":  stokAwal,
		"masuk":      0,
		"keluar":     payload.Qty,
		"stok_akhir": stokAkhir,
		"posisi":     "Barang Keluar",
		"tanggal":    now.Format("2006-01-02"),
		"jam":        now.Format("15:04:05"),
		"petugas":    "Admin Utama",
		"kd_bangsal": "AP",
		"status":     "Simpan",
		"no_faktur":  payload.Destination,
		"keterangan": payload.Note,
	}).Error; err != nil {
		c.JSON(500, gin.H{"error": "Stok berkurang, tapi gagal mencatat riwayat", "detail": err.Error()})
		return
	}

	c.JSON(201, gin.H{
		"message": "barang keluar berhasil diproses",
		"data": gin.H{
			"kode_brng":  payload.KodeBrng,
			"stok_awal":  stokAwal,
			"stok_akhir": stokAkhir,
		},
	})
}

func stockOutHistoryQuery() *gorm.DB {
	return config.SIK.
		Table("riwayat_barang_medis r").
		Select(`
			r.kode_brng,
			COALESCE(databarang.nama_brng, r.kode_brng) AS nama_brng,
			COALESCE(barcode_obat.barcode, '') AS barcode,
			COALESCE(r.keluar, 0) AS qty,
			COALESCE(kodesatuan.satuan, databarang.kode_sat, '') AS unit,
			COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0) AS sell_price,
			COALESCE(r.keluar, 0) * COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0) AS total_revenue,
			COALESCE(DATE_FORMAT(r.tanggal, '%Y-%m-%d'), '') AS date,
			IFNULL(TIME_FORMAT(r.jam, '%H:%i:%s'), '') AS time,
			COALESCE(NULLIF(r.no_faktur, ''), '') AS destination,
			COALESCE(r.petugas, '') AS operator,
			COALESCE(r.keterangan, '') AS note
		`).
		Joins("LEFT JOIN databarang ON r.kode_brng = databarang.kode_brng").
		Joins("LEFT JOIN barcode_obat ON r.kode_brng = barcode_obat.kode_brng").
		Joins("LEFT JOIN kodesatuan ON databarang.kode_sat = kodesatuan.kode_sat").
		Where("r.kd_bangsal = 'AP'").
		Where("COALESCE(r.keluar, 0) > 0")
}

func stockOutHistorySummaryQuery(search string, date string) *gorm.DB {
	query := config.SIK.
		Table("riwayat_barang_medis r").
		Select(`
			COALESCE(SUM(COALESCE(r.keluar, 0)), 0) AS total_qty,
			COALESCE(SUM(COALESCE(r.keluar, 0) * COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0)), 0) AS total_value
		`).
		Joins("LEFT JOIN databarang ON r.kode_brng = databarang.kode_brng").
		Joins("LEFT JOIN barcode_obat ON r.kode_brng = barcode_obat.kode_brng").
		Where("r.kd_bangsal = 'AP'").
		Where("COALESCE(r.keluar, 0) > 0")

	if search != "" {
		likeSearch := "%" + search + "%"
		query = query.Where(`
			r.kode_brng LIKE ?
			OR databarang.nama_brng LIKE ?
			OR barcode_obat.barcode LIKE ?
			OR r.petugas LIKE ?
			OR r.no_faktur LIKE ?
			OR r.keterangan LIKE ?
		`, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch)
	}

	if date != "" {
		query = query.Where("r.tanggal = ?", date)
	}

	return query
}
