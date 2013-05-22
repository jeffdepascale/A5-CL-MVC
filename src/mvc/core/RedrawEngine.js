
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
		
		this.attemptRedraw = function($target, force){
			var target = $target || self;
			pushRedrawTarget(target, force);
		}
		
		this.triggerAppRedraw = function($force){
			appRedrawForced = $force || appRedrawForced;
			attachForAnimCycle();
		}
		
		var pushRedrawTarget = function(target, force){
			var shouldPush = true,
				i, l;
			for (i = 0, l = pendingRedrawers.length; i < l; i++) { 
				if (target == pendingRedrawers[i] || target.isChildOf(pendingRedrawers[i])) {
					shouldPush = false;
					break;
				}
			}
			if(shouldPush){
				for(i = 0; i< pendingRedrawers.length; i++){	
					if (pendingRedrawers[i].isChildOf(target)) {
						pendingRedrawers.splice(i, 1);
						i--;
					}
				}
				target.addOneTimeEventListener(a5.Event.DESTROYED, eRedrawerDestroyedHandler);
				pendingRedrawers.push(target);
				attachForAnimCycle();
			}
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
			var force = appRedrawForced;
			appRedrawForced = false;
			if (force) {
				appContainer._cl_redraw(force);
				pendingRedrawers = [];		
			} else {
				while(pendingRedrawers.length){
					pendingRedrawers.shift()._cl_redraw(false);
				}
			}
			attached = false;
		}

});