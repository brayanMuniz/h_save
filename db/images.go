package db

import (
	"crypto/sha256"
	"database/sql"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

func GetAllImages(db *sql.DB) ([]Image, error) {
	rows, err := db.Query(`
	SELECT
		i.id, COALESCE(i.source, '') as source, COALESCE(i.external_id, '') as external_id,
		i.filename, i.file_path, i.file_size, i.width, i.height, i.format, i.uploaded,
		COALESCE(i.hash, '') as hash,
		COALESCE(p.rating, 0) as rating,
		COALESCE(p.o_count, 0) as o_count,
		COALESCE(p.view_count, 0) as view_count
	FROM images i
	LEFT JOIN image_progress p ON i.id = p.image_id
	ORDER BY i.uploaded DESC
	`)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var imageList []Image
	for rows.Next() {
		var img Image
		err := rows.Scan(
			&img.ID, &img.Source, &img.ExternalID, &img.Filename, &img.FilePath,
			&img.FileSize, &img.Width, &img.Height, &img.Format, &img.Uploaded,
			&img.Hash, &img.Rating, &img.OCount, &img.ViewCount,
		)
		if err != nil {
			return nil, err
		}
		imageList = append(imageList, img)
	}

	// Process each image's metadata concurrently
	results := make([]Image, len(imageList))
	semaphore := make(chan struct{}, 50)

	var wg sync.WaitGroup
	for i, img := range imageList {
		wg.Add(1)
		go func(index int, image Image) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			populateImageDetails(db, &image)
			results[index] = image
		}(i, img)
	}

	wg.Wait()
	return results, nil
}

func GetImage(db *sql.DB, id string) (Image, error) {
	var img Image
	err := db.QueryRow(`
		SELECT i.id, COALESCE(i.source, '') as source, COALESCE(i.external_id, '') as external_id,
			i.filename, i.file_path, i.file_size, i.width, i.height, i.format, i.uploaded,
			COALESCE(i.hash, '') as hash
		FROM images i WHERE i.id = ?`, id,
	).Scan(&img.ID, &img.Source, &img.ExternalID, &img.Filename, &img.FilePath,
		&img.FileSize, &img.Width, &img.Height, &img.Format, &img.Uploaded, &img.Hash)

	if err != nil {
		return img, err
	}

	populateImageDetails(db, &img)
	return img, nil
}

func GetSimilarImagesByMetaData(
	db *sql.DB,
	excludedImageID string,
	characters []string,
	tags []string,
	parodies []string,
) ([]Image, error) {
	var args []interface{}
	var conditions []string

	if len(characters) > 0 {
		charPlaceholders := make([]string, len(characters))
		for i, char := range characters {
			charPlaceholders[i] = "?"
			args = append(args, char)
		}
		conditions = append(conditions, `
            i.id IN (
                SELECT image_id FROM image_characters ic
                JOIN characters c ON ic.character_id = c.id
                WHERE c.name IN (`+strings.Join(charPlaceholders, ",")+`)
            )
        `)
	}

	if len(tags) > 0 {
		tagPlaceholders := make([]string, len(tags))
		for i, tag := range tags {
			tagPlaceholders[i] = "?"
			args = append(args, tag)
		}
		conditions = append(conditions, `
            i.id IN (
                SELECT image_id FROM image_tags it
                JOIN tags t ON it.tag_id = t.id
                WHERE t.name IN (`+strings.Join(tagPlaceholders, ",")+`)
            )
        `)
	}

	if len(parodies) > 0 {
		parodyPlaceholders := make([]string, len(parodies))
		for i, parody := range parodies {
			parodyPlaceholders[i] = "?"
			args = append(args, parody)
		}
		conditions = append(conditions, `
            i.id IN (
                SELECT image_id FROM image_parodies ip
                JOIN parodies p ON ip.parody_id = p.id
                WHERE p.name IN (`+strings.Join(parodyPlaceholders, ",")+`)
            )
        `)
	}

	var whereClause string
	if len(conditions) > 0 {
		whereClause = "(" + strings.Join(conditions, " OR ") + ") AND "
	} else {
		return []Image{}, nil
	}

	args = append(args, excludedImageID)

	query := `
	SELECT i.id, COALESCE(i.source, '') as source, COALESCE(i.external_id, '') as external_id,
		i.filename, i.file_path, i.file_size, i.width, i.height, i.format, i.uploaded,
		COALESCE(i.hash, '') as hash
	FROM images i
	WHERE ` + whereClause + `i.id != ?
	ORDER BY i.uploaded DESC
	`

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Image
	for rows.Next() {
		var img Image
		if err := rows.Scan(&img.ID, &img.Source, &img.ExternalID,
			&img.Filename, &img.FilePath, &img.FileSize, &img.Width, &img.Height,
			&img.Format, &img.Uploaded, &img.Hash); err != nil {
			return nil, err
		}
		populateImageDetails(db, &img)
		results = append(results, img)
	}
	return results, nil
}

