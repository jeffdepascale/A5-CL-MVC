
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
