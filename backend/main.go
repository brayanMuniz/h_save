package main

import (
	"fmt"
	"github.com/brayanMuniz/h_save/n"
	"github.com/brayanMuniz/h_save/routes"
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

	userAgentString := os.Getenv("USER_AGENT_STRING")
	if userAgentString != "" {
		fmt.Println("user agent string loaded")
	}

	testFile := os.Getenv("TEST_FILE")
	if testFile != "" {
		fmt.Println("testfile loaded")
	}

	favoritesRoute := rootURL + "/favorites"

	http_config := n.HTTPConfig{
		CsrfToken:       csrftoken,
		SessionId:       sessionid,
		UserAgentString: userAgentString,
	}

	html_page, err := n.GetPageHTML(favoritesRoute, http_config)
	if err != nil {
		fmt.Print(err)
		return
	}

	_, err = n.GetListOfFavoritesFromHTML(html_page)
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

	r := routes.SetupRouter(rootURL, http_config)
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
