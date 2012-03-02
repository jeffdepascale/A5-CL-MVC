
/**
 * @class Implements a view with a direct html draw area.
 * @name a5.cl.CLHTMLView
 * @extends a5.cl.CLView
 */
a5.Package('a5.cl')
	
	.Import('a5.cl.CLEvent')
	.Extends('CLView')
	.Prototype('CLHTMLView', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLHTMLView#
	 	 * @function
		 */
		
		this.Properties = function(){
			this._cl_pendingWrapperProps = {};
			this._cl_currentWrapperProps = {};
			this._cl_handleAnchors = false;
			this._cl_disallowHrefs = false;
			this._cl_scrollWidth = null;
			this._cl_scrollHeight = null;
			this._cl_clickHandlingEnabled = false;
			this._cl_isInDocument = false;
		};
		
		proto.CLHTMLView = function(html){
			proto.superclass(this);
			this.clickHandlingEnabled(true);
			if(html !== undefined)
				this.drawHTML(html);
		}
		
		/**
		 * Returns the html wrapper dom element for direct dom manipulation.
		 * @name htmlWrapper
		 * @return [DOMElement] wrapper
		 */
		proto.htmlWrapper = function(){
			return this._cl_viewElement;
		}
		
		/**
		 * If true, clicks are processed, which enabled the functionality for handleAnchors and handleHrefClick().  Defaults to true.
		 * 
		 * @name clickHandlingEnabled
		 * @param {Object} value
		 */
		proto.clickHandlingEnabled = function(value){
			if(typeof value === 'boolean'){
				if(value !== this._cl_clickHandlingEnabled)
					var self = this;
					this._cl_viewElement.onclick = !value ? null : function(e){
						self._cl_handleClicks.call(self, e || window.event);
					};
				this._cl_clickHandlingEnabled = value;
				return this;
			}
			return this._cl_clickHandlingEnabled;
		}
		
		proto._cl_handleClicks = function(e){
			var targetElem = e.target || e.srcElement,
				href, anchorIndex, anchorValid;
			if (targetElem && targetElem.tagName.toUpperCase() === 'A') {
				href = targetElem.href;
				anchorIndex = href ? href.indexOf('#') : null;
				anchorValid = false;
				if(typeof href !== 'undefined'){
					if (anchorIndex === 0 || href.substr(0, anchorIndex - 1) === this.cl().appPath(true)) 
						anchorValid = true;
					if (this._cl_handleAnchors && anchorValid) {
						this.scrollToAnchor(href.substr(anchorIndex + 1));
						return false;
					} else {
						if (this._cl_disallowHrefs) 
							return false;
						return this.handleHrefClick(href);
					}
				}
			}
		}
		
		/**
		 * @name handleAnchors
		 * @param {Boolean} value
		 */
		proto.handleAnchors = function(value){
			if(typeof value === 'boolean'){
				this._cl_handleAnchors = value;
			}
			return this._cl_handleAnchors;
		}
		
		/**
		 * @name scrollToAnchor
		 * @param {Object} anchor
		 */
		proto.scrollToAnchor = function(anchor){
			var anchors = this._cl_viewElement.getElementsByTagName('a'),
				anchorElem, i, l;
			for(i = 0, l=anchors.length; i<l; i++){
				if(anchors[i].getAttribute('name') === anchor){
					anchorElem = anchors[i];
					break;
				}
			}
			try {
				if (anchorElem) {
					var topVal = 0;
					var obj = anchorElem;

					do {
					 if (obj == this._cl_viewElement) break;
					 topVal += obj.offsetTop;
					 } while (obj = obj.parentNode);
					 this.parentView().scrollY(topVal - anchorElem.offsetHeight)
				}
			} catch(e){
				
			}
		}
		
		/**
		 * @name disallowHrefs
		 * @param {Object} value
		 */
		proto.disallowHrefs = function(value){
			if(typeof value === 'boolean'){
				this._cl_disallowHrefs = value;
			}
			return this._cl_disallowHrefs;
		}
		
		/**
		 * @name handleHrefClick
		 * @param {Object} href
		 */
		proto.handleHrefClick = function(href){
			return true;
		}
		
		/**
		 * Draws an html value to the associated element.
		 * @name drawHTML
		 * @param {String} value The html to display.
		 */
		proto.drawHTML = function(value, data){
			if(data && typeof data === 'object'){
				var plgn = this.plugins().getRegisteredProcess('htmlTemplate');
				if(plgn)
					value = plgn.populateTemplate(value, data);
			}
			this._cl_replaceNodeValue(this._cl_viewElement, value);
			return this;
		}
		
		/**
		 * Clears the html wrapper.
		 */
		proto.clearHTML = function(){
			while(this._cl_viewElement.childNodes.length)
				this._cl_destroyElement(this._cl_viewElement.firstChild);
			this.htmlUpdated();
			return this;
		}
		
		/**
		 * Appends an HTML element to the html wrapper.
		 * @name appendChild
		 * @param {HTMLElement} value The HTML element to append.
		 */
		proto.appendChild = function(value){
			this._cl_viewElement.appendChild(value);
			this.htmlUpdated();
			return this;
		}
		
		/**
		 * @name css
		 * @param {String} prop
		 * @param {String} value
		 * @param [Boolean] getBrowserImplementation=true
		 */
		proto.css = function(prop, value, getBrowserImplementation){
			getBrowserImplementation = getBrowserImplementation || false;
			if(getBrowserImplementation)
				prop = a5.cl.core.Utils.getCSSProp(prop);
			if(prop)
			this._cl_viewElement.style[prop] = value;
			return this;
		}
		
		/**
		 * @name cssClass
		 * @param {String} [value]
		 */
		proto.cssClass = function(value){
			if (typeof value === 'string') {
				this._cl_viewElement.className = value;
				return this;
			}
			return this._cl_viewElement.className;
		}
		
		/**
		 * @name htmlUpdated
		 */
		proto.htmlUpdated = function(clearScroll){
			if(clearScroll !== false)
				this._cl_scrollWidth = this._cl_scrollHeight = null;
			if ((this._cl_height.auto || this._cl_width.auto) && this.parentView())
				this.parentView().redraw();
		}
		
		proto.Override.width = function(value){
			if (value === 'scroll' || value === 'content') {
				//if(typeof this._cl_scrollWidth !== 'number')
				this._cl_scrollWidth = this._cl_viewElement.scrollWidth - this._cl_calculatedClientOffset.width;
				return value === 'content' ? this._cl_scrollWidth : Math.max(this._cl_scrollWidth + this._cl_calculatedClientOffset.left + this._cl_calculatedOffset.left, this.width('offset'));
			}
			return proto.superclass().width.apply(this, arguments);
		}
		
		proto.Override.height = function(value){
			if (value === 'scroll' || value === 'content') {
				//if (typeof this._cl_scrollHeight !== 'number') 
				this._cl_scrollHeight = this._cl_viewElement.scrollHeight - this._cl_calculatedClientOffset.height;
				return value === 'content' ? this._cl_scrollHeight : Math.max(this._cl_scrollHeight + this._cl_calculatedClientOffset.top + this._cl_calculatedOffset.top, this.height('offset'));
			} 
			return proto.superclass().height.apply(this, arguments);
			
		}
		
		proto.Override._cl_redraw = function(force, suppressRender){
			var redrawVals = proto.superclass()._cl_redraw.call(this, force, true);
			if (redrawVals.shouldRedraw) {
				this._cl_pendingViewElementProps.paddingTop = this._cl_calculatedClientOffset.top + 'px';
				this._cl_pendingViewElementProps.paddingRight = this._cl_calculatedClientOffset.right + 'px';
				this._cl_pendingViewElementProps.paddingBottom = this._cl_calculatedClientOffset.bottom + 'px';
				this._cl_pendingViewElementProps.paddingLeft = this._cl_calculatedClientOffset.left + 'px';
				this._cl_pendingViewElementProps.width = this._cl_intFromPX(this._cl_pendingViewElementProps.width) - this._cl_calculatedClientOffset.width + 'px';
				this._cl_pendingViewElementProps.height = this._cl_intFromPX(this._cl_pendingViewElementProps.height) - this._cl_calculatedClientOffset.height + 'px';
				
				if(suppressRender !== true)
					this._cl_render();
				
				if(!this._cl_isInDocument && a5.cl.core.Utils.elementInDocument(this._cl_viewElement)) {
					this._cl_isInDocument = true;
					if (this._cl_viewElement.innerHTML !== "" && (this._cl_width.auto || this._cl_height.auto)){
						var nodes = [];
						for(var x = 0, y = this._cl_viewElement.childNodes.length; x < y; x++){
							nodes.push(this._cl_viewElement.childNodes[x]);
						}
						this._cl_replaceNodeValue(this._cl_viewElement, nodes);
					}
						
				}
			}
			return redrawVals;
		}
		
		proto._cl_intFromPX = function(value){
			return parseInt(value.replace(/px$/i, ''));
		}
		
		proto._cl_replaceNodeValue = function(node, value){
			function checkUpdated(){
				if(!this._cl_initialized){
					this.cl().removeEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, checkUpdated, false);
					return;
				}
				if (node.innerHTML !== "") {
					//if auto width/height, set back to auto
					if(autoWidth) node.style.width = 'auto';
					if(autoHeight) node.style.height = 'auto';
					this.cl().removeEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, checkUpdated, false);
					this.dispatchEvent('CONTENT_UPDATED');
					this.htmlUpdated(false);
				}
			}
			
			//if auto width/height, change auto to zero
			var autoWidth = (node === this._cl_viewElement) ? this._cl_width.auto : (node.style.width === 'auto'),
				autoHeight = (node === this._cl_viewElement) ? this._cl_height.auto : (node.style.height === 'auto');
			if(autoWidth) node.style.width = 0;
			if(autoHeight) node.style.height = 0;
			
			while(node.childNodes.length)
				node.removeChild(node.firstChild);
			
			this._cl_scrollWidth = this._cl_scrollHeight = null;
			
			if (value != '') {
				this.cl().addEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, checkUpdated, false, this);
			} else {
				this.dispatchEvent('CONTENT_UPDATED');
				this.htmlUpdated(false);
			}
			if (typeof value == 'string') {
				node.innerHTML = value;
			} else {
				if (a5.cl.core.Utils.isArray(value)) {
					while(value.length)
						node.appendChild(value.shift());
				} else {
					node.appendChild(value);
				}
				//if auto width/height, set back to auto
				if(autoWidth) node.style.width = 'auto';
				if(autoHeight) node.style.height = 'auto';
			}
		}
		
		proto.dealloc = function(){
			this._cl_viewElement.onclick  = null;
		}
});
