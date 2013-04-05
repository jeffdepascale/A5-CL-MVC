//A5, Copyright (c) 2011, Jeff dePascale & Brian Sutliffe. http://www.jeffdepascale.com
(function( a5, undefined ) {
a5.Package('a5.cl')

	.Extends('a5.cl.CLBase')
	.Prototype('CLMVCBase', function(proto){
		
		proto.CLMVCBase = function(){
			proto.superclass(this);
		}
		
		/**
		 * Returns the name value of the class if known, else it returns the instanceUID value.
		 * @name mvcName
		 * @type String
		 */
		proto.mvcName = function(){
			return this._cl_mvcName || this.instanceUID();
		}

		proto.redirect = function(params, info, forceRedirect){
			this.MVC().redirect(params, info, forceRedirect);
		}
		
		proto._cl_setMVCName = function(name){
			this._cl_mvcName = name;
		}
		
})



a5.Package('a5.cl')

	.Extends('a5.Event')
	.Static(function(CLMVCEvent){
				
		/**
		 * @event
		 * @description Dispatched when the render() method is called on a mappable controller.
		 * @param {a5.cl.CLController} controller
		 */
		CLMVCEvent.RENDER_CONTROLLER = 'clMVCEventRenderController';
		
		/**
		 * @event
		 * @description Dispatched when the first controller is loaded.
		 * @param {a5.cl.CLController} controller
		 */
		CLMVCEvent.INITIAL_CONTROLLER_LOADED = 'clMVCEventControllerLoaded';
		
		CLMVCEvent.PRIMARY_CONTROLLER_WILL_CHANGE = 'clMVCEventPrimaryControllerWillChange';
		
		CLMVCEvent.PRIMARY_CONTROLLER_CHANGED = 'clMVCEventPrimaryControllerChanged';
		/**
		 * @event
		 * @description Dispatched by CLViews when they are added to a parent view.  This event is useful for detecting when children are added to a specific branch of the view tree.
		 */
		CLMVCEvent.ADDED_TO_PARENT = 'clMVCEventAddedToParent';
		
		/**
		 * @event
		 * @description Dispatched by CLViews when they are added to a parent view.  This event is useful for detecting when children are added to a specific branch of the view tree.
		 */
		CLMVCEvent.REMOVED_FROM_PARENT = 'clMVCEventRemovedFromParent';
		
	})
	.Class('CLMVCEvent', function(cls, im){
		
		cls.CLMVCEvent = function(){
			cls.superclass(this);
		}	
})


a5.Package('a5.cl.mvc')

	.Extends('a5.Attribute')
	.Class('InferRenderAttribute', function(cls){
		
		cls.InferRenderAttribute = function(){
			cls.superclass(this);
		}
		
		cls.Override.methodPre = function(typeRules, args, scope, method, callback, callOriginator){
			var name = method.getName(),
				cls = name.substr(0, 1).toUpperCase() + name.substr(1) + 'Controller';
			var clr = typeRules[0].im[cls].instance(true);
			clr.index.apply(clr, args);
			scope.render(clr);
			return a5.Attribute.SUCCESS;
		}
		
	})


/**
 * @class 
 * @name a5.cl.mvc.CLViewEvent
 */
a5.Package('a5.cl.mvc')

	.Extends('a5.Event')
	.Static(function(CLViewEvent){
		
		CLViewEvent.VIEW_READY = 'clViewReady';
	})
	.Prototype('CLViewEvent', function(proto){
		
		proto.CLViewEvent = function(){
			proto.superclass(this);
		}	
});


/**
 * @class 
 * @name a5.cl.mvc.CLViewContainerEvent
 */
a5.Package('a5.cl.mvc')

	.Extends('a5.Event')
	.Static(function(CLViewContainerEvent){
		
		CLViewContainerEvent.CHILDREN_READY = 'childrenReady';
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#LOADER_STATE_CHANGE
		 * @param {EventObject} e
		 * @param {String} e.state
		 * @description Dispatched when the loader state changes
		 */
		CLViewContainerEvent.LOADER_STATE_CHANGE = 'loaderStateChange';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#WILL_REMOVE_VIEW
		 * @param {EventObject} e
		 * @description Dispatched when a view is about to be removed from the view container.
		 */
		CLViewContainerEvent.WILL_REMOVE_VIEW = 'willRemoveView';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#WILL_ADD_VIEW
		 * @param {EventObject} e
		 * @description Dispatched when a view is about to be added to the view container.
		 */
		CLViewContainerEvent.WILL_ADD_VIEW = 'willAddView';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#VIEW_ADDED
		 * @param {EventObject} e
		 * @description Dispatched when a view has been successfully loaded to the view container. 
		 */
		CLViewContainerEvent.VIEW_ADDED = 'viewAdded';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#VIEW_REMOVED 
		 * @param {EventObject} e
		 * @description Dispatched when a view has been successfully removed from the view container. 
		 */
		CLViewContainerEvent.VIEW_REMOVED = 'viewRemoved';
	})
	.Prototype('CLViewContainerEvent', function(proto){
		
		proto.CLViewContainerEvent = function(){
			proto.superclass(this);
		}
		
	});


a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLMVCBase')
	.Class('RedrawEngine', 'singleton final', function(self, im){

		var appContainer, 
			pendingRedrawers = [],
			appRedrawForced = false,
			perfTester,
			attached,
			animFrameHook;
		
		this.RedrawEngine = function(){
			self.superclass(this);
			appContainer = self.cl().MVC().application().view();
			animFrameHook = a5.cl.initializers.dom.Utils.getVendorWindowMethod('requestAnimationFrame');
			self.cl().addEventListener(im.CLEvent.PLUGINS_LOADED, ePluginsLoaded);
		}
		
		var ePluginsLoaded = function(){
			self.cl().removeEventListener(im.CLEvent.PLUGINS_LOADED, ePluginsLoaded);
			if(self.cl().plugins().PerformanceTester)
				perfTester = self.cl().plugins().PerformanceTester().createTimer('redraw');
		}
	
		this.loaderWentIdle = function(target){
			pushRedrawTarget(target);
		}
		
		this.attemptRedraw = function($target){
			var target = $target || self;
			pushRedrawTarget(target);
		}
		
		this.triggerAppRedraw = function($force){
			appRedrawForced = $force || appRedrawForced;
			attachForAnimCycle();
		}
		
		var pushRedrawTarget = function(target){
			var shouldPush = true,
				i, l;
			for (i = 0, l = pendingRedrawers.length; i < l; i++) { 
				if (target == pendingRedrawers[i] || target.isChildOf(pendingRedrawers[i])) {
					shouldPush = false;
					break;
				}
			}
			if (shouldPush) {
				for(i = 0; i< pendingRedrawers.length; i++){	
					if (pendingRedrawers[i].isChildOf(target)) {
						pendingRedrawers.splice(i, 1);
						i--;
					}
				}
				target.addOneTimeEventListener(a5.Event.DESTROYED, eRedrawerDestroyedHandler);
				pendingRedrawers.push(target);
			}
			attachForAnimCycle();
		}
		
		var eRedrawerDestroyedHandler = function(e){
			var view = e.target();
			for(i = 0; i< pendingRedrawers.length; i++){	
				if (pendingRedrawers[i] == view) {
					pendingRedrawers.splice(i, 1);
					return;
				}
			}
		}
		
		var attachForAnimCycle = function(){
			if (!attached && (pendingRedrawers.length || appRedrawForced)) {
				attached = true;
				if (animFrameHook) animFrameHook(eRedrawCycle);
				else self.cl().addEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, eRedrawCycle);
			}
		}
		
		var eRedrawCycle = function(){
			if(!animFrameHook)
				self.cl().removeEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, eRedrawCycle);
			if(perfTester)
				perfTester.startTest();
			var force = appRedrawForced;
			appRedrawForced = false;
			if (force) {
				appContainer._cl_redraw(force);
				pendingRedrawers = [];		
			} else {
				while(pendingRedrawers.length){
					var targ = pendingRedrawers.shift();
					targ._cl_redraw(false);
				}
			}
			if (perfTester)
				perfTester.completeTest();
			attached = false;
		}

});


