
var gMap = require("./gmap");
var helpers = require("./helpers");
var map;

// this array will contain all the polygons that may be drawn on this
// google map
var currentPolygons = [];

// load the maps module - it will add the google maps script to the body
// and bring us to the callback here
gMap.load(function () {

	//Let's say the init location of the map was San Diego
	var initLocation = {
		lat: 32.7157
		, lng: -117.1611
	}
	
	//let's init our map object and draw something
	//in the DOM element with id 'map'
	map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14
        , center: initLocation
        , mapTypeId: 'terrain'
    });
	
	//Our UI elements
	var button = document.getElementById("btnDo");
    var textBox = document.getElementById("txtData");
	var loader = document.getElementById("progLoader");
    
	/// 1 - Button clicked
	/// This triggers everything
	button.onclick = function () {
		
		//let's validate what the user's entered
        var entered = textBox.value.trim();			//get rid of all spaces
		var lstZipCodes = entered.split(',');		//split by commas
						
		if(helpers.validateZips(lstZipCodes)){
			
			//show the progress loader
			loader.show();
			
			//all the entered zips are valid. Let's do our thing now...
			//GET the /zipcode? route in our local server
			//once the request completes, handle the response
			var url = "/zipcode?" + lstZipCodes.join("&");
			helpers.httpGetAsync(url,handleResponse,1000);
		}
		else{
			alert("Dude! You need to enter valid zips. Don't be messing around now.");
		}
	}
	
	/// 2 - handle response of GET call
	/// Server's responded, process the response
	var handleResponse = function(req){
		loader.hide();
		if(req.status == 200){
			
			//if the request was executed successfully, get the response
			//parse the response, turn it into a json object
			var thesePolygons = [];
			var response = JSON.parse(req.responseText);
			var polygon = helpers.convertCoordStringToPolygon(response.coords[0]);
			var latCenter = response.meta.latCenter;
			var lngCenter = response.meta.lngCenter;
			
			//pan the map to the center coordinates
			map.panTo(new google.maps.LatLng(latCenter, lngCenter));
			
			//draw these polygons. Timeout used to allow the map to pan smoothly
			//before being interrupted by the draw call
			thesePolygons.push(polygon);
			setTimeout(function(){
				drawPolygonsOnMap(thesePolygons,latCenter,lngCenter)
			},100);
		}
		else alert("We tried to ask the server, but something went wrong!");
	}
	
	/// 3 - draw the polygons on the map
	/// Draw the polygons
	var drawPolygonsOnMap = function (polygons,latCenter,lngCenter){
		
		if(!google.maps) throw "Google Maps API not loaded!";
				
		//clear the existing polygons (if any are drawn on the map)
		currentPolygons.forEach(function(polyToClear){
			if(polyToClear instanceof google.maps.Polygon){
				polyToClear.setMap(null);
			}
		});
		
		//now let currentPolygons point to the ones we need to draw
		currentPolygons = polygons;
		currentPolygons.forEach(function(polyToDraw){
			polyToDraw.setMap(map);
		});
	}	
});


