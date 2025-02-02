class StationMap {
	constructor(parentElement, displayData, mapCenter) {
		this.parentElement = parentElement;
		this.displayData = displayData;
		this.mapCenter = mapCenter;

		this.initVis();
	}

	initVis() {
		let vis = this;

		L.Icon.Default.imagePath = 'img/';

		// initialize the Leaflet map
		vis.map = L.map(vis.parentElement).setView(vis.mapCenter, 13);

		// add OpenStreetMap tile layer
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(vis.map);

		vis.layerGroup = L.layerGroup().addTo(vis.map);

		vis.loadGeoJSON();

		// add markers
		vis.updateVis();
	}

	updateVis() {
		let vis = this;

		// clear existing markers
		vis.layerGroup.clearLayers();

		// add markers for each station
		vis.displayData.forEach(station => {
			let marker = L.marker([station.lat, station.lon])
				.bindPopup(`<strong>${station.name}</strong><br>Capacity: ${station.capacity}`);
			vis.layerGroup.addLayer(marker);
		});

		// add a custom marker for SEC at Harvard
		let redMarker = new L.Icon({
			iconUrl: 'img/marker-icon-red.png',
			shadowUrl: 'img/marker-shadow.png',
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [0, -28],
		});

		L.marker([42.363230492629455, -71.12731607927883], { icon: redMarker })
			.bindPopup('<strong>SEC at Harvard University</strong>')
			.addTo(vis.map);

		// extras
		L.marker([42.36, -71.06]).addTo(vis.map).bindPopup("This is a new marker!");
		L.circle([42.36, -71.06], { radius: 200 }).addTo(vis.map).bindPopup("This is a circle!");
	}

	loadGeoJSON() {
		let vis = this;

		// load GeoJSON data
		d3.json('data/mbta-lines.json').then(data => {
			L.geoJson(data, {
				style: feature => ({
					color: feature.properties.LINE.toLowerCase(), // Use line name for color
					weight: 4,
					opacity: 0.8,
				}),
				onEachFeature: (feature, layer) => {
					layer.bindPopup(`<strong>${feature.properties.LINE} Line</strong>`);
				}
			}).addTo(vis.map);
		}).catch(error => console.error('Error loading GeoJSON data:', error));
	}
}