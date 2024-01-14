![Version](https://img.shields.io/badge/version-2-blue)
![Run Tests](https://github.com/jekrch/eurovision-ranker/actions/workflows/test_on_push.yml/badge.svg)

[https://www.eurovision-ranker.com/](https://www.eurovision-ranker.com/)

Eurovision Ranker is a web app for ranking Eurovision Song Contestant participants. It draws on data from the [Eurovision-Dataset](https://github.com/Spijkervet/eurovision-dataset) for each contest year going back to 1956. 

A user's ranking is stored in the URL so it can be easily saved for later reference or shared with friends. [React Joyride](https://react-joyride.com/) is used to provide a tour that demos other features: e.g. generating YouTube playlists and exploring official voting results from previous years. 

Users can also view a geographical heat map of their ranking, which is implemented using [React Simple Maps](https://www.react-simple-maps.io/)

# Getting Started 

Start app with `npm run start`

Run unit tests `npm test`

# Automated Testing with GitHub Actions
## Run Tests Workflow
This project uses GitHub Actions to automate running tests. The workflow is defined in the ``.github/workflows`` directory and is named "Run Tests" (`test_on_push.yml`). This workflow is triggered on every push to the `main` and `dev` branches. 

### Workflow Steps
1. The latest version of the code is checked out.

2. Node.js is set up in the virtual environment provided by GitHub Actions. The current workflow is configured to use Node.js version 16.x.

3. All necessary npm dependencies are installed using `npm ci`.

4. The unit tests in the project are executed using `npm run test`.
