package db

import "time"

type Doujinshi struct {
	ID         int64  `json:"id"`
	Source     string `json:"source"`
	ExternalID string `json:"externalId"`
	FolderName string `json:"folderName"`
	OCount     int    `json:"oCount"`

	Title      string    `json:"title"`
	Tags       []string  `json:"tags"`
	Artists    []string  `json:"artists"`
	Characters []string  `json:"characters"`
	Parodies   []string  `json:"parodies"`
	Groups     []string  `json:"groups"`
	Languages  []string  `json:"languages"`
	Categories []string  `json:"categories"`
	Pages      string    `json:"pages"`
	Uploaded   time.Time `json:"uploaded"`

	Progress *DoujinshiProgress `json:"progress,omitempty"`
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

type DoujinshiProgress struct {
	DoujinshiID int64 `json:"doujinshiId"`
	Rating      *int  `json:"rating"`   // nullable
	LastPage    *int  `json:"lastPage"` // nullable
}
