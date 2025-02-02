let width = 700;
let height = 500;

// 3. Append new SVG area with D3
let svg = d3.select("#chart-area")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

d3.csv("data/wealth_health_data.csv", row => {
	// 2. Convert numeric values from strings to numbers
	row.LifeExpectancy = +row.LifeExpectancy;
	row.Income = +row.Income;
	row.Population = +row.Population;
	return row;
}).then(data => {
	// 14. Change the drawing order
	data.sort((a, b) => b.Population - a.Population);

	// Filter out data with zero or negative income for log scale
	data = data.filter(d => d.Income > 0);

	// 7. Refine the range of the scales
	let padding = 50;

	// 4. Create linear scales by using the D3 scale functions
	let incomeScale = d3.scaleLog() // 16. Log scales
		.domain([
			d3.min(data, d => d.Income) * 0.9,  // Reduce to avoid touching w min
			d3.max(data, d => d.Income) * 1.1   // Increase to avoid touching w axis
		])
		.range([padding, width - padding])
		.base(10);

	let lifeExpectancyScale = d3.scaleLinear()
		.domain([
			d3.min(data, d => d.LifeExpectancy) - 5,
			d3.max(data, d => d.LifeExpectancy) + 5 // 11. Redefine the domain of the scales
		])
		.range([height - padding, padding]);

	// 5. Try the scale function
	// console.log(incomeScale(5000));
	// console.log(lifeExpectancyScale);

	// 13. Add a scale funciton for circle radius
	let populationScale = d3.scaleLinear()
		.domain([d3.min(data, d => d.Population), d3.max(data, d => d.Population)])
		.range([4, 30]);

	// 15. Color the circles
	let colorScale = d3.scaleOrdinal(d3.schemeCategory10);

	drawChart(data, incomeScale, lifeExpectancyScale, populationScale, colorScale, padding);
});

function drawChart(data, incomeScale, lifeExpectancyScale, populationScale, colorScale, padding) {
	// 6. Map the countries to SVG circles
	svg.selectAll("circle")
		.data(data)
		.enter()
		.append("circle")
		.attr("cx", d => incomeScale(d.Income))
		.attr("cy", d => lifeExpectancyScale(d.LifeExpectancy))
		.attr("r", d => populationScale(d.Population))
		.attr("stroke", "black")
		.attr("fill", d => colorScale(d.Region));

	// 8. Use your scales to create D3 axis functions
	let xAxis = d3.axisBottom(incomeScale)
		.tickValues([1000,2000,4000,8000,16000,32000,100000]);

	let yAxis = d3.axisLeft(lifeExpectancyScale)
		.tickValues([50,55,60,65,70,75,80]);

	// 9. Append the x- and y-axis to your scatterplot
	svg.append("g")
		.attr("class", "x-axis")
		.attr("transform", `translate(0, ${height - padding})`)
		.call(xAxis);

	svg.append("g")
		.attr("class", "y-axis")
		.attr("transform", `translate(${padding}, 0)`)
		.call(yAxis);

	// 12. label your axes
	svg.append("text")
		.attr("class", "x-axis-label")
		.attr("x", width / 2)  // Center
		.attr("y", height - padding + 40)  // Position below axis
		.attr("text-anchor", "middle")
		.style("font-size", "14px")
		.style("font-weight", "bold")
		.text("Income per Person (GDP per Capita)");

	svg.append("text")
		.attr("class", "y-axis-label")
		.attr("x", -(height / 2))  // Rotate and center
		.attr("y", padding - 40)  // Position left of axis
		.attr("transform", "rotate(-90)")  // Rotate  text for vertical alignment
		.attr("text-anchor", "middle")
		.style("font-size", "14px")
		.style("font-weight", "bold")
		.text("Life Expectancy");
}