// Append an SVG drawing area for the visualization
const svg = d3.select("body").append("svg")
	.attr("width", 600)
	.attr("height", 200);

// Text label for displaying number of orders
const label = svg.append("text")
	.attr("id", "order-label")
	.attr("x", 20)
	.attr("y", 30)
	.style("font-size", "20px")
	.style("fill", "black");

function updateVisualization(orders) {
	console.log(orders);
	label.text(`Orders: ${orders.length}`);

	const circles = svg.selectAll("circle")
		.data(orders);

	// Enter
	circles.enter().append("circle")
		.attr("class", "dot")
		.attr("fill", "#707086")
		.attr("cy", 100) // Center vertically in the SVG
		.attr("cx", (d, index) => (index * 50) + 50) // Space circles horizontally so that they don't overlap
		.attr("r", 20)
		.attr("fill", d => d.product === "coffee" ? "brown" : "orange") //brown for coffee & orange for tea

		// Update
		.merge(circles)
		.attr("cx", (d, index) => (index * 50) + 50)
		.attr("cy", 100)
		.attr("fill", d => d.product === "coffee" ? "brown" : "orange"); //brown for coffee & orange for tea

	// Exit
	circles.exit().remove();
}