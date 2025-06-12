package routes

import (
	"database/sql"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"

	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
)

type SyncedEntry struct {
	ID           int64  `json:"id"`
	Title        string `json:"title"`
	FolderName   string `json:"folderName"`
	ThumbnailURL string `json:"thumbnailUrl"`
}

type PendingEntry struct {
	ID         int64  `json:"id"`
	Title      string `json:"title"`
	Source     string `json:"source"`
	ExternalID string `json:"external_id"`
}

type SyncResponse struct {
	Synced           []SyncedEntry  `json:"synced"`
	StillPending     []PendingEntry `json:"stillPending"`
	AvailableFolders []string       `json:"availableFolders"`
}

func SyncDoujinshiHandler(c *gin.Context, database *sql.DB) {
	pending, err := db.GetPendingDoujinshi(database)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pending doujinshi"})
		return
	}

	entries, err := os.ReadDir("./doujinshi")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read doujinshi folder"})
		return
	}

	// maps for efficient lookups
	folderMap := make(map[string]string)
	for _, entry := range entries {
		if entry.IsDir() {
			folderMap[sanitizeToFilename(entry.Name())] = entry.Name()
		}
	}

	var response SyncResponse
	usedFolders := make(map[string]bool)

	// Attempt to auto-sync pending entries
	for _, d := range pending {
		sanitizedTitle := sanitizeToFilename(d.Title)
		if folderName, ok := folderMap[sanitizedTitle]; ok {
			_ = db.UpdateFolderName(database, d.ID, folderName)
			response.Synced = append(response.Synced, SyncedEntry{
				ID:           d.ID,
				Title:        d.Title,
				FolderName:   folderName,
				ThumbnailURL: "/api/doujinshi/" + strconv.FormatInt(d.ID, 10) + "/thumbnail",
			})
			usedFolders[folderName] = true
		} else {
			// No match found
			response.StillPending = append(response.StillPending, PendingEntry{
				ID:         d.ID,
				Title:      d.Title,
				Source:     d.Source,
				ExternalID: d.ExternalID,
			})
		}
	}

	// Determine which folders are available for manual assignment
	for _, entry := range entries {
		if entry.IsDir() && !usedFolders[entry.Name()] {
			response.AvailableFolders = append(response.AvailableFolders, entry.Name())
		}
	}

	// no empty slices
	if response.Synced == nil {
		response.Synced = []SyncedEntry{}
	}
	if response.StillPending == nil {
		response.StillPending = []PendingEntry{}
	}
	if response.AvailableFolders == nil {
		response.AvailableFolders = []string{}
	}

	c.JSON(http.StatusOK, response)
}

func GetThumbnailByFolderHandler(c *gin.Context, database *sql.DB) {
	folderName := c.Query("folderName")
	if folderName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "folderName query parameter is required"})
		return
	}

	dir := filepath.Join("doujinshi", folderName)

	if _, err := os.Stat(dir); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Folder not found"})
		return
	}

	files, err := os.ReadDir(dir)
	if err != nil || len(files) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Could not read folder or folder is empty"})
		return
	}

	var imageFiles []string
	for _, f := range files {
		if !f.IsDir() && isImageFile(f.Name()) {
			imageFiles = append(imageFiles, f.Name())
		}
	}

	sort.Strings(imageFiles)

	if len(imageFiles) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No image files found in the folder"})
		return
	}

	thumbnailPath := filepath.Join(dir, imageFiles[0])

	c.Header("Cache-Control", "no-store")
	c.File(thumbnailPath)
}

func ManualSyncHandler(c *gin.Context, database *sql.DB) {
	id, ok := parseID(c, "id")
	if !ok {
		return
	}

	var req struct {
		FolderName string `json:"folderName"`
	}

	if err := c.ShouldBindJSON(&req); err != nil || req.FolderName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request, folderName is required"})
		return
	}

	err := db.UpdateFolderName(database, id, req.FolderName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update folder name in database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Folder name updated successfully."})
}
