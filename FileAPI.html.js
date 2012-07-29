/*global URL, webkitURL, dataURLtoBlob*/

(function (window, undef){
	'use strict';

	var
		gid = 1,

		// https://github.com/blueimp/JavaScript-Load-Image/blob/master/load-image.js#L48
		apiURL = (window.createObjectURL && window) || (window.URL && URL.revokeObjectURL && URL) || (window.webkitURL && webkitURL),

		File = window.File,
		FileReader = window.FileReader,
		FormData = window.FormData,

		encode = window.encodeURIComponent,
		support = !!(File && (FileReader && window.Uint8Array || FormData)),
		document = window.document,

		// https://github.com/blueimp/JavaScript-Canvas-to-Blob
		dataURLtoBlob = window.dataURLtoBlob,

		_rval = /string|number/,
		_rimg = /img/i,
		_rcanvas = /canvas/i,
		_rimgcanvas = /img|canvas/,
		_rdata = /^data:[^,]+,/,

		api = {

			expando: 'fileapi'+(new Date).getTime(),

			uid: function (obj){
				return	obj
					? (obj[api.expando] = obj[api.expando] || api.uid())
					: (api.expando + ++gid)
				;
			},

			getXHR: function (){
				var xhr;
				if( window.XMLHttpRequest ){
					xhr = new XMLHttpRequest();
				}
				else if( window.ActiveXObject ){
					try { xhr = new ActiveXObject('MSXML2.XMLHttp.3.0'); } catch( e ) { }
				}

				return  xhr;
			},

			isArray: isArray,

			flash: window.FileAPI && FileAPI.flash,

			support: {
				html5: support
			},


			event: {
				  on: _on
				, off: _off
				, one: _one
				, fix: _fixEvent
			},


			throttle: function(fn, delay) {
				var id, args, needInvoke;

				return function _throttle(){
					args = arguments;
					needInvoke = true;

					if( !id ) (function (){
						if( needInvoke ){
							fn.apply(window, args);
							needInvoke = false;
							id = setTimeout(_throttle, delay);
						}
						else {
							id = null;
						}
					})();
				};
			},


			F: function (a){
				return  a;
			},


			queue: function (fn){
				var
					  _idx = 0
					, _length = 0
					, _fail = false
					, _end = false
					, queue = {
						inc: function (){
							_length++;
						},

						next: function (){
							_idx++;
							setTimeout(queue.check, 0);
						},

						check: function (){
							(_idx >= _length) && !_fail && queue.end();
						},

						isFail: function (){
							return _fail;
						},

						fail: function (){
							!_fail && fn(_fail = true);
						},

						end: function (){
							if( !_end ){
								_end = true;
								fn();
							}
						}
					}
				;
				return queue;
			},


			/**
			 * For each object
			 *
			 * @param	{Object|Array}	obj
			 * @param	{Function}		fn
			 * @param	{*}				[ctx]
			 */
			each: function (obj, fn, ctx){
				if( obj ){
					if( obj.forEach ){
						obj.forEach(fn, ctx);
					}
					else if( isArray(obj) ){
						for( var i = 0, n = obj.length; i < n; i++ ){ if( i in obj )
							fn.call(ctx, obj[i], i, obj);
						}
					}
					else {
						for( var key in obj ) if( obj.hasOwnProperty(key) ){
							fn.call(ctx, obj[key], key, obj);
						}
					}
				}
			},



			/**
			 * Merge the contents of two or more objects together into the first object
			 *
			 * @param	{Object}	dst
			 * @param	{Object}	[src]
			 * @return	{Object}
			 */
			extend: function (dst){
				var args = arguments;
				if( args.length == 1 ){
					dst = api.extend(this, dst);
				}
				else {
					api.each(args, function (src){
						api.each(src, function (val, key){
							dst[key] = val;
						});
					});
				}
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
			 * Is canvas element
			 *
			 * @param	{HTMLElement}	elem
			 * @return	{Boolean}
			 */
			isCanvas: function (elem){
				return	elem && _rcanvas.test(elem.nodeName);
			},


			/**
			 * Read as DataURL
			 *
			 * @param {File|Element} file
			 * @param {Function} fn
			 */
			readAsDataURL: function (file, fn){
				if( api.isFile(file) ){
					_read(file, fn, 'DataURL');
				}
				else if( api.isCanvas(file) ){
					_emit(file, fn, 'load', api.toDataURL(file));
				}
				else {
					_emit(file, fn, 'error');
				}
			},


			/**
			 * Read as Binary string
			 *
			 * @param {File} file
			 * @param {Function} fn
			 */
			readAsBinaryString: function (file, fn){
				if( api.isFile(file) ){
					_read(file, fn, 'BinaryString');
				}
				else {
					_emit(file, fn, 'error');
				}
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
				}
				else if( elem.toDataURL ){
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
			 * @param	{File|String}	file
			 * @param	{Function}		fn
			 * @param	{Boolean}		[progress]
			 */
			readAsImage: function (file, fn, progress){
				if( api.isFile(file) ){
					if( apiURL ){
						/** @namespace apiURL.createObjectURL */
						var data = apiURL.createObjectURL(file);
						if( data === undef ){
							_emit(file, fn, 'error');
						}
						else {
							api.readAsImage(data, fn, progress);
						}
					}
					else {
						api.readAsDataURL(file, function (evt){
							if( evt.type == 'load' ){
								api.readAsImage(evt.result, fn, progress);
							}
							else if( progress || evt.type == 'error' ){
								_emit(file, fn, evt, null, { loaded: evt.loaded, total: evt.total });
							}
						});
					}
				}
				else if( api.isCanvas(file) ){
					_emit(file, fn, 'load', file);
				}
				else if( _rimg.test(file.nodeName) ){
					if( file.complete ){
						_emit(file, fn, 'load', file);
					}
					else {
						var events = 'error abort load';
						_one(file, events, function _fn(evt){
							if( evt.type == 'load' && apiURL ){
								/** @namespace apiURL.revokeObjectURL */
								apiURL.revokeObjectURL(file.src);
							}

							_off(file, events, _fn);
							_emit(file, fn, evt, file);
						});
					}
				}
				else {
					// Created image
					var img = new Image;
					img.src = file.dataURL || file;
					api.readAsImage(img, fn, progress);
				}
			},


			/**
			 * Get file list
			 *
			 * @param	{*}	input	-- jQueryEvent, Event, HTMLInput or FileList
			 * @return	{Array}
			 */
			getFiles: function (input){
				var files = [], args = arguments;

				if( input.originalEvent ){
					// jQuery event
					input	= input.originalEvent;
				}

				if( input.dataTransfer ){
					// Drag'n'Drop
					input	= input.dataTransfer;
				}
				else if( input.target ){
					// Event
					input	= input.target;
				}

				if( input.files ){
					// Input[type="file"]
					input	= input.files;
				}

				if( input.length ){
					files.push.apply(files, input);
				}

				if( args.length == 3 ){
					args[0] = files;
					api.filterFiles.apply(api, args);
				}
				else {
					return	files;
				}
			},


			/**
			 * Get image information
			 *
			 * @param	{File}		file
			 * @param	{Function}	fn
			 */
			getFileInfo: function (file, fn){
				api.readAsImage(file, function (evt){
					fn(evt.type == 'load' && evt.target);
				});
			},


			/**
			 * Filter of array
			 *
			 * @param	{Array}		input
			 * @param	{Function}	fn
			 * @return	{Array}
			 */
			filter: function (input, fn){
				var result = [], i = 0, n = input.length, val;
				for( i; i < n; i++ ) if( i in input ){
					val = input[i];
					if( fn.call(val, val, i, input) ) result.push(val)
				}
				return	result;
			},


			/**
			 * Filter files
			 *
			 * @param	{Array}		files
			 * @param	{Function}	eachFn
			 * @param	{Function}	resultFn
			 */
			filterFiles: function (files, eachFn, resultFn){
				var queue = files.concat(), file, result = [], deleted = [];
				(function _next(){
					if( queue.length ){
						file = queue.shift();
						if( /image/.test(file.type) ){
							api.getFileInfo(file, function (info){
								(eachFn(file, info) ? result : deleted).push(file);
								_next();
							});
						}
						else {
							(eachFn(file, {}) ? result : deleted).push(file);
							_next();
						}
					}
					else {
						resultFn(result, deleted);
					}
				})();
			},


			upload: function (options){
				options = api.extend({
					  beforeupload: api.F
					, upload: api.F
					, fileupload: api.F
					, fileprogress: api.F
					, filecomplete: api.F
					, progress: api.F
					, complete: api.F
				}, options);


				var
					  proxyXHR = new api.XHR(options)
					, dataArray = this._getFilesDataArray(options.files)
					, total = 0
					, loaded = 0
					, _loaded = 0
				;

				api.each(dataArray, function (data){
					total += data.size;
				});

				options.total	= total;
				options.loaded	= loaded;
				options.beforeupload(proxyXHR, options);


				// Upload by file
				(function _nextFile(){
					var data = dataArray.shift(), _this = this;

					if( proxyXHR.statusText != 'abort' && data ){
						this._getFormData(options, data, function (form){
							if( !loaded ){
								options.upload(proxyXHR, options.files);
							}

							var xhr = new api.XHR(api.extend({}, options, {
								upload: function (){
									options.fileupload(xhr);
								},
								progress: function (evt){
									if( evt.lengthComputable ){
										loaded += total * data.part * (evt.loaded/evt.total) - _loaded;
										_loaded = loaded;
										options.fileprogress(evt, xhr);
										options.progress({
											  type:   evt.type
											, total:  total
											, loaded: options.loaded = loaded
											, lengthComputable: true
										});
									}
								},
								complete: function (status){
									api.extend(proxyXHR, xhr);
									options.loaded = (loaded += (loaded - _loaded) + total*data.part);
									options.filecomplete(status, xhr);
									_nextFile.call(_this);
								}
							}));

							data.part = data.size / total;
							xhr.send(form);
							proxyXHR.abort = function (){ xhr.abort(); };
						});
					}
					else {
						options.complete(proxyXHR.statusText, proxyXHR);
					}
				}).call(this);


				return	proxyXHR;
			},


			_getFilesDataArray: function (data){
				var files = [];

				api.each(data, function add(file, name){
					if( isArray(file) ){
						api.each(file, function (file, idx){
							add(file, name+'['+idx+']');
						});
					}
					else {
						files.push({
							  name: name
							, file: file
							, size: file.size
						});
					}
				});

				return	files;
			},


			_getFormData: function (options, data, fn){
				var
					  file = data.file
					, name = data.name
					, filename = file.name
					, filetype = file.type
					, trans = api.support.transform && options.imageTransform
					, isOrignTrans = typeof(trans.maxWidth || trans.minWidth || trans.width) == 'number'
					, Form = new api.Form
					, queue = api.queue(function (){ fn(Form); })
				;

				if( trans && (/image/.test(file.type) || _rimgcanvas.test(file.nodeType)) ){
					queue.inc();

					if( isOrignTrans ){
						// Convert to array for transform function
						trans = [trans];
					}

					api.Image.transform(file, trans, function (err, images){
						if( isOrignTrans && !err ){
							if( !dataURLtoBlob ){
								images[0] = api.toBinaryString(images[0]);
								Form.multipart = true;
							}

							Form.append(name, images[0], filename, filetype);
						}
						else {
							if( !err ){
								api.each(images, function (image, idx){
									if( !dataURLtoBlob ){
										image = api.toBinaryString(image);
										Form.multipart = true;
									}

									Form.append(name +'['+ idx +']', image, filename, filetype);
								});

								name += '[original]';
							}

							if( err || options.imageOriginal ){
								Form.append(name, file, filename, filetype);
							}
						}

						queue.next();
					});
				}
				else {
					Form.append(name, file, filename);
				}

				// Append data
				api.each(options.data, function add(val, name){
					if( typeof val == 'object' ){
						api.each(val, function (v, i){
							add(v, name+'['+i+']');
						});
					}
					else {
						Form.append(name, val);
					}
				});

				queue.check();
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
				var xhr = api.getXHR();
				if( xhr ){
					xhr.open('GET', url, true);

					if( xhr.overrideMimeType ){
				        xhr.overrideMimeType('text/plain; charset=x-user-defined');
					}

					_on(xhr, 'progress', function (/**Event*/evt){
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

				if( typeof str !== 'string' ){
					str	= String(str);
				}

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
			}

		} // api
	;


	// @export
	window.FileAPI  = api;



	// @private methods
	function _on(elem, type, fn){
		if( elem ){
			api.each(type.split(' '), function (type){
				if( elem.addEventListener ) elem.addEventListener(type, fn, false);
				else if( elem.attachEvent ) elem.attachEvent('on'+type, fn);
				else elem['on'+type] = fn;
			});
		}
	}


	function _off(elem, type, fn){
		if( elem ){
			api.each(type.split(' '), function (type){
				if( elem.addEventListener ) elem.removeEventListener(type, fn, false);
				else if( elem.detachEvent ) elem.detachEvent('on'+type, fn);
				else elem['on'+type] = null;
			});
		}
	}


	function _one(elem, type, fn){
		_on(elem, type, function _(evt){
			fn(evt);
			_off(elem, type, _);
		});
	}


	function _emit(target, fn, name, res, ext){
		var evt = {
			  type:		name.type || name
			, target:	target
			, result:	res
		};
		api.extend(evt, ext);
		fn(evt);
	}


	function _read(file, fn, type){
		if( FileReader ){
			// Creating instance of FileReader
			var Reader = new FileReader, events = 'abort progress error load loadend';

			// Add event listener
			_on(Reader, events, function _fn(evt){
				var type = evt.type;
				if( type == 'progress' ){
					_emit(file, fn, evt, evt.target.result, { loaded: evt.loaded, total: evt.total })
				}
				else if( type == 'loadend' ){
					_off(Reader, events, _fn);
					Reader = null;
				}
				else {
					_emit(file, fn, evt, evt.target.result);
				}
			});


			// ReadAs by type
			Reader['readAs'+type](file);
		}
		else {
			_emit(file, fn, 'error');
		}
	}


	function isArray(val) {
		return  typeof val == 'object' && ('length' in val);
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
})(this);
