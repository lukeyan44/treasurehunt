var map = null;
var targetZoom = 12;
var currentTeam = null;

var timerCounterRef = null;

var userLocMarker = null;
var overlay = false;

var goalPoint = {goal: true, 
				 lat: 0 , 
				 lng: 0,
				 window1: '',
				 window2: ''};

var onloadLoc = null;

appPanes.panes['map'] = {

	initMap: function(param){
			currentTeam = param.team;
			
			goalPoint.lat = currentTeam.goal_latitude;
			goalPoint.lng = currentTeam.goal_longitude;
			goalPoint.window1 = currentTeam.theme_goaltext;
			currentTeam.questions.push(goalPoint);
			
			if(currentTeam.event_status == 'Stop'){
				$("#map-info").html("<h2>The event has been stopped</h2>");
			}else if(currentTeam.played){
				$("#map-info").html("<h2>You have finished it</h2>");
			}else{
				//initGoogleMap();
				$("#map-info").html(currentTeam.theme_story_board);
				$("#map-button-next").show();
				toggleMapActoin(true);
			}
			
			
		},
};

function toggleMapActoin(bol){
	var h = $(window).height();
	var padding = 60;
	if(bol){
		$("#map_canvas").height(h - padding);
	}else{
		$("#map_canvas").height(h);
	}
}

function initGoogleMap(_lat, _lng, bool){
	
	if(_lat && _lng){
		onloadLoc = {lat: _lat, lng: _lng};
	}
	
	var h = $(window).height();
	$("#map-wrapper").html("<div id='map_canvas' style='height:"+h+"px;'>&nbsp;</div>");
	var div = document.getElementById("map_canvas");
	
	map = plugin.google.maps.Map.getMap(div);
	
	map.on(plugin.google.maps.event.MAP_READY, onMapReady);
	
}

var mapButtonAction = {
	next: function(){
		$("#map-button-next").hide();
		$("#map-button-start").show();
		$("#map-timer").hide();
		$("#timerCounter").html("00:00:00");
	},
	start: function(){
		$("#map-info").hide();
		$("#map-button-next").hide();
		$("#map-button-start").hide();
		$("#map-timer").show();
		
		toggleMapActoin(false);
		startGame();
	}
};

var traceInterval = null;

function onMapReady(){
	//showAlert('onMapReady');
	
	traceInterval = setInterval(function(){
		//map.setCenter(getCurrentLocation());
	}, 5000);
	
	map.setZoom(targetZoom);
	
	if(onloadLoc){
		map.setCenter(new plugin.google.maps.LatLng(onloadLoc.lat, onloadLoc.lng));
	}else{
		map.setCenter(getCurrentLocation());
	}
	
	map.setMapTypeId(plugin.google.maps.MapTypeId.ROADMAP);

	if(currentTeam.currentQuestion < 0){
		startQuestion(0);
	}else{
		for(var i = 0; i< currentTeam.currentQuestion; i++){
			var q = currentTeam.questions[i];
			var label = q.goal ? 'X' : (q.index+1);
			
			map.addMarker({
				position: {lat: q.lat, lng: q.lng},
				question: q,
				icon: 'http://chart.googleapis.com/chart?chst=d_map_pin_letter&chld='+label+'|FF0000|000000',
			});
		}
		
		startQuestion(currentTeam.currentQuestion);
	}
	
	
	// Add a maker
	/*
	map.addMarker({
	  position: {lat: 37.422359, lng: -122.084344},
	  title: "Welecome to \n" +
			 "Cordova GoogleMaps plugin for iOS and Android",
	  snippet: "This plugin is awesome!"
	}, function(marker) {

	  // Show the info window
	  marker.showInfoWindow();

	  // Catch the click event
	  marker.on(plugin.google.maps.event.INFO_CLICK, function() {

		// To do something...
		alert("Hello world!");

	  });
	});
	*/
}

