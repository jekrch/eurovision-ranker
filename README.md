An app for ranking Eurovision countries.

# Getting Started 

Start app with `npm run start`

Run unit tests `npm test`

# Automated Testing with GitHub Actions
## Run Tests Workflow
This project uses GitHub Actions to automate running tests. The workflow is defined in the .github/workflows directory and is named "Run Tests".

### When it Runs
The "Run Tests" workflow is triggered on every push to the `main` and `dev` branches. 

### Workflow Steps
1. The latest version of the code is checked out.

2. Node.js is set up in the virtual environment provided by GitHub Actions. The current workflow is configured to use Node.js version 16.x.

3. All necessary npm dependencies are installed using `npm ci`.

4. The unit tests in the project are executed using `npm run test`.