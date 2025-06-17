package db

import (
	"database/sql"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func InitDB(filepath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", filepath)
	if err != nil {
		return nil, err
	}

	if err := createDoujinshiAndMetadataTables(db); err != nil {
		log.Fatal(err)
	}

	if err := createUserAndProgressTables(db); err != nil {
		log.Fatal(err)
	}

	if err := createImageAndMetadataTables(db); err != nil {
		log.Fatal(err)
	}

	if err := createImageProgressTables(db); err != nil {
		log.Fatal(err)
	}

	// Set default password
	var count int
	err = db.QueryRow(`SELECT COUNT(*) FROM user`).Scan(&count)
	if err != nil {
		log.Fatal(err)
	}
	if count == 0 {
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

func createDoujinshiAndMetadataTables(db *sql.DB) error {
	_, err := db.Exec(`
	CREATE TABLE IF NOT EXISTS doujinshi (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    source TEXT NOT NULL,
	    external_id TEXT NOT NULL,
	    title TEXT,
	    second_title TEXT,
	    pages TEXT,
	    uploaded DATETIME,
	    folder_name TEXT,
	    UNIQUE(source, external_id)
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
	`)
	return err
}

func createUserAndProgressTables(db *sql.DB) error {
	_, err := db.Exec(`
	CREATE TABLE IF NOT EXISTS user (
	    id INTEGER PRIMARY KEY CHECK (id = 1),
	    password_hash TEXT NOT NULL
	);

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

	CREATE TABLE IF NOT EXISTS doujinshi_progress (
	    doujinshi_id INTEGER PRIMARY KEY,
	    rating INTEGER,
	    last_page INTEGER,
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id)
	);

	CREATE TABLE IF NOT EXISTS doujinshi_page_o (
	    doujinshi_id INTEGER,
	    filename TEXT NOT NULL,
	    o_count INTEGER DEFAULT 0,
	    PRIMARY KEY (doujinshi_id, filename),
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id)
	);

	CREATE TABLE IF NOT EXISTS doujinshi_bookmarks (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    doujinshi_id INTEGER NOT NULL,
	    filename TEXT NOT NULL,
	    name TEXT,
	    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	    UNIQUE(doujinshi_id, filename),
	    FOREIGN KEY (doujinshi_id) REFERENCES doujinshi(id)
	);

	CREATE TABLE IF NOT EXISTS saved_filters (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    name TEXT NOT NULL UNIQUE,
	    filters_json TEXT NOT NULL,
	    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

`)
	return err
}

func createImageAndMetadataTables(db *sql.DB) error {
	_, err := db.Exec(`
    CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT, -- nullable for local imports
        external_id TEXT, -- nullable for local imports
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL UNIQUE,
        file_size INTEGER,
        width INTEGER,
        height INTEGER,
        format TEXT, -- jpg, png, webp, etc.
        uploaded DATETIME DEFAULT CURRENT_TIMESTAMP,
        hash TEXT, -- for duplicate detection
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS image_tags (
        image_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (image_id, tag_id),
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS image_artists (
        image_id INTEGER,
        artist_id INTEGER,
        PRIMARY KEY (image_id, artist_id),
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS image_characters (
        image_id INTEGER,
        character_id INTEGER,
        PRIMARY KEY (image_id, character_id),
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS image_parodies (
        image_id INTEGER,
        parody_id INTEGER,
        PRIMARY KEY (image_id, parody_id),
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
        FOREIGN KEY (parody_id) REFERENCES parodies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS image_groups (
        image_id INTEGER,
        group_id INTEGER,
        PRIMARY KEY (image_id, group_id),
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS image_categories (
        image_id INTEGER,
        category_id INTEGER,
        PRIMARY KEY (image_id, category_id),
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
    `)
	return err
}

func createImageProgressTables(db *sql.DB) error {
	_, err := db.Exec(`
    CREATE TABLE IF NOT EXISTS image_progress (
        image_id INTEGER PRIMARY KEY,
        rating INTEGER,
        o_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        last_viewed DATETIME,
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorite_images (
        image_id INTEGER PRIMARY KEY,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS image_collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS image_collection_items (
        collection_id INTEGER,
        image_id INTEGER,
        order_index INTEGER DEFAULT 0,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (collection_id, image_id),
        FOREIGN KEY (collection_id) REFERENCES image_collections(id) ON DELETE CASCADE,
        FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collection_bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES image_collections(id) ON DELETE CASCADE
    );
    `)
	return err
}
