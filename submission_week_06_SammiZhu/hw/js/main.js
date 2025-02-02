// Bar chart configurations: data keys and chart titles
let configs = [
    {key: "ownrent", title: "Own or Rent", divId: "bar-chart-ownrent"},
    {key: "electricity", title: "Electricity", divId: "bar-chart-electricity"},
    {key: "latrine", title: "Latrine", divId: "bar-chart-latrine"},
    {key: "hohreligion", title: "Religion", divId: "bar-chart-religion"}
];


// Initialize variables to save the charts later
let barcharts = [];
let areachart;


// Date parser to convert strings to date objects
let parseDate = d3.timeParse("%Y-%m-%d");


// (1) Load CSV data
d3.csv("data/household_characteristics.csv").then(data => {
    // 	(2) Convert strings to date objects
    data.forEach(d => {
        d.survey = parseDate(d.survey);
    });

    // 	(3) Create new bar chart objects
    configs.forEach(config => {
        let barchart = new BarChart(config.divId, data, config);
        barcharts.push(barchart);
    });

    // 	(4) Create new are chart object
    areachart = new AreaChart("area-chart", data);
});


function brushed(event) {
    if (event.selection) {
        // Get selected time range (in pixels) and convert it to dates
        let selectedRange = event.selection.map(areachart.x.invert);

        // Call selectionChanged function for each bar chart with selected date range
        barcharts.forEach(chart => {
            chart.selectionChanged(selectedRange);
        });
    }
}

window.addEventListener("resize", () => {
    // Redraw both charts when resized
    areachart.updateVis();
    barcharts.forEach(chart => chart.updateVis());
});