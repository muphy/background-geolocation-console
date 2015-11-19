function initialize() {
	var mapOptions = {
		center: new google.maps.LatLng(43.07493, -89.381388),
		zoom: 16,
		zoomControl: false,
		panControl: false,
		streetViewControl: false,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	var map = new google.maps.Map($('#map_canvas')[0], mapOptions);
	// Stop the side bar from dragging when mousedown/tapdown on the map
	google.maps.event.addDomListener($('#map_canvas')[0], 'mousedown', function (e) {
		//e.preventDefault();
		return false;
	});
}

if (document.readyState === "complete") {
	initialize();
} else {
	google.maps.event.addDomListener(window, 'load', initialize);
}