

a5.Package('a5.cl.mvc.mixins')

	.Mixin('CSS3Props', function(mixin){
	
		mixin.MustExtend('a5.cl.CLView');
		
		mixin.CSS3Props = function(){
		}
		
		mixin._cl_processCSS3Prop = function(prop, check, value){
			if(value === true)
				return a5.cl.initializers.dom.Utils.getCSSProp(prop) !== null;
			return this._cl_css(prop, value, true);
		}
		
		/**
		 * @name rotation
		 * @param {Object} value
		 */
		mixin.rotation = function(value){
			return this._cl_processCSS3Prop('transform', (value === true), 'rotate(' + value + 'deg)', true);
		}	
		
		mixin.maskImage = function(value){
			return this._cl_processCSS3Prop('maskImage', (value === true), 'url(' + value + ')', true);
		}
		
		mixin.shadow = function(value){
			return this._cl_processCSS3Prop('boxShadow', (value === true), value, true);
		}
		
		
})
