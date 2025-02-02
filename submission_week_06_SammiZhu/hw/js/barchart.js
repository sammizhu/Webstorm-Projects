/*
 * BarChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'household characteristics'
 * @param _config					-- variable from the dataset (e.g. 'electricity') and title for each bar chart
 */

class BarChart {

	constructor(parentElement, data, config) {
		this.parentElement = parentElement;
		this.data = data;
		this.config = config;
		this.displayData = data;

		console.log(this.displayData);

		this.initVis();
	}

	/*
	 * Initialize visualization (static content; e.g. SVG area, axes)
	 */

	initVis() {
		let vis = this;

		// Dynamically set width based on parent container
		vis.docwidth = document.getElementById(vis.parentElement).getBoundingClientRect().width;
		vis.height = vis.docwidth * 0.20; // Chose arbitrary 0.20 from trial and error

		// Set up margins
		vis.margin = {top: 30, right: 100, bottom: 40, left: 100};
		vis.width = vis.docwidth - vis.margin.left - vis.margin.right;
		vis.height = vis.height - vis.margin.top - vis.margin.bottom;

		// Create SVG container
		vis.svg = d3.select("#" + vis.parentElement)
			.append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

		// Scales
		vis.x = d3.scaleLinear()
			.range([0, vis.width]);

		vis.y = d3.scaleBand()
			.range([0, vis.height])
			.padding(0.2); // to have gaps between the bars

		// Axes
		vis.xAxis = d3.axisBottom(vis.x)
			.ticks(5);

		vis.yAxis = d3.axisLeft(vis.y);

		// Append axis groups
		vis.svg.append("g")
			.attr("class", "x-axis")
			.attr("transform", `translate(0, ${vis.height})`);

		vis.svg.append("g")
			.attr("class", "y-axis");

		// Add chart title
		vis.svg.append("text")
			.attr("x", 0)
			.attr("y", -10)
			.attr("text-anchor", "start")
			.text(vis.config.title);

		// (Filter, aggregate, modify data)
		vis.wrangleData();
	}

	/*
	 * Data wrangling
	 */

	wrangleData() {
		let vis = this;

		// Use filteredData if exists, but if not then just use original full data
		let dataToUse = vis.filteredData ? vis.filteredData : vis.data;

		// Group the data by the title (i.e. electricity, etc)
		let groupedData = Array.from(d3.rollup(
			dataToUse,
			v => v.length,
			d => d[vis.config.key]
		), ([key, value]) => ({key: key, value: value}));

		// Sort for better readability
		vis.displayData = groupedData.sort((a, b) => d3.descending(a.value, b.value));

		// Update the visualization
		vis.updateVis();
	}

	/*
	 * The drawing function - should use the D3 update sequence (enter, update, exit)
	 */

	updateVis() {
		let vis = this;

		// Update scales
		vis.x.domain([0, d3.max(vis.displayData, d => d.value)]);
		vis.y.domain(vis.displayData.map(d => d.key));

		// Draw bars
		let bars = vis.svg.selectAll(".bar")
			.data(vis.displayData);

		// Enter phase for new bars
		bars.enter()
			.append("rect")
			.attr("class", "bar")
			.attr("x", 0)
			.attr("y", d => vis.y(d.key))
			.attr("width", 0)
			.attr("height", vis.y.bandwidth())
			.merge(bars)
			.transition()
			.duration(800)
			.attr("x", 0)
			.attr("width", d => vis.x(d.value))
			.attr("y", d => vis.y(d.key))
			.attr("height", vis.y.bandwidth());

		// Add text values next to the bars
		let labels = vis.svg.selectAll(".label")
			.data(vis.displayData);

		// Enter phase for new labels
		labels.enter()
			.append("text")
			.attr("class", "label")
			.attr("x", 0)
			.attr("y", d => vis.y(d.key) + vis.y.bandwidth() / 2 + 4)
			.text(d => d.value)
			.merge(labels)
			.transition()
			.duration(800)
			.attr("x", d => vis.x(d.value) + 5)
			.attr("y", d => vis.y(d.key) + vis.y.bandwidth() / 2 + 4)
			.text(d => d.value);

		// Exit phase for bars and labels
		bars.exit().transition().duration(800).attr("width", 0).remove();
		labels.exit().transition().duration(800).attr("x", 0).remove();

		// Update axes with no transition
		vis.svg.select(".x-axis").call(vis.xAxis);
		vis.svg.select(".y-axis").call(vis.yAxis);
	}


	/*
	 * Filter data when the user changes the selection
	 * Example for brushRegion: 07/16/2016 to 07/28/2016
	 */

	selectionChanged(brushRegion) {
		let vis = this;

		// Extract start and end dates from the brush region
		let startDate = brushRegion[0];
		let endDate = brushRegion[1];

		// Filter original data based on brushed time range
		vis.filteredData = vis.data.filter(d => d.survey >= startDate && d.survey <= endDate);

		// Update visualization
		vis.wrangleData();
	}
}
