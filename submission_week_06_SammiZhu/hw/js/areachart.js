/*
 * AreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data						-- the dataset 'household characteristics'
 */

class AreaChart {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];

        this.initVis();
    }

    /*
     * Initialize visualization (static content; e.g. SVG area, axes, brush component)
     */

    initVis() {
        let vis = this;

        // Dynamically set width based on parent container
        vis.docwidth = document.getElementById(vis.parentElement).getBoundingClientRect().width;
        vis.height = vis.docwidth * 0.75; // Chose arbitrary 0.75 from trial and error

        // Set up margins
        vis.margin = {top: 20, right: 30, bottom: 40, left: 50};
        vis.width = vis.docwidth - vis.margin.left - vis.margin.right;
        vis.height = vis.height - vis.margin.top - vis.margin.bottom;

        // Create SVG container
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        // Scales and axes
        vis.x = d3.scaleTime()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .ticks(6);

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        // Append path for the area function, so that it is later behind the brush overlay
        vis.timePath = vis.svg.append("path")
            .attr("class", "area");

        // TO-DO: Add Brushing to Chart
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("brush end", brushed);

        // Add brush to the SVG
        vis.svg.append("g")
            .attr("class", "brush")
            .call(vis.brush);

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        // Group data by survey date and count the number of surveys per day
        let groupedData = Array.from(d3.rollup(
            vis.data,
            v => v.length,
            d => d.survey
        ), ([key, value]) => ({date: new Date(key), value: value}));

        // Sort grouped data by date
        vis.displayData = groupedData.sort((a, b) => a.date - b.date);

        // Update visualization
        vis.updateVis();
    }

    /*
     * The drawing function
     */

    updateVis() {
        let vis = this;

        // Update domain
        vis.x.domain(d3.extent(vis.displayData, function (d) {
            return d.date;
        }));
        vis.y.domain([0, d3.max(vis.displayData, function (d) {
            return d.value;
        })]);

        // D3 area path generator
        vis.area = d3.area()
            .curve(d3.curveCardinal)
            .x(function (d) {
                return vis.x(d.date);
            })
            .y0(vis.height)
            .y1(function (d) {
                return vis.y(d.value);
            });

        // D3 uses each data point and passes it to the area function. Area function translates the data into positions on the path in the SVG.
        vis.timePath
            .datum(vis.displayData)
            .attr("d", vis.area);

        // Update axes
        vis.svg.select(".y-axis").call(vis.yAxis);
        vis.svg.select(".x-axis").call(vis.xAxis);

    }
}

