package main

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
)

type Entry struct {
	ID         string
	Year       string
	Performer  string
	Song       string
	YouTubeURL string
}

/*
This script reads the main.csv file and verifies that each YouTube URL is valid.
If a URL is invalid, the user is prompted to enter a new URL.
*/
func main() {
	file, err := os.Open("../public/main.csv")
	if err != nil {
		fmt.Printf("Error opening file: %v\n", err)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)

	header, err := reader.Read()
	if err != nil {
		fmt.Printf("Error reading header: %v\n", err)
		return
	}

	// find column indices
	var idIdx, yearIdx, performerIdx, songIdx, youtubeIdx int
	for i, column := range header {
		switch strings.ToLower(column) {
		case "id":
			idIdx = i
		case "year":
			yearIdx = i
		case "performer":
			performerIdx = i
		case "song":
			songIdx = i
		case "youtube_url":
			youtubeIdx = i
		}
	}

	// create a new CSV file for output
	outputFile, err := os.Create("output2.csv")
	if err != nil {
		fmt.Printf("Error creating output file: %v\n", err)
		return
	}
	defer outputFile.Close()

	writer := csv.NewWriter(outputFile)
	defer writer.Flush()

	// write the same header (without adding thumbnail column)
	if err := writer.Write(header); err != nil {
		fmt.Printf("Error writing header to output file: %v\n", err)
		return
	}

	// scanner for reading user input
	scanner := bufio.NewScanner(os.Stdin)

	// process each row
	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Printf("Error reading row: %v\n", err)
			continue
		}

		entry := Entry{
			ID:         row[idIdx],
			Year:       row[yearIdx],
			Performer:  row[performerIdx],
			Song:       row[songIdx],
			YouTubeURL: row[youtubeIdx],
		}

		// extract video ID and verify it works
		videoID := extractVideoID(entry.YouTubeURL)
		needNewURL := false

		if videoID == "" {
			fmt.Printf("Could not extract video ID from URL: %s\n", entry.YouTubeURL)
			needNewURL = true
		} else {
			// check if video thumbnail exists (to verify video exists)
			thumbnailURL := fmt.Sprintf("https://img.youtube.com/vi/%s/hqdefault.jpg", videoID)
			resp, err := http.Head(thumbnailURL)
			if err != nil || resp.StatusCode != http.StatusOK {
				fmt.Printf("Error: Video might be unavailable (thumbnail not found) for %s\n", videoID)
				needNewURL = true
			}
		}

		// if we need a new URL, prompt the user
		if needNewURL {
			fmt.Printf("Year: %s, Performer: %s, Song: %s\n", entry.Year, entry.Performer, entry.Song)
			fmt.Print("Enter new YouTube URL (or press Enter to keep original): ")

			scanner.Scan()
			newURL := scanner.Text()

			if newURL != "" {
				// update the youtube url in the row
				row[youtubeIdx] = newURL

				// verify new url
				videoID = extractVideoID(newURL)
				if videoID == "" {
					fmt.Println("Warning: Could not extract video ID from new URL. Using it anyway.")
				} else {
					// verify the new thumbnail if needed
					thumbnailURL := fmt.Sprintf("https://img.youtube.com/vi/%s/hqdefault.jpg", videoID)
					resp, err := http.Head(thumbnailURL)
					if err != nil || resp.StatusCode != http.StatusOK {
						fmt.Println("Warning: New video might also be unavailable. Using it anyway.")
					}
				}
			}
		}

		// write the row to output file (with possibly updated YouTube URL)
		if err := writer.Write(row); err != nil {
			fmt.Printf("Error writing row to output file: %v\n", err)
		}

		fmt.Printf("Processed: %s - %s (%s)\n", entry.Performer, entry.Song, entry.Year)
	}

	fmt.Println("Processing complete. Results saved to output.csv")
}

// extractVideoID extracts the YouTube video ID from various URL formats
func extractVideoID(url string) string {
	if url == "" {
		return ""
	}

	// handle different YouTube URL formats
	var videoID string

	// format: https://www.youtube.com/watch?v=VIDEO_ID
	watchRegex := regexp.MustCompile(`(?:youtube\.com/watch\?v=|youtu\.be/)([^&?/]+)`)
	matches := watchRegex.FindStringSubmatch(url)

	if len(matches) > 1 {
		videoID = matches[1]
	}

	return videoID
}
