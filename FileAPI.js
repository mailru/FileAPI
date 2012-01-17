/**
 * FileAPI — a set of tools for working with files
 * @author  RubaXa  <trash@rubaxa.org>
 */
(function (window){
	var
		gid = 1,
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

		api = {

			support: support,

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
					api.readAsDataURL(file, function (evt){
						if( evt.type == 'load' ){
							api.readAsImage(evt.result, fn);
						} else if( evt != 'progress' ){
							_fire(fn, evt);
						}
					});
				}
				else {
					if( _rimg.test(file.nodeName) ){
						_fire(fn, 'load', file);
					} else if( _rcanvas.test(file.nodeName) ){
						file    = api.toDataURL(file);
					} else {
						// Created image
						var img = new Image;
						img.src = file;
						if( img.complete ){
							_fire(fn, 'load', img);
						} else {
							_one(img, 'error abort load', function (evt){
								_fire(fn, evt, evt.type == 'load' ? evt.target: null);
							});
						}
					}
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
								file.data   = FileAPI.toBinaryString(evt.result);
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

					var _data = (useFD ? new FormData : ''), xhr = support ? new XMLHttpRequest : null;

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
								_data += '--'+boundary;
								if( isArray(value) ){
									api.each(value, function (item){ _data += _part(name, item); });
								} else {
									_data += _part(name, value);
								}
							});

							_data += boundary +'--';

							xhr.send = xhr.sendAsBinary || (function (_send){
								return function (str){
									var bytes = Array.prototype.map.call(str, function(c){ return c.charCodeAt(0) & 0xff; });
									_send.call(this, new Uint8Array(bytes).buffer);
								};
							})(xhr.send);

							headers['Content-Type'] = 'multipart/form-data; boundary='+ boundary;
						}

						xhr.open('POST', options.url, true);

						api.each(headers, function (val, key){
							xhr.setRequestHeader(key, val);
						});

						xhr.onreadystatechange = function (){
							_xhr.status     = xhr.status;
							_xhr.statusText = xhr.statusText;
							_xhr.readyState = xhr.readyState;

							if( xhr.readyState == 4 ){
								for( var k in { '': 1, 'XML': 1, 'Text': 1 } ) _xhr['response'+k]  = xhr['response'+k];
								xhr.onreadystatechange = null;
								_done(_xhr.status, _xhr);
							}
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

						xhr.send(_data);
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
			}

		} // api
	;


	// GLOBALIZATION
	window.FileAPI  = api;



	// @private methods
	function _on(elem, type, fn){
		if( elem.addEventListener ) elem.addEventListener(type, fn, false);
		else elem['on'+type] = fn;
	}

	function _off(elem, type, fn){
		if( elem.addEventListener ) elem.removeEventListener(type, fn, false);
		else elem['on'+type] = null;
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
		var Reader = new FileReader;

		// Add event listener
		_one(Reader, 'abort error progress load', function (evt){
			_fire(fn, evt, evt.target.result, { loaded: evt.loaded, total: evt.total, lengthComputable: evt.lengthComputable });
		});

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
})(this);
