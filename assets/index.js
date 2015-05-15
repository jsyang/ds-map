var todayDate;
var deepLinkId;

var $body;
var $mapCover;

var $date;
var $listingCloseButton;
var $listingResults;

var $showListingButton;
var $detailsContent;
var $detailsTitle;
var $detailsImage;
var $detailsTime;
var $detailsLocation;
var $detailsAbout;
var $detailsShareLink;
var $detailsMapsLink;

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
    var expired = new Date(event.END_UTIME) < new Date(todayDate);

    return [
        '<div class="result" data-index="' + event.index + '" data-expired="' + expired + '">',
        '<div class="title">' + event.EVENT + '</div>',
        '<div class="time">' + event.TIME + '</div>',
        '</div>'
    ].join('');
}

function getEventsByDay(day) {

    var dayData = dsmap.eventData;

    if (day !== 'all') {
        dayData = dayData.filter(function (e) {
            return e.DAYS.toString() === day.toString();
        });
    }

    dayData = dayData.sort(function (a, b) {
        return new Date(a.START_UTIME) - new Date(b.START_UTIME);
    });

    return dayData;
}

function hideAllEventMarkers() {
    dsmap.eventData.forEach(function (e) {
        e.marker.setMap(null);
    });
}

function onData() {
    dsmap.eventData.forEach(function (event, index) {
        var latLong = new google.maps.LatLng(event.LAT, event.LONG);

        var icon = event.THISPLACE ? 'assets/marker-thisplace.png' : 'assets/marker.png';

        var marker = new google.maps.Marker({
            position: latLong,
            icon    : icon
        });

        google.maps.event.addListener(marker, 'click', showDetails.bind(null, index));

        event.marker = marker;
        event.index = index;
    });

    showDeepLink();
}

function showDeepLink() {
    var deepLinkedItem;
    if (typeof deepLinkId !== 'undefined') {
        deepLinkedItem = dsmap.eventData.filter(function (e) {
            return e.EVENTID.toString() === deepLinkId.toString();
        })[0];

        if (deepLinkedItem) {
            showDetails(deepLinkedItem.index);
            showDayEvents(deepLinkedItem.DAYS);
        }
    } else {
        showDayEvents(todayDate.getDate());
    }
}

