package db

import (
	"database/sql"
)

func AddBookmark(db *sql.DB, doujinshiID int64, filename, name string) error {
	_, err := db.Exec(`
		INSERT INTO doujinshi_bookmarks (doujinshi_id, filename, name)
		VALUES (?, ?, ?)
		ON CONFLICT(doujinshi_id, filename) DO UPDATE SET name=excluded.name
	`, doujinshiID, filename, name)
	return err
}

func GetBookmarks(db *sql.DB, doujinshiID int64) ([]DoujinshiBookmark, error) {
	rows, err := db.Query(`
		SELECT id, doujinshi_id, filename, name, created_at
		FROM doujinshi_bookmarks
		WHERE doujinshi_id = ?
		ORDER BY filename
	`, doujinshiID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookmarks []DoujinshiBookmark
	for rows.Next() {
		var bm DoujinshiBookmark
		if err := rows.Scan(&bm.ID, &bm.DoujinshiID, &bm.Filename, &bm.Name, &bm.CreatedAt); err == nil {
			bookmarks = append(bookmarks, bm)
		}
	}
	return bookmarks, nil
}

func RemoveBookmark(db *sql.DB, doujinshiID int64, filename string) error {
	_, err := db.Exec(`DELETE FROM doujinshi_bookmarks WHERE doujinshi_id = ? AND filename = ?`, doujinshiID, filename)
	return err
}
