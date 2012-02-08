a5.Package('a5.cl.mvc.core')

	.Extends('a5.cl.CLBase')
	.Class('GarbageCollector', 'singleton final', function(self, im){

		var recycleBin = document.createElement('div'),
			gcElemCount = 0,
			capacity = 10;
		
		this.GarbageCollector = function(){
			self.superclass(this);
		}
		
		this.destroyElement = function(elem, force){
			if(!a5.cl.core.Utils.isArray(elem))
				elem = [elem];
			for(var x = 0, y = elem.length; x < y; x++)
				addElemToRecycleBin(elem[x]);
			
			if (gcElemCount >= capacity || force === true) {
				recycleBin.innerHTML = "";
				gcElemCount = 0;
			}
		}
		
		var addElemToRecycleBin = function(elem){
			try {
				recycleBin.appendChild(elem);
				gcElemCount++;
			} catch (e) {
				//the element must not have been a valid HTMLElement, but there's not currently an efficient cross-browser way to check before-hand.
			}
		}
	});
