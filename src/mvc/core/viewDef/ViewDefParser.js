a5.Package('a5.cl.core.viewDef')
	.Import('a5.cl.*',
			'a5.cl.mvc.core.XMLUtils',
			'a5.cl.core.Utils')
	.Extends('a5.cl.CLBase')
	.Static(function(ViewDefParser, im){
		ViewDefParser._cl_ns = 'http://corelayerjs.com/';
		ViewDefParser._cl_nsPrefix = 'cl';
		
		ViewDefParser.getImports = function(xml){
			//get the cl:Import nodes
			var importsNode = ViewDefParser.getElementsByTagName(xml.documentElement, 'Imports'),
				imports = (importsNode && importsNode.length > 0) ? ViewDefParser.getElementsByTagName(importsNode[0], 'Import') : [], 
				namespaces = [],
				x, y, importNode;
			for(x = 0, y = imports.length; x < y; x++){
				importNode = imports[x];
				namespaces.push(importNode.getAttribute('ns'));
			}
			return a5._a5_processImports(namespaces);
		}
		
		ViewDefParser._cl_getEnvironmentNode = function(rootNode, environmentName, environmentValue){
			var children = im.XMLUtils.children(rootNode);
			for (var x = 0, xl = children.length; x < xl; x++) {
				var thisNode = children[x];
				if (thisNode.prefix === ViewDefParser._cl_nsPrefix && im.XMLUtils.localName(thisNode) === environmentName) {
					//if this tag value contains the target value, return the node
					if (thisNode.getAttribute('value').toUpperCase().indexOf(environmentValue) !== -1) 
						return thisNode;
				}
			}
			return null;
		}
		
		ViewDefParser._cl_resolveQualifiedClass = function(ns, imports){
			var classRef = a5.GetNamespace(ns.replace(/_/g, '.'));
			if(typeof imports === 'object')
				imports[ns] = classRef;
			return classRef;
		}
		
		ViewDefParser.getElementsByTagName = function(xml, tagName){
			return im.XMLUtils.getElementsByTagNameNS(xml, tagName, ViewDefParser._cl_ns, ViewDefParser._cl_nsPrefix);
		}
		
		ViewDefParser.processAttribute = function(value){
			//first split the value (pipe delimited)
			var attributes = value.split('|'),
				json = window.JSON || a5.cl.core.JSON,
			//regex for detecting strict typing
				typeFlags = /{Boolean}|{Number}|{Array}|{String}|{Object}|{Namespace}/,
			//loop through each attribute value and process it
				processed = [],
				x, y, attr, type;
			for(x = 0, y = attributes.length; x < y; x++){
				attr = attributes[x];
				//determine the type
				type = typeFlags.exec(attr);
				if(im.Utils.isArray(type))
					type = type[0];
				//remove the type flag from the value
				attr = attr.replace(typeFlags, '');
				switch(type){
					case '{Boolean}': //force to a boolean
						processed.push(attr === 'true');
						break;
					case '{Number}': //use parseInt to force to a number
						processed.push(parseInt(attr));
						break;
					case '{Array}':
					case '{Object}': //use JSON to parse an array or object
						processed.push(json.parse(attr));
						break;
					case '{String}': //force to String
						processed.push(attr + '');
						break;
					case '{Namespace}': //resolve namespace
						processed.push(a5.GetNamespace(attr, this._cl_imports));
						break;
					default: //try to guess by default
						if(!isNaN(attr)) //check if it's a number
							processed.push(parseFloat(attr));
						else if(attr === 'true' || attr === 'false') //check if it's a boolean
							processed.push(attr === 'true');
						else if(/(^\[.*\]$)|(\{.*\})$/.test(attr)) //check if it looks like an object or an array
							processed.push(json.parse(attr));
						else //otherwise, force to string
							processed.push(attr + '');
				}
			}
			return processed;
		}
	})
	.Prototype('ViewDefParser', function(proto, im, ViewDefParser){
		
		proto.ViewDefParser = function(xml, controller){
			proto.superclass(this);
			
			this._cl_controller = controller;
			this._cl_xml = (typeof xml === 'string') ? im.XMLUtils.parseXML(xml) : xml;
			this._cl_rootView = controller.view();
			this._cl_imports = ViewDefParser.getImports(this._cl_xml);
			this._cl_definitionNode = this._cl_getDefinitionNode();
			this._cl_defaultsNode = this._cl_getDefaults();
			//this._cl_perfTest = this.cl().plugins().PerformanceTester().createTimer(this.instanceUID());
			
			if(!this._cl_definitionNode) {
				this.redirect(500, 'Unable to find a valid cl:Definition element in the view definition.');
				return;
			}
		}
		
		proto.parse = function(viewReadyCallback, buildCompleteCallback, scope){
			//this._cl_perfTest.startTest();
			if(this._cl_rootView)
				this._cl_definitionNode = this._cl_getDefinitionNode();
			var firstChild = im.XMLUtils.children(this._cl_definitionNode)[0],
				builder = this.create(a5.cl.core.viewDef.ViewBuilder, [this._cl_controller, firstChild, this._cl_defaultsNode, this._cl_imports, this._cl_rootView]);
			
			builder.build(
				//view ready
				function(view){
					this._cl_rootView = view;
					if(typeof viewReadyCallback === 'function') 
						viewReadyCallback.call(scope, view);
				},
				//build complete
				function(view){
					//this._cl_perfTest.completeTest();
					if(typeof buildCompleteCallback === 'function')
						buildCompleteCallback.call(scope, view);
				},
				this, this._cl_rootView
			);
		}
		
		proto.hasOrientationOptions = function(){
			var orientationNodes = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Orientation');
			return (orientationNodes && orientationNodes.length > 0);
		}
		
		proto.hasEnvironmentOptions = function(targetEnv){
			var envNodes = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Environment');
			if(envNodes && envNodes.length > 0){
				if(typeof targetEnv === 'string'){
					for(var x = 0, y = envNodes.length; x < y; x++){
						var thisNode = envNodes[x];
						if(im.Utils.arrayIndexOf(thisNode.getAttribute('value').split('|'), targetEnv) > -1)
							return true;
					}
					return false;
				}
				return true;
			}
			return false;
		}
		
		proto._cl_getDefaults = function(){
			//get the cl:Defaults node
			var defNode = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Defaults');
			return (defNode && defNode.length > 0) ? defNode[0] : null;
		}
		
		proto._cl_getDefinitionNode = function(){
			var clientEnvironment = this.cl()._core().envManager().clientEnvironment(true).toUpperCase(),
				clientPlatform = this.cl()._core().envManager().clientPlatform().toUpperCase(),
				clientOrientation = this.cl()._core().envManager().clientOrientation().toUpperCase(),
				defNode = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Definition'),
				definition = (defNode && defNode.length > 0) ? defNode[0] : null,
				env = ViewDefParser._cl_getEnvironmentNode(definition, 'Environment', clientEnvironment);
			
			if(definition && env){
				//check it for an appropriate Platform node
				var plat = ViewDefParser._cl_getEnvironmentNode(env, 'Platform', clientPlatform);
				if(plat){
					//if an appropriate Platform node was found, check it for an appropriate Orientation node
					var orient = ViewDefParser._cl_getEnvironmentNode(plat, 'Orientation', clientOrientation);
					if(orient.length > 0)
						return orient;	//if one was found, return it
					else
						return plat;	//otherwise, platform is as specific as we can get, so return that
						
				} else {
					//if no Platform was found, check for a loose Orientation
					var orient = ViewDefParser._cl_getEnvironmentNode(env, 'Orientation', clientOrientation);
					if(orient)
						return orient;	//if one was found, return it
					else
						return env;		//otherwise, environment is as specific as we can get, so return that
				}
			} else {
				//no Environment tag was found, so just return the raw definition node
				return definition;
			}
		}
	});
