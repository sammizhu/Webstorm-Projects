class Experiment {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;

        // create empty array to hold trial results
        this.trialResults = [];

        // initialize configurations
        this.configs = {};

        // map shapes to D3 symbols
        this.symbolMap = {
            'Circle': d3.symbolCircle,
            'Square': d3.symbolSquare,
            'Triangle': d3.symbolTriangle,
            'Diamond': d3.symbolDiamond,
            'Cross': d3.symbolCross,
            'Star': d3.symbolStar
        };

        this.initVis();

        // grab initial configurations and display shapes
        this.grabConfigs();
    }

    initVis() {
        let vis = this;

        // get container size
        let size = document.getElementById(vis.parentContainer).getBoundingClientRect();

        // set margins and dimensions
        vis.margin = {top: 10, right: 10, bottom: 10, left: 10};
        vis.width = size.width - vis.margin.left - vis.margin.right;
        vis.height = size.height - vis.margin.top - vis.margin.bottom;

        // create SVG element
        vis.svg = d3.select("#" + vis.parentContainer)
            .append('svg')
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .style("overflow", "hidden") // Ensure SVG doesn't overflow
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // set up x and y scales
        vis.xScale = d3.scaleLinear()
            .domain([-1, 1])
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .domain([-1, 1])
            .range([vis.height, 0]);

        // draw gridlines to divide SVG into four quadrants
        // y-axis
        vis.svg.append("line")
            .attr("x1", vis.xScale(0))
            .attr("y1", vis.yScale(-1))
            .attr("x2", vis.xScale(0))
            .attr("y2", vis.yScale(1))
            .attr("stroke", "lightgrey")
            .attr("stroke-width", 1);

        // x-axis
        vis.svg.append("line")
            .attr("x1", vis.xScale(-1))
            .attr("y1", vis.yScale(0))
            .attr("x2", vis.xScale(1))
            .attr("y2", vis.yScale(0))
            .attr("stroke", "lightgrey")
            .attr("stroke-width", 1);

        vis.data = [];
        vis.correctQuadrant = null;

        // define quadrants for later use
        vis.quadrants = [
            {
                id: 1,
                x: vis.xScale(0),
                y: vis.yScale(1),
                width: vis.xScale(1) - vis.xScale(0),
                height: vis.yScale(0) - vis.yScale(1)
            },
            {
                id: 2,
                x: vis.xScale(-1),
                y: vis.yScale(1),
                width: vis.xScale(0) - vis.xScale(-1),
                height: vis.yScale(0) - vis.yScale(1)
            },
            {
                id: 3,
                x: vis.xScale(-1),
                y: vis.yScale(0),
                width: vis.xScale(0) - vis.xScale(-1),
                height: vis.yScale(-1) - vis.yScale(0)
            },
            {
                id: 4,
                x: vis.xScale(0),
                y: vis.yScale(0),
                width: vis.xScale(1) - vis.xScale(0),
                height: vis.yScale(-1) - vis.yScale(0)
            }
        ];

        // render quadrants
        vis.svg.selectAll('.quadrant')
            .data(vis.quadrants)
            .enter()
            .append('rect')
            .attr('class', 'quadrant')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('width', d => d.width)
            .attr('height', d => d.height)
            .attr('fill', 'transparent')
            .attr('stroke', 'none')
            .style("pointer-events", "none")
            .on('click', function(event, d) {
                vis.handleQuadrantClick(d.id);
            });
    }

    grabConfigs() {
        let vis = this;

        // retrieve configurations from HTML form inputs
        vis.configs = {
            exposure: +document.getElementById('exposureSlider').value,
            trials: +document.getElementById('trialsSlider').value,
            numberOfElements: +document.getElementById('elementsSlider').value,
            targetShape: document.getElementById('targetShapePicker').value,
            targetColor: document.getElementById('targetColorPicker').value,
            targetSize: +document.getElementById('targetSizeSlider').value,
            targetRotation: +document.getElementById('targetRotationSlider').value,
            distractorShape: document.getElementById('distractorShapePicker').value,
            distractorColor: document.getElementById('distractorColorPicker').value,
            distractorSize: +document.getElementById('distractorSizeSlider').value,
            distractorRotation: +document.getElementById('distractorRotationSlider').value,
        };

        vis.wrangleData();
        vis.updateVis();
    }

    // Experiment.js

    wrangleData() {
        let vis = this;

        let numElements = vis.configs.numberOfElements;

        // calculate maximum shape size in pixels
        let maxTargetSize = vis.configs.targetSize;
        let maxDistractorSize = vis.configs.distractorSize;
        let maxShapeSize = Math.max(maxTargetSize, maxDistractorSize);

        // D3 symbol size is in area (square pixels)
        let maxShapeArea = maxShapeSize * 10;
        let maxShapeRadius = Math.sqrt(maxShapeArea / Math.PI);

        // convert maxShapeRadius from pixels to coordinate units
        let marginX = maxShapeRadius / (vis.width / 2);
        let marginY = maxShapeRadius / (vis.height / 2);

        // ensure margin does not exceed  coordinate range
        marginX = Math.min(marginX, 1);
        marginY = Math.min(marginY, 1);

        // generate an array of elements
        vis.data = Array.from({length: numElements}, (v, i) => {
            // first element is target
            let isTarget = (i === 0);

            // random position within adjusted range
            let x = Math.random() * (2 - 2 * marginX) - (1 - marginX); // [-1 + marginX, 1 - marginX]
            let y = Math.random() * (2 - 2 * marginY) - (1 - marginY); // [-1 + marginY, 1 - marginY]

            let element = {
                x: x,
                y: y,
                shape: isTarget ? vis.symbolMap[vis.configs.targetShape] : vis.symbolMap[vis.configs.distractorShape],
                color: isTarget ? vis.configs.targetColor : vis.configs.distractorColor,
                size: isTarget ? vis.configs.targetSize : vis.configs.distractorSize,
                rotation: isTarget ? vis.configs.targetRotation : vis.configs.distractorRotation,
                isTarget: isTarget
            };

            // determine correct quadrant
            if (isTarget) {
                if (x > 0 && y > 0) {
                    vis.correctQuadrant = 1;
                } else if (x < 0 && y > 0) {
                    vis.correctQuadrant = 2;
                } else if (x < 0 && y < 0) {
                    vis.correctQuadrant = 3;
                } else if (x > 0 && y < 0) {
                    vis.correctQuadrant = 4;
                }
            }

            return element;
        });
    }

    updateVis() {
        let vis = this;

        // remove existing elements
        vis.svg.selectAll('.element').remove();

        // bind data and render elements
        vis.elements = vis.svg.selectAll('.element')
            .data(vis.data);

        vis.elements.enter()
            .append('path')
            .attr('class', 'element')
            .attr('transform', d => `translate(${vis.xScale(d.x)}, ${vis.yScale(d.y)}) rotate(${d.rotation})`)
            .attr('d', d3.symbol()
                .type(d => d.shape)
                .size(d => d.size * 10))
            .attr('fill', d => d.color);

        // update quadrants to be transparent
        vis.svg.selectAll('.quadrant')
            .attr('fill', 'transparent')
            .attr('stroke', 'none')
            .style('pointer-events', 'none');
    }

    runExperiment() {
        let vis = this;

        // ensure configurations are up to date
        vis.grabConfigs();

        // remove existing countdown or elements
        vis.svg.selectAll('.countdown').remove();
        vis.svg.selectAll('.element').remove();

        // show quadrants as gray screens
        vis.svg.selectAll('.quadrant')
            .attr('fill', 'lightgrey')
            .attr('stroke', 'white')
            .style('pointer-events', 'none');

        let countdownValue = 3;

        function runCountdown() {
            if (countdownValue > 0) {
                // display the countdown
                vis.svg.selectAll('.countdown').remove();
                vis.svg.append('text')
                    .attr('class', 'countdown')
                    .attr('x', vis.width / 2)
                    .attr('y', vis.height / 2)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', 48)
                    .text(countdownValue);

                countdownValue--;

                setTimeout(() => {
                    runCountdown();
                }, 1000);
            } else {
                vis.svg.selectAll('.countdown').remove();
                // start trials
                vis.currentTrial = 0;
                vis.trialResults = [];
                vis.runTrial();
            }
        }

        runCountdown();
    }

    runTrial() {
        let vis = this;

        if (vis.currentTrial >= vis.configs.trials) {
            // finish trials
            trialResults.push({
                trials: vis.configs.trials,
                trialArray: vis.trialResults,
                configs: vis.configs
            });

            // update results matrix
            myResultsMatrixVis.resultsData = trialResults;
            myResultsMatrixVis.wrangleData();

            vis.displayFinalResult();

            return;
        }

        vis.wrangleData();

        // hide quadrants during exposure
        vis.svg.selectAll('.quadrant')
            .attr('fill', 'transparent')
            .attr('stroke', 'none')
            .style('pointer-events', 'none');

        vis.updateVis();

        // set a timeout to hide elements after exposure time
        setTimeout(() => {
            // hide elements
            vis.svg.selectAll('.element').remove();

            // show quadrants and allow user interaction
            vis.svg.selectAll('.quadrant')
                .attr('fill', 'lightgrey')
                .attr('stroke', 'white')
                .style('pointer-events', 'auto');

        }, vis.configs.exposure);
    }

    handleQuadrantClick(quadrantId) {
        let vis = this;

        // disable further clicks
        vis.svg.selectAll('.quadrant')
            .style('pointer-events', 'none');

        // record the result
        let isCorrect = (quadrantId === vis.correctQuadrant);
        vis.trialResults.push(isCorrect);

        vis.currentTrial++;
        vis.runTrial();
    }

    displayFinalResult() {
        let vis = this;

        // remove quadrants
        vis.svg.selectAll('.quadrant')
            .style('pointer-events', 'none');

        // redraw last set of elements
        vis.updateVis();

        // highlight  correct quadrant
        vis.svg.selectAll('.quadrant')
            .attr('fill', d => {
                if (d.id === vis.correctQuadrant) {
                    return 'rgba(0, 255, 0, 0.2)';
                } else {
                    return 'transparent';
                }
            })
            .attr('stroke', 'none');
    }
}