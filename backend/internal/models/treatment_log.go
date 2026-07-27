package models

import (
	"time"

	"gorm.io/gorm"
)

type TreatmentLog struct {
	gorm.Model
	UserID        uint      `json:"user_id"` // Doctor who did it
	User          User      `json:"user" gorm:"foreignKey:UserID"`
	TreatmentID   uint      `json:"treatment_id"`
	Treatment     Treatment `json:"treatment" gorm:"foreignKey:TreatmentID"`
	VisitID       uint      `json:"visit_id"`
	Visit         Visit     `json:"-" gorm:"foreignKey:VisitID"`
	PatientID     uint      `json:"patient_id"`
	Patient       Patient   `json:"patient" gorm:"foreignKey:PatientID"`
	AppliedTariff float64   `json:"applied_tariff"`
	Notes         string    `json:"notes"`
	Date          time.Time `json:"date"`
}
