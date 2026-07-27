package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// RequireAnyPermission allows access if the user has AT LEAST ONE of the given permissions
func RequireAnyPermission(requiredPermissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Bypass check if user is Admin
		userRole, existsRole := c.Get("userRole")
		if existsRole {
			if roleStr, ok := userRole.(string); ok && strings.ToLower(roleStr) == "admin" {
				c.Next()
				return
			}
		}

		userPermsObj, exists := c.Get("userPermissions")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Akses ditolak (permissions tidak ditemukan)"})
			return
		}

		userPerms, ok := userPermsObj.([]interface{})
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Akses ditolak (format permissions tidak valid)"})
			return
		}

		hasPermission := false
		for _, p := range userPerms {
			permStr, ok := p.(string)
			if !ok {
				continue
			}
			for _, reqPerm := range requiredPermissions {
				if permStr == reqPerm {
					hasPermission = true
					break
				}
			}
			if hasPermission {
				break
			}
		}

		if !hasPermission {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Anda membutuhkan salah satu izin: " + strings.Join(requiredPermissions, ", ")})
			return
		}

		c.Next()
	}
}

// RequirePermission (single check) delegates to RequireAnyPermission
func RequirePermission(requiredPermission string) gin.HandlerFunc {
	return RequireAnyPermission(requiredPermission)
}
