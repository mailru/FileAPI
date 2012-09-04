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

		support = !!(File && (FileReader && window.Uint8Array || FormData)),
		document = window.document,

		// https://github.com/blueimp/JavaScript-Canvas-to-Blob
		dataURLtoBlob = window.dataURLtoBlob,

		_mime = {},
		_rmime = {},

		_rimg = /img/i,
		_rcanvas = /canvas/i,
		_rimgcanvas = /img|canvas/,
		_rinput = /input/i,
		_rdata = /^data:[^,]+,/,

		_KB = 1024,
		_pow = Math.pow,

		_elEvents = {}, // element event listeners
		_infoReader = [], // list of file info processors

		api = {
			build: 1,

			KB: _KB,
			MB: _pow(_KB, 2),
			GB: _pow(_KB, 3),
			TB: _pow(_KB, 4),

			expando: 'fileapi'+(new Date).getTime(),

			uid: function (obj){
				return	obj
					? (obj[api.expando] = obj[api.expando] || api.uid())
					: (api.expando + ++gid)
				;
			},

			log: function (){
				if( window.console && console.log ){
					if( console.log.apply ){
						console.log.apply(console, arguments);
					}
					else {
						console.log([].join.call(arguments, ' '));
					}
				}
			},

			getXHR: function (){
				var xhr;

				if( window.XMLHttpRequest ){
					xhr = new XMLHttpRequest;
				}
				else if( window.ActiveXObject ){
					try { xhr = new ActiveXObject('MSXML2.XMLHttp.3.0'); } catch( e ) { }
				}

				return  xhr;
			},

			isArray: isArray,

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


			parseJSON: function (str){
				var json;
				if( window.JSON && JSON.parse ){
					json = JSON.parse(str);
				}
				else {
					json = (new Function('return '+str+';'))();
				}
				return json;
			},


			trim: function (str){
				str = String(str);
				return	str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
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
				return	support && file && (file instanceof File);
			},


			/**
			 * Is canvas element
			 *
			 * @param	{HTMLElement}	el
			 * @return	{Boolean}
			 */
			isCanvas: function (el){
				return	el && _rcanvas.test(el.nodeName);
			},


			getFilesFilter: function (filter){
				filter = typeof filter == 'string' ? filter : (filter.getAttribute && filter.getAttribute('accept') || '');
				return	filter ? new RegExp('('+ filter.replace(/\./g, '\\.').replace(/,/g, '|') +')$', 'i') : /./;
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
			 * @param   {Element}   el    Image or Canvas element
			 * @return  {String}
			 */
			toDataURL: function (el){
				if( typeof el == 'string' ){
					return  el;
				}
				else if( el.toDataURL ){
					return  el.toDataURL('image/png');
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
				else if( file.iframe ){
					_emit(file, fn, { type: 'error' });
				}
				else {
					// Created image
					var img = new Image;
					img.src = file.dataURL || file;
					api.readAsImage(img, fn, progress);
				}
			},


			/**
			 * Make file by name
			 *
			 * @param	{String}	name
			 * @return	{Array}
			 */
			checkFileObj: function (name){
				var file = {};

				if( typeof name == 'object' ){
					file = name;
				}
				else {
					file.name = (name+'').split(/(\\|\/)/g).pop();
				}

				if( file.type === undef ){
					file.type = file.name.split('.').pop();
				}

				api.each(_rmime, function (mime, type){
					if( mime.test(file.type) ){
						file.type = type +'/'+ file.type;
					}
				});

				return	file;
			},


			/**
			 * Get file list
			 *
			 * @param	{HTMLInput|Event}	input
			 * @param	{String|Function}	[filter]
			 * @param	{Function}			[callback]
			 * @return	{Array|Null}
			 */
			getFiles: function (input, filter, callback){
				var files = [];

				if( callback ){
					api.filterFiles(api.getFiles(input), filter, callback);
					return null;
				}

				if( input.jquery ){
					// jQuery object
					input.each(function (){
						files = files.concat(api.getFiles(this));
					});
					input	= files;
					files	= [];
				}

				if( typeof filter == 'string' ){
					filter	= api.getFilesFilter(filter);
				}

				if( input.originalEvent ){
					// jQuery event
					input = input.originalEvent;
				}

				if( input.dataTransfer ){
					// Drag'n'Drop
					input = input.dataTransfer;
				}
				else if( input.target ){
					// Event
					input = input.target;
				}

				if( input.files ){
					// Input[type="file"]
					files = input.files;
				}
				else if( !support && _rinput.test(input && input.tagName) ){
					if( api.trim(input.value) ){
						files = [api.checkFileObj(input.value)];
						files[0].blob   = input;
						files[0].iframe = true;
					}
				}
				else if( isArray(input) ){
					files	= input;
				}


				if( !filter && _rinput.test(input && input.tagName) ){
					filter	= api.getFilesFilter(input);
				}

				return	api.filter(files, function (file){ return !filter || filter.test(file.name); });
			},


			/**
			 * Get image information
			 *
			 * @param	{File}		file
			 * @param	{Function}	fn
			 */
			getInfo: function (file, fn){
				var info = {}, readers = _infoReader.concat();

				if( api.isFile(file) ){
					(function _next(){
						var reader = readers.shift();
						if( reader ){
							if( reader.test(file.type) ){
								reader(file, function (err, res){
									if( err ){
										fn(err);
									}
									else {
										api.extend(info, res);
										_next();
									}
								});
							}
							else {
								_next();
							}
						}
						else {
							fn(false, info);
						}
					})();
				}
				else {
					fn('not_support', info);
				}
			},


			/**
			 * Add information reader
			 *
			 * @param {RegExp} mime
			 * @param {Function} fn
			 */
			addInfoReader: function (mime, fn){
				fn.test = function (type){ return mime.test(type) };
				_infoReader.push(fn);
			},


			addMime: function (type, extensions){
				_mime[type]  = extensions;
				_rmime[type] = new RegExp('('+ extensions.replace(/,/g, '|') +')$', 'i');
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
				for( ; i < n; i++ ) if( i in input ){
					val = input[i];
					if( fn.call(val, val, i, input) ){
						result.push(val);
					}
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
				if( files && (support || files[0].id) ){
					// HTML5 or Flash
					var queue = files.concat(), file, result = [], deleted = [];

					(function _next(){
						if( queue.length ){
							file = queue.shift();
							api.getInfo(file, function (err, info){
								(eachFn(file, err ? false : info) ? result : deleted).push(file);
								_next();
							});
						}
						else {
							resultFn(result, deleted);
						}
					})();
				}
				else {
					resultFn(files, []);
				}
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
								options.upload(proxyXHR, options);
							}

							var xhr = new api.XHR(api.extend({}, options, {
								upload: function (){
									options.fileupload(xhr, options);
								},
								progress: function (evt){
									if( evt.lengthComputable ){
										loaded += ~~(total * data.part * (evt.loaded/evt.total) - _loaded +.5);
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
								complete: function (err){
									api.extend(proxyXHR, xhr);
									options.loaded = (loaded += (loaded - _loaded) + ~~(total*data.part +.5));
									options.filecomplete(err, xhr);
									_nextFile.call(_this);
								}
							}));

							data.part = data.size / total;
							xhr.send(form);
							proxyXHR.abort = function (){ xhr.abort(); };
						});
					}
					else {
						options.complete(proxyXHR.status == 200 ? false : (proxyXHR.statusText || 'error'), proxyXHR);
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
					, isOrignTrans = trans && typeof(trans.maxWidth || trans.minWidth || trans.width) == 'number'
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
							if( !dataURLtoBlob && !api.flashEngine ){
								images[0] = api.toBinaryString(images[0]);
								Form.multipart = true;
							}

							Form.append(name, images[0], filename, filetype);
						}
						else {
							if( !err ){
								api.each(images, function (image, idx){
									if( !dataURLtoBlob && !api.flashEngine ){
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

				api.each(_elEvents[api.uid(inp)], function (fns, type){
					api.each(fns, function (fn){
						_off(inp, type, fn);
						_on(clone, type, fn);
					})
				});

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


	// @private methods
	function _on(el, type, fn){
		if( el ){
			var uid = api.uid(el);

			if( !_elEvents[uid] ){
				_elEvents[uid] = {};
			}

			api.each(type.split(/\s+/), function (type){
				if( !_elEvents[uid][type] ){
					_elEvents[uid][type] = []
				}
				_elEvents[uid][type].push(fn);

				if( el.addEventListener ) el.addEventListener(type, fn, false);
				else if( el.attachEvent ) el.attachEvent('on'+type, fn);
				else el['on'+type] = fn;
			});
		}
	}


	function _off(el, type, fn){
		if( el ){
			var uid = api.uid(el), events = _elEvents[uid] || {};

			api.each(type.split(/\s+/), function (type){
				var fns = events[type] || [], i = fns.length;

				while( i-- ){
					if( fns[i] === fn ){
						fns.splice(i, 1);
						break;
					}
				}

				if( el.addEventListener ) el.removeEventListener(type, fn, false);
				else if( el.detachEvent ) el.detachEvent('on'+type, fn);
				else el['on'+type] = null;
			});
		}
	}


	function _one(el, type, fn){
		_on(el, type, function _(evt){
			fn(evt);
			_off(el, type, _);
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


			try {
				// ReadAs by type
				Reader['readAs'+type](file);
			}
			catch (err){
				_emit(file, fn, 'error', undef, { error: err.toString() });
			}
		}
		else {
			_emit(file, fn, 'error', undef, { error: 'FileReader is not supported' });
		}
	}


	function isArray(val) {
		return  typeof val == 'object' && ('length' in val);
	}



	function _fixEvent(evt){
		if( !evt.target ) evt.target = window.event && window.event.srcElement || document;
		if( evt.target.nodeType === 3 ) evt.target = event.target.parentNode;
		return  evt;
	}


	// Add default mime
	api.each({     // default extensions by mime
		  'image':	'png,jpg,jpeg,bmp,gif,ico,tif,tiff,tga,pcx,cbz,cbr'
		, 'audio':	'm4a,flac,aac,rm,mpa,wav,wma,ogg,mp3,mp2,m3u,mod,amf,dmf,dsm,far,gdm,imf,it,m15,med,okt,s3m,stm,sfx,ult,uni,xm,sid,ac3,dts,cue,aif,aiff,wpl,ape,mac,mpc,mpp,shn,wv,nsf,spc,gym,adplug,adx,dsp,adp,ymf,ast,afc,hps,xsp'
		, 'video':	'm4v,3gp,nsv,ts,ty,strm,rm,rmvb,m3u,ifo,mov,qt,divx,xvid,bivx,vob,nrg,img,iso,pva,wmv,asf,asx,ogm,m2v,avi,bin,dat,dvr-ms,mpg,mpeg,mp4,mkv,avc,vp3,svq3,nuv,viv,dv,fli,flv,wpl'
	}, function (val, type){
		api.addMime(type, val);
	});


	// Add default image info processor
	api.addInfoReader(/^image/, function (file, nextFn){
		api.readAsImage(file, function (evt){
			var img = evt.target;
			nextFn(evt.type == 'load' ? false : 'error', {
				  width:  img.width
				, height: img.height
			});
		});
	});


	// @export
	window.FileAPI  = api;
})(this);
