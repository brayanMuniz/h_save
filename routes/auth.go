package routes

import (
	"database/sql"
	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/n"
	"github.com/gin-gonic/gin"
	"net/http"
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

func AuthCheck(c *gin.Context, rootURL string) {
	var req struct {
		SessionId string `json:"sessionId"`
		CsrfToken string `json:"csrfToken"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	httpConfig := n.HTTPConfig{
		SessionId: req.SessionId,
		CsrfToken: req.CsrfToken,
	}

	html_page, err := n.GetPageHTML(rootURL, httpConfig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get favorites page"})
		return
	}

	userName, err := n.ReturnUserNameFromHTML(html_page)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get username"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"userName": userName})
}
