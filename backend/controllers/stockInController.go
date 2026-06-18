package controllers

import (
	"backend/config"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

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

type StockInPayload struct {
	KodeBrng string  `json:"kode_brng"`
	Qty      float64 `json:"qty"`
	Price    float64 `json:"price"`
	Expired  string  `json:"expired"`
	Note     string  `json:"note"`
}

func SearchStockInItems(c *gin.Context) {
	search := c.Query("search")

	var items []StockInItem
	query := config.SIK.
		Table("databarang").
		Select(`
			databarang.kode_brng,
			databarang.nama_brng,
			COALESCE(barcode_obat.barcode, '') AS barcode,
			COALESCE(gudangbarang.stok, 0) AS stok,
			COALESCE(databarang.h_beli, 0) AS h_beli,
			COALESCE(kodesatuan.satuan, databarang.kode_sat, '') AS satuan,
			COALESCE(industrifarmasi.nama_industri, '') AS supplier,
			COALESCE(golongan_barang.nama, '') AS golongan,
			DATE_FORMAT(databarang.expire, '%Y-%m-%d') AS expire
		`).
		Joins("LEFT JOIN gudangbarang ON databarang.kode_brng = gudangbarang.kode_brng AND gudangbarang.kd_bangsal = 'AP'").
		Joins("LEFT JOIN barcode_obat ON databarang.kode_brng = barcode_obat.kode_brng").
		Joins("LEFT JOIN kodesatuan ON databarang.kode_sat = kodesatuan.kode_sat").
		Joins("LEFT JOIN industrifarmasi ON databarang.kode_industri = industrifarmasi.kode_industri").
		Joins("LEFT JOIN golongan_barang ON databarang.kode_golongan = golongan_barang.kode")

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
		c.JSON(500, gin.H{"error": "Gagal mencari barang", "detail": err.Error()})
		return
	}

	c.JSON(200, gin.H{"data": items})
}

func GetRecentStockIn(c *gin.Context) {
	var rows []StockInRecent

	if err := config.SIK.Raw(`
		SELECT
			r.kode_brng,
			COALESCE(databarang.nama_brng, r.kode_brng) AS nama_brng,
			COALESCE(r.masuk, 0) AS qty,
			COALESCE(databarang.h_beli, 0) AS price,
			DATE_FORMAT(r.tanggal, '%Y-%m-%d') AS date,
			IFNULL(TIME_FORMAT(r.jam, '%H:%i:%s'), '') AS time,
			COALESCE(industrifarmasi.nama_industri, '') AS supplier,
			COALESCE(r.keterangan, '') AS note
		FROM riwayat_barang_medis r
		LEFT JOIN databarang ON r.kode_brng = databarang.kode_brng
		LEFT JOIN industrifarmasi ON databarang.kode_industri = industrifarmasi.kode_industri
		WHERE r.kd_bangsal = 'AP'
			AND COALESCE(r.masuk, 0) > 0
		ORDER BY r.tanggal DESC, r.jam DESC
		LIMIT 10
	`).Scan(&rows).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil riwayat barang masuk", "detail": err.Error()})
		return
	}

	c.JSON(200, gin.H{"data": rows})
}

