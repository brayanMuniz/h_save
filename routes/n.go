package routes

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/n"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

const rootURL = "https://nhentai.net"

type DownloadResult struct {
	TotalProcessed int      `json:"totalProcessed"`
	Downloaded     []string `json:"downloaded"`
	MetadataSaved  []string `json:"metadataSaved"`
	Skipped        []string `json:"skipped"`
	Failed         []string `json:"failed"`
	PagesProcessed int      `json:"pagesProcessed"`
}

func DownloadAllFavorites(
	c *gin.Context,
	httpConfig n.HTTPConfig,
	database *sql.DB,
	saveMetadata bool,
	skipOrganized bool,
	startPage int,
	maxPages int) DownloadResult {

	result := DownloadResult{
		Downloaded:    make([]string, 0),
		MetadataSaved: make([]string, 0),
		Skipped:       make([]string, 0),
		Failed:        make([]string, 0),
	}

	page := startPage
	pagesProcessed := 0

	for pagesProcessed < maxPages {
		log.Println("Downloading page: ", page)
		favoritesRoute := fmt.Sprintf("%s/favorites/?page=%d", rootURL, page)
		htmlPage, err := n.GetPageHTML(favoritesRoute, httpConfig)
		if err != nil {
			// Log error but continue - might be network issue
			fmt.Printf("Failed to get page %d: %v\n", page, err)
			break
		}

		listOfFavorites, err := n.GetListOfFavoritesFromHTML(htmlPage)
		if err != nil {
			fmt.Printf("Failed to parse page %d: %v\n", page, err)
			break
		}

		// reached the end
		if len(listOfFavorites) == 0 {
			break
		}

		processFavoritesPage(listOfFavorites, rootURL, httpConfig, database,
			saveMetadata, skipOrganized, &result)

		result.PagesProcessed++
		pagesProcessed++
		page++

		time.Sleep(2 * time.Second)
	}

	result.TotalProcessed = len(result.Downloaded) + len(result.Skipped) + len(result.Failed)
	return result
}

func processFavoritesPage(
	favorites []n.FavoriteData,
	rootURL string,
	httpConfig n.HTTPConfig,
	database *sql.DB,
	saveMetadata bool,
	skipOrganized bool,
	result *DownloadResult) {

	for _, v := range favorites {
		if skipOrganized {
			organized, err := db.DoujinshiOrganizedList(database, "nhentai", v.HolyNumbers)
			if err != nil {
				fmt.Println("Failed to check if organized:", v.Title)
				result.Failed = append(result.Failed, v.Title)
				continue
			}
			if organized {
				result.Skipped = append(result.Skipped, v.Title)
				continue
			}
		}

		// Download torrent
		downloadRoute := fmt.Sprintf("%s/g/%s/download", rootURL, v.HolyNumbers)
		err := n.DownloadTorrentFile(downloadRoute, v.Title, httpConfig)
		if err != nil {
			fmt.Printf("Failed to download %s: %v\n", v.Title, err)
			result.Failed = append(result.Failed, v.Title)
			continue
		} else {
			fmt.Println("Downloaded torrent file: ", v.Title)
		}

		result.Downloaded = append(result.Downloaded, v.Title)

		// Handle metadata if requested
		if saveMetadata {
			if saveMetadataForItem(v, rootURL, httpConfig, database) {
				result.MetadataSaved = append(result.MetadataSaved, v.Title)
			} else {
				// If metadata saving failed, we don't consider it a complete failure
				// since the download succeeded
				fmt.Printf("Downloaded %s but failed to save metadata\n", v.Title)
			}
		}

		time.Sleep(5 * time.Second)
	}
}

func saveMetadataForItem(
	favorite n.FavoriteData,
	rootURL string,
	httpConfig n.HTTPConfig,
	database *sql.DB) bool {

	exists, err := db.DoujinshiExists(database, "nhentai", favorite.HolyNumbers)
	if err != nil {
		fmt.Printf("Failed to check if doujinshi exists for %s: %v\n",
			favorite.Title, err)
		return false
	}

	// If it already exists, no need to save metadata again
	if exists {
		fmt.Printf("Metadata already exists for: %s\n", favorite.Title)
		return true
	}

	pageRoute := fmt.Sprintf("%s/g/%s/", rootURL, favorite.HolyNumbers)
	htmlPage, err := n.GetPageHTML(pageRoute, httpConfig)
	if err != nil {
		fmt.Printf("Failed to get HTML page for %s (%s): %v\n",
			favorite.Title, favorite.HolyNumbers, err)
		return false
	}

	metaData, err := n.GetMetaDataFromPage(htmlPage)
	if err != nil {
		fmt.Printf("Failed to parse metadata for %s: %v\n", favorite.Title, err)
		return false
	}

	err = db.InsertDoujinshiWithMetadata(database, metaData, "")
	if err != nil {
		fmt.Printf("Failed to insert metadata for %s: %v\n", favorite.Title, err)
		return false
	}

	fmt.Printf("Successfully saved metadata for: %s\n", metaData.Title)
	return true
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

	if len(listOfFavorites) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "At the end of the favorites page"})
		return
	}

	var downloaded []string
	var skipped []string
	var failed []string
	var metadataSaved []string

	for _, v := range listOfFavorites {
		if skipOrganized {
			organized, err := db.DoujinshiOrganizedList(
				database,
				"nhentai",
				v.HolyNumbers)
			if err != nil {
				fmt.Println("Failed to check if its organized")
				failed = append(failed, v.Title)
				continue
			}
			if organized {
				skipped = append(skipped, v.Title)
				continue
			}
		}

		downloadRoute := strings.TrimSpace(rootURL + "/g/" + v.HolyNumbers + "/download")
		fmt.Println("Going to download: ", downloadRoute)
		titleName := v.Title
		err := n.DownloadTorrentFile(downloadRoute, titleName, http_config)
		if err != nil {
			fmt.Println("FAILED TO DOWNLOAD:", downloadRoute)
			failed = append(failed, v.Title)
			continue
		}
		fmt.Println("Downloaded: ", titleName)
		downloaded = append(downloaded, v.Title)

		if saveMetadata {
			exist, err := db.DoujinshiExists(database, "nhentai", v.HolyNumbers)
			if err != nil {
				fmt.Println("Failed to check if doujin exist in db", v.HolyNumbers)
				failed = append(failed, v.Title)
				continue
			}

			if !exist {
				pageRoute := rootURL + "/g/" + v.HolyNumbers + "/"
				html_page, err := n.GetPageHTML(pageRoute, http_config)
				if err != nil {
					fmt.Println("Failed to get html page for ", v.Title, v.HolyNumbers)
					failed = append(failed, v.Title)
					continue
				}

				metaData, err := n.GetMetaDataFromPage(html_page)
				if err != nil {
					fmt.Print(err)
					failed = append(failed, v.Title)
					continue
				}

				err = db.InsertDoujinshiWithMetadata(database, metaData, "")
				if err != nil {
					fmt.Println("Failed to insert metadata for", v.Title, ":", err)
					failed = append(failed, v.Title)
					continue
				}

				fmt.Println("Saved metadata for: ", metaData.Title)
				metadataSaved = append(metadataSaved, metaData.Title)
			}
		}

		time.Sleep(5 * time.Second)
	}

	c.JSON(http.StatusOK, gin.H{
		"downloaded":    downloaded,
		"skipped":       skipped,
		"failed":        failed,
		"metadataSaved": metadataSaved,
	})
}
