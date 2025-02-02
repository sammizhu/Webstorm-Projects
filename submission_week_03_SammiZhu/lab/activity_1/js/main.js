// Ensure D3 is loaded first, then select the body and append a div
d3.select("body")
    .append("div")
    .attr("class", "text-container")
    .style("color", "black")
    .text("Blue Circle on Beige Canvas in Dark Room");