
a5.SetNamespace('a5.cl.mvc.core.AppSetup', {
	genericSetup:function(){
		a5.cl.instance().MVC().setTitle();	
	},
	desktopSetup:function(){
		if(a5.cl.instance().config().faviconPath){
			var headID = document.getElementsByTagName("head")[0],
			elem = document.createElement('link');
			elem.rel = "shortcut icon";
			elem.href= a5.cl.instance().config().faviconPath;
			elem.type = "image/x-icon";
			headID.appendChild(elem);
			elem = null;
		}
		if (a5.cl.instance().config().forceIE7) {
			var headID = document.getElementsByTagName("head")[0],
			elem = document.createElement('meta');
			elem.httpEquiv = "X-UA-Compatible";
			elem.content = 'IE=7';
			headID.appendChild(elem);
			elem = null;
		}
		this.genericSetup();
	},
	mobileSetup: function(){
		var headID = document.getElementsByTagName("head")[0],
		elem = document.createElement('meta');
		elem.name = "viewport";
		elem.content = "width=device-width, minimum-scale=1, maximum-scale=1";
		headID.appendChild(elem);
		this.genericSetup();
		elem = null;
	},
	tabletSetup: function(){
		this.mobileSetup();
	}
});
