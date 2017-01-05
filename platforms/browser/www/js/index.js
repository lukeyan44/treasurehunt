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
				// enable wifi
				cordova.plugins.diagnostic.setWifiState(function(){
					// wifi has been enabled
				}, function(error){
					alert("Error when enable WIFI: " + error);
				}, true);
			}
		}, function(error){
			alert("Error when checking WIFI: " + error);
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
	
function gotoPane(paneId, param){
	$(".pane.show").removeClass('show');
	$("#"+paneId).addClass('show');
	
	if($("#"+paneId).attr('onInit')){
		appPanes.panes[paneId][$("#"+paneId).attr('onInit')].call(null, param);
	}
}

app.initialize();