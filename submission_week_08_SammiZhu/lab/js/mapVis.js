/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    constructor(parentElement, airportData, geoData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.airportData = airportData;

        // define colors
        this.colors = ['#fddbc7', '#f4a582', '#d6604d', '#b2182b']

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        let zoomFactor = vis.height / 800;

        // Create SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.svg.append('g')
            .attr('class', 'title')
            .append('text')
            .text('World Map')
            .attr('transform', `translate(${vis.width / 2}, 2)`)
            .attr('text-anchor', 'middle');


        // Used the Mercator projection
        vis.projection = d3.geoMercator()
            .translate([vis.width / 2, vis.height / 2])
            .scale(125 * zoomFactor);

        vis.path = d3.geoPath().projection(vis.projection);

        vis.svg.append("path")
            .datum({ type: "Sphere" })
            .attr("class", "graticule")
            .attr("fill", "#ADDEFF")
            .attr("stroke", "rgba(129,129,129,0.35)")
            .attr("d", vis.path);

        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features;

        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'country')
            .attr("d", vis.path)
            .attr("fill", "transparent")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);

        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id", "mapTooltip")
            .style("opacity", 0);

        this.wrangleData();

        let m0, o0;

        vis.svg.call(
            d3.drag()
                .on("start", function (event) {
                    let lastRotationParams = vis.projection.rotate();
                    m0 = [event.x, event.y];
                    o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function (event) {
                    if (m0) {
                        let m1 = [event.x, event.y],
                            o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }

                    vis.path = d3.geoPath().projection(vis.projection);
                    d3.selectAll(".country").attr("d", vis.path);
                    d3.selectAll(".graticule").attr("d", vis.path);
                })
        );
    }

    wrangleData() {
        let vis = this;

        // create random data structure with information for each land
        vis.countryInfo = {};
        vis.geoData.objects.countries.geometries.forEach(d => {
            let randomCountryValue = Math.random() * 4
            vis.countryInfo[d.properties.name] = {
                name: d.properties.name,
                category: 'category_' + Math.floor(randomCountryValue),
                color: vis.colors[Math.floor(randomCountryValue)],
                value: randomCountryValue / 4 * 100
            }
        })

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        // Use the lookup table from countryInfo to assign colors
        vis.countries
            .transition()
            .duration(500)
            .attr("fill", d => {
                let countryData = vis.countryInfo[d.properties.name];
                return countryData ? countryData.color : "#ccc";  // Fallback color if not found
            });

        // Tooltip functionality
        vis.countries
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", 2)
                    .attr("stroke", "black")
                    .attr("fill", "black");  // Change color on hover

                let countryData = vis.countryInfo[d.properties.name];

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                    <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 10px">
                        <strong>Country:</strong> ${d.properties.name}<br/>
                        <strong>Category:</strong> ${countryData ? countryData.category : 'N/A'}<br/>
                        <strong>Value:</strong> ${countryData ? countryData.value.toFixed(2) : 'N/A'}
                    </div>`);
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", 0.5)
                    .attr("fill", d => {
                        let countryData = vis.countryInfo[d.properties.name];
                        return countryData ? countryData.color : "#ccc";  // Reset color on mouseout
                    });

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html("");
            });
    }
}