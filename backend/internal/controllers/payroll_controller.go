package controllers

import (
	"net/http"
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

func CalculatePayroll(c *gin.Context) {
	userID := c.Query("user_id")
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if userID == "" || startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "user_id, start_date, dan end_date wajib diisi"})
		return
	}

	// Parse dates (assumed format YYYY-MM-DD)
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format start_date salah"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format end_date salah"})
		return
	}
	// Inclusive of end date by setting time to 23:59:59
	endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	// Get User
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	feePercentage := user.FeePercentage / 100.0

	// Get Treatment Logs
	var logs []models.TreatmentLog
	if err := database.DB.Preload("Treatment").
		Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data tindakan"})
		return
	}

	totalAllTariff := 0.0
	totalFixedTariff := 0.0
	totalMaterialDeduction := 0.0
	totalFixedMedicalFee := 0.0

	for _, log := range logs {
		totalAllTariff += log.AppliedTariff

		if log.Treatment.IsFixedFee {
			totalFixedTariff += log.AppliedTariff
			totalFixedMedicalFee += log.Treatment.FixedMedicalFee
		} else {
			totalMaterialDeduction += log.Treatment.MaterialDeduction
		}
	}

	totalPembagian := (totalAllTariff - totalFixedTariff)
	if user.ApplyDeductions {
		totalPembagian -= totalMaterialDeduction
	} else {
		totalMaterialDeduction = 0.0
	}
	totalGaji := (totalPembagian * feePercentage) + totalFixedMedicalFee

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":               user.ID,
			"name":             user.Name,
			"fee_percentage":   user.FeePercentage,
			"apply_deductions": user.ApplyDeductions,
		},
		"period": gin.H{
			"start": startDateStr,
			"end":   endDateStr,
		},
		"breakdown": gin.H{
			"total_all_tariff":         totalAllTariff,
			"total_fixed_tariff":       totalFixedTariff,
			"total_material_deduction": totalMaterialDeduction,
			"total_fixed_medical_fee":  totalFixedMedicalFee,
			"total_pembagian":          totalPembagian,
		},
		"logs":       logs,
		"total_gaji": totalGaji,
	})
}

func CalculatePayrollList(c *gin.Context) {
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "start_date dan end_date wajib diisi"})
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format start_date salah"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format end_date salah"})
		return
	}
	endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	// Get all users (we can filter for is_dokter if needed, but calculating for all is fine)
	var users []models.User
	if err := database.DB.Preload("Role").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data user"})
		return
	}

	var payrollList []gin.H

	for _, user := range users {
		feePercentage := user.FeePercentage / 100.0

		// Get Treatment Logs for this user
		var logs []models.TreatmentLog
		if err := database.DB.Preload("Treatment").
			Where("user_id = ? AND date >= ? AND date <= ?", user.ID, startDate, endDate).
			Find(&logs).Error; err != nil {
			continue // skip if error
		}

		if len(logs) == 0 {
			continue // Skip users who have no treatments in this period
		}

		totalAllTariff := 0.0
		totalFixedTariff := 0.0
		totalMaterialDeduction := 0.0
		totalFixedMedicalFee := 0.0

		for _, log := range logs {
			totalAllTariff += log.AppliedTariff

			if log.Treatment.IsFixedFee {
				totalFixedTariff += log.AppliedTariff
				totalFixedMedicalFee += log.Treatment.FixedMedicalFee
			} else {
				totalMaterialDeduction += log.Treatment.MaterialDeduction
			}
		}

		totalPembagian := (totalAllTariff - totalFixedTariff)
		if user.ApplyDeductions {
			totalPembagian -= totalMaterialDeduction
		} else {
			totalMaterialDeduction = 0.0
		}
		totalGaji := (totalPembagian * feePercentage) + totalFixedMedicalFee

		payrollList = append(payrollList, gin.H{
			"user": gin.H{
				"id":               user.ID,
				"name":             user.Name,
				"role":             user.Role.Name,
				"fee_percentage":   user.FeePercentage,
				"apply_deductions": user.ApplyDeductions,
			},
			"breakdown": gin.H{
				"total_all_tariff":         totalAllTariff,
				"total_fixed_tariff":       totalFixedTariff,
				"total_material_deduction": totalMaterialDeduction,
				"total_fixed_medical_fee":  totalFixedMedicalFee,
				"total_pembagian":          totalPembagian,
			},
			"logs":       logs,
			"total_gaji": totalGaji,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"period": gin.H{
			"start": startDateStr,
			"end":   endDateStr,
		},
		"data": payrollList,
	})
}
