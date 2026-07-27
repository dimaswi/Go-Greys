package main

import (
	"log"
	"net/http"
	"os"

	"backend/internal/controllers"
	"backend/internal/database"
	"backend/internal/middleware"
	"backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Coba load .env dari asumsi kita menjalankan dari folder `backend/`
	// Menggunakan Overload agar menimpa variabel env global Windows yang mungkin bentrok
	err := godotenv.Overload("../.env")
	if err != nil {
		// Jika gagal, coba load dari asumsi kita menjalankan `go run main.go` dari dalam folder `backend/cmd/api/`
		err = godotenv.Overload("../../../.env")
	}
	
	if err != nil {
		log.Println("Error loading .env file, using environment variables")
	}

	// Connect to Database
	database.ConnectDB()

	// Auto Migrate
	database.DB.AutoMigrate(&models.User{}, &models.Role{}, &models.Permission{}, &models.Treatment{}, &models.Patient{}, &models.Visit{}, &models.TreatmentLog{}, &models.SiteConfig{})

	// Seeder: SiteConfig
	var siteConfig models.SiteConfig
	if err := database.DB.First(&siteConfig).Error; err != nil {
		siteConfig = models.SiteConfig{
			AppName:    "Greys Dental",
			Subtitle:   "Aplikasi Manajemen",
			LogoURL:    "",
			FaviconURL: "/favicon.svg",
		}
		database.DB.Create(&siteConfig)
	}

	// Seeder: Create Admin Role and User if not exists
	var adminRole models.Role
	if err := database.DB.Where("name = ?", "Admin").First(&adminRole).Error; err != nil {
		adminRole = models.Role{Name: "Admin", Description: "Administrator with full access"}
		database.DB.Create(&adminRole)
	}

	var adminUser models.User
	if err := database.DB.Where("username = ?", "admin").First(&adminUser).Error; err != nil {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		adminUser = models.User{
			Name:     "Administrator",
			Username: "admin",
			Password: string(hashedPassword),
			RoleID:   adminRole.ID,
			FeePercentage: 40.0,
			ApplyDeductions: true,
		}
		database.DB.Create(&adminUser)
		log.Println("Seeded default admin user (username: admin, password: password123)")
	}

	// Seeder: Permissions
	permissionsList := []string{
		"users.view", "users.create", "users.edit", "users.delete",
		"roles.view", "roles.create", "roles.edit", "roles.delete",
		"treatments.view", "treatments.create", "treatments.edit", "treatments.delete",
		"treatment_logs.view", "treatment_logs.create", "treatment_logs.delete",
		"payroll.view",
		"patients.view", "patients.create", "patients.edit", "patients.delete",
		"visits.view", "visits.create", "visits.edit", "visits.delete",
	}
	var allPerms []models.Permission
	for _, p := range permissionsList {
		var perm models.Permission
		if err := database.DB.Where("name = ?", p).First(&perm).Error; err != nil {
			perm = models.Permission{Name: p, Description: "Akses untuk " + p}
			database.DB.Create(&perm)
		}
		allPerms = append(allPerms, perm)
	}

	// Assign permissions to Admin role if not already assigned
	database.DB.Model(&adminRole).Association("Permissions").Append(allPerms)

	// Initialize Gin app
	app := gin.Default()

	frontendUrl := os.Getenv("FRONTEND_URL")
	if frontendUrl == "" {
		frontendUrl = "*"
	}

	corsConfig := cors.DefaultConfig()
	if frontendUrl == "*" {
		corsConfig.AllowAllOrigins = true
	} else {
		corsConfig.AllowOrigins = []string{frontendUrl}
	}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept"}

	app.Use(cors.New(corsConfig))

	// Public Routes
	// Serve static files for uploads
	os.MkdirAll("uploads", 0755)
	app.Static("/uploads", "./uploads")

	api := app.Group("/api")
	api.POST("/auth/login", controllers.Login)
	api.GET("/site-config", controllers.GetSiteConfig)

	// Protected Routes
	protected := api.Group("/", middleware.Protected())
	protected.GET("/me", func(c *gin.Context) {
		userID, exists := c.Get("userId")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "User not found in context"})
			return
		}

		var user models.User
		if err := database.DB.Preload("Role.Permissions").First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
			return
		}

		var perms []string
		for _, p := range user.Role.Permissions {
			perms = append(perms, p.Name)
		}

		c.JSON(http.StatusOK, gin.H{
			"id":               user.ID,
			"identifier":       user.Name,
			"username":         user.Username,
			"role":             user.Role.Name,
			"permissions":      perms,
			"fee_percentage":   user.FeePercentage,
			"apply_deductions": user.ApplyDeductions,
		})
	})
	
	// API Khusus Manajemen Data
	protected.GET("/dashboard/stats", controllers.GetDashboardStats)

	protected.GET("/users", middleware.RequireAnyPermission("users.view", "visits.create", "visits.edit"), controllers.GetUsers)
	protected.GET("/users/:id", middleware.RequireAnyPermission("users.view", "users.edit"), controllers.GetUser)
	protected.POST("/users", middleware.RequirePermission("users.create"), controllers.CreateUser)
	protected.PUT("/users/:id", middleware.RequirePermission("users.edit"), controllers.UpdateUser)
	protected.DELETE("/users/:id", middleware.RequirePermission("users.delete"), controllers.DeleteUser)
	protected.PUT("/users/:id/password", middleware.RequirePermission("users.edit"), controllers.UpdatePassword)

	protected.GET("/roles", controllers.GetRoles)
	protected.POST("/roles", controllers.CreateRole)
	protected.PUT("/roles/:id", controllers.UpdateRole)
	protected.DELETE("/roles/:id", controllers.DeleteRole)

	protected.GET("/permissions", controllers.GetPermissions)
	
	protected.PUT("/site-config", middleware.RequireAnyPermission("roles.edit", "roles.create"), controllers.UpdateSiteConfig)
	protected.POST("/upload", middleware.RequireAnyPermission("roles.edit", "roles.create"), controllers.UploadFile)

	// Payroll and Treatments API
	protected.GET("/treatments", middleware.RequireAnyPermission("treatments.view", "visits.edit"), controllers.GetTreatments)
	protected.POST("/treatments", middleware.RequirePermission("treatments.create"), controllers.CreateTreatment)
	protected.PUT("/treatments/:id", middleware.RequirePermission("treatments.edit"), controllers.UpdateTreatment)
	protected.DELETE("/treatments/:id", middleware.RequirePermission("treatments.delete"), controllers.DeleteTreatment)

	protected.GET("/treatment-logs", middleware.RequirePermission("treatment_logs.view"), controllers.GetTreatmentLogs)
	protected.POST("/treatment-logs", middleware.RequireAnyPermission("treatment_logs.create", "visits.edit"), controllers.CreateTreatmentLog)
	protected.DELETE("/treatment-logs/:id", middleware.RequireAnyPermission("treatment_logs.delete", "visits.edit"), controllers.DeleteTreatmentLog)

	protected.GET("/payroll/calculate", middleware.RequirePermission("payroll.view"), controllers.CalculatePayroll)
	protected.GET("/payroll/list", middleware.RequirePermission("payroll.view"), controllers.CalculatePayrollList)
	protected.GET("/payroll/download-slip", middleware.RequirePermission("payroll.view"), controllers.DownloadSlipPDF)

	// Patients API
	protected.GET("/patients", middleware.RequireAnyPermission("patients.view", "visits.create", "visits.edit"), controllers.GetPatients)
	protected.POST("/patients", middleware.RequirePermission("patients.create"), controllers.CreatePatient)
	protected.PUT("/patients/:id", middleware.RequirePermission("patients.edit"), controllers.UpdatePatient)

	// Visits API
	protected.GET("/visits", middleware.RequirePermission("visits.view"), controllers.GetVisits)
	protected.GET("/visits/:id", middleware.RequirePermission("visits.view"), controllers.GetVisit)
	protected.POST("/visits", middleware.RequirePermission("visits.create"), controllers.CreateVisit)
	protected.PUT("/visits/:id/status", middleware.RequirePermission("visits.edit"), controllers.UpdateVisitStatus)

	// Get port from env
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Fatal(app.Run(":" + port))
}
