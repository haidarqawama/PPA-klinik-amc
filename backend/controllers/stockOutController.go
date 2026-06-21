package controllers

import (
	"backend/config"
	"backend/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SearchStockOutItems(c *gin.Context) {
	search := c.Query("search")

	var items []models.StockOutItem
	query := config.SIK.
		Table("databarang").
		Select(`
			databarang.kode_brng,
			databarang.nama_brng,
			COALESCE(barcode_obat.barcode, '') AS barcode,
			COALESCE(gudang_stock.stok, 0) AS stok,
			EXISTS (
				SELECT 1 FROM data_batch
				WHERE data_batch.kode_brng = databarang.kode_brng
				AND (data_batch.no_batch != '' OR data_batch.no_faktur != '')
			) AS has_batch,
			COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0) AS sell_price,
			COALESCE(databarang.beliluar, 0) AS harga_apotek,
			COALESCE(NULLIF(databarang.ralan, 0), databarang.jualbebas, 0) AS harga_umum,
			COALESCE(databarang.utama, 0) AS harga_utama,
			COALESCE(kodesatuan.satuan, databarang.kode_sat, '') AS satuan,
			COALESCE(industrifarmasi.nama_industri, '') AS supplier,
			COALESCE(golongan_barang.nama, '') AS golongan,
			COALESCE(jenis.nama, '') AS jenis,
			COALESCE(DATE_FORMAT(databarang.expire, '%Y-%m-%d'), '') AS expire
		`).
		Joins("LEFT JOIN (SELECT kode_brng, SUM(COALESCE(stok, 0)) AS stok FROM gudangbarang WHERE kd_bangsal = 'AP' GROUP BY kode_brng) gudang_stock ON databarang.kode_brng = gudang_stock.kode_brng").
		Joins(`LEFT JOIN (
			SELECT kode_brng, barcode
			FROM barcode_obat
			WHERE no_batch = '' AND no_faktur = ''
			UNION
			SELECT kode_brng, barcode FROM (
				SELECT kode_brng, barcode, no_batch, no_faktur,
					ROW_NUMBER() OVER (PARTITION BY kode_brng ORDER BY no_batch DESC) AS rn
				FROM barcode_obat
				WHERE no_batch != '' OR no_faktur != ''
			) ranked WHERE rn = 1
		) barcode_obat ON databarang.kode_brng = barcode_obat.kode_brng`).
		Joins("LEFT JOIN kodesatuan ON databarang.kode_sat = kodesatuan.kode_sat").
		Joins("LEFT JOIN industrifarmasi ON databarang.kode_industri = industrifarmasi.kode_industri").
		Joins("LEFT JOIN golongan_barang ON databarang.kode_golongan = golongan_barang.kode").
		Joins("LEFT JOIN jenis ON databarang.kdjns = jenis.kdjns").
		Where("COALESCE(gudang_stock.stok, 0) > 0")

	if search != "" {
		query = query.Where(`
			databarang.kode_brng LIKE ?
			OR databarang.nama_brng LIKE ?
			OR barcode_obat.barcode LIKE ?
			OR EXISTS (
				SELECT 1
				FROM gudangbarang
				WHERE gudangbarang.kode_brng = databarang.kode_brng
				AND gudangbarang.kd_bangsal = 'AP'
				AND (gudangbarang.no_batch LIKE ? OR gudangbarang.no_faktur LIKE ?)
			)
		`, "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Order("databarang.nama_brng ASC").Limit(20).Scan(&items).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mencari barang keluar", "detail": err.Error()})
		return
	}

	c.JSON(200, gin.H{"data": items})
}

