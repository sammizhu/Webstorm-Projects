// Bind data to d3
d3.csv("data/buildings.csv").then(function(data) {
    initBarChart(data);
});

// Set up chart dimensions
const width = 650;
const height = 500;
const barWidth = 40;
const barPadding = 10;
const labelAreaWidth = 100;

// Helper function to load the information into the Bar Chart
function initBarChart(data) {
    // Sort the data in descending order by height
    const sortedBuildings = data.sort((a, b) => b.height_px - a.height_px);

    // Create an SVG container within the #chart-area div
    const svg = d3.select("#chart-area")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("border", "1px solid black");

    // Bind data to bars
    svg.selectAll(".bar")
        .data(sortedBuildings)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", labelAreaWidth + 80) // Shift bars to the right to make space for labels
        .attr("y", (d, i) => i * (barWidth + barPadding)) // Stack the bars vertically
        .attr("width", d => d.height_px) // Hardcode height - not using dynamic scales
        .attr("height", barWidth)
        .attr("fill", "steelblue")
        .on("click", handleBuildingClick); // Interactive event - if clicked on bar, run showBuildingDetails

    // Building Name labels
    svg.selectAll(".building-label")
        .data(sortedBuildings)
        .enter()
        .append("text")
        .attr("class", "building-label")
        .attr("x", labelAreaWidth + 77) // Position labels to the left of the bars
        .attr("y", (d, i) => i * (barWidth + barPadding) + barWidth / 2) // Align labels vertically
        .attr("text-anchor", "end") // Right-align text
        .attr("dy", ".35em") // Adjust for vertical centering
        .text(d => d.building)
        .style("fill", "black")
        .style("font-size", "11px")
        .on("click", handleBuildingClick); // Interactive handling

    // Height labels
    svg.selectAll(".height-label")
        .data(sortedBuildings)
        .enter()
        .append("text")
        .attr("class", "height-label")
        .attr("x", d => 185 + Math.max(d.height_px - 15, 10)) // Adjust positioning inside the bar for padding since it was shifted - used max function in case there is no initial value
        .attr("y", (d, i) => i * (barWidth + barPadding) + barWidth / 2) // Center vertically in the bar - got equation from just guess and checking
        .attr("text-anchor", "end") // Align text to the right inside the bar
        .attr("dy", ".35em") // Adjust for vertical centering
        .text(d => `${d.height_m}`) // Display the height in meters
        .style("fill", "white")
        .style("font-size", "11px");
}

// Interactive feature
function handleBuildingClick(event, d) {
    showBuildingDetails(d);
}

// Portraying data on right column
function showBuildingDetails(building) {
    d3.select("#placeholder-text").style("display", "none"); // removes the "select building to view" once a building is chosen

    d3.select("#building-name").text(building.building);
    d3.select("#building-height").text(`Height: ${building.height_m}`);
    d3.select("#building-city").text(`City: ${building.city}`);
    d3.select("#building-country").text(`Country: ${building.country}`);
    d3.select("#building-floors").text(`Floors: ${building.floors}`);
    d3.select("#building-completed").text(`Completed: ${building.completed}`);

    // Display image
    const imagePath = `img/${building.image}`;
    if (building.image) {
        d3.select("#building-image")
            .attr("src", imagePath)
            .style("display", "block");
    } else {
        d3.select("#building-image").style("display", "none");
    }

    // Update Wikipedia link and make it visible
    const wikiLink = `https://en.wikipedia.org/wiki/${building.building.replace(/ /g, "_")}`; //regex
    d3.select("#building-link")
        .attr("href", wikiLink)
        .html('» Read more on Wikipedia')
        .style("display", "block");  // Make the link visible
}
