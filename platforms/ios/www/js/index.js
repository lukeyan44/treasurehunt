/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var map = null;
 
var app = {
	
	panes: {},
	
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
		
		httpInit();
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
		
		gotoPane('login');
		
		cordova.plugins.diagnostic.isWifiAvailable(function(available){
			if(!available){
				// enable wifi, only work in android, no similar function in iOS
				// https://www.npmjs.com/package/cordova.plugins.diagnostic
				cordova.plugins.diagnostic.setWifiState(function(){
					// wifi has been enabled
					alert("WIFI access has been enabled");
				}, function(error){
					alert("Error when enable WIFI: " + error);
				}, true);
			}
		}, function(error){
			alert("Error when checking WIFI: " + error);
		});
		
		cordova.plugins.diagnostic.isLocationAvailable(function(available){
			//alert("Location: "+available);
			if(!available){
				alert("Please enable location service");
				
				if(isAndroid()){
					cordova.plugins.diagnostic.switchToLocationSettings();
				}
				
			}else{
				// for only android
				/*
				cordova.plugins.diagnostic.getLocationMode(function(locationMode){
					if(locationMode != 'DEVICE_ONLY' && locationMode != 'HIGH_ACCURACY'){
						// GPS not enabled
						alert("Please enable GPS service");
						cordova.plugins.diagnostic.switchToLocationSettings();
					}
				}, function(error){
					alert("Error when getLocationMode: " + error);
				});
				*/
			}
		}, function(error){
			alert("Error when checking Location Service: " + error);
		});
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
    },
};

function logoutMap(){
	if(confirm("Are you sure to logout?")){
		gotoPane('login');
	}
}
	
function gotoPane(paneId, param){
	$(".pane.show").removeClass('show');
	$("#"+paneId).addClass('show');
	
	if($("#"+paneId).attr('onInit')){
		appPanes.panes[paneId][$("#"+paneId).attr('onInit')].call(null, param);
	}
}

app.initialize();