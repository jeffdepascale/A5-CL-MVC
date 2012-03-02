
a5.Package('testApp.tests')

	.Extends('a5.cl.CLUnitTest')
	.Class('Test', function(cls){
		
		cls.Test = function(){
			cls.superclass(this);
		}
		
		cls.Override.runTest = function(){
			
		}
		
})