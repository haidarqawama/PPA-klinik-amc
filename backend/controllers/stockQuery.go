package controllers

// Total stok per barang: jumlah semua batch di gudang AP, minimum 0.
// Batch dengan stok negatif (oversell di SIMRS) tidak membuat tampilan minus.
const gudangAPStockJoin = `
	LEFT JOIN (
		SELECT
			kode_brng,
			SUM(stok) AS total_stok
		FROM gudangbarang
		WHERE kd_bangsal = 'AP' AND stok > 0
		GROUP BY kode_brng
	) gudang_stok ON databarang.kode_brng = gudang_stok.kode_brng
`
