package controllers

import (
	"net/http"
	"strconv"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserResponse struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	Username        string  `json:"username"`
	Role            string  `json:"role"`
	FeePercentage   float64 `json:"fee_percentage"`
	ApplyDeductions bool    `json:"apply_deductions"`
	IsDokter        bool    `json:"is_dokter"`
}

func GetUsers(c *gin.Context) {
	var users []models.User
	
	// Preload "Role" untuk mendapatkan nama role dari relasi foreign key
	if err := database.DB.Preload("Role").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data user"})
		return
	}

	// Format response sesuai kebutuhan frontend (kolom DataTable)
	var response []UserResponse
	for _, user := range users {
		response = append(response, UserResponse{
			ID:              strconv.Itoa(int(user.ID)), // ID perlu diubah jadi string karena frontend type User.id is string
			Name:            user.Name,
			Username:        user.Username,
			Role:            user.Role.Name,
			FeePercentage:   user.FeePercentage,
			ApplyDeductions: user.ApplyDeductions,
			IsDokter:        user.IsDokter,
		})
	}

	c.JSON(http.StatusOK, response)
}

func GetUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	
	if err := database.DB.Preload("Role").First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	resp := UserResponse{
		ID:              strconv.Itoa(int(user.ID)),
		Name:            user.Name,
		Username:        user.Username,
		Role:            user.Role.Name,
		FeePercentage:   user.FeePercentage,
		ApplyDeductions: user.ApplyDeductions,
		IsDokter:        user.IsDokter,
	}
	c.JSON(http.StatusOK, resp)
}

func UpdatePassword(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	var req struct {
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid"})
		return
	}

	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Password minimal 6 karakter"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengenkripsi password"})
		return
	}

	user.Password = string(hashedPassword)
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil diperbarui"})
}

func CreateUser(c *gin.Context) {
	var req struct {
		Name            string  `json:"name"`
		Username        string  `json:"username"`
		Password        string  `json:"password"`
		RoleID          uint    `json:"role_id"`
		FeePercentage   float64 `json:"fee_percentage"`
		ApplyDeductions bool    `json:"apply_deductions"`
		IsDokter        bool    `json:"is_dokter"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid"})
		return
	}

	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Password minimal 6 karakter"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengenkripsi password"})
		return
	}

	user := models.User{
		Name:            req.Name,
		Username:        req.Username,
		Password:        string(hashedPassword),
		RoleID:          req.RoleID,
		FeePercentage:   req.FeePercentage,
		ApplyDeductions: req.ApplyDeductions,
		IsDokter:        req.IsDokter,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat user (username mungkin sudah ada)"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User berhasil dibuat", "id": user.ID})
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	var req struct {
		Name            string  `json:"name"`
		Username        string  `json:"username"`
		RoleID          uint    `json:"role_id"`
		FeePercentage   float64 `json:"fee_percentage"`
		ApplyDeductions bool    `json:"apply_deductions"`
		IsDokter        bool    `json:"is_dokter"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid"})
		return
	}

	user.Name = req.Name
	user.Username = req.Username
	user.RoleID = req.RoleID
	user.FeePercentage = req.FeePercentage
	user.ApplyDeductions = req.ApplyDeductions
	user.IsDokter = req.IsDokter

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan user (username mungkin sudah ada)"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User berhasil diperbarui"})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	if err := database.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User berhasil dihapus"})
}

