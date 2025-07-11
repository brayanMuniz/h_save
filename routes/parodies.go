package routes

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
)

// ParodyPageData defines the structure for the individual parody page response.
type ParodyPageData struct {
	ParodyDetails *db.ParodyData       `json:"parodyDetails"`
	DoujinshiList []DoujinshiWithThumb `json:"doujinshiList"`
	ImagesList    []ImageWithThumb     `json:"imagesList"`
}

// GetAllParodiesHandler handles the request to get all parodies.
func GetAllParodiesHandler(c *gin.Context, database *sql.DB) {
	parodies, err := db.GetAllParodies(database)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch parodies"})
		return
	}
	if parodies == nil {
		parodies = []db.ParodyData{}
	}
	c.JSON(http.StatusOK, gin.H{"parodies": parodies})
}

// GetParodyPageDataHandler serves the data for an individual parody page.
func GetParodyPageDataHandler(c *gin.Context, database *sql.DB) {
	var parodyID int64
	var err error

	parodyNameQuery := c.Query("name")
	if parodyNameQuery != "" {
		id, dbErr := db.GetParodyIDByName(database, parodyNameQuery)
		if dbErr != nil {
			if dbErr == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "Parody not found by name: " + parodyNameQuery})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error looking up parody by name"})
			return
		}
		parodyID = id
	} else {
		parodyIDStr := c.Param("id")
		id, parseErr := strconv.ParseInt(parodyIDStr, 10, 64)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parody ID format in path"})
			return
		}
		parodyID = id
	}

	parodyDetails, err := db.GetParodyDetails(database, parodyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch parody details"})
		return
	}
	if parodyDetails == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Parody not found"})
		return
	}

	doujinshi, err := db.GetDoujinshiByParody(database, parodyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch doujinshi for parody"})
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

	// Fetch images associated with this parody
	images, err := db.GetImagesByParody(database, parodyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images for parody"})
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

	responseData := ParodyPageData{
		ParodyDetails: parodyDetails,
		DoujinshiList: doujinshiWithThumbs,
		ImagesList:    imagesWithThumbs,
	}

	c.JSON(http.StatusOK, responseData)
}
