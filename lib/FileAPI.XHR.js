(function (api){
	var
		  noop = function (){}

		, XHR = function (options){
			this.uid = api.uid();
			this.xhr = {
				  abort: noop
				, getResponseHeader: noop
				, getAllResponseHeaders: noop
			};
			this.options = options;
		}
	;


	XHR.prototype = {
		status: 0,
		statusText: '',

		getResponseHeader: function (name){
			return this.xhr.getResponseHeader(name);
		},

		getAllResponseHeaders: function (){
			return this.xhr.getAllResponseHeaders() || {};
		},

		end: function (status, statusText){
			var _this = this, options = _this.options;

			_this.abort	= noop;
			_this.status = status;

			if( statusText ){
				_this.statusText = statusText;
			}

			options.complete(status == 200 ? false : _this.statusText || 'unknown', _this);

			if( _this.xhr && _this.xhr.node ){
				setTimeout(function (){
					try {
						_this.xhr.node.parentNode.removeChild(_this.xhr.node);
					} catch (er){}
					_this.xhr.node = null;
					delete window[_this.uid];
				}, 1);
			}
		},

		abort: function (){
			this.end(0, 'abort');

			if( this.xhr ){
				this.xhr.abort();
			}
		},

		send: function (FormData){
			var _this = this, options = this.options;

			FormData.toData(function (data){
				// Start uploading
				options.upload(options, _this);
				_this._send.call(_this, options, data);
			});
		},

		_send: function (options, data){
			var _this = this, xhr, uid = _this.uid;

			api.log('XHR._send:', data);

			if( data.nodeName ){
				options.upload(options, _this);

				xhr = document.createElement('div');
				xhr.innerHTML = '<form target="'+ uid +'" action="'+ options.url +'" method="POST" enctype="multipart/form-data" style="position: absolute; top: -1000px; overflow: hidden; width: 1px; height: 1px;">'
							+ '<iframe name="'+ uid +'" src="javascript:false;"></iframe>'
							+ '<input value="'+ uid +'" name="callback" type="hidden"/>'
							+ '</form>'
				;

				_this.xhr.abort = function (){
					var transport = xhr.getElementsByName('iframe')[0];
					if( transport ){
						try {
							if( transport.stop ) transport.stop();
							else if( transport.contentWindow.stop ) transport.contentWindow.stop();
							else transport.contentWindow.document.execCommand('Stop');
						}
						catch (er) {}
					}
				};

				// append form-data
				var form = xhr.getElementsByTagName('form')[0];
				form.appendChild(data);

				// append to DOM
				document.body.appendChild(xhr);

				// keep a reference to node-transport
				this.xhr.node = xhr;

				// jsonp-callack
				window[uid] = function (status, statusText, response){
					_this.readyState	= 4;
					_this.responseText	= response;
					_this.end(status, statusText);
				};

				// send
				_this.readyState = 2; // loaded
				form.submit();
				form = null;
			}
			else {
				xhr = _this.xhr = api.getXHR();

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
