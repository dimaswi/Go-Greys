package models

import (
	"time"

	"gorm.io/gorm"
)

type Visit struct {
	gorm.Model
	PatientID uint      `json:"patient_id"`
	Patient   Patient   `json:"patient" gorm:"foreignKey:PatientID"`
	DoctorID  *uint     `json:"doctor_id"` // Boleh null saat antre
	Doctor    *User     `json:"doctor" gorm:"foreignKey:DoctorID"`
	Status    string    `json:"status" gorm:"default:'menunggu'"` // menunggu, di_ruangan, selesai, batal
	Date        time.Time `json:"date"`
	Notes       string    `json:"notes"`
	RegistrarID *uint     `json:"registrar_id"` // Yang mendaftarkan kunjungan
	
	// Relation to multiple treatments done during this visit
	TreatmentLogs []TreatmentLog `json:"treatment_logs,omitempty" gorm:"foreignKey:VisitID"`
}
