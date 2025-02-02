// DATASETS

// Global variable with 1198 pizza deliveries
console.log(deliveryData);

// Global variable with 200 customer feedbacks
console.log(feedbackData.length);


// FILTER DATA, THEN DISPLAY SUMMARY OF DATA & BAR CHART

createVisualization();

function createVisualization() {
    /* ************************************************************
     *
     * TODO: (Step 5) Global Data Filtering
     *
     * 1) Ensure that the dataset summary (Step 2) and bar chart (Step 3) are updated
     *    whenever the filter options are changed.
     *
     * 2) Use event listeners to detect changes in the select box values and
     *    re-call createVisualization() to update both the bar chart and the dataset summary.
     *
     * HINT: Add event listeners to the select elements to call createVisualization()
     *       when a filter option is changed.
     *
     * ************************************************************/
    document.getElementById('area-select').addEventListener('change', filterData);
    document.getElementById('order-type-select').addEventListener('change', filterData);
    filterData();
}

// Function to recalculate the summary statistics based on the filtered data
function updateSummary(filteredData, feedbackData) {
    /* ************************************************************
     *
     * TODO: (Step 2) Display Dataset Summary
     *
     * 1) Extract and display the following key figures from the data:
     *    - Number of pizza deliveries
     *    - Total number of pizzas delivered (count)
     *    - Average delivery time
     *    - Total sales in USD
     *    - Total number of feedback entries
     *    - Number of feedback entries per quality category: low, medium, high
     *
     *
     *
     * 2) Update the HTML elements dynamically with these statistics.
     *
     * HINT: Use document.getElementById('some_id').innerText or innerHTML to set or get the values.
     *
     * ************************************************************/
    let totalDeliveries = filteredData.length;
    let totalPizzas = 0;
    let totalDeliveryTime = 0;
    let totalSales = 0;

    // loop through the filtered data to calculate totals
    filteredData.forEach(delivery => {
        totalPizzas += delivery.count;
        totalDeliveryTime += delivery.delivery_time;
        totalSales += delivery.price;
    });

    const avgDeliveryTime = (totalDeliveryTime / totalDeliveries).toFixed(0);
    const totalSalesFormatted = totalSales.toFixed(2);

    // Update the DOM elements for pizza deliveries
    document.getElementById('stats-deliveries').innerText = totalDeliveries;
    document.getElementById('stats-pizzas').innerText = totalPizzas;
    document.getElementById('stats-avg-delivery-time').innerText = `${avgDeliveryTime} min`;
    document.getElementById('stats-sales').innerText = `$${totalSalesFormatted}`;

    // calculate and update feedback
    let feedbackLow = 0;
    let feedbackMedium = 0;
    let feedbackHigh = 0;

    feedbackData.forEach(feedback => {
        if (feedback.quality === "low") {
            feedbackLow++;
        } else if (feedback.quality === "medium") {
            feedbackMedium++;
        } else if (feedback.quality === "high") {
            feedbackHigh++;
        }
    });

    // update it in HTML
    document.getElementById('stats-feedback').innerText = feedbackData.length;
    document.getElementById('stats-feedback-low').innerText = feedbackLow;
    document.getElementById('stats-feedback-medium').innerText = feedbackMedium;
    document.getElementById('stats-feedback-high').innerText = feedbackHigh;
}

// Function to handle filtering of data
function filterData() {
    /* ************************************************************
     *
     * TODO: (Step 4) Filter Data Before Drawing the Bar Chart
     *
     * 1) Add select boxes to the HTML to filter by 'area' and 'order type'.
     * 2) Filter deliveryData based on the selected options from the select boxes.
     * 3) Update the visualization (key figures and bar chart) based on the filtered data.
     *
     * HINT: Use document.getElementById(...).value and document.getElementById(...).value
     *       to get the selected values, then filter deliveryData accordingly.
     *
     * ************************************************************/
    const selectedArea = document.getElementById('area-select').value;
    const selectedOrderType = document.getElementById('order-type-select').value;


    // filtering the data linked via the filer in HTML
    let filteredData = deliveryData.filter(delivery => {
        let areaMatch = selectedArea === 'all' || delivery.area === selectedArea;
        let orderTypeMatch = selectedOrderType === 'all' || delivery.order_type === selectedOrderType;
        return areaMatch && orderTypeMatch;
    });

    // note that feedback data is joined by delivery data via delivery_id
    let filteredFeedbackData = feedbackData.filter(feedback => {
        return filteredData.some(delivery => delivery.delivery_id === feedback.delivery_id);
    });

    /* ************************************************************
     *
     * TODO: (Step 3) Render the Bar Chart
     *
     * 1) Call the function renderBarChart(deliveryData) to render a bar chart.
     * 2) Ensure that you have a div-container with the ID #chart-area in your HTML.
     *
     * HINT: This function groups and counts deliveries per day and visualizes them.
     *
     * ************************************************************/
    renderBarChart(filteredData);
    updateSummary(filteredData, filteredFeedbackData);
}


