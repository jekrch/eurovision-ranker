![Version](https://img.shields.io/badge/version-3.5-blue)
![Run Tests](https://github.com/jekrch/eurovision-ranker/actions/workflows/test_on_push.yml/badge.svg)

# Eurovision Ranker :yellow_heart:

[https://www.eurovision-ranker.com/](https://www.eurovision-ranker.com/)

Eurovision Ranker is a web app for ranking Eurovision Song Contestant participants. It draws on data from the [Eurovision-Dataset](https://github.com/Spijkervet/eurovision-dataset) for each contest year going back to 1956. [Eurovisionworld](https://www.Eurovisionworld.com) is the original source of much of the dataset. The've done an outstanding job of maintaining accurate records from each contest.   

A user's ranking is stored in the URL so it can be easily saved for later reference or shared with friends. [React Joyride](https://react-joyride.com/) is used to provide a tour that demos other features: e.g. generating YouTube playlists and exploring official voting results from previous years. 

Users can also view a geographical heat map of their ranking, which is implemented using [React Simple Maps](https://www.react-simple-maps.io/).

Multiple rankings can be created by category with different weights given to each category to reflect the user's preferences. A weighted total ranking can then be calculated, which better reflects the competing values that contribute to the user's final judgment.

## Getting Started 

Start app with `npm run start`

Run unit tests `npm test`

## Automated Testing with GitHub Actions
### Run Tests Workflow
This project uses GitHub Actions to automate running tests. The workflow is defined in the ``.github/workflows`` directory and is named "Run Tests" (`test_on_push.yml`). This workflow is triggered on every push to the `main` and `dev` branches. 


