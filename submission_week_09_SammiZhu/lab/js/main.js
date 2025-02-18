// Function to convert date objects to strings or reverse
let dateFormatter = d3.timeFormat("%Y-%m-%d");
let dateParser = d3.timeParse("%Y-%m-%d");

// (1) Load data with promises
let promises = [
    d3.json("data/perDayData.json"),
    d3.json("data/myWorldFields.json")
];

Promise.all(promises)
    .then(function (data) {
        createVis(data)
    })
    .catch(function (err) {
        console.log(err)
    });

function createVis(data) {
    let perDayData = data[0];
    let metaData = data[1];

    // (2) Make our data look nicer and more useful
    let allData = perDayData.map(function (d) {
        let result = {
            time: dateParser(d.day),
            count: +d["count(*)"] + 1
        };

        // Convert votes for the 15 priorities from key-value format into one single array (for each day)
        result.priorities = d3.range(0, 15).map(function (counter) {
            return +d["sum(p" + counter + ")"];
        });

        // Create an array of values for age 0 - 98 (representing ages 1 to 99)
        result.ages = d3.range(0, 99).map(function () {
            return 0;
        });

        // Insert the votes in the newly created array 'result.ages'
        d.age.forEach(function (a) {
            if (a.age < 99) {
                result.ages[a.age] = +a["count(*)"];
            }
        });

        return result;
    });

    // (3) Create event handler
    let myEventHandler = d3.dispatch("selectionChanged");

    // (4) Create visualization instances
    let countVis = new CountVis("countvis", allData, myEventHandler);

    // Create instances of AgeVis and PrioVis
    let ageVis = new AgeVis("agevis", allData);
    let prioVis = new PrioVis("priovis", allData, metaData);

    // (5) Bind event handler
    myEventHandler.on("selectionChanged", function(selectionStart, selectionEnd) {
        ageVis.onSelectionChange(selectionStart, selectionEnd);
        prioVis.onSelectionChange(selectionStart, selectionEnd);
    });
}