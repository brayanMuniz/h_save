package db

import (
	"database/sql"
	"github.com/brayanMuniz/h_save/n"
	"time"
)

func GetAllDoujinshi(db *sql.DB) ([]Doujinshi, error) {
	rows, err := db.Query(`SELECT id, title, gallery_id, pages, uploaded, pending FROM doujinshi`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Doujinshi
	for rows.Next() {
		var d Doujinshi
		err := rows.Scan(&d.ID, &d.Title, &d.GalleryID, &d.Pages, &d.Uploaded, &d.Pending)
		if err != nil {
			return nil, err
		}

		// Fetch related data for each doujinshi
		d.Tags, _ = getRelatedNames(db, d.ID, "tags", "doujinshi_tags", "tag_id")
		d.Artists, _ = getRelatedNames(db, d.ID, "artists", "doujinshi_artists", "artist_id")
		d.Characters, _ = getRelatedNames(db, d.ID, "characters", "doujinshi_characters", "character_id")
		d.Parodies, _ = getRelatedNames(db, d.ID, "parodies", "doujinshi_parodies", "parody_id")
		d.Groups, _ = getRelatedNames(db, d.ID, "groups", "doujinshi_groups", "group_id")
		d.Languages, _ = getRelatedNames(db, d.ID, "languages", "doujinshi_languages", "language_id")
		d.Categories, _ = getRelatedNames(db, d.ID, "categories", "doujinshi_categories", "category_id")

		results = append(results, d)
	}
	return results, nil
}

func getRelatedNames(db *sql.DB, doujinshiID int64, entityTable, joinTable, entityIDCol string) ([]string, error) {
	query := `
        SELECT e.name
        FROM ` + entityTable + ` e
        JOIN ` + joinTable + ` j ON e.id = j.` + entityIDCol + `
        WHERE j.doujinshi_id = ?
    `
	rows, err := db.Query(query, doujinshiID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		names = append(names, name)
	}
	return names, nil
}

func InsertDoujinshiWithMetadata(db *sql.DB, meta n.PageMetaData, pending int) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
        INSERT INTO doujinshi (title, gallery_id, pages, uploaded, pending)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(gallery_id) DO UPDATE SET
            title=excluded.title, pages=excluded.pages, uploaded=excluded.uploaded, pending=excluded.pending
    `, meta.Title, meta.GalleryId, meta.Pages, meta.Uploaded.Format(time.RFC3339), pending)
	if err != nil {
		return err
	}

	// Always fetch the ID by gallery_id (since it is unique)
	var doujinshiID int64
	err = tx.QueryRow(`SELECT id FROM doujinshi WHERE gallery_id = ?`, meta.GalleryId).Scan(&doujinshiID)
	if err != nil {
		return err
	}

	if err := linkManyToMany(tx, doujinshiID, meta.Tags, "tags", "doujinshi_tags", "tag_id"); err != nil {
		return err
	}
	if err := linkManyToMany(tx, doujinshiID, meta.Artists, "artists", "doujinshi_artists", "artist_id"); err != nil {
		return err
	}
	if err := linkManyToMany(tx, doujinshiID, meta.Characters, "characters", "doujinshi_characters", "character_id"); err != nil {
		return err
	}
	if err := linkManyToMany(tx, doujinshiID, meta.Parodies, "parodies", "doujinshi_parodies", "parody_id"); err != nil {
		return err
	}
	if err := linkManyToMany(tx, doujinshiID, meta.Groups, "groups", "doujinshi_groups", "group_id"); err != nil {
		return err
	}
	if err := linkManyToMany(tx, doujinshiID, meta.Languages, "languages", "doujinshi_languages", "language_id"); err != nil {
		return err
	}
	if err := linkManyToMany(tx, doujinshiID, meta.Categories, "categories", "doujinshi_categories", "category_id"); err != nil {
		return err
	}

	return tx.Commit()
}

func linkManyToMany(tx *sql.Tx, doujinshiID int64, values []string, entityTable, joinTable, entityIDCol string) error {
	for _, v := range values {
		// Insert or ignore entity
		var entityID int64
		_, err := tx.Exec("INSERT OR IGNORE INTO "+entityTable+" (name) VALUES (?)", v)
		if err != nil {
			return err
		}
		// Always select the ID
		err = tx.QueryRow("SELECT id FROM "+entityTable+" WHERE name = ?", v).Scan(&entityID)
		if err != nil {
			return err
		}
		// Insert into join table
		_, err = tx.Exec(
			"INSERT OR IGNORE INTO "+joinTable+" (doujinshi_id, "+entityIDCol+") VALUES (?, ?)",
			doujinshiID, entityID,
		)
		if err != nil {
			return err
		}
	}
	return nil
}
