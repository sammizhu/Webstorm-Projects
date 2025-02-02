// Initial Exploration:
console.log("All attractions:", attractionData);

// Implement forEach to Display Names:
attractionData.forEach(attraction => {
    if (attraction.Visitors > 10000000) {
        console.log(attraction.Location);
    }
});

// Filtering Data:
const filteredData = attractionData.filter(function(attraction) {
    return attraction.Visitors > 10000000;
});

console.log("Filtered attractions with more than 10 million visitors:", filteredData);

// Using map to Prevent Unintended Side Effects:
const shallowCopy = filteredData.map(function(attraction) {
    return attraction;
});

// Sorting the Filtered Data (Introducing a Common Issue):
shallowCopy.sort(function(a, b) {
    return b.Visitors - a.Visitors;
});

console.log("Sorted data:", shallowCopy);
// Not ideal that the sorting changes the data pernamently because you might want to restore to the original dataset.




