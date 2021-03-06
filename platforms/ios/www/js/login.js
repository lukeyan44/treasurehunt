var loginPane = {
	
	checkedLocationRef: null,

	initLogin: function(){
		//window.localStorage.setItem('last_login_game', 'login:mobile14|1688|1035|');
		
		var last = window.localStorage.getItem('last_login_game');
		
		if(last){
			$('#login-last-btn').show();
		}
	},
	
	login: function(){
		
		initAdvGeoLocation();
		
		var self = this;
	/*
		if(this.checkedLocationRef != null){
			alert("Your location is not idientyfied yet please start the app again in 10 seconds.");
			
			return;
		}else{
			var loc = getCurrentLocation();
			if(!loc){
				alert("Your location is not idientyfied yet please start the app again in 10 seconds.");
				
				this.checkedLocationRef = setInterval(function(){
					var _loc = getCurrentLocation();
					if(_loc != false){
						clearInterval(this.checkedLocationRef);
						this.checkedLocationRef = null;
						
						alert("Your location has been detected. Please click \"Login\" to start the game");
					}
				}, 1000);
				
				return;
			}
		}
		*/
		
		if(isAndroid6()){
			cordova.plugins.diagnostic.isCameraAuthorized(function(authorized){
				if(authorized){
					self.loginImpl();
				}else{
					cordova.plugins.diagnostic.requestCameraAuthorization(function(){
						self.loginImpl();
					}, function(){
						alert("You need to permit the app to use the camera");
					});
				}
			}, function(error){
				alert("Error when checking camera: " + error);
			});
		}else if(isAndroid()){
			this.loginImpl();
		}

		//this.loginImpl();
		
		//this.loginImplMockup();
	},
	
	loginPassword: function(){
		var user = $("#login_name").val();
		var pass = $("#login_pass").val();
		
		if(!user){
			alert("Please input username");
			return;
		}
		
		if(!pass){
			alert("Please input password");
			return;
		}
		
		post('login', {user: user, pass: pass}, {
			success: function(data){
				currentSid(data.sid);
				
				gotoPane('map', {team: data.team});
			}
		});
	},
	
	loginLastGame: function(){
		var last = window.localStorage.getItem('last_login_game');
		this.loginWithCode(last);
	},
	
	loginImpl: function(){
		var self = this;
		cordova.plugins.barcodeScanner.scan(function(result){
			if(result.cancelled == false && result.text){
				self.loginWithCode(result.text);
			}
		}, function(error){
			alert("Scanning failed: " + error);
		});
	},
	
	loginWithCode: function(text){
		var pos = text.indexOf(':');
		if(pos > 0){
			var action = text.substring(0, pos);
			if(action == 'login'){
				var filename = text.replace(':', '_').replace('\|', '_').replace('\|', '_').replace('\|', '_')+'.teammapping';
				
				var code = text.substring(pos + 1);
				var apppos = code.indexOf('|');
				ENV.appPath = code.substring(0, apppos)
				
				var loginServer = function(){
					code = code.substring(apppos + 1);
			
					post('login', {logincode: code}, {
						success: function(data){
							currentSid(data.sid);
							putFileContent(filename, data.team.nid);
							putFileContent("teamcache-"+data.team.nid+".dat", JSON.stringify(data.team));
							
							window.localStorage.setItem('last_login_game', text);
							
							gotoPane('map', {team: data.team});
						}
					});
				}
				
				getFileContent(filename, function(result, data){
					
					if(result){
						var cacheFilename = "teamcache-"+data+".dat";
						
						getFileContent(cacheFilename, function(cacheResult, cacheData){
							if(cacheResult){
								gotoPane('map', {team: JSON.parse(cacheData)});
							}else{
								loginServer();
							}
						});
					}else{
						// not logined
						loginServer();
					}
					
				});
			}
		}
	},
	
	loginImplMockup: function(){
		var code = "948|514|1234";
	
		post('login', {logincode: code}, {
			success: function(data){
				currentSid(data.sid);
				
				gotoPane('map', {team: data.team});
			}
		});
	}
};

appPanes.panes['login'] = loginPane;

// =============================================================================================
// ============================================= map.js ========================================
// =============================================================================================

var map = null;
var targetZoom = 12;
var currentTeam = null;

var timerCounterRef = null;

var userLocMarker = null;
var overlay = false;

var infowindow = null;

