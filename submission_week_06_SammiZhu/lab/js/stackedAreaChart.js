/*
 * StackedAreaChart - ES6 Class
 * @param  parentElement 	-- the HTML element in which to draw the visualization
 * @param  data             -- the data the that's provided initially
 * @param  displayData      -- the data that will be used finally (which might vary based on the selection)
 *
 * @param  focus            -- a switch that indicates the current mode (focus or stacked overview)
 * @param  selectedIndex    -- a global 'variable' inside the class that keeps track of the index of the selected area
 */

class StackedAreaChart {

// constructor method to initialize StackedAreaChart object
constructor(parentElement, data) {
    this.parentElement = parentElement;
    this.data = data;
    this.displayData = [];

    let colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a'];

    // grab all the keys from the key value pairs in data (filter out 'year' ) to get a list of categories
    this.dataCategories = Object.keys(this.data[0]).filter(d=>d !== "Year")

    // prepare colors for range
    let colorArray = this.dataCategories.map( (d,i) => {
        return colors[i%10]
    })
    // Set ordinal color scale
    this.colorScale = d3.scaleOrdinal()
        .domain(this.dataCategories)
        .range(colorArray);
}

	/*
	 * Method that initializes the visualization (static content, e.g. SVG area or axes)
 	*/
	initVis() {
		let vis = this;

		// Margin conventions
		vis.margin = {top: 40, right: 40, bottom: 60, left: 40};

		// Dynamically set width and height based on parent element's size
		vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
		vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

		// Append SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement)
			.append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		// Add clipping path for safe rendering within bounds
		vis.svg.append("defs").append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", vis.width)
			.attr("height", vis.height);

		// Set up scales using dynamic width and height values
		vis.x = d3.scaleTime().range([0, vis.width]);
		vis.y = d3.scaleLinear().range([vis.height, 0]);

		// Create and configure axes
		vis.xAxis = d3.axisBottom().scale(vis.x);
		vis.yAxis = d3.axisLeft().scale(vis.y);

		// Append x-axis group
		vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")");

		// Append y-axis group
		vis.svg.append("g")
			.attr("class", "y-axis axis");

		// Create a placeholder for the tooltip text element
		vis.tooltip = vis.svg.append("text")
			.attr("class", "tooltip")
			.attr("x", 10)
			.attr("y", 10)
			.attr("fill", "black")
			.style("font-size", "14px")
			.style("opacity", 0);

		// Initialize stack layout with category keys
		let stack = d3.stack()
			.keys(vis.dataCategories);

		// Stack data using stack layout
		vis.stackedData = stack(vis.data);

		// Create area path generator for the stacked area chart
		vis.area = d3.area()
			.x(d => vis.x(d.data.Year))
			.y0(d => vis.y(d[0]))
			.y1(d => vis.y(d[1]));

		// Render visualization
		vis.wrangleData();
	}

	/*
 	* Data wrangling
 	*/
	wrangleData(){
		let vis = this;
        
        vis.displayData = vis.stackedData;

		// Update the visualization
		vis.updateVis();
	}

	/*
	 * The drawing function - should use the D3 update sequence (enter, update, exit)
 	* Function parameters only needed if different kinds of updates are needed
 	*/
	updateVis() {
		let vis = this;

		// Update domain based on the current brush selection or the full data extent
		if (timeline && timeline.currentBrushSelection && timeline.currentBrushSelection !== null) {
			vis.x.domain(timeline.currentBrushSelection.map(timeline.x.invert));
		} else {
			vis.x.domain(d3.extent(vis.data, d => d.Year));
		}

		// Get the maximum value for the y-axis domain based on the stacked data
		vis.y.domain([0, d3.max(vis.displayData, d => d3.max(d, e => e[1]))]);

		// Draw the layers using the area generator
		// Add event listeners for tooltips and hover effect
		vis.svg.selectAll(".area")
			.data(vis.displayData)
			.join("path")
			.attr("class", "area")
			.attr("d", vis.area)
			.style("fill", d => vis.colorScale(d.key))
			.style("opacity", 0.8)
			.attr("clip-path", "url(#clip)")

			// Add event listeners for tooltips
			.on("mouseover", (event, d) => {
				vis.tooltip
					.text(d.key)
					.style("opacity", 1);

				// Darken the color on hover
				d3.select(event.currentTarget)
					.style("filter", "brightness(0.8)");
			})
			.on("mouseout", (event, d) => {
				vis.tooltip.style("opacity", 0);

				d3.select(event.currentTarget)
					.style("filter", "none");
			});

		// Call axis functions with the updated domains
		vis.svg.select(".x-axis").call(vis.xAxis);
		vis.svg.select(".y-axis").call(vis.yAxis);
	}
}