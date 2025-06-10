package main

import (
	"fmt"
	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/routes"
	_ "github.com/mattn/go-sqlite3"
	"log"
)

func main() {
	fmt.Println("Configuring daatabase ... ")
	database, err := db.InitDB("./h_save.db")
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()
	fmt.Println("Database configured!")

	rootURL := "https://nhentai.net"

	r := routes.SetupRouter(database, rootURL)
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