a5.SetNamespace('a5.cl.mvc.core.AppSetup', {
	genericSetup:function(){
		a5.cl.Instance().MVC().setTitle();	
	},
	desktopSetup:function(){
		if(a5.cl.Instance().MVC().pluginConfig().faviconPath){
			var headID = document.getElementsByTagName("head")[0],
			elem = document.createElement('link');
			elem.rel = "shortcut icon";
			elem.href= a5.cl.Instance().MVC().pluginConfig().faviconPath;
			elem.type = "image/x-icon";
			headID.appendChild(elem);
			elem = null;
		}
		if (a5.cl.Instance().DOM().pluginConfig().forceIE7) {
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
						info = new a5.Error(info);
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

a5.Package('a5.cl.mvc.core')
	
	.Extends('a5.cl.CLViewContainer')
	.Class('WindowContainer', function(cls, im){
		
		cls.WindowContainer = function(){
			cls.superclass(this);
		}
		
});

a5.Package('a5.cl.mvc.core')
	
	.Extends('a5.cl.CLViewContainer')
	.Prototype('AppViewContainer', 'singleton final', function(proto, im){
		
		proto.AppViewContainer = function(){
			proto.superclass(this);
			this._cl_errorStopped = false;
			this._cl_systemWindowContainer = new im.WindowContainer();		
			this._cl_appWindowContainer = new im.WindowContainer();
			this._cl_appWindowLoadingContainer = new im.WindowContainer();
			this.showOverflow(true);
			this._cl_addedToTree();
		}
		
		proto.initialize = function(){
			proto.superclass().viewReady.apply(this, arguments);
			this._cl_systemWindowContainer.hide();
			this._cl_appWindowContainer.hide();
			this._cl_appWindowContainer.showOverflow(true);
			this.showOverflow(true);
		}
		
		proto.Override.addSubView = proto.Override.removeSubView = proto.Override.subViewToTop = proto.Override.subViewToBottom = 
		proto.Override.removeAllSubViews = proto.Override.removeViewAtIndex = proto.Override.replaceView = 
		proto.Override.replaceViewAtIndex = proto.Override.swapViewsAtIndex = proto.Override.addSubViewAtIndex = 
		proto.Override.addSubViewBelow = proto.Override.addSubViewAbove = function(){
			this.throwError('View manipulations on AppViewContainer must use addWindow and removeWindow methods only.')
		}
		
		proto.containsWindow = function(window){
			var app = this._cl_appWindowContainer.containsSubView(window)
			if(app) return true;
			return this._cl_systemWindowContainer.containsSubView(window)
		}
				
		proto.addWindow = function(window){
			if (!this._cl_errorStopped){
				if (window instanceof a5.cl.CLWindow) {
					var lev = a5.cl.CLWindowLevel,
						newWinLevel = window._cl_windowLevel;
					if (newWinLevel === lev.SYSTEM){
						var count = this._cl_systemWindowContainer.subViewCount();
						if(count > 0){
							if(this._cl_systemWindowContainer.subViewAtIndex(0).blocking())
								return this.throwError('system window blocking error');
							else
								this._cl_systemWindowContainer.replaceViewAtIndex(window, 0);
						} else {
								this._cl_systemWindowContainer.addSubView(window);
						}
						this._cl_systemWindowContainer.show();
					} else {
						var container = this._cl_appWindowContainer,
							index = 0,
							isReplace = false,
							modalIndex = null,
							contextIndex = null,
							alertIndex = null;
						if(container.containsSubView(window))
							container.removeSubView(window, false);
						for (var i = 0, l = container.subViewCount(); i < l; i++) {
							var checkedWin = container.subViewAtIndex(i);
							if (checkedWin._cl_windowLevel === newWinLevel && checkedWin._cl_windowLevel !== lev.APPLICATION) {
								index = i;
								isReplace = true;
								break;
							} else if(checkedWin._cl_windowLevel !== lev.SYSTEM) {
								switch(checkedWin._cl_windowLevel){
									case lev.APPLICATION:
										index = i+1;
										break;
									case lev.MODAL:
										modalIndex = i;
										break;
									case lev.CONTEXT:
										contextIndex = i;
										break;
									case lev.ALERT:
										alertIndex = i;
										break;
								}
							}
						}
						switch(newWinLevel){
							case lev.MODAL:
								if(modalIndex){
									index = modalIndex;
									replace = true;
								}
								break;
							case lev.CONTEXT:
								if(contextIndex){
									index = contextIndex;
									replace = true;
								} else {
									if(modalIndex)
										index = modalIndex +1;
								}
								break;
							case lev.ALERT:
								if(alertIndex){
									index = alertIndex;
									replace = true;
								} else {
									if(contextIndex)
										index = contextIndex +1;
									else if(modalIndex)
										index = modalIndex +1;
								}
								break;
						}
						if((newWinLevel === lev.APPLICATION || container.subViewCount() === 0) || !isReplace)
							this._cl_appWindowContainer.addSubViewAtIndex(window, index);
						else
							this._cl_appWindowContainer.replaceViewAtIndex(window, index);
					}
				} else {
					self.redirect(500, 'Application addSubView only accepts views that subclass a5.cl.CLWindow');
				}	
			}
		}

		proto.removeWindow = function(window, destroy){
			if (window) {
				if (this._cl_appWindowContainer.containsSubView(window)) {
					this._cl_appWindowContainer.removeSubView(window, destroy);
				} else if (this._cl_systemWindowContainer.containsSubView(window)) {
					this._cl_systemWindowContainer.removeSubView(window, destroy);
					this._cl_systemWindowContainer.hide();
				} else {
					this.throwError('Cannot remove window "' + window.instanceUID() + '", window is not currently a child of AppViewContainer.')
				} 
			}
		}
		
		proto._cl_initialRenderCompete = function(){
			this._cl_appWindowContainer.show();
			this.superclass().removeSubView.call(this, this._cl_appWindowLoadingContainer);
		}

		proto.Override.viewReady = function(){}
		
		proto.Override.width = function(value){
			return this.cl().MVC().envManager().windowProps().width;
		}
		
		proto.Override.height = function(value){
			return this.cl().MVC().envManager().windowProps().height;
		}
		
		proto.Override._cl_redraw = function(force){
			var sysWin = this._cl_systemWindowContainer.subViewAtIndex(0),
				offset = null;
			if (sysWin && sysWin.offsetsApplication() !== a5.cl.mvc.core.SystemWindow.OFFSET_NONE) {
				didRedrawSysWin = true;
				this._cl_systemWindowContainer.height(sysWin.height('value') === '100%' ? '100%':'auto');
				this._cl_systemWindowContainer._cl_redraw(force);
				offset = sysWin.height();
			} else {
				this._cl_systemWindowContainer._cl_redraw(force);
			}
			if (offset !== null) {
				var h = this.height() - this._cl_systemWindowContainer.height();
				if (sysWin.offsetsApplication() === a5.cl.mvc.core.SystemWindow.OFFSET_TOP) {
					this._cl_appWindowContainer.y(offset).height(h);
					this._cl_systemWindowContainer.y(0);
				} else {
					this._cl_appWindowContainer.y(0).height(h);
					var f = this.height() - offset;
					this._cl_systemWindowContainer.y(this.height() - offset);
					this._cl_systemWindowContainer._cl_redraw(force);
				}
			}
			this._cl_appWindowContainer._cl_redraw(force);
		}
		
		proto.Override.redraw = function(){
			this.cl().MVC().redrawEngine().attemptRedraw(this);
		}
		
		proto.Override.draw = function(){
			var body = document.getElementsByTagName("body")[0];
			body.style.margin = body.style.padding = 0;
			body.style.overflow = 'hidden';
			proto.superclass().draw.call(this);
			this._cl_viewElement.style.width = this._cl_viewElement.style.height = "100%";
			this._cl_width.percent = this._cl_height.percent = 1;
			this._cl_width.value = this._cl_height.value = '100%';
			body.appendChild(this._cl_viewElement);
			this._cl_viewElement.style.display = 'block';
			proto.superclass().addSubView.call(this, this._cl_appWindowContainer);
			proto.superclass().addSubView.call(this, this._cl_appWindowLoadingContainer);
			proto.superclass().addSubView.call(this, this._cl_systemWindowContainer);
		}
	
});


a5.Package('a5.cl.mvc.core')

	.Extends('a5.cl.CLWindow')
	.Static(function(SystemWindow){
		SystemWindow.OFFSET_TOP = 'systemWindowOffsetTop';
		SystemWindow.OFFSET_BOTTOM = 'systemWindowOffsetBottom';
		SystemWindow.OFFSET_NONE = 'systemWindowOffsetNone';
	})
	.Prototype('SystemWindow', function(proto, im, SystemWindow){

		this.Properties(function(){
			this._cl_blocking = false;
			this._cl_offsetsApplication = SystemWindow.OFFSET_NONE;
		})
		
		proto.SystemWindow = function(){
			proto.superclass(this);
			this._cl_windowLevel = a5.cl.CLWindowLevel.SYSTEM;
		}	
		
		proto.showWindow = function(){
			this.cl().application().view().addWindow(this);
		}
		
		proto.blocking = function(value){
			if(value !== undefined){
				this._cl_blocking = value;
				return this;
			}
			return this._cl_blocking;
		}
		
		proto.offsetsApplication = function(value){
			if(value !== undefined){
				this._cl_offsetsApplication = value;
				return;
			}
			return this._cl_offsetsApplication;
		}
});


/**
 * @class Base class for UI classes in the AirFrame CL framework.
 * @name a5.cl.CLView
 * @extends a5.cl.CLBase
 */
a5.Package("a5.cl")
	
	.Import('a5.cl.CLEvent',
			'a5.cl.mvc.CLViewEvent')
	.Extends('CLMVCBase')
	.Static(function(CLView, im){
		
		CLView.customViewDefNodes = ['EventListener', 'Bind'];
		
		CLView._cl_calcOffsetObj = function(obj, calcProp, props){
			var i, l, isObj, propVal,
				changed = false,
				cachedProp = obj[calcProp];
			obj[calcProp] = {width:0, height:0, left:0, right:0, top:0, bottom:0};
			for(i = 0, l=props.length; i<l; i++){
				propVal = obj[props[i]];
				isObj = typeof propVal === 'object';
				obj[calcProp].left += (isObj ? (propVal.left !== undefined ? propVal.left:0):propVal);
				obj[calcProp].right += (isObj ? (propVal.right !== undefined ? propVal.right:0):propVal);
				obj[calcProp].top += (isObj ? (propVal.top !== undefined ? propVal.top:0):propVal);
				obj[calcProp].bottom += (isObj ? (propVal.bottom !== undefined ? propVal.bottom:0):propVal);
			}
			obj[calcProp].width = obj[calcProp].left + obj[calcProp].right;
			obj[calcProp].height = obj[calcProp].top + obj[calcProp].bottom;
			return (obj[calcProp].left !== cachedProp.left || obj[calcProp].right !== cachedProp.right || obj[calcProp].top !== cachedProp.top || obj[calcProp].bottom !== cachedProp.bottom);
		}
		
		CLView._cl_setWH = function(obj, prop, param){
			//if(param.isDefault && obj.parentView()['_cl_rel' + (prop === 'width') ? 'X' : 'Y'] === true)
				//return obj[prop]('scroll');
			if(param.percent !== false){
				var parentScrolling = obj._cl_parentView[prop === 'width' ? 'scrollXEnabled' : 'scrollYEnabled']('state'),
					parentSize = parentScrolling ? (obj._cl_parentView[prop]('scroll') - obj._cl_parentView._cl_calculatedClientOffset[prop] - obj._cl_parentView._cl_calculatedOffset[prop]) : obj._cl_parentView[prop]('inner');
				return parentSize * param.percent;
			} else if(param.relative !== false) 
				return obj._cl_parentView[prop]('inner') + param.relative;
			else if(param.auto !== false)
				return obj[prop]('content') + obj._cl_calculatedClientOffset[prop] + obj._cl_calculatedOffset[prop];
			else if(param.relative === false && param.percent === false && param.auto === false) 
				return param.value;
			else
				return null;
		}
		
		CLView._cl_updateWH = function(obj, val, prop, propVal, min, max, setProp){
			var fullOffset = obj._cl_calculatedOffset[prop] + obj._cl_calculatedClientOffset[prop],
				retVal = val - fullOffset,
				maxDim;
			if(obj._cl_parentView.constrainChildren() && obj._cl_parentView['_cl_' + prop].auto === false){
				maxDim = (retVal || obj[prop]('inner')) + propVal;
				if (maxDim > obj._cl_parentView[prop]('inner')) retVal = obj._cl_parentView[prop]('inner') - propVal - fullOffset;
			}
			if (min !== null && (retVal + obj._cl_calculatedClientOffset[prop]) < min) retVal = min - obj._cl_calculatedClientOffset[prop];
			if (max !== null && (retVal + obj._cl_calculatedClientOffset[prop]) > max) retVal = max - obj._cl_calculatedClientOffset[prop];
			retVal = (retVal >= 0 ? retVal : 0);
			setProp.client = setProp.inner = setProp.content = retVal;
			setProp.offset = retVal + fullOffset;
			return retVal;
		}
				
		CLView._cl_updateXY = function(obj, propVal, align, inner, param){
			var retVal = 0,
				clientOffset = obj._cl_parentView ? obj._cl_parentView._cl_calculatedClientOffset[param === 'width' ? 'left' : 'top'] : 0;
			switch (align) {
				case "left":
				case "top":
					retVal = propVal + clientOffset;
					break;
				case "center":
				case "middle":
					retVal = inner / 2 - obj[param]() / 2 + propVal + clientOffset;
					if(retVal < clientOffset) retVal = clientOffset;
					break;
				case "right":
				case "bottom":
					retVal = inner - obj[param]() + propVal + clientOffset;
					break;
			}
			return retVal;
		}
		
		CLView._cl_initialRedraw = function(obj){
			if (obj._cl_initialized && !obj._cl_initialRenderComplete) {
				obj._cl_initialRenderComplete = true;
				if(obj._cl_visible) obj._cl_viewElement.style.display = obj._cl_defaultDisplayStyle;
			}
		}
		
		CLView._cl_viewCanRedraw = function(view){
			var isValid = true;
			if(!view._cl_viewElement) isValid = false;
			if(!view._cl_parentView) isValid = false;
			if(!view.visible() && view._cl_initialRenderComplete) isValid = false;
			if(view.suspendRedraws()) isValid = false;
			if(!isValid)
				view._cl_redrawPending = false;
			return isValid;
		}
		
		CLView._cl_useTransforms = false;
		
		CLView._cl_forceGPU = false;
	})
	
	
	.Prototype('CLView', function(proto, im, CLView){
		/**#@+
	 	 * @memberOf a5.cl.CLView#
	 	 * @function
		 */	
		 
		this.Properties(function(){
			this._cl_viewElement = null;
			this._cl_viewElementType = 'div';
			this._cl_viewIsReady = false;
			this._cl_parentView = null;
			this._cl_showOverflow = false;
			this._cl_alignX = 'left';
			this._cl_alignY = 'top';
			this._cl_x = {value:0, state:false, percent:false};
			this._cl_y = {value:0, state:false, percent:false};
			this._cl_alpha = 1;
			this._cl_visible = true;
			this._cl_width = {client:0, offset:0, inner:0, value:'100%', percent:1, relative:false, auto:false, isDefault:true, content:0};
			this._cl_height = {client:0, offset:0, inner:0, value:'100%', percent:1, relative:false, auto:false, isDefault:true, content:0};
			this._cl_minWidth = null;
			this._cl_minHeight = null;
			this._cl_maxWidth = null;
			this._cl_maxHeight = null;
			this._cl_borderWidth = {top:0, left:0, right:0, bottom:0};
			this._cl_padding = {top:0, left:0, right:0, bottom:0};
			this._cl_calculatedOffset = {width:0, height:0, left:0, right:0, top:0, bottom:0};
			this._cl_calculatedClientOffset = {width:0, height:0, left:0, right:0, top:0, bottom:0};
			this._cl_redrawPending = false;
			this._cl_initialized = false;
			this._cl_initialRenderComplete = false;
			this._cl_id = null;
			this._cl_viewDefDefaults = {};
			this._cl_fromViewDef = false;
			this._cl_vdViewIsReady = false;
			this._cl_suspendRedraws = false;
			this._cl_suspendRedrawsDirect = false;
			this._cl_buildingFromViewDef = false;
			this._cl_pendingViewElementProps = {};
			this._cl_currentViewElementProps = {};
			this._cl_controller = null;
			this._cl_isInTree = false;
			this._cl_defaultDisplayStyle = 'block';
			
			this.skipViewDefReset = [];
		})
		
		proto.CLView = function(){
			proto.superclass(this);
			if(CLView._cl_transformProp === undefined)
				CLView._cl_transformProp = a5.cl.initializers.dom.Utils.getCSSProp('transform');
			this._cl_viewElement = document.createElement(this._cl_viewElementType);
			this._cl_viewElement.className = proto.className.call(this);
			this._cl_viewElement.style.backgroundColor = 'transparent';
			this._cl_viewElement.style.overflowX = this._cl_viewElement.style.overflowY = this._cl_showOverflow ? 'visible' : 'hidden';
			this._cl_viewElement.id =  proto.instanceUID.call(this);
			this._cl_viewElement.style.zoom = 1;
			this._cl_viewElement.style.position = 'absolute';
			this._cl_viewElement.style.display = 'none';
		}
		
		/**
		 * Creates the display element.
		 * @name draw
		 */
		proto.draw = function(parentView){
			if (!this._cl_initialized && !this._cl_initialRenderComplete) {
				this._cl_initialized = true;
				this._cl_setParent(parentView);
				this.redraw();
				this.viewReady();
			}
		}
		
		proto.id = function(value){ 
			var val =  this._cl_propGetSet('_cl_id', value, 'string');
			return val || this.instanceUID();
		}
		
		proto.addCSSClass = function(name){
			this._cl_viewElement.className += " " + name;
		}
		
		/**
		 * @name isChildOf
		 * @param {a5.cl.CLViewContainer} target
		 */
		proto.isChildOf = function(target){
			var parent = this._cl_parentView;
			while(parent){
				if(parent === target)
					return true;
				parent = parent._cl_parentView;
			}
			return false;
		}
		
		/**
		 * Set to true to disable redraws on this view (and its children) until suspendRedraws is set to false.
		 * @name suspendRedraws
		 * @param {Boolean} value
		 */
		proto.suspendRedraws = function(value, inherited){
			if (typeof value === 'boolean') {
				if(inherited !== true)
					this._cl_suspendRedrawsDirect = value;
				this._cl_suspendRedraws = value ? value : this._cl_suspendRedrawsDirect;
				if(!value)
					this.redraw();
				return this;
			}
			return this._cl_suspendRedraws;
		}
		
		/**
		 * @name index
		 */
		proto.index = function(){
			return parseInt(this._cl_viewElement.style.zIndex);
		}
		
		/**
		 * Called by the framework if data is passed to the view load.
		 * @name renderFromData
		 * @param {Object} data The data object.
		 */
		proto.renderFromData = function(data){}
		
		/**
		 * @name minWidth
		 * @param {Object} value
		 */
		proto.minWidth = function(value){ return this._cl_propGetSet('_cl_minWidth', value, 'number'); }
		
		/**
		 * @name minHeight
		 * @param {Object} value
		 */
		proto.minHeight = function(value){ return this._cl_propGetSet('_cl_minHeight', value, 'number'); }
		
		/**
		 * @name maxWidth
		 * @param {Object} value
		 */
		proto.maxWidth = function(value){ return this._cl_propGetSet('_cl_maxWidth', value, 'number'); }
		
		/**
		 * @name maxHeight
		 * @param {Object} value
		 */
		proto.maxHeight = function(value){ return this._cl_propGetSet('_cl_maxHeight', value, 'number'); }
		
		/**
		 * @name alignX
		 * @param {String} value
		 */
		proto.alignX = function(value){
			if (value !== undefined) {
				if(value === "left" || value === "center" || value === "right") {
					var shouldRedraw = (value !== this._cl_alignX);
					this._cl_alignX = value;
					if(shouldRedraw) this.redraw;
				}
				return this;
			}
			return this._cl_alignX;
		}
		
		/**
		 * @name alignY
		 * @param {String} value
		 */
		proto.alignY = function(value){
			if (value !== undefined) {
				if (value === "top" || value === "middle" || value === "bottom") {
					var shouldRedraw = (value !== this._cl_alignY);
					this._cl_alignY = value;
					if(shouldRedraw) this.redraw;
				}
				return this;
			}
			return this._cl_alignY;
		}
		
		/**
		 * @name y
		 * @param {Object} value
		 */
		proto.y = function(value, duration, ease){ 
			if (value !== undefined) {
				if (value === true) 
					return this._cl_y.state !== false && 
									this.parentView() && 
									this.parentView().relY() ? this._cl_y.state : this._cl_y.value;
				if(typeof duration === 'number' && typeof value === 'number')
					return this.animate(duration, {y:value, ease:ease});
				if (typeof value === 'object') {
					var retVal = this.y(true),
					parentView = this.parentView();
					while(parentView){
						if(!parentView)
							return null;
						if(parentView === value)
							return retVal;
						retVal += 	parentView.y(true) + 
									parentView.scrollY() + 
									parentView._cl_calculatedOffset.top + 
									parentView._cl_calculatedClientOffset.top;
						parentView = parentView.parentView();
					}					
				} else {
					var isPerc = typeof value === 'string' && value.indexOf('%') != -1;
					this._cl_y.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if (this._cl_y.percent > 1) this._cl_y.percent = 1;
					if (this._cl_y.percent < 0) this._cl_y.percent = 0;
					var shouldRedraw = value !== this._cl_y.value;
					this._cl_y.value = value;
					if (shouldRedraw) this.redraw();
					return this;
				}
			}
			return this._cl_y.value;
		}
		
		/**
		 * @name x
		 * @param {Object} value
		 */
		proto.x = function(value, duration, ease){ 
			if (value !== undefined) {
				if(value === true) 
					return this._cl_x.state !== false && 
									this.parentView() && 
									this.parentView().relX() ? this._cl_x.state : this._cl_x.value;
				if(typeof duration === 'number' && typeof value === 'number')
					return this.animate(duration, {x:value, ease:ease});
				if (typeof value === 'object') {
					var retVal = this.x(true),
					parentView = this.parentView();
					while(parentView){
						if(!parentView)
							return null;
						if(parentView === value)
							return retVal;
						retVal += 	parentView.x(true) + 
									parentView.scrollX() + 
									parentView._cl_calculatedOffset.left + 
									parentView._cl_calculatedClientOffset.left;
						parentView = parentView.parentView();
					}
				} else {
					var isPerc = typeof value === 'string' && value.indexOf('%') != -1;
					this._cl_x.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if (this._cl_x.percent > 1) this._cl_x.percent = 1;
					if (this._cl_x.percent < 0) this._cl_x.percent = 0;
					var shouldRedraw = value !== this._cl_x.value;
					this._cl_x.value = value;
					if(this._cl_x.state !== false && this.parentView() && this.parentView().relX())
						this._cl_x.state = value;
					if (shouldRedraw) this.redraw();
					return this;
				}
			}
			return this._cl_x.value;
		}
		
		/**
		 * @name rotation
		 * @param {Object} value
		 */
		proto.rotation = function(value){
			this._cl_css('transform', 'rotate(' + value + 'deg)', true);
		}
		
		proto.showOverflow = function(value){
			if(value){
				this._cl_viewElement.style.overflowX = this._cl_viewElement.style.overflowY = value === true ? 'visible' : 'hidden';
				this._cl_showOverflow = value;
				return this;
			}
			return this._cl_showOverflow;
		}
		
		/**
		 * @name background
		 * @param {Object} value
		 */
		proto.background = function(value){
			this._cl_viewElement.style.background = value;
			return this._cl_viewElement.style.background; 
		}
		
		/**
		 * @name backgroundColor
		 * @param {Object} value
		 * @param {Object} value2
		 * @param {Boolean} horizontalGradient
		 */
		proto.backgroundColor = function(value, value2, horizontalGradient){
			if(value) {
				this._cl_viewElement.style.backgroundColor = value;
				//if we're using filters, 
				if(this.DOM().clientPlatform() === "IE" || this.DOM().clientPlatform() === "WP7")
					this._cl_viewElement.style.filter = this._cl_viewElement.style.filter.replace(/progid:DXImageTransform\.Microsoft\.gradient\(.*?\)/gi, "");
				//if two valid hex colors were passed, use a gradient
				if(a5.cl.core.Utils.validateHexColor(value) && a5.cl.core.Utils.validateHexColor(value2)){
					if(this.DOM().clientPlatform() === "IE" || this.DOM().clientPlatform() === "WP7")
						this._cl_viewElement.style.filter += " progid:DXImageTransform.Microsoft.gradient(startColorstr='" + a5.cl.core.Utils.expandHexColor(value) + "', endColorstr='" + a5.cl.core.Utils.expandHexColor(value2) + "')";
					else {
						//try mozilla first
						this._cl_viewElement.style.background = "";
						this._cl_viewElement.style.background = "-moz-linear-gradient(" + (horizontalGradient === true ? 'left' : 'top') + ",  " + value + ",  " + value2 + ")";
						//if that didn't work, try the webkit version
					    if(this._cl_viewElement.style.background.indexOf('gradient') === -1)
					        this._cl_viewElement.style.background = "-webkit-gradient(linear, left top, " + (horizontalGradient === true ? 'right top' : 'left bottom') + ", from(" + value + "), to(" + value2 + "))";
					}
				} else {
					this._cl_viewElement.style.background = "";
					this._cl_viewElement.style.backgroundColor = value;
				}
				return this;
			}
			return this._cl_viewElement.style.backgroundColor;
		}
		
		/**
		 * @name alpha
		 * @param {Object} value
		 */
		proto.alpha = function(value, duration, ease){
			if(typeof value === 'number'){
				if(typeof duration === 'number')
					return this.animate(duration, {alpha:value, ease:ease});
				if (this.DOM().clientPlatform() == 'IE' && this.DOM().browserVersion() < 9) {
					this._cl_viewElement.style.filter = 
						this._cl_viewElement.style.filter.replace(/alpha\(.*?\)/gi, '') 
						+ ' alpha(opacity=' + (value * 100) + ')';
				} else 
					this._cl_viewElement.style.opacity = value + '';
				this._cl_alpha = value;
				return this;
			}
			return this._cl_alpha;
		}
		
		/**
		 * @name animate
		 * @param {Number} duration The duration of the animation, in seconds.
		 * @param {Object} props An object specifying the properties to animate, and the end-values as numbers.  Other special properties are also accepted, and are listed below.
		 * 
		 * @param {Number} [obj.delay] The length of time to delay before starting this animation (seconds).
		 * @param {Function|String} [obj.ease] The easing function.
		 * @param {Function} [obj.onStart] Function to be called when the animation starts.
		 * @param {Array} [obj.onStartParams] Parameters to be passed to onStart.
		 * @param {Function} [obj.onComplete] Function to be called when the animation completes.
		 * @param {Array} [obj.onCompleteParams] Parameters to be passed to onComplete
		 * @param {Object} [obj.startAt] An object specifying the start positions.
		 * @param {Boolean} [obj.redrawOnProgress=false] When set to true, the view will be redrawn at each step of the animation.  This allows the other views to react accordingly, but will generally be more processor-intensive, and may result in a choppier animation.
		 * @param {String} [obj.engine] The animation engine to use (specified by the process name, generally 'jsAnimation' or 'cssAnimation').  By default, the Animation addon will try to determine the best engine to use.
		 */
		proto.animate = function(duration, props){
			var plgn = this.plugins().getRegisteredProcess('animation');
			if (plgn) {
				plgn.animate(this, duration, props);
			} else {
				this.warn('No animation plugin was found.');
				for(var prop in props){
					if (typeof proto[prop] === 'function')
						proto[prop].call(this, props[prop]);
				}
			}
			return this;
		}
		
		/**
		 * @name easing
		 */
		proto.easing = function(){
			var plgn = this.plugins().getRegisteredProcess('animation');
			if(plgn) return plgn.easing.call(this);
			else return {};
		}
		
		/**
		 * Shortcut for setting all border attributes.  Parameters can be direct values to be applied to all borders, or an object specifying values for each border.
		 * @name border
		 * @param {Object|Number} width The value to set for borderWidth, or an object with values for top/right/bottom/left.
		 * @param {Object|String} style The value to set for borderStyle, or an object with values for top/right/bottom/left.
		 * @param {Object|String} color The value to set for borderColor, or an object with values for top/right/bottom/left.
		 * @param {Object|Number} radius The value to set for borderRadius, or an object with values for top/right/bottom/left.
		 */
		proto.border = function(width, style, color, radius){
			if(width !== undefined || style !== undefined || color !== undefined || radius !== undefined) {
				this.borderWidth(width || 0);
				this.borderStyle(style || 'solid');
				this.borderColor(color || '#000');
				this.borderRadius(radius || 0);
				return this;
			}
			return this._cl_viewElement.style.border;
		}
		
		/**
		 * Get or set the border width.
		 * @name borderWidth
		 * @param {Object|Number} width The value to set for borderWidth, or an object with values for top/right/bottom/left.
		 */
		proto.borderWidth = function(width, duration, ease){
			if(width !== undefined){
				if (typeof width === 'number') {
					if(typeof duration === 'number')
						return this.animate(duration, {borderWidth:width, ease:ease});
					this._cl_viewElement.style.borderWidth = width + 'px';
				} else {
					for (var prop in width)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Width'] = (width[prop] || 0) + 'px';
				}
				this._cl_borderWidth = width;
				this._cl_calculateOffset();
				return this;
			}
			return this._cl_viewElement.style.borderWidth;
		}
		
		/**
		 * Get or set the border style.
		 * @name borderStyle
		 * @param {Object|String} width The value to set for borderStyle, or an object with values for top/right/bottom/left.
		 */
		proto.borderStyle = function(style){
			if(style !== undefined){
				if (typeof style === 'string') {
					this._cl_viewElement.style.borderStyle = style;
				} else {
					for (var prop in style)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Style'] = style[prop] || 'solid';
				}
				return this;
			}
			return this._cl_viewElement.style.borderStyle;
		}
		
		/**
		 * Get or set the border color.
		 * @name borderColor
		 * @param {Object|String} width The value to set for borderColor, or an object with values for top/right/bottom/left.
		 */
		proto.borderColor = function(color){
			if(color !== undefined){
				if (typeof color === 'string') {
					this._cl_viewElement.style.borderColor = color;
				} else {
					for (var prop in color)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Color'] = color[prop] || '#000';
				}
				return this;
			}
			return this._cl_viewElement.style.borderColor;
		}
		
		/**
		 * Get or set the border radius.
		 * @name borderRadius
		 * @param {Object|Number} width The value to set for borderRadius, or an object with values for top/right/bottom/left.
		 */
		proto.borderRadius = function(radius, duration, ease){
			if(radius !== undefined){
				if (typeof radius === 'number') {
					if(typeof duration === 'number')
						return this.animate(duration, {borderRadius:radius, ease:ease});
					this._cl_viewElement.style[a5.cl.initializers.dom.Utils.getCSSProp('borderRadius')] = radius + 'px';
				} else {
					for (var prop in radius)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Radius'] = (radius[prop] || 0) + 'px';
				}
				return this;
			}
			return this._cl_viewElement.style.borderRadius;
		}
		
		/**
		 * @name padding
		 * @param {Object} value
		 */
		proto.padding = function(value, duration, ease){
			if (value !== undefined) {
				if(typeof duration === 'number')
					return this.animate(duration, {padding:value, ease:ease});
				this._cl_padding = value;
				this._cl_calculateOffset();
				return this;
			}
			return this._cl_padding;
		}
		
		/**
		 * @name tooltip
		 * @param {Object} value
		 */
		proto.tooltip = function(value){
			if(typeof value === 'string'){
				this._cl_viewElement.title = value;
				return this;
			}
			return this._cl_viewElement.title;
		}
		
		/**
		 * @name viewReady
		 */
		proto.viewReady = function(){
			this._cl_viewIsReady = true;
			this.dispatchEvent(new im.CLViewEvent(im.CLViewEvent.VIEW_READY));
		}
		
		proto.viewIsReady = function(){
			return this._cl_viewIsReady;
		}
		
		/**
		 * @name moveToParentView
		 * @param {a5.cl.CLViewContainer} view
		 */
		proto.moveToParentView = function(view){
			this.removeFromParentView();
			this._cl_clParentView = null;
			view.addSubView(this);
		}
		
		/**
		 * @name removeFromPaentView
		 */
		proto.removeFromParentView = function($shouldDestroy){
			if (this._cl_parentView) this._cl_parentView.removeSubView(this, $shouldDestroy);
		}
		
		/**
		 * Called when the view element is added to a parent view.
		 * @name addedToParent
		 * @param {a5.cl.CLViewContainer} parentView The parent view it is being added to.
		 */
		proto.addedToParent = function(parentView){
			
		}
		
		/**
		 * Called when the view element has been removed from a parent view.
		 * @name removedFromParent
		 * @param {a5.cl.CLViewContainer} parentView The parent view it is being removed from.
		 */	
		proto.removedFromParent = function(parentView){
			
		}
		
		/**
		 * Sets the view to be invisible.
		 * @name hide
		 */
		proto.hide = function(){
			this._cl_viewElement.style.display = 'none';
			this._cl_visible = false;
			if(this.parentView())
				this.parentView()._cl_redraw();
		}
		
		/**
		 * Sets the view to be visible.
		 * @name show
		 */
		proto.show = function(){
			this._cl_viewElement.style.display = this._cl_defaultDisplayStyle;
			this._cl_visible = true;
			if(this.parentView())
				this.parentView()._cl_redraw();
		}
		
		/**
		 * Gets or sets the visibiity state of the view.
		 * @name visible
		 * @param value {Boolean} Whether or not the view should be visible.
		 * @return {Boolean}
		 */
		proto.visible = function(value){
			if(typeof value === 'boolean'){
				if(value)
					this.show();
				else
					this.hide();
				return this;
			}
			return this._cl_visible;
		}
		
		/**
		 * @name parentView
		 */
		proto.parentView = function(){
			return this._cl_parentView;
		}
		
		/**
		 * @name toTop
		 */
		proto.toTop = function(){
			this.parentView().subViewToTop(this);
		}
		
		/**
		 * @name toBottom
		 */
		proto.toBottom = function(){
			this.parentView().subViewToBottom(this);
		}
		
		/**
		 * @name width
		 * @param {Object} value
		 */
		proto.width = function(value, duration, ease){
			// GET
			if(value === undefined || value === null)
				value = 'offset';
			if(value === 'offset' || value === 'client' || value === 'content' || value === 'inner' || value === 'value')
				return this._cl_width[value];
			if(typeof duration === 'number' && typeof value === 'number')
				return this.animate(duration, {height:value, ease:ease});
			
			// SET
			this._cl_width.auto = this._cl_width.percent = this._cl_width.relative = this._cl_width.isDefault = false;
			if (typeof value === 'string') {
				if (value === 'auto') {
					this._cl_width.auto = true;
				} else {
					var isPerc = value.indexOf('%') != -1;
					this._cl_width.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if(this._cl_width.percent > 1) this._cl_width.percent = 1;
					if(this._cl_width.percent < 0) this._cl_width.percent = 0;
					this._cl_width.relative = !isPerc ? parseFloat(value) : false;
					this._cl_width.auto = false;	
				}
			}
			var shouldRedraw = value !== this._cl_width.value;
			this._cl_width.value = value;
			if(shouldRedraw) this.redraw();
			return this;
		}
		
		/**
		 * @name height
		 * @param {Object} value
		 */
		proto.height = function(value, duration, ease){
			// GET
			if(value === undefined || value === null)
				value = 'offset';
			if(value === 'offset' || value === 'client' || value === 'content' || value === 'inner' || value === 'value')
				return this._cl_height[value];
			if(typeof duration === 'number' && typeof value === 'number')
				return this.animate(duration, {height:value, ease:ease});
			
			// SET
			this._cl_height.auto = this._cl_height.percent = this._cl_height.relative = this._cl_height.isDefault = false;
			if (typeof value === 'string') {
				if (value === 'auto') {
					this._cl_height.auto = true;
				} else {
					var isPerc = value.indexOf('%') != -1;
					this._cl_height.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if(this._cl_height.percent > 1) this._cl_height.percent = 1;
					if(this._cl_height.percent < 0) this._cl_height.percent = 0;
					this._cl_height.relative = !isPerc ? parseFloat(value) : false;
				}
			}
			var shouldRedraw = value !== this._cl_height.value;
			this._cl_height.value = value;
			if(shouldRedraw) this.redraw();
			return this;
		}
		
		
		/**
		 * @name redraw
		 */
		proto.redraw = function(){
			if (!this._cl_redrawPending && this.parentView()) {
				this._cl_redrawPending = true;
				this.cl().MVC().redrawEngine().attemptRedraw(this);
			}
		}
		
		/**
		 * @ame isFullyVisible
		 */
		proto.isFullyVisible = function(){
			var thisView = this;
			while(thisView){
				if(!thisView.visible())
					return false;
				else
					thisView = thisView.parentView();
			}
			return true;
		}
		
		proto.processCustomViewDefNode = function(nodeName, node, imports, defaults, rootView){
			switch(nodeName){
				case 'EventListener':
					this._cl_addEventListenerFromViewDef(node, imports);
					break;
				case 'Bind':
					this._cl_bindToEventFromViewDef(node, imports, rootView);
					break;
			}
		}
		
		proto._cl_addEventListenerFromViewDef = function(node, imports){
			var type = node.type,
				listener = (this._cl_controller instanceof a5.cl.CLController && node.view  !== true) ? this._cl_controller : this,
				target = (typeof node.target === 'string') ? this.getChildView(node.target) : this,
				method = listener[node.method],
				event;
			//if an event was specified, resolve the event/constant to a string
			if(typeof node.event === 'string'){
				event = a5.GetNamespace(node.event, imports);
				if(typeof event !== 'function'){
					a5.ThrowError('Error adding event listener: Could not find the event class "' + node.event + '".');
					return;
				} else if(typeof node.type !== 'string'){
					a5.ThrowError('Error adding event listener: No type specified for the event class "' + node.event + '".');
					return;
				}
				type = event[node.type];
				if(typeof type !== 'string'){
					a5.ThrowError('Error adding event listener: Could not find the type "' + node.type + '" on class "' + node.event + '".');
					return;
				}
			}
			//throw an error if the target couldn't be found
			if(!(target instanceof CLView)){
				a5.ThrowError('Error adding event listener: Could not find the target with id "' + node.target + '".  Make sure that the EventListener node comes after the node for the target view.');
				return;
			}
			if(typeof method !== 'function'){
				a5.ThrowError('Error adding event listener: Could not find the method "' + node.method + '". Note that the method must be publicly accessible.');
				return;
			}
			target.addEventListener(type, method, node.useCapture === true, this);
		}
		
		proto._cl_bindToEventFromViewDef = function(node, imports, rootView){
			var type = node.type,
				listener, singleton, method;
			//if an event was specified, resolve the event/constant to a string
			if(typeof node.event === 'string'){
				var event = a5.GetNamespace(node.event, imports);
				if(typeof event !== 'function'){
					a5.ThrowError('Error binding to event: Could not find the event class "' + node.event + '".');
					return;
				} else if(typeof node.type !== 'string'){
					a5.ThrowError('Error binding to event: No type specified for the event class "' + node.event + '".');
					return;
				}
				type = event[node.type];
				if(typeof type !== 'string'){
					a5.ThrowError('Error binding to event: Could not find the type "' + node.type + '" on class "' + node.event + '".');
					return;
				}
			}
			//if a listener was specified by ID, look for that ID.
			if(typeof node.listener === 'string'){
				listener = rootView.getChildView(node.listener);
				if(!listener){
					a5.ThrowError('Error binding to event: Could not find a listener with the ID "' + node.listener + '".');
					return;
				}
				//if this listener is a controller, and the view was specified, use the view instead
				if(listener instanceof a5.cl.CLController && node.view === true)
					listener = listener.view();
				if(!listener){
					a5.ThrowError('Error binding to event: The controller with ID "' + node.listener + '" does not have a view.');
					return;
				}
			}
			//if a listener was specified by a singleton, resolve the class to an intance 
			else if(typeof node.singleton === 'string'){
				singleton = a5.GetNamespace(node.singleton, imports);
				if(typeof singleon !== 'function'){
					a5.ThrowError('Error binding to event: Unable to locate the class "' + node.singleton + '". Make sure to import this class, or reference it with a fully-qualified package.');
					return;
				} else if(!singleton.isSingleton()){
					a5.ThrowError('Error binding to event: Listener class "' + node.singleton + '" is not a singleton. You should specify the listener by ID with the "listener" attribute.');
					return;
				}
				listener = singleon.instance();
			} else {
				a5.ThrowError('Error binding to event: No listener was specified.  Either specify a "listener" by ID, or a "singleton" by class.');
				return;
			}
			//resolve the method
			method = listener[node.method];
			if(typeof method !== 'function'){
				a5.ThrowError('Error binding to event: Could not find the method "' + node.method + '" on listener "' + (node.listener || node.singleton) + '". Note that the method must be publicly accessible.');
				return;
			}
			this.addEventListener(type, method, node.useCapture === true, listener);
		}
		
		proto.viewRedrawn = function(){}
		
		proto.addedToTree = function(){}
		
		proto.removedFromTree = function(){}
		
		proto.isInTree = function(){ return this._cl_isInTree; }
		
		/* PRIVATE METHODS */
		
		proto._cl_addedToTree = function(){
			this._cl_isInTree = true;
			this.addedToTree();
			if(this._cl_controller)
				this._cl_controller._cl_viewAddedToTree();
		}
		
		proto._cl_removedFromTree = function(){
			this._cl_isInTree = false;
			this.removedFromTree();
			if(this._cl_controller)
				this._cl_controller._cl_viewRemovedFromTree();
		}
		
		proto._cl_addedToParent = function(parentView){
			this.addedToParent(parentView);
			if(parentView.isInTree())
				this._cl_addedToTree();
			//inherit suspendRedraws from the parent view
			proto.suspendRedraws.call(this, parentView.suspendRedraws());
			//if this view has received a vdViewReady() call, and its parent is still being built, alert the parent
			if (this._cl_vdViewIsReady && parentView._cl_buildingFromViewDef)
				parentView._cl_vdViewAdded();
			this.dispatchEvent(new im.CLEvent(im.CLEvent.ADDED_TO_PARENT));
		}
		
		proto._cl_removedFromParent = function(parentView){
			this.removedFromParent(parentView);
			this._cl_removedFromTree();
			if(this._cl_viewElement)
				this._cl_viewElement.style.display = 'none';
			this._cl_initialRenderComplete = false;
			this.dispatchEvent(new im.CLEvent(im.CLEvent.REMOVED_FROM_PARENT));
		}
		
		proto._cl_propGetSet = function(prop, value, type){
			if((type && typeof value === type) || (!type && value !== undefined) ){
				this[prop] = value;
				return this;
			}
			return this[prop];
		}
				
		proto._cl_css = function(prop, value, getBrowserImplementation){
			getBrowserImplementation = getBrowserImplementation || false;
			if(getBrowserImplementation)
				prop = a5.cl.initializers.dom.Utils.getCSSProp(prop);
			if(prop)
				this._cl_viewElement.style[prop] = value;
			return this;
		}
		
		proto._cl_setParent = function(parentView){
			this._cl_parentView = parentView;
		}
		
		proto._cl_calculateOffset = function(){
			var offsetChanged = CLView._cl_calcOffsetObj(this, '_cl_calculatedOffset', ['_cl_borderWidth']),
				clientOffsetChanged = CLView._cl_calcOffsetObj(this, '_cl_calculatedClientOffset', ['_cl_padding']);
			if(offsetChanged || clientOffsetChanged)
				this.redraw();
		}
		
		proto._cl_redraw = function(force, suppressRender){
			if ((!this._cl_initialRenderComplete || this._cl_redrawPending || force) && a5.cl.CLView._cl_viewCanRedraw(this)) {
				var propXVal = this._cl_x.percent !== false ? (this._cl_parentView.width() * this._cl_x.percent) : this.x(true),
				propYVal = this._cl_y.percent !== false ? (this._cl_parentView.height() * this._cl_y.percent) : this.y(true),
				w = CLView._cl_setWH(this, 'width', this._cl_width),
				h = CLView._cl_setWH(this, 'height', this._cl_height),
				forceRedraw = (w !== undefined || h !== undefined);
				this._cl_pendingViewElementProps.width = w !== null ? (Math.max(0, CLView._cl_updateWH(this, w, 'width', propXVal, this._cl_minWidth, this._cl_maxWidth, this._cl_width)) + 'px') : undefined;
				this._cl_pendingViewElementProps.height = h !== null ? (Math.max(0, CLView._cl_updateWH(this, h, 'height', propYVal, this._cl_minHeight, this._cl_maxHeight, this._cl_height)) + 'px') : undefined;		
				this._cl_pendingViewElementProps.left = CLView._cl_updateXY(this, propXVal, this._cl_alignX, this._cl_parentView.width('inner'), 'width') + 'px';
				this._cl_pendingViewElementProps.top = CLView._cl_updateXY(this, propYVal, this._cl_alignY, this._cl_parentView.height('inner'), 'height') + 'px';
				this._cl_pendingViewElementProps.paddingTop = this._cl_calculatedClientOffset.top + 'px';
				this._cl_pendingViewElementProps.paddingRight = this._cl_calculatedClientOffset.right + 'px';
				this._cl_pendingViewElementProps.paddingBottom = this._cl_calculatedClientOffset.bottom + 'px';
				this._cl_pendingViewElementProps.paddingLeft = this._cl_calculatedClientOffset.left + 'px';
				
				if(this._cl_redrawPending)
					this._cl_alertParentOfRedraw();
					
				this._cl_redrawPending = false;
				
				if(suppressRender !== true)
					this._cl_render();
				CLView._cl_initialRedraw(this);
				return {force:forceRedraw, shouldRedraw:true};
			}
			CLView._cl_initialRedraw(this);
			return {force:false, shouldRedraw:false};
		}
		
		proto._cl_alertParentOfRedraw = function(){
			//determine what changed
			var changes = {
				width: this._cl_pendingViewElementProps.width !== this._cl_currentViewElementProps.width,
				height: this._cl_pendingViewElementProps.height !== this._cl_currentViewElementProps.height,
				x: this._cl_pendingViewElementProps.left !== this._cl_currentViewElementProps.left,
				y: this._cl_pendingViewElementProps.top !== this._cl_currentViewElementProps.top
			}
			if(this._cl_parentView)
				this._cl_parentView._cl_childRedrawn(this, changes);
		}
		
		proto._cl_render = function(){
			if(CLView._cl_useTransforms && CLView._cl_transformProp){
				var val = '';
				if (this._cl_pendingViewElementProps.top !== undefined) {
					val += 'translateY(' + this._cl_pendingViewElementProps.top + ') ';
					this._cl_currentViewElementProps.top = this._cl_pendingViewElementProps.top;
				}
				if (this._cl_pendingViewElementProps.left !== undefined) {
					val += 'translateX(' + this._cl_pendingViewElementProps.left + ') ';
					this._cl_currentViewElementProps.left = this._cl_pendingViewElementProps.left;
				}
				if (val !== '') {
					if(CLView._cl_forceGPU)
						val += 'translateZ(0px)';
					this._cl_viewElement.style[CLView._cl_transformProp] = val;
				}				
			}
			
			for(var prop in this._cl_pendingViewElementProps){
				var value = this._cl_pendingViewElementProps[prop];
				if (this._cl_currentViewElementProps[prop] !== value)
					this._cl_currentViewElementProps[prop] = this._cl_viewElement.style[prop] = value;
			}
			this._cl_pendingViewElementProps = {};
			this.viewRedrawn();
		}
		
		proto._cl_setIndex = function(index){
			this._cl_viewElement.style.zIndex = index;
		}
		
		proto.Override.dispatchEvent = function(event, data, bubbles){
			var e = this._a5_createEvent(event, data, bubbles);
			var viewChain = this._cl_getViewChain();
			
			//capture phase
			e._a5_phase = a5.EventPhase.CAPTURING;
			for(var x = 0, y = viewChain.length ; x < y; x++){
				if(this._a5_initialized)
					this._a5_dispatchEvent.call(viewChain[x], e);
			}
			
			//target phase
			e._a5_phase = a5.EventPhase.AT_TARGET;
			this._a5_dispatchEvent(e);
			
			//bubbling phase
			if(e.bubbles()){
				e._a5_phase = a5.EventPhase.BUBBLING;
				for(var x = viewChain.length - 1; x >= 0; x--){
					if(this._a5_initialized)
						this._a5_dispatchEvent.call(viewChain[x], e);
				}
			}
			if(!e.shouldRetain()) e.destroy();
			e = null;
			viewChain = null;
		}
		
		proto._cl_getViewChain = function(){
			var chain = [];
			var link = this;
			while(link._cl_parentView){
				link = link._cl_parentView;
				chain.unshift(link);
			}
			return chain;
		}
		
		proto._cl_vdViewReady = function(){
			this._cl_vdViewIsReady = true;
			if(this._cl_parentView && !this._cl_controller)
				this._cl_parentView._cl_vdViewAdded();
			else if(this._cl_controller)
				this._cl_controller._cl_viewReady();
		}
		
		proto._cl_destroyElement = function(elem){
			this.MVC().garbageCollector().destroyElement(elem);
		}
		
		proto.dealloc = function(){
			if(this._cl_parentView)
				this.removeFromParentView(false);
			this._cl_destroyElement(this._cl_viewElement);
			this._cl_viewElement = null;
		}
});


a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.CLEvent')
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
				if(_forcedClientEnvironment === "MOBILE" && _windowProps.width >= cls.config().mobileWidthThreshold){
					_forcedClientEnvironment = _clientEnvironment;
					cls.cl().dispatchEvent(im.CLEvent.CLIENT_ENVIRONMENT_UPDATED, [_forcedClientEnvironment])
				} else if(_forcedClientEnvironment !== "MOBILE" && _windowProps.width < cls.config().mobileWidthThreshold){
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

a5.Package('a5.cl.mvc.core')
	.Static('XMLUtils', function(XMLUtils){
		
		XMLUtils.parseXML = function(xmlString){
			var xml;
			if (window.DOMParser) { // Standards method
				xml = (new DOMParser()).parseFromString(xmlString, "text/xml");
				//check for a parser error
				if (xml.documentElement.nodeName === "parsererror"){
					throw xml.documentElement.childNodes[0].nodeValue;
					return;
				}
			} else { // Internet Explorer method
				xml = new ActiveXObject("Msxml2.DOMDocument.3.0");
				xml.async = "false";
				xml.loadXML(xmlString);
				//check for a parser error
				if (xml.parseError.errorCode != 0){
				    throw ("Error parsing XML. Line " + xml.parseError.line +
					    " position " + xml.parseError.linePos +
					    "\nError Code: " + xml.parseError.errorCode +
		    			"\nError Reason: " + xml.parseError.reason +
					    "Error Line: " + xml.parseError.srcText);
					return;
				}
			}
			//check for a webkit parser error
			if(xml.documentElement.textContent && xml.documentElement.textContent.indexOf('This page contains the following errors:') === 0){
				var msg = xml.documentElement.textContent.replace('This page contains the following errors:', 'Error parsing XML: ');
				throw msg;
			}
			return xml;
		}
		
		XMLUtils.getElementsByTagNameNS = function(xmlElement, tagName, namespaceURI, prefix){
			if(typeof xmlElement.getElementsByTagNameNS === 'function')
				return xmlElement.getElementsByTagNameNS(namespaceURI, tagName);
			else
				return xmlElement.getElementsByTagName(prefix + ':' + tagName);
		}
		
		XMLUtils.getNamedItemNS = function(attributes, attrName, namespaceURI, prefix){
			if(typeof attributes.getNamedItemNS === 'function')
				return attributes.getNamedItemNS(namespaceURI, attrName);
			else
				return attributes.getNamedItem(prefix + ':' + attrName);
		}
		
		XMLUtils.localName = function(xml){
			if(typeof xml.localName === 'string')
				return xml.localName;
			else
				return (xml.tagName ? xml.tagName : xml.name).replace(/.+?:/, '');
		}
		
		XMLUtils.children = function(xmlNode){
			if(xmlNode.children){
				return xmlNode.children;
			} else {
				var children = [],
					x, y, thisNode;
				for(x = 0, y = xmlNode.childNodes.length; x < y; x++){
					thisNode = xmlNode.childNodes[x];
					if(thisNode.nodeType === 1)
						children.push(thisNode);
				}
				return children;
			}
		}
		
		XMLUtils.getPrefix = function(xml){
			if(typeof xml.prefix !== 'undefined'){
				return xml.prefix;
			} else {
				var splitName = xml.tagName ? xml.tagName.split(':') : xml.name.split(':');
				return (splitName.length > 1 ? splitName[0] : null);
			}
		}
	});


a5.Package('a5.cl.core.viewDef')
	.Import('a5.cl.*',
			'a5.cl.mvc.core.XMLUtils',
			'a5.cl.core.Utils')
	.Extends('a5.cl.CLMVCBase')
	.Static(function(ViewDefParser, im){
		ViewDefParser._cl_ns = 'http://corelayerjs.com/';
		ViewDefParser._cl_nsPrefix = 'cl';
		
		ViewDefParser.getImports = function(xml){
			//get the cl:Import nodes
			var importsNode = ViewDefParser.getElementsByTagName(xml.documentElement, 'Imports'),
				imports = (importsNode && importsNode.length > 0) ? ViewDefParser.getElementsByTagName(importsNode[0], 'Import') : [], 
				namespaces = [],
				x, y, importNode;
			for(x = 0, y = imports.length; x < y; x++){
				importNode = imports[x];
				namespaces.push(importNode.getAttribute('ns'));
			}
			return a5._a5_processImports(namespaces);
		}
		
		ViewDefParser._cl_getEnvironmentNode = function(rootNode, environmentName, environmentValue){
			var children = im.XMLUtils.children(rootNode);
			for (var x = 0, xl = children.length; x < xl; x++) {
				var thisNode = children[x];
				if (thisNode.prefix === ViewDefParser._cl_nsPrefix && im.XMLUtils.localName(thisNode) === environmentName) {
					//if this tag value contains the target value, return the node
					if (thisNode.getAttribute('value').toUpperCase().indexOf(environmentValue) !== -1) 
						return thisNode;
				}
			}
			return null;
		}
		
		ViewDefParser._cl_resolveQualifiedClass = function(ns, imports){
			var classRef = a5.GetNamespace(ns.replace(/_/g, '.'));
			if(typeof imports === 'object')
				imports[ns] = classRef;
			return classRef;
		}
		
		ViewDefParser.getElementsByTagName = function(xml, tagName){
			return im.XMLUtils.getElementsByTagNameNS(xml, tagName, ViewDefParser._cl_ns, ViewDefParser._cl_nsPrefix);
		}
		
		ViewDefParser.processAttribute = function(value){
			//first split the value (pipe delimited) - unless it starts with {Single}
			var attributes = value.substr(0, 8) == "{Single}" ? [value.substr(8)] : value.split('|'),
				json = window.JSON || a5.cl.core.JSON,
			//regex for detecting strict typing
				typeFlags = /{RegExp}|{Boolean}|{Number}|{Array}|{String}|{Object}|{Namespace}/,
			//loop through each attribute value and process it
				processed = [],
				x, y, attr, type;
			for(x = 0, y = attributes.length; x < y; x++){
				attr = attributes[x];
				//determine the type
				type = typeFlags.exec(attr);
				if(im.Utils.isArray(type))
					type = type[0];
				//remove the type flag from the value
				attr = attr.replace(typeFlags, '');
				switch(type){
					case '{Boolean}': //force to a boolean
						processed.push(attr === 'true');
						break;
					case '{Number}': //use parseInt to force to a number
						processed.push(parseInt(attr));
						break;
					case '{Array}':
					case '{Object}': //use JSON to parse an array or object
						processed.push(json.parse(attr));
						break;
					case '{String}': //force to String
						processed.push(attr + '');
						break;
					case '{Namespace}': //resolve namespace
						processed.push(a5.GetNamespace(attr, this._cl_imports));
						break;
					case '{RegExp}': // resolve regexp
						var split = attr.split('/');
						processed.push(new RegExp(split[1], split[2]));
						break;
					default: //try to guess by default
						if(!isNaN(attr)){ //check if it's a number
							processed.push(parseFloat(attr));
						} else if(attr === 'true' || attr === 'false') {//check if it's a boolean
							processed.push(attr === 'true');
						} else if(/(^\[.*\]$)|(\{.*\})$/.test(attr)){ //check if it looks like an object or an array
							try{ processed.push(json.parse(attr)) } catch(e) { processed.push(attr + ''); };
						} else { //otherwise, force to string
							processed.push(attr + '');
						}
				}
			}
			return processed;
		}
	})
	.Prototype('ViewDefParser', function(proto, im, ViewDefParser){
		
		proto.ViewDefParser = function(xml, controller){
			proto.superclass(this);
			
			this._cl_controller = controller;
			this._cl_xml = (typeof xml === 'string') ? im.XMLUtils.parseXML(xml) : xml;
			this._cl_rootView = controller.view();
			this._cl_imports = ViewDefParser.getImports(this._cl_xml);
			this._cl_definitionNode = this._cl_getDefinitionNode();
			this._cl_defaultsNode = this._cl_getDefaults();
			//this._cl_perfTest = this.cl().plugins().PerformanceTester().createTimer(this.instanceUID());
			
			if(!this._cl_definitionNode) {
				this.redirect(500, 'Unable to find a valid cl:Definition element in the view definition.');
				return;
			}
		}
		
		proto.parse = function(viewReadyCallback, buildCompleteCallback, scope){
			//this._cl_perfTest.startTest();
			if(this._cl_rootView)
				this._cl_definitionNode = this._cl_getDefinitionNode();
			var firstChild = im.XMLUtils.children(this._cl_definitionNode)[0],
				builder = new a5.cl.core.viewDef.ViewBuilder(this._cl_controller, firstChild, this._cl_defaultsNode, this._cl_imports, this._cl_rootView);
			
			builder.build(
				//view ready
				function(view){
					this._cl_rootView = view;
					if(typeof viewReadyCallback === 'function') 
						viewReadyCallback.call(scope, view);
				},
				//build complete
				function(view){
					//this._cl_perfTest.completeTest();
					if(typeof buildCompleteCallback === 'function')
						buildCompleteCallback.call(scope, view);
				},
				this, this._cl_rootView
			);
		}
		
		proto.hasOrientationOptions = function(){
			var orientationNodes = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Orientation');
			return (orientationNodes && orientationNodes.length > 0);
		}
		
		proto.hasEnvironmentOptions = function(targetEnv){
			var envNodes = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Environment');
			if(envNodes && envNodes.length > 0){
				if(typeof targetEnv === 'string'){
					for(var x = 0, y = envNodes.length; x < y; x++){
						var thisNode = envNodes[x];
						if(im.Utils.arrayIndexOf(thisNode.getAttribute('value').split('|'), targetEnv) > -1)
							return true;
					}
					return false;
				}
				return true;
			}
			return false;
		}
		
		proto._cl_getDefaults = function(){
			//get the cl:Defaults node
			var defNode = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Defaults');
			return (defNode && defNode.length > 0) ? defNode[0] : null;
		}
		
		proto._cl_getDefinitionNode = function(){
			var clientEnvironment = this.DOM().clientEnvironment(true).toUpperCase(),
				clientPlatform = this.DOM().clientPlatform().toUpperCase(),
				clientOrientation = this.DOM().clientOrientation().toUpperCase(),
				defNode = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Definition'),
				definition = (defNode && defNode.length > 0) ? defNode[0] : null,
				env = ViewDefParser._cl_getEnvironmentNode(definition, 'Environment', clientEnvironment);
			
			if(definition && env){
				//check it for an appropriate Platform node
				var plat = ViewDefParser._cl_getEnvironmentNode(env, 'Platform', clientPlatform);
				if(plat){
					//if an appropriate Platform node was found, check it for an appropriate Orientation node
					var orient = ViewDefParser._cl_getEnvironmentNode(plat, 'Orientation', clientOrientation);
					if(orient.length > 0)
						return orient;	//if one was found, return it
					else
						return plat;	//otherwise, platform is as specific as we can get, so return that
						
				} else {
					//if no Platform was found, check for a loose Orientation
					var orient = ViewDefParser._cl_getEnvironmentNode(env, 'Orientation', clientOrientation);
					if(orient)
						return orient;	//if one was found, return it
					else
						return env;		//otherwise, environment is as specific as we can get, so return that
				}
			} else {
				//no Environment tag was found, so just return the raw definition node
				return definition;
			}
		}
	});


a5.Package('a5.cl.core.viewDef')
	.Import('a5.cl.mvc.core.XMLUtils',
			'a5.cl.core.Utils',
			'a5.cl.CLView')
	.Extends('a5.cl.CLMVCBase')
	.Static(function(ViewBuilder, im){
		ViewBuilder._cl_isInternalNodeType = function(node){
			var internalNodes = ['Imports', 'Defaults', 'Definition', 'Environment', 'Platform', 'Orientation'];
			if(node.prefix !== im.ViewDefParser._cl_nsPrefix || node.namespaceURI !== im.ViewDefParser._cl_ns) return false;
			for(var x = 0, y = internalNodes.length; x < y; x++){
				if(im.XMLUtils.localName(node) === internalNodes[x]) return true;
			}
			return false;
		}
	})
	.Prototype('ViewBuilder', function(proto, im, ViewBuilder){
		
		this.Properties(function(){
			this._cl_xml = null;
			this._cl_defaults = null;
			this._cl_imports = null;
			this._cl_rootView = null;
			this._cl_ids = null;
			this._cl_id = null;
			this._cl_view = null;
			this._cl_childIndex = 0;
			this._cl_children = null;
			this._cl_viewName = null;
			this._cl_viewReadyCallback = null;
			this._cl_buildCompleteCallback = null;
			this._cl_callbackScope
			this._cl_isCustomNode = false;
		});
		
		proto.ViewBuilder = function(controller, xml, defaults, imports, rootView, ids){
			proto.superclass(this);
			
			this._cl_controller = controller;
			this._cl_xml = xml;
			this._cl_defaults = defaults;
			this._cl_imports = imports;
			this._cl_rootView = rootView;
			this._cl_ids = ids || [];
			this._cl_children = im.XMLUtils.children(xml);
			this._cl_viewName = im.XMLUtils.localName(xml);
			
			//if(!ViewBuilder.perfTest)
			//	ViewBuilder.perfTest = this.cl().plugins().PerformanceTester().createTimer('viewBuilder');
		}
		
		proto.build = function(viewReadyCallback, buildCompleteCallback, callbackScope, view){
			//ViewBuilder.perfTest.startTest();
			this._cl_viewReadyCallback = viewReadyCallback;
			this._cl_buildCompleteCallback = buildCompleteCallback;
			this._cl_callbackScope = callbackScope;
			var xml = this._cl_xml,
				ns = im.ViewDefParser._cl_ns,
				nsPrefix = im.ViewDefParser._cl_nsPrefix;
			if(view instanceof im.CLView){
				var customNodeAttr = xml.attributes.getNamedItem('_isCustomNode');
				if(customNodeAttr)
					this._cl_isCustomNode = customNodeAttr.value === 'true';
				//if a view was passed in, we don't need to build it
				this._cl_viewCreated(view);
			} else {
				//if this node has the proper namespace and is not an internal node type...
				var hasNamespace = xml.namespaceURI === ns && xml.prefix === nsPrefix,
					isInternalNode = im.ViewBuilder._cl_isInternalNodeType(xml);
				if(hasNamespace && !isInternalNode) {
					//get the 'id' attribute
					var idAttr = xml.attributes.getNamedItem('id');
					if(idAttr) this._cl_id = idAttr.value;
					//get the ViewDef attribute
					view = this._cl_findChild(this._cl_id);
					//if there's already a view for that ID, jump to this._cl_viewCreated().
					if(view instanceof im.CLView && im.Utils.arrayIndexOf(this._cl_ids, this._cl_id) === -1) {
						this._cl_viewCreated(view);
					} else if(!this._cl_id || im.Utils.arrayIndexOf(this._cl_ids, this._cl_id) === -1) {							
						var classDef = this._cl_imports[this._cl_viewName] || im.ViewDefParser._cl_resolveQualifiedClass(this._cl_viewName, this._cl_imports);
						if(!classDef){
							this.redirect(500, 'Error parsing the view definition for controller "' + this._cl_controller.namespace() + '". ' + im.XMLUtils.localName(xml) + ' could not be found. \
							Make sure this class was imported into the view definition and included in the dependencies.');
							return;
						}
						//check if constructor params were set on this node
						var constructAttr = im.XMLUtils.getNamedItemNS(xml.attributes, 'Construct', ns, nsPrefix),
							constructParams = constructAttr ? im.ViewDefParser.processAttribute(constructAttr.value) : [];
						//create an instance
						view =a5.Create(classDef, constructParams);
						if(view instanceof im.CLView) {
							//if it's a CLView, send it to this._cl_viewCreated()
							this._cl_viewCreated(view);
						} else if(view instanceof a5.cl.CLController){
							//if the new view is actually a controller, generate the view
							var controller = view;
							view = null;
							controller.id(this._cl_id);
							//compile a list of reserved node names for this class and all of its ancestors
							this._cl_compileCustomNodes(controller);
							this._cl_controller._cl_childControllers.push(controller);
							//get the view from the controller
							controller.generateView(this._cl_viewCreated, this);
						}
					} else {
						this.redirect(500, 'Error: Duplicate id (' + this._cl_id + ') found in view definition for controller "' + this._cl_controller.namespace() + '".');
						return;
					}
				} else {
					//if there's nothing to create, stop here
					if(typeof this._cl_buildCompleteCallback === 'function')
						this._cl_buildCompleteCallback.call(this._cl_callbackScope, null);
				}
			}
		}
		
		proto._cl_viewCreated = function(view){
			//ViewBuilder.perfTest.completeTest();
			this._cl_view = view;
			view._cl_fromViewDef = true;
			view._cl_vdViewIsReady = false;
			if (!this._cl_rootView) {
				this._cl_rootView = view;
				view._cl_controller = this._cl_controller;
			}
			if(this._cl_id)
				view.id(this._cl_id);
			this._cl_ids.push(view.id());
			//if this view doesn't have a controller, reset all the ViewDef stuff
			if(!view._cl_controller || view === this._cl_rootView){
				this._cl_removeViewDefViews(); //remove any previously added subviews 
				this._cl_resetViewProperties(); //reset any previously set properties
				//compile a list of reserved node names for this class and all of its ancestors
				this._cl_compileCustomNodes();
			}
			this._cl_applyAttributeTree();
			//alert the parent builder that the view is ready
			if(typeof this._cl_viewReadyCallback === 'function')
				this._cl_viewReadyCallback.call(this._cl_callbackScope, view);
			//create the child views, if necessary
			this._cl_childIndex = 0;
			view._cl_pendingChildren = this._cl_children.length;
			this._cl_buildNextChild();
		}
		
		proto._cl_buildNextChild = function(){
			if(this._cl_children && this._cl_childIndex < this._cl_children.length){
				this._cl_view._cl_buildingFromViewDef = true;
				var thisChild = this._cl_children[this._cl_childIndex],
					hasController = this._cl_view._cl_controller instanceof a5.cl.CLController && this._cl_view !== this._cl_rootView,
					customNodes = hasController ? this._cl_view._cl_controller.constructor._cl_customViewDefNodes : this._cl_view.constructor._cl_customViewDefNodes,
					customNodeTarget = hasController ? this._cl_view._cl_controller : this._cl_view,
					customControllerNodes = this._cl_view === this._cl_rootView ? this._cl_compileCustomNodes(this._cl_controller) : [],
					localName = im.XMLUtils.localName(thisChild);
				//if this node is a reserved custom node type, let the view handle it.
				if(im.Utils.arrayContains(customNodes, localName) || im.Utils.arrayContains(customControllerNodes, localName)){
					var nodeObj = this._cl_convertNodeToObject(thisChild);
					if(im.Utils.arrayContains(customControllerNodes, localName))
						customNodeTarget = this._cl_controller;
					customNodeTarget.processCustomViewDefNode(nodeObj._name, nodeObj, this._cl_imports, this._cl_defaults, this._cl_rootView);
					this._cl_childIndex++;
					//Added method check due to CLView being a possible node owner
					if(this._cl_view._cl_vdViewAdded && !this._cl_isCustomNode)
						this._cl_view._cl_vdViewAdded();
					this._cl_buildNextChild();
					return;
				} else if(!hasController || this._cl_view === this._cl_rootView){
					//otherwise, assume it's a subview, and build it.
					var builder = new im.ViewBuilder(this._cl_controller, thisChild, this._cl_defaults, this._cl_imports, this._cl_rootView, this._cl_ids);
					builder.build(this._cl_viewReadyHandler, this._cl_buildCompleteHandler, this);
				} else {
					this.throwError("Error parsing view definition for " + this._cl_controller.id() + ".  Views cannot be applied to the controller '" + this._cl_view._cl_controller.id() + "'.  Use a separate view definition to define the view structure for each controller.");
					return;
				}
			} else {
				//Added method check due to CLView being a possible node owner
				if (this._cl_view._cl_vdViewReady && !this._cl_view._cl_vdViewIsReady)
					this._cl_view._cl_vdViewReady();
				if(typeof this._cl_buildCompleteCallback === 'function')
					this._cl_buildCompleteCallback.call(this._cl_callbackScope, this._cl_view);
				this._cl_view.suspendRedraws(false);
				this.destroy();
			}
		}
		
		proto._cl_findChild = function(id){
			if(typeof id !== 'string' || !this._cl_rootView)
				return null;
			//first, look in the child views of the root view
			var child = this._cl_rootView.getChildView(id),
				x, y, thisOrphan;
			if(child)
				return child;
			//if no matching child was found, check the orphanage
			for(x = 0, y = this._cl_controller._cl_orphanage.length; x < y; x++){
				thisOrphan = this._cl_controller._cl_orphanage[x];
				if(thisOrphan.id() === id)
					return thisOrphan;
			}
			//finally, check the child controllers
			return this._cl_controller.getChildController(id);
			
		}
		
		proto._cl_viewReadyHandler = function(childView){
			if (childView) {
				this._cl_view.addSubViewAtIndex(childView, this._cl_childIndex);
				if(childView._cl_controller)
					this._cl_view._cl_vdViewAdded();
			}
		}
		
		proto._cl_buildCompleteHandler = function(view){
			this._cl_childIndex++;
			this._cl_buildNextChild();
		}
		
		proto._cl_removeViewDefViews = function(view){
			if(!view)
				view = this._cl_view;
			if(!(view instanceof a5.cl.CLViewContainer) || !view._cl_fromViewDef)
				return;
			var childViews = view._cl_childViews.slice(0),
				x, y, thisChild;
			for(x = 0, y = childViews.length; x < y; x++){
				thisChild = childViews[x];
				if (thisChild._cl_fromViewDef) {
					this._cl_controller._cl_orphanage.push(thisChild);
					this._cl_removeViewDefViews(thisChild);
					view.removeSubView(thisChild, false);
				}
			}
		}
		
		proto._cl_resetViewProperties = function(){
			var view = this._cl_view;
			for(var prop in view._cl_viewDefDefaults){
				//make sure this property isn't supposed to be skipped
				if (im.Utils.arrayIndexOf(view.skipViewDefReset, prop) === -1) {
					//if it's a method, use call(), otherwise set the value directly
					if (typeof view[prop] === 'function') 
						view[prop].call(view, view._cl_viewDefDefaults[prop]);
					else
						view[prop] = view._cl_viewDefDefaults[prop];
				}
			}
		}
		
		proto._cl_applyAttributeTree = function(){
			var defaults = this._cl_defaults;
			//set the defaults first
			if (defaults) {
				//start at the top with the global defaults
				this._cl_applyDefaults(defaults);
				//get the environment variables
				var clientEnvironment = this.DOM().clientEnvironment(true).toUpperCase(),
					clientPlatform = this.DOM().clientPlatform().toUpperCase(),
					clientOrientation = this.DOM().clientOrientation().toUpperCase();
				//apply top-level environment attributes
				var envNodes = this._cl_applyEnvironmentDefaults(defaults, 'Environment', clientEnvironment);
				//apply loose orientation attributes
				for(var x = 0, y = envNodes.length; x < y; x++){
					this._cl_applyEnvironmentDefaults(envNodes[x], 'Orientation', clientOrientation);
				}
				//apply top-level platform attributes
				var platformNodes = [];
				for(var x = 0, y = envNodes.length; x < y; x++){
					var thesePlatforms = this._cl_applyEnvironmentDefaults(envNodes[x], 'Platform', clientPlatform);
					platformNodes.push.apply(platformNodes, thesePlatforms);
				}
				//apply orientation attributes nested within a platform node
				for(var x = 0, y = platformNodes.length; x < y; x++){
					this._cl_applyEnvironmentDefaults(platformNodes[x], 'Orientation', clientOrientation);
				}
			}
			//finally, set the instance-specific attributes
			this._cl_applyAttributes(this._cl_xml);
		}
		
		proto._cl_applyEnvironmentDefaults = function(defaults, environmentName, environmentValue){
			var nodes = [],
				children = im.XMLUtils.children(defaults);
			for (var x = 0, xl = children.length; x < xl; x++) {
				var thisNode = children[x];
				if(thisNode.prefix === im.ViewDefParser._cl_nsPrefix && im.XMLUtils.localName(thisNode) === environmentName){
					//if this tag value contains the target value...
					if(thisNode.getAttribute('value').toUpperCase().indexOf(environmentValue) !== -1){
						//apply the Env defaults
						this._cl_applyDefaults(thisNode);
						//cache this node for later
						nodes.push(thisNode);
					}
				}
			}
			return nodes;
		}
		
		proto._cl_applyDefaults = function(defaults){
			var children = im.XMLUtils.children(defaults);
			for (var x = 0, xl = children.length; x < xl; x++) {
				var thisNode = children[x];
				if(im.XMLUtils.localName(thisNode) === this._cl_viewName){
					this._cl_applyAttributes(thisNode);
				}
			}
		}
		
		proto._cl_applyAttributes = function(xmlNode){
			var x, y, attr, attrName, recipient;
			//loop through the attributes on the xmlNode
			for (var x = 0, y = xmlNode.attributes.length; x < y; x++) {
				attr = xmlNode.attributes[x];
				//if it's not 'id', apply it to the view
				attrName = im.XMLUtils.localName(attr);
				if(attrName !== 'id' && im.XMLUtils.getPrefix(attr) !== im.ViewDefParser._cl_nsPrefix){
					//if this view has a controller, try to set the property/method on the controller, but fall back to the view itself
					recipient = (this._cl_view._cl_controller && typeof this._cl_view._cl_controller[im.XMLUtils.localName(attr)] !== 'undefined') ? this._cl_view._cl_controller : this._cl_view;
					if (typeof recipient[attrName] === 'function') {
						//if this property hasn't been cached yet, do so before setting it
						if (!recipient._cl_viewDefDefaults[attrName])
							recipient._cl_viewDefDefaults[attrName] = recipient[attrName].apply(recipient, this._cl_getParamsForRetrievingDefault(attrName));
						recipient[attrName].apply(recipient, im.ViewDefParser.processAttribute(attr.value));
					} else {
						//if this property hasn't been cached yet, do so before setting it
						if(!recipient._cl_viewDefDefaults[attrName])
							recipient._cl_viewDefDefaults[attrName] = recipient[attrName];
						recipient[attrName] = im.ViewDefParser.processAttribute(attr.value)[0];
					}
				}
			}
		}
		
		proto._cl_getParamsForRetrievingDefault = function(attrName){
			switch(attrName){
				case 'width':
				case 'height':
					return ['value'];
				default:
					return [];
			}
		}
		
		proto._cl_compileCustomNodes = function(obj){
			var baseObj = obj || this._cl_view,
				descenderRef = baseObj.constructor,
				compiled = [];
			//if the list has already been compiled for this class, we don't have to do anything
			if(im.Utils.isArray(baseObj.constructor._cl_customViewDefNodes))
				return baseObj.constructor._cl_customViewDefNodes;
			//otherwise, climb the family tree
			while(descenderRef !== null) {
				var theseNodes = descenderRef.customViewDefNodes || [];
				Array.prototype.push.apply(compiled, theseNodes);
				descenderRef = descenderRef.superclass && descenderRef.superclass().constructor.namespace ? descenderRef.superclass().constructor : null;
			}
			baseObj.constructor._cl_customViewDefNodes = compiled;
			return compiled;
		}
		
		proto._cl_convertNodeToObject = function(node){
			var obj = {};
			obj._name = im.XMLUtils.localName(node);
			obj.node = node;
			for(var x = 0, y = node.attributes.length; x < y; x++){
				var thisAttr = node.attributes[x];
				obj[thisAttr.name] = im.ViewDefParser.processAttribute(thisAttr.value);
				if(obj[thisAttr.name].length === 1)
					obj[thisAttr.name] = obj[thisAttr.name][0];
			}
			node.setAttribute('_isCustomNode', 'true');
			return obj;
		}
	});



a5.Package("a5.cl.mvc.core")


	.Extends("a5.cl.CLMVCBase")
	.Class("Filters", 'singleton final', function(self){
		
		var filters;
		
		this.Filters = function(){
			self.superclass(this);
			filters = ['_cl_appPlaceholder'];
		}
		
		
		this.addFilter = function(params, $append){
			var append = $append || false;
			if(typeof append === 'number') filters.splice(append, 0, params);
			else if(append) filters.push(params);
			else filters.unshift(params);
		}
		
		this.addAppFilters = function($filters){
			var placeHolderIndex;
			for(var i = 0, l=filters.length; i<l; i++){
				if(filters[i] === '_cl_appPlaceholder'){
					placeHolderIndex = i;
					filters.splice(i, 1);
					break;	
				}
			}
			if($filters)
				for (var i = 0, l=$filters.length; i < l; i++){
					this.addFilter($filters[i], placeHolderIndex);
					placeHolderIndex++;
				}
		}
	
		this.test = function(loading, unloading, callback){
			loopControllers(loading, 'before', function(valid){
				if (valid) {
					if (unloading) {
						loopControllers(unloading, 'after', function(valid){
							callback(valid);
						})
					} else {
						callback(true);
					}
				} else {
					callback(false);
				}				
			});
		}
		
		var loopControllers = function(sig, type, callback){
			var noTest = true;
			var isValid = true;	
			var count = 0;
			
			function continueLoop(){
				count++;
				loop();
			}
			
			function loop(){
				if (count < filters.length) {
					if (isValid) {				
						var filter = filters[count];
						if (testCondition(sig.controller, filter.controller)) {
							if (!sig.action || filter.action == null || filter.action == undefined || testCondition(sig.action, filter.action)) {
								noTest = false;
								executeFilter(sig, filter, type, function(valid){
									isValid = valid;
									continueLoop();
								});
							} else {
								continueLoop();
							}
						} else {
							continueLoop();
						}
					}
				} else {
					if(noTest) callback(true);
					else callback(isValid);		
				}
			}
			loop();
		}
	
		var testCondition = function(test, filterCondition){
			/*
			(controller:'*', action:'*') {
			} (controller:'foo', action:'*') {
			} (uri:'/foo/*') {
			} (uri:'/**') {
			}
			 */
			if(filterCondition == '*' || filterCondition == test) return true;
			else return false;
		}
		
		var executeFilter = function(sig, filterParams, type, callback){
			var hasMethod = false;
			if (filterParams[type]) {
				hasMethod = true;
				var methods = {
					pass:function(){
						callback(true);
					},
					fail:function(){
						callback(false);
					},
					hash:sig.hash,
					controller:sig.controller,
					action:sig.action,
					id:sig.id
				}
				filterParams[type].call(self, methods);
			}
			if(!hasMethod) callback(true);	
		}

	
});


a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.core.Instantiator')
	.Extends('a5.cl.CLMVCBase')
	.Class("Mappings", 'singleton final', function(self, im){

		var mappings,
			errorMappings,
			lastMapping = null,
			paramArray = ['controller', 'action', 'id'];
		
	
		this.Mappings = function(){
			self.superclass(this);
			mappings = ['_cl_appPlaceholder'];
			errorMappings = ['_cl_appPlaceholder'];
		}
		
		this.addMapping = function(mappingObj, $append){
			var append = $append || false,
				controller = mappingObj.controller ? im.Instantiator.instance().getClassInstance('Controller', mappingObj.controller, true):null;
			if(controller){
				if (!(controller instanceof a5.cl.CLController)) {
					this.throwError('Unable to instantiate the controller ' + mappingObj.controller);
					return;
				} else if (controller.instanceCount() > 1) {
					this.throwError('Cannot add a mapping to a controller with multiple instances (' + controller.namespace() + ').');
					return;
				}
				controller.setMappable();
			}
			
			if (typeof mappingObj.desc === 'number') {
				if (mappingObj.controller) {
					if(append) errorMappings.push(mappingObj);
					else errorMappings.unshift(mappingObj);
				}
			} else {
				if (typeof mappingObj.desc === 'string') {
					mappingObj.desc = mappingObj.desc.split('/');
					if(mappingObj.desc[0] === "")
						mappingObj.desc.shift();
				} else {
					self.throwError('invalid mapping: "desc" param must be a string');
				}
				if(typeof append === 'number') mappings.splice(append, 0, mappingObj);
				else if(append) mappings.push(mappingObj);
				else mappings.unshift(mappingObj);
			}
		}
		
		this.addAppMappings = function($mappings){
			var placeHolderIndex,
				errorPlaceHolderIndex;
			for(var i = 0, l=mappings.length; i<l; i++){
				if(mappings[i] === '_cl_appPlaceholder'){
					placeHolderIndex = i;
					mappings.splice(i, 1);
					break;	
				}
			}
			for(var i = 0, l=errorMappings.length; i<l; i++){
				if(errorMappings[i] === '_cl_appPlaceholder'){
					errorPlaceHolderIndex = i;
					errorMappings.splice(i, 1);
					break;	
				}
			}
			if($mappings)
				for (var i = 0, l=$mappings.length; i < l; i++){
					if(typeof $mappings[i].desc === 'number'){
						this.addMapping($mappings[i], errorPlaceHolderIndex);
						errorPlaceHolderIndex++;
					} else {
						this.addMapping($mappings[i], placeHolderIndex);
						placeHolderIndex++;
					}
				}
		}
		
		this.getCallSignature = function(hashArray){
			var matchedSig = matchSignature(hashArray);
			if (matchedSig) {
				matchedSig.hash = hashArray.join('/');
				lastMapping = matchedSig;
				return matchedSig;
			} else return null; 
		}
		
		this.geLastCallSignature = function(){
			return lastMapping;
		}
		
	
		this.getErrorSignature = function(num){
			for (var i = 0, l=errorMappings.length; i<l; i++)
				if(errorMappings[i].desc == num)
					return {controller:errorMappings[i].controller, action:errorMappings[i].action, id:errorMappings[i].id }
			return null;
		}
		
		var matchSignature = function(param){
			var hashArray = (typeof param == 'object' ? param:[param]);
			for(var prop in hashArray)
				if(hashArray[prop] == undefined)
					hashArray[prop] = "";
			if(!hashArray.length) hashArray = [""];
			var retSig = null;
			for (var i = 0, l=mappings.length; i < l; i++) {
				var matchData = runMatchAlgorithm(mappings[i], hashArray);
				if (matchData) {
					var sigObj = {
						controller:mappings[i].controller,
						action:mappings[i].action,
						id:mappings[i].id
					};
					for (var prop in matchData) 
						if (sigObj[prop] == undefined) 
							sigObj[prop] = matchData[prop];			
					var passedConstraints = true;
					if (mappings[i].constraints) passedConstraints = mappings[i].constraints(sigObj.controller, sigObj.action, sigObj.id);
					if (passedConstraints) retSig = sigObj;
				}
				if(retSig) break;
			}
			return retSig;
		}
		
		var runMatchAlgorithm = function(mapping, hashArray){
			var retObj = {};
			var isValid = false;
			var hasIDProps = false;
			for (var i = 0, l= mapping.desc.length; i <l; i++) {
				var isDirect = mapping.desc[i].indexOf(':') == 0;
				if (isDirect) {
					var isOptional = mapping.desc[i].indexOf('?') == mapping.desc[i].length - 1;
					var foundProp = false;
					for (var j = 0, m = paramArray.length; j < m; j++) {
						if (!foundProp) {
							if (mapping.desc[i].substr(1, mapping.desc[i].length - (isOptional ? 2 : 1)) == paramArray[j]) {
								foundProp = isValid = true;
								if (i >= hashArray.length) {
									if (!isOptional) isValid = false;
								} else {
									if (paramArray[j] == 'id') {
										if (hashArray.length === 1 && hashArray[0] === "" && !isOptional) {
											isValid = false;
										} else {
											retObj.id = hashArray.slice(i);
											hasIDProps = true;
										}
									} else retObj[paramArray[j]] = hashArray[i];
								}
							} else {
								if (!isOptional) isValid = false;
							}
						}
					}
				} else {
					isValid = (i < hashArray.length && mapping.desc[i] == hashArray[i]);
					if (!isValid) return null;
				}
			}
			if(isValid){
				if (!hasIDProps && hashArray.length > mapping.desc.length) {
					return null;
				} else {
					for (var i = 0, l = paramArray.length; i < l; i++) {
						if (mapping[paramArray[i]]) 
							retObj[paramArray[i]] = mapping[paramArray[i]];
					}
					return retObj;
				}
			} else {
				return null;
			}
		}

	
});

a5.Package('a5.cl.mvc.core')

	.Extends('a5.cl.CLMVCBase')
	.Class('GarbageCollector', 'singleton final', function(self, im){

		var recycleBin = document.createElement('div'),
			gcElemCount = 0,
			capacity = 10;
		
		this.GarbageCollector = function(){
			self.superclass(this);
		}
		
		this.destroyElement = function(elem, force){
			if(!a5.cl.core.Utils.isArray(elem))
				elem = [elem];
			for(var x = 0, y = elem.length; x < y; x++)
				addElemToRecycleBin(elem[x]);
			
			if (gcElemCount >= capacity || force === true) {
				recycleBin.innerHTML = "";
				gcElemCount = 0;
			}
		}
		
		var addElemToRecycleBin = function(elem){
			try {
				recycleBin.appendChild(elem);
				gcElemCount++;
			} catch (e) {
				//the element must not have been a valid HTMLElement, but there's not currently an efficient cross-browser way to check before-hand.
			}
		}
	});




a5.Package('a5.cl.mvc.mixins')

	.Mixin('CSS3Props', function(mixin){
	
		mixin.MustExtend('a5.cl.CLView');
		
		mixin.CSS3Props = function(){
		}
		
		mixin._cl_processCSS3Prop = function(prop, check, value){
			if(value === true)
				return a5.cl.initializers.dom.Utils.getCSSProp(prop) !== null;
			return this._cl_css(prop, value, true);
		}
		
		/**
		 * @name rotation
		 * @param {Object} value
		 */
		mixin.rotation = function(value){
			return this._cl_processCSS3Prop('transform', (value === true), 'rotate(' + value + 'deg)', true);
		}	
		
		mixin.maskImage = function(value){
			return this._cl_processCSS3Prop('maskImage', (value === true), 'url(' + value + ')', true);
		}
		
		mixin.shadow = function(value){
			return this._cl_processCSS3Prop('boxShadow', (value === true), value, true);
		}
		
		
})



/**
 * @class Implements a view with a direct html draw area.
 * @name a5.cl.CLHTMLView
 * @extends a5.cl.CLView
 */
a5.Package('a5.cl')
	
	.Import('a5.cl.CLEvent')
	.Static(function(CLHTMLView){
		
		CLHTMLView.CONTENT_UPDATED = 'clHTMLViewContentUpdated';
	})
	.Extends('CLView')
	.Prototype('CLHTMLView', function(proto, im, CLHTMLView){
		
		CLHTMLView.customViewDefNodes = ['HTML'];
		
		/**#@+
	 	 * @memberOf a5.cl.CLHTMLView#
	 	 * @function
		 */
		
		this.Properties(function(){
			this._cl_pendingWrapperProps = {};
			this._cl_currentWrapperProps = {};
			this._cl_handleAnchors = false;
			this._cl_disallowHrefs = false;
			this._cl_scrollWidth = null;
			this._cl_scrollHeight = null;
			this._cl_cachedHTML = null;
			this._cl_loadURL = null;
			this._cl_clickHandlingEnabled = false;
			this._cl_isInDocument = false;
			this._cl_htmlViewReady = false;
		});
		
		proto.CLHTMLView = function(val, isURL){
			proto.superclass(this);
			this.clickHandlingEnabled(true);
			this.width('100%').height('100%');
			if (val !== undefined) {
				if(isURL)
					this.loadURL(val);
				else
					this.drawHTML(val);
			}
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.call(this);
			if (this._cl_cachedHTML !== null) {
				this.drawHTML(this._cl_cachedHTML);
				this._cl_cachedHTML = null;
			}
		}
		
		proto.Override.processCustomViewDefNode = function(nodeName, node, imports, defaults, rootView){
			if(nodeName === 'HTML'){
				if(this.viewIsReady())
					this.drawHTML(node.node.textContent);
				else	
					this._cl_cachedHTML = node.node.textContent;
			} else {
				self.superclass().processCustomViewDefNode.apply(this, arguments);
			}
		}
		
		/**
		 * Returns the html wrapper dom element for direct dom manipulation.
		 * @name htmlWrapper
		 * @return [DOMElement] wrapper
		 */
		proto.htmlWrapper = function(){
			return this._cl_viewElement;
		}
		
		proto.elemID = function(id){
			this._cl_viewElement.id = id;
		}
		
		proto.htmlViewReady = function(){
			return this._cl_htmlViewReady;
		}
		
		/**
		 * If true, clicks are processed, which enabled the functionality for handleAnchors and handleHrefClick().  Defaults to true.
		 * 
		 * @name clickHandlingEnabled
		 * @param {Object} value
		 */
		proto.clickHandlingEnabled = function(value){
			if(typeof value === 'boolean'){
				if(value !== this._cl_clickHandlingEnabled)
					var self = this;
					this._cl_viewElement.onclick = !value ? null : function(e){
						self._cl_handleClicks.call(self, e || window.event);
					};
				this._cl_clickHandlingEnabled = value;
				return this;
			}
			return this._cl_clickHandlingEnabled;
		}
		
		proto._cl_handleClicks = function(e){
			var targetElem = e.target || e.srcElement,
				href, anchorIndex, anchorValid;
			if (targetElem && targetElem.tagName.toUpperCase() === 'A') {
				href = targetElem.href;
				anchorIndex = href ? href.indexOf('#') : null;
				anchorValid = false;
				if(typeof href !== 'undefined'){
					if (anchorIndex === 0 || href.substr(0, anchorIndex - 1) === this.DOM().appPath(true)) 
						anchorValid = true;
					if (this._cl_handleAnchors && anchorValid) {
						this.scrollToAnchor(href.substr(anchorIndex + 1));
						return false;
					} else {
						if (this._cl_disallowHrefs) 
							return false;
						return this.handleHrefClick(href);
					}
				}
			}
		}
		
		/**
		 * @name handleAnchors
		 * @param {Boolean} value
		 */
		proto.handleAnchors = function(value){
			if(typeof value === 'boolean'){
				this._cl_handleAnchors = value;
			}
			return this._cl_handleAnchors;
		}
		
		/**
		 * @name scrollToAnchor
		 * @param {Object} anchor
		 */
		proto.scrollToAnchor = function(anchor){
			var anchors = this._cl_viewElement.getElementsByTagName('a'),
				anchorElem, i, l;
			for(i = 0, l=anchors.length; i<l; i++){
				if(anchors[i].getAttribute('name') === anchor){
					anchorElem = anchors[i];
					break;
				}
			}
			try {
				if (anchorElem) {
					var topVal = 0;
					var obj = anchorElem;

					do {
					 if (obj == this._cl_viewElement) break;
					 topVal += obj.offsetTop;
					 } while (obj = obj.parentNode);
					 this.parentView().scrollY(topVal - anchorElem.offsetHeight)
				}
			} catch(e){
				
			}
		}
		
		/**
		 * @name disallowHrefs
		 * @param {Object} value
		 */
		proto.disallowHrefs = function(value){
			if(typeof value === 'boolean'){
				this._cl_disallowHrefs = value;
			}
			return this._cl_disallowHrefs;
		}
		
		/**
		 * @name handleHrefClick
		 * @param {Object} href
		 */
		proto.handleHrefClick = function(href){
			return true;
		}
		
		/**
		 * Draws an html value to the associated element.
		 * @name drawHTML
		 * @param {String} value The html to display.
		 */
		proto.drawHTML = function(value, data){
			this._cl_htmlViewReady = false;
			//coerce value to a space if empty string to deal with errors in node replacement validation
			if(value === "")
				value = " ";
			if(data && typeof data === 'object'){
				var plgn = this.plugins().getRegisteredProcess('htmlTemplate');
				if(plgn)
					value = plgn.populateTemplate(value, data);
			}
			this._cl_replaceNodeValue(this._cl_viewElement, value);
			return this;
		}
		
		proto.drawElement = function(elementType){
			var addStyle = elementType !== 'input',
				elemID = this.instanceUID() + '_CLHtmlViewElement',
				elem = document.createElement(this._qbr_elementType);
				elem.id = elemID;
			if (addStyle) {
				elem.style.height = '100%';
				elem.style.width = '100%';
			}
			this.drawHTML(elem);
			return elemID;
		}
		
		proto.loadURL = function(url){
			this._cl_htmlViewReady = false;
			if (typeof url == 'string') {
				this._cl_loadURL = url;
				var self = this;
				this.cl().initializer().load(url, function(value){
					self.drawHTML(value);
				})
				return this;
			}
			return this._cl_loadURL;
		}
		
		/**
		 * Clears the html wrapper.
		 */
		proto.clearHTML = function(){
			while(this._cl_viewElement.childNodes.length)
				this._cl_destroyElement(this._cl_viewElement.firstChild);
			this.htmlUpdated();
			return this;
		}
		
		/**
		 * Appends an HTML element to the html wrapper.
		 * @name appendChild
		 * @param {HTMLElement} value The HTML element to append.
		 */
		proto.appendChild = function(value){
			this._cl_viewElement.appendChild(value);
			this.htmlUpdated();
			return this;
		}
		
		/**
		 * @name css
		 * @param {String} prop
		 * @param {String} value
		 * @param [Boolean] getBrowserImplementation=true
		 */
		proto.css = function(prop, value, getBrowserImplementation){
			getBrowserImplementation = getBrowserImplementation || false;
			if(getBrowserImplementation)
				prop = a5.cl.initializers.dom.Utils.getCSSProp(prop);
			if(prop)
			this._cl_viewElement.style[prop] = value;
			return this;
		}
		
		/**
		 * @name cssClass
		 * @param {String} [value]
		 */
		proto.cssClass = function(value){
			if (typeof value === 'string') {
				this._cl_viewElement.className = value;
				return this;
			}
			return this._cl_viewElement.className;
		}
		
		/**
		 * @name htmlUpdated
		 */
		proto.htmlUpdated = function(clearScroll){
			if(clearScroll !== false)
				this._cl_scrollWidth = this._cl_scrollHeight = null;
			if ((this._cl_height.auto || this._cl_width.auto) && this.parentView())
				this.parentView().redraw();
		}
		
		proto.Override.width = function(value){
			if (value === 'scroll' || value === 'content') {
				//if(typeof this._cl_scrollWidth !== 'number')
				this._cl_scrollWidth = this._cl_viewElement.scrollWidth - this._cl_calculatedClientOffset.width;
				return value === 'content' ? this._cl_scrollWidth : Math.max(this._cl_scrollWidth + this._cl_calculatedClientOffset.left + this._cl_calculatedOffset.left, this.width('offset'));
			}
			return proto.superclass().width.apply(this, arguments);
		}
		
		proto.Override.height = function(value){
			if (value === 'scroll' || value === 'content') {
				//if (typeof this._cl_scrollHeight !== 'number') 
				this._cl_scrollHeight = this._cl_viewElement.scrollHeight - this._cl_calculatedClientOffset.height;
				return value === 'content' ? this._cl_scrollHeight : Math.max(this._cl_scrollHeight + this._cl_calculatedClientOffset.top + this._cl_calculatedOffset.top, this.height('offset'));
			} 
			return proto.superclass().height.apply(this, arguments);
			
		}
		
		proto.Override._cl_redraw = function(force, suppressRender){
			var redrawVals = proto.superclass()._cl_redraw.call(this, force, true);
			if (redrawVals.shouldRedraw) {
				this._cl_pendingViewElementProps.paddingTop = this._cl_calculatedClientOffset.top + 'px';
				this._cl_pendingViewElementProps.paddingRight = this._cl_calculatedClientOffset.right + 'px';
				this._cl_pendingViewElementProps.paddingBottom = this._cl_calculatedClientOffset.bottom + 'px';
				this._cl_pendingViewElementProps.paddingLeft = this._cl_calculatedClientOffset.left + 'px';
				this._cl_pendingViewElementProps.width = Math.max(0, this._cl_intFromPX(this._cl_pendingViewElementProps.width) - this._cl_calculatedClientOffset.width) + 'px';
				this._cl_pendingViewElementProps.height = Math.max(0, this._cl_intFromPX(this._cl_pendingViewElementProps.height) - this._cl_calculatedClientOffset.height) + 'px';
				
				if(suppressRender !== true)
					this._cl_render();
				
				if(!this._cl_isInDocument && a5.cl.initializers.dom.Utils.elementInDocument(this._cl_viewElement)) {
					this._cl_isInDocument = true;
					if (this._cl_viewElement.innerHTML !== "" && (this._cl_width.auto || this._cl_height.auto)){
						var nodes = [];
						for(var x = 0, y = this._cl_viewElement.childNodes.length; x < y; x++){
							nodes.push(this._cl_viewElement.childNodes[x]);
						}
						this._cl_replaceNodeValue(this._cl_viewElement, nodes);
					}
						
				}
			}
			return redrawVals;
		}
		
		proto._cl_intFromPX = function(value){
			return parseInt(value.replace(/px$/i, ''));
		}
		
		proto._cl_dispatchUpdated = function(){
			var self = this;
			//Async is necessary to account for variances in browser rendering updates
			this.async(function(){
				this._cl_htmlViewReady = true;
				this.dispatchEvent(CLHTMLView.CONTENT_UPDATED);
			}, null, 200);
		}
		
		proto._cl_replaceNodeValue = function(node, value){
			var self = this,
				asyncCall = null,
				checkUpdated = function(){
					if (node.innerHTML !== "") {
						//if auto width/height, set back to auto
						if(autoWidth) node.style.width = 'auto';
						if(autoHeight) node.style.height = 'auto';
						asyncCall.cancel();
						self._cl_dispatchUpdated.call(self);
						self.htmlUpdated.call(self, false);
					}
				};
			
			//if auto width/height, change auto to zero
			var autoWidth = (node === this._cl_viewElement) ? this._cl_width.auto : (node.style.width === 'auto'),
				autoHeight = (node === this._cl_viewElement) ? this._cl_height.auto : (node.style.height === 'auto');
			if(autoWidth) node.style.width = 0;
			if(autoHeight) node.style.height = 0;
			
			while(node.childNodes.length)
				node.removeChild(node.firstChild);
			
			this._cl_scrollWidth = this._cl_scrollHeight = null;
			
			if (value != '') {
				asyncCall = this.async(checkUpdated, null, .2);
			} else {
				self._cl_dispatchUpdated();
				this.htmlUpdated(false);
			}
			if (typeof value == 'string') {
				node.innerHTML = value;
			} else {
				if (a5.cl.core.Utils.isArray(value)) {
					while(value.length)
						node.appendChild(value.shift());
				} else {
					node.appendChild(value);
				}
				//if auto width/height, set back to auto
				if(autoWidth) node.style.width = 'auto';
				if(autoHeight) node.style.height = 'auto';
			}
		}
		
		proto.dealloc = function(){
			this._cl_viewElement.onclick  = null;
		}
});



/**
 * @class Adds subview ownership and management capabilities to view elements.
 * @name a5.cl.CLViewContainer
 * @extends a5.cl.CLView
 */
a5.Package('a5.cl')
	.Extends('CLView')
	.Import('a5.ContractAttribute',
			'a5.cl.mvc.CLViewContainerEvent')
	.Static(function(CLViewContainer){
		CLViewContainer.redrawLog = {};
		
		CLViewContainer.logRedraw = function(view){
			var uid = view.instanceUID();
			if(CLViewContainer.redrawLog[uid])
				CLViewContainer.redrawLog[uid]++;
			else
				CLViewContainer.redrawLog[uid] = 1;
		}
		
		CLViewContainer.getRedrawCounts = function(){
			var redrawArray = [];
			for(var prop in CLViewContainer.redrawLog){
				redrawArray.push({id:prop, count:CLViewContainer.redrawLog[prop]});
			}
			redrawArray.sort(function(a, b){
				return b.count - a.count;
			});
			for(var x = 0, y = redrawArray.length; x < y; x++){
				var thisCount = redrawArray[x];
			}
		}
		
		CLViewContainer.clearRedrawLog = function(){
			CLViewContainer.redrawLog = {};
		}
		
		CLViewContainer.viewAffectsAutoWidth = function(view){
			return (view.visible() && view._cl_width.percent === false && view._cl_width.relative === false && view._cl_alignX !== 'right') || (view._cl_minWidth !== null && view._cl_width.inner <= view._cl_minWidth);
		}
		
		CLViewContainer.viewAffectsAutoHeight = function(view){
			return (view.visible() && view._cl_height.percent === false && view._cl_height.relative === false && view._cl_alignY !== 'bottom') || (view._cl_minHeight !== null && view._cl_height.inner <= view._cl_minHeight);
		}
	})
	.Prototype('CLViewContainer', function(proto, im, CLViewContainer){
		
		/**#@+
	 	 * @memberOf a5.cl.CLViewContainer#
	 	 * @function
		 */	
		 
		this.Properties(function(){
			this._cl_childViews = [];
			this._cl_queuedLoads = [];
			this._cl_relX = false;
			this._cl_relY = false;
			this._cl_outerW = null;
			this._cl_outerH = null;
			this._cl_lockedVal = false;
			this._cl_pendingChildren = 0;
			this._cl_isInitialVDReady = true;
			this._cl_constrainChildren = false;
			this._cl_scrollXEnabled = {value:false, state:false};
			this._cl_scrollYEnabled = {value:false, state:false};
			this._cl_passDataToChildren = true;
			this._cl_passedData = null;
			this._cl_scrollLeftVal = null;
			this._cl_scrollTopVal = null;
			this._cl_childViewTarget = this;
		})
		
		proto.CLViewContainer = function(){
			proto.superclass(this); 
		}
		
		/**
		 * Forces direct child views to constrain width/height values to the max vals of the view.
		 *  @name constrainChildren
		 *  @param {Boolean} [value]
		 */
		proto.constrainChildren = function(value){ return this._cl_propGetSet('_cl_constrainChildren', value); }
		
		/**
		 * @name passDataToChildren
		 * @param {Object} value
		 */
		proto.passDataToChildren = function(value){ return this._cl_propGetSet('_cl_passDataToChildren', value); }
		
		proto.Override.renderFromData = function(data){
			if(this._cl_passDataToChildren){
				this._cl_passedData = data;
				for(var i = 0, l = this._cl_childViews.length; i<l; i++)
					this._cl_childViews[i].renderFromData(data);				
			}
			a5.cl.CLViewContainer.superclass().renderFromData.apply(this, arguments);
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.relX = function(value){
			if (value !== undefined) {
				this._cl_relX = value;
				if (value === false) {
					for (var i = 0, l = this._cl_childViews.length; i < l; i++)
						this._cl_childViews[i]._cl_x.state = false;
				}
				this.redraw();
				return this;
			}
			return this._cl_relX;
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.relY = function(value){
			if (value !== undefined) {
				this._cl_relY = value;
				if (value === false) {
					for (var i = 0, l = this._cl_childViews.length; i < l; i++)
						this._cl_childViews[i]._cl_y.state = false;
				}
				this.redraw();
				return this;
			}
			return this._cl_relY;
		}
		
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.scrollXEnabled = function(value){
			if (value !== undefined) {
				if(value === 'state') 
					return this._cl_scrollXEnabled.state;
				this._cl_scrollXEnabled.value = value;
				return this;
			}
			return this._cl_scrollXEnabled.value;
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.scrollYEnabled = function(value){
			if (value !== undefined) {
				if(value === 'state') 
					return this._cl_scrollYEnabled.state;
				this._cl_scrollYEnabled.value = value;
				return this;
			}
			return this._cl_scrollYEnabled.value;
		}
		
		/**
		 * 
		 * @param {Number|a5.cl.CLView} val
		 */
		proto.scrollY = function(val, offset){
			if(val !== undefined){
				var setVal;
				if(typeof val === 'number')
					setVal = val;
				else 
					setVal = val.y(true);
				if(offset !== undefined)
					setVal += offset;
				this._cl_scrollTopVal = setVal;
				this.redraw();
				return setVal;
			} else {
				return this._cl_viewElement.scrollTop;
			}
		}
		
		/**
		 * 
		 * @param {Number|a5.cl.CLView} val
		 */
		proto.scrollX = function(val, offset){
			if(val !== undefined){
				var setVal;
				if(typeof val === 'number')
					setVal = val;
				else 
					setVal = val.y(true);
				if(offset !== undefined)
					setVal += offset;
				this._cl_scrollLeftVal = setVal;
				this.redraw();
				return setVal;
			} else {
				return this._cl_viewElement.scrollLeft;
			}
			
		}
		
		/**
		 * 
		 */
		proto.subViewCount = function(){
			return this._cl_childViewTarget._cl_childViews.length;
		}
		
		/**
		 * 
		 * @param {Object} id
		 */
		proto.subViewAtIndex = function(id){
			return this._cl_childViewTarget._cl_childViews[id];
		}
		
		/**
		 * 
		 * @param {Object} id
		 */
		proto.subViewWithName = function(name){
			for (var i = 0, l=this._cl_childViewTarget._cl_childViews.length; i<l; i++){
				if(this._cl_childViewTarget._cl_childViews[i].mvcName() == name)
					return this._cl_childViewTarget._cl_childViews[i];
			}
			return null;
		}
		
		/**
		 * 
		 * @param {Object} view
		 */
		proto.subViewToTop = function(view){
			if (!this._cl_childViewTarget._cl_lockedVal) {
				this._cl_childViewTarget._cl_childViews.splice(view.index(), 1);
				this._cl_childViewTarget._cl_childViews.push(view);
				this._cl_childViewTarget._cl_orderChildren();
			} else {
				this._cl_throwLockedError();
			}
		}
		
		/**
		 * 
		 * @param {Object} view
		 */
		proto.subViewToBottom = function(view){
			if (!this._cl_childViewTarget._cl_lockedVal) {
				this._cl_childViewTarget._cl_childViews.splice(view.index(), 1);
				this._cl_childViewTarget._cl_childViews.unshift(view);
				this._cl_childViewTarget._cl_orderChildren();
			} else {
				this._cl_throwLockedError();
			}
		}
		
		/**
		 * 
		 */
		proto._cl_orderChildren = function(){
			var changed = false;
			for (var i = 0, l = this._cl_childViews.length; i < l; i++) {
				var childView = this._cl_childViews[i],
					thisElem = childView._cl_viewElement;
				if (thisElem.parentElement !== this._cl_viewElement) {
					changed = true;
					this._cl_viewElement.appendChild(thisElem);
				}
				if (childView._cl_pendingViewElementProps.zIndex !== i) {
					changed = true;
					childView._cl_pendingViewElementProps.zIndex = i;
				}
			}
			if(changed)
				this.redraw();
		}
		
		proto._cl_addChildView = function(view, $index, callback){
			if (!this._cl_lockedVal) {
				if(!(this instanceof a5.cl.mvc.core.WindowContainer) && view instanceof a5.cl.CLWindow){
					this.throwError('Cannot add a CLWindow to a generic view container.');
					return;
				}
				if(view.parentView() instanceof a5.cl.CLViewContainer && view.parentView() !== this)
					view.parentView().removeSubView(view, false);
				var index = (typeof $index == 'number') ? $index:null;
				if(index > this._cl_childViews.length-1) index = null;
				this.willAddView();
				view.draw(this);
				this.viewAdded();
				view._cl_addedToParent(this);
				if(callback) callback(view);
				if(index !== null) this._cl_childViews.splice(index, 0, view)
				else this._cl_childViews.push(view);
				view._cl_setParent(this);
				this._cl_orderChildren();
				if(this._cl_passDataToChildren && this._cl_passedData)
					view.renderFromData(this._cl_passedData)
			} else {
				this._cl_throwLockedError();
			}
		}
		
		proto.containsSubView = function(view){
			for (var i = 0, l = this._cl_childViewTarget._cl_childViews.length; i < l; i++) {
				if(this._cl_childViewTarget._cl_childViews[i] == view)
					return true;
			}
			return false;
		}
		
		/**
		 * 
		 * @param {Object} view
		 */
		proto.removeSubView = function(view, $shouldDestroy){
			if (!this._cl_childViewTarget._cl_lockedVal) {
				var shouldDestroy = $shouldDestroy === false ? false : true;
				for (var i = 0, l = this._cl_childViewTarget._cl_childViews.length; i < l; i++) {
					if (this._cl_childViewTarget._cl_childViews[i] === view) {
						this.willRemoveView(view);
						this.dispatchEvent(a5.cl.mvc.CLViewContainerEvent.WILL_REMOVE_VIEW, {view:view});
						this._cl_childViewTarget._cl_childViews.splice(i, 1);
						view._cl_parentView = null;
						view._cl_removedFromParent(this);
						if(view._cl_viewElement && view._cl_viewElement.parentNode === this._cl_viewElement)
							this._cl_childViewTarget._cl_viewElement.removeChild(view._cl_viewElement);
						this.viewRemoved(view);
						this.dispatchEvent(a5.cl.mvc.CLViewContainerEvent.VIEW_REMOVED, {view:view});
						if (shouldDestroy === true) view.destroy();
						if(this._cl_childViewTarget._cl_relX || this._cl_childViewTarget._cl_relY || this._cl_childViewTarget._cl_width.auto || this._cl_childViewTarget._cl_height.auto)
							this.redraw();
						return;
					}
				}
				//throw 'Error removing subview ' + view.mvcName() + ', subview is not a child of the view container.';
				this.warn('Unable to remove subview ' + (view.id() || view.instanceUID()) + '.  Subview is not a child of the view container.');
			} else {
				this._cl_throwLockedError();
			}
		}
		
		proto.removeAllSubViews = function(shouldDestroy){
			while(this.subViewCount())
				this.removeViewAtIndex(0, shouldDestroy);
			return this;
		}
		
		/**
		 * 
		 * @param {Number} id
		 */
		proto.removeViewAtIndex = function(id, shouldDestroy){
			var view = this._cl_childViewTarget._cl_childViews[id];
			this.removeSubView(view, shouldDestroy);
		}
		
		/**
		 * 
		 * @param {Object} replacedView
		 * @param {Object} newView
		 */
		proto.replaceView = function(replacedView, newView){
			var replaceView;
			for (var i = 0, l=this._cl_childViewTarget._cl_childViews.length; i<l; i++){
				if(this._cl_childViewTarget._cl_childViews[i] === replaceView) 
					replaceView = this._cl_childViewTarget._cl_childViews[i];
					break;
			}
			if(replaceView)
				this.replaceViewAtIndex(newView, replaceView.index());
			else
				this.redirect(500, "cannot replace view " + (replaceView.id() || replaceView.instanceUID()) + ", view is not a child of container " + this.instanceUID());
		}
		
		/**
		 * 
		 * @param {Object} index
		 * @param {Object} newView
		 */
		proto.replaceViewAtIndex = function(newView, index){
			this.removeViewAtIndex(index);
			this.addSubViewAtIndex(newView, index);
		}
		
		/**
		 * 
		 * @param {Number} index_1
		 * @param {Number} index_2
		 */
		proto.swapViewsAtIndex = function(index_1, index_2){
			if (!this._cl_lockedVal) {
				var inst = this._cl_childViewTarget._cl_childViews, length = inst.length;
				if (index_1 < 0) index_1 = 0;
				if (index_2 < 0) index_2 = 0;
				if (index_1 > length - 1) index_1 = length - 1;
				if (index_2 > length - 1) index_1 = length - 1;
				if (index_1 != index_2) {
					var viewTemp = inst[index_1];
					inst[index_1] = inst[index_2];
					inst[index_2] = viewTemp;
					this._cl_childViewTarget._cl_orderChildren();
				}
			} else {
				this._cl_throwLockedError();
			}
		}
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubView
		 * @param {a5.cl.CLView|Object} view
		 * @param {Function} [callback]
		 */
		proto.addSubView = this.Attributes(
			["Contract", {view:'a5.cl.CLView', callback:'function=null'}],
			function(args){
				if (args)
					this._cl_childViewTarget._cl_addChildView(args.view, null, args.callback)
		})
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubViewAtIndex
		 * @param {a5.cl.CLView|Object} view
		 * @param {Number} index
		 * @param {Function} [callback]
		 */
		proto.addSubViewAtIndex = function(view, index, callback){
			this._cl_childViewTarget._cl_addChildView(view, index, callback)
			
		}
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubViewBelow
		 * @param {a5.cl.CLView|Object} view
		 * @param {a5.cl.CLView} refView
		 * @param {Function} [callback]
		 */
		proto.addSubViewBelow = function(view, refView, callback){
			this.addSubViewAtIndex(view, (parseInt(refView.index())-1), callback);
		}
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubViewAbove
		 * @param {a5.cl.CLView|Object} view
		 * @param {a5.cl.CLView} refView
		 * @param {Function} [callback]
		 */
		proto.addSubViewAbove = function(view, refView, callback){
			this.addSubViewAtIndex(view, (parseInt(refView.index())+1), callback);
		}
		
		proto.Override.width = function(val){
			if (val === 'scroll')
				return Math.max(this._cl_width.content + this._cl_calculatedClientOffset.left + this._cl_calculatedOffset.left, this._cl_width.offset);
			else
				return proto.superclass().width.apply(this, arguments);
		}
		
		proto.Override.height = function(val){
			if (val === 'scroll')
				return Math.max(this._cl_height.content + this._cl_calculatedClientOffset.top + this._cl_calculatedOffset.top, this._cl_height.offset);
			else
				return proto.superclass().height.apply(this, arguments);
		}
		
		proto.Override.suspendRedraws = function(value, inherited){
			if(typeof value === 'boolean') {
				for(var x = 0, y = this.subViewCount(); x < y; x++){
					this.subViewAtIndex(x).suspendRedraws(value, true);
				}
			}
			return proto.superclass().suspendRedraws.call(this, value);
		}
		
		proto.Override._cl_redraw = function(force, suppressRender){
			var forceChildren = this._cl_redrawPending,
				redrawVals = proto.superclass()._cl_redraw.call(this, force, true),
				scrollBarWidth = a5.cl.mvc.core.EnvManager.instance().scrollBarWidth(),
				shouldRedraw = im.CLView._cl_viewCanRedraw(this),
				contentWidthChanged = false,
				contentHeightChanged = false;
			if(shouldRedraw){
				//a5.cl.CLViewContainer.logRedraw(this);
				//if we're scrolling, adjust the inner sizes accordingly
				this._cl_width.inner = this._cl_width.client - (this._cl_scrollYEnabled.state ? scrollBarWidth : 0);
				this._cl_height.inner = this._cl_height.client - (this._cl_scrollXEnabled.state ? scrollBarWidth : 0);
				
				forceChildren = forceChildren || redrawVals.force;
				var outerW = 0, outerH = 0,
					view, prevView, maxW, maxH, i, l,
					shouldXScroll = false,
					shouldYScroll = false, 
					didXScrollChange = false, 
					didYScrollChange = false,
					percentChildren = [],
					prevView = null;
				for (i = 0, l = this._cl_childViews.length; i < l; i++) {
					view = this._cl_childViews[i];
					if (view.visible()) {
						if (((this._cl_height.auto || this._cl_scrollYEnabled.value) && view._cl_height.percent !== false) || ((this._cl_width.auto || this._cl_scrollXEnabled.value) && view._cl_width.percent !== false)) 
							percentChildren.push(view);
						if (this._cl_relX || this._cl_relY) {
							if (prevView) {
								if (this._cl_relX) 
									view._cl_x.state = prevView.x(true) + view.x() + prevView.width();
								if (this._cl_relY) 
									view._cl_y.state = prevView.y(true) + view.y() + prevView.height();
							} else {
								if (this._cl_relX) 
									view._cl_x.state = view.x();
								if (this._cl_relY) 
									view._cl_y.state = view.y();
							}
						}
						view._cl_redraw(force || forceChildren, true);
						
						if (CLViewContainer.viewAffectsAutoWidth(view)) {
							maxW = view.width() + view.x(true);
							if (maxW > outerW) 
								outerW = maxW;
						}
						if (CLViewContainer.viewAffectsAutoHeight(view)) {
							maxH = view.height() + view.y(true);
							if (maxH > outerH) 
								outerH = maxH;
						}
						prevView = view;
					}
				}
				//update the content width/height
				contentWidthChanged = this._cl_width !== outerW;
				contentHeightChanged = this._cl_height !== outerH;
				this._cl_height.content = outerH;
				this._cl_width.content = outerW;
				
				//redraw any percent-based children again so they'll be based on the new content size
				for(i = 0, l = percentChildren.length; i < l; i++) {
					view = percentChildren[i];
					if ((view._cl_width.percent !== false && contentWidthChanged) || (view._cl_height.percent !== false && contentHeightChanged))
						view._cl_redraw(force || forceChildren, true);
				}
				
				if (this._cl_width.auto !== false || this._cl_height.auto !== false){
					proto.superclass()._cl_redraw.call(this, true, true);
					this._cl_height.content = outerH;
					this._cl_width.content = outerW;
					this._cl_alertParentOfRedraw();
				}
				
				if (this._cl_scrollXEnabled.value && outerW > this._cl_width.client + this._cl_calculatedClientOffset.right) 
					shouldXScroll = true;
				if (this._cl_scrollYEnabled.value && outerH > this._cl_height.client + this._cl_calculatedClientOffset.bottom) 
					shouldYScroll = true;
				
				if( (this._cl_scrollXEnabled.value && this._cl_scrollYEnabled.value) 			// if both X and Y can scroll
					&&	scrollBarWidth > 0 														//and the scrollbar will actually take up space
					&& ((shouldXScroll && !shouldYScroll) || (shouldYScroll && !shouldXScroll)) //and only one direction is scheduled scroll right now
				){																				//then check if the other direction will need to scroll once the scrollbar is added
					if (shouldYScroll && (this._cl_width.client - scrollBarWidth) < outerW) 
						shouldXScroll = true;
					else if (shouldXScroll && (this._cl_height.client - scrollBarWidth) < outerH) 
						shouldYScroll = true;
				}
				
				//show or hide the scrollbars if necessary
				if (shouldYScroll !== this._cl_scrollYEnabled.state) {
					this._cl_scrollYEnabled.state = shouldYScroll;
					this._cl_pendingViewElementProps.overflowY = shouldYScroll ? 'auto' : (this._cl_showOverflow ? 'visible' : 'hidden');
					didYScrollChange = true;
				}
				if (shouldXScroll !== this._cl_scrollXEnabled.state) {
					this._cl_scrollXEnabled.state = shouldXScroll;
					this._cl_pendingViewElementProps.overflowX = shouldXScroll ? 'auto' : (this._cl_showOverflow ? 'visible' : 'hidden');
					didXScrollChange = true;
				}
				
				if(didYScrollChange || didXScrollChange)
					this._cl_pendingViewElementProps.webkitOverflowScrolling = (shouldXScroll || shouldYScroll) ? 'touch':'none';
				
				//if we're scrolling, adjust the inner sizes accordingly
				this._cl_width.inner = this._cl_width.client - (this._cl_scrollYEnabled.state ? scrollBarWidth : 0);
				this._cl_height.inner = this._cl_height.client - (this._cl_scrollXEnabled.state ? scrollBarWidth : 0);
				
				//redraw the children again, if necessary
				if (scrollBarWidth > 0 && (didXScrollChange || didYScrollChange)) {
					for (i = 0, l = this._cl_childViews.length; i < l; i++) 
						this._cl_childViews[i]._cl_redraw(true);
				} else {
					//if we're not redrawing the children one final time, then we must render them
					for (i = 0, l = this._cl_childViews.length; i < l; i++) 
						this._cl_childViews[i]._cl_render();
				}
				
				/*if ('ontouchstart' in window) {
					var prop = a5.core.Utils.getCSSProp('overflowScrolling');
					if (prop) 
						this._cl_pendingViewElementProps[prop] = 'touch';
				}*/
				
				if (suppressRender !== true) 
					this._cl_render();
			}
			return redrawVals;
		}
		
		proto.Override._cl_render = function(){
			proto.superclass()._cl_render.call(this);
			
			if (this._cl_scrollLeftVal) {
				this._cl_viewElement.scrollLeft = this._cl_scrollLeftVal;
				this._cl_scrollLeftVal = null;
			}
			
			if (this._cl_scrollTopVal) {
				this._cl_viewElement.scrollTop = this._cl_scrollTopVal;
				this._cl_scrollTopVal = null;
			}
		}
		
		proto._cl_locked = function(value){ return this._cl_propGetSet('_cl_lockedVal', value, 'boolean'); }
		
		proto._cl_throwLockedError = function(){
			this.redirect(500, 'Error: attempted to modify child views on a structure locked view.');
		}
		
		proto._cl_childRedrawn = function(child, changes){
			var autoWidth = this._cl_width.auto !== false && (changes.width || changes.x) && CLViewContainer.viewAffectsAutoWidth(child),
				autoHeight = this._cl_height.auto !== false && (changes.height || changes.y) && CLViewContainer.viewAffectsAutoHeight(child),
				relX = this._cl_relX && (changes.width || changes.x),
				relY = this._cl_relY && (changes.height || changes.y),
				scrollX = this._cl_scrollXEnabled.value && (changes.width || changes.x),
				scrollY = this._cl_scrollYEnabled.value && (changes.height || changes.y),
				alignY = child._cl_alignY !== 'top'  && (changes.height || changes.y),
				alignX = child._cl_alignX !== 'left'  && (changes.width || changes.x);
				
			if(autoWidth || autoHeight || relX || relY || scrollX || scrollY || alignX || alignY)
				this.redraw();
		}
		
		proto.Override._cl_addedToTree = function(){
			proto.superclass()._cl_addedToTree.call(this);
			for(var i=0; i<this.subViewCount(); i++)
				this.subViewAtIndex(i)._cl_addedToTree();
		}
		
		proto.Override._cl_removedFromTree = function(){
			proto.superclass()._cl_removedFromTree.call(this);
			for(var i=0; i<this.subViewCount(); i++)
				this.subViewAtIndex(i)._cl_removedFromTree();
		}		
		
		proto.getChildView = function(id){
			var x, y, thisChild, childFound;
			for(x = 0, y = this.subViewCount(); x < y; x++){
				thisChild = this.subViewAtIndex(x);
				if(thisChild._cl_controller)
					continue; //if this child has a controller, don't go any deeper
				if(thisChild.id() === id)
					return thisChild;
				childFound = thisChild instanceof CLViewContainer ? thisChild.getChildView(id) : false;
				if(childFound)
					return childFound;
			}
			return null;
		}
		
		proto.getChildViews = function(){
			return this._cl_childViews.slice(0);
		}
		
		proto.getMaximumViewDepth = function(){
			var maxDepth = 0;
			if(this.subViewCount() > 0){
				(function(parent, depth){
					depth++;
					if(depth > maxDepth)
						maxDepth = depth;
					for(var x = 0, y = parent.subViewCount(); x < y; x++){
						var thisChild = parent.subViewAtIndex(x);
						if(thisChild.subViewCount() > 0)
							arguments.callee.call(this, thisChild);
					}
				})(this, 0);
			}
			return maxDepth;
		}
		
		proto.Override._cl_vdViewReady = function(){
			this.childrenReady(this._cl_isInitialVDReady);
			this._cl_isInitialVDReady = this._cl_buildingFromViewDef = false;
			proto.superclass()._cl_vdViewReady.call(this);
		}
		
		proto._cl_vdViewAdded = function(){
			this._cl_pendingChildren--;
				if(this._cl_pendingChildren <= 0)
					this._cl_vdViewReady();
		}
		
		/**
		 * Called when all of the child views have finished loading.
		 * Note that this method will only be called if this view was generated from a view definition.
		 * @param {Boolean} initialCall  
		 */
		proto.childrenReady = function(initialCall){
			this.dispatchEvent(im.CLViewContainerEvent.CHILDREN_READY);
		};
		
		/**
		 * Called when a view is about to be added to the view container.
		 * @param {Object} e
		 * @param {Object} e.view
		 */
		proto.willAddView = function(e){}
		
		/**
		 * Called when a view is about to be removed from the view container.
		 * @param {Object} e
		 */
		proto.willRemoveView = function(e){}
		
		/**
		 * Called when a view has been successfully removed from the view container.
		 */
		proto.viewRemoved = function(){}
		
		/**
		 * Called when a view has been successfully loaded to the view container.
		 */
		proto.viewAdded = function(){}
		
		proto.dealloc = function(){
			this._cl_lockedVal = false;
			this.removeAllSubViews(true);
		}
});



/**
 * @class Base class for windows in the AirFrame CL framework.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLWindow
 * @extends a5.cl.CLViewContainer
 */
a5.Package('a5.cl')

	.Extends('CLViewContainer')
	.Prototype('CLWindow', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLWindow#
	 	 * @function
		 */
		
		this.Properties(function(){
			this._cl_windowLevel = a5.cl.CLWindowLevel.APPLICATION;
			this._cl_isRootWindow = false;
		});
		
		proto.CLWindow = function(){
			proto.superclass(this);
			this._cl_width.percent = this._cl_height.percent = 1;
			this._cl_width.value = this._cl_height.value = '100%';
			proto.backgroundColor.call(this, '#fff');
		}
		
		/**
		 * Returns whether the window is the root window in the window stack.
		 * @name isRootWindow
		 * @type Boolean
		 */
		proto.isRootWindow = function(){
			return this._cl_isRootWindow;
		}
		
		/**
		 * @name application
		 */
		proto.application = function(){
			return this.MVC().application();
		}
		
		proto.Override.moveToParentView = function(view){
			this.throwError('moveToParentView is not a valid manipulation method on a5.cl.CLWindow.');
		}
		
		/**
		 * @name didFinishLoading
		 * @description Called on the root window only when the application has completed launching.
		 * @params {CLApplication} application The application instance.
		 */
		proto.didFinishLoading = function(application){}

		proto.Override.hide = function(){
			if(!this.isRootWindow()) 
				a5.cl.CLWindow.superclass().hide.call(this);
		}
		
		proto._cl_setRootWindow = function(){ 
			this._cl_isRootWindow = true; 
		}
});

/**
 * @class 
 * @name a5.cl.CLWindowLevel
 */
a5.Package('a5.cl')

	.Static(function(CLWindowLevel){
		
		/**#@+
	 	 * @memberOf a5.cl.CLWindowLevel
	 	 * @constant
		 */
		
		/**
		 * @name APPLICATION
		 */
		CLWindowLevel.APPLICATION = 'Application';
		
		/**
		 * @name MODAL
		 */
		CLWindowLevel.MODAL = 'Modal';
		
		/**
		 * @name CONTEXT
		 */
		CLWindowLevel.CONTEXT = 'Context';
		
		/**
		 * @name ALERT
		 */
		CLWindowLevel.ALERT = 'Alert';
		
		/**
		 * @name SYSTEM
		 */
		CLWindowLevel.SYSTEM = 'System';
	})
	.Class('CLWindowLevel', function(){
		
})



/**
 * @class Base class for view controllers in the AirFrame CL framework.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLController
 * @extends a5.cl.CLBase
 */
a5.Package('a5.cl')
	.Import('a5.cl.core.viewDef.ViewDefParser')
	.Extends('CLMVCBase')
	.Mix('a5.cl.mixins.Binder')
	.Prototype('CLController', function(proto, im, CLController){
		
		CLController.ASSUME_XML_VIEW = 'clControllerAssumeXMLView'
		
		this.Properties(function(){
			this._cl_view = null;
			this._cl_mappable = false;
			this._cl_defaultViewDef = null;
			this._cl_viewDefDefaults = [];
			this._cl_viewDefParser = null;
			this._cl_viewDefCallback = null;
			this._cl_viewDefCallbackScope = null;
			this._cl_defaultViewDef = null;
			this._cl_viewReadyPending = true;
			this._cl_renderTarget = null;
			this._cl_orphanage = [];
			this._cl_childControllers = [];
			this._cl_id = null;
			this._cl_viewIsInTree = false;
		});
		
		/**#@+
	 	 * @memberOf a5.cl.CLController#
	 	 * @function
		 */	
		
		proto.CLController = function(defaultView){
			var inst = CLController.instance();
			if(inst && inst._cl_mappable){
				this.throwError('Cannot create multiple instances of a controller which has a mapping associated with it.');
				return;
			}
			
			proto.superclass(this);
			this._cl_setMVCName(this.className().replace('Controller', ''));
			if (defaultView === CLController.ASSUME_XML_VIEW) {
				this.defaultViewDefinition(CLController.ASSUME_XML_VIEW);
			} else if (typeof defaultView === 'string') {
				this.defaultViewDefinition(defaultView);
			} else if (defaultView instanceof a5.cl.CLView) {
				this._cl_viewCreated(defaultView);
				this._cl_viewReady();
			} else if(defaultView === true){
				this._cl_viewCreated(new a5.cl.CLViewContainer());
				this._cl_viewReady();
			}
		}
		
		/**
		 * Default action for the controller, override to define custom functionality.
		 * @name index
		 * @param {Object} [data]
		 */
		proto.index = function(data){
			this.render();
		}
		
		/**
		 * @name view
		 * @returns {a5.cl.CLView} 
		 */	
		proto.view = function(){
			return this._cl_view;
		}
		
		proto.id = function(value){
			if(typeof value === 'string'){
				this._cl_id = value;
				return this;
			}
			return this._cl_id || this.instanceUID();
		}
		
		/**
		 * Retrieves the view for this controller, generating it if necessary.
		 * @name generateView
		 * @param {Function} callback Callback method which will be called when the view is ready.  The view will be passed as the sole parameter.
		 * @param {Object} [scope] Optional scope in which to call callback. 
		 */
		proto.generateView = function(callback, scope){
			if(this._cl_view){
				if(typeof callback === 'function')
					callback.call(scope, this._cl_view);
			} else {
				var isXML = /<.+>/.test(this._cl_defaultViewDef);
				if(isXML){
					this._cl_buildViewDef(this._cl_defaultViewDef, callback, scope);
				} else {
					var url,
						isAssumed = false,
						self = this;
					if (this._cl_defaultViewDef) {
						if (this._cl_defaultViewDef === CLController.ASSUME_XML_VIEW) {
							isAssumed = true;
							url = this.MVC().pluginConfig().applicationViewPath + this.mvcName() + '.xml';
						} else {
							url = ((this._cl_defaultViewDef.indexOf('://') == -1 && this._cl_defaultViewDef.charAt(0) !== "/" ) ? this.MVC().pluginConfig().applicationViewPath : '') + this._cl_defaultViewDef;
						}
					}					
					this.cl().initializer().load(url, function(xml){
						self._cl_buildViewDef(xml, callback, scope);
					}, null, function(e){
						//if an error occurred while loading the viewdef, throw a 404
						if (isAssumed) {
							self._cl_viewCreated(new a5.cl.CLViewContainer());
							self._cl_viewReady();
							callback.call(scope, self._cl_view);
						} else {
							self.redirect(404, url)
						}
					}) ;
				}
			}
		}
		
		/**
		 * This method is called when the view for this controller has been instantiated.
		 */
		proto.viewReady = function(){
			
		}
		
		/**
		 * Renders a view into the render target for this controller.  The default render target is the root view.
		 * Note that all other subviews in the render target will be removed.
		 * If this controller is mappable, calling render() will force this controller to be the active presenter.
		 * To render this controller in the application render target without modifying the contents of this controller's root view, skip the view parameter.
		 * @name render
		 * @param {a5.cl.CLView} [view] The view to render into the render target for this controller.
		 * @param {Function} [callback] This method is called when the view for this controller has been generated.
		 */
		proto.render = function(view, callback){
			var callback = typeof view === 'function' ? view : callback,
				target;
			
			this.generateView(function(rootView){
				target = this._cl_renderTarget || rootView;
				if(view instanceof a5.cl.CLWindow)
					target = a5.cl.mvc.core.AppViewContainer.instance();
				if(view instanceof a5.cl.CLView){
					if (!target.containsSubView(view)) {
						if (!(target instanceof a5.cl.mvc.core.AppViewContainer)) {
							target.removeAllSubViews(false);
							target.addSubView(view);
						} else {
							target.addWindow(view);
						}
					}
					this._cl_renderComplete(callback);
				} else if(view instanceof CLController){
					var self = this;
					view.generateView(function(view){
						if (!target.containsSubView(view)) {
							target.removeAllSubViews(false);
							target.addSubView(view);
						}
						self._cl_renderComplete(callback);
					});
				} else {
					this._cl_renderComplete(callback);
				}
			}, this);
		}
		
		proto._cl_renderComplete = function(callback){
			if(this._cl_mappable)
				this.MVC().application().dispatchEvent(im.CLMVCEvent.RENDER_CONTROLLER, {controller:this}, false);
			if(callback)
				callback.call(this);
		}
		
		/**
		 * The view container in which subviews should be added when calling render().
		 * @name renderTarget
		 * @param {a5.cl.CLViewContainer} [view]
		 */
		proto.renderTarget = function(view){
			if(view !== undefined){
				this._cl_renderTarget = view;
				return this;
			}
			return this._cl_renderTarget || this._cl_view;
		}
		
		proto.Override.bind = function(source, receiver, params, mapping, scope, persist){
			//TODO: doesnt work - need to determine whether to bind on initial setup based on view in tree status or persist true
			//if (this.view().isInTree() || persist)
			proto.mixins().bind.call(this, source, receiver, params, mapping, scope, persist);
		}
		
		proto._cl_viewAddedToTree = function(){
			if(!this.bindingsConnected())
				this.setBindingEnabled(true);
			this.cl().addEventListener(im.CLEvent.CLIENT_ENVIRONMENT_UPDATED, this.clientEnvironmentUpdated, false, this);
			this.cl().addEventListener(im.CLEvent.ORIENTATION_CHANGED, this.orientationChanged, false, this);
			this._cl_viewIsInTree = true;
			this.viewAddedToTree();
		}
		
		proto.viewAddedToTree = function(){
			
		}
		
		proto._cl_viewRemovedFromTree = function(){
			if (this._cl_bindingsConnected)
				this.setBindingEnabled(false);
			this.cl().removeEventListener(im.CLEvent.CLIENT_ENVIRONMENT_UPDATED, this.clientEnvironmentUpdated);
			this.cl().removeEventListener(im.CLEvent.ORIENTATION_CHANGED, this.orientationChanged);
			this._cl_viewIsInTree = false;
			this.viewRemovedFromTree();
		}
		
		proto.viewRemovedFromTree = function(){
			
		}
		
		proto.viewIsInTree = function(){
			return this._cl_viewIsInTree;
		}
		
		/**
		 * Get or set the default view definition.  Can be a path to XML, or a string of XML.
		 * @name defaultViewDefinition
		 * @param {String} viewDef The path to the view definition XML file, or a string of XML.
		 */
		proto.defaultViewDefinition = function(viewDef){
			if(typeof viewDef === 'string'){
				this._cl_defaultViewDef = viewDef;
				return this;
			}
			return this._cl_defaultViewDef;
		}
		
		/**
		 * Finds a child view controller by ID.
		 * @param {String} id The ID of the controller to find.
		 */
		proto.getChildController = function(id){
			var x, y, thisChild;
			for(x = 0, y = this._cl_childControllers.length; x < y; x++){
				thisChild = this._cl_childControllers[x];
				if(thisChild.id() === id)
					return thisChild;
			}
			return null;
		}
		
		/**
		 * Called when the client orientation has changed.
		 * @name orientationChanged
		 * @param {Object} orientation The new orientation ('LANDSCAPE' or 'PORTRAIT')
		 */
		proto.orientationChanged = function(orientation){
			if(this._cl_viewDefParser && this._cl_viewDefParser.hasOrientationOptions())
				this._cl_viewDefParser.parse();
		}
		
		/**
		 * Called when the client environment is forced to change as a result of a resize.
		 * @name clientEnvironmentUpdated
		 * @param {Object} forcedEnvironment The new client environment.
		 */
		proto.clientEnvironmentUpdated = function(forcedEnvironment){
			if(this._cl_viewDefParser && this._cl_viewDefParser.hasEnvironmentOptions())
				this._cl_viewDefParser.parse();
		}
		
		proto.processCustomViewDefNode = function(nodeName, node, imports, defaults, rootView){
			
		}
		
		/**
		 * @name setMappable
		 */
		proto.setMappable = function(){
			if(CLController.instanceCount() > 1)
				return this.throwError('Cannot call setMappable on a controller with multiple instances.');
			this._cl_mappable = true;
		}
		
		proto._cl_buildViewDef = function(viewDef, callback, scope){
			this._cl_viewDefCallback = callback;
			this._cl_viewDefCallbackScope = scope;
			this._cl_viewDefParser = new im.ViewDefParser(viewDef, this);
			this._cl_viewDefParser.parse(this._cl_viewCreated, this._cl_viewDefComplete, this);
		}
		
		proto._cl_viewCreated = function(view){
			this._cl_view = view;
			view.addOneTimeEventListener(a5.Event.DESTROYED, this._cl_viewDestroyedHandler, false, this);
			view._cl_controller = this;
		}
		
		proto._cl_viewDestroyedHandler = function(e){
			this._cl_view = null;
		}
		
		proto._cl_viewDefComplete = function(view){
			if (this._cl_viewDefCallback)
				this._cl_viewDefCallback.call(this._cl_viewDefCallbackScope, view);
			this._cl_viewReady();
		}
		
		proto._cl_viewReady = function(){
			if (this._cl_viewReadyPending) {
				this._cl_viewReadyPending = false;
				this.viewReady();
			}
		}
		
		proto.dealloc = function(){
			if(this.view())
				this.view().destroy();				
		}
});


/**
 * @class Acts as a delegate for application level events.
 * @name a5.cl.CLApplication
 * @extends a5.EventDispatcher
 */
a5.Package("a5.cl")

	.Extends("CLController")
	.Prototype("CLApplication", function(proto, im){
		
		this.Properties(function(){
			this._cl_activePresenter = null;
			this._cl_rootWindow = null;
		})
		
		/**#@+
	 	 * @memberOf a5.cl.CLApplication#
	 	 * @function
		 */	
		
		proto.CLApplication = function(){
			proto.superclass(this);
			this.addEventListener(a5.cl.CLMVCEvent.RENDER_CONTROLLER, this._cl_eRenderControllerHandler, false, this);
			this.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_RELAUNCH, this.applicationWillRelaunch);
			this.cl().addEventListener(im.CLEvent.ONLINE_STATUS_CHANGE, this.onlineStatusChanged);
			this.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_CLOSED, this.applicationClosed);
			this.cl().addOneTimeEventListener(im.CLEvent.AUTO_INSTANTIATION_COMPLETE, this.autoInstantiationComplete);
			this.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, this.applicationWillLaunch);
			this.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_LAUNCHED, this.applicationLaunched);
			this._cl_view = new a5.cl.mvc.core.AppViewContainer();
			this.viewReady();
			return [false];
		}
		
		proto.addWindow = function(window){
			return this.view().addWindow(window);
		}
		
		proto.removeWindow = function(view, destroy){
			return this.view().removeWindow(view, destroy);
		}
		
		proto.containsWindow = function(window){
			return this.view().containsWindow(window);
		}
		
		proto.backgroundColor = function(value){
			if(value){
				document.body.style.backgroundColor = value;
				return this;	
			}
			return document.body.style.backgroundColor;
		}
		
		/**
		 * Gets the controller whose view is being actively presented in the view stack.
		 */
		proto.activePresenter = function(){
			return this._cl_activePresenter;
		}
		
		/**
		 * @name viewReady
		 */
		proto.Override.viewReady = function(){}
		
		/**
		 * @name activePresenterChanged
		 * @description Called by the framework when the controller which is being actively displayed changes.
		 * @param {Object} presenter The controller being actively displayed.
		 */
		proto.activePresenterChanged = function(presenter){}
		
		/**
		 * @name onlineStatusChanged
		 * @description Called by the framework when the browser's online status has changed. This is equivalent to listening for {@link a5.cl.MVC.event:ONLINE_STATUS_CHANGE}.
		 */
		proto.onlineStatusChanged = function(isOnline){}
		
		/**
		 * @name autoInstantiationComplete 
		 * @description Called by the framework when auto detected classes have been successfully instantiated.
		 */
		proto.autoInstantiationComplete = function(){}
		
		/**
		 * @name rootWindowLoaded 
		 * @description Called by the framework when the root window has been successfully instantiated.
		 */
		proto.rootWindowLoaded = function(window){
			if(!this._cl_renderTarget)
				this._cl_renderTarget = window;
			this._cl_rootWindow = window;
		}
		
		/**
		 * @name applicationWillLaunch 
		 * @description Called by the framework when the application is about to launch.
		 */
		proto.applicationWillLaunch = function(){}
		
		/**
		 * @name applicationLaunched 
		 * @description Called by the framework when the application has successfully launched.
		 */
		proto.applicationLaunched = function(){}
		
		/**
		 * @name applicationWillClose
		 * @description Called by the framework when the window is about to be closed. This method is tied to
		 * the onbeforeunload event in the window, and as such can additionally return back a custom string value to throw in a confirm
		 * dialogue and allow the user to cancel the window close if desired.
		 */
		proto.applicationWillClose = function(){
			
		}
		
		/**
		 * @name applicationClosed
		 * @description Called by the framework when the window is closing.
		 */
		proto.applicationClosed = function(){}
		
		/**
		 * @name applicationWillRelaunch
		 * @description Called by the framework when the application is about to relaunch.
		 */
		proto.applicationWillRelaunch = function(){}
		
		/**
		 * @name window
		 * @returns {a5.cl.CLWindow} The root window of the application.
		 */
		proto.rootWindow = function(){
			return this._cl_rootWindow;	
		}
		
		proto._cl_renderError = function(type, msg, error){
			if (!this._cl_errorStopped) {
				var trace = msg.replace(/\n/g, '<br/>') + '<br/>';
				if (type === 500) {
					if (error) {
						if (error.line && error.url) 
							trace += error.url + ', ' + error.line + '<br/>';
						if (error.stack && typeof error.stack == 'object') {
							if (error.stack.length) {
								trace += '<br/><br/>Call Stack [' + error.stack.length + ']:<br/>';
								for (var i = 0, l = error.stack.length; i < l; i++) 
									trace += unescape(error.stack[i]) + '<br/>';
							} else {
								trace += '<br/><br/>Call stack not supported.';
							}
						}
					}
				}
				var win = new a5.cl.mvc.core.SystemWindow();
				this.addWindow(win);
				win.scrollYEnabled(true).scrollXEnabled(true);
				var htmlView = a5.Create(a5.cl.CLHTMLView);
				htmlView.height('auto').padding(30).alignX('center').alignY('middle');
				win.addSubView(htmlView);
				htmlView.drawHTML('<div style="margin:0px auto;text-align:center;font-family:Arial;">\
					<div style="border-bottom: 1px solid;font-family: Arial;font-size: 20px;font-weight: bold;margin-bottom: 10px;">\
					A5 CL: ' + type + ' Error\
					</div>\
					<div style="text-align:left;margin-bottom:50px;">' + trace + '</div></div>');
				if (type == 500) {
					this._cl_errorStopped = true;
					a5.cl.core.GlobalUpdateTimer.instance()._cl_killTimer();
				}
			}
		}
		
		proto._cl_eRenderControllerHandler = function(e){
			this.render(e.data().controller.view());
			var previousPresenter = this._cl_activePresenter;
			this._cl_activePresenter = e.data().controller;
			if(previousPresenter !== this._cl_activePresenter)
				this.activePresenterChanged(this._cl_activePresenter);
		}
});


a5.Package('a5.cl.plugins.hashManager')
	
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLPlugin')
	.Class('HashManager', 'singleton final', function(cls, im, HashManager){

		var lastHash,
		trackHash,
		iframe,
		forceOnNext,
		hashDelimiter;
		
		cls.HashManager = function(){
			cls.superclass(this);
			iframe = null;
			lastHash = null;
			forceOnNext = false;
			cls.configDefaults({
				delimiter:'#!'
			});
		}	
		
		cls.Override.initializePlugin = function(){
			browserSupportCheck();
			hashDelimiter = cls.pluginConfig().delimiter;
			if(getHash(true) == "") setLocHash(hashDelimiter);
		}
		
		cls.initialize = function(){
			cls.cl().addEventListener(im.CLEvent.APPLICATION_LAUNCHED, eAppLaunchedHandler);
		}
		
		cls.getHash = function(asString){
			if (asString === true) {
				return lastHash;
			} else {
				var spl = lastHash.split('/');
				spl.shift();
				return spl;
			}
		}
		
		cls.setHash = function(hash, skipUpdate, forceRedirect) {
			var concatHash = '';
			if(hash instanceof Array) hash = hash.join('/');
			if(hash == null || hash == '/') hash = "";
			if (forceRedirect === true || (hash !== lastHash && hash !== getHash())) {
				cls.dispatchEvent(im.CLHashEvent.HASH_WILL_CHANGE, {hashArray:hash});
				if (hash == "") {
					if (skipUpdate === true) lastHash = hashDelimiter;
					setLocHash(hashDelimiter);
				} else {
					if (typeof hash == 'object') {
						for (var i = 0, l=hash.length; i < l; i++) {
							if (hash[i] == undefined && hash[i] == null) {
								hash.splice(i, 1);
								l=hash.length;
								i--;
							}
						}
						for (i = 0, l=hash.length; i < l; i++) 
							concatHash += (hash[i] + (i < hash.length - 1 ? '/' : ''));
					}
					else {
						concatHash = hash;
					}
					if (concatHash.substr(0, 1) == '/') concatHash = concatHash.substr(1);
					if (concatHash.substr(0, hashDelimiter.length) != hashDelimiter) concatHash = hashDelimiter + '/' + concatHash;
					if (skipUpdate === true) lastHash = concatHash;
					setLocHash(concatHash);
				}
				if (forceRedirect) {
					forceOnNext = true;
					update();
				}
			}
		}
		
		var processHash = function(hash){
			hash = hash.substring(hashDelimiter.length);
			hash = ((hash.indexOf('?') !== -1) ? hash.substr(0, hash.indexOf('?')) : hash);
			var parsedLinks = hash.split('/');
			if(parsedLinks[0] === "")
				parsedLinks.shift();
			return parsedLinks;
		},
		
		eAppLaunchedHandler = function(){
			update();
			var oldIE = cls.DOM().clientPlatform() === 'IE' && cls.DOM().browserVersion() < 9;
			if ('onhashchange' in window && !oldIE) {
				window.onhashchange = update;
			} else cls.cl().addEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, update);
		},
		
		update = function(){
			var hash = getHash();
			if(hash != lastHash || forceOnNext) {
				forceOnNext = false;
				lastHash = hash;
				if(iframe && lastHash != null) setLocHash(lastHash);
				var parsedLinks = processHash(lastHash);
				cls.dispatchEvent(im.CLHashEvent.HASH_CHANGE, {hashArray:parsedLinks});
			}
		},
		
		getHash = function($ignoreDelimiter){
			var val;
			if (iframe) {
				try {
					if (lastHash != location.hash) val = location.hash;
					else val = getIframeDoc().body.innerText;
				} catch (e) {
					val = lastHash || "";
				}
			} else {
				val = location.hash;
			}
			return val;
		},
		
		
		browserSupportCheck = function(){
	        if (cls.DOM().clientPlatform() == 'IE'&& cls.DOM().browserVersion() < 8) createIframe();
			else if (history.navigationMode) history.navigationMode = 'compatible';
		},	
		
		setLocHash = function (newHash, $forceIframe) {
			var forceIframe = $forceIframe || false;
			if (!forceIframe) location.hash = newHash;
			if (iframe) {
				var doc = getIframeDoc();
				doc.open();
				doc.write('<html><body>' + newHash + '</body></html>');
				doc.close();
			}
		},
	
		createIframe = function () {
			iframe = document.createElement('iframe');
			iframe.style.display = 'none';
			document.getElementsByTagName("head")[0].appendChild(iframe);
		},
		
		getIframeDoc = function(){
			return (iframe.contentDocument) ? iframe.contentDocument:iframe.Document;
		}
		
		
});

a5.Package('a5.cl.plugins.hashManager')

	.Extends('a5.cl.CLEvent')
	.Prototype('CLHashEvent', function(cls, im, CLHashEvent){
		
		CLHashEvent.HASH_CHANGE = 'clHashChangeEvent';
		CLHashEvent.HASH_WILL_CHANGE = 'clHashWillChangeEvent';
		
		cls.CLHashEvent = function(){
			cls.superclass(this);
		}		
});



a5.Package('a5.cl.mvc')

	.Import('a5.cl.CLEvent',
			'a5.cl.CLMVCEvent',
			'a5.cl.plugins.hashManager.CLHashEvent')
	.Extends('a5.cl.CLAddon')
	.Class('MVC', function(cls, im, MVC){
		
		var _mappings,
		_filters,
		_redrawEngine,
		_hash,
		_locationManager,
		_application,
		_garbageCollector,
		_envManager,
		_window,
		isFirstRender = true,
		controller;
		
		cls.MVC = function(){
			cls.superclass(this);
			cls.configDefaults({
				rootController: null,
				rootViewDef: null,
				applicationViewPath:'views/',
				rootWindow:null,
				titleDelimiter:': '
			});
			cls.createMainConfigMethod('filters');
			cls.createMainConfigMethod('mappings');
		}
		
		this.rootController = function(){
			return controller;
		}
		
		this.rootWindow = function(){
			return _window;
		}
		
		this.application = function(){	return _application; }	
		this.mappings = function(){ return _mappings; }
		this.filters = function(){ return _filters; }	
		this.hash = function(){		return _hash; 	}
		this.redrawEngine = function(){ return _redrawEngine; }
		this.locationManager = function(){ return _locationManager; }
		this.garbageCollector = function(){return _garbageCollector;}
		this.envManager = function(){ return _envManager; }
		this.triggerAppRedraw = function(){ this.redrawEngine().triggerAppRedraw(); }
		
		/**
		 * Adds a filter test case to the filters list.
		 *
		 * @param {Object} params Object value, specifies properties of the filter test.
		 * @param {String} params.controller The controller name to test on or a wildcard '*'.
		 * @param {String} [params.action] The action name to test on or a wildcard '*'.
		 * @param {Array} [params.id] The id values to test on or a wildcard '*'.
		 * @param {Function} params.before Test function, passed a param with the values of controller/action/id and methods pass() and fail().
		 * @param {Boolean} [append=false]
		 */
		this.addFilter = function(params, append){	return this.MVC().filters().addFilter(params, append); }
		
		/**
		 * Adds a hash mapping to the mappings list.
		 *
		 * @param {Object} mappingObj Object value, specifies properties of the hash mapping.
		 * @param {String|Number} mappingObj.desc The string hash value or error number to respond to. See wiki for more info on options.
		 * @param {String} mappingObj.controller The controller name to pass functionality to.
		 * @param {String} [mappingObj.action] The controller action to pass functionality to.
		 * @param {Array} [mappingObj.id] The parameters to pass to the controller action.
		 * @param {Function} [mappingObj.constraints] Constraints are not yet implemented in mappings.
		 * @param {Boolean} [append=false]
		 */
		this.addMapping = function(mappingObj, append){	return this.MVC().mappings().addMapping(mappingObj, append); }
		
		this.controller = function(){ return controller; }
		
		/**
		 * Get or set the render target for the application.
		 * This is a shortcut to application().renderTarget().
		 * 
		 * @name applicationRenderTarget
		 * @param {a5.cl.CLViewContainer} [view] The view container in which to render the root view of the active presenter.
		 */
		this.applicationRenderTarget = function(view){
			if(view !== undefined){
				_application.renderTarget(view);
				return this;
			}
			return _application.renderTarget();
		}
		
		cls.Override.initializePlugin = function(){
			var appCls = a5.GetNamespace(cls.cl().applicationPackage(true) + '.Application');
			if (appCls) {
				_application = new appCls();
				if(!_application instanceof a5.cl.CLApplication) throw 'Error: application must extend a5.cl.CLApplication.';
			} else {
				_application = new a5.cl.CLApplication();
			}
			_redrawEngine = new a5.cl.mvc.core.RedrawEngine();
			_envManager = new a5.cl.mvc.core.EnvManager();
			_mappings = new a5.cl.mvc.core.Mappings();
			_filters = new a5.cl.mvc.core.Filters();
			_hash = cls.plugins().HashManager();
			_garbageCollector = new a5.cl.mvc.core.GarbageCollector();
			_locationManager = new a5.cl.mvc.core.LocationManager();
			_application.view().initialize();
			_locationManager.addEventListener('CONTROLLER_CHANGE', eControllerChangeHandler);
			_hash.addEventListener(im.CLHashEvent.HASH_CHANGE, eHashChangeHandler);
			cls.cl().addOneTimeEventListener(im.CLEvent.DEPENDENCIES_LOADED, dependenciesLoaded);
			cls.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, appWillLaunch);
			cls.cl().addEventListener(im.CLEvent.ERROR_THROWN, eErrorThrownHandler);
			a5.cl.initializers.dom.Utils.purgeBody();
			cls.application().view().draw();
			cls.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_PREPARED, eApplicationPreparedHandler);
		}
		
		var eApplicationPreparedHandler = function(){
			if(cls.DOM().clientEnvironment() == 'MOBILE') a5.cl.mvc.core.AppSetup.mobileSetup(); 
			else if(cls.DOM().clientEnvironment() == 'TABLET') a5.cl.mvc.core.AppSetup.tabletSetup();
			else if (cls.DOM().clientEnvironment() == 'DESKTOP') a5.cl.mvc.core.AppSetup.desktopSetup();
			var $filters = cls.getMainConfigProps('filters');
			_filters.addAppFilters($filters);
			var $mappings = cls.getMainConfigProps('mappings');
			_mappings.addAppMappings($mappings);
		}
		
		/**
		 * Defines parameters of the browser window.
		 *
		 * @type Object
		 * @param {Number} e.width
		 * @param {Number} e.height
		 */
		this.windowProps = function(){	return _envManager.windowProps();	}
		
		/**
		 * The redirect method throws a control change to A5 CL.
		 * @name redirect
		 * @param {Object|String|Array|Number} params Numbers are explicitly parsed as errors. String parsed as location redirect if is a url, otherwise processed as a hash change.
		 * @param {String|Array} [param.hash] A string value to pass as a hash change. 
		 * @param {String} [param.url] A string value to pass as a location redirect. 
		 * @param {String} [param.controller] A string value referencing the name of a controller to throw control to, defaulting to the index method of the controller. 
		 * @param {String} [param.action] A string value of the name of the method action to call. 
		 * @param {Array} [param.id] An array of parameters to pass to the action method. 
		 * @param {String|Array} [param.forceHash] A string to set the hash value to. Note that unlike standard hash changes, forceHash will not be parsed as a mappings change and is strictly for allowing finer control over the address bar value.
		 * @param {String} [info] For errors only, a second parameter info is used to pass custom error info to the error controller. 
		 */
		this.redirect = function(params, info, forceRedirect){
			if(_locationManager){
				return _locationManager.redirect(params, info, forceRedirect);
			} else {
				if(params === 500){
					var isError = info instanceof a5.Error;
					if(isError && !info.isWindowError())
						this.throwError(info);
					else
						throw info;
				}
			}
		}
		
		cls.setTitle = function(value, append){
			var str = cls.cl().appName(),
				delimiter = cls.MVC().pluginConfig().titleDelimiter;
			if(value !== undefined && value != ""){
				if(append === true)
					str = str + delimiter + value;
				else if (append !== undefined)
					str = str + append + value;
				else
					str = value;	
			}
			document.title = str; 
		}
		
		var eErrorThrownHandler = function(e){
			cls.redirect(e);
		}
		
		var dependenciesLoaded = function(){
			_envManager.windowProps(true);
		}
		
		var appWillLaunch = function(){
			_hash.initialize();
			document.body.tabIndex = 0;
			document.body.focus();
			document.body.removeAttribute('tabIndex');
			_window.didFinishLoading(cls.application());
		}
		
		var eControllerChangeHandler = function(e){
			var newController,
				data = e.data(),
				action = data.action ? data.action : 'index';
			if(data.controller instanceof a5.cl.CLController)
				newController = data.controller;
			else
				newController = cls.cl()._core().instantiator().getClassInstance('Controller', data.controller, true);
			if(!newController){
				cls.redirect(500, 'Error trying to instantiate controller ' + data.controller + ', controller does not exist in package "' + cls.config().applicationPackage + '.controllers".');
				return;
			}
			cls.dispatchEvent(im.CLMVCEvent.PRIMARY_CONTROLLER_WILL_CHANGE, data);
			if(!newController._cl_mappable)
				newController.setMappable();
			if (typeof newController[action] === 'function'){
				newController[action].apply(newController, (data.id || []));
			} else {
				cls.redirect(500, 'Error calling action "' + action + '" on controller "' + data.controller + '", action not defined.');
			}
			if (isFirstRender) {
				isFirstRender = false;
				a5.cl.mvc.core.AppViewContainer.instance()._cl_initialRenderCompete();
				cls.dispatchEvent(im.CLMVCEvent.INITIAL_CONTROLLER_LOADED, data);
			}
			controller = newController;
			cls.dispatchEvent(im.CLMVCEvent.PRIMARY_CONTROLLER_CHANGED, data);
		}	
		
		var eHashChangeHandler = function(e){
			_locationManager.processMapping(e.data().hashArray);
		}
		
		cls.Override.initializeAddOn = function(){
			var isAsync = false,
				cfg = cls.pluginConfig();
			
			var generateWindow = function(){
				if (cfg.rootWindow) {
					var nm = applicationPackage + '.views.' + cfg.rootWindow;
					if (a5.GetNamespace(nm)) {
						windowSourceLoaded(nm);
					} else {
						cls.throwError('root window specified in namespace "' + nm + '" does not exist.')
					}
				} else {
					windowAssetsCached(a5.cl.CLWindow);
				}
			}
			
			var windowAssetsCached = function(namespace){
				_window = new namespace();
				controller._cl_view = _window;
				windowViewLoaded();
			}
			
			var windowViewLoaded = function(){
				_window._cl_setRootWindow();
				cls.application().addWindow(_window);
				windowReady();
			}
			
			var windowReady = function(){
				if (_window) 
					cls.application().rootWindowLoaded(_window);
				if(isAsync)
					cls.dispatchEvent(a5.cl.CLAddon.INITIALIZE_COMPLETE);
			}
			var controllerNS;
			if (cfg.rootController) {
				if(cfg.rootController.indexOf('.') !== -1)
					controller = a5.Create(a5.GetNamespace(cfg.rootController));
				else	
					controller = cls.cl()._core().instantiator().createClassInstance(cfg.rootController, 'Controller');
				if (!controller || !(controller instanceof a5.cl.CLController)) {
					cls.redirect(500, 'Invalid rootController specified, "' + cfg.rootController + '" controller does not exist in application package "' + cls.config().applicationPackage + '.controllers".');
					return;
				}
				controllerNS = controller.namespace();
			} else {
				a5.Package('a5.cl.mvc.core')
					.Extends('a5.cl.CLController')
					.Class('RootController', function(cls){ 

						cls.RootController = function(){ 
							cls.superclass(this); 
						} 
						
						cls.Override.index = function(){ 
							cls.redirect(500, "No mapping created for default '/' mapping.")
						}
				});
				controller = new a5.cl.mvc.core.RootController();	
				controllerNS = 'a5.cl.mvc.core.RootController';
			}
			cls.addMapping({desc:'/', controller:controllerNS}, true);
			if (cfg.rootViewDef) {
				controller.defaultViewDefinition(cfg.rootViewDef);
				isAsync = !(/<.+>/.test(cfg.rootViewDef));
				controller.generateView(function(view){
					_window = view;
					windowViewLoaded();
				});
			} else generateWindow();
			return isAsync;
		}
})



})(a5);