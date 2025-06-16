package n

import (
	"fmt"
	"github.com/PuerkitoBio/goquery"
	"github.com/brayanMuniz/h_save/db"
	"log"
	"strings"
	"time"
)

type FavoriteData struct {
	HolyNumbers string
	Title       string
}

func GetListOfFavoritesFromHTML(html_page string) ([]FavoriteData, error) {
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
				HolyNumbers: dataID,
				Title:       caption,
			}
			favorites_list = append(favorites_list, entry)
		} else {
			fmt.Println("Could not find holy_number")
		}
	})

	return favorites_list, nil
}

func GetMetaDataFromPage(html_page string) (db.Doujinshi, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html_page))
	if err != nil {
		log.Fatal(err)
	}

	beforeTitle := doc.Find("#info .title .before").First().Text()
	mainTitle := doc.Find("#info .title .pretty").First().Text()
	afterTitle := doc.Find("#info .title .after").First().Text()
	fullTitle := beforeTitle + mainTitle + afterTitle

	beforeSecondTitle := doc.Find("#info h2.title .before").First().Text()
	mainSecondTitle := doc.Find("#info h2.title .pretty").First().Text()
	afterSecondTitle := doc.Find("#info h2.title .after").First().Text()
	fullSecondTitle := beforeSecondTitle + mainSecondTitle + afterSecondTitle

	galleryId := ""
	doc.Find("h3#gallery_id").Each(func(i int, s *goquery.Selection) {
		s.Contents().Each(func(j int, node *goquery.Selection) {
			if goquery.NodeName(node) == "#text" {
				text := strings.TrimSpace(node.Text())
				if text != "" {
					galleryId = text
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
			s.Find("span.tags a.tag").Each(func(i int, tagSel *goquery.Selection) {
				name := tagSel.Find("span.name").Text()
				if name != "" {
					parodiesList = append(parodiesList, name)
				}
			})

		}

		if label == "Characters:" && !isHidden {
			s.Find("span.tags a.tag").Each(func(i int, tagSel *goquery.Selection) {
				name := tagSel.Find("span.name").Text()
				if name != "" {
					charactersList = append(charactersList, name)
				}
			})
		}

		if label == "Tags:" && !isHidden {
			s.Find("span.tags a.tag").Each(func(i int, tagSel *goquery.Selection) {
				name := tagSel.Find("span.name").Text()
				if name != "" {
					tagsList = append(tagsList, name)
				}
			})
		}

		if label == "Artists:" && !isHidden {
			s.Find("span.tags a.tag").Each(func(i int, tagSel *goquery.Selection) {
				name := tagSel.Find("span.name").Text()
				if name != "" {
					artistList = append(artistList, name)
				}
			})
		}

		if label == "Groups:" && !isHidden {
			s.Find("span.tags a.tag").Each(func(i int, tagSel *goquery.Selection) {
				name := tagSel.Find("span.name").Text()
				if name != "" {
					groupsList = append(groupsList, name)
				}
			})
		}

		if label == "Languages:" && !isHidden {
			s.Find("span.tags a.tag").Each(func(i int, tagSel *goquery.Selection) {
				name := tagSel.Find("span.name").Text()
				if name != "" {
					languagesList = append(languagesList, name)
				}
			})
		}

		if label == "Categories:" && !isHidden {
			s.Find("span.tags a.tag").Each(func(i int, tagSel *goquery.Selection) {
				name := tagSel.Find("span.name").Text()
				if name != "" {
					categoriesList = append(categoriesList, name)
				}
			})
		}

		if label == "Pages:" && !isHidden {
			pages = s.Find("span.tags a.tag span.name").First().Text()
		}

		if label == "Uploaded:" && !isHidden {
			timeElem := s.Find("span.tags time.nobold")
			datetimeStr, exists := timeElem.Attr("datetime")
			if exists {
				uploaded, err = time.Parse(time.RFC3339Nano, datetimeStr)
				if err != nil {
					fmt.Println("Was not able to parse time!")
				}
			}
		}

	})

	return db.Doujinshi{
		Source:     "nhentai",
		ExternalID: strings.TrimSpace(galleryId),

		Title:       strings.TrimSpace(fullTitle),
		SecondTitle: strings.TrimSpace(fullSecondTitle),
		Tags:        trimSlice(tagsList),
		Artists:     trimSlice(artistList),
		Characters:  trimSlice(charactersList),
		Parodies:    trimSlice(parodiesList),
		Groups:      trimSlice(groupsList),
		Languages:   trimSlice(languagesList),
		Categories:  trimSlice(categoriesList),
		Pages:       strings.TrimSpace(pages),
		Uploaded:    uploaded,
	}, nil

}

func trimSlice(slice []string) []string {
	trimmed := make([]string, 0, len(slice))
	for _, s := range slice {
		t := strings.TrimSpace(s)
		if t != "" {
			trimmed = append(trimmed, t)
		}
	}
	return trimmed
}

func ReturnUserNameFromHTML(html_page string) (string, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html_page))
	if err != nil {
		return "", err
	}
	userName := doc.Find(".username").First().Text()
	return userName, nil
}
