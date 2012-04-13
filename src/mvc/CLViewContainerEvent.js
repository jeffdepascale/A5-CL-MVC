
/**
 * @class 
 * @name a5.cl.mvc.CLViewContainerEvent
 */
a5.Package('a5.cl.mvc')

	.Extends('a5.Event')
	.Static(function(CLViewContainerEvent){
		
		CLViewContainerEvent.CHILDREN_READY = 'childrenReady';
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#LOADER_STATE_CHANGE
		 * @param {EventObject} e
		 * @param {String} e.state
		 * @description Dispatched when the loader state changes
		 */
		CLViewContainerEvent.LOADER_STATE_CHANGE = 'loaderStateChange';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#WILL_REMOVE_VIEW
		 * @param {EventObject} e
		 * @description Dispatched when a view is about to be removed from the view container.
		 */
		CLViewContainerEvent.WILL_REMOVE_VIEW = 'willRemoveView';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#WILL_ADD_VIEW
		 * @param {EventObject} e
		 * @description Dispatched when a view is about to be added to the view container.
		 */
		CLViewContainerEvent.WILL_ADD_VIEW = 'willAddView';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#VIEW_ADDED
		 * @param {EventObject} e
		 * @description Dispatched when a view has been successfully loaded to the view container. 
		 */
		CLViewContainerEvent.VIEW_ADDED = 'viewAdded';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#VIEW_REMOVED 
		 * @param {EventObject} e
		 * @description Dispatched when a view has been successfully removed from the view container. 
		 */
		CLViewContainerEvent.VIEW_REMOVED = 'viewRemoved';
	})
	.Prototype('CLViewContainerEvent', function(proto){
		
		proto.CLViewContainerEvent = function(){
			proto.superclass(this);
		}
		
	});