package controllers

import (
	"net/http"
	"strings"
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

type VisitRequest struct {
	PatientID uint   `json:"patient_id" binding:"required"`
	DoctorID  *uint  `json:"doctor_id"`
	Notes     string `json:"notes"`
}

type VisitStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func GetVisits(c *gin.Context) {
	var visits []models.Visit
	query := database.DB.Preload("Patient").Preload("Doctor").Preload("TreatmentLogs.Treatment")

	roleAny, _ := c.Get("userRole")
	role, _ := roleAny.(string)
	userIdAny, _ := c.Get("userId")
	var userId uint
	if v, ok := userIdAny.(float64); ok {
		userId = uint(v)
	}

	lowerRole := strings.ToLower(role)
	if lowerRole == "superadmin" || lowerRole == "admin" {
		// Admin melihat semua antrean, tidak ada filter tambahan
	} else if lowerRole == "dokter" {
		// Dokter hanya melihat antrean yang ditugaskan ke dirinya
		query = query.Where("doctor_id = ?", userId)
	} else {
		// Selain itu (misal Perawat / Frontdesk) hanya melihat antrean yang didaftarkannya
		query = query.Where("registrar_id = ?", userId)
	}

	// Filter by Date (default today)
	dateFilter := c.Query("date")
	if dateFilter != "" {
		parsedDate, err := time.Parse("2006-01-02", dateFilter)
		if err == nil {
			nextDay := parsedDate.Add(24 * time.Hour)
			query = query.Where("date >= ? AND date < ?", parsedDate, nextDay)
		}
	} else {
		// Default to today
		today := time.Now().Truncate(24 * time.Hour)
		nextDay := today.Add(24 * time.Hour)
		query = query.Where("date >= ? AND date < ?", today, nextDay)
	}

	if err := query.Order("created_at asc").Find(&visits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data kunjungan"})
		return
	}
	c.JSON(http.StatusOK, visits)
}

func GetVisit(c *gin.Context) {
	id := c.Param("id")
	var visit models.Visit
	if err := database.DB.Preload("Patient").Preload("Doctor").Preload("TreatmentLogs.Treatment").Preload("TreatmentLogs.User").First(&visit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Kunjungan tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, visit)
}

func CreateVisit(c *gin.Context) {
	var req VisitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid", "error": err.Error()})
		return
	}

	userIdAny, _ := c.Get("userId")
	var registrarId uint
	if v, ok := userIdAny.(float64); ok {
		registrarId = uint(v)
	} else if v, ok := userIdAny.(uint); ok {
		registrarId = v
	}

	visit := models.Visit{
		PatientID:   req.PatientID,
		DoctorID:    req.DoctorID,
		Status:      "menunggu",
		Date:        time.Now(),
		Notes:       req.Notes,
		RegistrarID: &registrarId,
	}

	if err := database.DB.Create(&visit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat kunjungan"})
		return
	}

	database.DB.Preload("Patient").First(&visit, visit.ID)
	c.JSON(http.StatusCreated, gin.H{"message": "Berhasil mendaftarkan antrean", "visit": visit})
}

func UpdateVisitStatus(c *gin.Context) {
	id := c.Param("id")
	var visit models.Visit

	if err := database.DB.First(&visit, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Kunjungan tidak ditemukan"})
		return
	}

	var req VisitStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input status tidak valid"})
		return
	}

	// Valid status: menunggu, di_ruangan, selesai, batal
	visit.Status = req.Status
	database.DB.Save(&visit)

	c.JSON(http.StatusOK, gin.H{"message": "Status kunjungan diperbarui", "visit": visit})
}
