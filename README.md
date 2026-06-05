# Eurovision Ranker :yellow_heart:

![Version](https://img.shields.io/badge/version-11.1-blue)
![Run Tests](https://github.com/jekrch/eurovision-ranker/actions/workflows/test_on_push.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[eurovision-ranker.com/](https://www.eurovision-ranker.com/)

[Eurovision Ranker](https://www.eurovision-ranker.com/) is a web application for creating, sharing, and analyzing rankings of Eurovision Song Contest participants.

A user's ranking lives entirely in the URL: the ordered list of contestants is compressed into a query param, along with the name, year, and any active vote overlays. That keeps the whole thing serverless: a ranking is just a link you can bookmark or send to a friend, and the app reconstructs it on load. [React Joyride](https://react-joyride.com/) provides a tour that demos the rest: generating YouTube playlists, exploring official voting results from past years, and more.

Users can also view a geographical heat map of their ranking, implemented with [React Simple Maps](https://www.react-simple-maps.io/).

Rankings can be split into multiple categories, each given its own weight to reflect what the user actually cares about (song, performance, staging, whatever). A weighted total is then calculated across categories, so the final order reflects the competing priorities behind the judgment rather than a single gut call.

<img width="300" alt="image" src="https://github.com/user-attachments/assets/46bce748-9fb5-404f-8325-544a396adbf8">
<img width="300" alt="image" src="https://github.com/user-attachments/assets/bd0525c2-50ef-49ff-87b0-efa8b6adc50b">
<br/><br/>
<img width="300" alt="image" src="https://github.com/user-attachments/assets/fd1c1f2b-e0fa-4bf9-ac23-41de32e70de0">
<img width="300" alt="image" src="https://github.com/user-attachments/assets/755c132a-5c51-41cd-94c6-35d8baf8d3db">


## Features

- Rank Eurovision contestants from 1956 to present, by drag-and-drop or the pairwise sorter
- Share any ranking as a URL, no account needed
- Split a ranking into weighted categories and compute a weighted total
- Generate YouTube playlists from your ranking
- Explore official voting results (jury / televote splits where available) and overlay them on your ranking
- Geographical heat map of your ranking
- Per-song detail view: lyrics with English translations, an in-app video player, and the song's vote breakdown
- Export rankings as text, JSON, CSV, or Excel
- Render a ranking to a shareable image with configurable styling
- A built-in trivia quiz generated from the contest data

## Quiz

The app generates trivia quizzes straight from the contest dataset: no hand-authored question bank. You pick which years and question types to include (country of artist, artist of song, contest/televote/jury winner, podium finishes, nul points), plus difficulty and length, and it builds a quiz from there. Difficulty controls how many options you get and whether distractors are pulled from near-misses (e.g. the country that *actually* finished 4th) rather than random entries, so "hard" is genuinely harder.

Every quiz is reproducible: the config and a seed are encoded into a short shareable code, so a friend who opens your code gets the exact same questions. Results can be exported as an image to share your score.

## Pairwise Comparison Sorter

<img width="300" alt="image" src="https://github.com/user-attachments/assets/5cf4e450-4534-4725-92a2-329d1181b149">

Eurovision Ranker includes a sorter, which generates a ranking from a user's pairwise preferences. Other sorters exist, but this one allows expanded flexibility:

*   **Pick Any Mix:** Select any group of contestants you want to compare, regardless of the year they competed.
*   **Review and Undo:** Use back button to review your previous choices and fix any mistakes!

This lets you create rankings that accurately reflect your preferences in a quick and simple way.

## Ranking Analysis

There's also an analysis view (currently in beta) for putting a ranking in context. It can diff your order against the official results (or against another ranking) and surface the entries you most over- and under-rated relative to the vote. Across a set of rankings it finds the most similar and most dissimilar pairs, scoring agreement position-by-position rather than treating a list as all-or-nothing.

## Stack

- TypeScript
- React
- Redux Toolkit
- Tailwind CSS
- Vite + Vitest
- Go / Python for the ETL scripts that build the contest dataset

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/jekrch/eurovision-ranker.git
   cd eurovision-ranker
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Running the Application

```
npm run start
```

The application will be available at `http://localhost:3000`

### Running Tests

```
npm run test
```

## Continuous Integration

This project uses GitHub Actions for continuous integration. The "Run Tests" workflow (`test_on_push.yml`) automatically runs the test suite on every push to the `main` and `dev` branches.

## Data Source

Eurovision Ranker utilizes data from the [Eurovision-Dataset](https://github.com/Spijkervet/eurovision-dataset), which covers contest years from 1956 onwards. Much of this data was originally sourced from [Eurovisionworld](https://www.Eurovisionworld.com).

## Accounts & Sharing (in progress)

The app has always been deliberately serverless: rankings live in the URL and nothing is stored on a backend. I'm now adding an optional account layer on top of that, backed by a companion Go + Postgres service ([eurovision-api](https://github.com/jekrch/eurovision-api)). It keeps the URL-as-source-of-truth model intact: the stored ranking is the same compressed string the URL already uses, so accounts are additive rather than a rewrite.

The first wave covers registration (with email verification and password reset), saving named rankings to your account, and ranking groups: create a group, invite people with single-use links, and share rankings within it. This is live behind an invite-only private beta while I harden it; the public sign-up flow and the rest of the planned functionality are on the way.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- [React Joyride](https://react-joyride.com/) for the interactive tour feature
- [React Simple Maps](https://www.react-simple-maps.io/) for the geographical heat map implementation
- [Eurovisionworld](https://www.Eurovisionworld.com) for maintaining accurate and thorough Eurovision contest records
