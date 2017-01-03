var loginPane = {
	login: function(){
		
		var code = '948|514|1234';
		
		post('login', {logincode: code}, {
			success: function(data){
				currentSid(data.sid);
				
				gotoPane('map', {team: data.team});
			}
		});
	}
};