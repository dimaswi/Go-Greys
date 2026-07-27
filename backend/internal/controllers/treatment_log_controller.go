package controllers

import (
	"net/http"
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

type TreatmentLogRequest struct {
	UserID        uint    `json:"user_id"`
	TreatmentID   uint    `json:"treatment_id"`
	VisitID       uint    `json:"visit_id"`
	PatientID     uint    `json:"patient_id"`
	AppliedTariff float64 `json:"applied_tariff"`
	Notes         string  `json:"notes"`
	Date          string  `json:"date"` // RFC3339 format expected
}

func GetTreatmentLogs(c *gin.Context) {
	var logs []models.TreatmentLog

	query := database.DB.Preload("User").Preload("Treatment").Preload("Patient").Preload("Visit")

	// Optional filtering
	if userID := c.Query("user_id"); userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.Order("date desc").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data log tindakan"})
		return
	}

	c.JSON(http.StatusOK, logs)
}

func CreateTreatmentLog(c *gin.Context) {
	var req TreatmentLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid", "error": err.Error()})
		return
	}

	parsedDate, err := time.Parse(time.RFC3339, req.Date)
	if err != nil {
		// Fallback parse if only date provided
		parsedDate, err = time.Parse("2006-01-02", req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Format tanggal salah. Gunakan YYYY-MM-DD"})
			return
		}
	}

	log := models.TreatmentLog{
		UserID:        req.UserID,
		TreatmentID:   req.TreatmentID,
		VisitID:       req.VisitID,
		PatientID:     req.PatientID,
		AppliedTariff: req.AppliedTariff,
		Notes:         req.Notes,
		Date:          parsedDate,
	}

	if err := database.DB.Create(&log).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mencatat tindakan"})
		return
	}

	// Load relationships for response
	database.DB.Preload("User").Preload("Treatment").Preload("Patient").Preload("Visit").First(&log, log.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Tindakan berhasil dicatat",
		"log":     log,
	})
}

func DeleteTreatmentLog(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.TreatmentLog{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus log tindakan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Log tindakan berhasil dihapus"})
}
