// Margin conventions & SVG drawing area
let margin = { top: 40, right: 40, bottom: 60, left: 60 };
let width = 600 - margin.left - margin.right;
let height = 600 - margin.top - margin.bottom;

// Create SVG canvas
let svg = d3.select("#chart-area").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// #3: Create scales and axis functions
let x = d3.scaleTime().range([0, width]);
let y = d3.scaleLinear().range([height, 0]);

let xAxis = d3.axisBottom(x);
let yAxis = d3.axisLeft(y);

// #4: map data to SVG path and draw line chart
let line = d3.line()
	.x(d => x(d.YEAR))
	.y(d => y(d.GOALS));

// #5: Draw the axes
svg.append("g").attr("class", "x-axis").attr("transform", "translate(0," + height + ")");
svg.append("g").attr("class", "y-axis");

// Append the line path between each data points
let path = svg.append("path")
	.datum([])
	.attr("class", "line")
	.style("fill", "none")
	.style("stroke", "#9CBA9C")
	.style("stroke-width", 2);

let circles = svg.selectAll("circle").data([]);

let data;
let minYear, maxYear, timeSlider;

let parseDate = d3.timeParse("%Y");
let formatDate = d3.timeFormat("%Y");

loadData();

function loadData() {
	d3.csv("data/fifa-world-cup.csv", row => {
		row.YEAR = parseDate(row.YEAR);
		row.TEAMS = +row.TEAMS;
		row.MATCHES = +row.MATCHES;
		row.GOALS = +row.GOALS;
		row.AVERAGE_GOALS = +row.AVERAGE_GOALS;
		row.AVERAGE_ATTENDANCE = +row.AVERAGE_ATTENDANCE;
		row.WINNER = row.WINNER;
		return row;
	}).then(csv => {
		data = csv;

		minYear = d3.min(data, d => d.YEAR).getFullYear(); // grabbing data from CSV
		maxYear = d3.max(data, d => d.YEAR).getFullYear();

		createTimeSlider(minYear, maxYear);
		updateVisualization("GOALS", minYear, maxYear);
	});
}

// 10. Implement a time period filter using a slider
function createTimeSlider(minYear, maxYear) {
	timeSlider = document.getElementById('time-slider');
	noUiSlider.create(timeSlider, {
		start: [minYear, maxYear],
		connect: true,
		behaviour: 'drag',
		step: 1,
		range: {
			'min': minYear,
			'max': maxYear
		},
		tooltips: [true, true],
		format: {
			to: d => Math.round(d),
			from: d => Number(d)
		}
	});

	// Depending on value changed on slider, update the visualization as needed
	timeSlider.noUiSlider.on('update', function (values) {
		let startYear = Math.round(values[0]);
		let endYear = Math.round(values[1]);
		updateVisualization("GOALS", startYear, endYear);
	});
}

function updateVisualization(selectedAttribute, startYear, endYear) {
	// Filter data based on the year specified on time slider
	let filteredData = data.filter(d => d.YEAR.getFullYear() >= startYear && d.YEAR.getFullYear() <= endYear);

	// Updating x and y domains
	x.domain([parseDate(startYear.toString()), parseDate(endYear.toString())]);
	y.domain([0, d3.max(filteredData, d => d[selectedAttribute])]);

	// Update x-axis
	svg.select(".x-axis")
		.transition().duration(300)
		.call(xAxis);

	// Update y-axis
	svg.select(".y-axis")
		.transition().duration(300)
		.call(yAxis);

	// Update line path via the new filtered data
	path.datum(filteredData)
		.transition().duration(300).ease(d3.easeCubicInOut)
		.attr("d", line.y(d => y(d[selectedAttribute])));

	// #6. Update circles with the filtered data
	circles = svg.selectAll("circle")
		.data(filteredData);

	// #6. Enter new circles
	circles.enter()
		.append("circle")
		.attr("class", "data-point")
		.attr("cx", d => x(d.YEAR))
		.attr("cy", d => y(d[selectedAttribute]))
		.attr("r", 4)
		.style("fill", "#5C865B")
		.style("stroke", "black")
		.on("click", function(event, d) {
			showEdition(d);  // Update the chart-data description table
		})
		.merge(circles)
		.transition().duration(800).ease(d3.easeCubicInOut)
		.attr("cx", d => x(d.YEAR))
		.attr("cy", d => y(d[selectedAttribute]));

	// #6. Remove old circles
	circles.exit()
		.transition().duration(800)
		.remove();
}

//Populating chart-data table
function showEdition(d) {
	d3.select("#year").text(formatDate(d.YEAR));
	d3.select("#winner").text(d.WINNER);
	d3.select("#goals").text(d.GOALS);
	d3.select("#average-goals").text(d.AVERAGE_GOALS);
	d3.select("#matches").text(d.MATCHES);
	d3.select("#teams").text(d.TEAMS);
	d3.select("#average-attendance").text(d.AVERAGE_ATTENDANCE);
}

// Event listener for dropdown menu with user input on selection type
d3.select("#y-attribute").on("change", function () {
	let selectedAttribute = d3.select(this).property("value");
	updateVisualization(selectedAttribute, minYear, maxYear);
});