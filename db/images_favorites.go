package db

import (
	"database/sql"
	"time"
)

func AddFavoriteImage(db *sql.DB, imageID int64) error {
	_, err := db.Exec(`INSERT OR IGNORE INTO favorite_images (image_id, added_at) VALUES (?, ?)`,
		imageID, time.Now())
	return err
}

func RemoveFavoriteImage(db *sql.DB, imageID int64) error {
	_, err := db.Exec(`DELETE FROM favorite_images WHERE image_id = ?`, imageID)
	return err
}

func IsImageFavorited(db *sql.DB, imageID int64) (bool, error) {
	var exists bool
	err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM favorite_images WHERE image_id = ?)`,
		imageID).Scan(&exists)
	return exists, err
}

func GetFavoriteImages(db *sql.DB) ([]Image, error) {
	rows, err := db.Query(`
		SELECT i.id, COALESCE(i.source, '') as source, COALESCE(i.external_id, '') as external_id,
			i.filename, i.file_path, i.file_size, i.width, i.height, i.format, i.uploaded,
			COALESCE(i.hash, '') as hash
		FROM images i
		JOIN favorite_images fi ON i.id = fi.image_id
		ORDER BY fi.added_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Image
	for rows.Next() {
		var img Image
		if err := rows.Scan(&img.ID, &img.Source, &img.ExternalID,
			&img.Filename, &img.FilePath, &img.FileSize, &img.Width, &img.Height,
			&img.Format, &img.Uploaded, &img.Hash); err != nil {
			return nil, err
		}
		populateImageDetails(db, &img)
		results = append(results, img)
	}
	return results, nil
}
