/*
 * CountVis - Object constructor function
 * @param _parentElement     -- the HTML element in which to draw the visualization
 * @param _data              -- the actual data: perDayData
 * @param _eventHandler      -- the event handler
 */
class CountVis {

	constructor(_parentElement, _data, _eventHandler) {
		this.parentElement = _parentElement;
		this.data = _data;
		this.eventHandler = _eventHandler; // Store the event handler
		this.displayData = [];

		this.initVis();
	}

	/*
     * Initialize visualization (static content, e.g. SVG area or axes)
     */
	initVis() {
		let vis = this;

		vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };

		vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
		vis.height = 300 - vis.margin.top - vis.margin.bottom;

		// SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom);

		vis.chartArea = vis.svg.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		// Define the clipping region
		vis.chartArea.append("defs").append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", vis.width)
			.attr("height", vis.height);

		// Scales and axes
		vis.x = d3.scaleTime()
			.range([0, vis.width]);

		vis.y = d3.scaleLinear()
			.range([vis.height, 0]);

		vis.xAxis = d3.axisBottom()
			.scale(vis.x);

		vis.yAxis = d3.axisLeft()
			.scale(vis.y)
			.ticks(6);

		// Set domains
		let minMaxY = [0, d3.max(vis.data, d => d.count)];
		vis.y.domain(minMaxY);

		let minMaxX = d3.extent(vis.data, d => d.time);
		vis.x.domain(minMaxX);

		// Save the original x-scale
		vis.xOrig = vis.x.copy();

		vis.chartArea.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")");

		vis.chartArea.append("g")
			.attr("class", "y-axis axis");

		// Axis title
		vis.chartArea.append("text")
			.attr("x", -50)
			.attr("y", -8)
			.text("Votes");

		// Append a path for the area function
		vis.timePath = vis.chartArea.append("path")
			.attr("class", "area area-time")
			.attr("clip-path", "url(#clip)");

		// Define the D3 area generator
		vis.area = d3.area()
			.curve(d3.curveStep)
			.x(d => vis.x(d.time))
			.y0(vis.height)
			.y1(d => vis.y(d.count));

		// Initialize brushing component
		vis.brush = d3.brushX()
			.extent([[0, 0], [vis.width, vis.height]])
			.on("brush end", event => vis.brushed(event));

		// Append brush component
		vis.brushGroup = vis.chartArea.append("g")
			.attr("class", "brush")
			.call(vis.brush);

		// Initialize zoom component
		vis.zoom = d3.zoom()
			.scaleExtent([1, 20])
			.translateExtent([[0, 0], [vis.width, vis.height]])
			.extent([[0, 0], [vis.width, vis.height]])
			.on("zoom", event => vis.zoomFunction(event));

		// Apply the zoom behavior to the SVG, but prevent zooming on brush interaction
		vis.svg.call(vis.zoom)
			.on("mousedown.zoom", null)
			.on("touchstart.zoom", null);

		// (Filter, aggregate, modify data)
		vis.wrangleData();
	}

	/*
     * Data wrangling
     */
	wrangleData() {
		let vis = this;

		vis.displayData = vis.data;

		// Update the visualization
		vis.updateVis();
	}

	/*
     * The drawing function
     */
	updateVis() {
		let vis = this;

		// Update the x-accessor of the area generator
		vis.area.x(d => vis.x(d.time));

		// Update the area path
		vis.timePath
			.datum(vis.displayData)
			.attr("d", vis.area);

		// Update axes
		vis.chartArea.select(".x-axis").call(vis.xAxis);
		vis.chartArea.select(".y-axis").call(vis.yAxis);
	}

	/*
     * Zoom function
     */
	zoomFunction(event) {
		let vis = this;

		// Apply zoom to x-scale
		vis.x.domain(event.transform.rescaleX(vis.xOrig).domain());

		// Update axes and area path
		vis.updateVis();

		// Update brush if it exists
		if (vis.currentBrushRegion) {
			vis.brushGroup.call(vis.brush.move, vis.currentBrushRegion.map(vis.x));
		}
	}

	/*
     * Brushed function
     */
	brushed(event) {
		let vis = this;

		// Get the selection range
		let selection = event.selection;

		if (selection) {
			// Convert pixel coordinates to time
			let selectedTime = selection.map(vis.x.invert);

			// Dispatch the 'selectionChanged' event with the selected time range
			vis.eventHandler.call("selectionChanged", null, selectedTime[0], selectedTime[1]);

			// Update the displayed time period
			vis.onSelectionChange(selectedTime[0], selectedTime[1]);

			// Save the current brush region for zooming
			vis.currentBrushRegion = selectedTime;
		} else {
			// If no selection, reset to full range
			vis.eventHandler.call("selectionChanged", null, vis.xOrig.domain()[0], vis.xOrig.domain()[1]);
			vis.onSelectionChange(vis.xOrig.domain()[0], vis.xOrig.domain()[1]);

			vis.currentBrushRegion = null;
		}
	}

	/*
     * Update the time period display
     */
	onSelectionChange(rangeStart, rangeEnd) {
		// Format the dates
		let startDate = dateFormatter(rangeStart);
		let endDate = dateFormatter(rangeEnd);

		// Update the text elements in the DOM
		d3.select("#time-period-min").text(startDate);
		d3.select("#time-period-max").text(endDate);
	}
}