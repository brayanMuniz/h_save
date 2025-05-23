package main

import (
	"fmt"
	"github.com/brayanMuniz/h_save/n"
	"github.com/joho/godotenv"
	"log"
	"os"
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

	fmt.Println()
	fmt.Println("--- TESTING METADATA PARSING ---")

	if len(list_of_favorites) > 0 {
		test := list_of_favorites[0].HolyNumbers
		pageRoute := rootURL + "/g/" + test + "/"
		html_page, err := n.GetPageHTML(pageRoute, csrftoken, sessionid)
		if err != nil {
			fmt.Println("Failed to get html page for ", test)
			return
		}

		metaData, err := n.GetMetaDataFromPage(html_page)
		if err != nil {
			fmt.Print(err)
			return
		}

		n.PrintPageMetaData(metaData)

	}

}
