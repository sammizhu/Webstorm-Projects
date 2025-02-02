let sandwiches = [
    { name: "Thesis", price: 7.95, size: "large" },
    { name: "Dissertation", price: 8.95, size: "large" },
    { name: "Highlander", price: 6.50, size: "small" },
    { name: "Just Tuna", price: 6.50, size: "small" },
    { name: "So-La", price: 7.95, size: "large" },
    { name: "Special", price: 12.50, size: "small" }
];

let svg = d3.select("svg")
// Bind data and create circles
svg.selectAll("circle.sandwich-circle")
    .data(sandwiches)
    .enter()
    .append("circle")
    .attr("class", "sandwich-circle")
    .attr("cx", (d, i) => 50 + i * 60)  // Set the x/y coordinates and make sure that the circles don’t overlap each other
    .attr("cy", 100)  // Y position, center vertically in SVG
    .attr("r", d => d.size === "large" ? 20 : 10)  // Radius: large sandwiches should be twice as big as small ones
    .attr("fill", d => d.price < 7.00 ? "green" : "yellow")  // Color based on price
    .attr("stroke", "black")  // Add a border to every circle