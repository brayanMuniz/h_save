package routes

import (
	"database/sql"
	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
	"net/http"
)

type ProgressRequest struct {
	Rating   int `json:"rating"`
	LastPage int `json:"lastPage"`
}

func GetDoujinshiProgress(c *gin.Context, database *sql.DB) {
	id := c.Param("id")

	progress, err := db.GetDoujinshiProgress(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "Failed to get doujinshi progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"progress": progress})
}

func SetDoujinshiProgress(c *gin.Context, database *sql.DB) {
	id := c.Param("id")

	var request struct {
		Rating   *int `json:"rating"`
		LastPage *int `json:"lastPage"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate rating
	if request.Rating != nil && (*request.Rating < 1 || *request.Rating > 5) {
		c.JSON(http.StatusBadRequest,
			gin.H{"error": "Rating must be between 1 and 5, or null to remove rating"})
		return
	}

	// Validate last_page
	if request.LastPage != nil && *request.LastPage < 0 {
		c.JSON(http.StatusBadRequest,
			gin.H{"error": "Last page must be non-negative"})
		return
	}

	err := db.UpdateDoujinshiProgress(
		database,
		id,
		request.Rating,
		request.LastPage,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "Failed to update doujinshi progress"})
		return
	}

	progress, err := db.GetDoujinshiProgress(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "Failed to get updated progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Progress updated successfully",
		"progress": progress,
	})
}
