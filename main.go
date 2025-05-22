package main

import (
	"fmt"
	"github.com/PuerkitoBio/goquery"
	"github.com/joho/godotenv"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

type FavoriteData struct {
	holyNumbers string
	title       string
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	favoritesURL := os.Getenv("FAVORITES_URL")
	if favoritesURL != "" {
		fmt.Println("favorites url loaded")
	}

	csrftoken := os.Getenv("CSRF_TOKEN")
	if csrftoken != "" {
		fmt.Println("csrftoken loaded")
	}

	sessionid := os.Getenv("SESSION_ID")
	if sessionid != "" {
		fmt.Println("sessionid loaded")
	}

	html_page, err := getFavoritesHTML(favoritesURL, csrftoken, sessionid)
	if err != nil {
		fmt.Print(err)
	}

	list_of_favorites := getListOfFavoritesFromHTML(html_page)
	for _, v := range list_of_favorites {
		fmt.Println(v.title, v.holyNumbers)
	}

}

func getFavoritesHTML(favoritesURL, csrfToken, sessionId string) (string, error) {
	req, _ := http.NewRequest("GET", favoritesURL, nil)
	req.AddCookie(&http.Cookie{Name: "sessionid", Value: sessionId})
	req.AddCookie(&http.Cookie{Name: "csrftoken", Value: csrfToken})

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("Error was of status code 400+")
	}

	if !strings.Contains(resp.Header.Get("Content-Type"), "text/html") {
		return "", fmt.Errorf("Content-Type is not html")
	}

	htmlString, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(htmlString), nil
}

func getListOfFavoritesFromHTML(html_page string) []FavoriteData {
	favorites_list := make([]FavoriteData, 0)

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html_page))
	if err != nil {
		log.Fatal(err)
	}

	doc.Find("div.gallery-favorite").Each(func(i int, s *goquery.Selection) {
		dataID, exists := s.Attr("data-id")
		if exists {
			caption := s.Find("div.caption").Text()
			entry := FavoriteData{
				holyNumbers: dataID,
				title:       caption,
			}
			favorites_list = append(favorites_list, entry)
		} else {

			fmt.Println("Could not find holy_number")
		}
	})

	return favorites_list
}
