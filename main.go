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
	"time"
)

type FavoriteData struct {
	holyNumbers string
	title       string
}

type PageMetaData struct {
	title      string
	galleryId  string
	characters []string
	parodies   []string
	tags       []string
	artists    []string
	groups     []string
	languages  []string
	categories []string
	pages      string
	uploaded   time.Time
}

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
	html_page, err := getPageHTML(favoritesRoute, csrftoken, sessionid)
	if err != nil {
		fmt.Print(err)
		return
	}

	list_of_favorites, err := getListOfFavoritesFromHTML(html_page)
	if err != nil {
		fmt.Print(err)
		return
	}
	for _, v := range list_of_favorites {
		fmt.Println(v.title, v.holyNumbers)
	}

	fmt.Println()
	fmt.Println("--- TESTING METADATA PARSING ---")

	if len(list_of_favorites) > 0 {
		test := list_of_favorites[0].holyNumbers
		pageRoute := rootURL + "/g/" + test + "/"
		html_page, err := getPageHTML(pageRoute, csrftoken, sessionid)
		if err != nil {
			fmt.Println("Failed to get html page for ", test)
			return
		}

		metaData, err := getMetaDataFromPage(html_page)
		if err != nil {
			fmt.Print(err)
			return
		}

		fmt.Print(metaData)

	}

}

func getListOfFavoritesFromHTML(html_page string) ([]FavoriteData, error) {
	favorites_list := make([]FavoriteData, 0)

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html_page))
	if err != nil {
		return favorites_list, err
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

	return favorites_list, nil
}

func getPageHTML(route, csrfToken, sessionId string) (string, error) {
	req, _ := http.NewRequest("GET", route, nil)
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

func getMetaDataFromPage(html_page string) (PageMetaData, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html_page))
	if err != nil {
		log.Fatal(err)
	}

	beforeTitle := doc.Find("#info .title .before").First().Text()
	mainTitle := doc.Find("#info .title .pretty").First().Text()
	fullTitle := beforeTitle + mainTitle
	fmt.Println("full title:", fullTitle)

	galleryId := ""
	doc.Find("h3#gallery_id").Each(func(i int, s *goquery.Selection) {
		s.Contents().Each(func(j int, node *goquery.Selection) {
			if goquery.NodeName(node) == "#text" {
				text := strings.TrimSpace(node.Text())
				if text != "" {
					galleryId = text
					fmt.Println("gallery id: ", galleryId)
				}
			}
		})
	})

	parodiesList := make([]string, 0)
	charactersList := make([]string, 0)
	tagsList := make([]string, 0)
	artistList := make([]string, 0)
	groupsList := make([]string, 0)
	languagesList := make([]string, 0)
	categoriesList := make([]string, 0)
	pages := ""
	uploaded := time.Time{}

	doc.Find("#tags div.tag-container.field-name").Each(func(i int, s *goquery.Selection) {
		label := strings.TrimSpace(s.Contents().First().Text())
		isHidden := s.HasClass("hidden")

		if label == "Parodies:" && !isHidden {
			// Extract parodies tags and append to parodiesList
		}
		if label == "Characters:" && !isHidden {
			// Extract character tags and append to charactersList
		}
	})

	return PageMetaData{
		title:      fullTitle,
		galleryId:  galleryId,
		parodies:   parodiesList,
		characters: charactersList,
		tags:       tagsList,
		artists:    artistList,
		groups:     groupsList,
		languages:  languagesList,
		categories: categoriesList,
		pages:      pages,
		uploaded:   uploaded,
	}, nil

}
