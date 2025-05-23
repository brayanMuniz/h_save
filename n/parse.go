package n

import (
	"fmt"
	"github.com/PuerkitoBio/goquery"
	"log"
	"strings"
	"time"
)

type FavoriteData struct {
	HolyNumbers string
	Title       string
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

func GetMetaDataFromPage(html_page string) (PageMetaData, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html_page))
	if err != nil {
		log.Fatal(err)
	}

	beforeTitle := doc.Find("#info .title .before").First().Text()
	mainTitle := doc.Find("#info .title .pretty").First().Text()
	afterTitle := doc.Find("#info .title .after").First().Text()
	fullTitle := beforeTitle + mainTitle + afterTitle

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

	return PageMetaData{
		title:      strings.TrimSpace(fullTitle),
		galleryId:  strings.TrimSpace(galleryId),
		parodies:   trimSlice(parodiesList),
		characters: trimSlice(charactersList),
		tags:       trimSlice(tagsList),
		artists:    trimSlice(artistList),
		groups:     trimSlice(groupsList),
		languages:  trimSlice(languagesList),
		categories: trimSlice(categoriesList),
		pages:      strings.TrimSpace(pages),
		uploaded:   uploaded,
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

func PrintPageMetaData(meta PageMetaData) {
	fmt.Println("Title:      ", meta.title)
	fmt.Println("Gallery ID: ", meta.galleryId)
	fmt.Println("Pages:      ", meta.pages)
	fmt.Println("Uploaded:   ", meta.uploaded.Format(time.RFC3339))

	printList := func(label string, items []string) {
		if len(items) == 0 {
			fmt.Printf("%s: (none)\n", label)
		} else {
			fmt.Printf("%s:\n", label)
			for _, item := range items {
				fmt.Printf("  - %s\n", item)
			}
		}
	}

	printList("Characters", meta.characters)
	printList("Parodies", meta.parodies)
	printList("Tags", meta.tags)
	printList("Artists", meta.artists)
	printList("Groups", meta.groups)
	printList("Languages", meta.languages)
	printList("Categories", meta.categories)
}
