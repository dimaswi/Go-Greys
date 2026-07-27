package models

import (
	"time"

	"gorm.io/gorm"
)

type Patient struct {
	gorm.Model
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Address   string    `json:"address"`
	Gender    string    `json:"gender"`
	BirthDate time.Time `json:"birth_date"`
}
