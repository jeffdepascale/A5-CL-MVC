a5.Package('a5.cl.mvc')

	.Extends('a5.Attribute')
	.Class('InferRenderAttribute', function(cls){
		
		cls.InferRenderAttribute = function(){
			cls.superclass(this);
		}
		
		cls.Override.methodPre = function(typeRules, args, scope, method, callback, callOriginator){
			var name = method.getName(),
				cls = name.substr(0, 1).toUpperCase() + name.substr(1) + typeRules[0].type ? typeRules[0].type : 'Controller';
			scope.render(typeRules[0].im[cls].instance(true, args));
			return a5.Attribute.SUCCESS;
		}
		
	})