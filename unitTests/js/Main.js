
a5.Package('testApp')

	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls){
		
		cls.Main = function(app){
			cls.superclass(this);
			cls.setConfig({
				dependencies:[
					'js/controllers/MainController.js'
				]
			})
		}
		
		cls.Override.pluginsLoaded = function(){
			cls.setMappings([
				{desc:'/', controller:'Main'}
			])
		}
})
a5.cl.CreateApplication();	
