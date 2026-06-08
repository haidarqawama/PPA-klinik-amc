package models

type SIKItem struct {
	KodeBrng string `json:"kode_brng"`

	NamaBrng string `json:"nama_brng"`

	Barcode string `json:"barcode"`

	Expire string `json:"expire"`

	HBeli float64 `json:"h_beli"`

	Ralan float64 `json:"ralan"`

	Utama float64 `json:"utama"`

	Beliluar float64 `json:"beliluar"`

	Stok float64 `json:"stok"`

	Supplier string `json:"supplier"`

	Satuan string `json:"satuan"`

	Jenis string `json:"jenis"`

	Kategori string `json:"kategori"`

	Golongan string `json:"golongan"`
}
