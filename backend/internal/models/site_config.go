package models

import "gorm.io/gorm"

type SiteConfig struct {
	gorm.Model
	AppName    string `json:"app_name"`
	Subtitle   string `json:"subtitle"`
	LogoURL    string `json:"logo_url"`
	FaviconURL string `json:"favicon_url"`
}
