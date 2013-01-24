
a5.Package('a5.cl')

	.Extends('a5.Event')
	.Static(function(CLMVCEvent){
				
		/**
		 * @event
		 * @description Dispatched when the render() method is called on a mappable controller.
		 * @param {a5.cl.CLController} controller
		 */
		CLMVCEvent.RENDER_CONTROLLER = 'renderController';
		
		/**
		 * @event
		 * @description Dispatched by CLViews when they are added to a parent view.  This event is useful for detecting when children are added to a specific branch of the view tree.
		 */
		CLMVCEvent.ADDED_TO_PARENT = 'addedToParent';
		
		/**
		 * @event
		 * @description Dispatched by CLViews when they are added to a parent view.  This event is useful for detecting when children are added to a specific branch of the view tree.
		 */
		CLMVCEvent.REMOVED_FROM_PARENT = 'removedFromParent';
		
	})
	.Class('CLMVCEvent', function(cls, im){
		
		cls.CLMVCEvent = function(){
			cls.superclass(this);
		}		
})
