package routes

import (
	"database/sql"
	"fmt"
	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/n"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode"
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
		if d.Pending == 0 {
			folderName := ""
			for _, entry := range entries {
				if sanitizeToFilename(d.Title) == sanitizeToFilename(entry.Name()) {
					folderName = entry.Name()
					break
				}
			}
			if folderName != "" {
				result = append(result, DoujinshiWithThumb{
					Doujinshi:    d,
					ThumbnailURL: "/api/doujinshi/" + d.GalleryID + "/thumbnail",
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"doujinshi": result})
}

func GetDoujinshi(c *gin.Context, database *sql.DB) {
	galleryId := c.Param("galleryId")
	doujinshiData, err := db.GetDoujinshi(database, galleryId)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": err})
		return
	}

	var result DoujinshiWithThumb
	result.Doujinshi = doujinshiData
	result.ThumbnailURL = "/api/doujinshi/" + doujinshiData.GalleryID + "/thumbnail"

	c.JSON(http.StatusOK, gin.H{"doujinshiData": result})
}

func GetDoujinshiThumbnail(c *gin.Context, database *sql.DB) {
	galleryId := c.Param("galleryId")
	folderName, err := getFolderNameFromGalleryID(database, galleryId)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": err})
		return
	}

	if folderName == "" {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "Failed to find matching title in doujins folders"})
		return
	}

	dir := filepath.Join("doujinshi", folderName)
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

func GetDoujinshiPages(c *gin.Context, database *sql.DB) {
	galleryId := c.Param("galleryId")
	folderName, err := getFolderNameFromGalleryID(database, galleryId)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": err})
		return
	}

	dir := filepath.Join("doujinshi", folderName)
	files, err := os.ReadDir(dir)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err})
		return
	}

	var imageFiles []string
	for _, f := range files {
		if !f.IsDir() && isImageFile(f.Name()) {
			imageFiles = append(imageFiles, "/api/doujinshi/"+galleryId+"/page/"+f.Name())
		}
	}

	sort.Strings(imageFiles)
	c.JSON(http.StatusOK, gin.H{"pages": imageFiles})
}

func GetDoujinshiPage(c *gin.Context, database *sql.DB) {
	galleryId := c.Param("galleryId")
	pageNumber := c.Param("pageNumber")

	if !isImageFile(pageNumber) {
		c.JSON(http.StatusBadRequest,
			gin.H{"error": "provide a valid file type"})
		return
	}

	log.Print(galleryId, pageNumber)
	folderName, err := getFolderNameFromGalleryID(database, galleryId)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": err})
		return
	}
	path := filepath.Join("doujinshi", folderName, pageNumber)
	log.Print(path)
	c.File(path)
}

func DownloadFavorites(
	c *gin.Context,
	rootURL string,
	pageStart string,
	http_config n.HTTPConfig,
	database *sql.DB,
	saveMetadata bool,
	skipOrganized bool) {

	favoritesRoute := rootURL + "/favorites" + "/?page=" + pageStart
	html_page, err := n.GetPageHTML(favoritesRoute, http_config)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "Failed to get favorites page"})
		return
	}

	listOfFavorites, err := n.GetListOfFavoritesFromHTML(html_page)
	if err != nil {
		c.JSON(http.StatusInternalServerError,
			gin.H{"error": "Failed to parse favorites HTML"})
		return
	}

	// Out of bounds in the favorites page
	if len(listOfFavorites) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "At the end of the favorites page"})
		return
	}

	for _, v := range listOfFavorites {
		if skipOrganized {
			organized, err := db.DoujinshiOrganizedByGalleryID(database, v.HolyNumbers)
			if err != nil {
				fmt.Println("Failed to check if its organized")
				continue
			}
			if organized {
				continue
			}
		}

		fmt.Println()
		downloadRoute := strings.TrimSpace(rootURL + "/g/" + v.HolyNumbers + "/download")
		fmt.Println("Going to download: ", downloadRoute)
		titleName := v.Title
		err := n.DownloadTorrentFile(downloadRoute, titleName, http_config)
		if err != nil {
			fmt.Println("FAILED TO DOWNLOAD:", downloadRoute)
			continue
		}
		fmt.Println("Downloaded: ", titleName)

		if saveMetadata {
			exist, err := db.DoujinshiExistsByGalleryID(database, v.HolyNumbers)
			if err != nil {
				fmt.Println("Failed to check if doujin exist in db", v.HolyNumbers)
				continue
			}

			if !exist {
				pageRoute := rootURL + "/g/" + v.HolyNumbers + "/"
				html_page, err := n.GetPageHTML(pageRoute, http_config)
				if err != nil {
					fmt.Println("Failed to get html page for ",
						v.Title, v.HolyNumbers)
					continue
				}

				metaData, err := n.GetMetaDataFromPage(html_page)
				if err != nil {
					fmt.Print(err)
					continue
				}

				err = db.InsertDoujinshiWithMetadata(database, metaData, 1)
				if err != nil {
					fmt.Println("Failed to insert metadata for", v.Title, ":", err)
					continue
				}

				fmt.Println("Saved metadata for: ", metaData.Title)
			}

		}

		time.Sleep(3 * time.Second)
	}

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
	downloaded := make(map[string]bool)
	for _, entry := range entries {
		downloaded[sanitizeToFilename(entry.Name())] = true
	}

	var synced []string
	var stillPending []string
	for _, d := range pending {
		sanatized := sanitizeToFilename(d.Title)
		if downloaded[sanatized] {
			_ = db.UpdatePendingState(database, d.GalleryID, 0)
			synced = append(synced, d.Title)
		} else {
			stillPending = append(stillPending, sanatized)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"synced":       synced,
		"stillPending": stillPending,
	})

}

// The downloaded file != title, need to sanatize it
// This is how to map the title to the sanatized file that is stored in the doujins directory
func sanitizeToFilename(s string) string {
	// Convert to lowercase
	s = strings.ToLower(s)
	// Replace all punctuation (except spaces and underscores) with nothing
	s = strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsNumber(r) || r == ' ' || r == '_' {
			return r
		}
		return -1
	}, s)
	// Replace all spaces and underscores with a single underscore
	s = strings.ReplaceAll(s, " ", "_")
	s = strings.ReplaceAll(s, "__", "_")
	// Collapse multiple underscores
	re := regexp.MustCompile(`_+`)
	s = re.ReplaceAllString(s, "_")
	// Trim leading/trailing underscores
	s = strings.Trim(s, "_")
	return s
}

func getFolderNameFromGalleryID(database *sql.DB, galleryId string) (string, error) {
	fullTitle, err := db.GetNameFromGalleryId(database, galleryId)
	if err != nil {
		return "", fmt.Errorf("Failed to read the database")
	}

	entries, err := os.ReadDir("./doujinshi")
	if err != nil || len(entries) == 0 {
		return "", fmt.Errorf("Failed to read the doujinshi folder")
	}

	folderName := ""
	for _, entry := range entries {
		if sanitizeToFilename(fullTitle) == sanitizeToFilename(entry.Name()) {
			folderName = entry.Name()
			break
		}
	}

	if folderName == "" {
		return "", fmt.Errorf("Failed to find matching title in doujins folders")
	}

	return folderName, nil

}
