
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