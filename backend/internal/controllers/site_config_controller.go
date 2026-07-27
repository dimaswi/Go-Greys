package controllers

import (
	"net/http"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

func GetSiteConfig(c *gin.Context) {
	var config models.SiteConfig
	// We only need the first row
	if err := database.DB.First(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to fetch config"})
		return
	}
	c.JSON(http.StatusOK, config)
}

func UpdateSiteConfig(c *gin.Context) {
	var input struct {
		AppName    string `json:"app_name"`
		Subtitle   string `json:"subtitle"`
		LogoURL    string `json:"logo_url"`
		FaviconURL string `json:"favicon_url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	var config models.SiteConfig
	if err := database.DB.First(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Config not found"})
		return
	}

	config.AppName = input.AppName
	config.Subtitle = input.Subtitle
	config.LogoURL = input.LogoURL
	config.FaviconURL = input.FaviconURL

	if err := database.DB.Save(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update config"})
		return
	}

	c.JSON(http.StatusOK, config)
}