func GetStockInHistory(c *gin.Context) {
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

	var rows []StockInHistory
	query := config.SIK.
		Table("riwayat_barang_medis r").
		Select(`
			r.kode_brng,
			COALESCE(databarang.nama_brng, r.kode_brng) AS nama_brng,
			COALESCE(barcode_obat.barcode, '') AS barcode,
			COALESCE(r.masuk, 0) AS qty,
			COALESCE(kodesatuan.satuan, databarang.kode_sat, '') AS unit,
			COALESCE(databarang.h_beli, 0) AS buy_price,
			COALESCE(r.masuk, 0) * COALESCE(databarang.h_beli, 0) AS total_cost,
			COALESCE(DATE_FORMAT(databarang.expire, '%Y-%m-%d'), '') AS expired,
			COALESCE(DATE_FORMAT(r.tanggal, '%Y-%m-%d'), '') AS date,
			IFNULL(TIME_FORMAT(r.jam, '%H:%i:%s'), '') AS time,
			COALESCE(industrifarmasi.nama_industri, '') AS supplier,
			COALESCE(r.petugas, '') AS operator,
			COALESCE(r.keterangan, '') AS note
		`).
		Joins("LEFT JOIN databarang ON r.kode_brng = databarang.kode_brng").
		Joins("LEFT JOIN barcode_obat ON r.kode_brng = barcode_obat.kode_brng").
		Joins("LEFT JOIN kodesatuan ON databarang.kode_sat = kodesatuan.kode_sat").
		Joins("LEFT JOIN industrifarmasi ON databarang.kode_industri = industrifarmasi.kode_industri").
		Where("r.kd_bangsal = 'AP'").
		Where("COALESCE(r.masuk, 0) > 0")

	if search != "" {
		likeSearch := "%" + search + "%"
		query = query.Where(`
			r.kode_brng LIKE ?
			OR databarang.nama_brng LIKE ?
			OR barcode_obat.barcode LIKE ?
			OR r.petugas LIKE ?
			OR industrifarmasi.nama_industri LIKE ?
			OR r.keterangan LIKE ?
		`, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch)
	}

	if date != "" {
		query = query.Where("r.tanggal = ?", date)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal menghitung riwayat barang masuk", "detail": err.Error()})
		return
	}

	totalPages := 0
	if total > 0 {
		totalPages = int((total + int64(limit) - 1) / int64(limit))
	}

	if totalPages > 0 && page > totalPages {
		page = totalPages
	}

	offset := (page - 1) * limit

	if err := query.
		Order("r.tanggal DESC, r.jam DESC").
		Limit(limit).
		Offset(offset).
		Scan(&rows).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil riwayat barang masuk", "detail": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"data":        rows,
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
	})
}

func AddStockIn(c *gin.Context) {
	var payload StockInPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if payload.KodeBrng == "" || payload.Qty <= 0 {
		c.JSON(400, gin.H{"error": "barang dan jumlah masuk wajib diisi"})
		return
	}

	var stokAwal float64
	config.SIK.
		Table("gudangbarang").
		Select("COALESCE(stok, 0)").
		Where("kode_brng = ? AND kd_bangsal = 'AP'", payload.KodeBrng).
		Scan(&stokAwal)

	stokAkhir := stokAwal + payload.Qty
	var count int64
	config.SIK.Table("gudangbarang").
		Where("kode_brng = ? AND kd_bangsal = 'AP'", payload.KodeBrng).
		Count(&count)

	if count > 0 {
		if err := config.SIK.Table("gudangbarang").
			Where("kode_brng = ? AND kd_bangsal = 'AP'", payload.KodeBrng).
			Update("stok", stokAkhir).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal memperbarui stok", "detail": err.Error()})
			return
		}
	} else {
		if err := config.SIK.Table("gudangbarang").Create(map[string]interface{}{
			"kode_brng":  payload.KodeBrng,
			"kd_bangsal": "AP",
			"stok":       stokAkhir,
		}).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal menambahkan stok gudang", "detail": err.Error()})
			return
		}
	}

	if payload.Price > 0 {
		config.SIK.Table("databarang").
			Where("kode_brng = ?", payload.KodeBrng).
			Updates(map[string]interface{}{
				"h_beli": payload.Price,
				"dasar":  payload.Price,
			})
	}

	if payload.Expired != "" {
		config.SIK.Table("databarang").
			Where("kode_brng = ?", payload.KodeBrng).
			Update("expire", payload.Expired)
	}

	now := time.Now()
	if err := config.SIK.Table("riwayat_barang_medis").Create(map[string]interface{}{
		"kode_brng":  payload.KodeBrng,
		"stok_awal":  stokAwal,
		"masuk":      payload.Qty,
		"keluar":     0,
		"stok_akhir": stokAkhir,
		"posisi":     "Barang Masuk",
		"tanggal":    now.Format("2006-01-02"),
		"jam":        now.Format("15:04:05"),
		"petugas":    "Admin Utama",
		"kd_bangsal": "AP",
		"status":     "Simpan",
		"keterangan": payload.Note,
	}).Error; err != nil {
		c.JSON(500, gin.H{"error": "Stok tersimpan, tapi gagal mencatat riwayat", "detail": err.Error()})
		return
	}

	c.JSON(201, gin.H{
		"message": "barang masuk berhasil diproses",
		"data": gin.H{
			"kode_brng":  payload.KodeBrng,
			"stok_awal":  stokAwal,
			"stok_akhir": stokAkhir,
		},
	})
}