func GetStockOutBatches(c *gin.Context) {
	kodeBrng := c.Query("kode_brng")
	if kodeBrng == "" {
		c.JSON(400, gin.H{"error": "kode barang wajib diisi"})
		return
	}

	var batches []models.StockOutBatchOption
	if err := config.SIK.
		Table("gudangbarang").
		Select(`
			COALESCE(gudangbarang.no_batch, '') AS no_batch,
			COALESCE(gudangbarang.no_faktur, '') AS no_faktur,
			COALESCE(DATE_FORMAT(batch_dates.tgl_kadaluarsa, '%Y-%m-%d'), '') AS expired,
			COALESCE(SUM(gudangbarang.stok), 0) AS sisa,
			COALESCE(databarang.h_beli, 0) AS h_beli,
			COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0) AS sell_price,
			COALESCE(databarang.beliluar, 0) AS harga_apotek,
			COALESCE(NULLIF(databarang.ralan, 0), databarang.jualbebas, 0) AS harga_umum,
			COALESCE(databarang.utama, 0) AS harga_utama,
			COALESCE(DATE_FORMAT(batch_dates.tgl_beli, '%Y-%m-%d'), '') AS tgl_beli
		`).
		Joins("LEFT JOIN databarang ON gudangbarang.kode_brng = databarang.kode_brng").
		Joins(`LEFT JOIN (
			SELECT kode_brng, no_batch, no_faktur, MIN(tgl_beli) AS tgl_beli, MIN(tgl_kadaluarsa) AS tgl_kadaluarsa
			FROM data_batch
			GROUP BY kode_brng, no_batch, no_faktur
		) batch_dates ON gudangbarang.kode_brng = batch_dates.kode_brng AND COALESCE(gudangbarang.no_batch, '') = COALESCE(batch_dates.no_batch, '') AND COALESCE(gudangbarang.no_faktur, '') = COALESCE(batch_dates.no_faktur, '')`).
		Where("gudangbarang.kode_brng = ? AND gudangbarang.kd_bangsal = 'AP'", kodeBrng).
		Group("gudangbarang.kode_brng, gudangbarang.no_batch, gudangbarang.no_faktur, databarang.h_beli, databarang.ralan, databarang.jualbebas, databarang.beliluar, databarang.utama, batch_dates.tgl_beli, batch_dates.tgl_kadaluarsa").
		Having("COALESCE(SUM(gudangbarang.stok), 0) > 0").
		Order("batch_dates.tgl_kadaluarsa ASC, batch_dates.tgl_beli DESC, gudangbarang.no_batch ASC").
		Scan(&batches).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mengambil daftar batch", "detail": err.Error()})
		return
	}

	c.JSON(200, gin.H{"data": batches})
}

