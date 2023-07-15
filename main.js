//=============================================================================
// This file tracks location and path of International Space Station.
//*****************************************************************************

// Variable declaration
let isSatelliteTracked = true;
let refreshInterval = 1000;
let satellitePath = [];

// Setup
let issTrackingElem = document.getElementById("iss_tracking_button");
issTrackingElem.innerHTML = "Stop ISS tracking"
issTrackingElem.style.backgroundColor = "darkred";

// Initialize and setup Leaflet map
let map = L.map('map', {
    zoom: 6,                        // Initial zoom level
    zoomDelta: 1,                   // Zoom levels using zoom buttons
    wheelPxPerZoomLevel: 200,       // Zoom levels using mouse wheel zoom
    fadeAnimation: false            // Tile animation
});

// Add OpenStreetMap tiles to Leaflet map
let tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 3,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
})
.addTo(map);

// Initialize satellite marker
let satelliteMarker = L.marker([0, 0]).addTo(map);

// Get satellite information regularly
let interval = setInterval(getSatelliteInfo, refreshInterval);


//=============================================================================
// This function gets satellite information and plots its current location
// along with its path.
//-----------------------------------------------------------------------------
async function getSatelliteInfo()
//-----------------------------------------------------------------------------
{
    // Query satellite info
    const api_url = 'https://api.wheretheiss.at/v1/satellites/25544';
    const response = await fetch(api_url);

    try {
        // Get satellite data
        const data = await response.json();
        const {
            latitude, longitude, name, velocity, visibility, altitude
        } = data;

        // Store satellite coordinates
        satellitePath.push(new L.LatLng(latitude, longitude));

        // Plot satellite path
        new L.Polyline(satellitePath, {
            color: 'red',
            weight: 1,
            opacity: 1,
            smoothFactor: 1
        })
        .addTo(map);

        // Get geoCoding info
        let info = getGeoCodingInfo(latitude, longitude);

        try {
            const value = await info;
            setupSatelliteMarker(
                name, latitude, longitude, altitude, velocity, visibility,
                value.geoCodingInfo, value.country, value.state, value.region,
                value.city, value.town, value.postcode
            )
        } catch (error) {
            console.log(error);
        }

        // Set map view focused on satellite
        map.setView([latitude, longitude], map.getZoom());

    } catch (error) {
        console.log(error);
    }
}

//=============================================================================
// This function sets up the satellite tracking marker and satellite
// information as popup text.
//-----------------------------------------------------------------------------
function setupSatelliteMarker(
    name, lat, lng, alt, vel, vis, geoCodingInfo, country, state, region,
    city, town, postcode
)
//-----------------------------------------------------------------------------
{
    // Position satellite marker
    satelliteMarker.setLatLng([lat, lng]);

    // Define default geo-coding popup text
    let popupText = "Satellite: " + name.toUpperCase() +
                    "<br/> Coordinates: [" + lat.toFixed(1) + "°, " +
                                             lng.toFixed(1) + "°]" +
                    "<br/> Altitude: " + alt.toFixed(2) + " km" +
                    "<br/> Velocity: " + vel.toFixed(2) + " kph" +
                    "<br/> Visibility: " + vis +
                    "<br/><br/> Geo-coding info: ";

    // Update popup text when geo-coding info is available
    if (geoCodingInfo) {

        popupText += "Available" + "<br/> Country: " + country;

        // Add state info if it is available
        if ("undefined".localeCompare(state) != 0) {
            popupText += "<br/> State: " + state;
        }

        // Add region info if it is available
        if ("undefined".localeCompare(region) != 0) {
            popupText += "<br/> Region: " + region;
        }

        // Add city info if it is available
        if ("undefined".localeCompare(city) != 0) {
            popupText += "<br/> City: " + city;
        }

        // Add town info if it is available
        if ("undefined".localeCompare(town) != 0) {
            popupText += "<br/> Town: " + town;
        }

        // Add postcode info if it is available
        if ("undefined".localeCompare(postcode) != 0) {
            popupText + "<br/> Postcode: " + postcode;
        }
    }

    // Update popup text when geo-coding info is unavailable
    else {
        popupText += "Unavailable";
    }

    // Add popup text to satellite marker
    satelliteMarker.bindPopup(popupText);

    // Open popup text
    satelliteMarker.openPopup();
}

//=============================================================================
// This function takes the latitude and longitude as the arguments and provides
// geo-coding information if it is available.
//-----------------------------------------------------------------------------
async function getGeoCodingInfo(lat, lng)
//-----------------------------------------------------------------------------
{
    let geoCodingInfo, country, state, region, city, town, postcode;

    const url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+lat+"&lon="+lng;
    const response = await fetch(url);

    try {
        const data = await response.json();

        if (data.error == "Unable to geocode") {
            geoCodingInfo = false;
        }
        else {
            geoCodingInfo = true;
            country = data.address.country;
            state = data.address.state
            region = data.address.region;
            city = data.address.city;
            town = data.address.town;
            postcode = data.address.postcode;
        }

        return {geoCodingInfo, country, state, region, city, town, postcode};

    } catch (error) {
        console.log(error);
    }
}

//=============================================================================
// This function sets the satellite tracking status.
//-----------------------------------------------------------------------------
function setSatelliteTrackingStatus()
//-----------------------------------------------------------------------------
{
    // Stop tracking
    if (isSatelliteTracked) {
        clearInterval(interval);
        isSatelliteTracked = false;
        issTrackingElem.textContent = "Resume ISS tracking";
        issTrackingElem.style.backgroundColor = "green";
    }

    // Resume tracking
    else if (!isSatelliteTracked) {
        interval = setInterval(getSatelliteInfo, refreshInterval);
        isSatelliteTracked = true;
        issTrackingElem.textContent = "Stop ISS tracking";
        issTrackingElem.style.backgroundColor = "darkred";
    }
}