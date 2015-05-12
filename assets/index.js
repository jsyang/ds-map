var $body;
var $controlsHeader;
var $mapCover;
var $controlsResults;
var $mapHeader;

/**
 * @global
 * @type {{activeInfoWindows: Array, directionsService: google.maps.DirectionsService, currentLatLong: null}}
 */
var dsmap = {
    eventData: JSON.parse(localStorage.getItem('eventData')),

    activeInfoWindows: [],

    directionsService: new google.maps.DirectionsService(),
    currentLatLong   : null
};

function onEventMarkerClick(marker, infoWindow) {
    closeAllInfoWindows();
    infoWindow.open(dsmap.map, marker);
    dsmap.activeInfoWindows.push(infoWindow);
}

function eventToResultHTML(event, i) {
    return [
        '<div class="result" data-id="' + i + '">',
        '<div class="title">' + event.EVENT + '</div>',
        '<div class="time">' + event.TIME + '</div>',
        '</div>'
    ].join('');
}

function eventToHTML(event) {
    return ('<div style="text-align:center"><img src="' + event.HOST + '"></div>' +
    '<div><h2>' + event.EVENT + '</h2></div>' +
    '<div>' + event.ABOUT + '</div>' +
    '<div><h3>Time</h3>' + event.TIME + '</div>' +
    '<div><h3>Location</h3>' + event.LOCATION + '</div>');
}

function onData() {
    dsmap.eventData.forEach(function (event) {
        var infoWindow = new google.maps.InfoWindow({
            content: eventToHTML(event)
        });

        var latLong = new google.maps.LatLng(event.LAT, event.LONG);

        var icon = event.THISPLACE ? 'assets/marker-thisplace.png' : 'assets/marker.png';

        var marker = new google.maps.Marker({
            position: latLong,
            map     : dsmap.map,
            icon    : icon
        });

        google.maps.event.addListener(marker, 'click', onEventMarkerClick.bind(null, marker, infoWindow));
    });

    var filteredEventsHTML = '';

    dsmap.eventData.forEach(function showResult(result) {
        filteredEventsHTML += eventToResultHTML(result);
    });

    $controlsResults.html(filteredEventsHTML);

    addCurrentLocationMarker();
}

function onCSV(res) {
    dsmap.eventData = res.data;
    localStorage.setItem('eventData', JSON.stringify(res.data));
    onData();
}

function closeAllInfoWindows() {
    dsmap.activeInfoWindows.forEach(function (iw) {
        iw.close();
    });

    dsmap.activeInfoWindows = [];

    dsmap.directions.setMap(null);
}

function addCurrentLocationMarker() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var latLong = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            var marker = new google.maps.Marker({
                position: latLong,
                map: dsmap.map
            });

            dsmap.currentLatLong = latLong;
        });
    }
}

function showDetails() {

}

google.maps.event.addDomListener(window, 'load', function () {
    $body = $('body');
    $mapHeader = $('#main .header');
    $controlsResults = $('#controls #results');
    $controlsHeader = $('#controls .header');
    $mapCover = $('#map-cover');

    var mapOptions = {
        zoom  : 14,
        center: new google.maps.LatLng(51.5267625, -0.0801057),

        panControl       : false,
        streetViewControl: false,
        mapTypeControl   : false,

        zoomControl       : true,
        zoomControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT }
    };

    var map = new google.maps.Map(document.getElementById("map"), mapOptions);
    google.maps.event.addListener(map, 'click', closeAllInfoWindows);

    var directions = new google.maps.DirectionsRenderer();
    directions.setMap(map);

    dsmap.directions = directions;
    dsmap.map = map;

    if (dsmap.eventData) {
        onData();
    } else {
        Papa.parse('assets/index.csv', {
            header       : true,
            download     : true,
            dynamicTyping: true,
            complete     : onCSV
        });
    }

    $mapHeader.on('click', $body.addClass.bind($body, 'show-controls'));
    $controlsHeader.on('click', $body.removeClass.bind($body, 'show-controls'));

    $controlsResults.on('click', '.result', function () {
        showDetails(this.getAttribute('data-id'));
    });
});
