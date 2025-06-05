package db

import (
	"database/sql"
)

type TagData struct {
	ID            int64    `json:"id"`
	Name          string   `json:"name"`
	IsFavorite    bool     `json:"isFavorite"`
	DoujinCount   int      `json:"doujinCount"`
	TotalOCount   int64    `json:"totalOCount"`
	AverageRating *float64 `json:"averageRating"`
}

func GetAllTags(db *sql.DB) ([]TagData, error) {
	favoriteTagsSet := make(map[int64]bool)
	favQuery := `SELECT tag_id FROM favorite_tags`
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
		favoriteTagsSet[favID] = true
	}
	if err = favRows.Err(); err != nil {
		return nil, err
	}

	mainQuery := `
	SELECT
		t.id,
		t.name,
		COALESCE(COUNT(DISTINCT d.id), 0) AS doujin_count,
		COALESCE(SUM(d_ocount.total_o_for_doujin), 0) AS total_tag_ocount,
		AVG(CASE WHEN dp.rating IS NOT NULL AND dp.rating > 0 THEN dp.rating ELSE NULL END) AS average_rating
	FROM
		tags t
	LEFT JOIN
		doujinshi_tags dt ON t.id = dt.tag_id
	LEFT JOIN
		doujinshi d ON dt.doujinshi_id = d.id AND d.folder_name IS NOT NULL AND d.folder_name != ''
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
		t.id, t.name
	ORDER BY
		t.name ASC;
	`

	allRows, err := db.Query(mainQuery)
	if err != nil {
		return nil, err
	}
	defer allRows.Close()

	var results []TagData
	for allRows.Next() {
		var tagID int64
		var tagName string
		var doujinCount int
		var totalOCount int64
		var avgRating sql.NullFloat64

		if err := allRows.Scan(&tagID, &tagName, &doujinCount, &totalOCount, &avgRating); err != nil {
			return nil, err
		}

		_, isFav := favoriteTagsSet[tagID]

		var avgRatingPtr *float64
		if avgRating.Valid {
			avgRatingPtr = &avgRating.Float64
		}

		results = append(results, TagData{
			ID:            tagID,
			Name:          tagName,
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

func GetTagIDByName(db *sql.DB, tagName string) (int64, error) {
	var tagID int64
	query := `SELECT id FROM tags WHERE LOWER(name) = LOWER(?)`
	err := db.QueryRow(query, tagName).Scan(&tagID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, sql.ErrNoRows // Explicitly return no rows error
		}
		return 0, err
	}
	return tagID, nil
}

func GetTagDetails(db *sql.DB, tagID int64) (*TagData, error) {
	var isFavorite bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM favorite_tags WHERE tag_id = ?)`,
		tagID,
	).Scan(&isFavorite)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	query := `
	SELECT
		t.id,
		t.name,
		COALESCE(COUNT(DISTINCT d.id), 0) AS doujin_count,
		COALESCE(SUM(d_ocount.total_o_for_doujin), 0) AS total_tag_ocount,
		AVG(CASE WHEN dp.rating IS NOT NULL AND dp.rating > 0 THEN dp.rating ELSE NULL END) AS average_rating
	FROM
		tags t
	LEFT JOIN
		doujinshi_tags dt ON t.id = dt.tag_id
	LEFT JOIN
		doujinshi d ON dt.doujinshi_id = d.id AND d.folder_name IS NOT NULL AND d.folder_name != ''
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
		t.id = ?
	GROUP BY
		t.id, t.name;
	`
	var tagInfo TagData
	var avgRating sql.NullFloat64

	err = db.QueryRow(query, tagID).Scan(
		&tagInfo.ID,
		&tagInfo.Name,
		&tagInfo.DoujinCount,
		&tagInfo.TotalOCount,
		&avgRating,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Tag not found
	} else if err != nil {
		return nil, err
	}

	tagInfo.IsFavorite = isFavorite
	if avgRating.Valid {
		tagInfo.AverageRating = &avgRating.Float64
	}

	return &tagInfo, nil
}

func GetDoujinshiByTag(db *sql.DB, tagID int64) ([]Doujinshi, error) {
	query := `
		SELECT d.id, d.source, d.external_id, d.title, d.pages, d.uploaded, d.folder_name
		FROM doujinshi d
		JOIN doujinshi_tags dt ON d.id = dt.doujinshi_id
		WHERE dt.tag_id = ? AND d.folder_name IS NOT NULL AND d.folder_name != ''
		ORDER BY d.uploaded DESC, d.title ASC
	`
	rows, err := db.Query(query, tagID)
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
