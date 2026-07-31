package models

import "gorm.io/gorm"

type Treatment struct {
	gorm.Model
	Name              string  `json:"name"`
	BasePrice         float64 `json:"base_price" gorm:"default:0"`
	IsFixedFee        bool    `json:"is_fixed_fee" gorm:"default:false"`
	MaterialDeduction float64 `json:"material_deduction" gorm:"default:0"`
	FixedMedicalFee   float64 `json:"fixed_medical_fee" gorm:"default:0"`
	HideInPDF         bool    `json:"hide_in_pdf" gorm:"default:false"`
}
