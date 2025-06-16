package main

import (
	"github.com/brayanMuniz/h_save/db"
	"github.com/brayanMuniz/h_save/routes"
	_ "github.com/mattn/go-sqlite3"
	"log"
)

func main() {
	database, err := db.InitDB("./h_save.db")
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	r := routes.SetupRouter(database)
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
