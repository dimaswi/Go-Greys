package controllers

import (
	"net/http"
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

type PatientRequest struct {
	Name      string `json:"name" binding:"required"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	Gender    string `json:"gender"`
	BirthDate string `json:"birth_date"`
}

func GetPatients(c *gin.Context) {
	var patients []models.Patient
	if err := database.DB.Order("created_at desc").Find(&patients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data pasien"})
		return
	}
	c.JSON(http.StatusOK, patients)
}

func CreatePatient(c *gin.Context) {
	var req PatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid", "error": err.Error()})
		return
	}

	var parsedDate time.Time
	if req.BirthDate != "" {
		d, err := time.Parse("2006-01-02", req.BirthDate)
		if err == nil {
			parsedDate = d
		}
	}

	patient := models.Patient{
		Name:      req.Name,
		Phone:     req.Phone,
		Address:   req.Address,
		Gender:    req.Gender,
		BirthDate: parsedDate,
	}

	if err := database.DB.Create(&patient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan pasien"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Pasien berhasil dibuat", "patient": patient})
}

func UpdatePatient(c *gin.Context) {
	id := c.Param("id")
	var patient models.Patient
	if err := database.DB.First(&patient, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Pasien tidak ditemukan"})
		return
	}

	var req PatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid"})
		return
	}

	if req.BirthDate != "" {
		if d, err := time.Parse("2006-01-02", req.BirthDate); err == nil {
			patient.BirthDate = d
		}
	}

	patient.Name = req.Name
	patient.Phone = req.Phone
	patient.Address = req.Address
	patient.Gender = req.Gender

	database.DB.Save(&patient)
	c.JSON(http.StatusOK, gin.H{"message": "Data pasien diperbarui", "patient": patient})
}
