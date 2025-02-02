// uRL for Blue Bikes data
let url = 'https://gbfs.bluebikes.com/gbfs/en/station_information.json';

// fetch station data and initialize the map
fetch(url)
    .then(response => response.json())
    .then(data => {
        const stations = data.data.stations;

        // prepare display data
        const displayData = stations.map(station => ({
            name: station.name,
            capacity: station.capacity,
            lat: station.lat,
            lon: station.lon,
        }));

        // update the DOM with station count
        document.getElementById('station-count').innerText = stations.length;

        // initialize StationMap centered on Boston
        new StationMap("station-map", displayData, [42.3601, -71.0589]);
    })
    .catch(error => console.error('Error fetching station data:', error));