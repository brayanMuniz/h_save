package db

import (
	"database/sql"
)

type CharacterData struct {
	ID            int64    `json:"id"`
	Name          string   `json:"name"`
	IsFavorite    bool     `json:"isFavorite"`
	DoujinCount   int      `json:"doujinCount"`
	TotalOCount   int64    `json:"totalOCount"`
	AverageRating *float64 `json:"averageRating"`
	ImageCount    int      `json:"imageCount"`
}

func GetAllCharacters(db *sql.DB) ([]CharacterData, error) {
	favoriteCharactersSet := make(map[int64]bool)
	favQuery := `SELECT character_id FROM favorite_characters`
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
		favoriteCharactersSet[favID] = true
	}
	if err = favRows.Err(); err != nil {
		return nil, err
	}

	mainQuery := `
	SELECT
		c.id,
		c.name,
		COALESCE(COUNT(DISTINCT d.id), 0) AS doujin_count,
		COALESCE(SUM(d_ocount.total_o_for_doujin), 0) AS total_character_ocount,
		AVG(CASE WHEN dp.rating IS NOT NULL AND dp.rating > 0 THEN dp.rating ELSE NULL END) AS average_rating,
		COALESCE(COUNT(DISTINCT ic.image_id), 0) AS image_count
	FROM
		characters c
	LEFT JOIN
		doujinshi_characters dc ON c.id = dc.character_id
	LEFT JOIN
		doujinshi d ON dc.doujinshi_id = d.id AND d.folder_name IS NOT NULL AND d.folder_name != ''
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
		image_characters ic ON c.id = ic.character_id
	GROUP BY
		c.id, c.name
	ORDER BY
		c.name ASC;
	`

	allRows, err := db.Query(mainQuery)
	if err != nil {
		return nil, err
	}
	defer allRows.Close()

	var results []CharacterData
	for allRows.Next() {
		var charID int64
		var charName string
		var doujinCount int
		var totalOCount int64
		var avgRating sql.NullFloat64
		var imageCount int

		if err := allRows.Scan(&charID, &charName, &doujinCount, &totalOCount, &avgRating, &imageCount); err != nil {
			return nil, err
		}

		_, isFav := favoriteCharactersSet[charID]

		var avgRatingPtr *float64
		if avgRating.Valid {
			avgRatingPtr = &avgRating.Float64
		}

		results = append(results, CharacterData{
			ID:            charID,
			Name:          charName,
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

func GetCharacterDetails(db *sql.DB, characterID int64) (*CharacterData, error) {
	var isFavorite bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM favorite_characters WHERE character_id = ?)`,
		characterID,
	).Scan(&isFavorite)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	query := `
	SELECT
		c.id,
		c.name,
		COALESCE(COUNT(DISTINCT d.id), 0) AS doujin_count,
		COALESCE(SUM(d_ocount.total_o_for_doujin), 0) AS total_character_ocount,
		AVG(CASE WHEN dp.rating IS NOT NULL AND dp.rating > 0 THEN dp.rating ELSE NULL END) AS average_rating
	FROM
		characters c
	LEFT JOIN
		doujinshi_characters dc ON c.id = dc.character_id
	LEFT JOIN
		doujinshi d ON dc.doujinshi_id = d.id AND d.folder_name IS NOT NULL AND d.folder_name != ''
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
		c.id = ?
	GROUP BY
		c.id, c.name;
	`
	var charInfo CharacterData
	var avgRating sql.NullFloat64

	err = db.QueryRow(query, characterID).Scan(
		&charInfo.ID,
		&charInfo.Name,
		&charInfo.DoujinCount,
		&charInfo.TotalOCount,
		&avgRating,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Character not found
	} else if err != nil {
		return nil, err
	}

	charInfo.IsFavorite = isFavorite
	if avgRating.Valid {
		charInfo.AverageRating = &avgRating.Float64
	}

	return &charInfo, nil
}

func GetDoujinshiByCharacter(db *sql.DB, characterID int64) ([]Doujinshi, error) {
	query := `
		SELECT d.id, d.source, d.external_id, d.title, d.pages, d.uploaded, d.folder_name
		FROM doujinshi d
		JOIN doujinshi_characters dc ON d.id = dc.doujinshi_id
		WHERE dc.character_id = ? AND d.folder_name IS NOT NULL AND d.folder_name != ''
		ORDER BY d.uploaded DESC, d.title ASC
	`
	rows, err := db.Query(query, characterID)
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

func GetCharacterIDByName(db *sql.DB, characterName string) (int64, error) {
	var characterID int64
	query := `SELECT id FROM characters WHERE LOWER(name) = LOWER(?)`
	err := db.QueryRow(query, characterName).Scan(&characterID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, sql.ErrNoRows
		}
		return 0, err
	}
	return characterID, nil
}

func AddFavoriteCharacter(db *sql.DB, characterID int64) error {
	_, err := db.Exec(`INSERT OR IGNORE INTO favorite_characters (character_id) VALUES (?)`, characterID)
	return err
}

func RemoveFavoriteCharacter(db *sql.DB, characterID int64) error {
	_, err := db.Exec(`DELETE FROM favorite_characters WHERE character_id = ?`, characterID)
	return err
}

func GetImagesByCharacter(db *sql.DB, characterID int64) ([]Image, error) {
	query := `
		SELECT i.id, COALESCE(i.source, '') as source, COALESCE(i.external_id, '') as external_id,
			i.filename, i.file_path, i.file_size, i.width, i.height, i.format, i.uploaded,
			COALESCE(i.hash, '') as hash
		FROM images i
		JOIN image_characters ic ON i.id = ic.image_id
		WHERE ic.character_id = ?
		ORDER BY i.uploaded DESC
	`
	rows, err := db.Query(query, characterID)
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
