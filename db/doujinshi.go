package db

import (
	"database/sql"
	"strings"
	"time"
)

func GetAllDoujinshi(db *sql.DB) ([]Doujinshi, error) {
	rows, err := db.Query(`SELECT id, source, external_id, title, pages, uploaded, folder_name FROM doujinshi`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Doujinshi
	for rows.Next() {
		var d Doujinshi
		err := rows.Scan(&d.ID, &d.Source, &d.ExternalID, &d.Title, &d.Pages, &d.Uploaded, &d.FolderName)
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

func GetDoujinshi(db *sql.DB, id string) (Doujinshi, error) {
	var d Doujinshi
	err := db.QueryRow(
		`SELECT id, source, external_id, title, pages, uploaded, folder_name FROM doujinshi WHERE id = ?`,
		id,
	).Scan(&d.ID, &d.Source, &d.ExternalID, &d.Title, &d.Pages, &d.Uploaded, &d.FolderName)
	if err != nil {
		return d, err
	}

	// Fetch related data
	d.Tags, _ = getRelatedNames(db, d.ID, "tags", "doujinshi_tags", "tag_id")
	d.Artists, _ = getRelatedNames(db, d.ID, "artists", "doujinshi_artists", "artist_id")
	d.Characters, _ = getRelatedNames(db, d.ID, "characters", "doujinshi_characters", "character_id")
	d.Parodies, _ = getRelatedNames(db, d.ID, "parodies", "doujinshi_parodies", "parody_id")
	d.Groups, _ = getRelatedNames(db, d.ID, "groups", "doujinshi_groups", "group_id")
	d.Languages, _ = getRelatedNames(db, d.ID, "languages", "doujinshi_languages", "language_id")
	d.Categories, _ = getRelatedNames(db, d.ID, "categories", "doujinshi_categories", "category_id")

	return d, nil
}

func GetSimilarDoujinshiByMetaData(
	db *sql.DB,
	excludedDoujinshiID string, // use int64 for internal id
	characters []string,
	tags []string,
	parodies []string,
) ([]Doujinshi, error) {
	var args []interface{}
	var conditions []string

	if len(characters) > 0 {
		charPlaceholders := make([]string, len(characters))
		for i, char := range characters {
			charPlaceholders[i] = "?"
			args = append(args, char)
		}
		conditions = append(conditions, `
            d.id IN (
                SELECT doujinshi_id FROM doujinshi_characters dc
                JOIN characters c ON dc.character_id = c.id
                WHERE c.name IN (`+strings.Join(charPlaceholders, ",")+`)
            )
        `)
	}

	if len(tags) > 0 {
		tagPlaceholders := make([]string, len(tags))
		for i, tag := range tags {
			tagPlaceholders[i] = "?"
			args = append(args, tag)
		}
		conditions = append(conditions, `
            d.id IN (
                SELECT doujinshi_id FROM doujinshi_tags dt
                JOIN tags t ON dt.tag_id = t.id
                WHERE t.name IN (`+strings.Join(tagPlaceholders, ",")+`)
            )
        `)
	}

	if len(parodies) > 0 {
		parodyPlaceholders := make([]string, len(parodies))
		for i, parody := range parodies {
			parodyPlaceholders[i] = "?"
			args = append(args, parody)
		}
		conditions = append(conditions, `
        d.id IN (
            SELECT doujinshi_id FROM doujinshi_parodies dp
            JOIN parodies p ON dp.parody_id = p.id
            WHERE p.name IN (`+strings.Join(parodyPlaceholders, ",")+`)
        )
    `)
	}

	// Exclude the original doujinshi by internal id
	args = append(args, excludedDoujinshiID)

	query := `
        SELECT d.id, d.source, d.external_id, d.title, d.pages, d.uploaded, d.folder_name
        FROM doujinshi d
        WHERE (` + strings.Join(conditions, " OR ") + `)
        AND d.id != ? AND d.folder_name IS NOT NULL AND d.folder_name != ''
        LIMIT 100
    `

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Doujinshi
	for rows.Next() {
		var d Doujinshi
		if err := rows.Scan(&d.ID, &d.Source, &d.ExternalID,
			&d.Title, &d.Pages, &d.Uploaded, &d.FolderName); err != nil {
			return nil, err
		}

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

func GetDoujinshiByArtist(db *sql.DB, artistName string) ([]Doujinshi, error) {
	query := `
		SELECT d.id, d.source, d.external_id, d.title, d.pages, d.uploaded, d.folder_name
		FROM doujinshi d
		JOIN doujinshi_artists da ON d.id = da.doujinshi_id
		JOIN artists a ON da.artist_id = a.id
		WHERE a.name = ? AND d.folder_name IS NOT NULL AND d.folder_name != ''
	`
	rows, err := db.Query(query, artistName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Doujinshi
	for rows.Next() {
		var d Doujinshi
		if err := rows.Scan(&d.ID, &d.Source, &d.ExternalID, &d.Title, &d.Pages, &d.Uploaded, &d.FolderName); err != nil {
			return nil, err
		}
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

func DoujinshiExists(db *sql.DB, source, externalID string) (bool, error) {
	var exists bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM doujinshi WHERE source = ? AND external_id = ?)`, source, externalID,
	).Scan(&exists)
	return exists, err
}

func DoujinshiOrganizedList(db *sql.DB, source, externalID string) (bool, error) {
	var exists bool
	err := db.QueryRow(
		`SELECT EXISTS(
            SELECT 1 FROM doujinshi WHERE source = ? AND external_id = ? AND folder_name IS NOT NULL AND folder_name != ''
        )`, source, externalID,
	).Scan(&exists)
	return exists, err
}

func GetPendingDoujinshi(db *sql.DB) ([]Doujinshi, error) {
	rows, err := db.Query(`SELECT id, source, external_id, title FROM doujinshi WHERE folder_name IS NULL OR folder_name = ""`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Doujinshi
	for rows.Next() {
		var d Doujinshi
		if err := rows.Scan(&d.ID, &d.Source, &d.ExternalID, &d.Title); err != nil {
			return nil, err
		}
		results = append(results, d)
	}
	return results, nil
}

func UpdateFolderName(db *sql.DB, id int64, folderName string) error {
	_, err := db.Exec(
		`UPDATE doujinshi SET folder_name = ? WHERE id = ?`,
		folderName, id,
	)
	return err
}

func InsertDoujinshiWithMetadata(db *sql.DB, meta Doujinshi, folderName string) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
        INSERT INTO doujinshi (source, external_id, title, pages, uploaded, folder_name)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(source, external_id) DO UPDATE SET
            title=excluded.title, pages=excluded.pages, uploaded=excluded.uploaded, folder_name=excluded.folder_name
    `, meta.Source, meta.ExternalID, meta.Title, meta.Pages, meta.Uploaded.Format(time.RFC3339), folderName)
	if err != nil {
		return err
	}

	// Always fetch the ID by source and external_id
	var doujinshiID int64
	err = tx.QueryRow(`SELECT id FROM doujinshi WHERE source = ? AND external_id = ?`, meta.Source, meta.ExternalID).Scan(&doujinshiID)
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
