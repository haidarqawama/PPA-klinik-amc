package controllers

import (
	"backend/config"
	"backend/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SearchStockInItems(c *gin.Context) {
	search := c.Query("search")

	var items []models.StockInItem
	query := config.SIK.
		Table("databarang").
		Select(`
			databarang.kode_brng,
			databarang.nama_brng,
			COALESCE(barcode_obat.barcode, '') AS barcode,
			COALESCE(gudang_stock.stok, 0) AS stok,
			COALESCE(databarang.h_beli, 0) AS h_beli,
			COALESCE(kodesatuan.satuan, databarang.kode_sat, '') AS satuan,
			COALESCE(industrifarmasi.nama_industri, '') AS supplier,
			COALESCE(golongan_barang.nama, '') AS golongan,
			DATE_FORMAT(databarang.expire, '%Y-%m-%d') AS expire
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
		Joins("LEFT JOIN golongan_barang ON databarang.kode_golongan = golongan_barang.kode")

	if search != "" {
		query = query.Where(`
			databarang.kode_brng LIKE ?
			OR databarang.nama_brng LIKE ?
			OR barcode_obat.barcode LIKE ?
		`, "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Order("databarang.nama_brng ASC").Limit(20).Scan(&items).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal mencari barang", "detail": err.Error()})
		return
	}

	c.JSON(200, gin.H{"data": items})
}

func GetRecentStockIn(c *gin.Context) {
	var rows []models.StockInRecent

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
			AND r.masuk > 0
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
		if parsedPage, err := strconv.Atoi(rawPage); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	if rawLimit := c.Query("limit"); rawLimit != "" {
		if parsedLimit, err := strconv.Atoi(rawLimit); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	var rows []models.StockInHistory

	var total int64
	if search == "" {
		// Fast count: no JOINs needed when no search
		countQ := config.SIK.Table("riwayat_barang_medis").
			Where("kd_bangsal = ? AND masuk > 0", "AP")
		if date != "" {
			countQ = countQ.Where("tanggal = ?", date)
		}
		countQ.Count(&total)
	} else {
		// Count with search: EXISTS avoids row multiplication from JOINs
		likeSearch := "%" + search + "%"
		countQ := config.SIK.Table("riwayat_barang_medis r").
			Where("r.kd_bangsal = ? AND r.masuk > 0", "AP")
		if date != "" {
			countQ = countQ.Where("r.tanggal = ?", date)
		}
		countQ = countQ.Where(`
			r.kode_brng LIKE ?
			OR r.petugas LIKE ?
			OR r.keterangan LIKE ?
			OR EXISTS (SELECT 1 FROM databarang d LEFT JOIN industrifarmasi i ON d.kode_industri = i.kode_industri WHERE d.kode_brng = r.kode_brng AND (d.nama_brng LIKE ? OR i.nama_industri LIKE ?))
			OR EXISTS (SELECT 1 FROM barcode_obat WHERE barcode_obat.kode_brng = r.kode_brng AND COALESCE(r.no_batch, '') = barcode_obat.no_batch AND COALESCE(r.no_faktur, '') = barcode_obat.no_faktur AND barcode_obat.barcode LIKE ?)
		`, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch)
		countQ.Count(&total)
	}

	var summary models.StockInSummary
	if err := stockInHistorySummaryQuery(search, date).Scan(&summary).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal menghitung total riwayat barang masuk", "detail": err.Error()})
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

	selectCols := `
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
		COALESCE(r.keterangan, '') AS note`

	joins := `
		LEFT JOIN databarang ON r.kode_brng = databarang.kode_brng
		LEFT JOIN barcode_obat ON r.kode_brng = barcode_obat.kode_brng AND COALESCE(r.no_batch, '') = barcode_obat.no_batch AND COALESCE(r.no_faktur, '') = barcode_obat.no_faktur
		LEFT JOIN kodesatuan ON databarang.kode_sat = kodesatuan.kode_sat
		LEFT JOIN industrifarmasi ON databarang.kode_industri = industrifarmasi.kode_industri`

	if search == "" {
		// No search: deferred join with covering index. Subquery does backward index
		// scan, checks masuk > 0 from index, stops at 100. No sort, no table lookup.
		baseWhere := "kd_bangsal = 'AP' AND masuk > 0"
		if date != "" {
			baseWhere += " AND tanggal = ?"
		}
		var args []interface{}
		if date != "" {
			args = append(args, date)
		}
		args = append(args, limit, offset)
		if err := config.SIK.Raw(`
			SELECT `+selectCols+`
			FROM (
				SELECT kode_brng, tanggal, jam,
					COALESCE(no_batch, '') AS no_batch,
					COALESCE(no_faktur, '') AS no_faktur
				FROM riwayat_barang_medis
				WHERE `+baseWhere+`
				ORDER BY tanggal DESC, jam DESC
				LIMIT ? OFFSET ?
			) AS k
			JOIN riwayat_barang_medis r
				ON r.kode_brng = k.kode_brng AND r.tanggal = k.tanggal AND r.jam = k.jam
				AND COALESCE(r.no_batch, '') = k.no_batch AND COALESCE(r.no_faktur, '') = k.no_faktur
			`+joins+`
			ORDER BY r.tanggal DESC, r.jam DESC
		`, args...).Scan(&rows).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal mengambil riwayat barang masuk", "detail": err.Error()})
			return
		}
	} else {
		// With search: deferred join + EXISTS for cross-table search.
		// EXISTS avoids row multiplication from barcode_obat JOIN and allows
		// short-circuit OR evaluation. Subquery selects only key columns.
		likeSearch := "%" + search + "%"
		baseWhere := "r.kd_bangsal = 'AP' AND r.masuk > 0"
		var args []interface{}
		if date != "" {
			baseWhere += " AND r.tanggal = ?"
			args = append(args, date)
		}
		searchCond := ` AND (
			r.kode_brng LIKE ?
			OR r.petugas LIKE ?
			OR r.keterangan LIKE ?
			OR EXISTS (SELECT 1 FROM databarang d LEFT JOIN industrifarmasi i ON d.kode_industri = i.kode_industri WHERE d.kode_brng = r.kode_brng AND (d.nama_brng LIKE ? OR i.nama_industri LIKE ?))
			OR EXISTS (SELECT 1 FROM barcode_obat WHERE barcode_obat.kode_brng = r.kode_brng AND COALESCE(r.no_batch, '') = barcode_obat.no_batch AND COALESCE(r.no_faktur, '') = barcode_obat.no_faktur AND barcode_obat.barcode LIKE ?)
		)`
		args = append(args, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch)
		args = append(args, limit, offset)
		if err := config.SIK.Raw(`
			SELECT `+selectCols+`
			FROM (
				SELECT kode_brng, tanggal, jam,
					COALESCE(no_batch, '') AS no_batch,
					COALESCE(no_faktur, '') AS no_faktur
				FROM riwayat_barang_medis r
				WHERE `+baseWhere+searchCond+`
				ORDER BY r.tanggal DESC, r.jam DESC
				LIMIT ? OFFSET ?
			) AS k
			JOIN riwayat_barang_medis r
				ON r.kode_brng = k.kode_brng AND r.tanggal = k.tanggal AND r.jam = k.jam
				AND COALESCE(r.no_batch, '') = k.no_batch AND COALESCE(r.no_faktur, '') = k.no_faktur
			`+joins+`
			ORDER BY r.tanggal DESC, r.jam DESC
		`, args...).Scan(&rows).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal mengambil riwayat barang masuk", "detail": err.Error()})
			return
		}
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

func stockInHistorySummaryQuery(search string, date string) *gorm.DB {
	// No search, no date: read from pre-computed summary table (<1ms)
	if search == "" && date == "" {
		return config.SIK.Table("stock_history_summary").
			Select("total_qty_in AS total_qty, total_value_in AS total_value")
	}

	// Tanpa search, date filter: pre-aggregate per kode_brng sebelum join databarang.
	// Ini mengubah join "satu row per transaksi" menjadi "satu row per barang",
	// drastis mengurangi beban join dan I/O.
	if search == "" {
		subQ := config.SIK.
			Table("riwayat_barang_medis r").
			Select("r.kode_brng, SUM(r.masuk) AS total_masuk").
			Where("r.kd_bangsal = 'AP'").
			Where("r.masuk > 0")

		if date != "" {
			subQ = subQ.Where("r.tanggal = ?", date)
		}

		subQ = subQ.Group("r.kode_brng")

		return config.SIK.
			Table("(?) AS t", subQ).
			Select(`
				COALESCE(SUM(t.total_masuk), 0) AS total_qty,
				COALESCE(SUM(t.total_masuk * COALESCE(databarang.h_beli, 0)), 0) AS total_value
			`).
			Joins("LEFT JOIN databarang ON t.kode_brng = databarang.kode_brng")
	}

	// Jika ada search, filter harus diterapkan per baris sebelum aggregate.
	// EXISTS menggantikan barcode_obat dan industrifarmasi JOIN untuk menghindari
	// row multiplication yang dapat menyebabkan SUM salah.
	query := config.SIK.
		Table("riwayat_barang_medis r").
		Select(`
			COALESCE(SUM(r.masuk), 0) AS total_qty,
			COALESCE(SUM(r.masuk * COALESCE(databarang.h_beli, 0)), 0) AS total_value
		`).
		Joins("LEFT JOIN databarang ON r.kode_brng = databarang.kode_brng").
		Where("r.kd_bangsal = 'AP'").
		Where("r.masuk > 0")

	likeSearch := "%" + search + "%"
	query = query.Where(`
		r.kode_brng LIKE ?
		OR databarang.nama_brng LIKE ?
		OR r.petugas LIKE ?
		OR r.keterangan LIKE ?
		OR EXISTS (SELECT 1 FROM industrifarmasi WHERE industrifarmasi.kode_industri = databarang.kode_industri AND industrifarmasi.nama_industri LIKE ?)
		OR EXISTS (SELECT 1 FROM barcode_obat WHERE barcode_obat.kode_brng = r.kode_brng AND COALESCE(r.no_batch, '') = barcode_obat.no_batch AND COALESCE(r.no_faktur, '') = barcode_obat.no_faktur AND barcode_obat.barcode LIKE ?)
	`, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch, likeSearch)

	if date != "" {
		query = query.Where("r.tanggal = ?", date)
	}

	return query
}

func AddStockIn(c *gin.Context) {
	var payload models.StockInPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if payload.KodeBrng == "" || payload.Qty <= 0 {
		c.JSON(400, gin.H{"error": "barang dan jumlah masuk wajib diisi"})
		return
	}

	now := time.Now()
	tx := config.SIK.Begin()
	if tx.Error != nil {
		c.JSON(500, gin.H{"error": "gagal memulai transaksi", "detail": tx.Error.Error()})
		return
	}

	var stokAwal float64
	tx.Table("gudangbarang").Select("COALESCE(stok, 0)").Where("kode_brng = ? AND kd_bangsal = 'AP' AND no_batch = ? AND no_faktur = ?", payload.KodeBrng, payload.NoBatch, payload.NoFaktur).Scan(&stokAwal)
	stokAkhir := stokAwal + payload.Qty

	var count int64
	tx.Table("gudangbarang").Where("kode_brng = ? AND kd_bangsal = 'AP' AND no_batch = ? AND no_faktur = ?", payload.KodeBrng, payload.NoBatch, payload.NoFaktur).Count(&count)

	if count > 0 {
		if err := tx.Table("gudangbarang").Where("kode_brng = ? AND kd_bangsal = 'AP' AND no_batch = ? AND no_faktur = ?", payload.KodeBrng, payload.NoBatch, payload.NoFaktur).Update("stok", stokAkhir).Error; err != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "Gagal memperbarui stok", "detail": err.Error()})
			return
		}
	} else {
		if err := tx.Table("gudangbarang").Create(map[string]interface{}{"kode_brng": payload.KodeBrng, "kd_bangsal": "AP", "stok": stokAkhir, "no_batch": payload.NoBatch, "no_faktur": payload.NoFaktur}).Error; err != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "Gagal menambahkan stok gudang", "detail": err.Error()})
			return
		}
	}

	if payload.Price > 0 {
		tx.Table("databarang").Where("kode_brng = ?", payload.KodeBrng).Updates(map[string]interface{}{"h_beli": payload.Price, "dasar": payload.Price})
	}

	if payload.Expired != "" {
		tx.Table("databarang").Where("kode_brng = ?", payload.KodeBrng).Update("expire", payload.Expired)
	}

	var prices models.ItemPriceSnapshot
	if err := tx.Table("databarang").
		Select("COALESCE(dasar, 0) AS dasar, COALESCE(h_beli, 0) AS h_beli, COALESCE(ralan, 0) AS ralan, COALESCE(kelas1, 0) AS kelas1, COALESCE(kelas2, 0) AS kelas2, COALESCE(kelas3, 0) AS kelas3, COALESCE(utama, 0) AS utama, COALESCE(vip, 0) AS vip, COALESCE(vvip, 0) AS vvip, COALESCE(beliluar, 0) AS beliluar, COALESCE(jualbebas, 0) AS jualbebas, COALESCE(karyawan, 0) AS karyawan").
		Where("kode_brng = ?", payload.KodeBrng).
		Scan(&prices).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "Gagal mengambil snapshot harga barang", "detail": err.Error()})
		return
	}

	if err := tx.Table("riwayat_barang_medis").Create(map[string]interface{}{
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
		"no_batch":   payload.NoBatch,
		"no_faktur":  payload.NoFaktur,
		"keterangan": payload.Note,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "Stok tersimpan, tapi gagal mencatat riwayat", "detail": err.Error()})
		return
	}

	// Insert into data_batch and barcode_obat only if batch info is provided
	hasBatch := payload.NoBatch != "" || payload.NoFaktur != ""

	if hasBatch {
		var batchCount int64
		tx.Table("data_batch").Where("kode_brng = ? AND no_batch = ? AND no_faktur = ?", payload.KodeBrng, payload.NoBatch, payload.NoFaktur).Count(&batchCount)

		var existingBatch struct {
			JumlahBeli float64 `gorm:"column:jumlahbeli"`
		}
		if batchCount > 0 {
			tx.Table("data_batch").
				Select("COALESCE(jumlahbeli, 0) AS jumlahbeli").
				Where("kode_brng = ? AND no_batch = ? AND no_faktur = ?", payload.KodeBrng, payload.NoBatch, payload.NoFaktur).
				Scan(&existingBatch)
		}

		jumlahBeli := payload.Qty
		if batchCount > 0 {
			jumlahBeli = existingBatch.JumlahBeli + payload.Qty
		}

		batchData := map[string]interface{}{
			"kode_brng":      payload.KodeBrng,
			"tgl_beli":       payload.TanggalPembelian,
			"tgl_kadaluarsa": payload.Expired,
			"asal":           "Penerimaan",
			"no_faktur":      payload.NoFaktur,
			"jumlahbeli":     jumlahBeli,
			"sisa":           stokAkhir,
			"dasar":          prices.Dasar,
			"h_beli":         prices.HBeli,
			"ralan":          prices.Ralan,
			"kelas1":         prices.Kelas1,
			"kelas2":         prices.Kelas2,
			"kelas3":         prices.Kelas3,
			"utama":          prices.Utama,
			"vip":            prices.Vip,
			"vvip":           prices.Vvip,
			"beliluar":       prices.Beliluar,
			"jualbebas":      prices.Jualbebas,
			"karyawan":       prices.Karyawan,
		}

		if batchCount > 0 {
			if err := tx.Table("data_batch").Where("kode_brng = ? AND no_batch = ? AND no_faktur = ?", payload.KodeBrng, payload.NoBatch, payload.NoFaktur).Updates(batchData).Error; err != nil {
				tx.Rollback()
				c.JSON(500, gin.H{"error": "Gagal memperbarui data batch", "detail": err.Error()})
				return
			}
		} else {
			batchData["no_batch"] = payload.NoBatch
			if err := tx.Table("data_batch").Create(batchData).Error; err != nil {
				tx.Rollback()
				c.JSON(500, gin.H{"error": "Gagal menyimpan data batch", "detail": err.Error()})
				return
			}
		}
	}

	// Insert barcode if provided
	if payload.Barcode != "" {
		var existingBarcode models.BarcodeItem
		result := tx.Where("kode_brng = ? AND no_batch = ? AND no_faktur = ?",
			payload.KodeBrng, payload.NoBatch, payload.NoFaktur).First(&existingBarcode)

		barcodeItem := models.BarcodeItem{
			KodeBrng: payload.KodeBrng,
			NoBatch:  payload.NoBatch,
			NoFaktur: payload.NoFaktur,
			Barcode:  payload.Barcode,
		}

		if result.Error == nil {
			// Barcode exists for this batch, update it
			tx.Model(&existingBarcode).Update("barcode", payload.Barcode)
		} else {
			// No barcode for this batch, insert new
			tx.Create(&barcodeItem)
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal menyimpan transaksi barang masuk", "detail": err.Error()})
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
