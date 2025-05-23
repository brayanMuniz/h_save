package n

import (
	"fmt"
	"io"
	"net/http"
	"strings"
)

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
