package controllers

import (
	"backend/internal/database"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

type DashboardStats struct {
	TotalUsers int64 `json:"total_users"`
	TotalRoles int64 `json:"total_roles"`
}

func GetDashboardStats(c *fiber.Ctx) error {
	var stats DashboardStats

	database.DB.Model(&models.User{}).Count(&stats.TotalUsers)
	database.DB.Model(&models.Role{}).Count(&stats.TotalRoles)

	return c.JSON(fiber.Map{
		"stats": stats,
	})
}
