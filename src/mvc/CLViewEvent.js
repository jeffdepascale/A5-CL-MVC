
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