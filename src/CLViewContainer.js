
/**
 * @class Adds subview ownership and management capabilities to view elements.
 * @name a5.cl.CLViewContainer
 * @extends a5.cl.CLView
 */
a5.Package('a5.cl')
	.Extends('CLView')
	.Import('a5.ContractAttribute')
	.Static(function(CLViewContainer){
		CLViewContainer.redrawLog = {};
		
		CLViewContainer.logRedraw = function(view){
			var uid = view.instanceUID();
			if(CLViewContainer.redrawLog[uid])
				CLViewContainer.redrawLog[uid]++;
			else
				CLViewContainer.redrawLog[uid] = 1;
		}
		
		CLViewContainer.getRedrawCounts = function(){
			var redrawArray = [];
			for(var prop in CLViewContainer.redrawLog){
				redrawArray.push({id:prop, count:CLViewContainer.redrawLog[prop]});
			}
			redrawArray.sort(function(a, b){
				return b.count - a.count;
			});
			for(var x = 0, y = redrawArray.length; x < y; x++){
				var thisCount = redrawArray[x];
			}
		}
		
		CLViewContainer.clearRedrawLog = function(){
			CLViewContainer.redrawLog = {};
		}
		
		CLViewContainer.viewAffectsAutoWidth = function(view){
			return (view.visible() && view._cl_width.percent === false && view._cl_width.relative === false && view._cl_alignX !== 'right') || (view._cl_minWidth !== null && view._cl_width.inner <= view._cl_minWidth);
		}
		
		CLViewContainer.viewAffectsAutoHeight = function(view){
			return (view.visible() && view._cl_height.percent === false && view._cl_height.relative === false && view._cl_alignY !== 'bottom') || (view._cl_minHeight !== null && view._cl_height.inner <= view._cl_minHeight);
		}
	})
	.Prototype('CLViewContainer', function(proto, im, CLViewContainer){
		
		/**#@+
	 	 * @memberOf a5.cl.CLViewContainer#
	 	 * @function
		 */	
		 
		this.Properties(function(){
			this._cl_childViews = [];
			this._cl_queuedLoads = [];
			this._cl_relX = false;
			this._cl_relY = false;
			this._cl_outerW = null;
			this._cl_outerH = null;
			this._cl_lockedVal = false;
			this._cl_pendingChildren = 0;
			this._cl_isInitialVDReady = true;
			this._cl_constrainChildren = false;
			this._cl_scrollXEnabled = {value:false, state:false};
			this._cl_scrollYEnabled = {value:false, state:false};
			this._cl_passDataToChildren = true;
			this._cl_passedData = null;
			this._cl_scrollLeftVal = null;
			this._cl_scrollTopVal = null;
			this._cl_childViewTarget = this;
		})
		
		proto.CLViewContainer = function(){
			proto.superclass(this); 
		}
		
		/**
		 * Forces direct child views to constrain width/height values to the max vals of the view.
		 *  @name constrainChildren
		 *  @param {Boolean} [value]
		 */
		proto.constrainChildren = function(value){ return this._cl_propGetSet('_cl_constrainChildren', value); }
		
		/**
		 * @name passDataToChildren
		 * @param {Object} value
		 */
		proto.passDataToChildren = function(value){ return this._cl_propGetSet('_cl_passDataToChildren', value); }
		
		proto.Override.renderFromData = function(data){
			if(this._cl_passDataToChildren){
				this._cl_passedData = data;
				for(var i = 0, l = this._cl_childViews.length; i<l; i++)
					this._cl_childViews[i].renderFromData(data);				
			}
			a5.cl.CLViewContainer.superclass().renderFromData.apply(this, arguments);
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.relX = function(value){
			if (value !== undefined) {
				this._cl_relX = value;
				if (value === false) {
					for (var i = 0, l = this._cl_childViews.length; i < l; i++)
						this._cl_childViews[i]._cl_x.state = false;
				}
				this.redraw();
				return this;
			}
			return this._cl_relX;
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.relY = function(value){
			if (value !== undefined) {
				this._cl_relY = value;
				if (value === false) {
					for (var i = 0, l = this._cl_childViews.length; i < l; i++)
						this._cl_childViews[i]._cl_y.state = false;
				}
				this.redraw();
				return this;
			}
			return this._cl_relY;
		}
		
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.scrollXEnabled = function(value){
			if (value !== undefined) {
				if(value === 'state') 
					return this._cl_scrollXEnabled.state;
				this._cl_scrollXEnabled.value = value;
				return this;
			}
			return this._cl_scrollXEnabled.value;
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.scrollYEnabled = function(value){
			if (value !== undefined) {
				if(value === 'state') 
					return this._cl_scrollYEnabled.state;
				this._cl_scrollYEnabled.value = value;
				return this;
			}
			return this._cl_scrollYEnabled.value;
		}
		
		/**
		 * 
		 * @param {Number|a5.cl.CLView} val
		 */
		proto.scrollY = function(val, offset){
			if(val !== undefined){
				var setVal;
				if(typeof val === 'number')
					setVal = val;
				else 
					setVal = val.y(true);
				if(offset !== undefined)
					setVal += offset;
				this._cl_scrollTopVal = setVal;
				this.redraw();
				return setVal;
			} else {
				return this._cl_viewElement.scrollTop;
			}
		}
		
		/**
		 * 
		 * @param {Number|a5.cl.CLView} val
		 */
		proto.scrollX = function(val, offset){
			if(val !== undefined){
				var setVal;
				if(typeof val === 'number')
					setVal = val;
				else 
					setVal = val.y(true);
				if(offset !== undefined)
					setVal += offset;
				this._cl_scrollLeftVal = setVal;
				this.redraw();
				return setVal;
			} else {
				return this._cl_viewElement.scrollLeft;
			}
			
		}
		
		/**
		 * 
		 */
		proto.subViewCount = function(){
			return this._cl_childViewTarget._cl_childViews.length;
		}
		
		/**
		 * 
		 * @param {Object} id
		 */
		proto.subViewAtIndex = function(id){
			return this._cl_childViewTarget._cl_childViews[id];
		}
		
		/**
		 * 
		 * @param {Object} id
		 */
		proto.subViewWithName = function(name){
			for (var i = 0, l=this._cl_childViewTarget._cl_childViews.length; i<l; i++){
				if(this._cl_childViewTarget._cl_childViews[i].mvcName() == name)
					return this._cl_childViewTarget._cl_childViews[i];
			}
			return null;
		}
		
		/**
		 * 
		 * @param {Object} view
		 */
		proto.subViewToTop = function(view){
			if (!this._cl_childViewTarget._cl_lockedVal) {
				this._cl_childViewTarget._cl_childViews.splice(view.index(), 1);
				this._cl_childViewTarget._cl_childViews.push(view);
				this._cl_childViewTarget._cl_orderChildren();
			} else {
				this._cl_throwLockedError();
			}
		}
		
		/**
		 * 
		 * @param {Object} view
		 */
		proto.subViewToBottom = function(view){
			if (!this._cl_childViewTarget._cl_lockedVal) {
				this._cl_childViewTarget._cl_childViews.splice(view.index(), 1);
				this._cl_childViewTarget._cl_childViews.unshift(view);
				this._cl_childViewTarget._cl_orderChildren();
			} else {
				this._cl_throwLockedError();
			}
		}
		
		/**
		 * 
		 */
		proto._cl_orderChildren = function(){
			for (var i = 0, l = this._cl_childViews.length; i < l; i++) {
				var thisElem = this._cl_childViews[i]._cl_viewElement,
					scrollTop = thisElem ? thisElem.scrollTop : 0,
					scrollLeft = thisElem ? thisElem.scrollLeft : 0;
				this._cl_viewElement.appendChild(thisElem);
				this._cl_childViews[i]._cl_setIndex(i);
				this.redraw();
				//we have to cache the scroll positions, and then reset them because doing an appendChild() resets the scroll
				thisElem.scrollTop = scrollTop;
				thisElem.scrollLeft = scrollLeft;
			}
		}
		
		proto._cl_addChildView = function(view, $index, callback){
			if (!this._cl_lockedVal) {
				if(!(this instanceof a5.cl.core.WindowContainer) && view instanceof a5.cl.CLWindow){
					this.throwError('Cannot add a CLWindow to a generic view container.');
					return;
				}
				if(view.parentView() instanceof a5.cl.CLViewContainer && view.parentView() !== this)
					view.parentView().removeSubView(view, false);
				var index = (typeof $index == 'number') ? $index:null;
				if(index > this._cl_childViews.length-1) index = null;
				this.willAddView();
				view.draw(this);
				this.viewAdded();
				view._cl_addedToParent(this);
				if(callback) callback(view);
				if(index !== null) this._cl_childViews.splice(index, 0, view)
				else this._cl_childViews.push(view);
				view._cl_setParent(this);
				this._cl_orderChildren();
				if(this._cl_passDataToChildren && this._cl_passedData)
					view.renderFromData(this._cl_passedData)
			} else {
				this._cl_throwLockedError();
			}
		}
		
		proto.containsSubView = function(view){
			for (var i = 0, l = this._cl_childViewTarget._cl_childViews.length; i < l; i++) {
				if(this._cl_childViewTarget._cl_childViews[i] == view)
					return true;
			}
			return false;
		}
		
		/**
		 * 
		 * @param {Object} view
		 */
		proto.removeSubView = function(view, $shouldDestroy){
			if (!this._cl_childViewTarget._cl_lockedVal) {
				var shouldDestroy = $shouldDestroy === false ? false : true;
				for (var i = 0, l = this._cl_childViewTarget._cl_childViews.length; i < l; i++) {
					if (this._cl_childViewTarget._cl_childViews[i] === view) {
						this.willRemoveView(view);
						this.dispatchEvent(a5.cl.mvc.CLViewContainerEvent.WILL_REMOVE_VIEW, {view:view});
						this._cl_childViewTarget._cl_childViews.splice(i, 1);
						view._cl_parentView = null;
						view._cl_removedFromParent(this);
						if(view._cl_viewElement && view._cl_viewElement.parentNode === this._cl_viewElement)
							this._cl_childViewTarget._cl_viewElement.removeChild(view._cl_viewElement);
						this.viewRemoved(view);
						this.dispatchEvent(a5.cl.mvc.CLViewContainerEvent.VIEW_REMOVED, {view:view});
						if (shouldDestroy === true) view.destroy();
						if(this._cl_childViewTarget._cl_relX || this._cl_childViewTarget._cl_relY || this._cl_childViewTarget._cl_width.auto || this._cl_childViewTarget._cl_height.auto)
							this.redraw();
						return;
					}
				}
				//throw 'Error removing subview ' + view.mvcName() + ', subview is not a child of the view container.';
				this.warn('Unable to remove subview ' + (view.id() || view.instanceUID()) + '.  Subview is not a child of the view container.');
			} else {
				this._cl_throwLockedError();
			}
		}
		
		proto.removeAllSubViews = function(shouldDestroy){
			while(this.subViewCount())
				this.removeViewAtIndex(0, shouldDestroy);
			return this;
		}
		
		/**
		 * 
		 * @param {Number} id
		 */
		proto.removeViewAtIndex = function(id, shouldDestroy){
			var view = this._cl_childViewTarget._cl_childViews[id];
			this.removeSubView(view, shouldDestroy);
		}
		
		/**
		 * 
		 * @param {Object} replacedView
		 * @param {Object} newView
		 */
		proto.replaceView = function(replacedView, newView){
			var replaceView;
			for (var i = 0, l=this._cl_childViewTarget._cl_childViews.length; i<l; i++){
				if(this._cl_childViewTarget._cl_childViews[i] === replaceView) 
					replaceView = this._cl_childViewTarget._cl_childViews[i];
					break;
			}
			if(replaceView)
				this.replaceViewAtIndex(newView, replaceView.index());
			else
				this.redirect(500, "cannot replace view " + (replaceView.id() || replaceView.instanceUID()) + ", view is not a child of container " + this.instanceUID());
		}
		
		/**
		 * 
		 * @param {Object} index
		 * @param {Object} newView
		 */
		proto.replaceViewAtIndex = function(newView, index){
			this.removeViewAtIndex(index);
			this.addSubViewAtIndex(newView, index);
		}
		
		/**
		 * 
		 * @param {Number} index_1
		 * @param {Number} index_2
		 */
		proto.swapViewsAtIndex = function(index_1, index_2){
			if (!this._cl_lockedVal) {
				var inst = this._cl_childViewTarget._cl_childViews, length = inst.length;
				if (index_1 < 0) index_1 = 0;
				if (index_2 < 0) index_2 = 0;
				if (index_1 > length - 1) index_1 = length - 1;
				if (index_2 > length - 1) index_1 = length - 1;
				if (index_1 != index_2) {
					var viewTemp = inst[index_1];
					inst[index_1] = inst[index_2];
					inst[index_2] = viewTemp;
					this._cl_childViewTarget._cl_orderChildren();
				}
			} else {
				this._cl_throwLockedError();
			}
		}
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubView
		 * @param {a5.cl.CLView|Object} view
		 * @param {Function} [callback]
		 */
		proto.addSubView = this.Attributes(
			["Contract", {view:'a5.cl.CLView', callback:'function=null'}],
			function(args){
				if (args)
					this._cl_childViewTarget._cl_addChildView(args.view, null, args.callback)
		})
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubViewAtIndex
		 * @param {a5.cl.CLView|Object} view
		 * @param {Number} index
		 * @param {Function} [callback]
		 */
		proto.addSubViewAtIndex = function(view, index, callback){
			this._cl_childViewTarget._cl_addChildView(view, index, callback)
			
		}
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubViewBelow
		 * @param {a5.cl.CLView|Object} view
		 * @param {a5.cl.CLView} refView
		 * @param {Function} [callback]
		 */
		proto.addSubViewBelow = function(view, refView, callback){
			this.addSubViewAtIndex(view, (parseInt(refView.index())-1), callback);
		}
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubViewAbove
		 * @param {a5.cl.CLView|Object} view
		 * @param {a5.cl.CLView} refView
		 * @param {Function} [callback]
		 */
		proto.addSubViewAbove = function(view, refView, callback){
			this.addSubViewAtIndex(view, (parseInt(refView.index())+1), callback);
		}
		
		proto.Override.width = function(val){
			if (val === 'scroll')
				return Math.max(this._cl_width.content + this._cl_calculatedClientOffset.left + this._cl_calculatedOffset.left, this._cl_width.offset);
			else
				return proto.superclass().width.apply(this, arguments);
		}
		
		proto.Override.height = function(val){
			if (val === 'scroll')
				return Math.max(this._cl_height.content + this._cl_calculatedClientOffset.top + this._cl_calculatedOffset.top, this._cl_height.offset);
			else
				return proto.superclass().height.apply(this, arguments);
		}
		
		proto.Override.suspendRedraws = function(value, inherited){
			if(typeof value === 'boolean') {
				for(var x = 0, y = this.subViewCount(); x < y; x++){
					this.subViewAtIndex(x).suspendRedraws(value, true);
				}
			}
			return proto.superclass().suspendRedraws.call(this, value);
		}
		
		proto.Override._cl_redraw = function(force, suppressRender){
			var forceChildren = this._cl_redrawPending,
				redrawVals = proto.superclass()._cl_redraw.call(this, force, true),
				scrollBarWidth = a5.cl.mvc.core.EnvManager.instance().scrollBarWidth(),
				shouldRedraw = im.CLView._cl_viewCanRedraw(this),
				contentWidthChanged = false,
				contentHeightChanged = false;
			if(shouldRedraw){
				//a5.cl.CLViewContainer.logRedraw(this);
				//if we're scrolling, adjust the inner sizes accordingly
				this._cl_width.inner = this._cl_width.client - (this._cl_scrollYEnabled.state ? scrollBarWidth : 0);
				this._cl_height.inner = this._cl_height.client - (this._cl_scrollXEnabled.state ? scrollBarWidth : 0);
				
				forceChildren = forceChildren || redrawVals.force;
				var outerW = 0, outerH = 0,
					view, prevView, maxW, maxH, i, l,
					shouldXScroll = false,
					shouldYScroll = false, 
					didXScrollChange = false, 
					didYScrollChange = false,
					percentChildren = [];
				for (i = 0, l = this._cl_childViews.length; i < l; i++) {
					view = this._cl_childViews[i];
					if(((this._cl_height.auto || this._cl_scrollYEnabled.value) && view._cl_height.percent !== false) || ((this._cl_width.auto || this._cl_scrollXEnabled.value) && view._cl_width.percent !== false))
						percentChildren.push(view);
					if (this._cl_relX || this._cl_relY) {
						if (i > 0) {
							prevView = this._cl_childViews[i - 1];
							if (this._cl_relX) 
								view._cl_x.state = prevView.x(true) + view.x() + prevView.width();
							if (this._cl_relY) 
								view._cl_y.state = prevView.y(true) + view.y() + prevView.height();
						} else {
							if (this._cl_relX) 
								view._cl_x.state = view.x();
							if (this._cl_relY) 
								view._cl_y.state = view.y();
						}
					}		
					view._cl_redraw(force || forceChildren, true);
					
					if (CLViewContainer.viewAffectsAutoWidth(view)) {
						maxW = view.width() + view.x(true);
						if (maxW > outerW) 
							outerW = maxW;
					}
					if(CLViewContainer.viewAffectsAutoHeight(view)) {
						maxH = view.height() + view.y(true);
						if (maxH > outerH) 
							outerH = maxH;
					}
				}
				//update the content width/height
				contentWidthChanged = this._cl_width !== outerW;
				contentHeightChanged = this._cl_height !== outerH;
				this._cl_height.content = outerH;
				this._cl_width.content = outerW;
				
				//redraw any percent-based children again so they'll be based on the new content size
				for(i = 0, l = percentChildren.length; i < l; i++) {
					view = percentChildren[i];
					if ((view._cl_width.percent !== false && contentWidthChanged) || (view._cl_height.percent !== false && contentHeightChanged))
						view._cl_redraw(force || forceChildren, true);
				}
				
				if (this._cl_width.auto !== false || this._cl_height.auto !== false){
					proto.superclass()._cl_redraw.call(this, true, true);
					this._cl_height.content = outerH;
					this._cl_width.content = outerW;
					this._cl_alertParentOfRedraw();
				}
				
				if (this._cl_scrollXEnabled.value && outerW > this._cl_width.client + this._cl_calculatedClientOffset.right) 
					shouldXScroll = true;
				if (this._cl_scrollYEnabled.value && outerH > this._cl_height.client + this._cl_calculatedClientOffset.bottom) 
					shouldYScroll = true;
				
				if( (this._cl_scrollXEnabled.value && this._cl_scrollYEnabled.value) 			// if both X and Y can scroll
					&&	scrollBarWidth > 0 														//and the scrollbar will actually take up space
					&& ((shouldXScroll && !shouldYScroll) || (shouldYScroll && !shouldXScroll)) //and only one direction is scheduled scroll right now
				){																				//then check if the other direction will need to scroll once the scrollbar is added
					if (shouldYScroll && (this._cl_width.client - scrollBarWidth) < outerW) 
						shouldXScroll = true;
					else if (shouldXScroll && (this._cl_height.client - scrollBarWidth) < outerH) 
						shouldYScroll = true;
				}
				
				//show or hide the scrollbars if necessary
				if (shouldYScroll !== this._cl_scrollYEnabled.state) {
					this._cl_scrollYEnabled.state = shouldYScroll;
					this._cl_pendingViewElementProps.overflowY = shouldYScroll ? 'auto' : (this._cl_showOverflow ? 'visible' : 'hidden');
					didYScrollChange = true;
				}
				if (shouldXScroll !== this._cl_scrollXEnabled.state) {
					this._cl_scrollXEnabled.state = shouldXScroll;
					this._cl_pendingViewElementProps.overflowX = shouldXScroll ? 'auto' : (this._cl_showOverflow ? 'visible' : 'hidden');
					didXScrollChange = true;
				}
				
				//if we're scrolling, adjust the inner sizes accordingly
				this._cl_width.inner = this._cl_width.client - (this._cl_scrollYEnabled.state ? scrollBarWidth : 0);
				this._cl_height.inner = this._cl_height.client - (this._cl_scrollXEnabled.state ? scrollBarWidth : 0);
				
				//redraw the children again, if necessary
				if (scrollBarWidth > 0 && (didXScrollChange || didYScrollChange)) {
					for (i = 0, l = this._cl_childViews.length; i < l; i++) 
						this._cl_childViews[i]._cl_redraw(true);
				} else {
					//if we're not redrawing the children one final time, then we must render them
					for (i = 0, l = this._cl_childViews.length; i < l; i++) 
						this._cl_childViews[i]._cl_render();
				}
				
				if ('ontouchstart' in window) {
					var prop = a5.core.Utils.getCSSProp('overflowScrolling');
					if (prop) 
						this._cl_pendingViewElementProps[prop] = 'touch';
				}
				
				if (suppressRender !== true) 
					this._cl_render();
			}
			return redrawVals;
		}
		
		proto.Override._cl_render = function(){
			proto.superclass()._cl_render.call(this);
			
			if (this._cl_scrollLeftVal) {
				this._cl_viewElement.scrollLeft = this._cl_scrollLeftVal;
				this._cl_scrollLeftVal = null;
			}
			
			if (this._cl_scrollTopVal) {
				this._cl_viewElement.scrollTop = this._cl_scrollTopVal;
				this._cl_scrollTopVal = null;
			}
		}
		
		proto._cl_locked = function(value){ return this._cl_propGetSet('_cl_lockedVal', value, 'boolean'); }
		
		proto._cl_throwLockedError = function(){
			this.redirect(500, 'Error: attempted to modify child views on a structure locked view.');
		}
		
		proto._cl_childRedrawn = function(child, changes){
			var autoWidth = this._cl_width.auto !== false && (changes.width || changes.x) && CLViewContainer.viewAffectsAutoWidth(child),
				autoHeight = this._cl_height.auto !== false && (changes.height || changes.y) && CLViewContainer.viewAffectsAutoHeight(child),
				relX = this._cl_relX && (changes.width || changes.x),
				relY = this._cl_relY && (changes.height || changes.y),
				scrollX = this._cl_scrollXEnabled.value && (changes.width || changes.x),
				scrollY = this._cl_scrollYEnabled.value && (changes.height || changes.y),
				alignY = child._cl_alignY !== 'top'  && (changes.height || changes.y),
				alignX = child._cl_alignX !== 'left'  && (changes.width || changes.x);
				
			if(autoWidth || autoHeight || relX || relY || scrollX || scrollY || alignX || alignY)
				this.redraw();
		}
		
		proto.Override._cl_addedToTree = function(){
			proto.superclass()._cl_addedToTree.call(this);
			for (var i = 0, l = this.subViewCount(); i < l; i++)
				this.subViewAtIndex(i)._cl_addedToTree();
		}
		
		proto.Override._cl_removedFromTree = function(){
			proto.superclass()._cl_removedFromTree.call(this);
			for(var i=0, l=this.subViewCount(); i<l; i++)
				this.subViewAtIndex(i)._cl_removedFromTree();
		}		
		
		proto.getChildView = function(id){
			var x, y, thisChild, childFound;
			for(x = 0, y = this.subViewCount(); x < y; x++){
				thisChild = this.subViewAtIndex(x);
				if(thisChild._cl_controller)
					continue; //if this child has a controller, don't go any deeper
				if(thisChild.id() === id)
					return thisChild;
				childFound = thisChild instanceof CLViewContainer ? thisChild.getChildView(id) : false;
				if(childFound)
					return childFound;
			}
			return null;
		}
		
		proto.getChildViews = function(){
			return this._cl_childViews.slice(0);
		}
		
		proto.getMaximumViewDepth = function(){
			var maxDepth = 0;
			if(this.subViewCount() > 0){
				(function(parent, depth){
					depth++;
					if(depth > maxDepth)
						maxDepth = depth;
					for(var x = 0, y = parent.subViewCount(); x < y; x++){
						var thisChild = parent.subViewAtIndex(x);
						if(thisChild.subViewCount() > 0)
							arguments.callee.call(this, thisChild);
					}
				})(this, 0);
			}
			return maxDepth;
		}
		
		proto.Override._cl_vdViewReady = function(){
			this.childrenReady(this._cl_isInitialVDReady);
			this._cl_isInitialVDReady = this._cl_buildingFromViewDef = false;
			proto.superclass()._cl_vdViewReady.call(this);
		}
		
		proto._cl_vdViewAdded = function(){
			this._cl_pendingChildren--;
				if(this._cl_pendingChildren <= 0)
					this._cl_vdViewReady();
		}
		
		/**
		 * Called when all of the child views have finished loading.
		 * Note that this method will only be called if this view was generated from a view definition.
		 * @param {Boolean} initialCall  
		 */
		proto.childrenReady = function(initialCall){};
		
		/**
		 * Called when a view is about to be added to the view container.
		 * @param {Object} e
		 * @param {Object} e.view
		 */
		proto.willAddView = function(e){}
		
		/**
		 * Called when a view is about to be removed from the view container.
		 * @param {Object} e
		 */
		proto.willRemoveView = function(e){}
		
		/**
		 * Called when a view has been successfully removed from the view container.
		 */
		proto.viewRemoved = function(){}
		
		/**
		 * Called when a view has been successfully loaded to the view container.
		 */
		proto.viewAdded = function(){}
		
		proto.dealloc = function(){
			this._cl_lockedVal = false;
			this.removeAllSubViews(true);
		}
});
