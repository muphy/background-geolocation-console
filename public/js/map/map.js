function MapManager() {
	this.map = undefined;

	this.previousLocation = undefined;
	this.locationMarkers = [];
	this.geofenceMarkers = [];
	this.path = undefined;
	this.currentLocationMarker = undefined;
	this.locationAccuracyMarker = undefined;
	this.stationaryRadiusMarker = undefined;
}

MapManager.prototype.initialize = function () {
	var mapOptions = {
		center: new google.maps.LatLng(37.4815990, 126.8825650),
		zoom: 16,
		zoomControl: false,
		panControl: false,
		streetViewControl: false,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	this.map = new google.maps.Map($('#map_canvas')[0], mapOptions);
	// Add custom LongPress event to google map so we can add Geofences with longpress event!
    new LongPress(this.map, 500);
	this.initGeofence();
	return this;
}

MapManager.prototype.initGeofence = function () {
	var self = this;
	// Draw a red circle around the Marker we wish to move.
    var geofenceCursor = new google.maps.Marker({
        map: this.map,
        clickable: false,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 100,
            fillColor: '#11b700',   //'2f71ff',
            fillOpacity: 0.2,
            strokeColor: '#11b700', // 2f71ff
            strokeWeight: 2,
            strokeOpacity: 0.9
        }
    });
	
	// Tap&hold detected.  Play a sound a draw a circular cursor.
    google.maps.event.addListener(this.map, 'longpresshold', function (e) {
		geofenceCursor.setPosition(e.latLng);
		geofenceCursor.setMap(self.map);
    });

    // Longpress cancelled.  Get rid of the circle cursor.
    google.maps.event.addListener(this.map, 'longpresscancel', function () {
		geofenceCursor.setMap(null);
    });

    // Longpress initiated, add the geofence
    google.maps.event.addListener(this.map, 'longpress', function (e) {
		onAddGeofence(geofenceCursor.getPosition());
		geofenceCursor.setMap(null);
    });
	
	
	/**
	* Add geofence click-handler
	*/
	var onAddGeofence = function (latLng) {
		var geofenceRecord = {
			latitude: latLng.lat(),
			longitude: latLng.lng(),
			identifier: '',
			radius: 200,
			notifyOnEntry: true,
			notifyOnExit: false
		};
		console.log('geofenceRecord', geofenceRecord);
	};
	// Stop the side bar from dragging when mousedown/tapdown on the map
	google.maps.event.addDomListener($('#map_canvas')[0], 'mousedown', function (e) {
		//e.preventDefault();
		return false;
	});
}

MapManager.prototype.setCurrentLocationMarker = function (location) {
	var self = this;
	var currentLocation = location;
	var coords = {
		longitude: location.longitude,
		latitude: location.latitude
	}

	if (!this.currentLocationMarker) {
		this.currentLocationMarker = new google.maps.Marker({
			map: self.map,
			zIndex: 10,
			title: 'Current Location',
			icon: {
				path: google.maps.SymbolPath.CIRCLE,
				scale: 12,
				fillColor: '#2677FF',
				fillOpacity: 1,
				strokeColor: '#ffffff',
				strokeOpacity: 1,
				strokeWeight: 6
			}
		});

		this.locationAccuracyMarker = new google.maps.Circle({
			zIndex: 9,
			fillColor: '#3366cc',
			fillOpacity: 0.4,
			strokeOpacity: 0,
			map: self.map
		});
	}


    if (!this.path) {
		this.path = new google.maps.Polyline({
			zIndex: 1,
			map: self.map,
			geodesic: true,
			strokeColor: '#2677FF',
			strokeOpacity: 0.7,
			strokeWeight: 5
		});
    }
    var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);

    if (this.previousLocation) {
		var prevLocation = this.previousLocation;
		// Drop a breadcrumb of where we've been.
		this.locationMarkers.push(new google.maps.Marker({
			zIndex: 1,
			icon: {
				path: google.maps.SymbolPath.CIRCLE,
				scale: 7,
				fillColor: '#11b700',//'26cc77',
				fillOpacity: 1,
				strokeColor: '#0d6104',
				strokeWeight: 1,
				strokeOpacity: 0.7
			},
			map: self.map,
			position: new google.maps.LatLng(prevLocation.latitude, prevLocation.longitude)
		}));
    }

    // Update our current position marker and accuracy bubble.
    this.currentLocationMarker.setPosition(latlng);
    this.locationAccuracyMarker.setCenter(latlng);
	//TODO: What is a mean accuracy?
    // this.locationAccuracyMarker.setRadius(location.coords.accuracy);

    // Add breadcrumb to current Polyline path.
    this.path.getPath().push(latlng);
    this.previousLocation = location;
	this.currentLocationMarker.setMap(this.map);

	return latlng;
}

MapManager.prototype.getMap = function() {
	return this.map;
}

var mapManager = new MapManager();

$(function () {

	$('#btn-fetchLocations').click(function (e) {
		$.get("http://localhost:8080/locations", {})
			.done(function (response) {
				console.log('response data:', response);
				var polylineCoordinates = _(response).map(function(e) {
					console.log(e);
					return mapManager.setCurrentLocationMarker(e);
				})

				var polyline = new google.maps.Polyline({
					path: polylineCoordinates,
					strokeColor: '#FF0000',
					strokeOpacity: 1.0,
					strokeWeight: 2,
					editable: true
				});
				var map = mapManager.getMap();
				map.setCenter(polylineCoordinates[0]);
				polyline.setMap(map);
			});
	})

});

/**
 * 
 * initialize
 * */


if (document.readyState === "complete") {
	mapManager.initialize();
} else {
	google.maps.event.addDomListener(window, 'load', function () { mapManager.initialize(); });
}