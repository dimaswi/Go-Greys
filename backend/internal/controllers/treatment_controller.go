package controllers

import (
	"net/http"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

type TreatmentRequest struct {
	Name              string  `json:"name"`
	BasePrice         float64 `json:"base_price"`
	IsFixedFee        bool    `json:"is_fixed_fee"`
	MaterialDeduction float64 `json:"material_deduction"`
	FixedMedicalFee   float64 `json:"fixed_medical_fee"`
	HideInPDF         bool    `json:"hide_in_pdf"`
}

func GetTreatments(c *gin.Context) {
	var treatments []models.Treatment
	if err := database.DB.Find(&treatments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data tindakan"})
		return
	}
	c.JSON(http.StatusOK, treatments)
}

func CreateTreatment(c *gin.Context) {
	var req TreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid"})
		return
	}

	treatment := models.Treatment{
		Name:              req.Name,
		BasePrice:         req.BasePrice,
		IsFixedFee:        req.IsFixedFee,
		MaterialDeduction: req.MaterialDeduction,
		FixedMedicalFee:   req.FixedMedicalFee,
		HideInPDF:         req.HideInPDF,
	}

	if err := database.DB.Create(&treatment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat tindakan"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Tindakan berhasil dibuat",
		"treatment": treatment,
	})
}

func UpdateTreatment(c *gin.Context) {
	id := c.Param("id")
	var treatment models.Treatment

	if err := database.DB.First(&treatment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Tindakan tidak ditemukan"})
		return
	}

	var req TreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid"})
		return
	}

	treatment.Name = req.Name
	treatment.BasePrice = req.BasePrice
	treatment.IsFixedFee = req.IsFixedFee
	treatment.MaterialDeduction = req.MaterialDeduction
	treatment.FixedMedicalFee = req.FixedMedicalFee
	treatment.HideInPDF = req.HideInPDF

	if err := database.DB.Save(&treatment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan tindakan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tindakan berhasil diupdate", "treatment": treatment})
}

func DeleteTreatment(c *gin.Context) {
	id := c.Param("id")
	var treatment models.Treatment

	if err := database.DB.First(&treatment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Tindakan tidak ditemukan"})
		return
	}

	if err := database.DB.Delete(&treatment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus tindakan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tindakan berhasil dihapus"})
}
