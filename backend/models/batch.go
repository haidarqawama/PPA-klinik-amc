package models

type DataBatch struct {
	NoBatch       string  `json:"no_batch" gorm:"column:no_batch"`
	KodeBrng      string  `json:"kode_brng" gorm:"column:kode_brng"`
	TglBeli       string  `json:"tgl_beli" gorm:"column:tgl_beli"`
	TglKadaluarsa string  `json:"tgl_kadaluarsa" gorm:"column:tgl_kadaluarsa"`
	Asal          string  `json:"asal" gorm:"column:asal"`
	NoFaktur      string  `json:"no_faktur" gorm:"column:no_faktur"`
	Dasar         float64 `json:"dasar" gorm:"column:dasar"`
	HBeli         float64 `json:"h_beli" gorm:"column:h_beli"`
	Ralan         float64 `json:"ralan" gorm:"column:ralan"`
	Kelas1        float64 `json:"kelas1" gorm:"column:kelas1"`
	Kelas2        float64 `json:"kelas2" gorm:"column:kelas2"`
	Kelas3        float64 `json:"kelas3" gorm:"column:kelas3"`
	Utama         float64 `json:"utama" gorm:"column:utama"`
	Vip           float64 `json:"vip" gorm:"column:vip"`
	Vvip          float64 `json:"vvip" gorm:"column:vvip"`
	Beliluar      float64 `json:"beliluar" gorm:"column:beliluar"`
	Jualbebas     float64 `json:"jualbebas" gorm:"column:jualbebas"`
	Karyawan      float64 `json:"karyawan" gorm:"column:karyawan"`
	JumlahBeli    float64 `json:"jumlahbeli" gorm:"column:jumlahbeli"`
	Sisa          float64 `json:"sisa" gorm:"column:sisa"`
}

func (DataBatch) TableName() string {
	return "data_batch"
}
