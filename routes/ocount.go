package routes

import (
	"database/sql"
	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
)

func SetOCountHandler(ctx *gin.Context, database *sql.DB) {
	id, ok := parseID(ctx, "id")
	if !ok {
		return
	}
	var req struct {
		Filename string `json:"filename"`
		OCount   int    `json:"oCount"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil || req.Filename == "" {
		ctx.JSON(400, gin.H{"error": "Invalid request"})
		return
	}
	if err := db.SetOCount(database, id, req.Filename, req.OCount); err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to set o count"})
		return
	}
	ctx.JSON(200, gin.H{"success": true})
}

func GetOCountHandler(ctx *gin.Context, database *sql.DB) {
	id, ok := parseID(ctx, "id")
	if !ok {
		return
	}
	filename := ctx.Query("filename")
	if filename == "" {
		ctx.JSON(400, gin.H{"error": "Missing filename"})
		return
	}
	oCount, err := db.GetOCount(database, id, filename)
	if err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to get o count"})
		return
	}
	ctx.JSON(200, gin.H{"oCount": oCount})
}

func GetTotalOCountHandler(ctx *gin.Context, database *sql.DB) {
	id, ok := parseID(ctx, "id")
	if !ok {
		return
	}
	total, err := db.GetTotalOCount(database, id)
	if err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to get total o count"})
		return
	}
	ctx.JSON(200, gin.H{"totalOCount": total})
}
