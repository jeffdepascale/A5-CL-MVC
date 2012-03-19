
a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLMVCBase')
	.Class('LocationManager', 'singleton final', function(self, im){
	
		var mappings;
		var filters;
		var hash
		
		this.LocationManager = function(){
			self.superclass(this);
			mappings = a5.cl.mvc.core.Mappings.instance();
			filters = a5.cl.mvc.core.Filters.instance();
			hash = self.plugins().HashManager();
		}	
		
		this._renderError = function(type, info){
			self.cl().dispatchEvent(im.CLEvent.APPLICATION_ERROR, {errorType:type, info:info});	
			var msg;
			switch (type) {
				case 404:
					msg = 'Resource not found: "' + (info.toString().length ? info.toString() : '/') + '"';
					break;
				case 500:
					if(!info._a5_initialized)
						info = self.create(a5.Error, [info]);
					msg = info.toString();
					break;
				default:
					msg = 'Error loading resource.';
					break;
			}
			var errorSig = mappings.getErrorSignature(type);
			if (errorSig) {
				errorSig.id = [msg, info];
				self.redirect(errorSig);
			} else {	
				self.MVC().application()._cl_renderError(type, msg, info);
			}
		}
		
		this.Override.redirect = function(params, info, forceRedirect){	
			var foundPath = true;
			var type = typeof params;
			if (type == 'string' && params.indexOf('://') != -1) {
				params = { url: params };
				type = 'object';
			}
			if(params instanceof Array) hash.setHash(params, false, forceRedirect);
			if(params.hash != undefined) hash.setHash(params.hash, false, forceRedirect);
			else if(type == 'string') hash.setHash(params, false, forceRedirect);
			else if(type == 'number') self._renderError(params, info);
			else if(params.url) window.location = params.url;
			else foundPath = false;
			if (!foundPath) {
				if (params.forceHash != undefined) hash.setHash(params.forceHash, true);
				if (params.controller != undefined) 
					this.processMapping(params);
			}
		}
		
		this.processMapping = function(param){
			var lastSig = mappings.geLastCallSignature();
			if (Object.prototype.toString.call(param) === '[object Array]') {
				var callSig = mappings.getCallSignature(param);
				if (callSig) {
					filters.test(callSig, lastSig, function(valid){
						if (valid) {
							self.dispatchEvent('CONTROLLER_CHANGE', {
								controller: callSig.controller,
								action: callSig.action,
								id: callSig.id
							});
						}
					})
				} else {
					var path = "";
					for (var i = 0, l = param.length; i < l; i++) 
						path += param[i] + (i < (l - 1) ? '/' : '');
					self._renderError(404, path)
				}
			} else {
				filters.test(param, lastSig, function(valid){
					if (valid) {
						self.dispatchEvent('CONTROLLER_CHANGE', {
							controller: param.controller,
							action: param.action,
							id: param.id
						});
					}
				})
			}
		}
})