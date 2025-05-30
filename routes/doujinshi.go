package routes

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	// "unicode"

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
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "Failed to fetch doujinshi from the database"})
		return
	}

	entries, err := os.ReadDir("./doujinshi")
	if err != nil || len(entries) == 0 {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "Failed to read the doujinshi folder"})
		return
	}

	var result []DoujinshiWithThumb
	for _, d := range doujinshi {
		if d.FolderName != "" {
			result = append(result, DoujinshiWithThumb{
				Doujinshi: d,
				// How to deal with this?
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
	c.File(thumbnailPath)
}

func isImageFile(name string) bool {
	ext := strings.ToLower(filepath.Ext(name))
	return ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp"
}

func GetArtistDoujins(c *gin.Context, database *sql.DB) {
	artist := c.Param("artist")
	doujinshi, err := db.GetDoujinshiByArtist(database, artist)
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

	log.Println("Request path:", c.Request.URL.Path)
	log.Println("ID IS:", id)

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
	log.Print(path)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get similar doujinshi"})
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

func AuthCheck(c *gin.Context, rootURL string, http_config n.HTTPConfig) {
	html_page, err := n.GetPageHTML(rootURL, http_config)
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

func SyncDoujinshi(c *gin.Context, database *sql.DB) {
	pending, err := db.GetPendingDoujinshi(database)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "Failed to fetch pending doujinshi"})
		return
	}

	entries, err := os.ReadDir("./doujinshi")
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "Failed to read doujinshi folder"})
		return
	}

	var synced []string
	stillPending := make([]string, len(pending))
	for i, d := range pending {
		stillPending[i] = d.Title
	}

	for _, d := range pending {
		for _, entry := range entries {
			if sanitizeToFilename(entry.Name()) == sanitizeToFilename(d.Title) {
				_ = db.UpdateFolderName(database, d.ID, entry.Name())
				synced = append(synced, d.Title)

				// remove from stillPending
				for i, title := range stillPending {
					if title == d.Title {
						stillPending = append(stillPending[:i], stillPending[i+1:]...)
						break
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"synced":       synced,
		"stillPending": stillPending,
	})

}

var nonWord = regexp.MustCompile(`[^\p{L}\p{N}]+`)

func sanitizeToFilename(s string) string {
	s = strings.ToLower(s)
	s = nonWord.ReplaceAllString(s, "_")
	s = regexp.MustCompile(`_+`).ReplaceAllString(s, "_")
	s = strings.Trim(s, "_")
	return s
}
