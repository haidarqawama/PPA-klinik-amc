package controllers

import (
	"backend/config"
	"backend/models"
	"strings"

	"github.com/gin-gonic/gin"
)

type masterPayload struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

type masterTableConfig struct {
	Table      string
	CodeCol    string
	NameCol    string
	EntityName string
}

func getMasterTableConfig(masterType string) (masterTableConfig, bool) {
	switch strings.ToLower(masterType) {
	case "golongan":
		return masterTableConfig{
			Table:      "golongan_barang",
			CodeCol:    "kode",
			NameCol:    "nama",
			EntityName: "golongan",
		}, true
	case "jenis":
		return masterTableConfig{
			Table:      "jenis",
			CodeCol:    "kdjns",
			NameCol:    "nama",
			EntityName: "jenis",
		}, true
	case "satuan":
		return masterTableConfig{
			Table:      "kodesatuan",
			CodeCol:    "kode_sat",
			NameCol:    "satuan",
			EntityName: "satuan",
		}, true
	default:
		return masterTableConfig{}, false
	}
}

func GetMasters(c *gin.Context) {

	var satuan []map[string]interface{}
	var jenis []map[string]interface{}
	var golongan []map[string]interface{}
	var suppliers []models.Supplier

	config.SIK.
		Table("industrifarmasi").
		Find(&suppliers)

	config.SIK.
		Table("kodesatuan").
		Select(`
			kode_sat,
			satuan
		`).
		Order("satuan").
		Find(&satuan)

	config.SIK.
		Table("jenis").
		Select(`
			kdjns,
			nama
		`).
		Order("nama").
		Find(&jenis)

	config.SIK.
		Table("golongan_barang").
		Select(`
			kode,
			nama
		`).
		Order("nama").
		Find(&golongan)

	c.JSON(200, gin.H{
		"golongan":  golongan,
		"jenis":     jenis,
		"satuan":    satuan,
		"suppliers": suppliers,
	})
}

func AddMaster(c *gin.Context) {
	cfg, ok := getMasterTableConfig(c.Param("type"))
	if !ok {
		c.JSON(400, gin.H{"error": "tipe master tidak valid"})
		return
	}

	var payload masterPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	payload.Code = strings.TrimSpace(payload.Code)
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Code == "" || payload.Name == "" {
		c.JSON(400, gin.H{"error": "kode dan nama wajib diisi"})
		return
	}

	var total int64
	config.SIK.
		Table(cfg.Table).
		Where(cfg.CodeCol+" = ?", payload.Code).
		Count(&total)

	if total > 0 {
		c.JSON(400, gin.H{"error": "kode sudah digunakan"})
		return
	}

	if err := config.SIK.
		Table(cfg.Table).
		Create(map[string]interface{}{
			cfg.CodeCol: payload.Code,
			cfg.NameCol: payload.Name,
		}).Error; err != nil {
		c.JSON(500, gin.H{"error": "gagal menambahkan " + cfg.EntityName, "detail": err.Error()})
		return
	}

	c.JSON(201, gin.H{"message": cfg.EntityName + " berhasil ditambahkan"})
}

func UpdateMaster(c *gin.Context) {
	cfg, ok := getMasterTableConfig(c.Param("type"))
	if !ok {
		c.JSON(400, gin.H{"error": "tipe master tidak valid"})
		return
	}

	code := strings.TrimSpace(c.Param("code"))

	var payload masterPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Name == "" {
		c.JSON(400, gin.H{"error": "nama wajib diisi"})
		return
	}

	result := config.SIK.
		Table(cfg.Table).
		Where(cfg.CodeCol+" = ?", code).
		Update(cfg.NameCol, payload.Name)

	if result.Error != nil {
		c.JSON(500, gin.H{"error": "gagal memperbarui " + cfg.EntityName, "detail": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(404, gin.H{"error": cfg.EntityName + " tidak ditemukan"})
		return
	}

	c.JSON(200, gin.H{"message": cfg.EntityName + " berhasil diperbarui"})
}

func DeleteMaster(c *gin.Context) {
	cfg, ok := getMasterTableConfig(c.Param("type"))
	if !ok {
		c.JSON(400, gin.H{"error": "tipe master tidak valid"})
		return
	}

	code := strings.TrimSpace(c.Param("code"))

	result := config.SIK.
		Table(cfg.Table).
		Where(cfg.CodeCol+" = ?", code).
		Delete(nil)

	if result.Error != nil {
		c.JSON(500, gin.H{"error": "gagal menghapus " + cfg.EntityName, "detail": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(404, gin.H{"error": cfg.EntityName + " tidak ditemukan"})
		return
	}

	c.JSON(200, gin.H{"message": cfg.EntityName + " berhasil dihapus"})
}
