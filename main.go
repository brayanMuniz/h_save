package main

import (
	"fmt"
	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/n"
	"regexp"
	"strings"
	// "github.com/brayanMuniz/h_save/routes"
	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"os"
)

func main() {
	fmt.Println("Creating daatabase ... ")
	database, err := db.InitDB("./h_save.db")
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()
	fmt.Println("Database created!")

	fmt.Println("Getting .env file ...")
	err = godotenv.Load()
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

	fmt.Println()

	entries, err := os.ReadDir("./doujinshi")
	if err != nil {
		fmt.Println("Error reading ./doujinshi directory:", err)
		return
	}

	downloaded := make(map[string]bool)
	for _, entry := range entries {
		fmt.Println(entry.Name())
		downloaded[entry.Name()] = true
	}

	http_config := n.HTTPConfig{
		CsrfToken:       csrftoken,
		SessionId:       sessionid,
		UserAgentString: userAgentString,
	}

	favoritesRoute := rootURL + "/favorites"
	html_page, err := n.GetPageHTML(favoritesRoute, http_config)
	if err != nil {
		fmt.Print(err)
		return
	}

	list_of_favorites, err := n.GetListOfFavoritesFromHTML(html_page)
	if err != nil {
		fmt.Print(err)
		return
	}

	// 1. fetch the metadata from the first entry in the favorites page
	// 2. add that to the database and set pending depending if you have it downloaded
	if len(list_of_favorites) > 0 {
		holyN := list_of_favorites[0].HolyNumbers
		tempTitle := list_of_favorites[0].Title

		pageRoute := rootURL + "/g/" + holyN + "/"
		html_page, err := n.GetPageHTML(pageRoute, http_config)
		if err != nil {
			fmt.Println("Failed to get html page for ", tempTitle, holyN)
			return
		}

		metaData, err := n.GetMetaDataFromPage(html_page)
		if err != nil {
			fmt.Print(err)
			return
		}

		pending := 1
		if downloaded[sanitizeToFilename(metaData.Title)] {
			pending = 0
		}

		err = db.InsertDoujinshiWithMetadata(database, metaData, pending)
		if err != nil {
			fmt.Println("Failed to insert metadata for", tempTitle, ":", err)
		}

	}

	fmt.Println()
	fmt.Println("All data from database")
	doujinshiList, err := db.GetAllDoujinshi(database)
	if err != nil {
		log.Fatal(err)
	}
	for _, d := range doujinshiList {
		fmt.Printf("%+v\n", d)
	}

	// if there is any data that I need that matches the favorites, get the data
	// for _, v := range list_of_favorites {
	// 	if v.Title == testFile {
	//
	// 		pageRoute := rootURL + "/g/" + v.HolyNumbers + "/"
	// 		html_page, err := n.GetPageHTML(pageRoute, http_config)
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

	// r := routes.SetupRouter(rootURL, http_config)
	// if err := r.Run(":8080"); err != nil {
	// 	log.Fatal("Failed to start server:", err)
	// }
}

// The downloaded file does not allow things like ? in them
func sanitizeToFilename(name string) string {
	re := regexp.MustCompile(`[<>:"/\\|?*]`)
	sanitized := re.ReplaceAllString(name, " ")
	sanitized = strings.TrimSpace(sanitized)
	sanitized = regexp.MustCompile(`_+`).ReplaceAllString(sanitized, "_")
	return sanitized
}