var curPunishmentTime = 0;
var punishmentTimeCounterRef = null;

var goalPoint = {goal: true, 
				 lat: 0 , 
				 lng: 0,
				 window1: '',
				 window2: ''};

var onloadLoc = null;

var curMapType = 'ROADMAP';

appPanes.panes['map'] = {

	initMap: function(param){
			currentTeam = param.team;
			
			if(!currentTeam.data){
				currentTeam.data = {cacheVersion: 1};
			}
			
			checkLocalCacheFile(currentTeam.nid, function(){
				// for test
				// currentTeam.currentQuestion = 0;
				
				goalPoint.lat = currentTeam.goal_latitude;
				goalPoint.lng = currentTeam.goal_longitude;
				
				//alert(goalPoint.lat+","+goalPoint.lng);
				
				goalPoint.window1 = currentTeam.theme_goaltext;
				currentTeam.questions.push(goalPoint);
				
				if(currentTeam.event_status == 'Stop'){
					$("#map-info").removeClass('theme_story_board').html("<h2>The event has been stopped</h2>");
				}else if(currentTeam.played && parseFloat(currentTeam.played) > 0){
					$("#map-info").removeClass('theme_story_board').html("<h2>You have finished it</h2>");
				}else{
					//initGoogleMap();
					
					if(currentTeam.cached){
						mapButtonAction.start();
					}else{
						$("#map-info").height($(window).height() - $("#map-button-next").height());
						
						var html_text = '';
						$("#map-info").addClass('theme_story_board');
						if(currentTeam.event_text || currentTeam.event_image){
							$("#map-info").addClass('theme_story_board-firststep');
						
							if(currentTeam.event_image){
								html_text += '<p><img src="'+currentTeam.event_image+'"></p>';
							}
							if(currentTeam.event_text){
								html_text += '<p class="bigger-text">'+currentTeam.event_text+'</p>';
							}
						}else{
							html_text += currentTeam.theme_story_board;
						}
						
						$("#map-info").html(html_text);
						$("#map-button-next").show();
						toggleMapActoin(true);
					}

				}
			});
			
		},
};

$(window).resize(function(){
	if($("#map-info").hasClass('theme_story_board')){
		$("#map-info").height($(window).height() - $("#map-button-next").height());
	}
	
	if($("#map_canvas").length > 0){
		$("#map_canvas").height($(window).height());
	}
	
	if($(".popuptext").length > 0){
		$(".popuptext").height($(window).height());
		$(".popuptext").width($(window).width());
	}
});

function checkLocalCacheFile(nid, callback){
	var filename = "teamcache-"+nid+".dat";
	getFileContent(filename, function(result, data){
		//alert('afterasd: '+data);
		if(result){
			var tmpTeam = JSON.parse(data);
			//alert(currentTeam.data.cacheVersion +','+tmpTeam.data.cacheVersion);
			if(currentTeam.data.cacheVersion < tmpTeam.data.cacheVersion){
				currentTeam = tmpTeam;
			}
			
			callback.apply();
		}else{
			//alert("Failed to load: " + data);
			callback.apply();
		}
		
	});
}

function toggleMapActoin(bol){
	var h = $(window).height();
	var padding = 60;
	if(bol){
		$("#map_canvas").height(h - padding);
	}else{
		$("#map_canvas").height(h);
	}
}

function switchMapType(link){
	if(curMapType == 'ROADMAP'){
		curMapType = 'SATELLITE';
	}else{
		curMapType = 'ROADMAP';
	}
	
	map.setMapTypeId(plugin.google.maps.MapTypeId[curMapType]);
	
	$(link).html(getMapTypeLinkText(curMapType));
}

function getMapTypeLinkText(_type){
	switch(_type){
		case 'ROADMAP':
			return 'View Satellite';
		case 'SATELLITE':
			return 'View Road';
	}
	
	return '';
}

