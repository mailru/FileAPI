/**
 * FileAPI — a set of tools for working with files
 * @author  RubaXa  <trash@rubaxa.org>
 */
(function (window, undef){
	/** @namespace window.webkitURL */
	var
		gid = 1,
		URL = window.URL && window.URL.createObjectURL && window.URL || window.webkitURL,
		File = window.File,
		FileReader = window.FileReader,
		FormData = window.FormData,

		encode = window.encodeURIComponent,
		support = !!(File && FileReader),
		document = window.document,

		_rval = /string|number/,
		_rimg = /img/i,
		_rcanvas = /canvas/i,
		_rimgcanvas = /img|canvas/,
		_rdata = /^data:[^,]+,/,

		_onSel = [],

		api = {

			support: support,

			event: { on: _on, off: _off, one: _one, fix: _fixEvent },

			F: function (a){ return  a; },

			/**
			 * For each object
			 *
			 * @param {Object|Array} obj
			 * @param {Function} fn
			 * @param [ctx]
			 */
			each: function (obj, fn, ctx){
				if( obj ){
					if( obj.forEach ){ obj.forEach(fn, ctx); }
					else if( isArray(obj) ){
						for( var i = 0, n = obj.length; i < n; i++ ) if( i in obj )
							fn.call(ctx, obj[i], i, obj);
					} else {
						for( var k in obj ) if( obj.hasOwnProperty(k) )
							fn.call(ctx, obj[k], k, obj);
					}
				}
			},


			/**
			 * Merge the contents of two or more objects together into the first object
			 *
			 * @param {Object} dst
			 * @param {Object} [src]
			 * @return {Object}
			 */
			extend: function (dst){
				if( arguments.length == 1 )
					api.extend(this, dst);
				else
					api.each(arguments, function (src){
						api.each(src, function (val, key){
							dst[key] = val;
						});
					});
				return  dst;
			},


			inherit: function (methods){
				api.each(methods, function (fn, name){
					var prev = api[name];
					api[name] = function (){
						this.parent = function (){
							return prev.apply(api, arguments);
						};
						return  fn.apply(api, arguments);
					};
				});
			},


			/**
			 * Is file instance
			 *
			 * @param file
			 * @return {Boolean}
			 */
			isFile: function (file){
				return  file instanceof File;
			},


			/**
			 * Read as DataURL
			 *
			 * @param {File|Element} file
			 * @param {Function} fn
			 */
			readAsDataURL: function (file, fn){
				if( api.isFile(file) ){
					_read('DataURL', file, fn);
				} else if( _rimgcanvas.test(file.tagName) ){
					_fire(fn, 'load', api.toDataURL(file));
				} else {
					_fire(fn, 'error');
				}
			},


			/**
			 * Read as Binary string
			 *
			 * @param {File} file
			 * @param {Function} fn
			 */
			readAsBinaryString: function (file, fn){
				_read('BinaryString', file, fn);
			},


			/**
			 * Convert element to image
			 *
			 * @param {Element} elem
			 * @return {Element}
			 */
			toImage: function (elem){
				var img = new Image;
				img.src = api.toDataURL(elem);
				return  img;
			},


			/**
			 * Convert image or canvas to DataURL
			 *
			 * @param   {Element}   elem    Image or Canvas element
			 * @return  {String}
			 */
			toDataURL: function (elem){
				if( typeof elem == 'string' ){
					return  elem;
				} else if( _rimg.test(elem.nodeName) ){
					var canvas = document.createElement('canvas');
					canvas.width = elem.width;
					canvas.height = elem.height;
					canvas.getContext('2d').drawImage(elem, 0, 0, elem.width, elem.height);
					return  api.toDataURL(canvas);
				} else {
					return  elem.toDataURL('image/png');
				}
			},


			/**
			 * Canvert string, image or canvas to binary string
			 *
			 * @param   {String|Element} val
			 * @return  {String}
			 */
			toBinaryString: function (val){
				return  window.atob(api.toDataURL(val).replace(_rdata, ''));
			},


			/**
			 * Read file or DataURL as ImageElement
			 *
			 * @param {File|String} file
			 * @param {Function} fn
			 */
			readAsImage: function (file, fn){
				if( api.isFile(file) ){
					if( URL ){
						/** @namespace URL.createObjectURL */
						var data = URL.createObjectURL(file);
						if( data === undef ) _fire(fn, 'error');
						else api.readAsImage(data, fn);
					} else {
						api.readAsDataURL(file, function (evt){
							if( evt.type == 'load' ){
								api.readAsImage(evt.result, fn);
							} else {
								_fire(fn, evt, null, { loaded: evt.loaded, total: evt.total });
							}
						});
					}
				}
				else {
					if( _rimg.test(file.nodeName) ){
						_fire(fn, 'load', file);
						return;
					} else if( _rcanvas.test(file.nodeName) ){
						file    = api.toDataURL(file);
					}

					// Created image
					var img = new Image;
					img.src = file;
					_one(img, 'error abort load', function (evt){
						if( evt.type == 'load' && URL ){
							/** @namespace URL.revokeObjectURL */
							URL.revokeObjectURL(evt.target.src);
						}
						_fire(fn, evt, evt.type == 'load' ? evt.target : null);
					});
				}
			},


			/**
			 * Upload file
			 *
			 * @param {Object} options
			 */
			upload: function (options){
				var
					useFD = !!FormData,   // use FormData
					data = options.data,
					headers = api.extend({
						'Content-Type': 'application/x-www-form-urlencoded',
						'X-Requested-With': 'XMLHttpRequest',
						'Accept': 'text/plain, */*; q=0.01'
					}, options.header),
					boundary = '_'+(+new Date +''+ ++gid),

					_total = 0,
					_loaded = 0,
					_xhr = {
						status: 0,
						statusText: 0,
						readyState: 0,
						getResponseHeader: function (){},
						getAllResponseHeaders: function (){ return {} },
						abort: function (text){
							_xhr.statusText = text || 'abort';
							_done(0, _xhr);
						}

					}
				;


				// Check data
				api.each(data, function check(file, name){
					if( !_rval.test(typeof file) && !api.isFile(file) ){
						if( file.type == "file" && file.files ){
							data[name]  = file.files;
						}

						if( isArray(file) ){
							api.each(file, check);
						} else {
							useFD = false;
						}
					}
				});


				// Prepare data
				if( !useFD ) api.each(data, function read(file){
					if( api.isFile(file) ){
						_total++;
						api.readAsBinaryString(file, function (evt){
							if( evt.type == 'load' ){
								file.data = evt.result;
								_ready();
							} else {
								_done(0, { statusText: evt.type });
							}
						});
					}
					else if( _rimgcanvas.test(file.nodeName) || file.data && _rimgcanvas.test(file.data.nodeName)){
						_total++;
						api.readAsDataURL(file.data || file, function (evt){
							if( evt.type == 'load' ){
								file.type   = 'image/png';
								file.data   = api.toBinaryString(evt.result);
								_ready();
							} else {
								_done(0, { statusText: evt.type });
							}
						});
					}
					else if( isArray(file) ) {
						api.each(file, read);
					}
				});


				_ready();

				return  _xhr;


				function _ready(){
					if( _loaded++ < _total || _xhr.statusText == 'abort' ) return;

					var _data = (useFD ? new FormData : ''), xhr = support ? _getXHR() : null;

					if( xhr ){
						_xhr.getResponseHeader      = function (name){ return xhr.getResponseHeader(name); };
						_xhr.getAllResponseHeaders  = function (){ return xhr.getAllResponseHeaders(); };

						_xhr.abort = function (text){
							_xhr.statusText = text || 'abort';
							xhr.abort(text);
							_done(0, _xhr);
						};

						if( useFD ){
							// use FormData
							api.each(data, function (value, name){
								if( isArray(value) ){
									api.each(value, function (item){ _data.append(name, item); });
								} else {
									_data.append(name, value);
								}
							});
						} else {
							// Build POST query
							api.each(data, function (value, name){
								if( isArray(value) ){
									api.each(value, function (item){
										_data += '--' + boundary + _part(name, item);
									});
								} else {
									_data += '--' + boundary + _part(name, value);
								}
							});

							_data += '--'+ boundary +'--';

							headers['Content-Type'] = 'multipart/form-data; boundary='+ boundary;
						}

						xhr.open('POST', options.url, true);

						api.each(headers, function (val, key){
							xhr.setRequestHeader(key, val);
						});

						if( xhr.upload && options.progress ) _on(xhr.upload, 'progress', function (/** Event */evt){
							/** @namespace evt.lengthComputable */
							if( evt.lengthComputable ){
								options.progress(evt.loaded, evt.total, _xhr);
							}
						});

						xhr.onreadystatechange = function (){
							_xhr.status     = xhr.status;
							_xhr.statusText = xhr.statusText;
							_xhr.readyState = xhr.readyState;

							if( xhr.readyState == 4 ){
								for( var k in { '': 1, 'XML': 1, 'Text': 1, 'Body': 1 } ){
									_xhr['response'+k]  = xhr['response'+k];
								}
								xhr.onreadystatechange = null;
								_done(_xhr.status, _xhr);
							}
						};

						_send(xhr, _data);
					}
					else {
						// old browsers
						xhr = document.createElement('div');
						xhr.innerHTML = '<form target="'+ boundary +'" action="'+ options.url +'" method="POST" enctype="multipart/form-data" style="position: absolute; left: -100px; overflow: hidden; width: 1px; height: 1px;">'
									+ '<iframe name="'+ boundary +'" src="about:blank"></iframe>'
									+ '<input value="'+ boundary +'" name="callback" type="hidden" />'
									+ '</form>';
						xhr = xhr.firstChild;

						// Set headers
						api.each(headers, function (val, key){
							_hidden('__HEADERS['+key+']', val, xhr);
						});

						// Add data
						api.each(data, function _add(val, key){
							if( _rval.test(val) ){
								_hidden(key, val, xhr);
							} else if( val.tagName == 'INPUT' ){
								api.reset(val);
								xhr.appendChild(val);
							} else if( isArray(val) ){
								api.each(val, _add);
							}
						});

						// Setup jsonp
						window[boundary] = function (status, result){
							_xhr.status         = status;
							_xhr.statusText     = status == 200 ? 'success' : 'error';
							_xhr.readyState     = 4;
							_xhr.responseText   = result;

							_done(status, _xhr);
							window[boundary] = null;
							delete window[boundary];
						};

						_xhr.abort = function (text){
							_xhr.statusText = text || 'abort';
							var transport = xhr.getElementsByName('iframe')[0];
							if( transport ){
								try {
									if( transport.stop ) transport.stop();
									else if( transport.contentWindow.stop ) transport.contentWindow.stop();
									else transport.contentWindow.document.execCommand('Stop');
								}
								catch (er) {}
							}
							_done(0, _xhr);
						};

						document.body.appendChild(xhr);
						xhr.submit();
					}
				}


				function _done(status, xhr){
					if( status == 200 ){
						xhr.statusText = 'success';
						(options.success || api.F)(xhr.responseText, xhr.statusText, xhr);
					} else {
						xhr.statusText = 'error';
						(options.error || api.F)(xhr, xhr.statusText);
					}
					(options.complete || api.F)(xhr, xhr.statusText);
				}
			},


			reset: function (inp){
				var parent, clone;

				if( window.jQuery ){
					clone = jQuery(inp).clone(true).insertBefore(inp).val('')[0];
					jQuery(inp).remove();
				} else {
					parent  = inp.parentNode;
					clone   = parent.insertBefore(inp.cloneNode(true), inp);
					clone.value = '';
					parent.removeChild(inp);
				}

				return  clone;
			},


			/**
			 * Load remote file
			 *
			 * @param   {String}    url
			 * @param   {Function}  fn
			 * @return  {XMLHttpRequest}
			 */
			load: function (url, fn){
				var xhr = _getXHR();
				if( xhr ){
					xhr.open('GET', url, true);

					if( xhr.overrideMimeType ){
				        xhr.overrideMimeType('text/plain; charset=x-user-defined');
					}

					_on(xhr, 'progress', function (/** Event */evt){
						/** @namespace evt.lengthComputable */
						if( evt.lengthComputable ){
							fn({ type: evt.type, loaded: evt.loaded, total: evt.total }, xhr);
						}
					});

					xhr.onreadystatechange = function(){
						if( xhr.readyState == 4 ){
							xhr.onreadystatechange = null;
							if( xhr.status == 200 ){
								url = url.split('/');
								/** @namespace xhr.responseBody */
								var file = {
								      name: url[url.length-1]
									, size: xhr.getResponseHeader('Content-Length')
									, type: xhr.getResponseHeader('Content-Type')
								};
								file.dataURL = 'data:'+file.type+';base64,' + api.encode64(xhr.responseBody || xhr.responseText);
								fn({ type: 'load', result: file });
							}
							else {
								fn({ type: 'error' });
							}
					    }
					};
				    xhr.send(null);
				} else {
					fn({ type: 'error' });
				}

				return  xhr;
			},

			encode64: function (str){
				var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=', outStr = '', i = 0;

				while( i < str.length ){
					//all three "& 0xff" added below are there to fix a known bug
					//with bytes returned by xhr.responseText
					var
						  byte1 = str.charCodeAt(i++) & 0xff
						, byte2 = str.charCodeAt(i++) & 0xff
						, byte3 = str.charCodeAt(i++) & 0xff
						, enc1 = byte1 >> 2
						, enc2 = ((byte1 & 3) << 4) | (byte2 >> 4)
						, enc3, enc4
					;

					if( isNaN(byte2) ){
						enc3 = enc4 = 64;
					} else {
						enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
						enc4 = isNaN(byte3) ? 64 : byte3 & 63;
					}

					outStr += b64.charAt(enc1) + b64.charAt(enc2) + b64.charAt(enc3) + b64.charAt(enc4);
				}

				return  outStr;
			},

			onselect: function (fn){
				_onSel.push(fn);
			}

		} // api
	;


	// GLOBALIZATION
	window.FileAPI  = api;



	// @private methods
	function _on(elem, type, fn){
		if( elem ){
			if( elem.addEventListener ) elem.addEventListener(type, fn, false);
			else if( elem.attachEvent ) elem.attachEvent('on'+type, fn);
			else elem['on'+type] = fn;
		}
	}

	function _off(elem, type, fn){
		if( elem ){
			if( elem.addEventListener ) elem.removeEventListener(type, fn, false);
			else if( elem.detachEvent ) elem.detachEvent('on'+type, fn);
			else elem['on'+type] = null;
		}
	}


	function _one(elem, eventType, fn){
		api.each(eventType.split(' '), function (type){
			_on(elem, type, function _(evt){
				fn(evt);
				_off(elem, type, _);
			});
		});
	}


	function _fire(fn, name, res, ext){
		var evt = { type: name.type || name, result: res };
		api.extend(evt, ext);
		fn(evt);
	}


	function _read(type, file, fn){
		// Creating instance of FileReader
		var
			  Reader = new FileReader
			, _progress = function (evt){
				_fire(fn, evt, evt.target.result, { loaded: evt.loaded, total: evt.total });
			};

		// Add event listener
		_one(Reader, 'abort error load loadend', function (evt){
			if( evt.type == 'loadend' ){
				_off(Reader, 'progress', _progress);
				Reader = null;
			} else {
				_fire(fn, evt, evt.target.result);
			}
		});
		_on(Reader, 'progress', _progress);


		// ReadAs by type
		Reader['readAs'+type](file);
	}

	function isArray(val) {
		return  typeof val == 'object' && ('length' in val);
	}

	function _part(name, item){
		return  ('\r\nContent-Disposition: form-data; name="'+ name +'"'+ (item.data ? '; filename="'+ encode(item.name || name) +'"' : '')
				+ (item.data ? '\r\nContent-Type: '+ (item.type || 'application/octet-stream') : '')
				+ '\r\n'
				+ '\r\n'+ (item.data || encode(item))
				+ '\r\n')
		;
	}

	function _hidden(name, value, parent){
		var input   = document.createElement('input');
		input.type  = 'hidden';
		input.name  = name;
		input.value = value;
		if( parent ) parent.appendChild(input);
	}

	function _send(xhr, data){
		/** @namespace xhr.sendAsBinary */
		if( FormData && data instanceof FormData ){
			xhr.send(data);
		} else if( xhr.sendAsBinary ){
			xhr.sendAsBinary(data)
		} else {
			var bytes = Array.prototype.map.call(data, function(c){ return c.charCodeAt(0) & 0xff; });
			xhr.send(new Uint8Array(bytes).buffer);

		}
	}

	function _getXHR(xhr){
		if( window.XMLHttpRequest ){
			xhr = new XMLHttpRequest();
		} else if( window.ActiveXObject ){
			try { xhr = new ActiveXObject('MSXML2.XMLHttp.3.0'); } catch( e ) { }
		}
		return  xhr;
	}

	function _fixEvent(evt){
		if( !evt.target ) evt.target = event.srcElement || document;
		if( evt.target.nodeType === 3 ) evt.target = event.target.parentNode;
		if( evt.pageX == null && evt.clientX != null ){
			var eventDocument = evt.target.ownerDocument || document, doc = eventDocument.documentElement, body = eventDocument.body;
			evt.pageX = evt.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
			evt.pageY = evt.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
		}
		return  evt;
	}

	_on(document, 'mousedown', function (evt){
		var node = _fixEvent(window.event || evt).target;
		if( node.nodeName == 'INPUT' && node.type == 'file' && !node.__FileAPIOnSel ){
			node.__FileAPIOnSel  = 1;
			_on(node, 'change', function (){
				api.each(_onSel, function (fn){ fn(node.files, node); });
			});
		}
	});
})(this);
