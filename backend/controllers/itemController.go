package controllers

import (
	"fmt"
	"backend/config"
	"backend/models"
	"github.com/gin-gonic/gin"
)

func GetItemByKode(c *gin.Context) {

    kode := c.Param("kodeBrng")

    var item models.Item

    err := config.SIK.
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
            databarang.kdjns,
            databarang.kode_industri,

            COALESCE(
                gudangbarang.stok,
                0
            ) as stok,

            industrifarmasi.nama_industri as supplier,
            kodesatuan.satuan as satuan,
            jenis.nama as jenis,
            golongan_barang.nama as golongan,

            COALESCE(
                barcode_obat.barcode,
                ''
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
            LEFT JOIN golongan_barang
            ON databarang.kode_golongan = golongan_barang.kode
        `).
        Joins(`
            LEFT JOIN barcode_obat
            ON databarang.kode_brng = barcode_obat.kode_brng
        `).
        Where("databarang.kode_brng = ?", kode).
        First(&item).Error

    if err != nil {
        c.JSON(404, gin.H{
            "message": "Barang tidak ditemukan",
        })
        return
    }

    c.JSON(200, gin.H{
        "data": item,
    })
}

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
				databarang.dasar,
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

func UpdateItem(c *gin.Context) {

	kodeBrng := c.Param("kodeBrng")

	var item models.LocalItem

	if err := c.ShouldBindJSON(&item); err != nil {

		fmt.Println("BIND ERROR:", err)
	
		c.JSON(400, gin.H{
			"error": err.Error(),
		})
	
		return
	}

	err := config.SIK.
		Table("databarang").
		Where(
			"kode_brng = ?",
			kodeBrng,
		).
		Updates(
			map[string]interface{}{
				"nama_brng":      item.NamaBarang,
				"h_beli":         item.HargaBeli,
				"dasar":          item.HargaBeli,

				// harga umum
				"ralan":          item.HargaUmum,
				"kelas1":         item.HargaUmum,
				"kelas2":         item.HargaUmum,
				"kelas3":         item.HargaUmum,
				"jualbebas":      item.HargaUmum,
				"karyawan":       item.HargaUmum,

				// harga bpjs
				"utama":          item.HargaUtama,

				// harga beli luar
				"beliluar":       item.HargaBeliLuar,

				"expire":         item.Expired,
				"kode_sat":       item.Satuan,
				"kode_satbesar":  item.Satuan,
				"kdjns":          item.Jenis,
				"kode_golongan":  item.Golongan,
				"kode_industri":  item.Supplier,
			},
		).Error

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	// update stok gudang utama
	config.SIK.
		Table("gudangbarang").
		Where(
			"kode_brng = ? AND kd_bangsal = ?",
			kodeBrng,
			"AP",
		).
		Update(
			"stok",
			item.Stok,
		)

	// update barcode
	if item.Barcode != "" {

		var total int64

		config.SIK.
			Table("barcode_obat").
			Where(
				"kode_brng = ?",
				kodeBrng,
			).
			Count(&total)

		if total > 0 {

			config.SIK.
				Table("barcode_obat").
				Where(
					"kode_brng = ?",
					kodeBrng,
				).
				Update(
					"barcode",
					item.Barcode,
				)

		} else {

			config.SIK.
				Create(
					&models.BarcodeItem{
						KodeBrng: kodeBrng,
						Barcode:  item.Barcode,
					},
				)
		}
	}

	c.JSON(200, gin.H{
		"message": "barang berhasil diperbarui",
	})
}

func DeleteItem(c *gin.Context) {

    kode := c.Param("kodeBrng")

    config.SIK.
        Table("barcode_obat").
        Where("kode_brng = ?", kode).
        Delete(nil)

    config.SIK.
        Table("gudangbarang").
        Where("kode_brng = ?", kode).
        Delete(nil)

    err := config.SIK.
        Table("databarang").
        Where("kode_brng = ?", kode).
        Delete(nil).Error

    if err != nil {
        c.JSON(500, gin.H{
            "error": err.Error(),
        })
        return
    }

    c.JSON(200, gin.H{
        "message": "Barang berhasil dihapus",
    })
}
