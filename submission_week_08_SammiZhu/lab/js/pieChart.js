/* * * * * * * * * * * * * *
*         PieChart         *
* * * * * * * * * * * * * */


class PieChart {

    // constructor method to initialize Timeline object
    constructor(parentElement) {
        this.parentElement = parentElement;
        this.circleColors = ['#b2182b', '#d6604d', '#f4a582', '#fddbc7'];

        // call initVis method
        this.initVis()
    }

    initVis() {
        let vis = this;
        vis.margin = { top: 10, right: 50, bottom: 10, left: 50 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.radius = Math.min(vis.width, vis.height) / 3;

        // initialize SVG and group elements
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height / 2 + 35})`);

        // add title above the chart
        vis.svg.append('g')
            .attr('class', 'title pie-title')
            .append('text')
            .text('Pie Chart')
            .attr('text-anchor', 'middle')
            .attr('transform', `translate(0, -${vis.radius + 125})`);

        vis.pieChartGroup = vis.svg.append('g')
            .attr('class', 'pieChart');

        vis.pie = d3.pie().value(d => d.value);
        vis.arc = d3.arc().innerRadius(0).outerRadius(vis.radius);

        // append tooltip to the body
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'pieTooltip')
            .style("opacity", 0);

        this.wrangleData();
    }

    wrangleData() {
        let vis = this

        vis.displayData = []

        // generate random data
        for (let i = 0; i < 4; i++) {
            let random = Math.floor(Math.random() * 100)
            vis.displayData.push({
                value: random,
                color: vis.circleColors[i]
            })
        }

        vis.updateVis()

    }

    updateVis() {
        let vis = this;

        // bind  new data to arcs
        let arcs = vis.pieChartGroup.selectAll(".arc")
            .data(vis.pie(vis.displayData), d => d.index);

        // entering arcs
        arcs.enter()
            .append("path")
            .attr("class", "arc")
            .merge(arcs)
            .attr("d", vis.arc)  // use the arc generator to define the path
            .attr("fill", d => d.data.color)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'black');

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                    <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                        <h3>Arc with index #${d.index}<h3>
                        <h4> value: ${d.value}</h4>      
                        <h4> startAngle: ${d.startAngle.toFixed(2)}</h4>
                        <h4> endAngle: ${d.endAngle.toFixed(2)}</h4>   
                        <h4> data: ${JSON.stringify(d.data)}</h4>                         
                    </div>`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr("fill", d => d.data.color);

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        arcs.exit().remove();
    }
}