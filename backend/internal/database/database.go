package database

import (
	"fmt"
	"log"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
		strings.TrimSpace(os.Getenv("DB_HOST")),
		strings.TrimSpace(os.Getenv("DB_USER")),
		strings.TrimSpace(os.Getenv("DB_PASSWORD")),
		strings.TrimSpace(os.Getenv("DB_NAME")),
		strings.TrimSpace(os.Getenv("DB_PORT")),
		strings.TrimSpace(os.Getenv("DB_SSLMODE")),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database. \n", err)
	}

	log.Println("Connected to Database")
}
