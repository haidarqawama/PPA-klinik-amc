package controllers

import (
	"backend/config"
	"backend/models"
	"fmt"

	"github.com/gin-gonic/gin"
)

const latestBatchJoin = `
	LEFT JOIN (
		SELECT
			data_batch.kode_brng,
			SUBSTRING_INDEX(GROUP_CONCAT(data_batch.no_batch ORDER BY data_batch.tgl_beli DESC, data_batch.no_batch DESC SEPARATOR '||'), '||', 1) AS no_batch,
			SUBSTRING_INDEX(GROUP_CONCAT(data_batch.no_faktur ORDER BY data_batch.tgl_beli DESC, data_batch.no_batch DESC SEPARATOR '||'), '||', 1) AS no_faktur
		FROM data_batch
		GROUP BY data_batch.kode_brng
	) latest_batch ON databarang.kode_brng = latest_batch.kode_brng
`

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
			COALESCE(gudangbarang.stok, 0) AS stok,
			industrifarmasi.nama_industri AS supplier,
			kodesatuan.satuan AS satuan,
			jenis.nama AS jenis,
			golongan_barang.nama AS golongan,
			COALESCE(barcode_barang.barcode, '') AS barcode,
			latest_batch.no_batch,
			latest_batch.no_faktur
		`).
		Joins(`
			LEFT JOIN (
				SELECT kode_brng, SUM(COALESCE(stok, 0)) AS stok
				FROM gudangbarang
				WHERE kd_bangsal = 'AP'
				GROUP BY kode_brng
			) gudangbarang
			ON databarang.kode_brng = gudangbarang.kode_brng
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
			LEFT JOIN (
				SELECT
					kode_brng,
					MIN(barcode) AS barcode
				FROM barcode_obat
				GROUP BY kode_brng
			) barcode_barang
			ON databarang.kode_brng = barcode_barang.kode_brng
		`).
		Joins(latestBatchJoin).
		Where("databarang.kode_brng = ?", kode).
		First(&item).Error

	if err != nil {
		c.JSON(404, gin.H{"message": "Barang tidak ditemukan"})
		return
	}

	c.JSON(200, gin.H{"data": item})
}

func GetItems(c *gin.Context) {
	var items []models.Item
	var total int64

	search := c.Query("search")

	config.SIK.Raw(`
		SELECT COUNT(1)
		FROM (
			SELECT kode_brng, no_batch, no_faktur
			FROM gudangbarang
			WHERE kd_bangsal = 'AP'
			GROUP BY kode_brng, no_batch, no_faktur
		) inventory_batch
	`).Scan(&total)

	query := config.SIK.
		Table("databarang").
		Select(`
			databarang.kode_brng,
			databarang.nama_brng,
			databarang.stokminimal,

			COALESCE(
				DATE_FORMAT(batch_dates.tgl_kadaluarsa,'%Y-%m-%d'),
				DATE_FORMAT(databarang.expire,'%Y-%m-%d')
			) AS expire,

			COALESCE(databarang.dasar,0) AS dasar,
			COALESCE(databarang.h_beli,0) AS h_beli,
			COALESCE(databarang.ralan,0) AS ralan,
			COALESCE(databarang.utama,0) AS utama,
			COALESCE(databarang.beliluar,0) AS beliluar,

			databarang.kode_sat,
			databarang.kode_golongan,

			COALESCE(gudang_inventory.stok,0) AS stok,

			industrifarmasi.nama_industri AS supplier,
			kodesatuan.satuan AS satuan,
			jenis.nama AS jenis,
			kategori_barang.nama AS kategori,
			golongan_barang.nama AS golongan,

			COALESCE(barcode_barang.barcode,'') AS barcode,

			gudang_inventory.no_batch,
			gudang_inventory.no_faktur,
			DATE_FORMAT(batch_dates.tgl_beli,'%Y-%m-%d') AS tgl_beli,
			DATE_FORMAT(batch_dates.tgl_kadaluarsa,'%Y-%m-%d') AS tgl_kadaluarsa
		`).
		Joins(`
			INNER JOIN (
				SELECT
					kode_brng,
					COALESCE(no_batch, '') AS no_batch,
					COALESCE(no_faktur, '') AS no_faktur,
					SUM(COALESCE(stok, 0)) AS stok
				FROM gudangbarang
				WHERE kd_bangsal = 'AP'
				GROUP BY kode_brng, no_batch, no_faktur
			) gudang_inventory
			ON databarang.kode_brng = gudang_inventory.kode_brng
		`).
		Joins(`
			LEFT JOIN (
				SELECT kode_brng, no_batch, no_faktur, MIN(tgl_beli) AS tgl_beli, MIN(tgl_kadaluarsa) AS tgl_kadaluarsa
				FROM data_batch
				GROUP BY kode_brng, no_batch, no_faktur
			) batch_dates
			ON gudang_inventory.kode_brng = batch_dates.kode_brng
			AND gudang_inventory.no_batch = COALESCE(batch_dates.no_batch, '')
			AND gudang_inventory.no_faktur = COALESCE(batch_dates.no_faktur, '')
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
			LEFT JOIN (
				SELECT kode_brng, MIN(barcode) AS barcode
				FROM barcode_obat
				GROUP BY kode_brng
			) barcode_barang
			ON databarang.kode_brng = barcode_barang.kode_brng
		`)

	if search != "" {
		query = query.Where(`
			databarang.nama_brng LIKE ?
			OR databarang.kode_brng LIKE ?
			OR barcode_barang.barcode LIKE ?
			OR gudang_inventory.no_batch LIKE ?
			OR gudang_inventory.no_faktur LIKE ?
		`, "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	query.Order("databarang.kode_brng ASC, batch_dates.tgl_beli DESC, gudang_inventory.no_batch ASC").Scan(&items)

	c.JSON(200, gin.H{"total": total, "data": items})
}

func UpdateItem(c *gin.Context) {
	kodeBrng := c.Param("kodeBrng")

	var item models.LocalItem
	if err := c.ShouldBindJSON(&item); err != nil {
		fmt.Println("BIND ERROR:", err)
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	err := config.SIK.
		Table("databarang").
		Where("kode_brng = ?", kodeBrng).
		Updates(map[string]interface{}{
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
			"kode_industri": item.Supplier,
		}).Error

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if item.Barcode != "" {
		var total int64
		config.SIK.Table("barcode_obat").Where("kode_brng = ?", kodeBrng).Count(&total)

		if total > 0 {
			config.SIK.Table("barcode_obat").Where("kode_brng = ?", kodeBrng).Update("barcode", item.Barcode)
		} else {
			config.SIK.Create(&models.BarcodeItem{KodeBrng: kodeBrng, Barcode: item.Barcode})
		}
	}

	c.JSON(200, gin.H{"message": "barang berhasil diperbarui"})
}

func DeleteItem(c *gin.Context) {
	kode := c.Param("kodeBrng")

	config.SIK.Table("barcode_obat").Where("kode_brng = ?", kode).Delete(nil)
	config.SIK.Table("gudangbarang").Where("kode_brng = ?", kode).Delete(nil)
	config.SIK.Table("data_batch").Where("kode_brng = ?", kode).Delete(nil)

	err := config.SIK.Table("databarang").Where("kode_brng = ?", kode).Delete(nil).Error
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Barang berhasil dihapus"})
}