func ImageExists(db *sql.DB, filePath string) (bool, error) {
	var exists bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM images WHERE file_path = ?)`, filePath,
	).Scan(&exists)
	return exists, err
}

func ImageExistsByHash(db *sql.DB, hash string) (bool, error) {
	var exists bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM images WHERE hash = ?)`, hash,
	).Scan(&exists)
	return exists, err
}

func InsertImageWithMetadata(db *sql.DB, img Image) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	result, err := tx.Exec(`
        INSERT INTO images (source, external_id, filename, file_path, file_size, width, height, format, hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, img.Source, img.ExternalID, img.Filename, img.FilePath, img.FileSize,
		img.Width, img.Height, img.Format, img.Hash)
	if err != nil {
		return err
	}

	imageID, err := result.LastInsertId()
	if err != nil {
		return err
	}

	if err := linkImageManyToMany(tx, imageID, img.Tags, "tags", "image_tags", "tag_id"); err != nil {
		return err
	}
	if err := linkImageManyToMany(tx, imageID, img.Artists, "artists", "image_artists", "artist_id"); err != nil {
		return err
	}
	if err := linkImageManyToMany(tx, imageID, img.Characters, "characters", "image_characters", "character_id"); err != nil {
		return err
	}
	if err := linkImageManyToMany(tx, imageID, img.Parodies, "parodies", "image_parodies", "parody_id"); err != nil {
		return err
	}
	if err := linkImageManyToMany(tx, imageID, img.Groups, "groups", "image_groups", "group_id"); err != nil {
		return err
	}
	if err := linkImageManyToMany(tx, imageID, img.Categories, "categories", "image_categories", "category_id"); err != nil {
		return err
	}

	return tx.Commit()
}

func linkImageManyToMany(tx *sql.Tx, imageID int64, values []string, entityTable, joinTable, entityIDCol string) error {
	for _, v := range values {
		var entityID int64
		_, err := tx.Exec("INSERT OR IGNORE INTO "+entityTable+" (name) VALUES (?)", v)
		if err != nil {
			return err
		}
		err = tx.QueryRow("SELECT id FROM "+entityTable+" WHERE name = ?", v).Scan(&entityID)
		if err != nil {
			return err
		}
		_, err = tx.Exec(
			"INSERT OR IGNORE INTO "+joinTable+" (image_id, "+entityIDCol+") VALUES (?, ?)",
			imageID, entityID,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func populateImageDetails(db *sql.DB, img *Image) {
	// Get progress data
	err := db.QueryRow(`
		SELECT COALESCE(rating, 0), COALESCE(o_count, 0), COALESCE(view_count, 0)
		FROM image_progress WHERE image_id = ?`, img.ID,
	).Scan(&img.Rating, &img.OCount, &img.ViewCount)
	if err != nil && err != sql.ErrNoRows {
		img.Rating = 0
		img.OCount = 0
		img.ViewCount = 0
	}

	type result struct {
		field string
		data  []string
	}

	resultsChan := make(chan result, 6)

	queries := []struct {
		field       string
		entityTable string
		joinTable   string
		entityIDCol string
	}{
		{"tags", "tags", "image_tags", "tag_id"},
		{"artists", "artists", "image_artists", "artist_id"},
		{"characters", "characters", "image_characters", "character_id"},
		{"parodies", "parodies", "image_parodies", "parody_id"},
		{"groups", "groups", "image_groups", "group_id"},
		{"categories", "categories", "image_categories", "category_id"},
	}

	for _, q := range queries {
		go func(query struct {
			field       string
			entityTable string
			joinTable   string
			entityIDCol string
		}) {
			data, _ := getImageRelatedNames(db, img.ID, query.entityTable, query.joinTable, query.entityIDCol)
			resultsChan <- result{field: query.field, data: data}
		}(q)
	}

	for i := 0; i < len(queries); i++ {
		res := <-resultsChan
		switch res.field {
		case "tags":
			img.Tags = res.data
		case "artists":
			img.Artists = res.data
		case "characters":
			img.Characters = res.data
		case "parodies":
			img.Parodies = res.data
		case "groups":
			img.Groups = res.data
		case "categories":
			img.Categories = res.data
		}
	}
}

func getImageRelatedNames(db *sql.DB, imageID int64, entityTable, joinTable, entityIDCol string) ([]string, error) {
	query := `
        SELECT e.name
        FROM ` + entityTable + ` e
        JOIN ` + joinTable + ` j ON e.id = j.` + entityIDCol + `
        WHERE j.image_id = ?
    `
	rows, err := db.Query(query, imageID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		names = append(names, name)
	}
	return names, nil
}

type ScanResult struct {
	TotalScanned int      `json:"total_scanned"`
	NewImages    int      `json:"new_images"`
	Duplicates   int      `json:"duplicates"`
	Errors       []string `json:"errors"`
}

func ScanImagesFolder(db *sql.DB, folderPath string) (ScanResult, error) {
	result := ScanResult{
		Errors: make([]string, 0),
	}

	err := filepath.Walk(folderPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Error accessing %s: %v", path, err))
			return nil // Continue walking
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Check if it's an image file
		if !isImageFile(info.Name()) {
			return nil
		}

		result.TotalScanned++

		// Check if image already exists by file path
		exists, err := ImageExists(db, path)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Error checking existence of %s: %v", path, err))
			return nil
		}

		if exists {
			result.Duplicates++
			return nil
		}

		// Generate image metadata
		imageData, err := generateImageMetadata(path, info)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Error processing %s: %v", path, err))
			return nil
		}

		// Check for duplicate by hash
		if imageData.Hash != "" {
			hashExists, err := ImageExistsByHash(db, imageData.Hash)
			if err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("Error checking hash for %s: %v", path, err))
				return nil
			}
			if hashExists {
				result.Duplicates++
				return nil
			}
		}

		// Insert the image
		err = InsertImageWithMetadata(db, imageData)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Error inserting %s: %v", path, err))
			return nil
		}

		result.NewImages++
		return nil
	})

	if err != nil {
		return result, fmt.Errorf("error walking directory: %v", err)
	}

	return result, nil
}

func generateImageMetadata(filePath string, info os.FileInfo) (Image, error) {
	img := Image{
		Filename: info.Name(),
		FilePath: filePath,
		FileSize: info.Size(),
		Uploaded: time.Now(),
		Format:   strings.ToLower(strings.TrimPrefix(filepath.Ext(info.Name()), ".")),
		// Initialize empty slices for metadata
		Tags:       make([]string, 0),
		Artists:    make([]string, 0),
		Characters: make([]string, 0),
		Parodies:   make([]string, 0),
		Groups:     make([]string, 0),
		Categories: make([]string, 0),
	}

	// Generate file hash
	hash, err := generateFileHash(filePath)
	if err != nil {
		// Don't fail the entire operation for hash generation failure
		img.Hash = ""
	} else {
		img.Hash = hash
	}

	// Get image dimensions
	width, height, err := getImageDimensions(filePath)
	if err != nil {
		// Don't fail for dimension reading failure
		img.Width = 0
		img.Height = 0
	} else {
		img.Width = width
		img.Height = height
	}

	return img, nil
}

func generateFileHash(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", hasher.Sum(nil)), nil
}

func getImageDimensions(filePath string) (int, int, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return 0, 0, err
	}
	defer file.Close()

	config, _, err := image.DecodeConfig(file)
	if err != nil {
		return 0, 0, err
	}

	return config.Width, config.Height, nil
}

func isImageFile(name string) bool {
	ext := strings.ToLower(filepath.Ext(name))
	return ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp" || ext == ".gif"
}

// Image tag management functions
func UpdateImageTags(db *sql.DB, imageID int64, tags []string) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Remove all existing tags for this image
	_, err = tx.Exec("DELETE FROM image_tags WHERE image_id = ?", imageID)
	if err != nil {
		return err
	}

	// Add new tags
	if len(tags) > 0 {
		err = linkImageManyToMany(tx, imageID, tags, "tags", "image_tags", "tag_id")
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func AddImageTags(db *sql.DB, imageID int64, tags []string) error {
	if len(tags) == 0 {
		return nil
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = linkImageManyToMany(tx, imageID, tags, "tags", "image_tags", "tag_id")
	if err != nil {
		return err
	}

	return tx.Commit()
}

func RemoveImageTags(db *sql.DB, imageID int64, tags []string) error {
	if len(tags) == 0 {
		return nil
	}

	// Create placeholders for the IN clause
	placeholders := make([]string, len(tags))
	args := make([]interface{}, len(tags)+1)
	args[0] = imageID

	for i, tag := range tags {
		placeholders[i] = "?"
		args[i+1] = tag
	}

	query := fmt.Sprintf(`
		DELETE FROM image_tags 
		WHERE image_id = ? AND tag_id IN (
			SELECT id FROM tags WHERE name IN (%s)
		)`, strings.Join(placeholders, ","))

	_, err := db.Exec(query, args...)
	return err
}
