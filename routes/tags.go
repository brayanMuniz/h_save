package routes

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
)

type TagPageData struct {
	TagDetails    *db.TagData            `json:"tagDetails"`
	DoujinshiList []DoujinshiWithThumb   `json:"doujinshiList"`
	ImagesList    []ImageWithThumb       `json:"imagesList"`
	BookmarksList []db.DoujinshiBookmark `json:"bookmarksList"`
}

func GetAllTagsHandler(ctx *gin.Context, database *sql.DB) {
	tags, err := db.GetAllTags(database)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve tags"})
		return
	}

	if tags == nil {
		tags = []db.TagData{} // Return empty array instead of null
	}

	ctx.JSON(http.StatusOK, gin.H{"tags": tags})
}

func GetTagPageDataHandler(ctx *gin.Context, database *sql.DB) {
	var tagID int64
	var err error

	tagNameQuery := ctx.Query("name")
	if tagNameQuery != "" {
		id, dbErr := db.GetTagIDByName(database, tagNameQuery)
		if dbErr != nil {
			if dbErr == sql.ErrNoRows {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Tag not found by name: " + tagNameQuery})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Database error looking up tag by name"})
			return
		}
		tagID = id
	} else {
		tagIDStr := ctx.Param("id")
		id, parseErr := strconv.ParseInt(tagIDStr, 10, 64)
		if parseErr != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tag ID format in path"})
			return
		}
		tagID = id
	}

	tagDetails, err := db.GetTagDetails(database, tagID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tag details"})
		return
	}
	if tagDetails == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Tag not found"})
		return
	}

	doujinshi, err := db.GetDoujinshiByTag(database, tagID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch doujinshi for tag"})
		return
	}

	var doujinshiWithThumbs []DoujinshiWithThumb
	for _, d := range doujinshi {
		doujinshiWithThumbs = append(doujinshiWithThumbs, DoujinshiWithThumb{
			Doujinshi:    d,
			ThumbnailURL: "/api/doujinshi/" + strconv.FormatInt(d.ID, 10) + "/thumbnail",
		})
	}
	if doujinshiWithThumbs == nil {
		doujinshiWithThumbs = []DoujinshiWithThumb{}
	}

	// Fetch images associated with this tag
	images, err := db.GetImagesByTag(database, tagID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images for tag"})
		return
	}

	var imagesWithThumbs []ImageWithThumb
	for _, img := range images {
		imagesWithThumbs = append(imagesWithThumbs, ImageWithThumb{
			Image:        img,
			ThumbnailURL: "/api/images/" + strconv.FormatInt(img.ID, 10) + "/thumbnail",
		})
	}
	if imagesWithThumbs == nil {
		imagesWithThumbs = []ImageWithThumb{}
	}

	// Fetch bookmarks for doujinshi associated with this tag
	bookmarks, err := db.GetBookmarksByEntity(database, "tag", tagID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookmarks for tag"})
		return
	}
	if bookmarks == nil {
		bookmarks = []db.DoujinshiBookmark{}
	}

	responseData := TagPageData{
		TagDetails:    tagDetails,
		DoujinshiList: doujinshiWithThumbs,
		ImagesList:    imagesWithThumbs,
		BookmarksList: bookmarks,
	}

	ctx.JSON(http.StatusOK, responseData)
}
