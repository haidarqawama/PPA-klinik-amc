package controllers

import (
	"backend/config"
	"backend/models"
	"github.com/gin-gonic/gin"
)

func GetItems(c *gin.Context) {

	var items []models.Item
	var total int64

	search := c.Query("search")

	config.SIK.
		Table("databarang").
		Count(&total)

	query :=
		config.SIK.
			Table("databarang").
			Select(`
				databarang.kode_brng,
				databarang.nama_brng,
				databarang.stokminimal,
				databarang.expire,
				databarang.h_beli,
				databarang.ralan,
				databarang.utama,
				databarang.beliluar,
				databarang.kode_sat,
				databarang.kode_golongan,

				COALESCE(
					MAX(gudangbarang.stok),
					0
				) as stok,

				industrifarmasi.nama_industri as supplier,
				kodesatuan.satuan as satuan,
				jenis.nama as jenis,
				kategori_barang.nama as kategori,
				golongan_barang.nama as golongan,

				COALESCE(
					barcode_obat.barcode,
					'-'
				) as barcode
			`).
			Joins(`
				LEFT JOIN gudangbarang
				ON databarang.kode_brng = gudangbarang.kode_brng
				AND gudangbarang.kd_bangsal='AP'
			`).
			Joins(`
				LEFT JOIN industrifarmasi
				ON databarang.kode_industri = industrifarmasi.kode_industri
			`).
			Joins(`
				LEFT JOIN kodesatuan
				ON databarang.kode_sat = kodesatuan.kode_sat
			`).
			Joins(`
				LEFT JOIN jenis
				ON databarang.kdjns = jenis.kdjns
			`).
			Joins(`
				LEFT JOIN kategori_barang
				ON databarang.kode_kategori = kategori_barang.kode
			`).
			Joins(`
				LEFT JOIN golongan_barang
				ON databarang.kode_golongan = golongan_barang.kode
			`).
			Joins(`
				LEFT JOIN barcode_obat
				ON databarang.kode_brng = barcode_obat.kode_brng
			`)

	if search != "" {

		query = query.Where(`
			databarang.nama_brng LIKE ?
			OR databarang.kode_brng LIKE ?
			OR barcode_obat.barcode LIKE ?
		`,
			"%"+search+"%",
			"%"+search+"%",
			"%"+search+"%",
		)
	}

	query.
		Group("databarang.kode_brng").
		Order("databarang.kode_brng ASC").
		Find(&items)

	c.JSON(200, gin.H{
		"total": total,
		"data":  items,
	})
}
