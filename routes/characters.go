package routes

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
)

type CharacterPageData struct {
	CharacterDetails *db.CharacterData    `json:"characterDetails"`
	DoujinshiList    []DoujinshiWithThumb `json:"doujinshiList"`
}

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

func GetCharacterPageDataHandler(c *gin.Context, database *sql.DB) {
	var characterID int64
	var err error

	characterNameQuery := c.Query("name")
	if characterNameQuery != "" {
		id, dbErr := db.GetCharacterIDByName(database, characterNameQuery)
		if dbErr != nil {
			if dbErr == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "Character not found by name: " + characterNameQuery})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error looking up character by name"})
			return
		}
		characterID = id
	} else {
		characterIDStr := c.Param("id")
		id, parseErr := strconv.ParseInt(characterIDStr, 10, 64)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid character ID format in path"})
			return
		}
		characterID = id
	}

	characterDetails, err := db.GetCharacterDetails(database, characterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch character details"})
		return
	}
	if characterDetails == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
		return
	}

	doujinshi, err := db.GetDoujinshiByCharacter(database, characterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch doujinshi for character"})
		return
	}

	var doujinshiWithThumbs []DoujinshiWithThumb
	for _, d := range doujinshi {
		doujinshiWithThumbs = append(doujinshiWithThumbs, DoujinshiWithThumb{
			Doujinshi:    d,
			ThumbnailURL: "/api/doujinshi/" + strconv.FormatInt(d.ID, 10) + "/thumbnail",
		})
	}
	if doujinshiWithThumbs == nil {
		doujinshiWithThumbs = []DoujinshiWithThumb{}
	}

	responseData := CharacterPageData{
		CharacterDetails: characterDetails,
		DoujinshiList:    doujinshiWithThumbs,
	}

	c.JSON(http.StatusOK, responseData)
}
