var dsmap = {
    activeInfoWindows : [],

    directionsService : new google.maps.DirectionsService(),
    currentLatLong : null,
    activeLatLong : null
};

function onCSV(res) {
    res.data.forEach(function(event){
        var infoWindow = new google.maps.InfoWindow({
            content: (
                '<div style="text-align:center"><img src="'+event.HOST+'"></div>' +
                '<div><h2>'+event.EVENT+'</h2></div>'+
                '<div>'+event.ABOUT+'</div>'
            )
        });

        var latLong = new google.maps.LatLng(event.LAT, event.LONG);

        var icon = event.THISPLACE? 'assets/marker-thisplace.png' : 'assets/marker.png';

        var marker = new google.maps.Marker({
            position: latLong,
            map: dsmap.map,
            icon: icon
        });

        google.maps.event.addListener(marker, 'click', function() {
          closeAllInfoWindows();
          infoWindow.open(dsmap.map, marker);
          dsmap.activeInfoWindows.push(infoWindow);
          dsmap.activeLatLong = latLong;

          showWalkingDirections();
        });
    });

    addCurrentLocationMarker();
}

function showWalkingDirections() {
    var start = dsmap.currentLatLong;
    var end = dsmap.activeLatLong;
    if(start && end) {
        dsmap.directions.setMap(dsmap.map);
      var request = {
          origin: start,
          destination:end,
          travelMode: google.maps.TravelMode.WALKING
      };
      dsmap.directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          dsmap.directions.setDirections(response);
        }
      });
    }
}

function closeAllInfoWindows() {
    dsmap.activeInfoWindows.forEach(function(iw){
        iw.close();
    });

    dsmap.activeInfoWindows = [];
    
    dsmap.directions.setMap(null);
}

function addCurrentLocationMarker(){
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var latLong = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var marker = new google.maps.Marker({
                position: latLong,
                map: dsmap.map
            });

            dsmap.currentLatLong = latLong;
        });
    }
}

google.maps.event.addDomListener(window, 'load', function() {
    // https://developers.google.com/maps/documentation/javascript/3.exp/reference

    var mapOptions = {
      zoom: 13,
      center: new google.maps.LatLng(51.5250255,-0.0904861),

      panControl: false,
      streetViewControl: false,

      mapTypeControl: true,
    mapTypeControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
      style: google.maps.MapTypeControlStyle.DEFAULT,
      mapTypeIds: [
        google.maps.MapTypeId.ROADMAP,
        google.maps.MapTypeId.TERRAIN
      ]
    },

    zoomControl: true,
    zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
    }
  };

    var map = new google.maps.Map(document.getElementById("map"), mapOptions);
    google.maps.event.addListener(map, 'click', closeAllInfoWindows);

    var directions = new google.maps.DirectionsRenderer();
    directions.setMap(map);

    dsmap.directions = directions;
    dsmap.map = map;

    Papa.parse('assets/index.csv', {
        header: true,
        download: true,
        dynamicTyping: true,
    	complete: onCSV
    });
});
