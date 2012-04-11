
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
		
		this.Properties(function(){
			this._cl_view = null;
			this._cl_mappable = false;
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
			if (typeof defaultView === 'string') {
				this.defaultViewDefinition(defaultView);
			} else if (defaultView instanceof a5.cl.CLView) {
				this._cl_viewCreated(defaultView);
				this._cl_viewReady();
			} else if(defaultView === true){
				this._cl_viewCreated(this.create(a5.cl.CLViewContainer));
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
						url = (this._cl_defaultViewDef.indexOf('://') == -1 ? this.config().applicationViewPath : '') + this._cl_defaultViewDef;
					} else {
						isAssumed = true;
						url = this.config().applicationViewPath + this.className().replace('Controller', '') + '.xml';
					}	
					
					
					this.cl().include(url, function(xml){
						self._cl_buildViewDef(xml, callback, scope);
					}, null, function(e){
						//if an error occurred while loading the viewdef, throw a 404
						if (isAssumed) {
							self._cl_viewCreated(self.create(a5.cl.CLViewContainer));
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
				if(view instanceof a5.cl.CLView){
					if (!target.containsSubView(view)) {
						target.removeAllSubViews(false);
						target.addSubView(view);
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
				this.MVC().application().dispatchEvent(this.create(im.CLEvent, [im.CLEvent.RENDER_CONTROLLER, false]), {controller:this});
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
		proto._cl_setMappable = function(){
			this._cl_mappable = true;
		}
		
		proto._cl_buildViewDef = function(viewDef, callback, scope){
			this._cl_viewDefCallback = callback;
			this._cl_viewDefCallbackScope = scope;
			this._cl_viewDefParser = this.create(im.ViewDefParser, [viewDef, this]);
			this._cl_viewDefParser.parse(this._cl_viewCreated, this._cl_viewDefComplete, this);
		}
		
		proto._cl_viewCreated = function(view){
			this._cl_view = view;
			view._cl_controller = this;
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
			
		}
});
