package main

import (
	"fmt"
	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/n"
	"github.com/brayanMuniz/h_save/routes"
	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"os"
)

func main() {
	fmt.Println("Configuring daatabase ... ")
	database, err := db.InitDB("./h_save.db")
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()
	fmt.Println("Database configured!")

	fmt.Println("Getting .env file ...")
	err = godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	rootURL := os.Getenv("ROOT_URL")
	if rootURL != "" {
		fmt.Println("root url loaded")
	}

	csrftoken := os.Getenv("CSRF_TOKEN")
	if csrftoken != "" {
		fmt.Println("csrftoken loaded")
	}

	sessionid := os.Getenv("SESSION_ID")
	if sessionid != "" {
		fmt.Println("sessionid loaded")
	}

	userAgentString := os.Getenv("USER_AGENT_STRING")
	if userAgentString != "" {
		fmt.Println("user agent string loaded")
	}

	testFile := os.Getenv("TEST_FILE")
	if testFile != "" {
		fmt.Println("testfile loaded")
	}

	http_config := n.HTTPConfig{
		CsrfToken:       csrftoken,
		SessionId:       sessionid,
		UserAgentString: userAgentString,
	}

	r := routes.SetupRouter(database, rootURL, http_config)
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
