package db

import (
	"database/sql"
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
