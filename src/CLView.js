
/**
 * @class Base class for UI classes in the AirFrame CL framework.
 * @name a5.cl.CLView
 * @extends a5.cl.CLBase
 */
a5.Package("a5.cl")
	
	.Import('a5.cl.CLEvent')
	.Extends('CLMVCBase')
	.Static(function(CLView, im){
		
		CLView.customViewDefNodes = ['EventListener', 'Bind'];
		
		CLView._cl_calcOffsetObj = function(obj, calcProp, props){
			var i, l, isObj, propVal,
				changed = false,
				cachedProp = obj[calcProp];
			obj[calcProp] = {width:0, height:0, left:0, right:0, top:0, bottom:0};
			for(i = 0, l=props.length; i<l; i++){
				propVal = obj[props[i]];
				isObj = typeof propVal === 'object';
				obj[calcProp].left += (isObj ? (propVal.left !== undefined ? propVal.left:0):propVal);
				obj[calcProp].right += (isObj ? (propVal.right !== undefined ? propVal.right:0):propVal);
				obj[calcProp].top += (isObj ? (propVal.top !== undefined ? propVal.top:0):propVal);
				obj[calcProp].bottom += (isObj ? (propVal.bottom !== undefined ? propVal.bottom:0):propVal);
			}
			obj[calcProp].width = obj[calcProp].left + obj[calcProp].right;
			obj[calcProp].height = obj[calcProp].top + obj[calcProp].bottom;
			return (obj[calcProp].left !== cachedProp.left || obj[calcProp].right !== cachedProp.right || obj[calcProp].top !== cachedProp.top || obj[calcProp].bottom !== cachedProp.bottom);
		}
		
		CLView._cl_setWH = function(obj, prop, param){
			//if(param.isDefault && obj.parentView()['_cl_rel' + (prop === 'width') ? 'X' : 'Y'] === true)
				//return obj[prop]('scroll');
			if(param.percent !== false){
				var parentScrolling = obj._cl_parentView[prop === 'width' ? 'scrollXEnabled' : 'scrollYEnabled']('state'),
					parentSize = parentScrolling ? (obj._cl_parentView[prop]('scroll') - obj._cl_parentView._cl_calculatedClientOffset[prop] - obj._cl_parentView._cl_calculatedOffset[prop]) : obj._cl_parentView[prop]('inner');
				return parentSize * param.percent;
			} else if(param.relative !== false) 
				return obj._cl_parentView[prop]('inner') + param.relative;
			else if(param.auto !== false)
				return obj[prop]('content') + obj._cl_calculatedClientOffset[prop] + obj._cl_calculatedOffset[prop];
			else if(param.relative === false && param.percent === false && param.auto === false) 
				return param.value;
			else
				return null;
		}
		
		CLView._cl_updateWH = function(obj, val, prop, propVal, min, max, setProp){
			var fullOffset = obj._cl_calculatedOffset[prop] + obj._cl_calculatedClientOffset[prop],
				retVal = val - fullOffset,
				maxDim;
			if(obj._cl_parentView.constrainChildren() && obj._cl_parentView['_cl_' + prop].auto === false){
				maxDim = (retVal || obj[prop]('inner')) + propVal;
				if (maxDim > obj._cl_parentView[prop]('inner')) retVal = obj._cl_parentView[prop]('inner') - propVal - fullOffset;
			}
			if (min !== null && (retVal + obj._cl_calculatedClientOffset[prop]) < min) retVal = min - obj._cl_calculatedClientOffset[prop];
			if (max !== null && (retVal + obj._cl_calculatedClientOffset[prop]) > max) retVal = max - obj._cl_calculatedClientOffset[prop];
			retVal = (retVal >= 0 ? retVal : 0);
			setProp.client = setProp.inner = setProp.content = retVal;
			setProp.offset = retVal + fullOffset;
			return retVal;
		}
				
		CLView._cl_updateXY = function(obj, propVal, align, inner, param){
			var retVal = 0,
				clientOffset = obj._cl_parentView ? obj._cl_parentView._cl_calculatedClientOffset[param === 'width' ? 'left' : 'top'] : 0;
			switch (align) {
				case "left":
				case "top":
					retVal = propVal + clientOffset;
					break;
				case "center":
				case "middle":
					retVal = inner / 2 - obj[param]() / 2 + propVal + clientOffset;
					if(retVal < clientOffset) retVal = clientOffset;
					break;
				case "right":
				case "bottom":
					retVal = inner - obj[param]() + propVal + clientOffset;
					break;
			}
			return retVal;
		}
		
		CLView._cl_initialRedraw = function(obj){
			if (obj._cl_initialized && !obj._cl_initialRenderComplete) {
				obj._cl_initialRenderComplete = true;
				if(obj._cl_visible) obj._cl_viewElement.style.display = obj._cl_defaultDisplayStyle;
			}
		}
		
		CLView._cl_viewCanRedraw = function(view){
			var isValid = true;
			if(!view._cl_viewElement) isValid = false;
			if(!view._cl_parentView) isValid = false;
			if(!view.visible() && view._cl_initialRenderComplete) isValid = false;
			if(view.suspendRedraws()) isValid = false;
			if(!isValid)
				view._cl_redrawPending = false;
			return isValid;
		}
		
		CLView._cl_useTransforms = false;
		
		CLView._cl_forceGPU = false;
	})
	
	
	.Prototype('CLView', function(proto, im, CLView){
		/**#@+
	 	 * @memberOf a5.cl.CLView#
	 	 * @function
		 */	
		 
		this.Properties(function(){
			this._cl_viewElement = null;
			this._cl_viewElementType = 'div';
			this._cl_parentView = null;
			this._cl_showOverflow = false;
			this._cl_alignX = 'left';
			this._cl_alignY = 'top';
			this._cl_x = {value:0, state:false, percent:false};
			this._cl_y = {value:0, state:false, percent:false};
			this._cl_alpha = 1;
			this._cl_visible = true;
			this._cl_width = {client:0, offset:0, inner:0, value:'100%', percent:1, relative:false, auto:false, isDefault:true, content:0};
			this._cl_height = {client:0, offset:0, inner:0, value:'100%', percent:1, relative:false, auto:false, isDefault:true, content:0};
			this._cl_minWidth = null;
			this._cl_minHeight = null;
			this._cl_maxWidth = null;
			this._cl_maxHeight = null;
			this._cl_borderWidth = {top:0, left:0, right:0, bottom:0};
			this._cl_padding = {top:0, left:0, right:0, bottom:0};
			this._cl_calculatedOffset = {width:0, height:0, left:0, right:0, top:0, bottom:0};
			this._cl_calculatedClientOffset = {width:0, height:0, left:0, right:0, top:0, bottom:0};
			this._cl_redrawPending = false;
			this._cl_initialized = false;
			this._cl_initialRenderComplete = false;
			this._cl_id = null;
			this._cl_viewDefDefaults = {};
			this._cl_fromViewDef = false;
			this._cl_vdViewIsReady = false;
			this._cl_suspendRedraws = false;
			this._cl_suspendRedrawsDirect = false;
			this._cl_buildingFromViewDef = false;
			this._cl_pendingViewElementProps = {};
			this._cl_currentViewElementProps = {};
			this._cl_controller = null;
			this._cl_isInTree = false;
			this._cl_defaultDisplayStyle = 'block';
			
			this.skipViewDefReset = [];
		})
		
		proto.CLView = function(){
			proto.superclass(this);
			if(CLView._cl_transformProp === undefined)
				CLView._cl_transformProp = a5.cl.core.Utils.getCSSProp('transform');
			this._cl_viewElement = document.createElement(this._cl_viewElementType);
			this._cl_viewElement.className = proto.className.call(this);
			this._cl_viewElement.style.backgroundColor = 'transparent';
			this._cl_viewElement.style.overflowX = this._cl_viewElement.style.overflowY = this._cl_showOverflow ? 'visible' : 'hidden';
			this._cl_viewElement.id =  proto.instanceUID.call(this);
			this._cl_viewElement.style.zoom = 1;
			this._cl_viewElement.style.position = 'absolute';
			this._cl_viewElement.style.display = 'none';
		}
		
		/**
		 * Creates the display element.
		 * @name draw
		 */
		proto.draw = function(parentView){
			if (!this._cl_initialized && !this._cl_initialRenderComplete) {
				this._cl_initialized = true;
				this._cl_setParent(parentView);
				this.redraw();
				this.viewReady();
			}
		}
		
		proto.id = function(value){ 
			var val =  this._cl_propGetSet('_cl_id', value, 'string');
			return val || this.instanceUID();
		}
		
		/**
		 * @name isChildOf
		 * @param {a5.cl.CLViewContainer} target
		 */
		proto.isChildOf = function(target){
			var parent = this._cl_parentView;
			while(parent){
				if(parent === target)
					return true;
				parent = parent._cl_parentView;
			}
			return false;
		}
		
		/**
		 * Set to true to disable redraws on this view (and its children) until suspendRedraws is set to false.
		 * @name suspendRedraws
		 * @param {Boolean} value
		 */
		proto.suspendRedraws = function(value, inherited){
			if (typeof value === 'boolean') {
				if(inherited !== true)
					this._cl_suspendRedrawsDirect = value;
				this._cl_suspendRedraws = value ? value : this._cl_suspendRedrawsDirect;
				if(!value)
					this.redraw();
				return this;
			}
			return this._cl_suspendRedraws;
		}
		
		/**
		 * @name index
		 */
		proto.index = function(){
			return this._cl_viewElement.style.zIndex;
		}
		
		/**
		 * Called by the framework if data is passed to the view load.
		 * @name renderFromData
		 * @param {Object} data The data object.
		 */
		proto.renderFromData = function(data){}
		
		/**
		 * @name minWidth
		 * @param {Object} value
		 */
		proto.minWidth = function(value){ return this._cl_propGetSet('_cl_minWidth', value, 'number'); }
		
		/**
		 * @name minHeight
		 * @param {Object} value
		 */
		proto.minHeight = function(value){ return this._cl_propGetSet('_cl_minHeight', value, 'number'); }
		
		/**
		 * @name maxWidth
		 * @param {Object} value
		 */
		proto.maxWidth = function(value){ return this._cl_propGetSet('_cl_maxWidth', value, 'number'); }
		
		/**
		 * @name maxHeight
		 * @param {Object} value
		 */
		proto.maxHeight = function(value){ return this._cl_propGetSet('_cl_maxHeight', value, 'number'); }
		
		/**
		 * @name alignX
		 * @param {String} value
		 */
		proto.alignX = function(value){
			if (value !== undefined) {
				if(value === "left" || value === "center" || value === "right") {
					var shouldRedraw = (value !== this._cl_alignX);
					this._cl_alignX = value;
					if(shouldRedraw) this.redraw;
				}
				return this;
			}
			return this._cl_alignX;
		}
		
		/**
		 * @name alignY
		 * @param {String} value
		 */
		proto.alignY = function(value){
			if (value !== undefined) {
				if (value === "top" || value === "middle" || value === "bottom") {
					var shouldRedraw = (value !== this._cl_alignY);
					this._cl_alignY = value;
					if(shouldRedraw) this.redraw;
				}
				return this;
			}
			return this._cl_alignY;
		}
		
		/**
		 * @name y
		 * @param {Object} value
		 */
		proto.y = function(value, duration, ease){ 
			if (value !== undefined) {
				if (value === true) 
					return this._cl_y.state !== false && 
									this.parentView() && 
									this.parentView().relY() ? this._cl_y.state : this._cl_y.value;
				if(typeof duration === 'number' && typeof value === 'number')
					return this.animate(duration, {y:value, ease:ease});
				if (typeof value === 'object') {
					var retVal = this.y(true),
					parentView = this.parentView();
					while(parentView){
						if(!parentView)
							return null;
						if(parentView === value)
							return retVal;
						retVal += 	parentView.y(true) + 
									parentView.scrollY() + 
									parentView._cl_calculatedOffset.top + 
									parentView._cl_calculatedClientOffset.top;
						parentView = parentView.parentView();
					}					
				} else {
					var isPerc = typeof value === 'string' && value.indexOf('%') != -1;
					this._cl_y.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if (this._cl_y.percent > 1) this._cl_y.percent = 1;
					if (this._cl_y.percent < 0) this._cl_y.percent = 0;
					var shouldRedraw = value !== this._cl_y.value;
					this._cl_y.value = value;
					if (shouldRedraw) this.redraw();
					return this;
				}
			}
			return this._cl_y.value;
		}
		
		/**
		 * @name x
		 * @param {Object} value
		 */
		proto.x = function(value, duration, ease){ 
			if (value !== undefined) {
				if(value === true) 
					return this._cl_x.state !== false && 
									this.parentView() && 
									this.parentView().relX() ? this._cl_x.state : this._cl_x.value;
				if(typeof duration === 'number' && typeof value === 'number')
					return this.animate(duration, {x:value, ease:ease});
				if (typeof value === 'object') {
					var retVal = this.x(true),
					parentView = this.parentView();
					while(parentView){
						if(!parentView)
							return null;
						if(parentView === value)
							return retVal;
						retVal += 	parentView.x(true) + 
									parentView.scrollX() + 
									parentView._cl_calculatedOffset.left + 
									parentView._cl_calculatedClientOffset.left;
						parentView = parentView.parentView();
					}
				} else {
					var isPerc = typeof value === 'string' && value.indexOf('%') != -1;
					this._cl_x.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if (this._cl_x.percent > 1) this._cl_x.percent = 1;
					if (this._cl_x.percent < 0) this._cl_x.percent = 0;
					var shouldRedraw = value !== this._cl_x.value;
					this._cl_x.value = value;
					if(this._cl_x.state !== false && this.parentView() && this.parentView().relX())
						this._cl_x.state = value;
					if (shouldRedraw) this.redraw();
					return this;
				}
			}
			return this._cl_x.value;
		}
		
		/**
		 * @name rotation
		 * @param {Object} value
		 */
		proto.rotation = function(value){
			this._cl_css('transform', 'rotate(' + value + 'deg)', true);
		}
		
		proto.showOverflow = function(value){
			if(value){
				this._cl_viewElement.style.overflowX = this._cl_viewElement.style.overflowY = value === true ? 'visible' : 'hidden';
				this._cl_showOverflow = value;
				return this;
			}
			return this._cl_showOverflow;
		}
		
		/**
		 * @name background
		 * @param {Object} value
		 */
		proto.background = function(value){
			this._cl_viewElement.style.background = value;
			return this._cl_viewElement.style.background; 
		}
		
		/**
		 * @name backgroundColor
		 * @param {Object} value
		 * @param {Object} value2
		 * @param {Boolean} horizontalGradient
		 */
		proto.backgroundColor = function(value, value2, horizontalGradient){
			if(value) {
				this._cl_viewElement.style.backgroundColor = value;
				//if we're using filters, 
				if(this.cl().clientPlatform() === "IE" || this.cl().clientPlatform() === "WP7")
					this._cl_viewElement.style.filter = this._cl_viewElement.style.filter.replace(/progid:DXImageTransform\.Microsoft\.gradient\(.*?\)/gi, "");
				//if two valid hex colors were passed, use a gradient
				if(a5.cl.core.Utils.validateHexColor(value) && a5.cl.core.Utils.validateHexColor(value2)){
					if(this.cl().clientPlatform() === "IE" || this.cl().clientPlatform() === "WP7")
						this._cl_viewElement.style.filter += " progid:DXImageTransform.Microsoft.gradient(startColorstr='" + a5.cl.core.Utils.expandHexColor(value) + "', endColorstr='" + a5.cl.core.Utils.expandHexColor(value2) + "')";
					else {
						//try mozilla first
						this._cl_viewElement.style.background = "";
						this._cl_viewElement.style.background = "-moz-linear-gradient(" + (horizontalGradient === true ? 'left' : 'top') + ",  " + value + ",  " + value2 + ")";
						//if that didn't work, try the webkit version
					    if(this._cl_viewElement.style.background.indexOf('gradient') === -1)
					        this._cl_viewElement.style.background = "-webkit-gradient(linear, left top, " + (horizontalGradient === true ? 'right top' : 'left bottom') + ", from(" + value + "), to(" + value2 + "))";
					}
				} else {
					this._cl_viewElement.style.background = "";
					this._cl_viewElement.style.backgroundColor = value;
				}
				return this;
			}
			return this._cl_viewElement.style.backgroundColor;
		}
		
		/**
		 * @name alpha
		 * @param {Object} value
		 */
		proto.alpha = function(value, duration, ease){
			if(typeof value === 'number'){
				if(typeof duration === 'number')
					return this.animate(duration, {alpha:value, ease:ease});
				if (this.cl().clientPlatform() == 'IE' && this.cl().browserVersion() < 9) {
					this._cl_viewElement.style.filter = 
						this._cl_viewElement.style.filter.replace(/alpha\(.*?\)/gi, '') 
						+ ' alpha(opacity=' + (value * 100) + ')';
				} else 
					this._cl_viewElement.style.opacity = value + '';
				this._cl_alpha = value;
				return this;
			}
			return this._cl_alpha;
		}
		
		/**
		 * @name animate
		 * @param {Number} duration The duration of the animation, in seconds.
		 * @param {Object} props An object specifying the properties to animate, and the end-values as numbers.  Other special properties are also accepted, and are listed below.
		 * 
		 * @param {Number} [obj.delay] The length of time to delay before starting this animation (seconds).
		 * @param {Function|String} [obj.ease] The easing function.
		 * @param {Function} [obj.onStart] Function to be called when the animation starts.
		 * @param {Array} [obj.onStartParams] Parameters to be passed to onStart.
		 * @param {Function} [obj.onComplete] Function to be called when the animation completes.
		 * @param {Array} [obj.onCompleteParams] Parameters to be passed to onComplete
		 * @param {Object} [obj.startAt] An object specifying the start positions.
		 * @param {Boolean} [obj.redrawOnProgress=false] When set to true, the view will be redrawn at each step of the animation.  This allows the other views to react accordingly, but will generally be more processor-intensive, and may result in a choppier animation.
		 * @param {String} [obj.engine] The animation engine to use (specified by the process name, generally 'jsAnimation' or 'cssAnimation').  By default, the Animation addon will try to determine the best engine to use.
		 */
		proto.animate = function(duration, props){
			var plgn = this.plugins().getRegisteredProcess('animation');
			if (plgn) {
				plgn.animate(this, duration, props);
			} else {
				this.warn('No animation plugin was found.');
				for(var prop in props){
					if (typeof proto[prop] === 'function')
						proto[prop].call(this, props[prop]);
				}
			}
			return this;
		}
		
		/**
		 * @name easing
		 */
		proto.easing = function(){
			var plgn = this.plugins().getRegisteredProcess('animation');
			if(plgn) return plgn.easing.call(this);
			else return {};
		}
		
		/**
		 * Shortcut for setting all border attributes.  Parameters can be direct values to be applied to all borders, or an object specifying values for each border.
		 * @name border
		 * @param {Object|Number} width The value to set for borderWidth, or an object with values for top/right/bottom/left.
		 * @param {Object|String} style The value to set for borderStyle, or an object with values for top/right/bottom/left.
		 * @param {Object|String} color The value to set for borderColor, or an object with values for top/right/bottom/left.
		 * @param {Object|Number} radius The value to set for borderRadius, or an object with values for top/right/bottom/left.
		 */
		proto.border = function(width, style, color, radius){
			if(width !== undefined || style !== undefined || color !== undefined || radius !== undefined) {
				this.borderWidth(width || 0);
				this.borderStyle(style || 'solid');
				this.borderColor(color || '#000');
				this.borderRadius(radius || 0);
				return this;
			}
			return this._cl_viewElement.style.border;
		}
		
		/**
		 * Get or set the border width.
		 * @name borderWidth
		 * @param {Object|Number} width The value to set for borderWidth, or an object with values for top/right/bottom/left.
		 */
		proto.borderWidth = function(width, duration, ease){
			if(width !== undefined){
				if (typeof width === 'number') {
					if(typeof duration === 'number')
						return this.animate(duration, {borderWidth:width, ease:ease});
					this._cl_viewElement.style.borderWidth = width + 'px';
				} else {
					for (var prop in width)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Width'] = (width[prop] || 0) + 'px';
				}
				this._cl_borderWidth = width;
				this._cl_calculateOffset();
				return this;
			}
			return this._cl_viewElement.style.borderWidth;
		}
		
		/**
		 * Get or set the border style.
		 * @name borderStyle
		 * @param {Object|String} width The value to set for borderStyle, or an object with values for top/right/bottom/left.
		 */
		proto.borderStyle = function(style){
			if(style !== undefined){
				if (typeof style === 'string') {
					this._cl_viewElement.style.borderStyle = style;
				} else {
					for (var prop in style)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Style'] = style[prop] || 'solid';
				}
				return this;
			}
			return this._cl_viewElement.style.borderStyle;
		}
		
		/**
		 * Get or set the border color.
		 * @name borderColor
		 * @param {Object|String} width The value to set for borderColor, or an object with values for top/right/bottom/left.
		 */
		proto.borderColor = function(color){
			if(color !== undefined){
				if (typeof color === 'string') {
					this._cl_viewElement.style.borderColor = color;
				} else {
					for (var prop in color)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Color'] = color[prop] || '#000';
				}
				return this;
			}
			return this._cl_viewElement.style.borderColor;
		}
		
		/**
		 * Get or set the border radius.
		 * @name borderRadius
		 * @param {Object|Number} width The value to set for borderRadius, or an object with values for top/right/bottom/left.
		 */
		proto.borderRadius = function(radius, duration, ease){
			if(radius !== undefined){
				if (typeof radius === 'number') {
					if(typeof duration === 'number')
						return this.animate(duration, {borderRadius:radius, ease:ease});
					this._cl_viewElement.style[a5.cl.core.Utils.getCSSProp('borderRadius')] = radius + 'px';
				} else {
					for (var prop in radius)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Radius'] = (radius[prop] || 0) + 'px';
				}
				return this;
			}
			return this._cl_viewElement.style.borderRadius;
		}
		
		/**
		 * @name padding
		 * @param {Object} value
		 */
		proto.padding = function(value, duration, ease){
			if (value !== undefined) {
				if(typeof duration === 'number')
					return this.animate(duration, {padding:value, ease:ease});
				this._cl_padding = value;
				this._cl_calculateOffset();
				return this;
			}
			return this._cl_padding;
		}
		
		/**
		 * @name tooltip
		 * @param {Object} value
		 */
		proto.tooltip = function(value){
			if(typeof value === 'string'){
				this._cl_viewElement.title = value;
				return this;
			}
			return this._cl_viewElement.title;
		}
		
		/**
		 * @name viewReady
		 */
		proto.viewReady = function(){
			
		}
		
		/**
		 * @name moveToParentView
		 * @param {a5.cl.CLViewContainer} view
		 */
		proto.moveToParentView = function(view){
			this.removeFromParentView();
			this._cl_clParentView = null;
			view.addSubView(this);
		}
		
		/**
		 * @name removeFromPaentView
		 */
		proto.removeFromParentView = function(){
			if (this._cl_parentView) this._cl_parentView.removeSubView(this);
		}
		
		/**
		 * Called when the view element is added to a parent view.
		 * @name addedToParent
		 * @param {a5.cl.CLViewContainer} parentView The parent view it is being added to.
		 */
		proto.addedToParent = function(parentView){
			
		}
		
		/**
		 * Called when the view element has been removed from a parent view.
		 * @name removedFromParent
		 * @param {a5.cl.CLViewContainer} parentView The parent view it is being removed from.
		 */	
		proto.removedFromParent = function(parentView){
			
		}
		
		/**
		 * Sets the view to be invisible.
		 * @name hide
		 */
		proto.hide = function(){
			this._cl_viewElement.style.display = 'none';
			this._cl_visible = false;
		}
		
		/**
		 * Sets the view to be visible.
		 * @name show
		 */
		proto.show = function(){
			this._cl_viewElement.style.display = this._cl_defaultDisplayStyle;
			this._cl_visible = true;
			this.redraw();
		}
		
		/**
		 * Gets or sets the visibiity state of the view.
		 * @name visible
		 * @param value {Boolean} Whether or not the view should be visible.
		 * @return {Boolean}
		 */
		proto.visible = function(value){
			if(typeof value === 'boolean'){
				if(value)
					this.show();
				else
					this.hide();
				return this;
			}
			return this._cl_visible;
		}
		
		/**
		 * @name parentView
		 */
		proto.parentView = function(){
			return this._cl_parentView;
		}
		
		/**
		 * @name toTop
		 */
		proto.toTop = function(){
			this.parentView().subViewToTop(this);
		}
		
		/**
		 * @name toBottom
		 */
		proto.toBottom = function(){
			this.parentView().subViewToBottom(this);
		}
		
		/**
		 * @name width
		 * @param {Object} value
		 */
		proto.width = function(value, duration, ease){
			// GET
			if(value === undefined || value === null)
				value = 'offset';
			if(value === 'offset' || value === 'client' || value === 'content' || value === 'inner' || value === 'value')
				return this._cl_width[value];
			if(typeof duration === 'number' && typeof value === 'number')
				return this.animate(duration, {height:value, ease:ease});
			
			// SET
			this._cl_width.auto = this._cl_width.percent = this._cl_width.relative = this._cl_width.isDefault = false;
			if (typeof value === 'string') {
				if (value === 'auto') {
					this._cl_width.auto = true;
				} else {
					var isPerc = value.indexOf('%') != -1;
					this._cl_width.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if(this._cl_width.percent > 1) this._cl_width.percent = 1;
					if(this._cl_width.percent < 0) this._cl_width.percent = 0;
					this._cl_width.relative = !isPerc ? parseFloat(value) : false;
					this._cl_width.auto = false;	
				}
			}
			var shouldRedraw = value !== this._cl_width.value;
			this._cl_width.value = value;
			if(shouldRedraw) this.redraw();
			return this;
		}
		
		/**
		 * @name height
		 * @param {Object} value
		 */
		proto.height = function(value, duration, ease){
			// GET
			if(value === undefined || value === null)
				value = 'offset';
			if(value === 'offset' || value === 'client' || value === 'content' || value === 'inner' || value === 'value')
				return this._cl_height[value];
			if(typeof duration === 'number' && typeof value === 'number')
				return this.animate(duration, {height:value, ease:ease});
			
			// SET
			this._cl_height.auto = this._cl_height.percent = this._cl_height.relative = this._cl_height.isDefault = false;
			if (typeof value === 'string') {
				if (value === 'auto') {
					this._cl_height.auto = true;
				} else {
					var isPerc = value.indexOf('%') != -1;
					this._cl_height.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if(this._cl_height.percent > 1) this._cl_height.percent = 1;
					if(this._cl_height.percent < 0) this._cl_height.percent = 0;
					this._cl_height.relative = !isPerc ? parseFloat(value) : false;
				}
			}
			var shouldRedraw = value !== this._cl_height.value;
			this._cl_height.value = value;
			if(shouldRedraw) this.redraw();
			return this;
		}
		
		
		/**
		 * @name redraw
		 */
		proto.redraw = function(){
			if (!this._cl_redrawPending && this.parentView()) {
				this._cl_redrawPending = true;
				this.cl().MVC().redrawEngine().attemptRedraw(this);
			}
		}
		
		/**
		 * @ame isFullyVisible
		 */
		proto.isFullyVisible = function(){
			var thisView = this;
			while(thisView){
				if(!thisView.visible())
					return false;
				else
					thisView = thisView.parentView();
			}
			return true;
		}
		
		proto.processCustomViewDefNode = function(nodeName, node, imports, defaults, rootView){
			switch(nodeName){
				case 'EventListener':
					this._cl_addEventListenerFromViewDef(node, imports);
					break;
				case 'Bind':
					this._cl_bindToEventFromViewDef(node, imports, rootView);
					break;
			}
		}
		
		proto._cl_addEventListenerFromViewDef = function(node, imports){
			var type = node.type,
				listener = (this._cl_controller instanceof a5.cl.CLController && node.view  !== true) ? this._cl_controller : this,
				target = (typeof node.target === 'string') ? this.getChildView(node.target) : this,
				method = listener[node.method],
				event;
			//if an event was specified, resolve the event/constant to a string
			if(typeof node.event === 'string'){
				event = a5.GetNamespace(node.event, imports);
				if(typeof event !== 'function'){
					a5.ThrowError('Error adding event listener: Could not find the event class "' + node.event + '".');
					return;
				} else if(typeof node.type !== 'string'){
					a5.ThrowError('Error adding event listener: No type specified for the event class "' + node.event + '".');
					return;
				}
				type = event[node.type];
				if(typeof type !== 'string'){
					a5.ThrowError('Error adding event listener: Could not find the type "' + node.type + '" on class "' + node.event + '".');
					return;
				}
			}
			//throw an error if the target couldn't be found
			if(!(target instanceof CLView)){
				a5.ThrowError('Error adding event listener: Could not find the target with id "' + node.target + '".  Make sure that the EventListener node comes after the node for the target view.');
				return;
			}
			if(typeof method !== 'function'){
				a5.ThrowError('Error adding event listener: Could not find the method "' + node.method + '". Note that the method must be publicly accessible.');
				return;
			}
			target.addEventListener(type, method, node.useCapture === true, this);
		}
		
		proto._cl_bindToEventFromViewDef = function(node, imports, rootView){
			var type = node.type,
				listener, singleton, method;
			//if an event was specified, resolve the event/constant to a string
			if(typeof node.event === 'string'){
				var event = a5.GetNamespace(node.event, imports);
				if(typeof event !== 'function'){
					a5.ThrowError('Error binding to event: Could not find the event class "' + node.event + '".');
					return;
				} else if(typeof node.type !== 'string'){
					a5.ThrowError('Error binding to event: No type specified for the event class "' + node.event + '".');
					return;
				}
				type = event[node.type];
				if(typeof type !== 'string'){
					a5.ThrowError('Error binding to event: Could not find the type "' + node.type + '" on class "' + node.event + '".');
					return;
				}
			}
			//if a listener was specified by ID, look for that ID.
			if(typeof node.listener === 'string'){
				listener = rootView.getChildView(node.listener);
				if(!listener){
					a5.ThrowError('Error binding to event: Could not find a listener with the ID "' + node.listener + '".');
					return;
				}
				//if this listener is a controller, and the view was specified, use the view instead
				if(listener instanceof a5.cl.CLController && node.view === true)
					listener = listener.view();
				if(!listener){
					a5.ThrowError('Error binding to event: The controller with ID "' + node.listener + '" does not have a view.');
					return;
				}
			}
			//if a listener was specified by a singleton, resolve the class to an intance 
			else if(typeof node.singleton === 'string'){
				singleton = a5.GetNamespace(node.singleton, imports);
				if(typeof singleon !== 'function'){
					a5.ThrowError('Error binding to event: Unable to locate the class "' + node.singleton + '". Make sure to import this class, or reference it with a fully-qualified package.');
					return;
				} else if(!singleton.isSingleton()){
					a5.ThrowError('Error binding to event: Listener class "' + node.singleton + '" is not a singleton. You should specify the listener by ID with the "listener" attribute.');
					return;
				}
				listener = singleon.instance();
			} else {
				a5.ThrowError('Error binding to event: No listener was specified.  Either specify a "listener" by ID, or a "singleton" by class.');
				return;
			}
			//resolve the method
			method = listener[node.method];
			if(typeof method !== 'function'){
				a5.ThrowError('Error binding to event: Could not find the method "' + node.method + '" on listener "' + (node.listener || node.singleton) + '". Note that the method must be publicly accessible.');
				return;
			}
			this.addEventListener(type, method, node.useCapture === true, listener);
		}
		
		proto.viewRedrawn = function(){}
		
		proto.addedToTree = function(){}
		
		proto.removedFromTree = function(){}
		
		proto.isInTree = function(){ return this._cl_isInTree; }
		
		/* PRIVATE METHODS */
		
		proto._cl_addedToTree = function(){
			this._cl_isInTree = true;
			this.addedToTree();
			if(this._cl_controller)
				this._cl_controller._cl_viewAddedToTree();
		}
		
		proto._cl_removedFromTree = function(){
			this._cl_isInTree = false;
			this.removedFromTree();
			if(this._cl_controller)
				this._cl_controller._cl_viewRemovedFromTree();
		}
		
		proto._cl_addedToParent = function(parentView){
			this.addedToParent(parentView);
			if(parentView.isInTree())
				this._cl_addedToTree();
			//inherit suspendRedraws from the parent view
			proto.suspendRedraws.call(this, parentView.suspendRedraws());
			//if this view has received a vdViewReady() call, and its parent is still being built, alert the parent
			if (this._cl_vdViewIsReady && parentView._cl_buildingFromViewDef)
				parentView._cl_vdViewAdded();
			this.dispatchEvent(this.create(im.CLEvent, [im.CLEvent.ADDED_TO_PARENT]));
		}
		
		proto._cl_removedFromParent = function(parentView){
			this.removedFromParent(parentView);
			this._cl_removedFromTree();
			if(this._cl_viewElement)
				this._cl_viewElement.style.display = 'none';
			this._cl_initialRenderComplete = false;
			this.dispatchEvent(this.create(im.CLEvent, [im.CLEvent.REMOVED_FROM_PARENT]));
		}
		
		proto._cl_propGetSet = function(prop, value, type){
			if((type && typeof value === type) || (!type && value !== undefined) ){
				this[prop] = value;
				return this;
			}
			return this[prop];
		}
				
		proto._cl_css = function(prop, value, getBrowserImplementation){
			getBrowserImplementation = getBrowserImplementation || false;
			if(getBrowserImplementation)
				prop = a5.cl.core.Utils.getCSSProp(prop);
			if(prop)
				this._cl_viewElement.style[prop] = value;
			return this;
		}
		
		proto._cl_setParent = function(parentView){
			this._cl_parentView = parentView;
		}
		
		proto._cl_calculateOffset = function(){
			var offsetChanged = CLView._cl_calcOffsetObj(this, '_cl_calculatedOffset', ['_cl_borderWidth']),
				clientOffsetChanged = CLView._cl_calcOffsetObj(this, '_cl_calculatedClientOffset', ['_cl_padding']);
			if(offsetChanged || clientOffsetChanged)
				this.redraw();
		}
		
		proto._cl_redraw = function(force, suppressRender){
			if ((!this._cl_initialRenderComplete || this._cl_redrawPending || force) && a5.cl.CLView._cl_viewCanRedraw(this)) {
				var propXVal = this._cl_x.percent !== false ? (this._cl_parentView.width() * this._cl_x.percent) : this.x(true),
				propYVal = this._cl_y.percent !== false ? (this._cl_parentView.height() * this._cl_y.percent) : this.y(true),
				w = CLView._cl_setWH(this, 'width', this._cl_width),
				h = CLView._cl_setWH(this, 'height', this._cl_height),
				forceRedraw = (w !== undefined || h !== undefined);
				this._cl_pendingViewElementProps.width = w !== null ? (CLView._cl_updateWH(this, w, 'width', propXVal, this._cl_minWidth, this._cl_maxWidth, this._cl_width) + 'px') : undefined;
				this._cl_pendingViewElementProps.height = h !== null ? (CLView._cl_updateWH(this, h, 'height', propYVal, this._cl_minHeight, this._cl_maxHeight, this._cl_height) + 'px') : undefined;		
				this._cl_pendingViewElementProps.left = CLView._cl_updateXY(this, propXVal, this._cl_alignX, this._cl_parentView.width('inner'), 'width') + 'px';
				this._cl_pendingViewElementProps.top = CLView._cl_updateXY(this, propYVal, this._cl_alignY, this._cl_parentView.height('inner'), 'height') + 'px';
				this._cl_pendingViewElementProps.paddingTop = this._cl_calculatedClientOffset.top + 'px';
				this._cl_pendingViewElementProps.paddingRight = this._cl_calculatedClientOffset.right + 'px';
				this._cl_pendingViewElementProps.paddingBottom = this._cl_calculatedClientOffset.bottom + 'px';
				this._cl_pendingViewElementProps.paddingLeft = this._cl_calculatedClientOffset.left + 'px';
				
				if(this._cl_redrawPending)
					this._cl_alertParentOfRedraw();
					
				this._cl_redrawPending = false;
				
				if(suppressRender !== true)
					this._cl_render();
				CLView._cl_initialRedraw(this);
				return {force:forceRedraw, shouldRedraw:true};
			}
			CLView._cl_initialRedraw(this);
			return {force:false, shouldRedraw:false};
		}
		
		proto._cl_alertParentOfRedraw = function(){
			//determine what changed
			var changes = {
				width: this._cl_pendingViewElementProps.width !== this._cl_currentViewElementProps.width,
				height: this._cl_pendingViewElementProps.height !== this._cl_currentViewElementProps.height,
				x: this._cl_pendingViewElementProps.left !== this._cl_currentViewElementProps.left,
				y: this._cl_pendingViewElementProps.top !== this._cl_currentViewElementProps.top
			}
			if(this._cl_parentView)
				this._cl_parentView._cl_childRedrawn(this, changes);
		}
		
		proto._cl_render = function(){
			if(CLView._cl_useTransforms && CLView._cl_transformProp){
				var val = '';
				if (this._cl_pendingViewElementProps.top !== undefined) {
					val += 'translateY(' + this._cl_pendingViewElementProps.top + ') ';
					this._cl_currentViewElementProps.top = this._cl_pendingViewElementProps.top;
				}
				if (this._cl_pendingViewElementProps.left !== undefined) {
					val += 'translateX(' + this._cl_pendingViewElementProps.left + ') ';
					this._cl_currentViewElementProps.left = this._cl_pendingViewElementProps.left;
				}
				if (val !== '') {
					if(CLView._cl_forceGPU)
						val += 'translateZ(0px)';
					this._cl_viewElement.style[CLView._cl_transformProp] = val;
				}				
			}
			
			for(var prop in this._cl_pendingViewElementProps){
				var value = this._cl_pendingViewElementProps[prop];
				if (this._cl_currentViewElementProps[prop] !== value)
					this._cl_currentViewElementProps[prop] = this._cl_viewElement.style[prop] = value;
			}
			this._cl_pendingViewElementProps = {};
			this.viewRedrawn();
		}
		
		proto._cl_setIndex = function(index){
			this._cl_viewElement.style.zIndex = index;
		}
		
		proto.Override.dispatchEvent = function(event, data, bubbles){
			var e = this._a5_createEvent(event, data, bubbles);
			var viewChain = this._cl_getViewChain();
			
			//capture phase
			e._a5_phase = a5.EventPhase.CAPTURING;
			for(var x = 0, y = viewChain.length ; x < y; x++){
				this._a5_dispatchEvent.call(viewChain[x], e);
			}
			
			//target phase
			e._a5_phase = a5.EventPhase.AT_TARGET;
			this._a5_dispatchEvent(e);
			
			//bubbling phase
			if(e.bubbles()){
				e._a5_phase = a5.EventPhase.BUBBLING;
				for(var x = viewChain.length - 1; x >= 0; x--){
					this._a5_dispatchEvent.call(viewChain[x], e);
				}
			}
			if(!e.shouldRetain()) e.destroy();
			e = null;
			viewChain = null;
		}
		
		proto._cl_getViewChain = function(){
			var chain = [];
			var link = this;
			while(link._cl_parentView){
				link = link._cl_parentView;
				chain.unshift(link);
			}
			return chain;
		}
		
		proto._cl_vdViewReady = function(){
			this._cl_vdViewIsReady = true;
			if(this._cl_parentView && !this._cl_controller)
				this._cl_parentView._cl_vdViewAdded();
			else if(this._cl_controller)
				this._cl_controller._cl_viewReady();
		}
		
		proto._cl_destroyElement = function(elem){
			this.MVC()._core().garbageCollector().destroyElement(elem);
		}
		
		proto.dealloc = function(){
			if(this._cl_parentView)
				this.removeFromParentView();
			this._cl_destroyElement(this._cl_viewElement);
			this._cl_viewElement = null;
		}
});