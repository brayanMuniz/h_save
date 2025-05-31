package routes

import (
	"database/sql"
	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
)

func LoginHandler(c *gin.Context, database *sql.DB) {
	var req struct{ Password string }
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}
	ok, err := db.CheckPassword(database, req.Password)
	if err != nil || !ok {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	// Set a session cookie (for example)
	c.SetCookie("session", "your-session-token", 3600, "/", "", false, true)
	c.JSON(200, gin.H{"message": "Logged in"})
}
