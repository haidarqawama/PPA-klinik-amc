package controllers

import (
	"backend/config"
	"backend/models"

	"github.com/gin-gonic/gin"
)

func GetSuppliers(c *gin.Context) {

	var suppliers []models.Supplier

	config.SIK.
	Table("industrifarmasi").
	Find(&suppliers)

	c.JSON(200, gin.H{
		"data": suppliers,
	})
}

func AddSupplier(c *gin.Context) {

	var supplier models.Supplier

	if err := c.ShouldBindJSON(&supplier); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})

		return
	}

	config.SIK.Create(&supplier)

	c.JSON(201, gin.H{
		"data": supplier,
	})
}

func UpdateSupplier(c *gin.Context) {

	id := c.Param("id")

	var supplier models.Supplier

	if err := c.ShouldBindJSON(&supplier); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})

		return
	}

	config.SIK.
		Where("id=?",id).
		Updates(&supplier)

	c.JSON(200, gin.H{
		"data": supplier,
	})
}

func DeleteSupplier(c *gin.Context) {

	id := c.Param("id")

	config.SIK.
		Delete(
			&models.Supplier{},
			id,
		)

	c.JSON(200, gin.H{
		"message":"deleted",
	})
}