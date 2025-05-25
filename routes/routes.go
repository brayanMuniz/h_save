package routes

import (
	"database/sql"
	"github.com/brayanMuniz/h_save/n"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func SetupRouter(database *sql.DB, rootURL string, http_config n.HTTPConfig) *gin.Engine {
	r := gin.Default()

	// /api group: serves from local database to client
	api := r.Group("/api")
	{
		api.GET("/doujinshi", GetDoujinshi)

		api.GET("/sync", func(ctx *gin.Context) {
			SyncDoujinshi(ctx, database)
		})
	}

	// /n group: fetches from external source to fill up database
	n := r.Group("/n")
	{
		n.GET("/favorites/download", func(ctx *gin.Context) {
			saveMetadata := ctx.DefaultQuery("save_metadata", "true")
			skipOrganized := ctx.DefaultQuery("skip_organized", "true")
			DownloadFavorites(ctx, rootURL, "1", http_config, database,
				saveMetadata == "true",
				skipOrganized == "true")
		})

	}

	return r
}
