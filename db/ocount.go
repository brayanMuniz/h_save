package db

import (
	"database/sql"
)

func SetOCount(database *sql.DB, doujinshiID int64, filename string, oCount int) error {
	_, err := database.Exec(`
		INSERT INTO doujinshi_page_o (doujinshi_id, filename, o_count)
		VALUES (?, ?, ?)
		ON CONFLICT(doujinshi_id, filename) DO UPDATE SET o_count=excluded.o_count
	`, doujinshiID, filename, oCount)
	return err
}

func GetOCount(db *sql.DB, doujinshiID int64, filename string) (int, error) {
	var oCount int
	err := db.QueryRow(`
		SELECT o_count FROM doujinshi_page_o
		WHERE doujinshi_id = ? AND filename = ?
	`, doujinshiID, filename).Scan(&oCount)
	if err == sql.ErrNoRows {
		return 0, nil // Default to 0 if not set
	}
	return oCount, err
}

func GetTotalOCount(db *sql.DB, doujinshiID int64) (int, error) {
	var total int
	err := db.QueryRow(`
		SELECT SUM(o_count) FROM doujinshi_page_o
		WHERE doujinshi_id = ?
	`, doujinshiID).Scan(&total)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return total, err
}
