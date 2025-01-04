# Eurovision Ranker :yellow_heart:

![Version](https://img.shields.io/badge/version-5.8-blue)
![Run Tests](https://github.com/jekrch/eurovision-ranker/actions/workflows/test_on_push.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[https://www.eurovision-ranker.com/](https://www.eurovision-ranker.com/)

[Eurovision Ranker](https://www.eurovision-ranker.com/) is a web application for creating, sharing, and analyzing rankings of Eurovision Song Contest participants.

A user's ranking is stored in the URL so it can be easily saved for later reference or shared with friends. [React Joyride](https://react-joyride.com/) is used to provide a tour that demos other features: e.g. generating YouTube playlists and exploring official voting results from previous years. 

Users can also view a geographical heat map of their ranking, which is implemented using [React Simple Maps](https://www.react-simple-maps.io/).

Multiple rankings can be created by category with different weights given to each category to reflect the user's preferences. A weighted total ranking can then be calculated, which reflects the competing values contributing to the user's final judgment.

<img width="300" alt="image" src="https://github.com/user-attachments/assets/8e89f5b5-1a5b-4e68-b36d-6efbac6c089a">
<img width="300" alt="image" src="https://github.com/user-attachments/assets/496d3d67-8375-4659-b906-dee288aec8b0">
<br/><br/>
<img width="300" alt="image" src="https://github.com/user-attachments/assets/84f77d90-5849-43f9-b78d-7aff544470ed">


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
