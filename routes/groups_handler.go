package routes

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/brayanMuniz/h_save/db"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

type GroupPageData struct {
	GroupDetails  *db.GroupData        `json:"groupDetails"`
	DoujinshiList []DoujinshiWithThumb `json:"doujinshiList"`
}

func GetAllGroupsHandler(c *gin.Context, database *sql.DB) {
	groups, err := db.GetAllGroups(database)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch groups"})
		return
	}

	if groups == nil {
		groups = []db.GroupData{} // Ensure an empty array is returned, not null
	}

	c.JSON(http.StatusOK, gin.H{"groups": groups})
}

func GetGroupPageDataHandler(c *gin.Context, database *sql.DB) {
	var groupID int64
	var err error

	groupNameQuery := c.Query("name")
	if groupNameQuery != "" {
		id, dbErr := db.GetGroupIDByName(database, groupNameQuery)
		if dbErr != nil {
			if dbErr == sql.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "Group not found by name: " + groupNameQuery})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error looking up group by name"})
			return
		}
		groupID = id
	} else {
		// If no name query parameter, use the 'id' from the path.
		groupIDStr := c.Param("id")
		id, parseErr := strconv.ParseInt(groupIDStr, 10, 64)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID format in path"})
			return
		}
		groupID = id
	}

	groupDetails, err := db.GetGroupDetails(database, groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group details"})
		return
	}
	if groupDetails == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	doujinshi, err := db.GetDoujinshiByGroup(database, groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch doujinshi for group"})
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

	responseData := GroupPageData{
		GroupDetails:  groupDetails,
		DoujinshiList: doujinshiWithThumbs,
	}

	c.JSON(http.StatusOK, responseData)
}
