// 4. Implement D3 margin convention
const margin = { top: 40, right: 30, bottom: 70, left: 50 };
const width = 600 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#area-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Set up the date parser
const parseDate = d3.timeParse("%Y-%m-%d");

// Load CSV data
d3.csv("data/zaatari-refugee-camp-population.csv", function(d) {
    d.date = parseDate(d.date); // Convert date string to Date object
    d.population = +d.population; // Convert population to a number
    return d;
}).then(function(data) {

    // 5. Linear scales for axes
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.population)])
        .range([height, 0]);

    const area = d3.area()
        .x(d => xScale(d.date))
        .y0(height)
        .y1(d => yScale(d.population));

    // 6. Map population data to area
    let path = svg.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area)

    // 7. Append axes and add chart title
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(3)).tickFormat(d3.timeFormat("%B %Y")))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(6));

    // 12. Dynamic tooltip for chart area
    const tooltipGroup = svg.append("g")
        .attr("class", "tooltip-group")
        .style("display", "none");

    tooltipGroup.append("line")
        .attr("class", "tooltip-line")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    tooltipGroup.append("text")
        .attr("class", "tooltip-population")
        .attr("x", 10)
        .attr("y", 10);

    tooltipGroup.append("text")
        .attr("class", "tooltip-date")
        .attr("x", 10)
        .attr("y", 30);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mouseover", function() { tooltipGroup.style("display", null); })
        .on("mouseout", function() { tooltipGroup.style("display", "none"); })
        .on("mousemove", mousemove);

    const bisectDate = d3.bisector(d => d.date).left;

    function mousemove(event) {
        const xPos = d3.pointer(event)[0]; // Get the x position of the mouse
        const xDate = xScale.invert(xPos); // Find corresponding date on x scale
        const index = bisectDate(data, xDate); // Get the index of closest data point
        const d0 = data[index - 1];
        const d1 = data[index];
        const d = xDate - d0.date > d1.date - xDate ? d1 : d0; // Get closest data point in case not on a specific point

        tooltipGroup.attr("transform", "translate(" + xScale(d.date) + ",0)");

        tooltipGroup.select(".tooltip-population").text("Population: " + d.population);

        // 3. Convert into string
        const dateFormat = d3.timeFormat("%m/%d/%Y");
        tooltipGroup.select(".tooltip-date").text("Date: " + dateFormat(d.date));
    }
});

const marginBar = { top: 40, right: 30, bottom: 70, left: 50 };
const widthBar = 500 - marginBar.left - marginBar.right;
const heightBar = 500 - marginBar.top - marginBar.bottom;

// 8. Compound JS data structure
const shelterData = [
    { shelterType: "Caravans", percentage: 79.68 },
    { shelterType: "Combination of Tents and Caravans", percentage: 10.81 },
    { shelterType: "Tents", percentage: 9.51 }
];

// 9. Vertical bar chart
const svgBar = d3.select("#bar-chart")
    .append("svg")
    .attr("width", widthBar + marginBar.left + marginBar.right)
    .attr("height", heightBar + marginBar.top + marginBar.bottom)
    .append("g")
    .attr("transform", "translate(" + marginBar.left + "," + marginBar.top + ")"); // y-axis

const xScaleBar = d3.scaleBand()
    .domain(shelterData.map(d => d.shelterType))
    .range([0, widthBar])
    .padding(0.2);

const yScaleBar = d3.scaleLinear()
    .domain([0, 100])
    .range([heightBar, 0]);

svgBar.selectAll(".bar")
    .data(shelterData)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => xScaleBar(d.shelterType))
    .attr("y", d => yScaleBar(d.percentage))
    .attr("width", xScaleBar.bandwidth())
    .attr("height", d => heightBar - yScaleBar(d.percentage));

// 10. Draw bar chart axes
svgBar.append("g")
    .attr("transform", "translate(0," + heightBar + ")")
    .call(d3.axisBottom(xScaleBar))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

// 11. Append label at top to indicate percentages
svgBar.append("g")
    .call(d3.axisLeft(yScaleBar).ticks(6).tickFormat(d => d + "%")); // Had bug so used to fix tick formatting

svgBar.selectAll(".bar-label")
    .data(shelterData)
    .enter().append("text")
    .attr("class", "bar-label")
    .attr("x", d => xScaleBar(d.shelterType) + xScaleBar.bandwidth() / 2)
    .attr("y", d => yScaleBar(d.percentage) - 5)
    .attr("text-anchor", "middle")
    .text(d => d.percentage + "%");