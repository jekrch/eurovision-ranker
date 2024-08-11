# Eurovision Ranker :yellow_heart:

![Version](https://img.shields.io/badge/version-4.1.1-blue)
![Run Tests](https://github.com/jekrch/eurovision-ranker/actions/workflows/test_on_push.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[https://www.eurovision-ranker.com/](https://www.eurovision-ranker.com/)

[Eurovision Ranker](https://www.eurovision-ranker.com/) is a web application for creating, sharing, and analyzing rankings of Eurovision Song Contest participants.

A user's ranking is stored in the URL so it can be easily saved for later reference or shared with friends. [React Joyride](https://react-joyride.com/) is used to provide a tour that demos other features: e.g. generating YouTube playlists and exploring official voting results from previous years. 

Users can also view a geographical heat map of their ranking, which is implemented using [React Simple Maps](https://www.react-simple-maps.io/).

Multiple rankings can be created by category with different weights given to each category to reflect the user's preferences. A weighted total ranking can then be calculated, which reflects the competing values contributing to the user's final judgment.

<img width="300" alt="image" src="https://github.com/jekrch/eurovision-ranker/assets/8173930/71bc60c8-7630-4df6-830d-fdddb28f4010">
<img width="300" alt="image" src="https://github.com/jekrch/eurovision-ranker/assets/8173930/a6545c3f-ecc2-43cc-83e3-5dbd26ad72b9">

## Features

- Rank Eurovision contestants from 1956 to present
- Share rankings via URL
- Generate YouTube playlists
- Explore official voting results from previous years
- View geographical heat map of rankings
- Create multi-category rankings with weighted totals

## Stack

- TypeScript
- React
- Redux Toolkit
- Tailwind CSS
- Vite

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

Start the development server:
```
npm run start
```

The application will be available at `http://localhost:3000`.

### Running Tests

Execute the test suite:
```
npm run test
```

## Continuous Integration

This project uses GitHub Actions for continuous integration. The "Run Tests" workflow (`test_on_push.yml`) automatically runs the test suite on every push to the `main` and `dev` branches.

## Data Source

Eurovision Ranker utilizes data from the [Eurovision-Dataset](https://github.com/Spijkervet/eurovision-dataset), which covers contest years from 1956 onwards. Much of this data was originally sourced from [Eurovisionworld](https://www.Eurovisionworld.com).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React Joyride](https://react-joyride.com/) for the interactive tour feature
- [React Simple Maps](https://www.react-simple-maps.io/) for the geographical heat map implementation
- [Eurovisionworld](https://www.Eurovisionworld.com) for maintaining accurate and thorough Eurovision contest records
