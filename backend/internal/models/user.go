package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name            string  `json:"name"`
	Username        string  `json:"username" gorm:"unique"`
	Password        string  `json:"-"`
	RoleID          uint    `json:"role_id"`
	Role            Role    `json:"role" gorm:"foreignKey:RoleID"`
	FeePercentage   float64 `json:"fee_percentage" gorm:"default:0"`
	ApplyDeductions bool    `json:"apply_deductions" gorm:"default:false"`
	IsDokter        bool    `json:"is_dokter" gorm:"default:false"`
	HideTreatments  bool    `json:"hide_treatments" gorm:"default:false"`
}
