package routes

import (
	"database/sql"
	"net/http"

	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func AddBookmark(ctx *gin.Context, database *sql.DB) {
	id, ok := parseID(ctx, "id") // doujinshi_id from URL
	if !ok {
		return
	}
	var req struct {
		Filename string `json:"filename"`
		Name     string `json:"name"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil || req.Filename == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	if err := db.AddBookmark(database, id, req.Filename, req.Name); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add bookmark"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"success": true})
}

func ListBookmarks(ctx *gin.Context, database *sql.DB) {
	id, ok := parseID(ctx, "id")
	if !ok {
		return
	}
	bookmarks, err := db.GetBookmarks(database, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bookmarks"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"bookmarks": bookmarks})
}

func RemoveBookmark(ctx *gin.Context, database *sql.DB) {
	id, ok := parseID(ctx, "id")
	if !ok {
		return
	}
	filename := ctx.Query("filename")
	if filename == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Missing filename"})
		return
	}
	if err := db.RemoveBookmark(database, id, filename); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove bookmark"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"success": true})
}
