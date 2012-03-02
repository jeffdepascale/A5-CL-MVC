a5.Package('testApp.controllers')

	.Extends('a5.cl.CLController')
	.Class('MainController', function(cls){
		
		cls.MainController = function(){
			cls.superclass(this, [true]);			
		}
		
		cls.Override.index = function(){
			var html = cls.create(a5.cl.CLHTMLView, ['Hello world!']);
			cls.render(html);
		}
	})

	