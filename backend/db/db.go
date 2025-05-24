package db

import (
	"database/sql"
	"log"
)

func InitDB(filepath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", filepath)
	if err != nil {
		return nil, err
	}

	createTables := `
	CREATE TABLE IF NOT EXISTS doujinshi (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    title TEXT,
	    gallery_id TEXT,
	    pages TEXT,
	    uploaded DATETIME,
	    pending INTEGER
	);

	CREATE TABLE IF NOT EXISTS tags (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT UNIQUE
	);

	CREATE TABLE IF NOT EXISTS doujinshi_tags (
	    doujinshi_id INTEGER,
	    tag_id INTEGER,
	    PRIMARY KEY (doujinshi_id, tag_id),
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id) ON DELETE CASCADE,
	    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS artists (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT UNIQUE
	);

	CREATE TABLE IF NOT EXISTS doujinshi_artists (
	    doujinshi_id INTEGER,
	    artist_id INTEGER,
	    PRIMARY KEY (doujinshi_id, artist_id),
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id) ON DELETE CASCADE,
	    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS characters (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT UNIQUE
	);

	CREATE TABLE IF NOT EXISTS doujinshi_characters (
	    doujinshi_id INTEGER,
	    character_id INTEGER,
	    PRIMARY KEY (doujinshi_id, character_id),
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id) ON DELETE CASCADE,
	    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS parodies (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT UNIQUE
	);

	CREATE TABLE IF NOT EXISTS doujinshi_parodies (
	    doujinshi_id INTEGER,
	    parody_id INTEGER,
	    PRIMARY KEY (doujinshi_id, parody_id),
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id) ON DELETE CASCADE,
	    FOREIGN KEY (parody_id) REFERENCES parodies(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS groups (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT UNIQUE
	);

	CREATE TABLE IF NOT EXISTS doujinshi_groups (
	    doujinshi_id INTEGER,
	    group_id INTEGER,
	    PRIMARY KEY (doujinshi_id, group_id),
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id) ON DELETE CASCADE,
	    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS languages (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT UNIQUE
	);

	CREATE TABLE IF NOT EXISTS doujinshi_languages (
	    doujinshi_id INTEGER,
	    language_id INTEGER,
	    PRIMARY KEY (doujinshi_id, language_id),
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id) ON DELETE CASCADE,
	    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS categories (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT UNIQUE
	);

	CREATE TABLE IF NOT EXISTS doujinshi_categories (
	    doujinshi_id INTEGER,
	    category_id INTEGER,
	    PRIMARY KEY (doujinshi_id, category_id),
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id) ON DELETE CASCADE,
	    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
	);

`

	_, err = db.Exec(createTables)
	if err != nil {
		log.Fatal(err)
	}

	return db, nil
}
