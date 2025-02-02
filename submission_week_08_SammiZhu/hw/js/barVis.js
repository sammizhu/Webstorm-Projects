// note - i added a lot of helper functions
// because it was easier for me to
// understand how to break down my task
class BarVis {
    constructor(parentElement, covidData, usaData, isDescending) {
        this.parentElement = parentElement;
        this.covidData = covidData;
        this.usaData = usaData;
        this.isDescending = isDescending;
        this.parseDate = d3.timeParse("%m/%d/%Y");
        this.initVis();
    }

    // initialize the visualization
    initVis() {
        this.setDimensions();
        this.createSVG();
        this.createScales();
        this.createAxes();
        this.createTooltip();
        this.wrangleData();
    }

    // set margins and dimensions
    setDimensions() {
        const element = document.getElementById(this.parentElement).getBoundingClientRect();
        this.margin = { top: 40, right: 30, bottom: 60, left: 80 };
        this.width = element.width - this.margin.left - this.margin.right;
        this.height = element.height - this.margin.top - this.margin.bottom;
    }

    // create SVG and append title
    createSVG() {
        this.svg = d3.select(`#${this.parentElement}`).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        this.title = this.svg.append('text')
            .attr('class', 'title bar-title')
            .attr('x', this.width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle');
    }

    // create scales
    createScales() {
        this.x = d3.scaleBand().range([0, this.width]).padding(0.2);
        this.y = d3.scaleLinear().range([this.height, 0]);
        this.colorScale = d3.scaleSequential(d3.interpolateBlues);
    }

    // create axes and append to SVG
    createAxes() {
        this.xAxis = d3.axisBottom().scale(this.x);
        this.yAxis = d3.axisLeft().scale(this.y).ticks(6).tickFormat(d3.format(","));

        this.xAxisGroup = this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${this.height})`);

        this.yAxisGroup = this.svg.append("g")
            .attr("class", "y-axis");
    }

    // create tooltip
    createTooltip() {
        this.tooltip = d3.select("body").append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', '#f4f4f4')
            .style('border', '1px solid #ddd')
            .style('border-radius', '8px')
            .style('padding', '10px')
            .style('opacity', 0);
    }

    // wrangle and process data
    wrangleData() {
        const filteredData = selectedTimeRange.length
            ? this.filterByDate(this.covidData)
            : this.covidData;

        const covidDataByState = this.groupByState(filteredData);

        this.stateInfo = covidDataByState.map(state => this.computeStateData(state));
        this.stateInfo.sort((a, b) =>
            this.isDescending ? b[selectedCategory] - a[selectedCategory] : a[selectedCategory] - b[selectedCategory]
        );

        this.topTenData = this.stateInfo.slice(0, 10);
        this.updateVis();
    }

    // filter data by date range
    filterByDate(data) {
        return data.filter(row => {
            const date = this.parseDate(row.submission_date);
            return date >= selectedTimeRange[0] && date <= selectedTimeRange[1];
        });
    }

    // group data by state
    groupByState(data) {
        return Array.from(d3.group(data, d => d.state), ([key, value]) => ({ key, value }));
    }

    // compute state-level statistics
    computeStateData(state) {
        const stateName = nameConverter.getFullName(state.key);
        const population = +this.usaData.find(d => d.state === stateName)?.["2020"].replace(/,/g, '') || 1;
        const newCasesSum = d3.sum(state.value, d => +d.new_case || 0);
        const newDeathsSum = d3.sum(state.value, d => +d.new_death || 0);

        return {
            state: stateName,
            population,
            absCases: newCasesSum,
            absDeaths: newDeathsSum,
            relCases: (newCasesSum / population) * 100,
            relDeaths: (newDeathsSum / population) * 100
        };
    }

    // update the visualization
    updateVis() {
        this.updateTitle();
        this.updateScales();
        this.renderAxes();
        this.renderBars();
    }

    // update chart title based on category
    updateTitle() {
        const categoryTitles = {
            'absCases': 'Total COVID-19 Cases',
            'absDeaths': 'Total COVID-19 Deaths',
            'relCases': 'COVID-19 Case Rate (%)',
            'relDeaths': 'COVID-19 Death Rate (%)'
        };

        const title = this.isDescending
            ? `Top 10 States by ${categoryTitles[selectedCategory]}`
            : `Bottom 10 States by ${categoryTitles[selectedCategory]}`;

        this.title.text(title);
    }

    // update scales based on data
    updateScales() {
        this.x.domain(this.topTenData.map(d => d.state));
        const maxVal = d3.max(this.topTenData, d => d[selectedCategory]);
        this.y.domain([0, maxVal]);
        this.colorScale.domain([0, maxVal]);
    }

    // render x and y axes
    renderAxes() {
        this.xAxisGroup.transition().duration(500).call(this.xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-40)")
            .attr("text-anchor", "end");

        this.yAxisGroup.transition().duration(500).call(this.yAxis);
    }

    // render bars with transitions and tooltips
    renderBars() {
        const bars = this.svg.selectAll(".bar").data(this.topTenData, d => d.state);

        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => this.x(d.state))
            .attr("width", this.x.bandwidth())
            .attr("y", this.height)
            .attr("height", 0)
            .attr("fill", d => this.colorScale(d[selectedCategory]))
            .on("mouseover", (event, d) => this.showTooltip(event, d))
            .on("mouseout", () => this.hideTooltip())
            .merge(bars)
            .transition().duration(500)
            .attr("x", d => this.x(d.state))
            .attr("width", this.x.bandwidth())
            .attr("y", d => this.y(d[selectedCategory]))
            .attr("height", d => this.height - this.y(d[selectedCategory]));

        bars.exit().remove();
    }

    // show tooltip on hover
    showTooltip(event, d) {
        this.tooltip
            .html(`
                <strong>${d.state}</strong><br/>
                Population: ${d.population.toLocaleString()}<br/>
                Cases (absolute): ${d.absCases.toLocaleString()}<br/>
                Deaths (absolute): ${d.absDeaths.toLocaleString()}<br/>
                Cases (relative): ${d.relCases.toFixed(2)}%<br/>
                Deaths (relative): ${d.relDeaths.toFixed(2)}%
            `)
            .style('opacity', 1)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`);
    }

    // hide tooltip on mouseout
    hideTooltip() {
        this.tooltip.style('opacity', 0);
    }
}