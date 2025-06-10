package routes

import (
	"database/sql"
	"net/http"

	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/types"
	"github.com/gin-gonic/gin"
)

type CreateFilterRequest struct {
	Name    string              `json:"name" binding:"required"`
	Filters types.BrowseFilters `json:"filters"`
}

func CreateSavedFilterHandler(c *gin.Context, database *sql.DB) {
	var req CreateFilterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	id, err := db.CreateSavedFilter(database, req.Name, req.Filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save filter"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "name": req.Name})
}

func GetAllSavedFiltersHandler(c *gin.Context, database *sql.DB) {
	filters, err := db.GetAllSavedFilters(database)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve saved filters"})
		return
	}

	if filters == nil {
		filters = []db.SavedFilter{}
	}

	c.JSON(http.StatusOK, gin.H{"savedFilters": filters})
}

type UpdateFilterRequest struct {
	Name    string              `json:"name" binding:"required"`
	Filters types.BrowseFilters `json:"filters"`
}

func UpdateSavedFilterHandler(c *gin.Context, database *sql.DB) {
	id, ok := parseID(c, "id")
	if !ok {
		return
	}

	var req UpdateFilterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	err := db.UpdateSavedFilter(database, id, req.Name, req.Filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update saved filter"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func DeleteSavedFilterHandler(c *gin.Context, database *sql.DB) {
	id, ok := parseID(c, "id")
	if !ok {
		return
	}

	err := db.DeleteSavedFilter(database, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete saved filter"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
