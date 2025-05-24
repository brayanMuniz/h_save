package main

import (
	"fmt"
	"github.com/brayanMuniz/h_save/n"
	"github.com/joho/godotenv"
	"log"
	"os"
	"strings"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	rootURL := os.Getenv("ROOT_URL")
	if rootURL != "" {
		fmt.Println("root url loaded")
	}

	csrftoken := os.Getenv("CSRF_TOKEN")
	if csrftoken != "" {
		fmt.Println("csrftoken loaded")
	}

	sessionid := os.Getenv("SESSION_ID")
	if sessionid != "" {
		fmt.Println("sessionid loaded")
	}

	userAgentString := os.Getenv("USER_AGENT_STRING")
	if userAgentString != "" {
		fmt.Println("user agent string loaded")
	}

	testFile := os.Getenv("TEST_FILE")
	if testFile != "" {
		fmt.Println("testfile loaded")
	}

	favoritesRoute := rootURL + "/favorites"

	html_page, err := n.GetPageHTML(favoritesRoute, csrftoken, sessionid)
	if err != nil {
		fmt.Print(err)
		return
	}

	list_of_favorites, err := n.GetListOfFavoritesFromHTML(html_page)
	if err != nil {
		fmt.Print(err)
		return
	}

	// if there is any data that I need that matches the favorites, get the data
	// for _, v := range list_of_favorites {
	// 	if v.Title == testFile {
	//
	// 		pageRoute := rootURL + "/g/" + v.HolyNumbers + "/"
	// 		html_page, err := n.GetPageHTML(pageRoute, csrftoken, sessionid)
	// 		if err != nil {
	// 			fmt.Println("Failed to get html page for ", v.Title, v.HolyNumbers)
	// 			return
	// 		}
	//
	// 		metaData, err := n.GetMetaDataFromPage(html_page)
	// 		if err != nil {
	// 			fmt.Print(err)
	// 			return
	// 		}
	//
	// 		n.PrintPageMetaData(metaData)
	//
	// 	}
	//
	// }

	// Download the first torrent file
	if len(list_of_favorites) > 0 {
		fmt.Println()
		downloadRoute := strings.TrimSpace(rootURL + "/g/" +
			list_of_favorites[0].HolyNumbers + "/download")

		fmt.Println("Going to download: ", downloadRoute)

		titleName := list_of_favorites[0].Title
		err := n.DownloadTorrentFile(downloadRoute, titleName, csrftoken, sessionid)
		if err != nil {
			fmt.Println(err)
			return
		}

		fmt.Println("Downloaded: ", titleName)
	}

}
