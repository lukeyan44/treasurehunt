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