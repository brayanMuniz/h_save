package db

import (
	"database/sql"
	"golang.org/x/crypto/bcrypt"
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
	    gallery_id TEXT UNIQUE,  
	    pages TEXT,
	    uploaded DATETIME,
	    folder_name TEXT  
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

	-- Single user for password handling
	CREATE TABLE IF NOT EXISTS user (
	    id INTEGER PRIMARY KEY CHECK (id = 1),
	    password_hash TEXT NOT NULL
	);

	-- Used to keep track of the favorites
	CREATE TABLE IF NOT EXISTS favorite_tags (
	    tag_id INTEGER PRIMARY KEY,
	    FOREIGN KEY (tag_id) REFERENCES tags(id)
	);

	CREATE TABLE IF NOT EXISTS favorite_artists (
	    artist_id INTEGER PRIMARY KEY,
	    FOREIGN KEY (artist_id) REFERENCES artists(id)
	);

	CREATE TABLE IF NOT EXISTS favorite_characters (
	    character_id INTEGER PRIMARY KEY,
	    FOREIGN KEY (character_id) REFERENCES characters(id)
	);

	CREATE TABLE IF NOT EXISTS favorite_parodies (
	    parody_id INTEGER PRIMARY KEY,
	    FOREIGN KEY (parody_id) REFERENCES parodies(id)
	);

	CREATE TABLE IF NOT EXISTS favorite_groups (
	    group_id INTEGER PRIMARY KEY,
	    FOREIGN KEY (group_id) REFERENCES groups(id)
	);

	CREATE TABLE IF NOT EXISTS favorite_languages (
	    language_id INTEGER PRIMARY KEY,
	    FOREIGN KEY (language_id) REFERENCES languages(id)
	);

	CREATE TABLE IF NOT EXISTS favorite_categories (
	    category_id INTEGER PRIMARY KEY,
	    FOREIGN KEY (category_id) REFERENCES categories(id)
	);

	-- used to keep track of what the user thinks of a doujin
	CREATE TABLE IF NOT EXISTS doujinshi_progress (
	    doujinshi_id INTEGER PRIMARY KEY,
	    rating INTEGER,         -- 1 to 5 
	    last_page INTEGER,      
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id)
	);

`
	_, err = db.Exec(createTables)
	if err != nil {
		log.Fatal(err)
	}

	var count int
	err = db.QueryRow(`SELECT COUNT(*) FROM user`).Scan(&count)
	if err != nil {
		log.Fatal(err)
	}
	if count == 0 {
		// Set default password to "ecchi"
		hash, err := bcrypt.GenerateFromPassword([]byte("ecchi"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatal(err)
		}
		_, err = db.Exec(`INSERT INTO user (id, password_hash) VALUES (1, ?)`, string(hash))
		if err != nil {
			log.Fatal(err)
		}
	}

	return db, nil
}
