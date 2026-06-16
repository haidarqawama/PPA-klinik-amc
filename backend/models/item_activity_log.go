package models

import "time"

type ItemActivityLog struct {
	ID        uint      `gorm:"primaryKey"`
	KodeBrng  string    `gorm:"column:kode_brng;size:15;index"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`
}

func (ItemActivityLog) TableName() string {
	return "item_activity_logs"
}
