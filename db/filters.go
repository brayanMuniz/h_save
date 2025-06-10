package db

import (
	"database/sql"
	"encoding/json"
	"github.com/brayanMuniz/h_save/types"
	"time"
)

type SavedFilter struct {
	ID        int64               `json:"id"`
	Name      string              `json:"name"`
	Filters   types.BrowseFilters `json:"filters"`
	CreatedAt time.Time           `json:"createdAt"`
}

func CreateSavedFilter(db *sql.DB, name string, filters types.BrowseFilters) (int64, error) {
	filtersJSON, err := json.Marshal(filters)
	if err != nil {
		return 0, err
	}

	query := `INSERT INTO saved_filters (name, filters_json) VALUES (?, ?)`
	result, err := db.Exec(query, name, string(filtersJSON))
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

func GetAllSavedFilters(db *sql.DB) ([]SavedFilter, error) {
	query := `SELECT id, name, filters_json, created_at FROM saved_filters ORDER BY name ASC`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var savedFilters []SavedFilter
	for rows.Next() {
		var sf SavedFilter
		var filtersJSON string

		if err := rows.Scan(&sf.ID, &sf.Name, &filtersJSON, &sf.CreatedAt); err != nil {
			return nil, err
		}

		if err := json.Unmarshal([]byte(filtersJSON), &sf.Filters); err != nil {
			continue
		}

		savedFilters = append(savedFilters, sf)
	}

	return savedFilters, nil
}

func UpdateSavedFilter(db *sql.DB, id int64, name string, filters types.BrowseFilters) error {
	filtersJSON, err := json.Marshal(filters)
	if err != nil {
		return err
	}

	query := `UPDATE saved_filters SET name = ?, filters_json = ? WHERE id = ?`
	_, err = db.Exec(query, name, string(filtersJSON), id)
	return err
}

func DeleteSavedFilter(db *sql.DB, id int64) error {
	query := `DELETE FROM saved_filters WHERE id = ?`
	_, err := db.Exec(query, id)
	return err
}
