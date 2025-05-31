package routes

import (
	"database/sql"
	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/n"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func SetupRouter(database *sql.DB, rootURL string, http_config n.HTTPConfig) *gin.Engine {
	r := gin.Default()

	// serves from local database to client
	api := r.Group("/api")
	{
		// NOTE: not used
		api.POST("/user/login", func(ctx *gin.Context) {
			LoginHandler(ctx, database)
		})

		api.GET("/doujinshi", func(ctx *gin.Context) {
			GetAllDoujinshi(ctx, database)
		})

		api.GET("/doujinshi/:id", func(ctx *gin.Context) {
			GetDoujinshi(ctx, database)
		})

		api.GET("/doujinshi/:id/pages", func(ctx *gin.Context) {
			GetDoujinshiPages(ctx, database)
		})

		api.GET("/doujinshi/:id/page/:pageNumber", func(ctx *gin.Context) {
			GetDoujinshiPage(ctx, database)
		})

		api.GET("/doujinshi/:id/similar/metadata", func(ctx *gin.Context) {
			GetSimilarDoujinshiByMetadata(ctx, database)
		})

		api.GET("/doujinshi/:id/thumbnail", func(ctx *gin.Context) {
			GetDoujinshiThumbnail(ctx, database)
		})

		api.GET("/artist/:artist", func(ctx *gin.Context) {
			GetArtistDoujins(ctx, database)
		})

		api.GET("/sync", func(ctx *gin.Context) {
			SyncDoujinshi(ctx, database)
		})
	}

	// User favorites
	user := api.Group("/user")
	{

		user.GET("/profile", func(ctx *gin.Context) {
			GetUserProfile(ctx, database)
		})

		user.POST("/favorite/tag", func(ctx *gin.Context) {
			AddFavoriteByName(ctx, database, "tag", "tags", db.AddFavoriteTag)
		})
		user.POST("/favorite/artist", func(ctx *gin.Context) {
			AddFavoriteByName(ctx, database, "artist", "artists", db.AddFavoriteArtist)
		})
		user.POST("/favorite/character", func(ctx *gin.Context) {
			AddFavoriteByName(ctx, database, "character", "characters", db.AddFavoriteCharacter)
		})
		user.POST("/favorite/parody", func(ctx *gin.Context) {
			AddFavoriteByName(ctx, database, "parody", "parodies", db.AddFavoriteParody)
		})
		user.POST("/favorite/group", func(ctx *gin.Context) {
			AddFavoriteByName(ctx, database, "group", "groups", db.AddFavoriteGroup)
		})
		user.POST("/favorite/language", func(ctx *gin.Context) {
			AddFavoriteByName(ctx, database, "language", "languages", db.AddFavoriteLanguage)
		})
		user.POST("/favorite/category", func(ctx *gin.Context) {
			AddFavoriteByName(ctx, database, "category", "categories", db.AddFavoriteCategory)
		})

		user.DELETE("/favorite/tag", func(ctx *gin.Context) {
			RemoveFavoriteByName(ctx, database, "tag", "tags", db.RemoveFavoriteTag)
		})
		user.DELETE("/favorite/artist", func(ctx *gin.Context) {
			RemoveFavoriteByName(ctx, database, "artist", "artists", db.RemoveFavoriteArtist)
		})
		user.DELETE("/favorite/character", func(ctx *gin.Context) {
			RemoveFavoriteByName(ctx, database, "character", "characters", db.RemoveFavoriteCharacter)
		})
		user.DELETE("/favorite/parody", func(ctx *gin.Context) {
			RemoveFavoriteByName(ctx, database, "parody", "parodies", db.RemoveFavoriteParody)
		})
		user.DELETE("/favorite/group", func(ctx *gin.Context) {
			RemoveFavoriteByName(ctx, database, "group", "groups", db.RemoveFavoriteGroup)
		})
		user.DELETE("/favorite/language", func(ctx *gin.Context) {
			RemoveFavoriteByName(ctx, database, "language", "languages", db.RemoveFavoriteLanguage)
		})
		user.DELETE("/favorite/category", func(ctx *gin.Context) {
			RemoveFavoriteByName(ctx, database, "category", "categories", db.RemoveFavoriteCategory)
		})

		user.GET("/favorite/tags", func(ctx *gin.Context) {
			GetFavoriteNames(ctx, database, "favorite_tags", "tag_id", "tags", "tags")
		})
		user.GET("/favorite/artists", func(ctx *gin.Context) {
			GetFavoriteNames(ctx, database, "favorite_artists", "artist_id", "artists", "artists")
		})
		user.GET("/favorite/characters", func(ctx *gin.Context) {
			GetFavoriteNames(ctx, database, "favorite_characters", "character_id", "characters", "characters")
		})
		user.GET("/favorite/parodies", func(ctx *gin.Context) {
			GetFavoriteNames(ctx, database, "favorite_parodies", "parody_id", "parodies", "parodies")
		})
		user.GET("/favorite/groups", func(ctx *gin.Context) {
			GetFavoriteNames(ctx, database, "favorite_groups", "group_id", "groups", "groups")
		})
		user.GET("/favorite/languages", func(ctx *gin.Context) {
			GetFavoriteNames(ctx, database, "favorite_languages", "language_id", "languages", "languages")
		})
		user.GET("/favorite/categories", func(ctx *gin.Context) {
			GetFavoriteNames(ctx, database, "favorite_categories", "category_id", "categories", "categories")
		})

		user.POST("/doujinshi/:id/progress", func(ctx *gin.Context) {
			SetDoujinshiProgress(ctx, database)
		})
		user.GET("/doujinshi/:id/progress", func(ctx *gin.Context) {
			GetDoujinshiProgress(ctx, database)
		})

		user.POST("/doujinshi/:id/bookmark", func(ctx *gin.Context) {
			AddBookmark(ctx, database)
		})
		user.GET("/doujinshi/:id/bookmarks", func(ctx *gin.Context) {
			ListBookmarks(ctx, database)
		})
		user.DELETE("/doujinshi/:id/bookmark", func(ctx *gin.Context) {
			RemoveBookmark(ctx, database)
		})

	}

	// fetches from external source to fill up database
	n := r.Group("/n")
	{
		n.GET("/authCheck", func(ctx *gin.Context) {
			AuthCheck(ctx, rootURL, http_config)
		})

		n.GET("/favorites/download", func(ctx *gin.Context) {
			saveMetadata := ctx.DefaultQuery("save_metadata", "true")
			skipOrganized := ctx.DefaultQuery("skip_organized", "true")
			// NOTE: for testing you can change the page number
			DownloadFavorites(ctx, rootURL, "2", http_config, database,
				saveMetadata == "true",
				skipOrganized == "true")
		})
	}

	return r
}
