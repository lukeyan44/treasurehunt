var loginPane = {
	
	checkedLocationRef: null,

	initLogin: function(){
		var last = window.localStorage.getItem('last_login_game');
		
		if(last){
			$('#login-last-btn').show();
		}
	},
	
	login: function(){
		
		var self = this;
	
	
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
		
		/*
		if(isAndroid6()){
			cordova.plugins.diagnostic.isCameraAuthorized(function(authorized){
				if(authorized){
					self.loginImpl();
				}else{
					alert("You need to permit the app to use the camera");
				}
			}, function(error){
				alert("Error when checking camera: " + error);
			});
		}else if(isAndroid()){
			this.loginImpl();
		}*/

		this.loginImpl();
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
				var code = text.substring(pos + 1);
		
				var apppos = code.indexOf('|');
				ENV.appPath = code.substring(0, apppos)
				code = code.substring(apppos + 1);
		
				post('login', {logincode: code}, {
					success: function(data){
						currentSid(data.sid);
						
						window.localStorage.setItem('last_login_game', text);
						gotoPane('map', {team: data.team});
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