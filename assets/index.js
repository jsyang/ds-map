var $body;
var $controlsHeader;
var $mapCover;
var $controlsResults;
var $mapHeader;
var $detailsContent;
var $detailsTitle;
var $detailsImage;
var $detailsTime;
var $detailsLocation;
var $detailsAbout;

/**
 * @global
 * @type {{directionsService: google.maps.DirectionsService, currentLatLong: null}}
 */
var dsmap = {
    eventData: JSON.parse(localStorage.getItem('eventData')),
    directionsService: new google.maps.DirectionsService(),
    currentLatLong   : null
};

function eventToResultHTML(event, i) {
    return [
        '<div class="result" data-id="' + i + '">',
        '<div class="title">' + event.EVENT + '</div>',
        '<div class="time">' + event.TIME + '</div>',
        '</div>'
    ].join('');
}

function onData() {
    dsmap.eventData.forEach(function (event, index) {
        var latLong = new google.maps.LatLng(event.LAT, event.LONG);

        var icon = event.THISPLACE ? 'assets/marker-thisplace.png' : 'assets/marker.png';

        var marker = new google.maps.Marker({
            position: latLong,
            map     : dsmap.map,
            icon    : icon
        });

        google.maps.event.addListener(marker, 'click', showDetails.bind(null, index));
    });

    var filteredEventsHTML = '';

    dsmap.eventData.forEach(function showResult(result, i) {
        filteredEventsHTML += eventToResultHTML(result, i);
    });

    $controlsResults.html(filteredEventsHTML);

    addCurrentLocationMarker();
}

function onCSV(res) {
    dsmap.eventData = res.data;
    localStorage.setItem('eventData', JSON.stringify(res.data));
    onData();
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

function showDetails(index) {
    $body.addClass('show-details');

    var e = dsmap.eventData[index];
    $detailsImage.attr('src', e.HOST);
    $detailsTitle.text(e.EVENT);
    $detailsTime.text(e.TIME);
    $detailsLocation.text(e.LOCATION);
    $detailsAbout.text(e.ABOUT);

    $detailsContent[0].scrollTop = 0;
}

google.maps.event.addDomListener(window, 'load', function () {
    $body = $('body');
    $mapHeader = $('#main .header');
    $controlsResults = $('#controls #results');
    $controlsHeader = $('#controls .header');
    $mapCover = $('#map-cover');

    $detailsContent = $('#details .content');
    $detailsTitle = $('#details .title');
    $detailsImage = $('#details img');
    $detailsTime = $('#details .time');
    $detailsLocation = $('#details .location');
    $detailsAbout = $('#details .about');

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

    $mapCover.on('click', $body.removeClass.bind($body, 'show-controls show-details'));
    $mapHeader.on('click', $body.addClass.bind($body, 'show-controls'));
    $controlsHeader.on('click', $body.removeClass.bind($body, 'show-controls'));

    $controlsResults.on('click', '.result', function () {
        $body
            .removeClass('show-controls')
            .addClass('show-details');
        showDetails(this.getAttribute('data-id'));
    });
});
