// MapVis.js

class MapVis {
    constructor(parentElement, geoData, covidData, censusData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.covidData = covidData;
        this.censusData = censusData;

        this.parseDate = d3.timeParse("%m/%d/%Y");

        // store the selected category (cases or deaths, absolute or relative)
        this.selectedCategory = selectedCategory;

        this.initVis();
    }

    initVis() {
        let vis = this;

        // set up margins and dimensions
        vis.margin = { top: 20, right: 20, bottom: 50, left: 50 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width
            - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height
            - vis.margin.top - vis.margin.bottom;

        // create SVG canvas
        vis.svg = d3.select(`#${vis.parentElement}`).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        // set up map group with zoom scaling
        vis.viewpoint = { width: 975, height: 610 };
        vis.zoom = vis.width / vis.viewpoint.width;

        vis.mapGroup = vis.svg.append("g")
            .attr("class", "states")
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`);

        // convert TopoJSON to GeoJSON, then use to draw state paths
        vis.states = topojson.feature(vis.geoData, vis.geoData.objects.states).features;
        vis.map = vis.mapGroup.selectAll(".state")
            .data(vis.states)
            .enter().append("path")
            .attr("class", "state")
            .attr("d", d3.geoPath())
            .attr("fill", "#cccccc")
            .attr("stroke", "#333")
            .attr("stroke-width", 1)
            .on("mouseover", (event, d) => vis.showTooltip(event, d))
            .on("mouseout", () => vis.hideTooltip());

        // tooltip setup
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "solid 1px #ccc")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("opacity", 0);

        // legends
        vis.legendWidth = 200;
        vis.legendHeight = 20;

        vis.legendGroup = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width / 2 - vis.legendWidth / 2}, ${vis.height - vis.margin.bottom - vis.legendHeight - 20})`);

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // filter according to selectedTimeRange
        let filteredData = [];

        // if time range selected
        if (selectedTimeRange.length !== 0) {
            vis.covidData.forEach(row => {
                let date = vis.parseDate(row.submission_date);
                // push rows with dates within the selected time range into filteredData
                if (selectedTimeRange[0].getTime() <= date.getTime() &&
                    date.getTime() <= selectedTimeRange[1].getTime()) {
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.covidData;
        }

        // group all rows by state
        let covidDataByState = Array.from(d3.group(filteredData, d => d.state), ([key, value]) => ({ key, value }));

        // initialize final data structure where both datasets will be merged
        vis.stateInfo = [];

        // merge covid data and census data
        covidDataByState.forEach(state => {
            let stateName = nameConverter.getFullName(state.key);

            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;

            // look up population for the state in the census data
            vis.censusData.forEach(row => {
                if (row.state === stateName) {
                    population += +row["2020"].replace(/,/g, '');
                }
            });

            // calculate new cases and deaths by summing up all entries for each state
            state.value.forEach(entry => {
                newCasesSum += +entry['new_case'] || 0;
                newDeathsSum += +entry['new_death'] || 0;
            });

            // avoid division by zero
            if (population === 0) {
                console.warn(`Population is zero for state: ${stateName}`);
                population = 1;
            }

            // populate values
            vis.stateInfo.push({
                state: stateName,
                population: population,
                absCases: newCasesSum,
                absDeaths: newDeathsSum,
                relCases: (newCasesSum / population) * 100,
                relDeaths: (newDeathsSum / population) * 100
            });
        });

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        let maxValue;
        let colorScheme = d3.interpolateBlues;

        if (selectedCategory === 'absCases') {
            maxValue = d3.max(vis.stateInfo, d => d.absCases);
        } else if (selectedCategory === 'absDeaths') {
            maxValue = d3.max(vis.stateInfo, d => d.absDeaths);
        } else if (selectedCategory === 'relCases') {
            maxValue = d3.max(vis.stateInfo, d => d.relCases);
        } else if (selectedCategory === 'relDeaths') {
            maxValue = d3.max(vis.stateInfo, d => d.relDeaths);
        }

        vis.colorScale = d3.scaleSequential(colorScheme).domain([0, maxValue]);

        // update the map fill colors based on the selected category
        let states = vis.mapGroup.selectAll(".state")
            .data(vis.states, d => d.properties.name);

        // state elements
        states.join(
            enter => enter.append("path")
                .attr("class", "state")
                .attr("d", d3.geoPath())
                .attr("fill", "#ccc")
                .attr("stroke", "#333")
                .attr("stroke-width", 1),
            update => update.transition().duration(500)
                .attr("fill", d => {
                    let stateName = d.properties.name;
                    let stateData = vis.stateInfo.find(s => s.state === stateName);
                    if (!stateData) {
                        console.warn(`No data for state: ${stateName}`);
                        return "#ccc";
                    }
                    let value = stateData[selectedCategory];
                    return vis.colorScale(value);
                }),
            exit => exit.remove()
        );

        // update legend to reflect selected category and color scale
        vis.updateLegend(maxValue, vis.colorScale);
    }

    updateLegend(maxValue, colorScale) {
        let vis = this;

        // clear any existing legend elements
        vis.legendGroup.selectAll("*").remove();

        // create a linear gradient for the legend
        let defs = vis.svg.select("defs");
        if (defs.empty()) {
            defs = vis.svg.append("defs");
        }

        let gradient = defs.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("x2", "100%");

        // add gradient stops based on the color scale
        gradient.selectAll("stop")
            .data(d3.range(0, 1.01, 0.01))
            .enter().append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => colorScale(d * maxValue));

        // draw the legend rectangle
        vis.legendGroup.append("rect")
            .attr("width", vis.legendWidth)
            .attr("height", vis.legendHeight)
            .style("fill", "url(#legend-gradient)");

        // create a scale and axis for the legend
        let legendScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, vis.legendWidth]);

        let legendAxis = d3.axisBottom(legendScale).ticks(5);

        vis.legendGroup.append("g")
            .attr("class", "legend-axis")
            .attr("transform", `translate(0, ${vis.legendHeight})`)
            .call(legendAxis);
    }

    showTooltip(event, d) {
        let vis = this;
        let stateName = d.properties.name;
        let data = vis.stateInfo.find(s => s.state === stateName);

        if (!data) {
            console.warn(`No data found for state: ${stateName}`);
            data = { absCases: 0, absDeaths: 0, population: 0, relCases: 0, relDeaths: 0 };
        }

        vis.tooltip
            .style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
            .html(`
                <strong>${stateName}</strong><br/>
                Population: ${data.population.toLocaleString()}<br/>
                Cases (absolute): ${data.absCases.toLocaleString()}<br/>
                Deaths (absolute): ${data.absDeaths.toLocaleString()}<br/>
                Cases (relative): ${data.relCases.toFixed(2)}%<br/>
                Deaths (relative): ${data.relDeaths.toFixed(2)}%
            `);
    }

    hideTooltip() {
        this.tooltip.style("opacity", 0);
    }
}