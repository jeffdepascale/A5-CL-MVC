
a5.Package("a5.cl.mvc.core")


	.Extends("a5.cl.CLMVCBase")
	.Class("Filters", 'singleton final', function(self){
		
		var filters;
		
		this.Filters = function(){
			self.superclass(this);
			filters = [];
		}
		
		
		this.addFilter = function(params, $append){
			var append = $append || false;
			if(append) filters.push(params);
			else filters.unshift(params);
		}
	
		this.test = function(loading, unloading, callback){
			loopControllers(loading, 'before', function(valid){
				if (valid) {
					if (unloading) {
						loopControllers(unloading, 'after', function(valid){
							callback(valid);
						})
					} else {
						callback(true);
					}
				} else {
					callback(false);
				}				
			});
		}
		
		var loopControllers = function(sig, type, callback){
			var noTest = true;
			var isValid = true;	
			var count = 0;
			
			function continueLoop(){
				count++;
				loop();
			}
			
			function loop(){
				if (count < filters.length) {
					if (isValid) {				
						var filter = filters[count];
						if (testCondition(sig.controller, filter.controller)) {
							if (!sig.action || filter.action == null || filter.action == undefined || testCondition(sig.action, filter.action)) {
								noTest = false;
								executeFilter(sig, filter, type, function(valid){
									isValid = valid;
									continueLoop();
								});
							} else {
								continueLoop();
							}
						} else {
							continueLoop();
						}
					}
				} else {
					if(noTest) callback(true);
					else callback(isValid);		
				}
			}
			loop();
		}
	
		var testCondition = function(test, filterCondition){
			/*
			(controller:'*', action:'*') {
			} (controller:'foo', action:'*') {
			} (uri:'/foo/*') {
			} (uri:'/**') {
			}
			 */
			if(filterCondition == '*' || filterCondition == test) return true;
			else return false;
		}
		
		var executeFilter = function(sig, filterParams, type, callback){
			var hasMethod = false;
			if (filterParams[type]) {
				hasMethod = true;
				var methods = {
					pass:function(){
						callback(true);
					},
					fail:function(){
						callback(false);
					},
					hash:sig.hash,
					controller:sig.controller,
					action:sig.action,
					id:sig.id
				}
				filterParams[type].call(self, methods);
			}
			if(!hasMethod) callback(true);	
		}

	
});