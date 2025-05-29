package routes

import (
	"database/sql"
	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

func parseID(ctx *gin.Context, param string) (int64, bool) {
	idStr := ctx.Param(param)
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return 0, false
	}
	return id, true
}

func GetUserProfile(ctx *gin.Context, database *sql.DB) {
	// Helper to get all names from a favorites table
	getNames := func(table, col, entityTable string) []string {
		rows, err := database.Query(
			`SELECT e.name FROM ` + table + ` f JOIN ` + entityTable + ` e ON f.` + col + ` = e.id`)
		if err != nil {
			return nil
		}
		defer rows.Close()
		var names []string
		for rows.Next() {
			var name string
			if err := rows.Scan(&name); err == nil {
				names = append(names, name)
			}
		}
		return names
	}

	tags := getNames("favorite_tags", "tag_id", "tags")
	artists := getNames("favorite_artists", "artist_id", "artists")
	characters := getNames("favorite_characters", "character_id", "characters")
	parodies := getNames("favorite_parodies", "parody_id", "parodies")
	groups := getNames("favorite_groups", "group_id", "groups")
	languages := getNames("favorite_languages", "language_id", "languages")
	categories := getNames("favorite_categories", "category_id", "categories")

	// Gather all doujinshi progress (with both id and gallery_id)
	rows, err := database.Query(`
		SELECT d.id, d.gallery_id, p.rating, p.last_page
		FROM doujinshi_progress p
		JOIN doujinshi d ON p.doujinshi_id = d.id
	`)
	if err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to get progress"})
		return
	}
	defer rows.Close()
	var progress []map[string]interface{}
	for rows.Next() {
		var id int64
		var rating, lastPage int
		if err := rows.Scan(&id, &rating, &lastPage); err == nil {
			progress = append(progress, map[string]interface{}{
				"id":       id,
				"rating":   rating,
				"lastPage": lastPage,
			})
		}
	}

	ctx.JSON(200, gin.H{
		"favorites": gin.H{
			"tags":       tags,
			"artists":    artists,
			"characters": characters,
			"parodies":   parodies,
			"groups":     groups,
			"languages":  languages,
			"categories": categories,
		},
		"progress": progress,
	})
}

func getNames(database *sql.DB, table, col, entityTable string) []string {
	rows, err := database.Query(
		`SELECT e.name FROM ` + table + ` f JOIN ` + entityTable + ` e ON f.` + col + ` = e.id`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil {
			names = append(names, name)
		}
	}
	return names
}

func AddFavoriteByName(
	ctx *gin.Context,
	database *sql.DB,
	entityName string,
	tableName string,
	addFunc func(*sql.DB, int64) error,
) {
	var req map[string]string
	if err := ctx.ShouldBindJSON(&req); err != nil || req[entityName] == "" {
		ctx.JSON(400, gin.H{"error": "Missing or invalid " + entityName})
		return
	}
	value := req[entityName]

	// Look up the ID by name
	var id int64
	err := database.QueryRow(
		`SELECT id FROM `+tableName+` WHERE LOWER(name) = LOWER(?)`, value,
	).Scan(&id)
	if err == sql.ErrNoRows {
		ctx.JSON(404, gin.H{"error": entityName + " not found"})
		return
	} else if err != nil {
		ctx.JSON(500, gin.H{"error": "Database error"})
		return
	}

	// Add to favorites
	if err := addFunc(database, id); err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to add favorite " + entityName})
		return
	}
	ctx.JSON(200, gin.H{"success": true, entityName + "ID": id})
}

func RemoveFavoriteByName(
	ctx *gin.Context,
	database *sql.DB,
	entityName string,
	tableName string,
	removeFunc func(*sql.DB, int64) error,
) {
	var req map[string]string
	if err := ctx.ShouldBindJSON(&req); err != nil || req[entityName] == "" {
		ctx.JSON(400, gin.H{"error": "Missing or invalid " + entityName})
		return
	}
	value := req[entityName]

	// Look up the ID by name
	var id int64
	err := database.QueryRow(
		`SELECT id FROM `+tableName+` WHERE LOWER(name) = LOWER(?)`, value,
	).Scan(&id)
	if err == sql.ErrNoRows {
		ctx.JSON(404, gin.H{"error": entityName + " not found"})
		return
	} else if err != nil {
		ctx.JSON(500, gin.H{"error": "Database error"})
		return
	}

	if err := removeFunc(database, id); err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to remove favorite " + entityName})
		return
	}
	ctx.JSON(200, gin.H{"success": true, entityName + "ID": id})
}

func GetFavoriteNames(
	ctx *gin.Context,
	database *sql.DB,
	table string,
	col string,
	entityTable string,
	entityName string,
) {
	rows, err := database.Query(
		`SELECT e.name FROM ` + table + ` f JOIN ` + entityTable + ` e ON f.` + col + ` = e.id`)
	if err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to get favorite " + entityName})
		return
	}
	defer rows.Close()
	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil {
			names = append(names, name)
		}
	}
	ctx.JSON(200, gin.H{entityName: names})
}

type ProgressRequest struct {
	Rating   int `json:"rating"`
	LastPage int `json:"lastPage"`
}

func SetDoujinshiProgress(ctx *gin.Context, database *sql.DB) {
	id, ok := parseID(ctx, "id")
	if !ok {
		return
	}
	var req ProgressRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(400, gin.H{"error": "Invalid request"})
		return
	}
	if err := db.SetDoujinshiProgress(database, id, req.Rating, req.LastPage); err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to set progress"})
		return
	}
	ctx.JSON(200, gin.H{"success": true})
}

func GetDoujinshiProgress(ctx *gin.Context, database *sql.DB) {
	id, ok := parseID(ctx, "id")
	if !ok {
		return
	}
	progress, err := db.GetDoujinshiProgress(database, id)
	if err != nil {
		ctx.JSON(404, gin.H{"error": "No progress found"})
		return
	}
	ctx.JSON(200, gin.H{
		"rating":   progress.Rating,
		"lastPage": progress.LastPage,
	})
}
