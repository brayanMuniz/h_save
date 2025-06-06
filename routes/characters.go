package routes

import (
	"database/sql"
	"net/http"

	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
)

func GetAllCharactersHandler(c *gin.Context, database *sql.DB) {
	characters, err := db.GetAllCharacters(database)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch characters"})
		return
	}

	if characters == nil {
		characters = []db.CharacterData{} // Return empty array instead of null
	}

	c.JSON(http.StatusOK, gin.H{"characters": characters})
}
