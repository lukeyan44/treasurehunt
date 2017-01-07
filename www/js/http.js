var _globalConfig = {
	deviceLoc: null,
	sid: null
};

function httpInit(){
	var watchId = navigator.geolocation.watchPosition(function(position){
		//showAlert("loc: "+position.coords.latitude+", "+position.coords.longitude);
		_globalConfig.deviceLoc = position.coords;
	}, function(){
		//showAlert("Failed to retrieve location");
	}, {timeout: 30000});
}

function getCurrentLocation(){
	return (_globalConfig.deviceLoc == null) ? false : new plugin.google.maps.LatLng(_globalConfig.deviceLoc.latitude, _globalConfig.deviceLoc.longitude);
}

function currentSid(_sid){
	if(_sid){
		_globalConfig.sid = _sid;
	}
	
	return _globalConfig.sid;
}

function post(func, data, callbacks, slient){
	data._r_ = new Date().getTime();
	data._sid_ = currentSid();
	
	$.ajax({
		url: ENV.endpoint + func,
		type: 'POST',
		data: data,
		beforeSend: function(){
			if(!slient){
				showLoader();
			}
		},
		complete: function(){
			if(!slient){
				hideLoader();
			}
		},
		error: function(){
			showAlert('Failed to send request to server');
		},
		success: function(data){
			var jsondata = jQuery.parseJSON(data);
			if(jsondata && jsondata.data){
				if(callbacks && callbacks.success){
					callbacks.success(jsondata.data);
				}
			}else{
				if(callbacks && callbacks.fail){
					if(jsondata && jsondata.message){
						showAlert(jsondata.message);
					}
				}
			}
		},
		
	});
}

function showLoader() { 
    $.mobile.loading('show', {  
        text: 'Loading...', //加载器中显示的文字  
        textVisible: true, //是否显示文字  
        theme: 'b',        //加载器主题样式a-e  
        textonly: false,   //是否只显示文字  
        html: ""           //要显示的html内容，如图片等  
    });  
}  
  
function hideLoader(){  
    $.mobile.loading('hide');  
}  

function showAlert(text, callback){
	alert(text);
	
	if (callback) {
		callback();
	}
/*
	var popupDialogId = 'popupDialog';
	$('<div data-role="popup" id="' + popupDialogId + '" data-confirmed="no" data-transition="pop" data-overlay-theme="b" data-theme="b" data-dismissible="false" style="max-width:500px;min-width:300px;"> \
						<div data-role="header" data-theme="a">\
							<h1>Message</h1>\
						</div>\
						<div role="main" class="ui-content">\
							<h3 class="ui-title">' + text + '</h3>\
							<div class="center"><a href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b optionConfirm" data-rel="back">OK</a></div>\
						</div>\
					</div>')
		.appendTo($.mobile.pageContainer);
	var popupDialogObj = $('#' + popupDialogId);
	popupDialogObj.trigger('create');
	popupDialogObj.popup({
		afterclose: function (event, ui) {
			popupDialogObj.find(".optionConfirm").first().off('click');
			var isConfirmed = popupDialogObj.attr('data-confirmed') === 'yes' ? true : false;
			$(event.target).remove();
			if (isConfirmed && callback) {
				callback();
			}
		}
	});
	popupDialogObj.popup('open');
	popupDialogObj.find(".optionConfirm").first().on('click', function () {
		popupDialogObj.attr('data-confirmed', 'yes');
	});
	*/
}