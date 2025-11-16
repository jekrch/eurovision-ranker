# Eurovision Ranker :light_blue_heart:

![Version](https://img.shields.io/badge/version-10.0-blue)
![Run Tests](https://github.com/jekrch/eurovision-ranker/actions/workflows/test_on_push.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[eurovision-ranker.com/](https://www.eurovision-ranker.com/)

[Eurovision Ranker](https://www.eurovision-ranker.com/) is a web application for creating, sharing, and analyzing rankings of Eurovision Song Contest participants.

A user's ranking is stored in the URL so it can be easily saved for later reference or shared with friends. [React Joyride](https://react-joyride.com/) is used to provide a tour that demos other features: e.g. generating YouTube playlists and exploring official voting results from previous years.

Users can also view a geographical heat map of their ranking, which is implemented using [React Simple Maps](https://www.react-simple-maps.io/).

Multiple rankings can be created by category with different weights given to each category to reflect the user's preferences. A weighted total ranking can then be calculated, which reflects the competing values contributing to the user's final judgment.

<img width="300" alt="image" src="https://github.com/user-attachments/assets/46bce748-9fb5-404f-8325-544a396adbf8">
<img width="300" alt="image" src="https://github.com/user-attachments/assets/bd0525c2-50ef-49ff-87b0-efa8b6adc50b">
<br/><br/>
<img width="300" alt="image" src="https://github.com/user-attachments/assets/fd1c1f2b-e0fa-4bf9-ac23-41de32e70de0">
<img width="300" alt="image" src="https://github.com/user-attachments/assets/755c132a-5c51-41cd-94c6-35d8baf8d3db">


## Features

- Rank Eurovision contestants from 1956 to present
- Share rankings via URL
- Generate YouTube playlists from your ranking
- Explore official voting results from previous years
- View geographical heat map of rankings
- Create multi-category rankings with weighted totals

## Pairwise Comparison Sorter

<img width="300" alt="image" src="https://github.com/user-attachments/assets/5cf4e450-4534-4725-92a2-329d1181b149">

Eurovision Ranker includes a sorter, which generates a ranking from a user's pairwise preferences. Other sorters exist, but this one allows expanded flexibility:

*   **Pick Any Mix:** Select any group of contestants you want to compare, regardless of the year they competed.
*   **Review and Undo:** Use back button to review your previous choices and fix any mistakes!

This lets you create rankings that accurately reflect your preferences in a quick and simple way.

## Stack

- TypeScript
- React
- Redux Toolkit
- Tailwind CSS
- Vite
- GO/Python for ETL scripts

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

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- [React Joyride](https://react-joyride.com/) for the interactive tour feature
- [React Simple Maps](https://www.react-simple-maps.io/) for the geographical heat map implementation
- [Eurovisionworld](https://www.Eurovisionworld.com) for maintaining accurate and thorough Eurovision contest records
