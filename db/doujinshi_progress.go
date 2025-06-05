package db

import (
	"database/sql"
	"strconv"
)

func GetDoujinshiProgress(db *sql.DB, doujinshiID string) (DoujinshiProgress, error) {
	var progress DoujinshiProgress
	id, err := strconv.ParseInt(doujinshiID, 10, 64)
	if err != nil {
		return progress, err
	}

	progress.DoujinshiID = id

	err = db.QueryRow(`
        SELECT rating, last_page 
        FROM doujinshi_progress 
        WHERE doujinshi_id = ?
    `, id).Scan(&progress.Rating, &progress.LastPage)

	if err == sql.ErrNoRows {
		// No progress record exists, return empty progress with just the ID
		return progress, nil
	}

	return progress, err
}

func SetDoujinshiProgress(
	db *sql.DB,
	doujinshiID string,
	rating *int,
	lastPage *int,
) error {
	id, err := strconv.ParseInt(doujinshiID, 10, 64)
	if err != nil {
		return err
	}

	_, err = db.Exec(`
        INSERT INTO doujinshi_progress (doujinshi_id, rating, last_page)
        VALUES (?, ?, ?)
        ON CONFLICT(doujinshi_id) DO UPDATE SET
            rating = COALESCE(excluded.rating, rating),
            last_page = COALESCE(excluded.last_page, last_page)
    `, id, rating, lastPage)

	return err
}

func UpdateDoujinshiProgress(
	db *sql.DB,
	doujinshiID string,
	rating *int,
	lastPage *int,
) error {
	id, err := strconv.ParseInt(doujinshiID, 10, 64)
	if err != nil {
		return err
	}

	var ratingValue interface{}
	var lastPageValue interface{}

	if rating != nil {
		ratingValue = *rating
	} else {
		ratingValue = nil
	}

	if lastPage != nil {
		lastPageValue = *lastPage
	} else {
		lastPageValue = nil
	}

	query := `UPDATE doujinshi_progress SET rating = ?, last_page = ? WHERE doujinshi_id = ?`

	result, err := db.Exec(query, ratingValue, lastPageValue, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	// If no rows were affected, create a new record
	if rowsAffected == 0 {
		insertQuery := `INSERT INTO doujinshi_progress (doujinshi_id, rating, last_page) VALUES (?, ?, ?)`
		_, err = db.Exec(insertQuery, id, ratingValue, lastPageValue)
		return err
	}

	return nil
}
