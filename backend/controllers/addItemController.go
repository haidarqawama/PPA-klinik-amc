package controllers

import (
	"backend/config"
	"backend/models"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

type itemPriceSnapshot struct {
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

func AddItem(c *gin.Context) {
	var item models.LocalItem

	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if item.NamaBarang == "" || item.Supplier == "" || item.Satuan == "" || item.Golongan == "" || item.Jenis == "" || item.NoBatch == "" || item.NoFaktur == "" || item.TanggalPembelian == "" || item.Stok <= 0 {
		c.JSON(400, gin.H{"error": "semua field wajib diisi termasuk no. batch, no. faktur, dan tanggal pembelian"})
		return
	}

	var last struct {
		KodeBrng string
	}

	config.SIK.
		Table("databarang").
		Select("kode_brng").
		Order("CAST(SUBSTRING(kode_brng,2) AS UNSIGNED) DESC").
		Limit(1).
		Scan(&last)

	var next int
	fmt.Sscanf(last.KodeBrng, "B%d", &next)
	next++

	item.KodeBarang = fmt.Sprintf("B%09d", next)

	var supplierExists int64
	config.SIK.
		Table("industrifarmasi").
		Where("kode_industri = ?", item.Supplier).
		Count(&supplierExists)

	if supplierExists == 0 {
		c.JSON(400, gin.H{"error": "supplier tidak ditemukan"})
		return
	}

	var barcodeCount int64
	if item.Barcode != "" {
		config.SIK.
			Table("barcode_obat").
			Where("barcode = ?", item.Barcode).
			Count(&barcodeCount)

		if barcodeCount > 0 {
			c.JSON(400, gin.H{"error": "barcode sudah digunakan"})
			return
		}
	}

	tx := config.SIK.Begin()
	if tx.Error != nil {
		c.JSON(500, gin.H{"error": "gagal memulai transaksi", "detail": tx.Error.Error()})
		return
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	err := tx.
		Table("databarang").
		Create(map[string]interface{}{
			"kode_brng":     item.KodeBarang,
			"nama_brng":     item.NamaBarang,
			"h_beli":        item.HargaBeli,
			"dasar":         item.HargaBeli,
			"ralan":         item.HargaUmum,
			"kelas1":        item.HargaUmum,
			"kelas2":        item.HargaUmum,
			"kelas3":        item.HargaUmum,
			"jualbebas":     item.HargaUmum,
			"karyawan":      item.HargaUmum,
			"utama":         item.HargaUtama,
			"beliluar":      item.HargaBeliLuar,
			"expire":        item.Expired,
			"kode_sat":      item.Satuan,
			"kode_satbesar": item.Satuan,
			"kdjns":         item.Jenis,
			"kode_golongan": item.Golongan,
			"kode_kategori": nil,
			"kode_industri": item.Supplier,
		}).Error

	if err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "gagal menambahkan barang ke databarang", "detail": err.Error()})
		return
	}

	if item.Barcode != "" {
		if err := tx.Create(&models.BarcodeItem{KodeBrng: item.KodeBarang, Barcode: item.Barcode}).Error; err != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "gagal menyimpan barcode", "detail": err.Error()})
			return
		}
	}

	if err := tx.Table("gudangbarang").Create(map[string]interface{}{
		"kode_brng":  item.KodeBarang,
		"kd_bangsal": "AP",
		"stok":       item.Stok,
		"no_batch":   item.NoBatch,
		"no_faktur":  item.NoFaktur,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "gagal menambahkan stok gudang", "detail": err.Error()})
		return
	}

	var prices itemPriceSnapshot
	if err := tx.Table("databarang").
		Select("COALESCE(dasar, 0) AS dasar, COALESCE(h_beli, 0) AS h_beli, COALESCE(ralan, 0) AS ralan, COALESCE(kelas1, 0) AS kelas1, COALESCE(kelas2, 0) AS kelas2, COALESCE(kelas3, 0) AS kelas3, COALESCE(utama, 0) AS utama, COALESCE(vip, 0) AS vip, COALESCE(vvip, 0) AS vvip, COALESCE(beliluar, 0) AS beliluar, COALESCE(jualbebas, 0) AS jualbebas, COALESCE(karyawan, 0) AS karyawan").
		Where("kode_brng = ?", item.KodeBarang).
		Scan(&prices).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "gagal mengambil snapshot harga barang", "detail": err.Error()})
		return
	}

	expiredDate := ""
	if item.Expired != nil {
		expiredDate = item.Expired.Format("2006-01-02")
	}

	if err := tx.Table("data_batch").Create(map[string]interface{}{
		"no_batch":       item.NoBatch,
		"kode_brng":      item.KodeBarang,
		"tgl_beli":       item.TanggalPembelian,
		"tgl_kadaluarsa": expiredDate,
		"asal":           "Penerimaan",
		"no_faktur":      item.NoFaktur,
		"jumlahbeli":     item.Stok,
		"sisa":           item.Stok,
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
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "gagal menyimpan data batch", "detail": err.Error()})
		return
	}

	now := time.Now()
	if err := tx.Table("riwayat_barang_medis").Create(map[string]interface{}{
		"kode_brng":  item.KodeBarang,
		"stok_awal":  0,
		"masuk":      item.Stok,
		"keluar":     0,
		"stok_akhir": item.Stok,
		"posisi":     "Barang Baru",
		"tanggal":    now.Format("2006-01-02"),
		"jam":        now.Format("15:04:05"),
		"petugas":    "Admin Utama",
		"kd_bangsal": "AP",
		"status":     "Simpan",
		"no_batch":   item.NoBatch,
		"no_faktur":  item.NoFaktur,
		"keterangan": "Tambah barang baru",
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "gagal mencatat riwayat barang baru", "detail": err.Error()})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(500, gin.H{"error": "gagal menyimpan transaksi barang baru", "detail": err.Error()})
		return
	}

	c.JSON(201, gin.H{
		"message": "barang berhasil ditambahkan",
		"data":    item,
	})
}
