package models

import (
	"gorm.io/gorm"
)

type Role struct {
	gorm.Model
	Name        string       `json:"name" gorm:"unique"`
	Description string       `json:"description"`
	Permissions []Permission `json:"permissions" gorm:"many2many:role_permissions;"`
}

type Permission struct {
	gorm.Model
	Name        string `json:"name" gorm:"unique"` // e.g. "users.create", "users.view"
	Description string `json:"description"`
}
