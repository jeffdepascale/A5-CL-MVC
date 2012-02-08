
a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.CLViewContainer')
	
	.Extends('CLViewContainer')
	.Prototype('AppViewContainer', 'singleton final', function(proto, im){
		
		proto.AppViewContainer = function(){
			proto.superclass(this);
			this._cl_errorStopped = false;
			this._cl_systemWindowContainer = this.create('a5.cl.core.WindowContainer');
			this._cl_systemWindowContainer.hide();
			this._cl_appWindowContainer = this.create('a5.cl.core.WindowContainer');
			this._cl_appWindowContainer.showOverflow(true);
			this._cl_levelObjs = { system:null, alert:null, context:null, modal:null};
			this.showOverflow(true);
			this._cl_addedToTree();
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
						levObj = this._cl_levelObjs,
						add = true,
						index = 0;
					switch (window._cl_windowLevel) {
						case lev.SYSTEM:
							if(levObj.system && levObj.system.blocking()){
								this.throwError('system window blocking error');
								return;
							}
							if(levObj.system)
								this._cl_systemWindowContainer.replaceViewAtIndex(window, 0);
							else
								this._cl_systemWindowContainer.addSubView(window);
							this._cl_systemWindowContainer.show();
							levObj.system = window;
							add = false;
							break;
						case lev.ALERT:
							levObj.alert = window;
							index = 3;
							break;
						case lev.CONTEXT:
							levObj.context = window;
							index = 2;
							break;
						case lev.MODAL:
							levObj.modal = window;
							index = 1;
							break;
					}
					if(add)
						this._cl_appWindowContainer.addSubViewAtIndex(window, index);
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

		proto.Override.viewReady = function(){}
		
		proto.Override.width = function(value){
			return this.cl().MVC().envManager().windowProps().width;
		}
		
		proto.Override.height = function(value){
			return this.cl().MVC().envManager().windowProps().height;
		}
		
		proto.Override._cl_redraw = function(force){
			var sysWin = this._cl_levelObjs.system,
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
		
		proto.Override._cl_orderChildren = function(){
			proto.superclass()._cl_orderChildren.apply(this, arguments);
			var levs = this._cl_levelObjs;
			var top = this.subViewCount();
			if(levs.modal)		levs.modal._cl_setIndex(top + 1);
			if(levs.context)	levs.context._cl_setIndex(top + 2);
			if(levs.alert) 		levs.alert._cl_setIndex(top + 3);
			if(levs.system) 	levs.system._cl_setIndex(top + 4);
		}
		
		proto.Override.redraw = function(){
			this.cl().MVC().redrawEngine().attemptRedraw(this);
		}
		
		proto.Override.viewRemoved = function(view){
			for(var prop in this._cl_levelObjs)
				if(this._cl_levelObjs[prop] == view)
					this._cl_levelObjs[prop] = null;
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
			proto.superclass().addSubView.call(this, this._cl_systemWindowContainer);
		}
	
});

a5.Package('a5.cl.core')
	
	.Extends('a5.cl.CLViewContainer')
	.Class('WindowContainer', function(self, im){
		
		self.WindowContainer = function(){
			self.superclass(this);
		}		
})