function initGoogleMap(_lat, _lng, bool){
	
	if(_lat && _lng){
		onloadLoc = {lat: _lat, lng: _lng};
	}
	
	var h = $(window).height();
	var logouthtml = '<div class="toplink-wrapper"><a href="#abouttext" onclick="openPopupText(this); return false;">About grapevine treasure hunt app</a> | <a href="#" class="logout-link" onclick="logoutMap(); return false;">Logout</a></div>';
	var buttomHtml = '<div class="bottom-wrapper"><a href="#" onclick="switchMapType(this);return false;">'+getMapTypeLinkText(curMapType)+'</a></div>';
	$("#map-wrapper").html("<div id='map_canvas' style='height:"+h+"px;'><div id='popupPane'></div>"+logouthtml + buttomHtml+"</div>");
	var div = document.getElementById("map_canvas");
	
	map = plugin.google.maps.Map.getMap(div, {
		styles: [
			{
				featureType: "poi.business",
				elementType: "labels",
				stylers: [{ visibility: "off"}]
			}
		]
	});
	
	map.on(plugin.google.maps.event.MAP_READY, onMapReady);
	
	initAdvGeoLocation();
}

var advGeolocation = {};

function initAdvGeoLocation(){
	AdvancedGeolocation.start(function(success){
	
			try{
				var jsonObject = JSON.parse(success);
				
				var params = null;
				
				switch(jsonObject.provider){
					case "gps":
						//params = {type: 'P', lat: jsonObject.latitude, lng: jsonObject.longitude, color: '00FF00'};
						
						resetLocation({latitude: jsonObject.latitude, longitude: jsonObject.longitude});
						
						break;

					case "network":
						//params = {type: 'N', lat: jsonObject.latitude, lng: jsonObject.longitude, color: '0000FF'};
						break;

					case "satellite":
						break;
						
					case "cell_info":
						//params = {type: 'C', lat: jsonObject.latitude, lng: jsonObject.longitude, color: '005566'};
						break;
						
					case "cell_location":
						//params = {type: 'L', lat: jsonObject.latitude, lng: jsonObject.longitude, color: 'BB0066'};
						break;  
					
					case "signal_strength":
						//TODO
						break;              	
				}
				
				/*
				if(params){
				  if(advGeolocation[params.type]){
				    advGeolocation[params.type].marker.setPosition(new plugin.google.maps.LatLng(params.lat, params.lng));
				  }else{
					advGeolocation[params.type] = params;
					
					(function(_params){
					
						map.addMarker({
							position: {lat: _params.lat, lng: _params.lng},
							icon: 'http://chart.googleapis.com/chart?chst=d_map_pin_letter&chld='+_params.type+'|'+params.color+'|000000',
						}, function(marker){
							advGeolocation[_params.type].marker = marker;
						});
					})(params);
				  }
				}
				*/
			}
			catch(exc){
				console.log("Invalid JSON: " + exc);
			}
		},
		function(error){
			console.log("ERROR! " + JSON.stringify(error));
		},
		////////////////////////////////////////////
		//
		// REQUIRED:
		// These are required Configuration options!
		// See API Reference for additional details.
		//
		////////////////////////////////////////////
		{
			"minTime":300,         // Min time interval between updates (ms)
			"minDistance":1,       // Min distance between updates (meters)
			"noWarn":true,         // Native location provider warnings
			"providers":"all",     // Return GPS, NETWORK and CELL locations
			"useCache":true,       // Return GPS and NETWORK cached locations
			"satelliteData":false, // Return of GPS satellite info
			"buffer":false,        // Buffer location data
			"bufferSize":0,        // Max elements in buffer
			"signalStrength":false // Return cell signal strength data
		});
}

function openPopupText(link){
	overlay = true;
	
	var text = $($(link).attr("href")).html();
	var token = new Date().getTime();

	var html = '<div id="w'+token+'" class="popuptext" style="width:'+$(window).width()+'px;height:'+$(window).height()+'px;"><div class="popuptext-inner" style="margin-left:10px;margin-right:10px;">';
	html += text;
	html += '<button class="ui-shadow ui-btn ui-corner-all" onclick="closePopupText();">Close</button>';
	html += '</div></div>';

	$("#popupPane").html("");
	$("#popupPane").append(html);
}

function closePopupText(){
	overlay = false;
	$(".popuptext").remove();
}

