var ENV = {
	baseurl: 'https://www.grapevine.nu/',
	appPath: '',
	version: '20170511'
};

ENV.getEndpoint = function(){
	return ENV.baseurl+ENV.appPath+'/api/';
}

ENV.getBaseurl = function(){
	return ENV.baseurl+ENV.appPath;
}

var appPanes = {
	panes: {}
};

function getFileContent(filename, callback){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {

		fs.root.getFile(filename, { create: false, exclusive: false }, function (fileEntry) {
			
			fileEntry.file(function(file){
				var reader = new FileReader();
				reader.onloadend = function(){
					var data = this.result;
					
					callback.apply(this, [true, data]);
				};
				
				reader.onerror = function(){
					//alert('read error');
				};
				
				reader.readAsText(file);
			});
			
		}, function(e){
			//alert('failed to get file: ' + e);
			callback.apply(this, [false, e]);
		});

	}, function(e){
		//alert('failed to load FS: ' + e);
		callback.apply(this, [false, e]);
	});
}

function putFileContent(filename, data, callback){
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {

		fs.root.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
			
			fileEntry.createWriter(function (fileWriter) {

				fileWriter.onwriteend = function() {
				};

				fileWriter.onerror = function (e) {
					//alert("Failed to file write: " + e.toString());
				};

				var dataObj = new Blob([data], { type: 'text/plain' });

				fileWriter.write(dataObj);
				
				if(callback){
					callbacka.apply(this, [true]);
				}
			});
			
		}, function(e){
			//alert('failed to create file: ' + e);
			
			if(callback){
				callbacka.apply(this, [false, e]);
			}
		});

	}, function(e){
		//alert('failed to load FS: ' + e);
		if(callback){
			callbacka.apply(this, [false, e]);
		}
	});
}

String.prototype.replaceAll = function(s1,s2){
	return this.replace(new RegExp(s1,"gm"),s2);
}