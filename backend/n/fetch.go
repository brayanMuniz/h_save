package n

import (
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// NOTE: not currently used
type HTTPConfig struct {
	sessionId       string
	csrfToken       string
	userAgentString string
}

const saveTorrentsFolder = "download_me_senpai"

func GetPageHTML(route, csrfToken, sessionId string) (string, error) {
	req, _ := http.NewRequest("GET", route, nil)
	req.AddCookie(&http.Cookie{Name: "sessionid", Value: sessionId})
	req.AddCookie(&http.Cookie{Name: "csrftoken", Value: csrfToken})

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("Error was of status code 400+")
	}

	if !strings.Contains(resp.Header.Get("Content-Type"), "text/html") {
		return "", fmt.Errorf("Content-Type is not html")
	}

	htmlString, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(htmlString), nil
}

// Download the .torrent file in the ./download_me_senpai folder
func DownloadTorrentFile(downloadRoute, titleName, csrfToken, sessionId string) error {
	req, _ := http.NewRequest("GET", downloadRoute, nil)
	req.AddCookie(&http.Cookie{Name: "sessionid", Value: sessionId})
	req.AddCookie(&http.Cookie{Name: "csrftoken", Value: csrfToken})

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Print(err)
		return err
	}
	defer resp.Body.Close()

	contentType := resp.Header.Get("Content-Type")
	exts, _ := mime.ExtensionsByType(contentType)
	extensionType := ""

	if len(exts) == 0 {
		return fmt.Errorf("There is no extension type")
	}

	extensionType = exts[0]
	if extensionType != ".torrent" {
		return fmt.Errorf("Extension type is not torrent")
	}

	err = os.MkdirAll(saveTorrentsFolder, 0755) // r/w/e user, r/e for others
	if err != nil {
		return err
	}

	fileTitle := titleName + extensionType
	saveRoute := filepath.Join(saveTorrentsFolder, fileTitle)
	out, err := os.Create(saveRoute)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return err
	}

	return nil
}
