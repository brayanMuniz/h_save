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

// GetBookmarksByTag gets all bookmarks for doujinshi associated with a specific tag
func GetBookmarksByTag(ctx *gin.Context, database *sql.DB) {
	tagID, ok := parseID(ctx, "id")
	if !ok {
		return
	}

	bookmarks, err := db.GetBookmarksByEntity(database, "tag", tagID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bookmarks"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"bookmarks": bookmarks})
}

// GetBookmarksByCharacter gets all bookmarks for doujinshi associated with a specific character
func GetBookmarksByCharacter(ctx *gin.Context, database *sql.DB) {
	characterID, ok := parseID(ctx, "id")
	if !ok {
		return
	}

	bookmarks, err := db.GetBookmarksByEntity(database, "character", characterID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bookmarks"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"bookmarks": bookmarks})
}

// GetBookmarksByArtist gets all bookmarks for doujinshi associated with a specific artist
func GetBookmarksByArtist(ctx *gin.Context, database *sql.DB) {
	artistID, ok := parseID(ctx, "id")
	if !ok {
		return
	}

	bookmarks, err := db.GetBookmarksByEntity(database, "artist", artistID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bookmarks"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"bookmarks": bookmarks})
}

// GetBookmarksByParody gets all bookmarks for doujinshi associated with a specific parody
func GetBookmarksByParody(ctx *gin.Context, database *sql.DB) {
	parodyID, ok := parseID(ctx, "id")
	if !ok {
		return
	}

	bookmarks, err := db.GetBookmarksByEntity(database, "parody", parodyID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bookmarks"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"bookmarks": bookmarks})
}

// GetBookmarksByGroup gets all bookmarks for doujinshi associated with a specific group
func GetBookmarksByGroup(ctx *gin.Context, database *sql.DB) {
	groupID, ok := parseID(ctx, "id")
	if !ok {
		return
	}

	bookmarks, err := db.GetBookmarksByEntity(database, "group", groupID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bookmarks"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"bookmarks": bookmarks})
}

func UpdateBookmark(ctx *gin.Context, database *sql.DB) {
	_, ok := parseID(ctx, "id")
	if !ok {
		return
	}

	// Parse bookmark ID from URL
	bookmarkID, ok := parseID(ctx, "bookmarkId")
	if !ok {
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := db.UpdateBookmark(database, bookmarkID, req.Name); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bookmark"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Bookmark updated successfully",
	})
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
