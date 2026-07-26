package controllers

import (
	"backend/internal/database"
	"backend/internal/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type RoleRequest struct {
	Name          string `json:"name"`
	Description   string `json:"description"`
	PermissionIDs []uint `json:"permission_ids"`
}

type RoleResponse struct {
	ID          string              `json:"id"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Permissions []models.Permission `json:"permissions"`
}

func GetRoles(c *fiber.Ctx) error {
	var roles []models.Role
	if err := database.DB.Preload("Permissions").Find(&roles).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Gagal mengambil data role"})
	}

	var response []RoleResponse
	for _, role := range roles {
		response = append(response, RoleResponse{
			ID:          strconv.Itoa(int(role.ID)),
			Name:        role.Name,
			Description: role.Description,
			Permissions: role.Permissions,
		})
	}

	return c.JSON(response)
}

func GetPermissions(c *fiber.Ctx) error {
	var permissions []models.Permission
	if err := database.DB.Find(&permissions).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Gagal mengambil data permission"})
	}
	return c.JSON(permissions)
}

func CreateRole(c *fiber.Ctx) error {
	var req RoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Input tidak valid"})
	}

	var permissions []models.Permission
	if len(req.PermissionIDs) > 0 {
		database.DB.Where("id IN ?", req.PermissionIDs).Find(&permissions)
	}

	role := models.Role{
		Name:        req.Name,
		Description: req.Description,
		Permissions: permissions,
	}

	if err := database.DB.Create(&role).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Gagal membuat role"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Role berhasil dibuat",
		"id":      strconv.Itoa(int(role.ID)),
	})
}

func UpdateRole(c *fiber.Ctx) error {
	id := c.Params("id")
	var role models.Role

	if err := database.DB.First(&role, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Role tidak ditemukan"})
	}

	var req RoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Input tidak valid"})
	}

	var permissions []models.Permission
	if len(req.PermissionIDs) > 0 {
		database.DB.Where("id IN ?", req.PermissionIDs).Find(&permissions)
	}

	role.Name = req.Name
	role.Description = req.Description

	if err := database.DB.Save(&role).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Gagal menyimpan role"})
	}

	// Update permissions (many-to-many replace)
	database.DB.Model(&role).Association("Permissions").Replace(permissions)

	return c.JSON(fiber.Map{"message": "Role berhasil diupdate"})
}

func DeleteRole(c *fiber.Ctx) error {
	id := c.Params("id")
	var role models.Role

	if err := database.DB.First(&role, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Role tidak ditemukan"})
	}

	// Hapus relasi permissions terlebih dahulu
	database.DB.Model(&role).Association("Permissions").Clear()

	if err := database.DB.Delete(&role).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Gagal menghapus role"})
	}

	return c.JSON(fiber.Map{"message": "Role berhasil dihapus"})
}
