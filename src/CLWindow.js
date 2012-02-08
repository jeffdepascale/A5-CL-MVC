
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
			return this.cl().application();
		}
		
		proto.Override.moveToParentView = function(view){
			this.throwError('moveToParentView is not a valid manipulation method on a5.cl.CLWindow.');
		}

		proto.Override.removeFromParentView = function(){
			this.cl().application().removeWindow(this);
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
