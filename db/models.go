package db

import "time"

type Doujinshi struct {
	ID         int64  // database id
	Source     string // n
	ExternalID string // example: galleryId for n
	FolderName string // used to determine the FolderName on disk

	Title      string
	Tags       []string
	Artists    []string
	Characters []string
	Parodies   []string
	Groups     []string
	Languages  []string
	Categories []string
	Pages      string
	Uploaded   time.Time
}

type DoujinshiBookmark struct {
	ID          int64     `json:"id"`
	DoujinshiID int64     `json:"doujinshiId"`
	Filename    string    `json:"filename"`
	Name        string    `json:"name"`
	CreatedAt   time.Time `json:"createdAt"`
}

type DoujinshiPageO struct {
	DoujinshiID int64  `json:"id"`
	Filename    string `json:"filename"`
	OCount      int    `json:"ocount"`
}
