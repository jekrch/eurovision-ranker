![Version](https://img.shields.io/badge/version-4.1.1-blue)
![Run Tests](https://github.com/jekrch/eurovision-ranker/actions/workflows/test_on_push.yml/badge.svg)

# Eurovision Ranker :yellow_heart:

[https://www.eurovision-ranker.com/](https://www.eurovision-ranker.com/)

Eurovision Ranker is a web app for ranking Eurovision Song Contestant participants. It draws on data from the [Eurovision-Dataset](https://github.com/Spijkervet/eurovision-dataset) for each contest year going back to 1956. [Eurovisionworld](https://www.Eurovisionworld.com) is the original source of much of the dataset and they've done an outstanding job of maintaining accurate records from each contest.   

A user's ranking is stored in the URL so it can be easily saved for later reference or shared with friends. [React Joyride](https://react-joyride.com/) is used to provide a tour that demos other features: e.g. generating YouTube playlists and exploring official voting results from previous years. 

Users can also view a geographical heat map of their ranking, which is implemented using [React Simple Maps](https://www.react-simple-maps.io/).

Multiple rankings can be created by category with different weights given to each category to reflect the user's preferences. A weighted total ranking can then be calculated, which better reflects the competing values that contribute to the user's final judgment.

<img width="300" alt="image" src="https://github.com/jekrch/eurovision-ranker/assets/8173930/71bc60c8-7630-4df6-830d-fdddb28f4010">
<img width="300" alt="image" src="https://github.com/jekrch/eurovision-ranker/assets/8173930/a6545c3f-ecc2-43cc-83e3-5dbd26ad72b9">

## Getting Started 

Start app with `npm run start`

Run unit tests `npm test`

## Run Tests Workflow
This project uses GitHub Actions to automate running tests. The workflow is defined in ``.github/workflows`` and is named "Run Tests" ([test_on_push.yml](https://github.com/jekrch/eurovision-ranker/blob/main/.github/workflows/test_on_push.yml)). This workflow is triggered on every push to the `main` and `dev` branches. 


