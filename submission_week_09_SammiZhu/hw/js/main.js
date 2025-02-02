// main.js

// Variables to store trial results
let trialResults = [];

// Populate trialResults with historicalData if available
if (typeof historicalData !== 'undefined') {
    trialResults = historicalData;
}

// Initialize the results matrix visualization with trialResults
let myResultsMatrixVis = new ResultsMatrixVis("resultsMatrixVisContainer", trialResults);

// Initialize Experiment
let myExperiment = new Experiment("mainVisContainer");

// Function to run trial (called from index.html)
function runTrial() {
    myExperiment.runExperiment();
}