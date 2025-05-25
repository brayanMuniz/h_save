package routes

import (
	"github.com/brayanMuniz/h_save/n"
	"github.com/gin-gonic/gin"
)

func SetupRouter(rootURL string, http_config n.HTTPConfig) *gin.Engine {
	r := gin.Default()

	// API group: serves from local database to client
	api := r.Group("/api")
	{
		api.GET("/doujinshi", GetDoujinshi)
	}

	// N group: fetches from external source to fill up database
	n := r.Group("/n")
	{
		// This ONLY downloads them, NOT the prefered method since we can also get metadata
		n.GET("/downloadFavorites", func(ctx *gin.Context) {
			DownloadFavorites(ctx, rootURL, "1", http_config)
		})

	}

	return r
}
