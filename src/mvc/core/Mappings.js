
a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.core.Instantiator')
	.Extends('a5.cl.CLBase')
	.Class("Mappings", 'singleton final', function(self, im){

		var mappings,
			errorMappings,
			lastMapping = null,
			paramArray = ['controller', 'action', 'id'];
		
	
		this.Mappings = function(){
			self.superclass(this);
			mappings = errorMappings = [];
		}
		
		this.addConfigMappings = function(){
			var $mappings = a5.cl._cl_storedCfgs.mappings;
			if ($mappings) {
				for (var i = 0, l=$mappings.length; i < l; i++) 
					self.addMapping($mappings[i], false);
			}
		}
		
		this.addMapping = function(mappingObj, $append){
			var append = $append || false,
				controller = im.Instantiator.instance().getClassInstance('Controller', mappingObj.controller, true);
			if(!(controller instanceof a5.cl.CLController)){
				this.throwError('Unable to instantiate the controller ' + mappingObj.controller);
				return;
			} else if(controller.instanceCount() > 1) {
				this.throwError('Cannot add a mapping to a controller with multiple instances (' + controller.namespace() + ').');
				return
			}
			controller._cl_setMappable();
			
			if (typeof mappingObj.desc === 'number') {
				if (mappingObj.controller) {
					if(append) errorMappings.push(mappingObj);
					else errorMappings.unshift(mappingObj);
				}
			} else {
				if (typeof mappingObj.desc === 'string') {
					mappingObj.desc = mappingObj.desc.split('/');
					mappingObj.desc.shift();
				} else {
					self.throwError('invalid mapping: "desc" param must be a string');
				}
				if(append) mappings.push(mappingObj);
				else mappings.unshift(mappingObj);
			}
		}
		
		this.getCallSignature = function(hashArray){
			var matchedSig = matchSignature(hashArray);
			if (matchedSig) {
				matchedSig.hash = hashArray.join('/');
				lastMapping = matchedSig;
				return matchedSig;
			} else return null; 
		}
		
		this.geLastCallSignature = function(){
			return lastMapping;
		}
		
	
		this.getErrorSignature = function(num){
			for (var i = 0, l=errorMappings.length; i<l; i++)
				if(errorMappings[i].desc == num)
					return {controller:errorMappings[i].controller, action:errorMappings[i].action, id:errorMappings[i].id }
			return null;
		}
		
		var matchSignature = function(param){
			var hashArray = (typeof param == 'object' ? param:[param]);
			for(var prop in hashArray)
				if(hashArray[prop] == undefined)
					hashArray[prop] = "";
			if(!hashArray.length) hashArray = [""];
			var retSig = null;
			for (var i = 0, l=mappings.length; i < l; i++) {
				var matchData = runMatchAlgorithm(mappings[i], hashArray);
				if (matchData) {
					var sigObj = {
						controller:mappings[i].controller,
						action:mappings[i].action,
						id:mappings[i].id
					};
					for (var prop in matchData) 
						if (sigObj[prop] == undefined) 
							sigObj[prop] = matchData[prop];			
					var passedConstraints = true;
					if (mappings[i].constraints) passedConstraints = mappings[i].constraints(sigObj.controller, sigObj.action, sigObj.id);
					if (passedConstraints) retSig = sigObj;
				}
				if(retSig) break;
			}
			return retSig;
		}
		
		var runMatchAlgorithm = function(mapping, hashArray){
			var retObj = {};
			var isValid = false;
			var isDequalified = false;
			var hasIDProps = false;
			for (var i = 0, l= mapping.desc.length; i <l; i++) {
				if (!isDequalified) {
					var isDirect = mapping.desc[i].indexOf(':') == 0;
					if (isDirect) {
						var isOptional = mapping.desc[i].indexOf('?') == mapping.desc[i].length - 1;
						var foundProp = false;
						for (var j = 0, m = paramArray.length; j < m; j++) {
							if (!foundProp) {
								if (mapping.desc[i].substr(1, mapping.desc[i].length - (isOptional ? 2 : 1)) == paramArray[j]) {
									foundProp = isValid = true;
									if (i >= hashArray.length) {
										if (!isOptional) isValid = false;
									} else {
										if (paramArray[j] == 'id') {
											retObj.id = hashArray.slice(i);
											hasIDProps = true;
										} else retObj[paramArray[j]] = hashArray[i];
									}
								} else {
									if (!isOptional) isValid = false;
								}
							}
						}
					} else {
						isValid = (i < hashArray.length && mapping.desc[i] == hashArray[i]);
						if (!isValid) isDequalified = true;
					}
				}
			}
			if(isValid){
				if(!hasIDProps && hashArray.length > mapping.desc.length)
					return null;
				else 
					return retObj;
			} else {
				return null;
			}
	
		}

	
});