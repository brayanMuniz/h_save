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

	api := r.Group("/api")
	{
		// ============================================================================
		// AUTHENTICATION ROUTES
		// ============================================================================
		api.POST("/user/login", func(ctx *gin.Context) {
			LoginHandler(ctx, database)
		})

		// ============================================================================
		// DOUJINSHI CORE ROUTES
		// ============================================================================
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

		api.GET("/doujinshi/:id/thumbnail", func(ctx *gin.Context) {
			GetDoujinshiThumbnail(ctx, database)
		})

		api.GET("/doujinshi/:id/similar/metadata", func(ctx *gin.Context) {
			GetSimilarDoujinshiByMetadata(ctx, database)
		})

		// ============================================================================
		// ARTIST ROUTES
		// ============================================================================
		api.GET("/artist/:artist", func(ctx *gin.Context) {
			GetArtistDoujins(ctx, database)
		})

		// ============================================================================
		// SYNC ROUTES
		// ============================================================================
		api.GET("/sync", func(ctx *gin.Context) {
			SyncDoujinshi(ctx, database)
		})

		// ============================================================================
		// USER PROFILE ROUTES
		// ============================================================================
		user := api.Group("/user")
		{
			user.GET("/profile", func(ctx *gin.Context) {
				GetUserProfile(ctx, database)
			})

			// ========================================================================
			// DOUJINSHI PROGRESS ROUTES
			// ========================================================================
			user.GET("/doujinshi/:id/progress", func(ctx *gin.Context) {
				GetDoujinshiProgress(ctx, database)
			})

			user.POST("/doujinshi/:id/progress", func(ctx *gin.Context) {
				SetDoujinshiProgress(ctx, database)
			})

			user.PUT("/doujinshi/:id/progress", func(ctx *gin.Context) {
				SetDoujinshiProgress(ctx, database) // Same handler for PUT
			})

			// ========================================================================
			// BOOKMARK ROUTES
			// ========================================================================
			user.POST("/doujinshi/:id/bookmark", func(ctx *gin.Context) {
				AddBookmark(ctx, database)
			})

			user.GET("/doujinshi/:id/bookmarks", func(ctx *gin.Context) {
				ListBookmarks(ctx, database)
			})

			user.DELETE("/doujinshi/:id/bookmark", func(ctx *gin.Context) {
				RemoveBookmark(ctx, database)
			})

			// ========================================================================
			// O-COUNT ROUTES (Page-specific tracking)
			// ========================================================================
			user.POST("/doujinshi/:id/o", func(ctx *gin.Context) {
				SetOCountHandler(ctx, database)
			})

			user.GET("/doujinshi/:id/o", func(ctx *gin.Context) {
				GetOCountHandler(ctx, database)
			})

			user.GET("/doujinshi/:id/o/total", func(ctx *gin.Context) {
				GetTotalOCountHandler(ctx, database)
			})

			// ========================================================================
			// FAVORITE TAG ROUTES
			// ========================================================================
			user.POST("/favorite/tag", func(ctx *gin.Context) {
				AddFavoriteByName(ctx, database, "tag", "tags", db.AddFavoriteTag)
			})

			user.DELETE("/favorite/tag", func(ctx *gin.Context) {
				RemoveFavoriteByName(ctx, database, "tag", "tags", db.RemoveFavoriteTag)
			})

			user.GET("/favorite/tags", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_tags", "tag_id", "tags", "tags")
			})

			// ========================================================================
			// FAVORITE ARTIST ROUTES
			// ========================================================================
			user.POST("/favorite/artist", func(ctx *gin.Context) {
				AddFavoriteByName(ctx, database, "artist", "artists", db.AddFavoriteArtist)
			})

			user.DELETE("/favorite/artist", func(ctx *gin.Context) {
				RemoveFavoriteByName(ctx, database, "artist", "artists", db.RemoveFavoriteArtist)
			})

			user.GET("/favorite/artists", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_artists", "artist_id", "artists", "artists")
			})

			// ========================================================================
			// FAVORITE CHARACTER ROUTES
			// ========================================================================
			user.POST("/favorite/character", func(ctx *gin.Context) {
				AddFavoriteByName(ctx, database, "character", "characters", db.AddFavoriteCharacter)
			})

			user.DELETE("/favorite/character", func(ctx *gin.Context) {
				RemoveFavoriteByName(ctx, database, "character", "characters", db.RemoveFavoriteCharacter)
			})

			user.GET("/favorite/characters", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_characters", "character_id", "characters", "characters")
			})

			// ========================================================================
			// FAVORITE PARODY ROUTES
			// ========================================================================
			user.POST("/favorite/parody", func(ctx *gin.Context) {
				AddFavoriteByName(ctx, database, "parody", "parodies", db.AddFavoriteParody)
			})

			user.DELETE("/favorite/parody", func(ctx *gin.Context) {
				RemoveFavoriteByName(ctx, database, "parody", "parodies", db.RemoveFavoriteParody)
			})

			user.GET("/favorite/parodies", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_parodies", "parody_id", "parodies", "parodies")
			})

			// ========================================================================
			// FAVORITE GROUP ROUTES
			// ========================================================================
			user.POST("/favorite/group", func(ctx *gin.Context) {
				AddFavoriteByName(ctx, database, "group", "groups", db.AddFavoriteGroup)
			})

			user.DELETE("/favorite/group", func(ctx *gin.Context) {
				RemoveFavoriteByName(ctx, database, "group", "groups", db.RemoveFavoriteGroup)
			})

			user.GET("/favorite/groups", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_groups", "group_id", "groups", "groups")
			})

			// ========================================================================
			// FAVORITE LANGUAGE ROUTES
			// ========================================================================
			user.POST("/favorite/language", func(ctx *gin.Context) {
				AddFavoriteByName(ctx, database, "language", "languages", db.AddFavoriteLanguage)
			})

			user.DELETE("/favorite/language", func(ctx *gin.Context) {
				RemoveFavoriteByName(ctx, database, "language", "languages", db.RemoveFavoriteLanguage)
			})

			user.GET("/favorite/languages", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_languages", "language_id", "languages", "languages")
			})

			// ========================================================================
			// FAVORITE CATEGORY ROUTES
			// ========================================================================
			user.POST("/favorite/category", func(ctx *gin.Context) {
				AddFavoriteByName(ctx, database, "category", "categories", db.AddFavoriteCategory)
			})

			user.DELETE("/favorite/category", func(ctx *gin.Context) {
				RemoveFavoriteByName(ctx, database, "category", "categories", db.RemoveFavoriteCategory)
			})

			user.GET("/favorite/categories", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_categories", "category_id", "categories", "categories")
			})
		}
	}

	// ============================================================================
	// EXTERNAL SOURCE ROUTES (nhentai integration)
	// ============================================================================
	n := r.Group("/n")
	{
		n.GET("/authCheck", func(ctx *gin.Context) {
			AuthCheck(ctx, rootURL, http_config)
		})

		n.GET("/favorites/download", func(ctx *gin.Context) {
			saveMetadata := ctx.DefaultQuery("save_metadata", "true")
			skipOrganized := ctx.DefaultQuery("skip_organized", "true")
			// NOTE: for testing you can change the page number
			DownloadFavorites(ctx, rootURL, "1", http_config, database,
				saveMetadata == "true",
				skipOrganized == "true")
		})
	}

	return r
}
