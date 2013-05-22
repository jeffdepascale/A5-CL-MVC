
a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.CLEvent',
			'a5.cl.initializers.dom.Utils')
	.Extends('a5.cl.CLMVCBase')
	.Class('EnvManager', function(cls, im){
		
		var _scrollBarWidth,
			_windowProps = {},
			_forcedClientEnvironment,
			_clientEnvironment;
		
		cls.EnvManager = function(){
			cls.superclass(this);
			getScrollBarWidth();
			cls.cl().addEventListener(im.CLEvent.ORIENTATION_CHANGED, updateResize);
			cls.cl().addEventListener(im.CLEvent.WINDOW_RESIZED, updateResize);
			_forcedClientEnvironment = _clientEnvironment = cls.DOM().clientEnvironment();
			updateResize();
			im.Utils.addEventListener(window, "focus", function(e){ updateResize(); });
		}
		
		this.scrollBarWidth = function(){ return _scrollBarWidth; }
		this.windowProps = function(force){ 
			if (force) return updateResize(true);
			else return _windowProps;
		}
		
		
		var updateResize = function($directRequest){
			var directRequest = $directRequest === true ? true:false;
			var elem = null;
			if (document.documentElement && document.documentElement.clientHeight) elem = document.documentElement;
			else if (document.body && document.body.clientHeight) elem = document.body;
			if (elem) {
				_windowProps.height = elem.clientHeight;
				_windowProps.width = elem.clientWidth;
				_windowProps.scrollHeight = elem.scrollHeight;
				_windowProps.scrollWidth = elem.scrollWidth;
			} else if (typeof(window.innerHeight) == 'number') {
		        _windowProps.height = window.innerHeight;
				_windowProps.width = window.innerWidth;
				_windowProps.scrollHeight = window.innerHeight + window.scrollMaxY;
				_windowProps.scrollWidth = window.innerWidth + window.scrollMaxX;
		    }
			if(_windowProps.scrollHeight === 0) _windowProps.scrollHeight = _windowProps.height;
			if(_windowProps.scrollWidth === 0) _windowProps.scrollWidth = _windowProps.width;
			if(cls.DOM().pluginConfig().clientEnvironmentOverrides){
				if(_forcedClientEnvironment === "MOBILE" && _windowProps.width >= cls.MVC().pluginConfig().mobileWidthThreshold){
					_forcedClientEnvironment = _clientEnvironment;
					cls.cl().dispatchEvent(im.CLEvent.CLIENT_ENVIRONMENT_UPDATED, [_forcedClientEnvironment])
				} else if(_forcedClientEnvironment !== "MOBILE" && _windowProps.width < cls.MVC().pluginConfig().mobileWidthThreshold){
					_forcedClientEnvironment = "MOBILE";
					cls.cl().dispatchEvent(im.CLEvent.CLIENT_ENVIRONMENT_UPDATED, [_forcedClientEnvironment])
				}
			}
			if (directRequest) {
				return _windowProps;
			} else {
				cls.cl().MVC().redrawEngine().triggerAppRedraw(true);
			}
		}
		
		var getScrollBarWidth = function(){
		    var outer = null, inner = null, width = 0, scrollWidth = 0;	
		    outer = document.createElement('div');
		    outer.style.position = 'absolute';
		   	outer.style.left = outer.style.top = '-500px';
		    outer.style.height = outer.style.width = '100px';
		    outer.style.overflow = 'hidden';
		    inner = document.createElement('div');
		    inner.style.width = '100%';
		    inner.style.height = '500px';
		    outer.appendChild(inner);
		    document.getElementsByTagName('body')[0].appendChild(outer);
		    width = outer.clientWidth;
		    outer.style.overflow = 'scroll';
		    scrollWidth = outer.clientWidth;
		    document.getElementsByTagName('body')[0].removeChild(outer);
		    _scrollBarWidth = width - scrollWidth;
			outer = inner = null;
		}	
})