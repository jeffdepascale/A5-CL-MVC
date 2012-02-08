
a5.Package('a5.cl.mixins')
	.Mixin('BindableSource', function(mixin, im){
		
		mixin.BindableSource = function(){
			this._cl_receivers = [];
			this._cl_paramType = null;
			this._cl_paramRequired = false;
		}
		
		mixin.paramType = function(type){
			if (type) {
				this._cl_paramType = type;
				return this;
			}
			return this._cl_paramType;
		}
		
		mixin.paramRequired = function(value){
			if (value) {
				this._cl_paramRequired = value;
				return this;
			}
			return this._cl_paramRequired;
		}
		
		mixin.updateBinds = function(data){
			this.notifyReceivers(data);
		}
		
		mixin.attachReceiver = function(receiver, params, mapping, scope){
			this._cl_receivers.push({receiver:receiver, params:params, mapping:mapping, scope:scope});
			this.updateBinds();
		}
		
		mixin.notifyReceivers = function(data){
			if (this._cl_paramRequired === true) {
				this.throwError('cannot call notifyReceivers on mixed class "' + this.namespace() + '", paramRequired bind sources must call notifyFromParams.');
			} else {
				for (var i = 0, l = this._cl_receivers.length; i < l; i++) {
					var r = this._cl_receivers[i];
					r.receiver.call(r.scope, this._cl_modifyBindData(data, r.mapping))
				}
			}
		}
		
		mixin.notifyFromParams = function(callback){
			for (var i = 0, l = this._cl_receivers.length; i < l; i++) {
				var r = this._cl_receivers[i];
				var result = callback(r.params);
				if(result !== null)
					r.receiver.call(r.scope, this._cl_modifyBindData(result, r.mapping));
			}
		}
		
		mixin.detachReceiver = function(receiver){
			for(var i = 0, l = this._cl_receivers.length; i<l; i++){
				var r = this._cl_receivers[i];
				if(r.receiver === receiver){
					this._cl_receivers.splice(i, 1);
					break;
				}
			}
		}
		
		mixin._cl_modifyBindData = function(dataSource, mapping){
			var data,
				isQuery = false;
			if(dataSource instanceof a5.cl.CLQueryResult)
				isQuery = true;
			if(isQuery)
				data = dataSource._cl_data;
			else 
				data = dataSource;
			if(mapping){
				var dataSet = [],
					skipProps = {};
				for (var i = 0, l = data.length; i < l; i++) {
					var dataRow = {};
					for (var prop in mapping) {
						dataRow[prop] = data[i][mapping[prop]];
						skipProps[mapping[prop]] = prop;
					}
					for(var prop in data[i])
						if(skipProps[prop] === undefined)
							dataRow[prop] = data[i][prop];
					dataSet.push(dataRow);
				}
				if (isQuery) {
					dataSource._cl_data = dataSet;
					return dataSource;
				} else {
					return dataSet;
				}
			} else {
				return dataSource;
			}
		}
				
});
