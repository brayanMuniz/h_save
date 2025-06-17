package routes

import (
	"database/sql"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/n"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

type DoujinshiWithThumb struct {
	db.Doujinshi
	ThumbnailURL string `json:"thumbnail_url"`
}

func GetAllDoujinshi(c *gin.Context, database *sql.DB) {
	doujinshi, err := db.GetAllDoujinshi(database)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err})
		return
	}

	var result []DoujinshiWithThumb
	for _, d := range doujinshi {
		if d.FolderName != "" {
			result = append(result, DoujinshiWithThumb{
				Doujinshi:    d,
				ThumbnailURL: "/api/doujinshi/" + strconv.FormatInt(d.ID, 10) + "/thumbnail",
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"doujinshi": result})
}

func GetDoujinshi(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	doujinshiData, err := db.GetDoujinshi(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": err})
		return
	}

	var result DoujinshiWithThumb
	result.Doujinshi = doujinshiData
	result.ThumbnailURL = "/api/doujinshi/" + strconv.FormatInt(doujinshiData.ID, 10) + "/thumbnail"

	c.JSON(http.StatusOK, gin.H{"doujinshiData": result})
}

func GetDoujinshiThumbnail(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	doujinshiData, err := db.GetDoujinshi(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": err})
		return
	}

	if doujinshiData.FolderName == "" {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "The doujin is not synced or downloaded"})
		return
	}

	dir := filepath.Join("doujinshi", doujinshiData.FolderName)
	files, err := os.ReadDir(dir)
	if err != nil || len(files) == 0 {
		c.Status(http.StatusNotFound)
		return
	}

	var imageFiles []string
	for _, f := range files {
		if !f.IsDir() && isImageFile(f.Name()) {
			imageFiles = append(imageFiles, f.Name())
		}
	}

	sort.Strings(imageFiles)
	if len(imageFiles) == 0 {
		c.Status(http.StatusNotFound)
		return
	}

	thumbnailPath := filepath.Join(dir, imageFiles[0])
	c.Header("Cache-Control", "no-store")
	c.File(thumbnailPath)
}

func isImageFile(name string) bool {
	ext := strings.ToLower(filepath.Ext(name))
	return ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp"
}

func GetArtistDoujins(c *gin.Context, database *sql.DB) {
	artistIDStr := c.Param("id")
	artistID, err := strconv.ParseInt(artistIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artist ID format"})
		return
	}

	doujinshi, err := db.GetDoujinshiByArtist(database, artistID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch doujinshi for artist"})
		return
	}

	var result []DoujinshiWithThumb
	for _, d := range doujinshi {
		result = append(result, DoujinshiWithThumb{
			Doujinshi:    d,
			ThumbnailURL: "/api/doujinshi/" + strconv.FormatInt(d.ID, 10) + "/thumbnail",
		})
	}

	c.JSON(http.StatusOK, gin.H{"doujinshi": result})
}

func GetDoujinshiPages(c *gin.Context, database *sql.DB) {
	id := c.Param("id")

	doujinshiData, err := db.GetDoujinshi(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": err})
		return
	}

	if doujinshiData.FolderName == "" {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "The doujin is not synced or downloaded"})
		return
	}

	dir := filepath.Join("doujinshi", doujinshiData.FolderName)
	files, err := os.ReadDir(dir)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err})
		return
	}

	var imageFiles []string
	for _, f := range files {
		if !f.IsDir() && isImageFile(f.Name()) {
			imageFiles = append(imageFiles, "/api/doujinshi/"+id+"/page/"+f.Name())
		}
	}

	sort.Strings(imageFiles)
	c.JSON(http.StatusOK, gin.H{"pages": imageFiles})
}

func GetDoujinshiPage(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	pageNumber := c.Param("pageNumber")

	if !isImageFile(pageNumber) {
		c.JSON(http.StatusBadRequest,
			gin.H{"error": "provide a valid file type"})
		return
	}

	doujinshiData, err := db.GetDoujinshi(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": err})
		return
	}

	if doujinshiData.FolderName == "" {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "The doujin is not synced or downloaded"})
		return
	}

	path := filepath.Join("doujinshi", doujinshiData.FolderName, pageNumber)
	c.Header("Cache-Control", "no-store")
	c.File(path)
}

func GetSimilarDoujinshiByMetadata(c *gin.Context, database *sql.DB) {
	id := c.Param("id")
	doujinshiData, err := db.GetDoujinshi(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get doujinshi data"})
		return
	}

	similarList, err := db.GetSimilarDoujinshiByMetaData(
		database,
		id,
		doujinshiData.Characters,
		doujinshiData.Tags,
		doujinshiData.Parodies,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err})
		return
	}

	var result []DoujinshiWithThumb
	for _, d := range similarList {
		result = append(result, DoujinshiWithThumb{
			Doujinshi:    d,
			ThumbnailURL: "/api/doujinshi/" + strconv.FormatInt(d.ID, 10) + "/thumbnail",
		})
	}
	c.JSON(http.StatusOK, gin.H{"similarDoujins": result})

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

var nonWord = regexp.MustCompile(`[^\p{L}\p{N}]+`)

func sanitizeToFilename(s string) string {
	s = strings.ToLower(s)
	s = nonWord.ReplaceAllString(s, "_")
	s = regexp.MustCompile(`_+`).ReplaceAllString(s, "_")
	s = strings.Trim(s, "_")
	return s
}
