package db

import (
	"database/sql"
)

type ImageArtistData struct {
	ID            int64    `json:"id"`
	Name          string   `json:"name"`
	IsFavorite    bool     `json:"isFavorite"`
	ImageCount    int      `json:"imageCount"`
	TotalOCount   int64    `json:"totalOCount"`
	AverageRating *float64 `json:"averageRating"`
}

func GetAllImageArtists(db *sql.DB) ([]ImageArtistData, error) {
	favoriteArtistsSet := make(map[int64]bool)
	favQuery := `SELECT artist_id FROM favorite_artists`
	favRows, err := db.Query(favQuery)
	if err != nil {
		return nil, err
	}
	defer favRows.Close()

	for favRows.Next() {
		var favID int64
		if err := favRows.Scan(&favID); err != nil {
			return nil, err
		}
		favoriteArtistsSet[favID] = true
	}

	mainQuery := `
	SELECT
		a.id, 
		a.name,
		COALESCE(COUNT(DISTINCT i.id), 0) AS image_count,
		COALESCE(SUM(ip.o_count), 0) AS total_artist_ocount,
		AVG(CASE WHEN ip.rating IS NOT NULL AND ip.rating > 0 THEN ip.rating ELSE NULL END) AS average_rating
	FROM
		artists a
	LEFT JOIN
		image_artists ia ON a.id = ia.artist_id
	LEFT JOIN
		images i ON ia.image_id = i.id
	LEFT JOIN
		image_progress ip ON i.id = ip.image_id
	GROUP BY
		a.id, a.name
	ORDER BY
		a.name ASC;
	`

	rows, err := db.Query(mainQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []ImageArtistData
	for rows.Next() {
		var artistID int64
		var artistName string
		var imageCount int
		var totalOCount int64
		var avgRating sql.NullFloat64

		if err := rows.Scan(&artistID, &artistName, &imageCount, &totalOCount, &avgRating); err != nil {
			return nil, err
		}

		_, isFav := favoriteArtistsSet[artistID]

		var avgRatingPtr *float64
		if avgRating.Valid {
			avgRatingPtr = &avgRating.Float64
		}

		results = append(results, ImageArtistData{
			ID:            artistID,
			Name:          artistName,
			IsFavorite:    isFav,
			ImageCount:    imageCount,
			TotalOCount:   totalOCount,
			AverageRating: avgRatingPtr,
		})
	}
	return results, nil
}

func GetImagesByArtist(db *sql.DB, artistID int64) ([]Image, error) {
	query := `
		SELECT i.id, COALESCE(i.source, '') as source, COALESCE(i.external_id, '') as external_id,
			i.filename, i.file_path, i.file_size, i.width, i.height, i.format, i.uploaded,
			COALESCE(i.hash, '') as hash
		FROM images i
		JOIN image_artists ia ON i.id = ia.image_id
		WHERE ia.artist_id = ?
		ORDER BY i.uploaded DESC
	`
	rows, err := db.Query(query, artistID)
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
