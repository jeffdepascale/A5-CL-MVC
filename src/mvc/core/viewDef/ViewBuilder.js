a5.Package('a5.cl.core.viewDef')
	.Import('a5.cl.mvc.core.XMLUtils',
			'a5.cl.core.Utils',
			'a5.cl.CLView')
	.Extends('a5.cl.CLMVCBase')
	.Static(function(ViewBuilder, im){
		ViewBuilder._cl_isInternalNodeType = function(node){
			var internalNodes = ['Imports', 'Defaults', 'Definition', 'Environment', 'Platform', 'Orientation'];
			if(node.prefix !== im.ViewDefParser._cl_nsPrefix || node.namespaceURI !== im.ViewDefParser._cl_ns) return false;
			for(var x = 0, y = internalNodes.length; x < y; x++){
				if(im.XMLUtils.localName(node) === internalNodes[x]) return true;
			}
			return false;
		}
	})
	.Prototype('ViewBuilder', function(proto, im, ViewBuilder){
		
		this.Properties(function(){
			this._cl_xml = null;
			this._cl_defaults = null;
			this._cl_imports = null;
			this._cl_rootView = null;
			this._cl_ids = null;
			this._cl_id = null;
			this._cl_view = null;
			this._cl_childIndex = 0;
			this._cl_children = null;
			this._cl_viewName = null;
			this._cl_viewReadyCallback = null;
			this._cl_buildCompleteCallback = null;
			this._cl_callbackScope
			this._cl_isCustomNode = false;
		});
		
		proto.ViewBuilder = function(controller, xml, defaults, imports, rootView, ids){
			proto.superclass(this);
			
			this._cl_controller = controller;
			this._cl_xml = xml;
			this._cl_defaults = defaults;
			this._cl_imports = imports;
			this._cl_rootView = rootView;
			this._cl_ids = ids || [];
			this._cl_children = im.XMLUtils.children(xml);
			this._cl_viewName = im.XMLUtils.localName(xml);
			
			//if(!ViewBuilder.perfTest)
			//	ViewBuilder.perfTest = this.cl().plugins().PerformanceTester().createTimer('viewBuilder');
		}
		
		proto.build = function(viewReadyCallback, buildCompleteCallback, callbackScope, view){
			//ViewBuilder.perfTest.startTest();
			this._cl_viewReadyCallback = viewReadyCallback;
			this._cl_buildCompleteCallback = buildCompleteCallback;
			this._cl_callbackScope = callbackScope;
			var xml = this._cl_xml,
				ns = im.ViewDefParser._cl_ns,
				nsPrefix = im.ViewDefParser._cl_nsPrefix;
			if(view instanceof im.CLView){
				var customNodeAttr = xml.attributes.getNamedItem('_isCustomNode');
				if(customNodeAttr)
					this._cl_isCustomNode = customNodeAttr.value === 'true';
				//if a view was passed in, we don't need to build it
				this._cl_viewCreated(view);
			} else {
				//if this node has the proper namespace and is not an internal node type...
				var hasNamespace = xml.namespaceURI === ns && xml.prefix === nsPrefix,
					isInternalNode = im.ViewBuilder._cl_isInternalNodeType(xml);
				if(hasNamespace && !isInternalNode) {
					//get the 'id' attribute
					var idAttr = xml.attributes.getNamedItem('id');
					if(idAttr) this._cl_id = idAttr.value;
					//get the ViewDef attribute
					view = this._cl_findChild(this._cl_id);
					//if there's already a view for that ID, jump to this._cl_viewCreated().
					if(view instanceof im.CLView && im.Utils.arrayIndexOf(this._cl_ids, this._cl_id) === -1) {
						this._cl_viewCreated(view);
					} else if(!this._cl_id || im.Utils.arrayIndexOf(this._cl_ids, this._cl_id) === -1) {							
						var classDef = this._cl_imports[this._cl_viewName] || im.ViewDefParser._cl_resolveQualifiedClass(this._cl_viewName, this._cl_imports);
						if(!classDef){
							this.redirect(500, 'Error parsing the view definition for controller "' + this._cl_controller.namespace() + '". ' + im.XMLUtils.localName(xml) + ' could not be found. \
							Make sure this class was imported into the view definition and included in the dependencies.');
							return;
						}
						//check if constructor params were set on this node
						var constructAttr = im.XMLUtils.getNamedItemNS(xml.attributes, 'Construct', ns, nsPrefix),
							constructParams = constructAttr ? im.ViewDefParser.processAttribute(constructAttr.value) : [];
						//create an instance
						view =a5.Create(classDef, constructParams);
						if(view instanceof im.CLView) {
							//if it's a CLView, send it to this._cl_viewCreated()
							this._cl_viewCreated(view);
						} else if(view instanceof a5.cl.CLController){
							//if the new view is actually a controller, generate the view
							var controller = view;
							view = null;
							controller.id(this._cl_id);
							//compile a list of reserved node names for this class and all of its ancestors
							this._cl_compileCustomNodes(controller);
							this._cl_controller._cl_childControllers.push(controller);
							//get the view from the controller
							controller.generateView(this._cl_viewCreated, this);
						}
					} else {
						this.redirect(500, 'Error: Duplicate id (' + this._cl_id + ') found in view definition for controller "' + this._cl_controller.namespace() + '".');
						return;
					}
				} else {
					//if there's nothing to create, stop here
					if(typeof this._cl_buildCompleteCallback === 'function')
						this._cl_buildCompleteCallback.call(this._cl_callbackScope, null);
				}
			}
		}
		
		proto._cl_viewCreated = function(view){
			//ViewBuilder.perfTest.completeTest();
			this._cl_view = view;
			view._cl_fromViewDef = true;
			view._cl_vdViewIsReady = false;
			if (!this._cl_rootView) {
				this._cl_rootView = view;
				view._cl_controller = this._cl_controller;
			}
			if(this._cl_id)
				view.id(this._cl_id);
			this._cl_ids.push(view.id());
			//if this view doesn't have a controller, reset all the ViewDef stuff
			if(!view._cl_controller || view === this._cl_rootView){
				this._cl_removeViewDefViews(); //remove any previously added subviews 
				this._cl_resetViewProperties(); //reset any previously set properties
				//compile a list of reserved node names for this class and all of its ancestors
				this._cl_compileCustomNodes();
			}
			this._cl_applyAttributeTree();
			//alert the parent builder that the view is ready
			if(typeof this._cl_viewReadyCallback === 'function')
				this._cl_viewReadyCallback.call(this._cl_callbackScope, view);
			//create the child views, if necessary
			this._cl_childIndex = 0;
			view._cl_pendingChildren = this._cl_children.length;
			this._cl_buildNextChild();
		}
		
		proto._cl_buildNextChild = function(){
			if(this._cl_children && this._cl_childIndex < this._cl_children.length){
				this._cl_view._cl_buildingFromViewDef = true;
				var thisChild = this._cl_children[this._cl_childIndex],
					hasController = this._cl_view._cl_controller instanceof a5.cl.CLController && this._cl_view !== this._cl_rootView,
					customNodes = hasController ? this._cl_view._cl_controller.constructor._cl_customViewDefNodes : this._cl_view.constructor._cl_customViewDefNodes,
					customNodeTarget = hasController ? this._cl_view._cl_controller : this._cl_view,
					customControllerNodes = this._cl_view === this._cl_rootView ? this._cl_compileCustomNodes(this._cl_controller) : [],
					localName = im.XMLUtils.localName(thisChild);
				//if this node is a reserved custom node type, let the view handle it.
				if(im.Utils.arrayContains(customNodes, localName) || im.Utils.arrayContains(customControllerNodes, localName)){
					var nodeObj = this._cl_convertNodeToObject(thisChild);
					if(im.Utils.arrayContains(customControllerNodes, localName))
						customNodeTarget = this._cl_controller;
					customNodeTarget.processCustomViewDefNode(nodeObj._name, nodeObj, this._cl_imports, this._cl_defaults, this._cl_rootView);
					this._cl_childIndex++;
					//Added method check due to CLView being a possible node owner
					if(this._cl_view._cl_vdViewAdded && !this._cl_isCustomNode)
						this._cl_view._cl_vdViewAdded();
					this._cl_buildNextChild();
					return;
				} else if(!hasController || this._cl_view === this._cl_rootView){
					//otherwise, assume it's a subview, and build it.
					var builder = new im.ViewBuilder(this._cl_controller, thisChild, this._cl_defaults, this._cl_imports, this._cl_rootView, this._cl_ids);
					builder.build(this._cl_viewReadyHandler, this._cl_buildCompleteHandler, this);
				} else {
					this.throwError("Error parsing view definition for " + this._cl_controller.id() + ".  Views cannot be applied to the controller '" + this._cl_view._cl_controller.id() + "'.  Use a separate view definition to define the view structure for each controller.");
					return;
				}
			} else {
				//Added method check due to CLView being a possible node owner
				if (this._cl_view._cl_vdViewReady) 
					this._cl_view._cl_vdViewReady();
				if(typeof this._cl_buildCompleteCallback === 'function')
					this._cl_buildCompleteCallback.call(this._cl_callbackScope, this._cl_view);
				this._cl_view.suspendRedraws(false);
				this.destroy();
			}
		}
		
		proto._cl_findChild = function(id){
			if(typeof id !== 'string' || !this._cl_rootView)
				return null;
			//first, look in the child views of the root view
			var child = this._cl_rootView.getChildView(id),
				x, y, thisOrphan;
			if(child)
				return child;
			//if no matching child was found, check the orphanage
			for(x = 0, y = this._cl_controller._cl_orphanage.length; x < y; x++){
				thisOrphan = this._cl_controller._cl_orphanage[x];
				if(thisOrphan.id() === id)
					return thisOrphan;
			}
			//finally, check the child controllers
			return this._cl_controller.getChildController(id);
			
		}
		
		proto._cl_viewReadyHandler = function(childView){
			if (childView) {
				this._cl_view.addSubViewAtIndex(childView, this._cl_childIndex);
				if(childView._cl_controller)
					this._cl_view._cl_vdViewAdded();
			}
		}
		
		proto._cl_buildCompleteHandler = function(view){
			this._cl_childIndex++;
			this._cl_buildNextChild();
		}
		
		proto._cl_removeViewDefViews = function(view){
			if(!view)
				view = this._cl_view;
			if(!(view instanceof a5.cl.CLViewContainer) || !view._cl_fromViewDef)
				return;
			var childViews = view._cl_childViews.slice(0),
				x, y, thisChild;
			for(x = 0, y = childViews.length; x < y; x++){
				thisChild = childViews[x];
				if (thisChild._cl_fromViewDef) {
					this._cl_controller._cl_orphanage.push(thisChild);
					this._cl_removeViewDefViews(thisChild);
					view.removeSubView(thisChild, false);
				}
			}
		}
		
		proto._cl_resetViewProperties = function(){
			var view = this._cl_view;
			for(var prop in view._cl_viewDefDefaults){
				//make sure this property isn't supposed to be skipped
				if (im.Utils.arrayIndexOf(view.skipViewDefReset, prop) === -1) {
					//if it's a method, use call(), otherwise set the value directly
					if (typeof view[prop] === 'function') 
						view[prop].call(view, view._cl_viewDefDefaults[prop]);
					else
						view[prop] = view._cl_viewDefDefaults[prop];
				}
			}
		}
		
		proto._cl_applyAttributeTree = function(){
			var defaults = this._cl_defaults;
			//set the defaults first
			if (defaults) {
				//start at the top with the global defaults
				this._cl_applyDefaults(defaults);
				//get the environment variables
				var clientEnvironment = this.DOM().clientEnvironment(true).toUpperCase(),
					clientPlatform = this.DOM().clientPlatform().toUpperCase(),
					clientOrientation = this.DOM().clientOrientation().toUpperCase();
				//apply top-level environment attributes
				var envNodes = this._cl_applyEnvironmentDefaults(defaults, 'Environment', clientEnvironment);
				//apply loose orientation attributes
				for(var x = 0, y = envNodes.length; x < y; x++){
					this._cl_applyEnvironmentDefaults(envNodes[x], 'Orientation', clientOrientation);
				}
				//apply top-level platform attributes
				var platformNodes = [];
				for(var x = 0, y = envNodes.length; x < y; x++){
					var thesePlatforms = this._cl_applyEnvironmentDefaults(envNodes[x], 'Platform', clientPlatform);
					platformNodes.push.apply(platformNodes, thesePlatforms);
				}
				//apply orientation attributes nested within a platform node
				for(var x = 0, y = platformNodes.length; x < y; x++){
					this._cl_applyEnvironmentDefaults(platformNodes[x], 'Orientation', clientOrientation);
				}
			}
			//finally, set the instance-specific attributes
			this._cl_applyAttributes(this._cl_xml);
		}
		
		proto._cl_applyEnvironmentDefaults = function(defaults, environmentName, environmentValue){
			var nodes = [],
				children = im.XMLUtils.children(defaults);
			for (var x = 0, xl = children.length; x < xl; x++) {
				var thisNode = children[x];
				if(thisNode.prefix === im.ViewDefParser._cl_nsPrefix && im.XMLUtils.localName(thisNode) === environmentName){
					//if this tag value contains the target value...
					if(thisNode.getAttribute('value').toUpperCase().indexOf(environmentValue) !== -1){
						//apply the Env defaults
						this._cl_applyDefaults(thisNode);
						//cache this node for later
						nodes.push(thisNode);
					}
				}
			}
			return nodes;
		}
		
		proto._cl_applyDefaults = function(defaults){
			var children = im.XMLUtils.children(defaults);
			for (var x = 0, xl = children.length; x < xl; x++) {
				var thisNode = children[x];
				if(im.XMLUtils.localName(thisNode) === this._cl_viewName){
					this._cl_applyAttributes(thisNode);
				}
			}
		}
		
		proto._cl_applyAttributes = function(xmlNode){
			var x, y, attr, attrName, recipient;
			//loop through the attributes on the xmlNode
			for (var x = 0, y = xmlNode.attributes.length; x < y; x++) {
				attr = xmlNode.attributes[x];
				//if it's not 'id', apply it to the view
				attrName = im.XMLUtils.localName(attr);
				if(attrName !== 'id' && im.XMLUtils.getPrefix(attr) !== im.ViewDefParser._cl_nsPrefix){
					//if this view has a controller, try to set the property/method on the controller, but fall back to the view itself
					recipient = (this._cl_view._cl_controller && typeof this._cl_view._cl_controller[im.XMLUtils.localName(attr)] !== 'undefined') ? this._cl_view._cl_controller : this._cl_view;
					if (typeof recipient[attrName] === 'function') {
						//if this property hasn't been cached yet, do so before setting it
						if (!recipient._cl_viewDefDefaults[attrName])
							recipient._cl_viewDefDefaults[attrName] = recipient[attrName].apply(recipient, this._cl_getParamsForRetrievingDefault(attrName));
						recipient[attrName].apply(recipient, im.ViewDefParser.processAttribute(attr.value));
					} else {
						//if this property hasn't been cached yet, do so before setting it
						if(!recipient._cl_viewDefDefaults[attrName])
							recipient._cl_viewDefDefaults[attrName] = recipient[attrName];
						recipient[attrName] = im.ViewDefParser.processAttribute(attr.value)[0];
					}
				}
			}
		}
		
		proto._cl_getParamsForRetrievingDefault = function(attrName){
			switch(attrName){
				case 'width':
				case 'height':
					return ['value'];
				default:
					return [];
			}
		}
		
		proto._cl_compileCustomNodes = function(obj){
			var baseObj = obj || this._cl_view,
				descenderRef = baseObj.constructor,
				compiled = [];
			//if the list has already been compiled for this class, we don't have to do anything
			if(im.Utils.isArray(baseObj.constructor._cl_customViewDefNodes))
				return baseObj.constructor._cl_customViewDefNodes;
			//otherwise, climb the family tree
			while(descenderRef !== null) {
				var theseNodes = descenderRef.customViewDefNodes || [];
				Array.prototype.push.apply(compiled, theseNodes);
				descenderRef = descenderRef.superclass && descenderRef.superclass().constructor.namespace ? descenderRef.superclass().constructor : null;
			}
			baseObj.constructor._cl_customViewDefNodes = compiled;
			return compiled;
		}
		
		proto._cl_convertNodeToObject = function(node){
			var obj = {};
			obj._name = im.XMLUtils.localName(node);
			obj.node = node;
			for(var x = 0, y = node.attributes.length; x < y; x++){
				var thisAttr = node.attributes[x];
				obj[thisAttr.name] = im.ViewDefParser.processAttribute(thisAttr.value);
				if(obj[thisAttr.name].length === 1)
					obj[thisAttr.name] = obj[thisAttr.name][0];
			}
			node.setAttribute('_isCustomNode', 'true');
			return obj;
		}
	});
