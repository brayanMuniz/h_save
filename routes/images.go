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

func UpdateImageProgress(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	imageID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	var req struct {
		Rating *int `json:"rating"`
		OCount *int `json:"o_count"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if req.Rating != nil {
		if err := db.UpdateImageRating(database, imageID, *req.Rating); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update rating"})
			return
		}
	}

	if req.OCount != nil {
		if err := db.UpdateImageOCount(database, imageID, *req.OCount); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update O count"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Progress updated successfully"})
}

func GetImageProgress(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	imageID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	progress, err := db.GetImageProgress(database, imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"progress": progress})
}

// Image favorite handlers
func ToggleImageFavorite(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	imageID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	isFavorited, err := db.IsImageFavorited(database, imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check favorite status"})
		return
	}

	if isFavorited {
		err = db.RemoveFavoriteImage(database, imageID)
	} else {
		err = db.AddFavoriteImage(database, imageID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle favorite"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_favorited": !isFavorited,
		"message":      "Favorite status updated",
	})
}

func GetImageFavoriteStatus(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	imageID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	isFavorited, err := db.IsImageFavorited(database, imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check favorite status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"is_favorited": isFavorited})
}

func GetFavoriteImages(c *gin.Context, database *sql.DB) {
	images, err := db.GetFavoriteImages(database)
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

	c.JSON(http.StatusOK, gin.H{"favoriteImages": result})
}

// Image artist handlers
func GetAllImageArtists(c *gin.Context, database *sql.DB) {
	artists, err := db.GetAllImageArtists(database)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"artists": artists})
}

func GetImageArtistPageData(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	artistID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artist ID"})
		return
	}

	// Get artist details (you'll need to implement this in your db package)
	// For now, let's just get the images
	images, err := db.GetImagesByArtist(database, artistID)
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
