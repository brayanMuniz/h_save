package routes

import (
	"database/sql"
	"fmt"
	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/n"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
	"net/http"
	"strings"
	"time"
)

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

		time.Sleep(3 * time.Second)
	}

	c.JSON(http.StatusOK, gin.H{
		"downloaded":    downloaded,
		"skipped":       skipped,
		"failed":        failed,
		"metadataSaved": metadataSaved,
	})
}
