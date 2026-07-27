package controllers

import (
	"net/http"
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

type DashboardStats struct {
	TotalPatients    int64   `json:"total_patients"`
	VisitsToday      int64   `json:"visits_today"`
	TreatmentsMonth  int64   `json:"treatments_month"`
	RevenueMonth     float64 `json:"revenue_month"`
}

func GetDashboardStats(c *gin.Context) {
	var stats DashboardStats

	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour).Add(-time.Second)

	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	roleAny, _ := c.Get("userRole")
	role, _ := roleAny.(string)
	userIdAny, _ := c.Get("userId")
	var userId uint
	if v, ok := userIdAny.(float64); ok {
		userId = uint(v)
	}
	isAdmin := role == "superadmin" || role == "admin"

	// 1. Total Pasien (Clinic-wide)
	database.DB.Model(&models.Patient{}).Count(&stats.TotalPatients)

	// 2. Kunjungan Hari Ini
	visitQuery := database.DB.Model(&models.Visit{}).Where("date >= ? AND date <= ?", startOfDay, endOfDay)
	if !isAdmin {
		visitQuery = visitQuery.Where("doctor_id = ?", userId)
	}
	visitQuery.Count(&stats.VisitsToday)

	// 3. Tindakan Bulan Ini
	logQuery := database.DB.Model(&models.TreatmentLog{}).Where("date >= ?", startOfMonth)
	if !isAdmin {
		logQuery = logQuery.Where("user_id = ?", userId)
	}
	logQuery.Count(&stats.TreatmentsMonth)

	// 4. Omzet Bulan Ini
	type Result struct {
		Total float64
	}
	var res Result
	revenueQuery := database.DB.Model(&models.TreatmentLog{}).Select("COALESCE(SUM(applied_tariff), 0) as total").Where("date >= ?", startOfMonth)
	if !isAdmin {
		revenueQuery = revenueQuery.Where("user_id = ?", userId)
	}
	revenueQuery.Scan(&res)
	stats.RevenueMonth = res.Total

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}
