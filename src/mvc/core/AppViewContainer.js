a5.Package('a5.cl.mvc.core')
	
	.Extends('a5.cl.CLViewContainer')
	.Prototype('AppViewContainer', 'singleton final', function(proto, im){
		
		proto.AppViewContainer = function(){
			proto.superclass(this);
			this._cl_errorStopped = false;
			this._cl_systemWindowContainer = this.create(im.WindowContainer);
			this._cl_systemWindowContainer.hide();
			this._cl_appWindowContainer = this.create(im.WindowContainer);
			this._cl_appWindowContainer.hide();
			this._cl_appWindowContainer.showOverflow(true);
			this._cl_appWindowLoadingContainer = this.create(im.WindowContainer);
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
							isReplace = false;
						if(container.containsSubView(window))
							container.removeSubView(window, false);
						for (var i = 0, l = container.subViewCount(); i < l; i++) {
							var checkedWin = container.subViewAtIndex(i);
							if (checkedWin._cl_windowLevel === lev.APPLICATION) {
								index = i + 1;
							} else if (checkedWin._cl_windowLevel === newWinLevel) {
								index = i;
								isReplace = true;
							}
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
	
	.Extends('a5.cl.CLViewContainer')
	.Class('WindowContainer', function(cls, im){
		
		cls.WindowContainer = function(){
			cls.superclass(this);
		}
		
});