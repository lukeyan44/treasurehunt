var loginPane = {
	
	checkedLocationRef: null,

	login: function(){
		
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

		
		cordova.plugins.barcodeScanner.scan(function(result){
			if(result.cancelled == false && result.text){
				
				var pos = result.text.indexOf(':');
				if(pos > 0){
					var action = result.text.substring(0, pos);
					if(action == 'login'){
						var code = result.text.substring(pos + 1);
				
						post('login', {logincode: code}, {
							success: function(data){
								currentSid(data.sid);
								
								gotoPane('map', {team: data.team});
							}
						});
					}
				}
			}
		}, function(error){
			alert("Scanning failed: " + error);
		});
	}
};