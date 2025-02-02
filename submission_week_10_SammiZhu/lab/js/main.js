let dataMarriages = [
    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0],
    [0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
    [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [1,1,1,0,0,0,0,0,0,0,0,0,1,1,0,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
    [0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,0,0,0,0,0,1,0,1,0,0,0],
    [0,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0]
];

let dataBusiness = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,0,0,1,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,0,0,1,0,0,0,0,0],
    [0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0],
    [0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,0,1,0,0,0,1,0,0,0,0,0],
    [0,0,1,0,0,1,0,0,0,1,0,0,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,1,1,1,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
];


let svg;
let cellSize;
let originalData;


function wrangleData(attributesData) {
    const displayData = [];

    attributesData.forEach((d, i) => {
        // create  family object with required attributes
        let family = {
            index: i,
            name: d.Family.replace(/"/g, ''),
            wealth: +d.Wealth,
            priorates: d.Priorates !== 'NA' ? +d.Priorates : 0,
            marriageValues: dataMarriages[i],
            businessValues: dataBusiness[i],
            marriages: 0,
            businessTies: 0,
            allRelations: 0
        };

        // calculate  number of marriages and business ties
        family.marriages = family.marriageValues.reduce((a, b) => a + b, 0);
        family.businessTies = family.businessValues.reduce((a, b) => a + b, 0);
        family.allRelations = family.marriages + family.businessTies;

        // add family object to displayData array
        displayData.push(family);
    });

    return displayData;
}

// Load the CSV and wrangle data
d3.csv("data/florentine-family-attributes.csv").then(attributesData => {
    // Wrangle the data and store it in displayData
    const displayData = wrangleData(attributesData);

    window.data = displayData;
    originalData = displayData.slice(); // save original order for columns

    createMatrixVisualization(displayData);

    // set up sorting functionality for dropdown
    d3.select("#sortOptions").on("change", function () {
        const selectedOption = d3.select(this).property("value");
        sortMatrix(selectedOption);
    });

    createLegend();
});

function createMatrixVisualization(data) {
    const margin = { top: 150, right: 25, bottom: 50, left: 120 };
    cellSize = 30;
    const width = cellSize * data.length;
    const height = cellSize * data.length;

    svg = d3.select("#matrix-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    drawMatrix(data);
}

function drawMatrix(data) {
    const padding = 5;
    const innerCellSize = cellSize - padding * 2;

    const colData = originalData;

    const rowLabels = svg.selectAll(".row-label")
        .data(data, d => d.name);

    rowLabels.enter()
        .append("text")
        .attr("class", "row-label")
        .attr("x", -10)
        .attr("y", (d, i) => i * cellSize + cellSize / 2)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .text(d => d.name);

    rowLabels.transition()
        .duration(1000)
        .attr("y", (d, i) => i * cellSize + cellSize / 2);

    rowLabels.exit().remove();

    const colLabels = svg.selectAll(".col-label")
        .data(colData, d => d.name);

    colLabels.enter()
        .append("text")
        .attr("class", "col-label")
        .attr("x", (d, i) => i * cellSize + cellSize - 15)
        .attr("y", -10)
        .attr("text-anchor", "right")
        .attr("alignment-baseline", "hanging")
        .attr("transform", (d, i) => `rotate(-90, ${i * cellSize + cellSize / 2}, -10)`)
        .text(d => d.name);

    colLabels.exit().remove();

    const rows = svg.selectAll(".matrix-row")
        .data(data, d => d.name);

    const rowsEnter = rows.enter()
        .append("g")
        .attr("class", "matrix-row")
        .attr("transform", (d, i) => `translate(0, ${i * cellSize})`);

    rows.transition()
        .duration(1000)
        .attr("transform", (d, i) => `translate(0, ${i * cellSize})`);

    rows.exit().remove();

    // for each row bind data for cells (columns remain in original order)
    rowsEnter.each(function (rowData, rowIndex) {
        const row = d3.select(this);

        const cells = row.selectAll(".cell")
            .data(colData, d => d.name);

        const cellsEnter = cells.enter()
            .append("g")
            .attr("class", "cell")
            .attr("transform", (d, i) => `translate(${i * cellSize + padding}, ${padding})`);

        // draw background rectangle
        cellsEnter.append("rect")
            .attr("width", innerCellSize)
            .attr("height", innerCellSize)
            .attr("fill", "#d3d3d3");

        // draw triangles
        cellsEnter.each(function (cellData, cellIndex) {
            const cell = d3.select(this);
            const colIndex = cellData.index;

            const marriageValue = rowData.marriageValues[colIndex];
            const businessValue = rowData.businessValues[colIndex];

            if (marriageValue) {
                cell.append("path")
                    .attr("d", `M 0 0 L ${innerCellSize} 0 L 0 ${innerCellSize} Z`)
                    .attr("fill", "purple");
            }

            if (businessValue) {
                cell.append("path")
                    .attr("d", `M ${innerCellSize} ${innerCellSize} L ${innerCellSize} 0 L 0 ${innerCellSize} Z`)
                    .attr("fill", "orange");
            }
        });
    });

    // update existing cells
    rows.each(function (rowData, rowIndex) {
        const row = d3.select(this);

        const cells = row.selectAll(".cell")
            .data(colData, d => d.name);

        // update cell positions
        cells.transition()
            .duration(1000)
            .attr("transform", (d, i) => `translate(${i * cellSize + padding}, ${padding})`);

        // update triangles in cells
        cells.each(function (cellData, cellIndex) {
            const cell = d3.select(this);
            const colIndex = cellData.index;

            cell.selectAll("path").remove();

            const marriageValue = rowData.marriageValues[colIndex];
            const businessValue = rowData.businessValues[colIndex];

            if (marriageValue) {
                cell.append("path")
                    .attr("d", `M 0 0 L ${innerCellSize} 0 L 0 ${innerCellSize} Z`)
                    .attr("fill", "purple");
            }

            if (businessValue) {
                cell.append("path")
                    .attr("d", `M ${innerCellSize} ${innerCellSize} L ${innerCellSize} 0 L 0 ${innerCellSize} Z`)
                    .attr("fill", "orange");
            }
        });
    });

    rows.selectAll(".cell")
        .data(colData, d => d.name)
        .exit()
        .remove();
}

function sortMatrix(criteria) {
    const sortedData = data.slice();

    // sort data based on selected criteria
    if (criteria === "name") {
        sortedData.sort((a, b) => d3.ascending(a.name, b.name));
    } else if (criteria === "marriages") {
        sortedData.sort((a, b) => d3.descending(a.marriages, b.marriages));
    } else if (criteria === "businessTies") {
        sortedData.sort((a, b) => d3.descending(a.businessTies, b.businessTies));
    } else if (criteria === "allRelations") {
        sortedData.sort((a, b) => d3.descending(a.allRelations, b.allRelations));
    } else if (criteria === "wealth") {
        sortedData.sort((a, b) => d3.descending(a.wealth, b.wealth));
    } else if (criteria === "priorates") {
        sortedData.sort((a, b) => d3.descending(a.priorates, b.priorates));
    }

    data = sortedData;

    // redraw matrix with updated data
    drawMatrix(data);
}

function createLegend() {
    const legendData = [
        { type: 'Marriage', color: 'purple' },
        { type: 'Business Tie', color: 'orange' }
    ];

    const legend = d3.select("#legend")
        .append("svg")
        .attr("width", 300)
        .attr("height", 20);

    const legendItems = legend.selectAll(".legend-item")
        .data(legendData)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(${i * 150}, 0)`);

    legendItems.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => d.color);

    legendItems.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .attr("alignment-baseline", "middle")
        .text(d => d.type);
}