function onCSV(res) {
    var normalized = res.data.slice();

    res.data.forEach(function (e, i) {
        var days = e.DAYS.toString().split(',');
        var starttimes = e.STARTTIMES.split(',');
        var endtimes = e.ENDTIMES.split(',');

        if (days.length > 1) {
            days.forEach(function (day) {
                var clonedEvent = $.extend({}, e, {
                    DAYS    : day,
                    STARTTIMES: starttimes[0],
                    ENDTIMES: endtimes[0]
                });
                normalized.push(clonedEvent);
            });

            normalized[i] = null;

        } else if (starttimes.length > 1) {
            starttimes.forEach(function (_, j) {
                var dayValue = j > 0 ? parseInt(days[0]) + 1 : days[0];

                var clonedEvent = $.extend({}, e, {
                    DAYS    : dayValue,
                    STARTTIMES: starttimes[j],
                    ENDTIMES: endtimes[j]
                });
                normalized.push(clonedEvent);
            });

            normalized[i] = null;
        }
    });

    normalized = normalized.filter(Boolean);

    normalized.forEach(function (e) {
        e.START_UTIME = new Date([
            e.STARTTIMES,
            'May',
            e.DAYS,
            '2015'
        ].join(' '));

        // Default
        var endtime = e.ENDTIMES ? e.ENDTIMES : e.START_UTIME.getHours() + 2;

        e.END_UTIME = new Date([
            endtime,
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

var LINK = {
    TWITTER: 'https://twitter.com/home?status=Going%20to%20!!!%20http://digitalshoreditch.thisplace.com/?id=???%20%23digitalshoreditch',
    FACEBOOK              : 'https://www.facebook.com/sharer/sharer.php?u=Going%20to%20!!!%20%23ds15%20%23digitalshoreditch',
    GOOGLE_MAPS           : 'https://maps.google.com/?q=@__END__',
    GOOGLE_MAPS_DIRECTIONS: 'http://maps.google.com/maps?daddr=__END__'
};

function showDetails(index) {
    index = parseInt(index);

    $body.addClass('show-details');

    var e = dsmap.eventData[index];
    $detailsImage.attr('src', 'assets/logos/' + e.HOST);
    $detailsTitle.text(e.EVENT);
    $detailsTime.text(e.TIME);
    $detailsLocation.text(e.LOCATION);
    $detailsAbout.html(e.ABOUT);

    $detailsShareLink.attr(
        'href',
        LINK.TWITTER
            .replace('!!!', e.EVENT)
            .replace('???', e.EVENTID)
    );

    var eventLatLong = e.LAT + ',' + e.LONG;
    var userLatLong = dsmap.userMarker && dsmap.userMarker.getPosition().toUrlValue();
    var mapsLink;

    if (userLatLong) {
        mapsLink = LINK.GOOGLE_MAPS_DIRECTIONS
            .replace('__START__', userLatLong)
            .replace('__END__', eventLatLong);
    } else {
        mapsLink = LINK.GOOGLE_MAPS
            .replace('__END__', eventLatLong);
    }

    $detailsMapsLink.attr('href', mapsLink);

    $detailsContent[0].scrollTop = 0;
}

function showDayEvents(day) {
    if (day !== 'all') {
        hideAllEventMarkers();
    }

    var events = getEventsByDay(day);
    events.forEach(function (e) {
        e.marker.setMap(dsmap.map);
    });
    var filteredEventsHTML = '<a href="about/"><div class="about-link">About this app</div></a>';

    events.forEach(function showResult(result, i) {
        filteredEventsHTML += eventToResultHTML(result, i);
    });

    $listingResults.html(filteredEventsHTML);
    updateSelectedDay(day);
}

function updateSelectedDay(day) {
    $date.removeClass('selected');
    $date.filter('[data-date="' + day + '"]').addClass('selected');
}

function updateDaySelectorToday() {
    var day = todayDate.getDate();
    $date.filter('[data-date="' + day + '"]').find('.day').text('Today');
    $date.filter('[data-date="' + (day + 1) + '"]').find('.day').text('Tomorrow');
}

google.maps.event.addDomListener(window, 'load', function () {
    todayDate = new Date();

    var params = querystring.toDict(location.search.substr(1));
    if (params) {
        if (params.clearlocalstorage) {
            localStorage.clear();
            delete dsmap.eventData;
        }

        if (params.date) {
            todayDate = new Date(parseInt(params.date));
        }

        if (typeof params.id !== 'undefined') {
            deepLinkId = params.id;
        }
    }

    $body = $('body');
    $mapCover = $('#map-cover');

    var $main = $('#main');
    var $listing = $('#listing');
    var $details = $('#details');

    $showListingButton = $main.find('.show-listing-button');
    $date = $main.find('.when .date');


    $listingResults = $listing.find('#results');
    $listingCloseButton = $listing.find('.close-button');


    $detailsContent = $details.find('.content');
    $detailsTitle = $details.find('.title');
    $detailsImage = $details.find('img');
    $detailsTime = $details.find('.time');
    $detailsLocation = $details.find('.location');
    $detailsAbout = $details.find('.about');
    $detailsShareLink = $details.find('.share-link');
    $detailsMapsLink = $details.find('.maps-link');

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

    dsmap.userMarker = new GeolocationMarker(map);

    $mapCover.on('click', $body.removeClass.bind($body, 'show-details'));
    $showListingButton.on('click', $body.addClass.bind($body, 'show-listing'));
    $listingCloseButton.on('click', $body.removeClass.bind($body, 'show-listing'));

    $date.on('click', function () {
        var day = this.getAttribute('data-date');
        showDayEvents(day);
    });

    $listingResults.on('click', '.result', function () {
        $body.addClass('show-details');
        showDetails(this.getAttribute('data-index'));
    });

    updateDaySelectorToday();
});
