package routes

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
)

func AddFavoriteArtist(c *gin.Context, database *sql.DB) {
	artistIDStr := c.Param("id")
	artistID, err := strconv.ParseInt(artistIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artist ID format"})
		return
	}

	var exists bool
	err = database.QueryRow("SELECT EXISTS(SELECT 1 FROM artists WHERE id = ?)", artistID).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking artist existence"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Artist not found"})
		return
	}

	if err := db.AddFavoriteArtist(database, artistID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add favorite artist"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Artist added to favorites"})
}

func RemoveFavoriteArtist(c *gin.Context, database *sql.DB) {
	artistIDStr := c.Param("id")
	artistID, err := strconv.ParseInt(artistIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artist ID format"})
		return
	}

	var exists bool
	err = database.QueryRow("SELECT EXISTS(SELECT 1 FROM artists WHERE id = ?)", artistID).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking artist existence"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Artist not found"})
		return
	}

	if err := db.RemoveFavoriteArtist(database, artistID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove favorite artist"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Artist removed from favorites"})
}
