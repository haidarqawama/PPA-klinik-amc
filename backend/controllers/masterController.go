package controllers

import (
	"backend/config"
	"backend/models"
	"github.com/gin-gonic/gin"
)

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
		"golongan": golongan,
		"jenis": jenis,
		"satuan": satuan,
		"suppliers": suppliers,
	})
}