package routes

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

type ArtistPageData struct {
	ArtistDetails *db.ArtistData       `json:"artistDetails"`
	DoujinshiList []DoujinshiWithThumb `json:"doujinshiList"`
	ImagesList    []ImageWithThumb     `json:"imagesList"`
}

func GetAllArtist(c *gin.Context, database *sql.DB) {
	artists, err := db.GetAllArtist(database)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch doujinshi for artist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"artists": artists})
}

func GetArtistPageDataHandler(c *gin.Context, database *sql.DB) {
	var artistID int64
	var err error
	userNameQuery := c.Query("name")

	if userNameQuery != "" {
		id, dbErr := db.GetArtistIDByName(database, userNameQuery)
		if dbErr != nil {
			if dbErr == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "Artist not found by username: " + userNameQuery})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error looking up artist by username"})
			return
		}
		artistID = id
	} else {
		// If no username query parameter, use the 'id' from the path
		artistIDStr := c.Param("id")
		id, parseErr := strconv.ParseInt(artistIDStr, 10, 64)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artist ID format in path"})
			return
		}
		artistID = id
	}

	artistDetails, err := db.GetArtistDetails(database, artistID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch artist details"})
		return
	}
	if artistDetails == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Artist not found"})
		return
	}

	doujinshi, err := db.GetDoujinshiByArtist(database, artistID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch doujinshi for artist"})
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

	// Fetch images associated with this artist
	images, err := db.GetImagesByArtist(database, artistID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images for artist"})
		return
	}

	var imagesWithThumbs []ImageWithThumb
	for _, img := range images {
		imagesWithThumbs = append(imagesWithThumbs, ImageWithThumb{
			Image:        img,
			ThumbnailURL: "/api/images/" + strconv.FormatInt(img.ID, 10) + "/thumbnail",
		})
	}
	if imagesWithThumbs == nil {
		imagesWithThumbs = []ImageWithThumb{}
	}

	responseData := ArtistPageData{
		ArtistDetails: artistDetails,
		DoujinshiList: doujinshiWithThumbs,
		ImagesList:    imagesWithThumbs,
	}

	c.JSON(http.StatusOK, responseData)
}
