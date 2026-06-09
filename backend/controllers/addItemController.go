package controllers

import (
	"backend/config"
	"backend/models"
	"fmt"

	"github.com/gin-gonic/gin"
)

func AddItem(c *gin.Context) {

	var item models.LocalItem

	if err := c.ShouldBindJSON(&item); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})
	
		return
	}
	
	// VALIDASI FIELD
	if
		item.NamaBarang == "" ||
		item.Supplier == "" ||
		item.Satuan == "" ||
		item.Golongan == "" ||
		item.Jenis == "" ||
		item.Stok <= 0 {
	
		c.JSON(400, gin.H{
			"error":
			"semua field wajib diisi",
		})
	
		return
	}

	// Generate kode barang otomatis (format Kanza)
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

	fmt.Sscanf(
		last.KodeBrng,
		"B%d",
		&next,
	)

	next++

	item.KodeBarang =
		fmt.Sprintf(
			"B%09d",
			next,
		)

	var supplierExists int64

	config.SIK.
		Table("industrifarmasi").
		Where(
			"kode_industri = ?",
			item.Supplier,
		).
		Count(&supplierExists)
	
	if supplierExists == 0 {
	
		c.JSON(400, gin.H{
			"error":
			"supplier tidak ditemukan",
		})
	
		return
	}

	// Simpan ke SIK
	err :=
		config.SIK.
			Table("databarang").
			Create(
				map[string]interface{}{
					"kode_brng": item.KodeBarang,
					
					"nama_brng": item.NamaBarang,

					"h_beli": item.HargaBeli,

					"dasar": item.HargaBeli,

					// UMUM
					"ralan": item.HargaUmum,
					"kelas1": item.HargaUmum,
					"kelas2": item.HargaUmum,
					"kelas3": item.HargaUmum,
					"jualbebas": item.HargaUmum,
					"karyawan": item.HargaUmum,

					// BPJS
					"utama": item.HargaUtama,

					// BELI LUAR
					"beliluar": item.HargaBeliLuar,

					"expire": item.Expired,

					"kode_sat": item.Satuan,

					"kode_satbesar": item.Satuan,

					"kdjns": item.Jenis,

					"kode_golongan": item.Golongan,

					"kode_kategori": nil,

					"kode_industri": item.Supplier,
				},
			).Error

	if err != nil {

		c.JSON(201, gin.H{
			"message": "barang masuk aplikasi tapi gagal sinkron ke SIK",
			"sik_error": err.Error(),
			"data": item,
		})

		return
	}

	var total int64

	config.SIK.
		Table("barcode_obat").
		Where(
			"barcode = ?",
			item.Barcode,
		).
		Count(&total)

	if total > 0 {

		c.JSON(400, gin.H{
			"error":
			"barcode sudah digunakan",
		})

		return
	}

	if item.Barcode != "" {

		config.SIK.
			Create(
				&models.BarcodeItem{
					KodeBrng:
						item.KodeBarang,
	
					Barcode:
						item.Barcode,
				},
			)
	}

	fmt.Println(
		"STOK:",
		item.Stok,
	)

	// cek apakah sudah ada di gudangbarang
	var count int64

	config.SIK.
		Table("gudangbarang").
		Where(
			"kode_brng = ? AND kd_bangsal = ?",
			item.KodeBarang,
			"AP",
		).
		Count(&count)

	if count > 0 {

		// update stok jika sudah ada
		config.SIK.
			Table("gudangbarang").
			Where(
				"kode_brng = ? AND kd_bangsal = ?",
				item.KodeBarang,
				"AP",
			).
			Update(
				"stok",
				item.Stok,
			)

	} else {

		// insert jika belum ada
		config.SIK.
			Table("gudangbarang").
			Create(
				map[string]interface{}{
					"kode_brng": item.KodeBarang,
					"kd_bangsal": "AP",
					"stok": item.Stok,
				},
			)
	}

	c.JSON(201, gin.H{
		"message": "barang berhasil ditambahkan",
		"data": item,
	})
}