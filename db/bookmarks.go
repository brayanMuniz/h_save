package db

import (
	"database/sql"
	"fmt"
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
		SELECT db.id, db.doujinshi_id, db.filename, db.name, db.created_at, d.folder_name
		FROM doujinshi_bookmarks db
		JOIN doujinshi d ON db.doujinshi_id = d.id
		WHERE db.doujinshi_id = ?
		ORDER BY db.filename
	`, doujinshiID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookmarks []DoujinshiBookmark
	for rows.Next() {
		var bm DoujinshiBookmark
		var folderName string
		if err := rows.Scan(&bm.ID, &bm.DoujinshiID, &bm.Filename, &bm.Name, &bm.CreatedAt, &folderName); err == nil {
			// Try to get the image for this bookmark
			if folderName != "" {
				filePath := "doujinshi/" + folderName + "/" + bm.Filename
				if image, err := GetImageByFilePath(db, filePath); err == nil {
					bm.ImageID = &image.ID
					bm.ThumbnailURL = "/api/images/" + fmt.Sprintf("%d", image.ID) + "/thumbnail"
				}
			}
			bookmarks = append(bookmarks, bm)
		}
	}
	return bookmarks, nil
}

// GetBookmarksByEntity gets all bookmarks for doujinshi associated with a specific entity
func GetBookmarksByEntity(db *sql.DB, entityType string, entityID int64) ([]DoujinshiBookmark, error) {
	var joinTable, entityIDCol string

	switch entityType {
	case "tag":
		joinTable = "doujinshi_tags"
		entityIDCol = "tag_id"
	case "character":
		joinTable = "doujinshi_characters"
		entityIDCol = "character_id"
	case "artist":
		joinTable = "doujinshi_artists"
		entityIDCol = "artist_id"
	case "parody":
		joinTable = "doujinshi_parodies"
		entityIDCol = "parody_id"
	case "group":
		joinTable = "doujinshi_groups"
		entityIDCol = "group_id"
	default:
		return nil, sql.ErrNoRows
	}

	query := `
		SELECT db.id, db.doujinshi_id, db.filename, db.name, db.created_at, d.folder_name
		FROM doujinshi_bookmarks db
		JOIN ` + joinTable + ` jt ON db.doujinshi_id = jt.doujinshi_id
		JOIN doujinshi d ON db.doujinshi_id = d.id
		WHERE jt.` + entityIDCol + ` = ?
		ORDER BY db.doujinshi_id, db.filename
	`

	rows, err := db.Query(query, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookmarks []DoujinshiBookmark
	for rows.Next() {
		var bm DoujinshiBookmark
		var folderName string
		if err := rows.Scan(&bm.ID, &bm.DoujinshiID, &bm.Filename, &bm.Name, &bm.CreatedAt, &folderName); err == nil {
			// Try to get the image for this bookmark
			if folderName != "" {
				filePath := "doujinshi/" + folderName + "/" + bm.Filename
				if image, err := GetImageByFilePath(db, filePath); err == nil {
					bm.ImageID = &image.ID
					bm.ThumbnailURL = "/api/images/" + fmt.Sprintf("%d", image.ID) + "/thumbnail"
				}
			}
			bookmarks = append(bookmarks, bm)
		}
	}
	return bookmarks, nil
}

func UpdateBookmark(db *sql.DB, bookmarkID int64, name string) error {
	_, err := db.Exec(`
		UPDATE doujinshi_bookmarks 
		SET name = ? 
		WHERE id = ?
	`, name, bookmarkID)
	return err
}

func RemoveBookmark(db *sql.DB, doujinshiID int64, filename string) error {
	_, err := db.Exec(`DELETE FROM doujinshi_bookmarks WHERE doujinshi_id = ? AND filename = ?`, doujinshiID, filename)
	return err
}
