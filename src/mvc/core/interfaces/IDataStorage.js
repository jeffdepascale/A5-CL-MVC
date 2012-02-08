
a5.Package('a5.cl.interfaces')
	.Interface('IDataStorage', function(IDataStorage){
		
		IDataStorage.isCapable = function(){};
		IDataStorage.storeValue = function(){};
		IDataStorage.getValue = function(){};
		IDataStorage.clearValue = function(){};
		IDataStorage.clearScopeValues = function(){};
		
});
