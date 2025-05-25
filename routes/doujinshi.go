package routes

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/brayanMuniz/h_save/n"
	"github.com/gin-gonic/gin"
)

func GetDoujinshi(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"doujinshi": []string{}})
}

func DownloadFavorites(c *gin.Context, rootURL string, pageStart string, http_config n.HTTPConfig) {
	favoritesRoute := rootURL + "/favorites" + "/?page=" + pageStart
	html_page, err := n.GetPageHTML(favoritesRoute, http_config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get favorites page"})
		return
	}

	listOfFavorites, err := n.GetListOfFavoritesFromHTML(html_page)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse favorites HTML"})
		return
	}

	// Out of bounds in the favorites page
	if len(listOfFavorites) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "At the end of the favorites page"})
		return
	}

	for _, v := range listOfFavorites {
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
		time.Sleep(3 * time.Second)
	}

}