function startQuestion(index){
	var q = currentTeam.questions[index];
	if(!q){
		return false;
	}
	
	q.startTime = q.startTime ? q.startTime : Math.floor(new Date().getTime()/1000);
	
	currentTeam.currentQuestion = index;
	var label = q.goal ? 'X' : (q.index+1);
	
	map.addMarker({
		position: {lat: q.lat, lng: q.lng},
		question: q,
		icon: 'http://chart.googleapis.com/chart?chst=d_map_pin_letter&chld='+label+'|027AC6|000000',
	});
	
	map.setCenter(new plugin.google.maps.LatLng(q.lat, q.lng));
	return true;
}

function timerCounter(){
	var now = new Date().getTime();
	var diff = (now - currentTeam.timerCounterStart)/1000;
	//console.log(diff);
	var hour = Math.floor(diff/3600);
	hourText = (hour > 9) ? ''+hour : '0'+hour;
	var min = Math.floor((diff - 3600*hour)/60);
	minText = (min > 9) ? ''+min : '0'+min;
	var sec = Math.floor(diff - 3600*hour - 60*min);
	secText = (sec > 9) ? ''+sec : '0'+sec;
	$("#timerCounter").html(hourText+":"+minText+":"+secText);
	
	currentTeam.timerCounterTime = Math.floor(diff);
}

function startGame(){
	setInterval(uploadCache, 10000);

	currentTeam.startTime = currentTeam.startTime ? currentTeam.startTime : Math.floor(new Date().getTime()/1000);

	//$("#buttonDiv").css("display", "none");
	//$("#mapDiv").css("display", "block");

	var defaultLoc = { lat: currentTeam.user_latitude, lng: currentTeam.user_longitude};
	
	initGoogleMap(defaultLoc.lat, defaultLoc.lng, false);

	currentTeam.timerCounterStart = currentTeam.timerCounterStart ? currentTeam.timerCounterStart : new Date().getTime();
	$("#timerCounter").html("00:00:00");
	timerCounterRef = setInterval(timerCounter, 1000);
	
	post("startgame/"+currentTeam.nid, {start: Math.floor(new Date().getTime()/1000)}, null, true);
	

}

var  EARTH_RADIUS = 6378.137*1000;//µØÇò°ë¾¶
function rad(d){
   return d * Math.PI / 180.0;
} 

function GetDistance(lat1, lng1, lat2, lng2)
{
   var radLat1 = rad(lat1);
   var radLat2 = rad(lat2);
   var a = radLat1 - radLat2;
   var b = rad(lng1) - rad(lng2);

   var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) +
    Math.cos(radLat1)*Math.cos(radLat2)*Math.pow(Math.sin(b/2),2)));
   s = s * EARTH_RADIUS;
   s = Math.round(s * 10000) / 10000;
   return s;
}

function uploadCache(){
	var questionsClone = [];
	for(var i=0; i<currentTeam.questions.length-1; i++){
		questionsClone.push({
			answers: currentTeam.questions[i].answers,
			field_correct_answer: currentTeam.questions[i].field_correct_answer,
			goal: currentTeam.questions[i].goal,
			index: currentTeam.questions[i].index,
			lat: currentTeam.questions[i].lat,
			lng: currentTeam.questions[i].lng,
			nid: currentTeam.questions[i].nid,
			startTime: currentTeam.questions[i].startTime,
			title: currentTeam.questions[i].title,
			endTime: currentTeam.questions[i].endTime,
			window1: currentTeam.questions[i].window1 ? currentTeam.questions[i].window1 : '',
			window2: currentTeam.questions[i].window2 ? currentTeam.questions[i].window2 : '',
			answerIndex: currentTeam.questions[i].answerIndex
		});
	}

	post('updatecache/'+currentTeam.nid, {
		timerCounterStart: currentTeam.timerCounterStart,
		timerCounterTime: currentTeam.timerCounterTime,
		startTime: currentTeam.startTime,
		currentQuestion: currentTeam.currentQuestion,
		questions: JSON.stringify(questionsClone)
	}, null, true);
}

