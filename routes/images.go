package routes

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
)

type ImageWithThumb struct {
	db.Image
	ThumbnailURL string `json:"thumbnail_url"`
}

func GetAllImages(c *gin.Context, database *sql.DB) {
	images, err := db.GetAllImages(database)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var result []ImageWithThumb
	for _, img := range images {
		result = append(result, ImageWithThumb{
			Image:        img,
			ThumbnailURL: "/api/images/" + strconv.FormatInt(img.ID, 10) + "/thumbnail",
		})
	}

	c.JSON(http.StatusOK, gin.H{"images": result})
}

func GetImage(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	imageData, err := db.GetImage(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := ImageWithThumb{
		Image:        imageData,
		ThumbnailURL: "/api/images/" + strconv.FormatInt(imageData.ID, 10) + "/thumbnail",
	}

	c.JSON(http.StatusOK, gin.H{"imageData": result})
}

func GetImageFile(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	imageData, err := db.GetImage(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Cache-Control", "public, max-age=86400") // Cache for 1 day
	c.File(imageData.FilePath)
}

func GetImageThumbnail(c *gin.Context, database *sql.DB) {
	// For now, just serve the original image
	// Later you can implement thumbnail generation
	GetImageFile(c, database)
}

func GetSimilarImagesByMetadata(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	imageData, err := db.GetImage(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get image data"})
		return
	}

	similarList, err := db.GetSimilarImagesByMetaData(
		database,
		id,
		imageData.Characters,
		imageData.Tags,
		imageData.Parodies,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var result []ImageWithThumb
	for _, img := range similarList {
		result = append(result, ImageWithThumb{
			Image:        img,
			ThumbnailURL: "/api/images/" + strconv.FormatInt(img.ID, 10) + "/thumbnail",
		})
	}
	c.JSON(http.StatusOK, gin.H{"similarImages": result})
}

func ScanImagesFolder(c *gin.Context, database *sql.DB) {
	// Default folder path
	folderPath := "images"

	// Allow override via query parameter
	if customPath := c.Query("path"); customPath != "" {
		folderPath = customPath
	}

	// Check if folder exists
	if _, err := os.Stat(folderPath); os.IsNotExist(err) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Images folder '%s' does not exist", folderPath),
		})
		return
	}

	// Perform the scan
	result, err := db.ScanImagesFolder(database, folderPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Return scan results
	c.JSON(http.StatusOK, gin.H{
		"message": "Scan completed",
		"result":  result,
	})
}
