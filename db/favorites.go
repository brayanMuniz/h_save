package db

import (
	"database/sql"
	"strconv"
	"strings"
)

func AddFavoriteTag(database *sql.DB, tagID int64) error {
	_, err := database.Exec(`INSERT OR IGNORE INTO favorite_tags (tag_id) VALUES (?)`, tagID)
	return err
}

func RemoveFavoriteTag(database *sql.DB, tagID int64) error {
	_, err := database.Exec(`DELETE FROM favorite_tags WHERE tag_id = ?`, tagID)
	return err
}

func AddFavoriteArtist(database *sql.DB, artistID int64) error {
	_, err := database.Exec(`INSERT OR IGNORE INTO favorite_artists (artist_id) VALUES (?)`, artistID)
	return err
}

func RemoveFavoriteArtist(database *sql.DB, artistID int64) error {
	_, err := database.Exec(`DELETE FROM favorite_artists WHERE artist_id = ?`, artistID)
	return err
}

func AddFavoriteCharacter(database *sql.DB, characterID int64) error {
	_, err := database.Exec(`INSERT OR IGNORE INTO favorite_characters (character_id) VALUES (?)`, characterID)
	return err
}

func RemoveFavoriteCharacter(database *sql.DB, characterID int64) error {
	_, err := database.Exec(`DELETE FROM favorite_characters WHERE character_id = ?`, characterID)
	return err
}

func AddFavoriteParody(database *sql.DB, parodyID int64) error {
	_, err := database.Exec(`INSERT OR IGNORE INTO favorite_parodies (parody_id) VALUES (?)`, parodyID)
	return err
}

func RemoveFavoriteParody(database *sql.DB, parodyID int64) error {
	_, err := database.Exec(`DELETE FROM favorite_parodies WHERE parody_id = ?`, parodyID)
	return err
}

func AddFavoriteGroup(database *sql.DB, groupID int64) error {
	_, err := database.Exec(`INSERT OR IGNORE INTO favorite_groups (group_id) VALUES (?)`, groupID)
	return err
}

func RemoveFavoriteGroup(database *sql.DB, groupID int64) error {
	_, err := database.Exec(`DELETE FROM favorite_groups WHERE group_id = ?`, groupID)
	return err
}

func AddFavoriteLanguage(database *sql.DB, languageID int64) error {
	_, err := database.Exec(`INSERT OR IGNORE INTO favorite_languages (language_id) VALUES (?)`, languageID)
	return err
}

func RemoveFavoriteLanguage(database *sql.DB, languageID int64) error {
	_, err := database.Exec(`DELETE FROM favorite_languages WHERE language_id = ?`, languageID)
	return err
}

func AddFavoriteCategory(database *sql.DB, categoryID int64) error {
	_, err := database.Exec(`INSERT OR IGNORE INTO favorite_categories (category_id) VALUES (?)`, categoryID)
	return err
}

func RemoveFavoriteCategory(database *sql.DB, categoryID int64) error {
	_, err := database.Exec(`DELETE FROM favorite_categories WHERE category_id = ?`, categoryID)
	return err
}

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

	// Build dynamic query based on what fields are provided
	var setParts []string
	var args []interface{}

	if rating != nil {
		setParts = append(setParts, "rating = ?")
		args = append(args, *rating)
	}

	if lastPage != nil {
		setParts = append(setParts, "last_page = ?")
		args = append(args, *lastPage)
	}

	if len(setParts) == 0 {
		return nil // Nothing to update
	}

	query := `UPDATE doujinshi_progress SET ` +
		strings.Join(setParts, ", ") +
		` WHERE doujinshi_id = ?`
	args = append(args, id)

	result, err := db.Exec(query, args...)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	// If no rows were affected, create a new record
	if rowsAffected == 0 {
		return SetDoujinshiProgress(db, doujinshiID, rating, lastPage)
	}

	return nil
}
