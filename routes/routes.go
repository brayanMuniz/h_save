package routes

import (
	"database/sql"
	"net/http"

	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/n"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func SetupRouter(database *sql.DB, rootURL string) *gin.Engine {
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

		// ARTIST
		api.GET("/artists", func(ctx *gin.Context) {
			GetAllArtist(ctx, database)
		})

		api.GET("/artist/:id", func(ctx *gin.Context) {
			GetArtistPageDataHandler(ctx, database)
		})

		// ============================================================================
		// TAG ROUTES
		// ============================================================================
		api.GET("/tags", func(ctx *gin.Context) {
			GetAllTagsHandler(ctx, database)
		})

		api.GET("/tag/:id", func(ctx *gin.Context) {
			GetTagPageDataHandler(ctx, database)
		})

		// GROUPS
		api.GET("/groups", func(ctx *gin.Context) {
			GetAllGroupsHandler(ctx, database)
		})

		api.GET("/group/:id", func(ctx *gin.Context) {
			GetGroupPageDataHandler(ctx, database)
		})

		// CHARACTERS
		api.GET("/characters", func(ctx *gin.Context) {
			GetAllCharactersHandler(ctx, database)
		})

		api.GET("/character/:id", func(ctx *gin.Context) {
			GetCharacterPageDataHandler(ctx, database)
		})

		// PARODY
		api.GET("/parodies", func(ctx *gin.Context) {
			GetAllParodiesHandler(ctx, database)
		})

		api.GET("/parody/:id", func(ctx *gin.Context) {
			GetParodyPageDataHandler(ctx, database)
		})

		// SYNC
		api.POST("/sync", func(ctx *gin.Context) {
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

			user.PATCH("/doujinshi/:id/bookmarks/:bookmarkId", func(ctx *gin.Context) {
				UpdateBookmark(ctx, database)
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
			user.GET("/favorite/tags", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_tags", "tag_id", "tags", "tags")
			})

			user.POST("/favorite/tag/:id", func(ctx *gin.Context) {
				AddFavoriteByID(ctx, database, db.AddFavoriteTag)
			})

			user.DELETE("/favorite/tag/:id", func(ctx *gin.Context) {
				RemoveFavoriteByID(ctx, database, db.RemoveFavoriteTag)
			})

			user.POST("/favorite/tag", func(ctx *gin.Context) {
				AddFavoriteByName(ctx, database, "tag", "tags", db.AddFavoriteTag)
			})

			user.DELETE("/favorite/tag", func(ctx *gin.Context) {
				RemoveFavoriteByName(ctx, database, "tag", "tags", db.RemoveFavoriteTag)
			})

			// ========================================================================
			// FAVORITE ARTIST ROUTES
			// ========================================================================
			user.GET("/favorite/artists", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_artists", "artist_id", "artists", "artists")
			})

			user.POST("/favorite/artist/:id", func(ctx *gin.Context) {
				AddFavoriteByID(ctx, database, db.AddFavoriteArtist)
			})

			user.DELETE("/favorite/artist/:id", func(ctx *gin.Context) {
				RemoveFavoriteByID(ctx, database, db.RemoveFavoriteArtist)
			})

			// FAVORITE CHARACTER
			user.POST("/favorite/character/:id", func(ctx *gin.Context) {
				AddFavoriteByID(ctx, database, db.AddFavoriteCharacter)
			})

			user.DELETE("/favorite/character/:id", func(ctx *gin.Context) {
				RemoveFavoriteByID(ctx, database, db.RemoveFavoriteCharacter)
			})

			user.GET("/favorite/characters", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_characters", "character_id", "characters", "characters")
			})

			// ========================================================================
			// FAVORITE PARODY ROUTES
			// ========================================================================
			user.POST("/favorite/parody/:id", func(ctx *gin.Context) {
				AddFavoriteByID(ctx, database, db.AddFavoriteParody)
			})

			user.DELETE("/favorite/parody/:id", func(ctx *gin.Context) {
				RemoveFavoriteByID(ctx, database, db.RemoveFavoriteParody)
			})

			user.GET("/favorite/parodies", func(ctx *gin.Context) {
				GetFavoriteNames(ctx, database, "favorite_parodies", "parody_id", "parodies", "parodies")
			})

			// ========================================================================
			// FAVORITE GROUP ROUTES
			// ========================================================================
			user.POST("/favorite/group/:id", func(ctx *gin.Context) {
				AddFavoriteByID(ctx, database, db.AddFavoriteGroup)
			})

			user.DELETE("/favorite/group/:id", func(ctx *gin.Context) {
				RemoveFavoriteByID(ctx, database, db.RemoveFavoriteGroup)
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
	// EXTERNAL SOURCE ROUTES
	// ============================================================================
	nhentai := r.Group("/nhentai")
	{
		nhentai.POST("/authCheck", func(ctx *gin.Context) {
			AuthCheck(ctx, rootURL)
		})

		nhentai.POST("/favorites/download", func(ctx *gin.Context) {
			var req struct {
				SessionId     string `json:"sessionId"`
				CsrfToken     string `json:"csrfToken"`
				SaveMetadata  bool   `json:"saveMetadata"`
				SkipOrganized bool   `json:"skipOrganized"`
			}
			if err := ctx.ShouldBindJSON(&req); err != nil {
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
				return
			}

			httpConfig := n.HTTPConfig{
				SessionId: req.SessionId,
				CsrfToken: req.CsrfToken,
			}

			result := DownloadAllFavorites(ctx, rootURL, httpConfig, database,
				req.SaveMetadata, req.SkipOrganized)
			ctx.JSON(http.StatusOK, result)
		})

	}

	return r
}