var mapButtonAction = {
	next: function(){
		if($("#map-info").hasClass('theme_story_board-firststep')){
			$("#map-info").removeClass('theme_story_board-firststep');
			
			var html_text = currentTeam.theme_story_board;
			$("#map-info").html(html_text);
		}else{
			$("#map-button-next").hide();
			$("#map-button-start").show();
			$("#map-timer").hide();
			$("#timerCounter").html("00:00:00");
		}
	
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
	/*
	setInterval(function(){
		map.getMyLocation(function(location) {
		  resetLocation({latitude: location.latLng.lat, longitude: location.latLng.lng});
		});
	}, 10000);
	*/
	
	map.setZoom(targetZoom);
	
	if(onloadLoc){
		map.setCenter(new plugin.google.maps.LatLng(onloadLoc.lat, onloadLoc.lng));
	}else{
		var curloc = getCurrentLocation();
		if(curloc){
			map.setCenter(curloc);
		}
	}
	
	map.setMapTypeId(plugin.google.maps.MapTypeId[curMapType]);

	if(currentTeam.currentQuestion < 0){
		startQuestion(0);
	}else{
		startQuestion(currentTeam.currentQuestion);
		
		setTimeout(function(){
			for(var i = 0; i< currentTeam.currentQuestion; i++){
				var q = currentTeam.questions[i];
				var label = q.goal ? 'X' : (q.index+1);
				
				(function(_q, _label){
					map.addMarker({
						position: {lat: _q.lat, lng: _q.lng},
						question: _q,
						icon: 'http://chart.googleapis.com/chart?chst=d_map_pin_letter&chld='+_label+'|FF0000|000000',
					}, function(marker){
						_q.marker = marker;
					});
				})(q, label);
			}
		}, 500);
	}
	
	traceInterval = setInterval(function(){
		// TODO
		// map.setCenter(getCurrentLocation());
		var loc = getCurrentLocation();
		if(loc){
			updateLoc(loc.lat, loc.lng);
		}
	}, 1000);
}

function onClickQuestion(e){
	//alert('onClickQuestion: '+currentTeam.currentQuestion);

	var q = currentTeam.questions[currentTeam.currentQuestion];
	
	var currentTime = Math.floor(new Date().getTime()/1000);
	
	if(q.goal){
		clearInterval(timerCounterRef);
		timerCounterRef = null;
		
		$("#postForm").html("");
		
		var html = '<form action="#" method="post"><input type="hidden" name="start" value="'+currentTeam.startTime+'">';
		html += '<input type="hidden" name="end" value="'+currentTime+'">';
		html += '<input type="hidden" name="goal" value="1">';
		html += '<input type="hidden" name="event_nid" value="'+currentTeam.event_nid+'">';
		for(var i=0; i<currentTeam.questions.length-1; i++){
			var temp = currentTeam.questions[i];
			html += '<input type="hidden" name="q['+temp.index+'][index]" value="'+temp.index+'">';
			html += '<input type="hidden" name="q['+temp.index+'][nid]" value="'+temp.nid+'">';
			html += '<input type="hidden" name="q['+temp.index+'][startTime]" value="'+temp.startTime+'">';
			html += '<input type="hidden" name="q['+temp.index+'][endTime]" value="'+temp.endTime+'">';
			html += '<input type="hidden" name="q['+temp.index+'][answerIndex]" value="'+temp.answerIndex+'">';
			html += '<input type="hidden" name="q['+temp.index+'][correct]" value="'+((temp.answerIndex == temp.field_correct_answer) ? 1 : 0)+'">';
			html += '<input type="hidden" name="q['+temp.index+'][retried]" value="'+temp.retried+'">';
		}
		html += '<input type="hidden" name="goaltext" class="goaltext-hidden" value="">';
		html += '</form>';
		
		$("#postForm").append(html);
		$("input.goaltext-hidden").val(currentTeam.goal_text);
		var str = $("#postForm form").serialize();
		//alert('post['+currentTeam.nid+']: '+str);
		$.post(ENV.getBaseurl()+"/post-answer/"+currentTeam.nid, str, function(data){
			$("#goaltext-span").html(data);
			
			uploadCache(true);
		});
		
		showGoalWindow(q);
		
	}else{
		
		if(infowindow){
			infowindow.close();
			infowindow = null;
		}
		
		showQuestionWindow(q);
		
		$("#postForm").html("");
		
		var html = '<form action="#" method="post"><input type="hidden" name="start" value="'+currentTeam.startTime+'">';
		html += '<input type="hidden" name="end" value="'+currentTime+'">';
		html += '<input type="hidden" name="goal" value="0">';
		html += '<input type="hidden" name="event_nid" value="'+currentTeam.event_nid+'">';
		for(var i=0; i<currentTeam.questions.length-1; i++){
			var temp = currentTeam.questions[i];
			html += '<input type="hidden" name="q['+temp.index+'][index]" value="'+temp.index+'">';
			html += '<input type="hidden" name="q['+temp.index+'][nid]" value="'+temp.nid+'">';
			html += '<input type="hidden" name="q['+temp.index+'][startTime]" value="'+temp.startTime+'">';
			html += '<input type="hidden" name="q['+temp.index+'][endTime]" value="'+temp.endTime+'">';
			html += '<input type="hidden" name="q['+temp.index+'][answerIndex]" value="'+temp.answerIndex+'">';
			html += '<input type="hidden" name="q['+temp.index+'][correct]" value="'+((temp.answerIndex == temp.field_correct_answer) ? 1 : 0)+'">';
			html += '<input type="hidden" name="q['+temp.index+'][retried]" value="'+temp.retried+'">';
		}
		html += '</form>';
		
		$("#postForm").append(html);
		
		var str = $("#postForm form").serialize();
		$.post(ENV.getBaseurl()+"/post-answer/"+currentTeam.nid, str, function(){
			uploadCache(true);
		});
	}

}

function showGoalWindow(q){
	overlay = true;
	
	var token = new Date().getTime();

	var html = '<div id="w'+token+'" class="popuptext" style="width:'+$(window).width()+'px;height:'+$(window).height()+'px;"><div class="popuptext-inner" style="margin-left:10px;margin-right:10px;">';
	/*
	if(currentTeam.apiversion && currentTeam.apiversion == 2){
		html += '<span id="goaltext-span">Loading...</span>';
	}else{
		if(currentTeam.goal_text){
			html += '<p class="bigger-text">'+currentTeam.goal_text+'</p>';
		}
		
		html += q.window1 ? q.window1 : '';
	}
	*/
	
	html += '<span id="goaltext-span">Loading...</span>';
	
	html += '</div></div>';

	$("#popupPane").html("");
	$("#popupPane").append(html);
}

function showQuestionWindow(q){
	overlay = true;
	//$("body").css("overflow", "hidden");

	var token = new Date().getTime();

	var html = '<div id="w'+token+'" class="popuptext" style="width:'+$(window).width()+'px;height:'+($(window).height())+'px;"><div class="popuptext-inner" style="margin-left:10px;margin-right:10px;">';
	html += q.window1 ? q.window1 : '';
	html += '<br/><h3 class="mapqtitle">'+q.title+'</h3><ol class="mapanswers">';
	for(var i in q.answers){
		html += '<li><label><input type="radio" name="answer" class="option" value="'+i+'"> '+q.answers[i]+"</label></li>";
	}
	html += '</ol><input type="button" value="Submit" onclick="onSelectAnswerOpts();">';
	html += q.window2 ? q.window2 : '';
	html += '</div></div>';
	
	$("#popupPane").append(html);
}

function onSelectAnswerOpts(){
	$(".popuptext .option").each(function(){
		if(this.checked){
			onSelectAnswer(this.value);
		}
	});
}

function onSelectAnswer(answerIndex){
	var q = currentTeam.questions[currentTeam.currentQuestion];
	
	q.endTime = Math.floor(new Date().getTime()/1000);
	q.answerIndex = answerIndex;
	
	var label = q.goal ? 'G' : (q.index+1);
	
	if(!q.marker){
		//alert('Missing question marker['+currentTeam.currentQuestion+']');
	}else{
		q.marker.setIcon('http://chart.googleapis.com/chart?chst=d_map_pin_letter&chld='+label+'|FF0000|000000');
		//q.marker.setCursor('default');
		try{
			q.marker.removeEventListener(plugin.google.maps.event.MARKER_CLICK, onClickQuestion);
		}catch(e){}
	}
	

	
	if(infowindow){
		infowindow.close();
		infowindow = null;
	}
	
	if(!q.retried){
		q.retried = 0;
	}
	q.retried++;
	q.retriedTime = new Date();
	
	if(q.answerIndex == q.field_correct_answer){
		overlay = false;
		//$("body").css("overflow", "auto");
		//$.fn.fancybox.close();
		$(".popuptext").remove();
		var next = startQuestion(q.index+1);
	}else{
	
		if(currentTeam.apiversion == '2'){
			var html = "<br/><br/><h3>Wrong answer. You now have to wait "+currentTeam.punishmentTime+" seconds before you can reply again.</h3><br/>";
			html += '<div class="delay-wrapper"><div id="delayblock" style="display:none;"></div><div id="delayblock-text" style="text-align:center;"></div></div>';
			
			$(".popuptext .popuptext-inner").html(html);
			
			curPunishmentTime = 0;
			punishmentTimeCounterRef = setInterval(checkPunishmentTime2, 1000);
		}else{
			$(".popuptext").remove();
			var next = startQuestion(q.index+1);
		}
	}
}

function checkPunishmentTime2(){
	curPunishmentTime++;
	$("#delayblock-text").html((currentTeam.punishmentTime-curPunishmentTime));
	
	if(curPunishmentTime >= currentTeam.punishmentTime){
		clearInterval(punishmentTimeCounterRef);
		punishmentTimeCounterRef = null;
		
		overlay = false;
		var q = currentTeam.questions[currentTeam.currentQuestion];
		$(".popuptext").remove();
		
		showQuestionWindow(q);
	}
}

function updateLoc(lat, lng){

	//lat = 59.3427786858;
	//lng = 18.0730147;

	var q = currentTeam.questions[currentTeam.currentQuestion];

	//lat = q.lat;
	//lng = q.lng;
	
	var distance = GetDistance(lat, lng, q.lat, q.lng);

	var label = q.goal ? 'X' : (q.index+1);
	if(currentTeam.closeDistance < distance){
		if(q.marker){
			// blue
			q.marker.setIcon({url: 'http://chart.googleapis.com/chart?chst=d_map_pin_letter&chld='+label+'|027AC6|000000'});
			//q.marker.setCursor('default');
			
			try{
				q.marker.removeEventListener(plugin.google.maps.event.MARKER_CLICK, onClickQuestion);
			}catch(e){}
		}

	}else{
		if(q.marker){
			// green
			q.marker.setIcon({url: 'http://chart.googleapis.com/chart?chst=d_map_pin_letter&chld='+label+'|669999|000000'});
			//q.marker.setCursor('pointer');
			
			try{
				q.marker.removeEventListener(plugin.google.maps.event.MARKER_CLICK, onClickQuestion);
			}catch(e){}
			q.marker.addEventListener(plugin.google.maps.event.MARKER_CLICK, onClickQuestion);
		}
	}
	
	if(map){
		if(!userLocMarker){
			userLocMarker = map.addMarker({
				position: {lat: lat, lng: lng},
			}, function(marker){
				userLocMarker = marker;
			});
		}else{
			userLocMarker.setPosition(new plugin.google.maps.LatLng(lat, lng));
		}
	}
	
	map.setCenter(new plugin.google.maps.LatLng(lat, lng));
}

function startQuestion(index){
	var q = currentTeam.questions[index];
	if(!q){
		return false;
	}
	
	q.startTime = q.startTime ? q.startTime : Math.floor(new Date().getTime()/1000);
	
	currentTeam.currentQuestion = index;
	var label = q.goal ? 'X' : (q.index+1);
	
	(function(_q, _label){
		map.addMarker({
			position: {lat: _q.lat, lng: _q.lng},
			question: _q,
			icon: 'http://chart.googleapis.com/chart?chst=d_map_pin_letter&chld='+_label+'|027AC6|000000',
		}, function(marker){
			//_q.marker = marker;
			currentTeam.questions[currentTeam.currentQuestion].marker = marker;
		});
	})(q, label);
	
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
	setInterval(function(){
		uploadCache(true);
	}, 10000);

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

var  EARTH_RADIUS = 6378.137*1000;//����뾶
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

function uploadCache(uploadServer){
	currentTeam.data.cacheVersion++;

	var filename = "teamcache-"+currentTeam.nid+".dat";
	putFileContent(filename, JSON.stringify(currentTeam));
		
	if(uploadServer){
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
				answerIndex: currentTeam.questions[i].answerIndex,
				retried: currentTeam.questions[i].retried ? currentTeam.questions[i].retried : 0,
				retriedTime: currentTeam.questions[i].retriedTime
			});
		}

		post('updatecache/'+currentTeam.nid, {
			timerCounterStart: currentTeam.timerCounterStart,
			timerCounterTime: currentTeam.timerCounterTime,
			startTime: currentTeam.startTime,
			currentQuestion: currentTeam.currentQuestion,
			questions: JSON.stringify(questionsClone),
			data: currentTeam.data
		}, null, true);
	}
	
}

