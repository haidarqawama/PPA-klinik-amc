package main

import (
	"backend/config"
	"backend/models"
	"fmt"
	"log"
)

func testStockMovement() {
	var stockMovement []models.DashboardStockMovement

	query := `
        SELECT
            DATE_FORMAT(t.bulan, '%b') AS month,
            CAST(COALESCE(SUM(CASE WHEN t.tipe = 'masuk' THEN t.jumlah ELSE 0 END), 0) AS SIGNED) AS barang_masuk,
            CAST(COALESCE(SUM(CASE WHEN t.tipe = 'keluar' THEN t.jumlah ELSE 0 END), 0) AS SIGNED) AS barang_keluar
        FROM (
            SELECT DATE_FORMAT(data_batch.tgl_beli, '%Y-%m-01') AS bulan, SUM(data_batch.jumlahbeli) AS jumlah, 'masuk' AS tipe
            FROM data_batch
            WHERE data_batch.tgl_beli >= DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 5 MONTH)
            GROUP BY DATE_FORMAT(data_batch.tgl_beli, '%Y-%m-01')
            
            UNION ALL
            
            SELECT DATE_FORMAT(pengeluaran_obat_bhp.tanggal, '%Y-%m-01') AS bulan, SUM(detail_pengeluaran_obat_bhp.jumlah) AS jumlah, 'keluar' AS tipe
            FROM pengeluaran_obat_bhp
            JOIN detail_pengeluaran_obat_bhp ON pengeluaran_obat_bhp.no_keluar = detail_pengeluaran_obat_bhp.no_keluar
            WHERE pengeluaran_obat_bhp.tanggal >= DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 5 MONTH)
            GROUP BY DATE_FORMAT(pengeluaran_obat_bhp.tanggal, '%Y-%m-01')
        ) t
        GROUP BY t.bulan
        ORDER BY t.bulan ASC
        LIMIT 5
    `

	if err := config.SIK.Raw(query).Scan(&stockMovement).Error; err != nil {
		log.Printf("ERROR: %v", err)
		return
	}

	fmt.Printf("Result: %v\n", stockMovement)
	fmt.Printf("Length: %d\n", len(stockMovement))
}
