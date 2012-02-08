
a5.Package('a5.cl.mvc')

	.Import('a5.cl.CLEvent')
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
		controller;
		
		cls.MVC = function(){
			cls.superclass(this);
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
		this._mvc_redrawEngine = function(){ return _redrawEngine; }
		
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
				return this
			}
			return _application.renderTarget();
		}
		
		cls.initializePlugin = function(){
			var params = cls.getCreateParams();
			if (cls.config().application) {
				_application = cls.create(params.application);
				if(!_application instanceof a5.cl.CLApplication) throw 'Error: application must extend a5.cl.CLApplication.';
			} else {
				_application = cls.create(a5.cl.CLApplication);
			}
			if(cls.cl().clientEnvironment() == 'MOBILE') a5.cl.mvc.core.AppSetup.mobileSetup(); 
			else if(cls.cl().clientEnvironment() == 'TABLET') a5.cl.mvc.core.AppSetup.tabletSetup();
			else if (cls.cl().clientEnvironment() == 'DESKTOP') a5.cl.mvc.core.AppSetup.desktopSetup();
			_redrawEngine = cls.create(a5.cl.mvc.core.RedrawEngine);
			_envManager = cls.create(a5.cl.mvc.core.EnvManager);
			_mappings = cls.create(a5.cl.mvc.core.Mappings);
			_filters = cls.create(a5.cl.mvc.core.Filters);
			_hash = cls.create(a5.cl.mvc.core.Hash);
			_garbageCollector = cls.create(a5.cl.mvc.core.GarbageCollector);
			_locationManager = cls.create(a5.cl.mvc.core.LocationManager);
			_locationManager.addEventListener('CONTROLLER_CHANGE', eControllerChangeHandler);
			cls.cl().addEventListener(im.CLEvent.HASH_CHANGE, eHashChangeHandler);
			cls.cl().addOneTimeEventListener(im.CLEvent.DEPENDENCIES_LOADED, dependenciesLoaded);
			cls.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, appWillLaunch);
			cls.cl().addEventListener(im.CLEvent.ERROR_THROWN, eErrorThrownHandler);
			a5.cl.core.Utils.purgeBody();
			cls.application().view().draw();
		}
		
		/**
		 * Defines parameters of the browser window.
		 *
		 * @type Object
		 * @param {Number} e.width
		 * @param {Number} e.height
		 */
		this.windowProps = function(){	return _envManager.windowProps();	}
		
		cls.setTitle = function(value, append){
			var str = cls.config().appName,
			delimiter = cls.config().titleDelimiter;
			if(value !== undefined){
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
			_mappings.addConfigMappings();
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
				newController = cls.cl()._core().instantiator().getClassInstance('Controller', data.controller);
			if(!newController){
				cls.redirect(500, 'Error trying to instantiate controller ' + data.controller + ', controller does not exist in package "' + cls.config().applicationPackage + '.controllers".');
				return;
			}
			
			if(newController._cl_mappable){
				if (typeof newController[action] === 'function'){
					newController[action].apply(newController, (data.id || []));
				} else {
					cls.redirect(500, 'Error calling action "' + action + '" on controller "' + data.controller + '", action not defined.');
				}
			} else {
				cls.redirect(500, 'Error executing mapping on controller "' + data.controller + '", setMappable method must be called on controller in constructor.');
			}
		}	
		
		var eHashChangeHandler = function(e){
			_locationManager.processMapping(e.data().hashArray);
		}
		
		cls.initializeAddOn = function(){
			var resourceCache = a5.cl.core.ResourceCache.instance();
			
			var generateWindow = function(){
				if (cls.config().rootWindow) {
					var nm = applicationPackage + '.views.' + cls.config().rootWindow;
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
				_window = cls.create(namespace);
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
				cls.dispatchEvent(a5.cl.CLAddon.INITIALIZE_COMPLETE);
			}
			var controllerNS;
			if (cls.config().rootController) {
				controller = cls.cl()._core().instantiator().createClassInstance(cls.config().rootController, 'Controller');
				if (!controller || !(controller instanceof a5.cl.CLController)) {
					cls.redirect(500, 'Invalid rootController specified, "' + cls.config().rootController + '" controller does not exist in application package "' + cls.config().applicationPackage + '.controllers".');
					return;
				}
				controllerNS = controller.namespace();
			} else {
				a5.Package('a5.cl.core')
					.Extends('a5.cl.CLController')
					.Class('RootController', function(cls){ 

						cls.RootController = function(){ 
							cls.superclass(this); 
						} 
						
						cls.Override.index = function(){ 
							cls.redirect(500, "No mapping created for default '/' mapping.")
						}
				});
				controller = cls.create('a5.cl.core.RootController');	
				controllerNS = 'a5.cl.core.RootController';
			}
			cls.addMapping({desc:'/', controller:controllerNS}, true);
			if (cls.config().rootViewDef) {
				controller.defaultViewDefinition(cls.config().rootViewDef);
				controller.generateView(function(view){
					_window = view;
					windowViewLoaded();
				});
			} else generateWindow();
			return true;
		}
})