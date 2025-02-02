
// SVG drawing area
let margin = {top: 40, right: 10, bottom: 60, left: 60};

let width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

let svg = d3.select("#chart-area").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Scales
let x = d3.scaleBand()
    .rangeRound([0, width])
	.paddingInner(0.1);

let y = d3.scaleLinear()
    .range([height, 0]);

loadData();

// Create a 'data' property under the window object
// to store the coffee chain data
Object.defineProperty(window, 'data', {
	// data getter
	get: function() { return _data; },
	// data setter
	set: function(value) {
		_data = value;
		updateVisualization()
	}
});

let xAxisGroup = svg.append("g")
	.attr("class", "x-axis axis")
	.attr("transform", `translate(0, ${height})`);

let yAxisGroup = svg.append("g")
	.attr("class", "y-axis axis");

let yAxisTitle = svg.append("text")
	.attr("class", "y-axis-title")
	.attr("text-anchor", "middle")
	.attr("dy", "-1em") //to offset

// Load CSV file
function loadData() {
	d3.csv("data/coffee-house-chains.csv").then(csv=> {

		csv.forEach(function(d){
			d.revenue = +d.revenue;
			d.stores = +d.stores;
		});

		// Store csv data in global variable
		data = csv;

        // updateVisualization gets automatically called within the data = csv call;
		// basically(whenever the data is set to a value using = operator);
		// see the definition above: Object.defineProperty(window, 'data', { ...
	});
}

// Selecting to see which group user wants to filter by
d3.select("#ranking-type").on("change", function () {
	let selectedOption = d3.select(this).property("value");
	updateVisualization(selectedOption);
});

function updateVisualization(selectedOption = "stores") {
	console.log(`Selected option: ${selectedOption}`);
	console.log(data);

	// Set domains based on selected option
	x.domain(data.map(d => d.company));
	y.domain([0, d3.max(data, d => d[selectedOption])]);

	data.sort((a, b) => b[selectedOption] - a[selectedOption]);

	let bars = svg.selectAll(".bar")
		.data(data, d => d.company);

	// Enter
	bars.enter().append("rect")
		.attr("class", "bar")
		.attr("x", d=> x(d.company))
		.attr("y", d=> y(d.stores))
		.attr("width", x.bandwidth())
		.attr("height", d=> height - y(d.stores))
		.merge(bars)
		.transition()
		.duration(800)
		.attr("x", d => x(d.company))
		.attr("y", d => y(d[selectedOption]))  // Update y based on selected option
		.attr("width", x.bandwidth())
		.attr("height", d => height - y(d[selectedOption]));  // Update height dynamically

	// Update
	bars.transition()
		.duration(500)
		.attr("x", d => x(d.company))
		.attr("y", d => y(d[selectedOption]))
		.attr("width", x.bandwidth())
		.attr("height", d => height - y(d[selectedOption]));

	// Exit
	bars.exit().remove();

	// Update x-axis
	xAxisGroup.transition()
		.duration(1000)
		.call(d3.axisBottom(x));

	// Update y-axis
	yAxisGroup.transition()
		.duration(1000)
		.call(d3.axisLeft(y));

	yAxisTitle.text(selectedOption === "stores" ? "Stores" : "Billion USD");
}