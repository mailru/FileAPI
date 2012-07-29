(function (api){
	var XHR = function (options){
		this.options = options;
	};


	XHR.prototype = {
		status: 0,
		statusText: '',

		getResponseHeader: function (name){
			return this.xhr && this.xhr.getResponseHeader(name);
		},

		getAllResponseHeaders: function (){
			return this.xhr && this.xhr.getAllResponseHeaders() || {};
		},

		end: function (status){
			var options = this.options;
			this.abort	= api.F;
			this.status = status;

			options.complete(status == 200 ? 'success' : 'error', this);
		},

		abort: function (){
			this.statusText = 'abort';
			this.end(0);

			if( this.xhr ){
				this.xhr.abort();
			}
		},

		send: function (FormData){
			var _this = this, options = this.options;

			FormData.toData(function (data){
				// Start uploading
				options.upload(options, _this);
				_this._sendData.call(_this, options, data);
			});
		},

		_sendData: function (options, data){
			var _this = this;

			console.log('base._sendData');

			if( data.nameName ){
			}
			else {
				var xhr = this.xhr = api.getXHR();

				xhr.open('POST', options.url, true);
				xhr.withCredential = "true";

				api.each(options.headers, function (val, key){
					xhr.setRequestHeader(key, val);
				});

				if( xhr.upload ){
					// https://github.com/blueimp/jQuery-File-Upload/wiki/Fixing-Safari-hanging-on-very-high-speed-connections-%281Gbps%29
					api.event.on(xhr.upload, 'progress', api.throttle(function (/**Event*/evt){
						options.progress(evt, options, _this);
					}, 100));
				}

				xhr.onreadystatechange = function (){
					_this.status     = xhr.status;
					_this.statusText = xhr.statusText;
					_this.readyState = xhr.readyState;

					if( xhr.readyState == 4 ){
						for( var k in { '': 1, XML: 1, Text: 1, Body: 1 } ){
							_this['response'+k]  = xhr['response'+k];
						}
						xhr.onreadystatechange = null;
						_this.end(xhr.status);
					}
				};

				if( api.isArray(data) ){
					// multipart
					xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=_'+api.expando);
					data = data.join('') +'--_'+ api.expando +'--';

					/** @namespace  xhr.sendAsBinary  https://developer.mozilla.org/ru/XMLHttpRequest#Sending_binary_content */
					if( xhr.sendAsBinary ){
						xhr.sendAsBinary(data);
					}
					else {
						var bytes = Array.prototype.map.call(data, function(c){ return c.charCodeAt(0) & 0xff; });
						xhr.send(new Uint8Array(bytes).buffer);

					}
				}
				else {
					xhr.send(data);
				}
			}
		}
	};


	// @export
	api.XHR = XHR;
})(FileAPI);
