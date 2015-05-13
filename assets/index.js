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

function eventToResultHTML(event) {
    return [
        '<div class="result" data-index="' + event.index + '">',
        '<div class="title">' + event.EVENT + '</div>',
        '<div class="time">' + event.TIME + '</div>',
        '</div>'
    ].join('');
}

function getEventsByDay(day){
    return dsmap.eventData
        .filter(function(e){
            return e.DAYS.toString() === day.toString();
        })
        .sort(function(a,b){
            return new Date(a.START_UTIME) - new Date(b.START_UTIME);
        });
}

function hideAllEventMarkers(){
    dsmap.eventData.forEach(function(e){
        e.marker.setMap(null);
    });
}

function onData() {
    dsmap.eventData.forEach(function (event, index) {
        var latLong = new google.maps.LatLng(event.LAT, event.LONG);

        var icon = event.THISPLACE ? 'assets/marker-thisplace.png' : 'assets/marker.png';

        var marker = new google.maps.Marker({
            position: latLong,
            //map     : dsmap.map,
            icon    : icon
        });

        google.maps.event.addListener(marker, 'click', showDetails.bind(null, index));

        event.marker = marker;
        event.index = index;
    });


    addCurrentLocationMarker();
    showDayEvents(15);
}

function onCSV(res) {
    var normalized = res.data.slice();

    res.data.forEach(function(e, i){
        var days = e.DAYS.toString().split(',');
        var starttimes = e.STARTTIMES.split(',');
        var endtimes = e.ENDTIMES.split(',');

        if(days.length > 1) {
            days.forEach(function(day){
                var clonedEvent = $.extend({}, e, {
                    DAYS: day,
                    STARTTIMES: starttimes[0],
                    ENDTIMES: endtimes[0]
                });
                normalized.push(clonedEvent);
            });

            normalized[i] = null;

        } else if(starttimes.length > 1) {
            starttimes.forEach(function(_, j){
                var dayValue = j > 0? parseInt(days[0])+1 : days[0];

                var clonedEvent = $.extend({}, e, {
                    DAYS: dayValue,
                    STARTTIMES: starttimes[j],
                    ENDTIMES: endtimes[j]
                });
                normalized.push(clonedEvent);
            });

            normalized[i] = null;
        }
    });

    normalized = normalized.filter(Boolean);

    normalized.forEach(function(e){
        e.START_UTIME = new Date([
            e.STARTTIMES,
            'May',
            e.DAYS,
            '2015'
        ].join(' '));

        e.END_UTIME = new Date([
            e.ENDTIMES,
            'May',
            e.DAYS,
            '2015'
        ].join(' '));

        e.START_UTIME = e.START_UTIME.toString();
        e.END_UTIME = e.END_UTIME.toString();
    });

    localStorage.setItem('eventData', JSON.stringify(normalized));
    dsmap.eventData = normalized;
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

function showDayEvents(day) {
    hideAllEventMarkers();

    var events = getEventsByDay(day);
    events.forEach(function(e){ e.marker.setMap(dsmap.map); });
    var filteredEventsHTML = '';

    events.forEach(function showResult(result, i) {
        filteredEventsHTML += eventToResultHTML(result, i);
    });

    $controlsResults.html(filteredEventsHTML);
}

google.maps.event.addDomListener(window, 'load', function () {
    var querystring = location.search.replace('?','');
    if(querystring === 'clearlocalstorage') {
        localStorage.clear();
    }

    $body = $('body');
    $mapHeader = $('#main .header');
    $controlsResults = $('#controls #results');
    $controlsHeader = $('#controls .header');
    $controlsDate = $('#controls .when .date');
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

    $controlsDate.on('click', function(){
        $controlsDate.removeClass('selected');
        this.classList.add('selected');
        var day = this.getAttribute('data-date');
        showDayEvents(day);
    });

    $controlsResults.on('click', '.result', function () {
        $body
            .removeClass('show-controls')
            .addClass('show-details');
        showDetails(this.getAttribute('data-index'));
    });
});
