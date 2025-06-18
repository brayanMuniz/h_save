package db

import "time"

type Image struct {
	ID         int64     `json:"id"`
	Source     string    `json:"source"`
	ExternalID string    `json:"external_id"`
	Filename   string    `json:"filename"`
	FilePath   string    `json:"file_path"`
	FileSize   int64     `json:"file_size"`
	Width      int       `json:"width"`
	Height     int       `json:"height"`
	Format     string    `json:"format"`
	Uploaded   time.Time `json:"uploaded"`
	Hash       string    `json:"hash"`

	// Metadata
	Tags       []string `json:"tags"`
	Artists    []string `json:"artists"`
	Characters []string `json:"characters"`
	Parodies   []string `json:"parodies"`
	Groups     []string `json:"groups"`
	Categories []string `json:"categories"`

	// Progress
	Rating    int `json:"rating"`
	OCount    int `json:"o_count"`
	ViewCount int `json:"view_count"`
}
