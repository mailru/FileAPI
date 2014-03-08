/*jslint evil: true */
/*global window, URL, webkitURL, ActiveXObject */

(function (window, undef){
	'use strict';

	var
		gid = 1,
		noop = function (){},

		document = window.document,
		doctype = document.doctype || {},
		navigator = window.navigator,
		userAgent = window.navigator.userAgent,

		// https://github.com/blueimp/JavaScript-Load-Image/blob/master/load-image.js#L48
		apiURL = (window.createObjectURL && window) || (window.URL && URL.revokeObjectURL && URL) || (window.webkitURL && webkitURL),

		Blob = window.Blob,
		File = window.File,
		FileReader = window.FileReader,
		FormData = window.FormData,

		jQuery = window.jQuery,
		XMLHttpRequest = window.XMLHttpRequest,

		html5 =    !!(File && (FileReader && (window.Uint8Array || FormData || XMLHttpRequest.prototype.sendAsBinary)))
				&& !(/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent) && /windows/i.test(userAgent)), // BugFix: https://github.com/mailru/FileAPI/issues/25

		cors = html5 && ('withCredentials' in (new XMLHttpRequest)),

		chunked = html5 && !!Blob && !!(Blob.prototype.webkitSlice || Blob.prototype.mozSlice || Blob.prototype.slice),

		// https://github.com/blueimp/JavaScript-Canvas-to-Blob
		dataURLtoBlob = window.dataURLtoBlob,

		_rimg = /img/i,
		_rcanvas = /canvas/i,
		_rimgcanvas = /img|canvas/i,
		_rinput = /input/i,
		_rdata = /^data:[^,]+,/,

		Math = window.Math,
		setTimeout = window.setTimeout,
		clearTimeout = window.clearTimeout,

		_SIZE_CONST = function (pow){
			pow = new window.Number(Math.pow(1024, pow));
			pow.from = function (sz){ return Math.round(sz * this); };
			return	pow;
		},

		_elEvents = {}, // element event listeners
		_infoReader = [], // list of file info processors

		_readerEvents = 'abort progress error load loadend',
		_xhrPropsExport = 'status statusText readyState response responseXML responseText responseBody'.split(' '),

		currentTarget = 'currentTarget', // for minimize
		preventDefault = 'preventDefault', // and this too

		_createElement = function (name){
			return	document.createElement(name);
		},

		_isArray = function (ar) {
			return	ar && ('length' in ar);
		},

		/**
		 * Iterate over a object or array
		 */
		_each = function (obj, fn, ctx){
			if( obj ){
				if( _isArray(obj) ){
					for( var i = 0, n = obj.length; i < n; i++ ){
						if( i in obj ){
							fn.call(ctx, obj[i], i, obj);
						}
					}
				}
				else {
					for( var key in obj ){
						if( obj.hasOwnProperty(key) ){
							fn.call(ctx, obj[key], key, obj);
						}
					}
				}
			}
		},

		/**
		 * Search for a specified value within an array and return its index (or -1 if not found).
		 */
		_indexOf = function (arr, el){
			var idx = -1, i = arr && arr.length;
			while( i-- ){
				if( arr[i] === el ){
					idx = i;
					break;
				}
			}
			return	idx;
		},

		/**
		 * Merge the contents of two or more objects together into the first object
		 */
		_extend = function (dst){
			var args = arguments, i = 1, _ext = function (val, key){ dst[key] = val; };
			for( ; i < args.length; i++ ){
				_each(args[i], _ext);
			}
			return  dst;
		},

		/**
		 * Add event listener
		 */
		_on = function (el, type, fn){
			if( el ){
				var uid = api.uid(el);

				if( !_elEvents[uid] ){
					_elEvents[uid] = {};
				}

				var isFileReader = (FileReader && el) && (el instanceof FileReader);
				_each(type.split(/\s+/), function (type){
					if( jQuery && !isFileReader){
						jQuery.event.add(el, type, fn);
					} else {
						if( !_elEvents[uid][type] ){
							_elEvents[uid][type] = [];
						}

						_elEvents[uid][type].push(fn);

						if( el.addEventListener ){ el.addEventListener(type, fn, false); }
						else if( el.attachEvent ){ el.attachEvent('on'+type, fn); }
						else { el['on'+type] = fn; }
					}
				});
			}
		},


		/**
		 * Remove event listener
		 */
		_off = function (el, type, fn){
			if( el ){
				var uid = api.uid(el), events = _elEvents[uid] || {};

				var isFileReader = (FileReader && el) && (el instanceof FileReader);
				_each(type.split(/\s+/), function (type){
					if( jQuery && !isFileReader){
						jQuery.event.remove(el, type, fn);
					}
					else {
						var fns = events[type] || [], i = fns.length;

						while( i-- ){
							if( fns[i] === fn ){
								fns.splice(i, 1);
								break;
							}
						}

						if( el.addEventListener ){ el.removeEventListener(type, fn, false); }
						else if( el.detachEvent ){ el.detachEvent('on'+type, fn); }
						else { el['on'+type] = null; }
					}
				});
			}
		},


		_one = function(el, type, fn){
			_on(el, type, function _(evt){
				_off(el, type, _);
				fn(evt);
			});
		},


		_fixEvent = function (evt){
			if( !evt.target ){ evt.target = window.event && window.event.srcElement || document; }
			if( evt.target.nodeType === 3 ){ evt.target = evt.target.parentNode; }
			return  evt;
		},


		_supportInputAttr = function (attr){
			var input = _createElement('input');
			input.setAttribute('type', "file");
			return attr in input;
		},



		/**
		 * FileAPI (core object)
		 */
		api = {
			version: '2.1.0',

			cors: false,
			html5: true,
			media: false,
			formData: true,
			multiPassResize: true,

			debug: false,
			pingUrl: false,
			multiFlash: false,
			flashAbortTimeout: 0,
			withCredentials: true,

			staticPath: './dist/',

			flashUrl: 0, // @default: './FileAPI.flash.swf'
			flashImageUrl: 0, // @default: './FileAPI.flash.image.swf'

			postNameConcat: function (name, idx){
				return	name + (idx != null ? '['+ idx +']' : '');
			},

			support: {
				dnd:      cors && ('ondrop' in _createElement('div')),
				cors:     cors,
				html5:    html5,
				chunked:  chunked,
				dataURI:  true,
				accept:   _supportInputAttr('accept'),
				multiple: _supportInputAttr('multiple'),
				saveAs:   !!navigator.msSaveBlob,
				download: ('download' in _createElement('a'))
			},

			ext2mime: {
				  jpg:	'image/jpeg'
				, tif:	'image/tiff'
				, txt:	'text/plain'
			},

			// Fallback for flash
			accept: {
				  'image/*': 'art bm bmp dwg dxf cbr cbz fif fpx gif ico iefs jfif jpe jpeg jpg jps jut mcf nap nif pbm pcx pgm pict pm png pnm qif qtif ras rast rf rp svf tga tif tiff xbm xbm xpm xwd'
				, 'audio/*': 'm4a flac aac rm mpa wav wma ogg mp3 mp2 m3u mod amf dmf dsm far gdm imf it m15 med okt s3m stm sfx ult uni xm sid ac3 dts cue aif aiff wpl ape mac mpc mpp shn wv nsf spc gym adplug adx dsp adp ymf ast afc hps xs'
				, 'video/*': 'm4v 3gp nsv ts ty strm rm rmvb m3u ifo mov qt divx xvid bivx vob nrg img iso pva wmv asf asx ogm m2v avi bin dat dvr-ms mpg mpeg mp4 mkv avc vp3 svq3 nuv viv dv fli flv wpl'
			},

			uploadRetry : 0,
			networkDownRetryTimeout : 5000, // milliseconds, don't flood when network is down

			chunkSize : 0,
			chunkUploadRetry : 0,
			chunkNetworkDownRetryTimeout : 2000, // milliseconds, don't flood when network is down

			KB: _SIZE_CONST(1),
			MB: _SIZE_CONST(2),
			GB: _SIZE_CONST(3),
			TB: _SIZE_CONST(4),

			EMPTY_PNG: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2NkAAIAAAoAAggA9GkAAAAASUVORK5CYII=',

			expando: 'fileapi' + (new Date).getTime(),

			uid: function (obj){
				return	obj
					? (obj[api.expando] = obj[api.expando] || api.uid())
					: (++gid, api.expando + gid)
				;
			},

			log: function (){
				if( api.debug && window.console && console.log ){
					if( console.log.apply ){
						console.log.apply(console, arguments);
					}
					else {
						console.log([].join.call(arguments, ' '));
					}
				}
			},

			/**
			 * Create new image
			 *
			 * @param {String} [src]
			 * @param {Function} [fn]   1. error -- boolean, 2. img -- Image element
			 * @returns {HTMLElement}
			 */
			newImage: function (src, fn){
				var img = _createElement('img');
				if( fn ){
					api.event.one(img, 'error load', function (evt){
						fn(evt.type == 'error', img);
						img = null;
					});
				}
				img.src = src;
				return	img;
			},

			/**
			 * Get XHR
			 * @returns {XMLHttpRequest}
			 */
			getXHR: function (){
				var xhr;

				if( XMLHttpRequest ){
					xhr = new XMLHttpRequest;
				}
				else if( window.ActiveXObject ){
					try {
						xhr = new ActiveXObject('MSXML2.XMLHttp.3.0');
					} catch (e) {
						xhr = new ActiveXObject('Microsoft.XMLHTTP');
					}
				}

				return  xhr;
			},

			/**
			 * Creates a URL representing the object given in parameter.
			 * @param {Blob|File} blob
			 * @returns {String|Null}
			 */
			createURL: function (blob){
				return	apiURL ? apiURL.createObjectURL(blob) : null;
			},

			/**
			 * Releases an existing object URL which was previously
			 * created by calling FileAPI.createURL()
			 * @param {String} url
			 */
			revokeURL: function (url){
				return	apiURL && apiURL.revokeObjectURL(url);
			},

			isArray: _isArray,

			event: {
				  on: _on
				, off: _off
				, one: _one
				, fix: _fixEvent
			},

			throttle: function(fn, delay) {
				var id, args;

				return function _throttle(){
					args = arguments;

					if( !id ){
						fn.apply(window, args);
						id = setTimeout(function (){
							id = 0;
							fn.apply(window, args);
						}, delay);
					}
				};
			},

			F: noop,

			/**
			 * Takes a well-formed JSON string and returns the resulting JavaScript object.
			 * @param {String} str
			 * @returns {*}
			 */
			parseJSON: function (str){
				var json;

				try {
					if( window.JSON && JSON.parse ){
						json = JSON.parse(str);
					}
					else {
						json = (new Function('return ('+str.replace(/([\r\n])/g, '\\$1')+');'))();
					}
				}
				catch( err ){
					api.log('[err] FileAPI.parseJSON: ' + err);
				}

				return json;
			},

			/**
			 * Remove the whitespace from the beginning and end of a string.
			 * @param {String} str
			 * @returns {String}
			 */
			trim: function (str){
				str = String(str);
				return	str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
			},

			/**
			 * Simple Defer
			 * @return	{Object}
			 */
			defer: function (){
				var
					  doneList = []
					, failList = []
					, progressList = []

					, _push = function (x, fn){
						fn && (x ? doneList : failList).push(fn);
						return	this;
					}

					, _complete = function (state, args){
						var
							  list = state ? doneList : failList
							, i = 0, n = list.length
						;

						_push = function (x, fn){
							(x === state) && fn.apply(this, args);
						};

						_complete = noop;

						doneList =
						failList = null;

						progressList = [];

						for( ; i < n; i++ ){
							list[i] && list[i].apply(this, args);
						}
					}

					, defer = {
						done: function (fn){
							_push(1, fn);
							return this;
						},

						fail: function (fn){
							_push(0, fn);
							return this;
						},

						resolve: function (){
							_complete(1, arguments);
							return this;
						},

						reject: function (){
							_complete(0, arguments);
							return this;
						},

						notify: function (){
							var i = 0, n = progressList.length;
							for( ; i< n; i++ ){
								progressList[i].apply(this, arguments);
							}
						},

						progress: function (fn){
							fn && progressList.push(fn);
							return	this;
						},

						then: function (doneFn, failFn){
							return	this.done(doneFn).fail(failFn);
						},

						always: function (fn){
							return	this.then(fn, fn);
						},

						promise: function (){
							return	this;
						}
				};

				return	defer;
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
			each: _each,


			/**
			 * Search for a specified value within an array and return its index (or -1 if not found).
			 *
			 * @param   {Array}  arr
			 * @param   {*}      el
			 * @returns {Number}
			 */
			indexOf: _indexOf,


			/**
			 * Async for
			 * @param {Array} array
			 * @param {Function} callback
			 */
			afor: function (array, callback){
				var i = 0, n = array.length;

				if( _isArray(array) && n-- ){
					(function _next(){
						callback(n != i && _next, array[i], i++);
					})();
				}
				else {
					callback(false);
				}
			},


			/**
			 * Merge the contents of two or more objects together into the first object
			 *
			 * @param	{Object}	dst
			 * @return	{Object}
			 */
			extend: _extend,


			/**
			 * Is file instance
			 *
			 * @param  {File}  file
			 * @return {Boolean}
			 */
			isFile: function (file){
				return	html5 && file && (file instanceof File || file instanceof Blob);
			},

			isBlob: function (blob) {
				return    html5 && blob && (blob instanceof Blob);
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
				if( api.isCanvas(file) ){
					_emit(file, fn, 'load', api.toDataURL(file));
				}
				else {
					_readAs(file, fn, 'DataURL');
				}
			},


			/**
			 * Read as Binary string
			 *
			 * @param {File} file
			 * @param {Function} fn
			 */
			readAsBinaryString: function (file, fn){
				if( _hasSupportReadAs('BinaryString') ){
					_readAs(file, fn, 'BinaryString');
				} else {
					// Hello IE10!
					api.readAsDataURL(file, function (evt){
						if( evt.type == 'load' ){
							try {
								// dataURL -> binaryString
								evt.result = api.toBinaryString(evt.result);
							} catch (e){
								evt.type = 'error';
								evt.message = e.toString();
							}
						}
						fn(evt);
					});
				}
			},


			/**
			 * Read as ArrayBuffer
			 *
			 * @param {File} file
			 * @param {Function} fn
			 */
			readAsArrayBuffer: function(file, fn){
				_readAs(file, fn, 'ArrayBuffer');
			},


			/**
			 * Read as text
			 *
			 * @param {File} file
			 * @param {String} encoding
			 * @param {Function} [fn]
			 */
			readAsText: function(file, encoding, fn){
				if( !fn ){
					fn	= encoding;
					encoding = 'utf-8';
				}

				_readAs(file, fn, 'Text', encoding);
			},


			/**
			 * Convert image or canvas to DataURL
			 *
			 * @param   {Element}  el      Image or Canvas element
			 * @param   {String}   [type]  mime-type
			 * @return  {String}
			 */
			toDataURL: function (el, type){
				if( typeof el == 'string' ){
					return  el;
				}
				else if( el.toDataURL ){
					return  el.toDataURL(type || 'image/png');
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
						var src = api.createURL(file);
						if( src ){
							api.readAsImage(src, fn, progress);
						}
						else {
							_emit(file, fn, 'error');
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
				// Is canvas?
				else if( api.isCanvas(file) ){
					_emit(file, fn, 'load', file);
				}
				// Is image tag?
				else if( _rimg.test(file.nodeName) ){
					if( file.complete ){
						_emit(file, fn, 'load', file);
					}
					else {
						var events = 'error abort load';
						_one(file, events, function _fn(evt){
							if( evt.type == 'load' && apiURL ){
								api.revokeURL(file.src);
							}

							_off(file, events, _fn);
							_emit(file, fn, evt, file);
						});
					}
				}
				else if( file.iframe ){
					_emit(file, fn, { type: 'error', message: 'is iframe' });
				}
				else {
					// Created image
					var img = api.newImage(file.dataURL || file);
					api.readAsImage(img, fn, progress);
				}
			},


			/**
			 * Get mime type by File or name
			 * @param   {Object|String}  file
			 * @returns {String}
			 */
			getMimeType: function (file){
				var
					  mime = file && (file.type || String(file.name || file).split('.').pop())
					, accept = api.accept
					, ext, type
				;

				if( !/^[^/]+\/[^/]+$/.test(mime) ){
					for( type in accept ){
						ext = new RegExp(accept[type].replace(/\s/g, '|'), 'i');

						if( ext.test(mime) || api.ext2mime[mime] ){
							mime = api.ext2mime[mime] || (type.split('/')[0] +'/'+ mime);
							break;
						}
					}
				}

				return	mime;
			},


			/**
			 * Get drop files
			 *
			 * @param	{Event}	evt
			 * @param	{Function} callback
			 */
			getDropFiles: function (evt, callback){
				var
					  files = []
					, dataTransfer = _getDataTransfer(evt)
					, entrySupport = _isArray(dataTransfer.items) && dataTransfer.items[0] && _getAsEntry(dataTransfer.items[0])
					, queue = api.queue(function (){ callback(files); })
				;

				_each((entrySupport ? dataTransfer.items : dataTransfer.files) || [], function (item){
					queue.inc();

					try {
						if( entrySupport ){
							_readEntryAsFiles(item, function (err, entryFiles){
								if( err ){
									api.log('[err] getDropFiles:', err);
								} else {
									files.push.apply(files, entryFiles);
								}
								queue.next();
							});
						}
						else {
							_isRegularFile(item, function (yes){
								yes && files.push(item);
								queue.next();
							});
						}
					}
					catch( err ){
						queue.next();
						api.log('[err] getDropFiles: ', err);
					}
				});

				queue.check();
			},


			/**
			 * Get file list
			 *
			 * @param   {HTMLInputElement|Event}   input
			 * @param   {String|Function}          [filter]
			 * @param   {Function}                 [callback]
			 * @returns {Array|Null}
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
					input = _fixEvent(input.originalEvent);
				}
				else if( input.srcElement ){
					// IE Event
					input = _fixEvent(input);
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

					if( !html5 ){
						// Partial support for file api
						files[0].blob	= input;
						files[0].iframe	= true;
					}
				}
				else if( !html5 && isInputFile(input) ){
					if( api.trim(input.value) ){
						files = [_toFileObject(input.value)];
						files[0].blob   = input;
						files[0].iframe = true;
					}
				}
				else if( _isArray(input) ){
					files	= input;
				}

				return	api.filter(files, function (file){ return !filter || filter.test(file.name); });
			},


			/**
			 * Get total files size
			 * @param	{Array}	files
			 * @returns	{Number}
			 */
			getTotalSize: function (files){
				var size = 0, i = files && files.length;
				while( i-- ){
					size += files[i].size;
				}
				return	size;
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
							if( reader.test(api.getMimeType(file)) ){
								reader(file, function (err, res){
									if( err ){
										fn(err);
									}
									else {
										_extend(info, res);
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
					fn('not_support_info', info);
				}
			},


			/**
			 * Add information reader
			 *
			 * @param {RegExp} mime
			 * @param {Function} fn
			 */
			addInfoReader: function (mime, fn){
				fn.test = function (type){ return mime.test(type); };
				_infoReader.push(fn);
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

				for( ; i < n; i++ ){
					if( i in input ){
						val = input[i];
						if( fn.call(val, val, i, input) ){
							result.push(val);
						}
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
				if( files.length ){
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
					resultFn([], files);
				}
			},


			/**
			 * Upload files on server
			 *
			 * @param   {String|Object}   url
			 * @param   {*}               [files]
			 * @param   {Object}          [options]
			 * @returns {FileAPI.XHR}
			 */
			upload: function (url, files, options){
				if( files || typeof url == 'string' ){
					options = _extend({}, options, { url: url, files: [].concat(files) });
				}
				else {
					options = url;
				}


				options = _extend({
					  jsonp: 'callback'
					, prepare: noop
					, beforeupload: noop
					, upload: noop
					, fileupload: noop
					, fileprogress: noop
					, filecomplete: noop
					, progress: noop
					, complete: noop
					, pause: noop
					, serial: true
					, parallel: 0
					, postName: 'files'
					, chunkSize: api.chunkSize
					, imageOriginal: true
					, chunkUploadRetry: api.chunkUploadRetry
					, uploadRetry: api.uploadRetry
				}, options);


				if( !options.serial ){
					if( options.chunkSize ){
						options.chunkSize = 0;
						api.log('[warn] FileAPI.upload: `chunkSize > 0` is not supported, if serial == false');
					}

					if( api.flashEngine ){
						api.log('[warn] FileAPI.upload: `serial == false` is not supported in Flash.');
					}
				}


				if( options.parallel > 0 ){
					options.serial = true;

					if( api.flashEngine ){
						api.log('[warn] FileAPI.upload: `parallel > 0` is not supported in Flash.');
					}
				}


				if( options.imageAutoOrientation && !options.imageTransform ){
					options.imageTransform = { rotate: 'auto' };
				}


				var
					  proxyXHR = new api.XHR(options)
					, filesData = _getUploadFiles(options.files, options.postName)
					, defer = api.defer()

					, _this = this
					, _total = 0
					, _loaded = 0
					, _active = 0 // Counter for holding the number of active queries

					, _serial = html5 && options.serial
					, _parallel = _serial && options.parallel

					, _withoutFiles = !filesData.length

					, _processedData = []

					// Array of active uploaded files
					, _activeFiles = proxyXHR.activeFiles = []
				;

				// calc total size
				_each(filesData, function (data){
					_total += data.size;
				});

				// Array of files
				proxyXHR.files = [];
				_each(filesData, function (data){
					proxyXHR.files.push(data.file);
				});

				// Set upload status props
				proxyXHR.total	= _total;
				proxyXHR.loaded	= 0;
				proxyXHR.filesLeft = filesData.length;

				// emit "beforeupload"  event
				options.beforeupload(proxyXHR, options);

				// Subscribe to `defer`
				defer.progress(options.progress);
				defer.done(options.success);
				defer.fail(options.error);


				// Counting the amount of bytes uploaded files
				function _getTotalLoadedSize(){
					var size = 0, i = _processedData.length, data;
					while( i-- ){
						data = _processedData[i];
						size += data.size * (data.loaded / data.total);
					}
					return	size;
				}


				// Uploading files
				function _uploadFiles(){
					var
						  data  = filesData.splice(0, _serial ? 1 : 1e5)
						, _file = _serial ? data[0] && data[0].file : proxyXHR.files
						, _dataSize = api.getTotalSize(data)
						, _fileLoaded = false
						, _fileOptions = _simpleClone(options)
					;

					// The actual value is set in "progress"
					data.loaded = 0;
					data.size = data.total = _dataSize;

					_processedData.push(data);

					if( _withoutFiles ){
						_file = null;
						api.log('[warn] FileAPI.upload() — called without files');
					}

					if( (proxyXHR.statusText != 'abort' || proxyXHR.current) && (data.length || _withoutFiles) ){
						_withoutFiles = false;

					    // Increase the number of active requests
					    _active++;

						// Set current upload file
						proxyXHR.currentFile = _file;

						// Prepare file options
						if (_file && options.prepare(_file, _fileOptions) === false) {
							_uploadFiles();
							return;
						}
						_fileOptions.file = _file;

						_getFormData(_fileOptions, data, function (form){
							if( !_loaded ){
								// emit "upload" event
								options.upload(proxyXHR, options);
							}

							var xhr = new api.XHR(_extend({}, _fileOptions, {

								upload: _file ? function (){
									// emit "fileupload" event
									if( _serial ){
										_activeFiles.push(_file);
										xhr.activeFiles = _activeFiles;
										options.fileupload(_file, xhr, _fileOptions);
									}
								} : noop,

								progress: _file ? function (evt){
									if( !_fileLoaded ){
										// For ignore the double calls.
										_fileLoaded = (evt.loaded == evt.total);

										// Set actual value
										data.total = evt.total;
										data.loaded = Math.min(evt.loaded, evt.total);

										// emit "fileprogress" event
										(_serial || _parallel) && options.fileprogress({
											  type:   'progress'
											, total:  data.total
											, loaded: data.loaded
										}, _file, xhr, _fileOptions);

										// emit "progress" event
										defer.notify({
											  type:   'progress'
											, total:  _total
											, loaded: proxyXHR.loaded = _getTotalLoadedSize()
										}, _file, xhr, _fileOptions);
									}
								} : noop,

								complete: function (err){
									_each(_xhrPropsExport, function (name){
										proxyXHR[name] = xhr[name];
									});

									if( _file ){
										// "loaded" and "total" set in "progress".
										data.total = (data.total || data.size);
										data.loaded	= data.total;

										// emulate 100% "progress"
										this.progress(data);

										// fixed "progress" throttle
										_fileLoaded = true;

										// bytes loaded
										proxyXHR.loaded = _loaded = _getTotalLoadedSize();

										// emit "filecomplete" event
										if( _serial ){
											_activeFiles.splice(_indexOf(_activeFiles, _file), 1);
											options.filecomplete(err, xhr, _file, _fileOptions);
										}
									}

									// Decrease the number of active requests
									_active--;

									// upload next file
									setTimeout(function (){ _uploadFiles(); }, 0);
								}
							})); // xhr


							// ...
							proxyXHR.abort = function (current){
								if( !current ){ filesData.length = 0; }
								this.current = current;
								xhr.abort();
							};

							// Start upload
							xhr.send(form);
						});
					}
					else if( !_active ){
						var err = (proxyXHR.status == 200 || proxyXHR.status == 201 || proxyXHR.status == 204)
									? false
									: (proxyXHR.statusText || 'error');

						if( err ){
							defer.reject(err, proxyXHR, options);
						} else {
							defer.resolve(proxyXHR, options);
						}

						options.complete(err, proxyXHR, options);
					}
				}


				// Start upload on next tick
				setTimeout(function (){
					for( var i = 0; i < Math.max(_parallel, 1); i++ ){
						_uploadFiles();
					}
				}, 0);


				// Append more files to the existing request
				// first - add them to the queue head/tail
				proxyXHR.append = function (files, first) {
					files = api._getFilesDataArray([].concat(files));

					_each(files, function (data) {
						_total += data.size;
						proxyXHR.files.push(data.file);
						if( first ){
							filesData.unshift(data);
						} else {
							filesData.push(data);
						}
					});

					proxyXHR.statusText = "";

					if( !_active ){
						_uploadFiles.call(_this);
					}
				};


				// Removes file from queue by file reference and returns it
				proxyXHR.remove = function (file) {
				    var i = filesData.length, _file;
				    while( i-- ){
						if( filesData[i].file == file ){
							_file = filesData.splice(i, 1);
							_total -= _file.size;
						}
					}
					return	_file;
				};

				proxyXHR.error = defer.fail;
				proxyXHR.success = defer.done;

				return _extend(proxyXHR, defer);
			},


			reset: function (inp, notRemove){
				var parent, clone;

				if( jQuery ){
					clone = jQuery(inp).clone(true).insertBefore(inp).val('')[0];
					if( !notRemove ){
						jQuery(inp).remove();
					}
				} else {
					parent  = inp.parentNode;
					clone   = parent.insertBefore(inp.cloneNode(true), inp);
					clone.value = '';

					if( !notRemove ){
						parent.removeChild(inp);
					}

					_each(_elEvents[api.uid(inp)], function (fns, type){
						_each(fns, function (fn){
							_off(inp, type, fn);
							_on(clone, type, fn);
						});
					});
				}

				return  clone;
			},


			/**
			 * Load a remote file
			 *
			 * @param   {String}  url
			 * @param   {Object}  [options]
			 * @return  {FileAPI.XHR}
			 */
			load: function (url, options){
				var
					xhr = new api.XHR(options = _extend(options || {}, {
						  url: url
						, type: 'GET'
						, cache: true
						, responseType: 'blob'
					}))
					, resolve = xhr.defer.resolve
				;

				xhr.defer.resolve = function (xhr, opts){
					var blob = xhr.response;
					return (blob && Blob) && (blob instanceof Blob)
						? resolve(blob, xhr, opts)
						: xhr.defer.reject('load_not_supported', xhr, opts)
					;
				};

				_getFormData(options, [], function (formData){
					xhr.send(formData);
				});

				return  xhr;
			},


			/**
			 * Save file on disk
			 * @param    {String|File|Blob}  blob
			 * @param    {String}            [name]
			 * @returns  {FileAPI.defer}
			 */
			saveAs: function (blob, name){
				var defer = api.defer();

				if( typeof blob === 'string' ){
					if( name === undef ){
						name = blob.split('/').pop();
					}

					api.load(blob)
						.progress(defer.notify)
						.done(function (blob){
							api.saveAs(blob, name).then(defer.resolve, defer.reject);
						})
						.fail(defer.reject)
					;
				}
				else {
					try {
						if( _saveAs(blob, name) ){
							defer.resolve();
						}
						else {
							defer.reject('saveAs_not_support');
						}
					} catch (err){
						api.log('[err] FileAPI.saveAs: '+err.toString());
						defer.reject(err);
					}
				}

				return	defer;
			}

		} // api
	;


	function _emit(target, fn, name, res, ext){
		var evt = {
			  type:		name.type || name
			, target:	target
			, result:	res
		};
		_extend(evt, ext);
		fn(evt);
	}


	function _hasSupportReadAs(as){
		return	FileReader && !!FileReader.prototype['readAs'+as];
	}


	function _readAs(file, fn, as, encoding){
		if( api.isBlob(file) && _hasSupportReadAs(as) ){
			var Reader = new FileReader;

			// Add event listener
			_on(Reader, _readerEvents, function _fn(evt){
				var type = evt.type;
				if( type == 'progress' ){
					_emit(file, fn, evt, evt.target.result, { loaded: evt.loaded, total: evt.total });
				}
				else if( type == 'loadend' ){
					_off(Reader, _readerEvents, _fn);
					Reader = null;
				}
				else {
					_emit(file, fn, evt, evt.target.result);
				}
			});


			try {
				// ReadAs ...
				if( encoding ){
					Reader['readAs'+as](file, encoding);
				}
				else {
					Reader['readAs'+as](file);
				}
			}
			catch (err){
				_emit(file, fn, 'error', undef, { error: err.toString() });
			}
		}
		else {
			_emit(file, fn, 'error', undef, { error: 'filreader_not_support_'+as });
		}
	}


	function _isLikeFile(obj){
		return	obj && (File && (obj instanceof File) || obj.blob || obj.image && obj.file || obj.flashId);
	}


	function _toFileObject(name){
		return {
			  name: (name + '').split(/\\|\//g).pop()
			, type: api.getMimeType(name)
		};
	}


	function _isRegularFile(file, callback){
		// http://stackoverflow.com/questions/8856628/detecting-folders-directories-in-javascript-filelist-objects
		if( !file.type && (file.size % 4096) === 0 && (file.size <= 102400) ){
			if( FileReader ){
				try {
					var Reader = new FileReader();

					_one(Reader, _readerEvents, function (evt){
						var isFile = evt.type != 'error';
						callback(isFile);
						if( isFile ){
							Reader.abort();
						}
					});

					Reader.readAsDataURL(file);
				} catch( err ){
					callback(false);
				}
			}
			else {
				callback(null);
			}
		}
		else {
			callback(true);
		}
	}


	function _getAsEntry(item){
		var entry;
		if( item.getAsEntry ){ entry = item.getAsEntry(); }
		else if( item.webkitGetAsEntry ){ entry = item.webkitGetAsEntry(); }
		return	entry;
	}


	function _readEntryAsFiles(entry, callback){
		if( !entry ){
			// error
			callback('invalid entry');
		}
		else if( entry.isFile ){
			// Read as file
			entry.file(function(file){
				// success
				file.fullPath = entry.fullPath;
				callback(false, [file]);
			}, function (err){
				// error
				callback('FileError.code: '+err.code);
			});
		}
		else if( entry.isDirectory ){
			var reader = entry.createReader(), result = [];

			reader.readEntries(function(entries){
				// success
				api.afor(entries, function (next, entry){
					_readEntryAsFiles(entry, function (err, files){
						if( err ){
							api.log(err);
						}
						else {
							result = result.concat(files);
						}

						if( next ){
							next();
						}
						else {
							callback(false, result);
						}
					});
				});
			}, function (err){
				// error
				callback('directory_reader: ' + err);
			});
		}
		else {
			_readEntryAsFiles(_getAsEntry(entry), callback);
		}
	}


	function _getUploadFiles(data, postName){
		var files = [], oFiles = {};

		// Convert `data` to `oFiles`
		if( isInputFile(data) ){
			var tmp = api.getFiles(data);
			oFiles[data.name || postName] = data.getAttribute('multiple') !== null ? tmp : tmp[0];
		}
		else if( _isArray(data) ){
			if( isInputFile(data[0]) ){
				_each(data, function (input){
					oFiles[input.name || postName] = api.getFiles(input);
				});
			} else if( _isLikeFile(data[0]) ){
				oFiles[postName] = data;
			}
		}
		else if( _isLikeFile(data) ){
			oFiles[postName] = data;
		}
		else {
			// `key` - post name, `value` - file object
			oFiles = data;
		}


		// Convert `oFiles` to `files`
		_each(oFiles, function add(file, name){
			if( _isArray(file) ){
				_each(file, function (file){
					add(file, name);
				});
			}
			else if( _isLikeFile(file) ){
				files.push({
					  name: name // post name
					, file: file
					, size: file.size
					, total: file.size
					, loaded: 0
				});
			}
		});

		return	files;
	}



	function _getFormData(options, filesData, fn){
		var
			  Form  = new api.Form
			, queue = api.queue(function (){ fn(Form); })
			, trans = api.support.transform && options.imageTransform
			, isOrignTrans   = trans && _isOriginTransform(trans)
			, postNameConcat = api.postNameConcat
		;

		// Add files to `Form`
		_each(filesData, function (data, idx){
			var
				  file = data.file
				, name = postNameConcat(data.name, options.serial || options.chunkSize ? null : idx)
				, filename = file.name
				, filetype = file.type
			;

			(function _addFile(file/**Object*/){
				if( file.image ){ // This is a FileAPI.Image
					queue.inc();

					file.toData(function (err, image){
						// @todo: error
						filename = filename || (new Date).getTime()+'.png';

						_addFile(image);
						queue.next();
					});
				}
				else if( api.Image && trans && (/^image/.test(file.type) || _rimgcanvas.test(file.nodeName)) ){
					queue.inc();

					if( isOrignTrans ){
						// Convert to array for transform function
						trans = [].concat(trans);
					}

					api.Image.transform(file, trans, options.imageAutoOrientation, function (err, images){
						if( isOrignTrans && !err ){
							if( !dataURLtoBlob && !api.flashEngine ){
								// Canvas.toBlob or Flash not supported, use multipart
								Form.multipart = true;
							}

							Form.append(name, images[0], filename,  trans[0].type || filetype);
						}
						else {
							var addOrigin = 0;

							if( !err ){
								_each(images, function (image, idx){
									if( !dataURLtoBlob && !api.flashEngine ){
										Form.multipart = true;
									}

									if( !trans[idx].postName ){
										addOrigin = 1;
									}

									Form.append(trans[idx].postName || postNameConcat(name, idx), image, filename, trans[idx].type || filetype);
								});
							}

							if( err || options.imageOriginal ){
								Form.append(postNameConcat(name, (addOrigin ? 'original' : null)), file, filename, filetype);
							}
						}

						queue.next();
					});
				}
				else if( filename !== api.expando ){
					Form.append(name, file, filename);
				}
			})(file);
		});


		// Append data
		_each(options.data, function add(val, name){
			if( typeof val == 'object' ){
				_each(val, function (v, i){
					add(v, postNameConcat(name, i));
				});
			}
			else {
				Form.append(name, val);
			}
		});

		queue.check();
	}


	function _simpleClone(obj){
		var copy = {};
		_each(obj, function (val, key){
			if( val && (typeof val === 'object') && (val.nodeType == null) ){
				val = _extend({}, val);
			}
			copy[key] = val;
		});
		return	copy;
	}


	function isInputFile(el){
		return	_rinput.test(el && el.tagName);
	}


	function _getDataTransfer(evt){
		return	(evt.originalEvent || evt || '').dataTransfer || {};
	}


	function _isOriginTransform(trans){
		var key;
		for( key in trans ){
			if( trans.hasOwnProperty(key) ){
				if( !(trans[key] instanceof Object || key === 'overlay' || key === 'filter') ){
					return	true;
				}
			}
		}
		return	false;
	}


	function _saveAs(blob, name){
		var ret = false;

		if( navigator.msSaveBlob ){
			ret = navigator.msSaveBlob(blob, name);
		}
		else if( api.support.download ){
			var
				  url = api.createURL(blob)
				, body = document.body
				, transport = _createElement('a')
			;

			if( url ){
				transport.href = url;
				transport.download = name || blob.name;
				transport.style.top = '-10000px';
				transport.style.position = 'absolute';

				body.appendChild(transport);
				transport.click();
				body.removeChild(transport);

				ret = true;
				setTimeout(function (){ api.revokeURL(url); }, 1);
			}
		}

		return	ret;
	}


	// Add default image info reader
	api.addInfoReader(/^image/, function (file/**File*/, callback/**Function*/){
		if( !file.__dimensions ){
			var defer = file.__dimensions = api.defer();

			api.readAsImage(file, function (evt){
				var img = evt.target;
				defer.resolve(evt.type == 'load' ? false : 'error', {
					  width:  img.width
					, height: img.height
				});
                img.src = api.EMPTY_PNG;
				img = null;
			});
		}

		file.__dimensions.then(callback);
	});


	/**
	 * Drag'n'Drop special event
	 *
	 * @param	{HTMLElement}	el
	 * @param	{Function}		onHover
	 * @param	{Function}		onDrop
	 */
	api.event.dnd = function (el, onHover, onDrop){
		var _id, _type;

		if( !onDrop ){
			onDrop = onHover;
			onHover = noop;
		}

		if( FileReader ){
			_on(el, 'dragenter dragleave dragover', function (evt){
				var
					  types = _getDataTransfer(evt).types
					, i = types && types.length
					, debounceTrigger = false
				;

				while( i-- ){
					if( ~types[i].indexOf('File') ){
						evt[preventDefault]();

						if( _type !== evt.type ){
							_type = evt.type; // Store current type of event

							if( _type != 'dragleave' ){
								onHover.call(evt[currentTarget], true, evt);
							}

							debounceTrigger = true;
						}

						break; // exit from "while"
					}
				}

				if( debounceTrigger ){
					clearTimeout(_id);
					_id = setTimeout(function (){
						onHover.call(evt[currentTarget], _type != 'dragleave', evt);
					}, 50);
				}
			});

			_on(el, 'drop', function (evt){
				evt[preventDefault]();

				_type = 0;
				onHover.call(evt[currentTarget], false, evt);

				api.getDropFiles(evt, function (files){
					onDrop.call(evt[currentTarget], files, evt);
				});
			});
		}
		else {
			api.log("Drag'n'Drop -- not supported");
		}
	};


	/**
	 * Remove drag'n'drop
	 * @param	{HTMLElement}	el
	 * @param	{Function}		onHover
	 * @param	{Function}		onDrop
	 */
	api.event.dnd.off = function (el, onHover, onDrop){
		_off(el, 'dragenter dragleave dragover', onHover);
		_off(el, 'drop', onDrop);
	};


	// Support jQuery
	if( jQuery && !jQuery.fn.dnd ){
		jQuery.fn.dnd = function (onHover, onDrop){
			return this.each(function (){
				api.event.dnd(this, onHover, onDrop);
			});
		};

		jQuery.fn.offdnd = function (onHover, onDrop){
			return this.each(function (){
				api.event.dnd.off(this, onHover, onDrop);
			});
		};
	}

	// @export
	window.FileAPI  = _extend(api, window.FileAPI);


	// Debug info
	api.log('FileAPI: ' + api.version);
	api.log('protocol: ' + window.location.protocol);
	api.log('doctype: [' + doctype.name + '] ' + doctype.publicId + ' ' + doctype.systemId);


	// @detect 'x-ua-compatible'
	_each(document.getElementsByTagName('meta'), function (meta){
		if( /x-ua-compatible/i.test(meta.getAttribute('http-equiv')) ){
			api.log('meta.http-equiv: ' + meta.getAttribute('content'));
		}
	});


	// @configuration
	if( !api.flashUrl ){ api.flashUrl = api.staticPath + 'FileAPI.flash.swf'; }
	if( !api.flashImageUrl ){ api.flashImageUrl = api.staticPath + 'FileAPI.flash.image.swf'; }
	if( !api.flashWebcamUrl ){ api.flashWebcamUrl = api.staticPath + 'FileAPI.flash.camera.swf'; }
})(window, void 0);
