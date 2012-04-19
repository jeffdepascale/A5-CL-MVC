a5.Package('a5.cl.mvc')

	.Extends('a5.Attribute')
	.Class('InferRenderAttribute', function(cls){
		
		cls.InferRenderAttribute = function(){
			cls.superclass(this);
		}
		
		cls.Override.methodPre = function(typeRules, args, scope, method, callback, callOriginator){
			var name = method.getName(),
				cls = name.substr(0, 1).toUpperCase() + name.substr(1) + 'Controller';
			var clr = typeRules[0].im[cls].instance(true);
			clr.index.apply(clr, args);
			scope.render(clr);
			return a5.Attribute.SUCCESS;
		}
		
	})