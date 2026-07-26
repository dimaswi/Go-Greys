package controllers

import (
	"backend/internal/database"
	"backend/internal/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

type UserResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

func GetUsers(c *fiber.Ctx) error {
	var users []models.User
	
	// Preload "Role" untuk mendapatkan nama role dari relasi foreign key
	if err := database.DB.Preload("Role").Find(&users).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Gagal mengambil data user"})
	}

	// Format response sesuai kebutuhan frontend (kolom DataTable)
	var response []UserResponse
	for _, user := range users {
		response = append(response, UserResponse{
			ID:       strconv.Itoa(int(user.ID)), // ID perlu diubah jadi string karena frontend type User.id is string
			Name:     user.Name,
			Username: user.Username,
			Role:     user.Role.Name,
		})
	}

	return c.JSON(response)
}

func UpdatePassword(c *fiber.Ctx) error {
	id := c.Params("id")
	var user models.User

	if err := database.DB.First(&user, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "User tidak ditemukan"})
	}

	var req struct {
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Input tidak valid"})
	}

	if len(req.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Password minimal 6 karakter"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Gagal mengenkripsi password"})
	}

	user.Password = string(hashedPassword)
	if err := database.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Gagal menyimpan password"})
	}

	return c.JSON(fiber.Map{"message": "Password berhasil diperbarui"})
}