func GetRecentStockOut(c *gin.Context) {
	var rows []models.StockOutHistory

	if err := stockOutHistoryQuery().Order("r.tanggal DESC, r.jam DESC").Limit(10).Scan(&rows).Error; err != nil {
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
		if parsedPage, err := strconv.Atoi(rawPage); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	if rawLimit := c.Query("limit"); rawLimit != "" {
		if parsedLimit, err := strconv.Atoi(rawLimit); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
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
	if search == "" {
		// Fast count: no JOINs needed when no search
		countQ := config.SIK.Table("riwayat_barang_medis").
			Where("kd_bangsal = ? AND COALESCE(keluar, 0) > 0", "AP")
		if date != "" {
			countQ = countQ.Where("tanggal = ?", date)
		}
		countQ.Count(&total)
	} else {
		// Count with search: only join tables needed for WHERE filter
		likeSearch := "%" + search + "%"
		countQ := config.SIK.Table("riwayat_barang_medis r").
			Joins("LEFT JOIN databarang ON r.kode_brng = databarang.kode_brng").
			Joins(`LEFT JOIN barcode_obat ON r.kode_brng = barcode_obat.kode_brng AND COALESCE(r.no_batch, '') = barcode_obat.no_batch AND COALESCE(r.no_faktur, '') = barcode_obat.no_faktur`).
			Where("r.kd_bangsal = ? AND COALESCE(r.keluar, 0) > 0", "AP")
		if date != "" {
			countQ = countQ.Where("r.tanggal = ?", date)
		}
		countQ = countQ.Where(`
			r.kode_brng LIKE ?
			OR databarang.nama_brng LIKE ?
			OR barcode_obat.barcode LIKE ?
			OR r.petugas LIKE ?
			OR r.no_faktur LIKE ?
			OR r.keterangan LIKE ?
		`, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch)
		countQ.Count(&total)
	}

	var summary models.StockOutHistorySummary
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

	var rows []models.StockOutHistory
	if err := query.Order("r.tanggal DESC, r.jam DESC").Limit(limit).Offset((page - 1) * limit).Scan(&rows).Error; err != nil {
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
	var payload models.StockOutPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if payload.KodeBrng == "" || payload.Qty <= 0 || payload.Destination == "" {
		c.JSON(400, gin.H{"error": "barang, jumlah keluar, dan tujuan wajib diisi"})
		return
	}

	tx := config.SIK.Begin()
	if tx.Error != nil {
		c.JSON(500, gin.H{"error": "gagal memulai transaksi", "detail": tx.Error.Error()})
		return
	}

	var stokAwal float64
	tx.Table("gudangbarang").Select("COALESCE(stok, 0)").Where("kode_brng = ? AND kd_bangsal = 'AP' AND COALESCE(no_batch, '') = ? AND COALESCE(no_faktur, '') = ?", payload.KodeBrng, payload.NoBatch, payload.NoFaktur).Scan(&stokAwal)
	if stokAwal < payload.Qty {
		tx.Rollback()
		c.JSON(400, gin.H{"error": "stok tidak mencukupi"})
		return
	}

	stokAkhir := stokAwal - payload.Qty
	if err := tx.Table("gudangbarang").Where("kode_brng = ? AND kd_bangsal = 'AP' AND COALESCE(no_batch, '') = ? AND COALESCE(no_faktur, '') = ?", payload.KodeBrng, payload.NoBatch, payload.NoFaktur).Update("stok", stokAkhir).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "Gagal memperbarui stok", "detail": err.Error()})
		return
	}

	now := time.Now()
	if err := tx.Table("riwayat_barang_medis").Create(map[string]interface{}{
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
		"no_batch":   payload.NoBatch,
		"no_faktur":  payload.Destination,
		"keterangan": payload.Note,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "Stok berkurang, tapi gagal mencatat riwayat", "detail": err.Error()})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal menyimpan transaksi barang keluar", "detail": err.Error()})
		return
	}

	c.JSON(201, gin.H{
		"message": "barang keluar berhasil diproses",
		"data": gin.H{
			"kode_brng":  payload.KodeBrng,
			"stok_awal":  stokAwal,
			"stok_akhir": stokAkhir,
			"no_batch":   payload.NoBatch,
			"no_faktur":  payload.NoFaktur,
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
			CASE
				WHEN r.no_faktur = 'Apotek' THEN COALESCE(NULLIF(databarang.beliluar, 0), NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0)
				WHEN r.no_faktur = 'Utama (BPJS)' THEN COALESCE(NULLIF(databarang.utama, 0), NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.beliluar, 0)
				ELSE COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), NULLIF(databarang.beliluar, 0), databarang.utama, 0)
			END AS sell_price,
			COALESCE(r.keluar, 0) * CASE
				WHEN r.no_faktur = 'Apotek' THEN COALESCE(NULLIF(databarang.beliluar, 0), NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0)
				WHEN r.no_faktur = 'Utama (BPJS)' THEN COALESCE(NULLIF(databarang.utama, 0), NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.beliluar, 0)
				ELSE COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), NULLIF(databarang.beliluar, 0), databarang.utama, 0)
			END AS total_revenue,
			COALESCE(DATE_FORMAT(r.tanggal, '%Y-%m-%d'), '') AS date,
			IFNULL(TIME_FORMAT(r.jam, '%H:%i:%s'), '') AS time,
			COALESCE(NULLIF(r.no_faktur, ''), '') AS destination,
			COALESCE(r.petugas, '') AS operator,
			COALESCE(r.keterangan, '') AS note
		`).
		Joins("LEFT JOIN databarang ON r.kode_brng = databarang.kode_brng").
		Joins(`LEFT JOIN barcode_obat ON r.kode_brng = barcode_obat.kode_brng AND COALESCE(r.no_batch, '') = barcode_obat.no_batch AND COALESCE(r.no_faktur, '') = barcode_obat.no_faktur`).
		Joins("LEFT JOIN kodesatuan ON databarang.kode_sat = kodesatuan.kode_sat").
		Where("r.kd_bangsal = 'AP'").
		Where("COALESCE(r.keluar, 0) > 0")
}

func stockOutHistorySummaryQuery(search string, date string) *gorm.DB {
	// Tanpa search, pre-aggregate per (kode_brng, no_faktur) dulu sebelum join databarang.
	// Harga tergantung no_faktur, jadi kita perlu grouping level ini agar bisa menerapkan
	// CASE expression di luar dengan benar. Join barcode_obat juga tidak diperlukan di summary.
	if search == "" {
		subQ := config.SIK.
			Table("riwayat_barang_medis r").
			Select("r.kode_brng, r.no_faktur, SUM(r.keluar) AS total_keluar").
			Where("r.kd_bangsal = 'AP'").
			Where("r.keluar > 0")

		if date != "" {
			subQ = subQ.Where("r.tanggal = ?", date)
		}

		subQ = subQ.Group("r.kode_brng, r.no_faktur")

		return config.SIK.
			Table("(?) AS t", subQ).
			Select(`
				COALESCE(SUM(t.total_keluar), 0) AS total_qty,
				COALESCE(SUM(t.total_keluar * CASE
					WHEN t.no_faktur = 'Apotek' THEN COALESCE(NULLIF(databarang.beliluar, 0), NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0)
					WHEN t.no_faktur = 'Utama (BPJS)' THEN COALESCE(NULLIF(databarang.utama, 0), NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.beliluar, 0)
					ELSE COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), NULLIF(databarang.beliluar, 0), databarang.utama, 0)
				END), 0) AS total_value
			`).
			Joins("LEFT JOIN databarang ON t.kode_brng = databarang.kode_brng")
	}

	// Jika ada search, filter harus diterapkan per baris sebelum aggregate.
	query := config.SIK.
		Table("riwayat_barang_medis r").
		Select(`
			COALESCE(SUM(COALESCE(r.keluar, 0)), 0) AS total_qty,
			COALESCE(SUM(COALESCE(r.keluar, 0) * CASE
				WHEN r.no_faktur = 'Apotek' THEN COALESCE(NULLIF(databarang.beliluar, 0), NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.utama, 0)
				WHEN r.no_faktur = 'Utama (BPJS)' THEN COALESCE(NULLIF(databarang.utama, 0), NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), databarang.beliluar, 0)
				ELSE COALESCE(NULLIF(databarang.ralan, 0), NULLIF(databarang.jualbebas, 0), NULLIF(databarang.beliluar, 0), databarang.utama, 0)
			END), 0) AS total_value
		`).
		Joins("LEFT JOIN databarang ON r.kode_brng = databarang.kode_brng").
		Joins(`LEFT JOIN barcode_obat ON r.kode_brng = barcode_obat.kode_brng AND COALESCE(r.no_batch, '') = barcode_obat.no_batch AND COALESCE(r.no_faktur, '') = barcode_obat.no_faktur`).
		Where("r.kd_bangsal = 'AP'").
		Where("r.keluar > 0")

	likeSearch := "%" + search + "%"
	query = query.Where(`
		r.kode_brng LIKE ?
		OR databarang.nama_brng LIKE ?
		OR barcode_obat.barcode LIKE ?
		OR r.petugas LIKE ?
		OR r.no_faktur LIKE ?
		OR r.keterangan LIKE ?
	`, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch)

	if date != "" {
		query = query.Where("r.tanggal = ?", date)
	}

	return query
}
