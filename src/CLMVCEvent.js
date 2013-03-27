
a5.Package('a5.cl')

	.Extends('a5.Event')
	.Static(function(CLMVCEvent){
				
		/**
		 * @event
		 * @description Dispatched when the render() method is called on a mappable controller.
		 * @param {a5.cl.CLController} controller
		 */
		CLMVCEvent.RENDER_CONTROLLER = 'clMVCEventRenderController';
		
		/**
		 * @event
		 * @description Dispatched when the first controller is loaded.
		 * @param {a5.cl.CLController} controller
		 */
		CLMVCEvent.INITIAL_CONTROLLER_LOADED = 'clMVCEventControllerLoaded';
		
		CLMVCEvent.PRIMARY_CONTROLLER_WILL_CHANGE = 'clMVCEventPrimaryControllerWillChange';
		
		CLMVCEvent.PRIMARY_CONTROLLER_CHANGED = 'clMVCEventPrimaryControllerChanged';
		/**
		 * @event
		 * @description Dispatched by CLViews when they are added to a parent view.  This event is useful for detecting when children are added to a specific branch of the view tree.
		 */
		CLMVCEvent.ADDED_TO_PARENT = 'clMVCEventAddedToParent';
		
		/**
		 * @event
		 * @description Dispatched by CLViews when they are added to a parent view.  This event is useful for detecting when children are added to a specific branch of the view tree.
		 */
		CLMVCEvent.REMOVED_FROM_PARENT = 'clMVCEventRemovedFromParent';
		
	})
	.Class('CLMVCEvent', function(cls, im){
		
		cls.CLMVCEvent = function(){
			cls.superclass(this);
		}	
})
