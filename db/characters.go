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

		if err := allRows.Scan(&charID, &charName, &doujinCount, &totalOCount, &avgRating); err != nil {
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
		})
	}
	if err = allRows.Err(); err != nil {
		return nil, err
	}

	return results, nil
}

func AddFavoriteCharacter(db *sql.DB, characterID int64) error {
	_, err := db.Exec(`INSERT OR IGNORE INTO favorite_characters (character_id) VALUES (?)`, characterID)
	return err
}

func RemoveFavoriteCharacter(db *sql.DB, characterID int64) error {
	_, err := db.Exec(`DELETE FROM favorite_characters WHERE character_id = ?`, characterID)
	return err
}
