package db

import (
	"database/sql"
	"golang.org/x/crypto/bcrypt"
)

// NOTE: not in use
func InsertUser(db *sql.DB, username, passwordHash string) (int64, error) {
	res, err := db.Exec(
		`INSERT INTO users (username, password_hash) VALUES (?, ?)`,
		username, passwordHash,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func SetPassword(db *sql.DB, passwordHash string) error {
	_, err := db.Exec(`
        INSERT INTO user (id, password_hash) VALUES (1, ?)
        ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash
    `, passwordHash)
	return err
}

func CheckPassword(database *sql.DB, password string) (bool, error) {
	var hash string
	err := database.QueryRow(`SELECT password_hash FROM user WHERE id = 1`).Scan(&hash)
	if err != nil {
		return false, err
	}
	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil, nil
}
