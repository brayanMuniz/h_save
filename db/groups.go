package db

import (
	"database/sql"
)

// GroupData holds aggregated information for a single group.
type GroupData struct {
	ID            int64    `json:"id"`
	Name          string   `json:"name"`
	IsFavorite    bool     `json:"isFavorite"`
	DoujinCount   int      `json:"doujinCount"`
	TotalOCount   int64    `json:"totalOCount"`
	AverageRating *float64 `json:"averageRating"`
}

func GetAllGroups(db *sql.DB) ([]GroupData, error) {
	favoriteGroupsSet := make(map[int64]bool)
	favQuery := `SELECT group_id FROM favorite_groups`
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
		favoriteGroupsSet[favID] = true
	}
	if err = favRows.Err(); err != nil {
		return nil, err
	}

	mainQuery := `
	SELECT
		g.id,
		g.name,
		COALESCE(COUNT(DISTINCT d.id), 0) AS doujin_count,
		COALESCE(SUM(d_ocount.total_o_for_doujin), 0) AS total_group_ocount,
		AVG(CASE WHEN dp.rating IS NOT NULL AND dp.rating > 0 THEN dp.rating ELSE NULL END) AS average_rating
	FROM
		groups g
	LEFT JOIN
		doujinshi_groups dg ON g.id = dg.group_id
	LEFT JOIN
		doujinshi d ON dg.doujinshi_id = d.id AND d.folder_name IS NOT NULL AND d.folder_name != ''
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
		g.id, g.name
	ORDER BY
		g.name ASC;
	`

	allRows, err := db.Query(mainQuery)
	if err != nil {
		return nil, err
	}
	defer allRows.Close()

	var results []GroupData
	for allRows.Next() {
		var groupID int64
		var groupName string
		var doujinCount int
		var totalOCount int64
		var avgRating sql.NullFloat64

		if err := allRows.Scan(&groupID, &groupName, &doujinCount, &totalOCount, &avgRating); err != nil {
			return nil, err
		}

		_, isFav := favoriteGroupsSet[groupID]

		var avgRatingPtr *float64
		if avgRating.Valid {
			avgRatingPtr = &avgRating.Float64
		}

		results = append(results, GroupData{
			ID:            groupID,
			Name:          groupName,
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

func GetGroupDetails(db *sql.DB, groupID int64) (*GroupData, error) {
	var isFavorite bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM favorite_groups WHERE group_id = ?)`,
		groupID,
	).Scan(&isFavorite)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	query := `
	SELECT
		g.id,
		g.name,
		COALESCE(COUNT(DISTINCT d.id), 0) AS doujin_count,
		COALESCE(SUM(d_ocount.total_o_for_doujin), 0) AS total_group_ocount,
		AVG(CASE WHEN dp.rating IS NOT NULL AND dp.rating > 0 THEN dp.rating ELSE NULL END) AS average_rating
	FROM
		groups g
	LEFT JOIN
		doujinshi_groups dg ON g.id = dg.group_id
	LEFT JOIN
		doujinshi d ON dg.doujinshi_id = d.id AND d.folder_name IS NOT NULL AND d.folder_name != ''
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
		g.id = ?
	GROUP BY
		g.id, g.name;
	`
	var groupInfo GroupData
	var avgRating sql.NullFloat64

	err = db.QueryRow(query, groupID).Scan(
		&groupInfo.ID,
		&groupInfo.Name,
		&groupInfo.DoujinCount,
		&groupInfo.TotalOCount,
		&avgRating,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Group not found, return nil, nil to indicate this
	} else if err != nil {
		return nil, err
	}

	groupInfo.IsFavorite = isFavorite
	if avgRating.Valid {
		groupInfo.AverageRating = &avgRating.Float64
	}

	return &groupInfo, nil
}

func GetDoujinshiByGroup(db *sql.DB, groupID int64) ([]Doujinshi, error) {
	query := `
		SELECT d.id, d.source, d.external_id, d.title, d.pages, d.uploaded, d.folder_name
		FROM doujinshi d
		JOIN doujinshi_groups dg ON d.id = dg.doujinshi_id
		WHERE dg.group_id = ? AND d.folder_name IS NOT NULL AND d.folder_name != ''
		ORDER BY d.uploaded DESC, d.title ASC
	`
	rows, err := db.Query(query, groupID)
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

func GetGroupIDByName(db *sql.DB, groupName string) (int64, error) {
	var groupID int64
	query := `SELECT id FROM groups WHERE LOWER(name) = LOWER(?)`
	err := db.QueryRow(query, groupName).Scan(&groupID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, sql.ErrNoRows
		}
		return 0, err
	}
	return groupID, nil
}
