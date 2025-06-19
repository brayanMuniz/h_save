package db

import (
	"database/sql"
)

func UpdateImageRating(db *sql.DB, imageID int64, rating int) error {
	_, err := db.Exec(`
		INSERT OR REPLACE INTO image_progress (image_id, rating, o_count, view_count, last_viewed)
		VALUES (?, ?, COALESCE((SELECT o_count FROM image_progress WHERE image_id = ?), 0),
		        COALESCE((SELECT view_count FROM image_progress WHERE image_id = ?), 0),
		        COALESCE((SELECT last_viewed FROM image_progress WHERE image_id = ?), datetime('now')))
	`, imageID, rating, imageID, imageID, imageID)
	return err
}

func UpdateImageOCount(db *sql.DB, imageID int64, oCount int) error {
	_, err := db.Exec(`
		INSERT OR REPLACE INTO image_progress (image_id, o_count, rating, view_count, last_viewed)
		VALUES (?, ?, COALESCE((SELECT rating FROM image_progress WHERE image_id = ?), 0),
		        COALESCE((SELECT view_count FROM image_progress WHERE image_id = ?), 0),
		        COALESCE((SELECT last_viewed FROM image_progress WHERE image_id = ?), datetime('now')))
	`, imageID, oCount, imageID, imageID, imageID)
	return err
}

func IncrementImageViewCount(db *sql.DB, imageID int64) error {
	_, err := db.Exec(`
		INSERT OR REPLACE INTO image_progress (image_id, view_count, last_viewed, rating, o_count)
		VALUES (?, COALESCE((SELECT view_count FROM image_progress WHERE image_id = ?), 0) + 1,
		        datetime('now'),
		        COALESCE((SELECT rating FROM image_progress WHERE image_id = ?), 0),
		        COALESCE((SELECT o_count FROM image_progress WHERE image_id = ?), 0))
	`, imageID, imageID, imageID, imageID)
	return err
}

func GetImageProgress(db *sql.DB, imageID int64) (*ImageProgress, error) {
	var progress ImageProgress
	err := db.QueryRow(`
		SELECT image_id, COALESCE(rating, 0), COALESCE(o_count, 0), 
		       COALESCE(view_count, 0), last_viewed
		FROM image_progress WHERE image_id = ?
	`, imageID).Scan(&progress.ImageID, &progress.Rating, &progress.OCount,
		&progress.ViewCount, &progress.LastViewed)

	if err == sql.ErrNoRows {
		return &ImageProgress{ImageID: imageID}, nil
	}
	return &progress, err
}

type ImageProgress struct {
	ImageID    int64   `json:"image_id"`
	Rating     int     `json:"rating"`
	OCount     int     `json:"o_count"`
	ViewCount  int     `json:"view_count"`
	LastViewed *string `json:"last_viewed"`
}
