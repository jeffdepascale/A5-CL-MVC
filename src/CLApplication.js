
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