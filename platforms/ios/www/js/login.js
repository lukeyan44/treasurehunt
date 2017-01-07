var loginPane = {
	login: function(){
		
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