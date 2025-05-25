package db

import "time"

type Doujinshi struct {
	ID         int64
	Title      string
	GalleryID  string
	Pages      string
	Uploaded   time.Time
	Pending    int
	Tags       []string
	Artists    []string
	Characters []string
	Parodies   []string
	Groups     []string
	Languages  []string
	Categories []string
}
