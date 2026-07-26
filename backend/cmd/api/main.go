package main

import (
	"log"
	"os"

	"backend/internal/controllers"
	"backend/internal/database"
	"backend/internal/middleware"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
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
	database.DB.AutoMigrate(&models.User{}, &models.Role{}, &models.Permission{})

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
		}
		database.DB.Create(&adminUser)
		log.Println("Seeded default admin user (username: admin, password: password123)")
	}

	// Seeder: Permissions
	permissionsList := []string{
		"users.view", "users.create", "users.edit", "users.delete",
		"roles.view", "roles.create", "roles.edit", "roles.delete",
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

	// Initialize Fiber app
	app := fiber.New()

	app.Use(logger.New())
	frontendUrl := os.Getenv("FRONTEND_URL")
	if frontendUrl == "" {
		frontendUrl = "*"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins: frontendUrl,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Public Routes
	api := app.Group("/api")
	api.Post("/auth/login", controllers.Login)

	// Protected Routes
	protected := api.Group("/", middleware.Protected())
	protected.Get("/me", func(c *fiber.Ctx) error {
		userID := c.Locals("userId")
		var user models.User
		if err := database.DB.Preload("Role.Permissions").First(&user, userID).Error; err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "User not found"})
		}

		var perms []string
		for _, p := range user.Role.Permissions {
			perms = append(perms, p.Name)
		}

		return c.JSON(fiber.Map{
			"id":          user.ID,
			"identifier":  user.Name,
			"username":    user.Username,
			"role":        user.Role.Name,
			"permissions": perms,
		})
	})
	
	// API Khusus Manajemen Data
	protected.Get("/dashboard/stats", controllers.GetDashboardStats)

	protected.Get("/users", controllers.GetUsers)
	protected.Put("/users/:id/password", controllers.UpdatePassword)

	protected.Get("/roles", controllers.GetRoles)
	protected.Post("/roles", controllers.CreateRole)
	protected.Put("/roles/:id", controllers.UpdateRole)
	protected.Delete("/roles/:id", controllers.DeleteRole)

	protected.Get("/permissions", controllers.GetPermissions)

	// Get port from env
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Fatal(app.Listen(":" + port))
}
