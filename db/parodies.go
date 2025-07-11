package db

import (
	"database/sql"
)

type ParodyData struct {
	ID            int64    `json:"id"`
	Name          string   `json:"name"`
	IsFavorite    bool     `json:"isFavorite"`
	DoujinCount   int      `json:"doujinCount"`
	TotalOCount   int64    `json:"totalOCount"`
	AverageRating *float64 `json:"averageRating"`
	ImageCount    int      `json:"imageCount"`
}

func GetAllParodies(db *sql.DB) ([]ParodyData, error) {
	favoriteParodiesSet := make(map[int64]bool)
	favQuery := `SELECT parody_id FROM favorite_parodies`
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
		favoriteParodiesSet[favID] = true
	}
	if err = favRows.Err(); err != nil {
		return nil, err
	}

	mainQuery := `
	SELECT
		p.id,
		p.name,
		COALESCE(COUNT(DISTINCT d.id), 0) AS doujin_count,
		COALESCE(SUM(d_ocount.total_o_for_doujin), 0) AS total_parody_ocount,
		AVG(CASE WHEN dp.rating IS NOT NULL AND dp.rating > 0 THEN dp.rating ELSE NULL END) AS average_rating,
		COALESCE(COUNT(DISTINCT ip.image_id), 0) AS image_count
	FROM
		parodies p
	LEFT JOIN
		doujinshi_parodies dpd ON p.id = dpd.parody_id
	LEFT JOIN
		doujinshi d ON dpd.doujinshi_id = d.id AND d.folder_name IS NOT NULL AND d.folder_name != ''
	LEFT JOIN
		(SELECT
			 po.doujinshi_id,
			 SUM(po.o_count) AS total_o_for_doujin
		 FROM doujinshi_page_o po
		 GROUP BY po.doujinshi_id
		) d_ocount ON d.id = d_ocount.doujinshi_id
	LEFT JOIN
		doujinshi_progress dp ON d.id = dp.doujinshi_id
	LEFT JOIN
		image_parodies ip ON p.id = ip.parody_id
	GROUP BY
		p.id, p.name
	ORDER BY
		p.name ASC;
	`

	allRows, err := db.Query(mainQuery)
	if err != nil {
		return nil, err
	}
	defer allRows.Close()

	var results []ParodyData
	for allRows.Next() {
		var parodyID int64
		var parodyName string
		var doujinCount int
		var totalOCount int64
		var avgRating sql.NullFloat64
		var imageCount int

		if err := allRows.Scan(&parodyID, &parodyName, &doujinCount, &totalOCount, &avgRating, &imageCount); err != nil {
			return nil, err
		}

		_, isFav := favoriteParodiesSet[parodyID]

		var avgRatingPtr *float64
		if avgRating.Valid {
			avgRatingPtr = &avgRating.Float64
		}

		results = append(results, ParodyData{
			ID:            parodyID,
			Name:          parodyName,
			IsFavorite:    isFav,
			DoujinCount:   doujinCount,
			TotalOCount:   totalOCount,
			AverageRating: avgRatingPtr,
			ImageCount:    imageCount,
		})
	}
	if err = allRows.Err(); err != nil {
		return nil, err
	}

	return results, nil
}

func GetParodyDetails(db *sql.DB, parodyID int64) (*ParodyData, error) {
	var isFavorite bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM favorite_parodies WHERE parody_id = ?)`,
		parodyID,
	).Scan(&isFavorite)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	query := `
	SELECT
		p.id,
		p.name,
		COALESCE(COUNT(DISTINCT d.id), 0) AS doujin_count,
		COALESCE(SUM(d_ocount.total_o_for_doujin), 0) AS total_parody_ocount,
		AVG(CASE WHEN dp.rating IS NOT NULL AND dp.rating > 0 THEN dp.rating ELSE NULL END) AS average_rating
	FROM
		parodies p
	LEFT JOIN
		doujinshi_parodies dpd ON p.id = dpd.parody_id
	LEFT JOIN
		doujinshi d ON dpd.doujinshi_id = d.id AND d.folder_name IS NOT NULL AND d.folder_name != ''
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
		p.id = ?
	GROUP BY
		p.id, p.name;
	`
	var parodyInfo ParodyData
	var avgRating sql.NullFloat64

	err = db.QueryRow(query, parodyID).Scan(
		&parodyInfo.ID,
		&parodyInfo.Name,
		&parodyInfo.DoujinCount,
		&parodyInfo.TotalOCount,
		&avgRating,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	parodyInfo.IsFavorite = isFavorite
	if avgRating.Valid {
		parodyInfo.AverageRating = &avgRating.Float64
	}

	return &parodyInfo, nil
}

func GetDoujinshiByParody(db *sql.DB, parodyID int64) ([]Doujinshi, error) {
	query := `
		SELECT d.id, d.source, d.external_id, d.title, d.pages, d.uploaded, d.folder_name
		FROM doujinshi d
		JOIN doujinshi_parodies dpd ON d.id = dpd.doujinshi_id
		WHERE dpd.parody_id = ? AND d.folder_name IS NOT NULL AND d.folder_name != ''
		ORDER BY d.uploaded DESC, d.title ASC
	`
	rows, err := db.Query(query, parodyID)
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

func GetParodyIDByName(db *sql.DB, parodyName string) (int64, error) {
	var parodyID int64
	query := `SELECT id FROM parodies WHERE LOWER(name) = LOWER(?)`
	err := db.QueryRow(query, parodyName).Scan(&parodyID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, sql.ErrNoRows
		}
		return 0, err
	}
	return parodyID, nil
}

func AddFavoriteParody(db *sql.DB, parodyID int64) error {
	_, err := db.Exec(`INSERT OR IGNORE INTO favorite_parodies (parody_id) VALUES (?)`, parodyID)
	return err
}

func RemoveFavoriteParody(db *sql.DB, parodyID int64) error {
	_, err := db.Exec(`DELETE FROM favorite_parodies WHERE parody_id = ?`, parodyID)
	return err
}

func GetImagesByParody(db *sql.DB, parodyID int64) ([]Image, error) {
	query := `
		SELECT i.id, COALESCE(i.source, '') as source, COALESCE(i.external_id, '') as external_id,
			i.filename, i.file_path, i.file_size, i.width, i.height, i.format, i.uploaded,
			COALESCE(i.hash, '') as hash
		FROM images i
		JOIN image_parodies ip ON i.id = ip.image_id
		WHERE ip.parody_id = ?
		ORDER BY i.uploaded DESC
	`
	rows, err := db.Query(query, parodyID)
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
