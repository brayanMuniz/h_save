package db

import (
	"database/sql"
)

type ArtistData struct {
	ID            int64    `json:"id"`
	Name          string   `json:"name"`
	IsFavorite    bool     `json:"isFavorite"`
	DoujinCount   int      `json:"doujinCount"`
	TotalOCount   int64    `json:"totalOCount"`
	AverageRating *float64 `json:"averageRating"`
}

func GetAllArtist(db *sql.DB) ([]ArtistData, error) {
	favoriteArtistsSet := make(map[string]bool)
	favQuery := `SELECT a.name FROM favorite_artists fa JOIN artists a ON fa.artist_id = a.id`
	favRows, err := db.Query(favQuery)
	if err != nil {
		return nil, err
	}

	for favRows.Next() {
		var favName string
		if err := favRows.Scan(&favName); err != nil {
			favRows.Close()
			return nil, err
		}
		favoriteArtistsSet[favName] = true
	}
	if err = favRows.Err(); err != nil {
		favRows.Close()
		return nil, err
	}
	favRows.Close() // Close after successful iteration

	mainQuery := `
	SELECT
		a.id, 
		a.name,
		COALESCE(COUNT(DISTINCT d.id), 0) AS doujin_count,
		COALESCE(SUM(d_ocount.total_o_for_doujin), 0) AS total_artist_ocount,
		AVG(CASE WHEN dp.rating IS NOT NULL AND dp.rating > 0 THEN dp.rating ELSE NULL END) AS average_rating
	FROM
		artists a
	LEFT JOIN
		doujinshi_artists da ON a.id = da.artist_id
	LEFT JOIN
		doujinshi d ON da.doujinshi_id = d.id AND d.folder_name IS NOT NULL AND d.folder_name != ''
	LEFT JOIN
		(SELECT 
			 po.doujinshi_id, 
			 SUM(po.o_count) AS total_o_for_doujin 
		 FROM doujinshi_page_o po 
		 GROUP BY po.doujinshi_id
		) d_ocount ON d.id = d_ocount.doujinshi_id
	LEFT JOIN
		doujinshi_progress dp ON d.id = dp.doujinshi_id
	GROUP BY
		a.id, a.name
	ORDER BY
		a.name ASC;
	`

	allRows, err := db.Query(mainQuery)
	if err != nil {
		return nil, err
	}
	defer allRows.Close()

	var results []ArtistData
	for allRows.Next() {
		var artistID int64
		var artistName string
		var doujinCount int
		var totalOCount int64
		var avgRating sql.NullFloat64

		if err := allRows.Scan(&artistID, &artistName, &doujinCount, &totalOCount, &avgRating); err != nil {
			return nil, err
		}

		_, isFav := favoriteArtistsSet[artistName]

		var avgRatingPtr *float64
		if avgRating.Valid {
			avgRatingPtr = &avgRating.Float64
		}

		results = append(results, ArtistData{
			ID:            artistID,
			Name:          artistName,
			IsFavorite:    isFav,
			DoujinCount:   doujinCount,
			TotalOCount:   totalOCount,
			AverageRating: avgRatingPtr,
		})
	}
	if err = allRows.Err(); err != nil {
		return nil, err
	}

	return results, nil
}

func GetArtistDetails(db *sql.DB, artistID int64) (*ArtistData, error) {
	// Check if the artist is a favorite
	var isFavorite bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM favorite_artists WHERE artist_id = ?)`,
		artistID,
	).Scan(&isFavorite)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	query := `
	SELECT
		a.id,
		a.name,
		COALESCE(COUNT(DISTINCT d.id), 0) AS doujin_count,
		COALESCE(SUM(d_ocount.total_o_for_doujin), 0) AS total_artist_ocount,
		AVG(CASE WHEN dp.rating IS NOT NULL AND dp.rating > 0 THEN dp.rating ELSE NULL END) AS average_rating
	FROM
		artists a
	LEFT JOIN
		doujinshi_artists da ON a.id = da.artist_id
	LEFT JOIN
		doujinshi d ON da.doujinshi_id = d.id AND d.folder_name IS NOT NULL AND d.folder_name != ''
	LEFT JOIN
		(SELECT 
			 po.doujinshi_id, 
			 SUM(po.o_count) AS total_o_for_doujin 
		 FROM doujinshi_page_o po 
		 GROUP BY po.doujinshi_id
		) d_ocount ON d.id = d_ocount.doujinshi_id
	LEFT JOIN
		doujinshi_progress dp ON d.id = dp.doujinshi_id
	WHERE
		a.id = ?
	GROUP BY
		a.id, a.name;
	`
	var artistInfo ArtistData
	var avgRating sql.NullFloat64

	err = db.QueryRow(query, artistID).Scan(
		&artistInfo.ID,
		&artistInfo.Name,
		&artistInfo.DoujinCount,
		&artistInfo.TotalOCount,
		&avgRating,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Artist not found, return nil, nil to indicate this
	} else if err != nil {
		// log.Printf("Error querying details for artist ID %d: %v", artistID, err)
		return nil, err
	}

	artistInfo.IsFavorite = isFavorite
	if avgRating.Valid {
		artistInfo.AverageRating = &avgRating.Float64
	}

	return &artistInfo, nil
}

func GetDoujinshiByArtist(db *sql.DB, artistID int64) ([]Doujinshi, error) {
	query := `
		SELECT d.id, d.source, d.external_id, d.title, d.pages, d.uploaded, d.folder_name
		FROM doujinshi d
		JOIN doujinshi_artists da ON d.id = da.doujinshi_id
		WHERE da.artist_id = ? AND d.folder_name IS NOT NULL AND d.folder_name != ''
		ORDER BY d.uploaded DESC, d.title ASC -- Example ordering
	`
	rows, err := db.Query(query, artistID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Doujinshi
	for rows.Next() {
		var d Doujinshi
		if err := rows.Scan(&d.ID, &d.Source, &d.ExternalID, &d.Title, &d.Pages,
			&d.Uploaded, &d.FolderName); err != nil {
			return nil, err
		}

		populateDoujinshiDetails(db, &d)
		results = append(results, d)

	}
	return results, nil
}

func GetArtistIDByName(db *sql.DB, artistName string) (int64, error) {
	var artistID int64
	query := `SELECT id FROM artists WHERE LOWER(name) = LOWER(?)`
	err := db.QueryRow(query, artistName).Scan(&artistID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, sql.ErrNoRows
		}
		return 0, err
	}
	return artistID, nil
}
