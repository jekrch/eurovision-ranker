package main

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

/*
*
This script reads the main.csv file and prompts the user to enter values for empty cells in
a specified column for a given year.
*/
func main() {
	csvPath := filepath.Join("..", "..", "public", "main.csv")

	file, err := os.Open(csvPath)
	if err != nil {
		fmt.Printf("Error opening file: %v\n", err)
		os.Exit(1)
	}
	defer file.Close()

	// read CSV file
	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		fmt.Printf("Error reading CSV: %v\n", err)
		os.Exit(1)
	}

	if len(records) == 0 {
		fmt.Println("CSV file is empty")
		os.Exit(1)
	}

	// extract headers (first row)
	headers := records[0]

	inputReader := bufio.NewReader(os.Stdin)

	// prompt for year
	fmt.Print("Enter year to filter by: ")
	yearStr, err := inputReader.ReadString('\n')
	if err != nil {
		fmt.Printf("Error reading input: %v\n", err)
		os.Exit(1)
	}
	yearStr = strings.TrimSpace(yearStr)

	// find year column index
	yearColIdx := -1
	for i, header := range headers {
		if header == "year" {
			yearColIdx = i
			break
		}
	}
	if yearColIdx == -1 {
		fmt.Println("Year column not found in CSV")
		os.Exit(1)
	}

	// print available columns for user to choose from
	fmt.Println("\nAvailable columns:")
	for i, header := range headers {
		fmt.Printf("%d. %s\n", i+1, header)
	}

	// prompt for column
	fmt.Print("\nEnter column name to update: ")
	columnName, err := inputReader.ReadString('\n')
	if err != nil {
		fmt.Printf("Error reading input: %v\n", err)
		os.Exit(1)
	}
	columnName = strings.TrimSpace(columnName)

	// find column index
	columnIdx := -1
	for i, header := range headers {
		if header == columnName {
			columnIdx = i
			break
		}
	}
	if columnIdx == -1 {
		fmt.Printf("Column '%s' not found in CSV\n", columnName)
		os.Exit(1)
	}

	// find indices for to_country, performer, and song columns
	toCountryIdx, performerIdx, songIdx := -1, -1, -1
	for i, header := range headers {
		switch header {
		case "to_country":
			toCountryIdx = i
		case "performer":
			performerIdx = i
		case "song":
			songIdx = i
		}
	}

	if toCountryIdx == -1 || performerIdx == -1 || songIdx == -1 {
		fmt.Println("Required columns (to_country, performer, song) not found in CSV")
		os.Exit(1)
	}

	// count how many rows to process
	rowsToProcess := 0
	for i := 1; i < len(records); i++ {
		if i < len(records) && len(records[i]) > yearColIdx && len(records[i]) > columnIdx {
			if records[i][yearColIdx] == yearStr && records[i][columnIdx] == "" {
				rowsToProcess++
			}
		}
	}

	fmt.Printf("\nFound %d rows from year %s with empty '%s' values\n\n", rowsToProcess, yearStr, columnName)

	if rowsToProcess == 0 {
		fmt.Println("No rows to update. Exiting.")
		os.Exit(0)
	}

	// process rows matching the year with empty values in the specified column
	updatedCount := 0

	for i := 1; i < len(records); i++ {
		if i < len(records) && len(records[i]) > yearColIdx && len(records[i]) > columnIdx {
			// check if the row matches the year and has an empty value in the specified column
			if records[i][yearColIdx] == yearStr && records[i][columnIdx] == "" {
				// Extract information to display
				toCountry := "N/A"
				performer := "N/A"
				song := "N/A"

				if len(records[i]) > toCountryIdx {
					toCountry = records[i][toCountryIdx]
				}
				if len(records[i]) > performerIdx {
					performer = records[i][performerIdx]
				}
				if len(records[i]) > songIdx {
					song = records[i][songIdx]
				}

				// Display information and prompt for value
				fmt.Printf("Row %d: Country: %s, Performer: %s, Song: %s\n", i, toCountry, performer, song)
				fmt.Printf("Enter value for '%s' (or press Enter to skip): ", columnName)

				value, err := inputReader.ReadString('\n')
				if err != nil {
					fmt.Printf("Error reading input: %v\n", err)
					continue
				}
				value = strings.TrimSpace(value)

				// If a value was provided, update the record
				if value != "" {
					records[i][columnIdx] = value
					updatedCount++
					fmt.Println("Value updated.")
				} else {
					fmt.Println("Row skipped.")
				}
				fmt.Println() // Add a blank line for better readability
			}
		}
	}

	// write the updated records back to the CSV file
	if updatedCount > 0 {
		fmt.Printf("Updated %d rows. Writing changes to file...\n", updatedCount)

		// create a temporary file
		tempFile, err := os.Create(csvPath + ".tmp")
		if err != nil {
			fmt.Printf("Error creating temporary file: %v\n", err)
			os.Exit(1)
		}
		defer tempFile.Close()

		// Write records to the temporary file
		writer := csv.NewWriter(tempFile)
		err = writer.WriteAll(records)
		if err != nil {
			fmt.Printf("Error writing to temporary file: %v\n", err)
			os.Exit(1)
		}
		writer.Flush()

		// Replace the original file with the temporary file
		err = os.Rename(csvPath+".tmp", csvPath)
		if err != nil {
			fmt.Printf("Error replacing original file: %v\n", err)
			os.Exit(1)
		}

		fmt.Println("CSV file updated successfully.")
	} else {
		fmt.Println("No rows were updated.")
	}
}
