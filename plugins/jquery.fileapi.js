/**
 * jQuery plugin for FileAPI v2+
 * @auhtor	RubaXa	<trash@rubaxa.org>
 */

/*jslint evil: true */
/*global jQuery, FileAPI*/
(function ($, api){
	"use strict";

	var
		  noop = $.noop
		, oldJQ = !$.fn.prop
		, propFn = oldJQ ? 'attr' : 'prop'

		, _dataAttr = 'data-fileapi'
		, _dataFileId = 'data-fileapi-id'

		, _slice	= [].slice
		, _each		= api.each
		, _extend	= api.extend

		, _bind		= function (ctx, fn) {
			var args = _slice.call(arguments, 2);
			return	fn.bind ? fn.bind.apply(fn, [ctx].concat(args)) : function (){
				return fn.apply(ctx, args.concat(_slice.call(arguments)));
			};
		}

		, _optDataAttr = function (name){
			return '['+_dataAttr+'="'+name+'"]';
		}

		, _isID = function (selector){
			return	selector.indexOf('#') === 0;
		}
	;



	var Plugin = function (el, options){
		this.$el = el = $(el).on('change.fileapi', 'input[type="file"]', _bind(this, this._onSelect));
		this.el  = el[0];

		this._options = {}; // previous options
		this.options  = { // current options
			url: 0,
			data: {}, // additional POST-data
			accept: 0, // accept mime types, "*" — unlimited
			multiple: false, // single or multiple mode upload mode
			paramName: 0, // POST-parameter name
			dataType: 'json',
			duplicate: false, // ignore duplicate

			uploadRetry: 0,
			networkDownRetryTimeout: 5000,

			chunkSize: 0, // or chunk size in bytes, eg: .5 * FileAPI.MB
			chunkUploadRetry: 3, // number of retries during upload chunks (html5)
			chunkNetworkDownRetryTimeout: 2000,

			maxSize: 0, // max file size, 0 — unlimited
			maxFiles: 0, // 0 unlimited
			imageSize: 0, // { minWidth: 320, minHeight: 240, maxWidth: 3840, maxHeight: 2160 }

			sortFn: 0,
			filterFn: 0,
			autoUpload: false,

			clearOnSelect: void 0,
			clearOnComplete: void 0,

			lang: {
				  B:	'bytes'
				, KB:	'KB'
				, MB:	'MB'
				, GB:	'GB'
				, TB:	'TB'
			},
			sizeFormat: '0.00',

			imageOriginal: true,
			imageTransform: 0,
			imageAutoOrientation: !!FileAPI.support.exif,

			elements: {
				ctrl: {
					upload: _optDataAttr('ctrl.upload'),
					reset: _optDataAttr('ctrl.reset'),
					abort: _optDataAttr('ctrl.abort')
				},
				empty: {
					show: _optDataAttr('empty.show'),
					hide: _optDataAttr('empty.hide')
				},
				emptyQueue: {
					show: _optDataAttr('emptyQueue.show'),
					hide: _optDataAttr('emptyQueue.hide')
				},
				active: {
					show: _optDataAttr('active.show'),
					hide: _optDataAttr('active.hide')
				},
				size: _optDataAttr('size'),
				name: _optDataAttr('name'),
				progress: _optDataAttr('progress'),
				list: _optDataAttr('list'),
				file: {
					tpl: _optDataAttr('file.tpl'),
					progress: _optDataAttr('file.progress'),
					active: {
						show: _optDataAttr('file.active.show'),
						hide: _optDataAttr('file.active.hide')
					},
					preview: {
						el: 0,
						get: 0,
						width: 0,
						height: 0,
						processing: 0
					},
					abort: _optDataAttr('file.abort'),
					remove: _optDataAttr('file.remove'),
					rotate: _optDataAttr('file.rotate')
				},
				dnd: {
					el: _optDataAttr('dnd'),
					hover: 'dnd_hover',
					fallback: _optDataAttr('dnd.fallback')
				}
			},

			onDrop: noop,
			onDropHover: noop,

			onSelect: noop,

			onBeforeUpload: noop,
			onUpload: noop,
			onProgress: noop,
			onComplete: noop,

			onFilePrepare: noop,
			onFileUpload: noop,
			onFileProgress: noop,
			onFileComplete: noop,

			onFileRemove: null,
			onFileRemoveCompleted: null
		};

		$.extend(true, this.options, options); // deep extend
		options = this.options;

		this.option('elements.file.preview.rotate', options.imageAutoOrientation);

		if( !options.url ){
			var url = this.$el.attr('action') || this.$el.find('form').attr('action');
			if( url ){
				options.url = url;
			} else {
				this._throw('url — is not defined');
			}
		}


		this.$files = this.$elem('list');

		this.$fileTpl	= this.$elem('file.tpl');
		this.itemTplFn	= $.fn.fileapi.tpl( $('<div/>').append( this.$elem('file.tpl') ).html() );


		_each(options, function (value, option){
			this._setOption(option, value);
		}, this);


		this.$el
			.on('reset.fileapi', _bind(this, this._onReset))
			.on('submit.fileapi', _bind(this, this._onSubmit))
			.on('upload.fileapi progress.fileapi complete.fileapi', _bind(this, this._onUploadEvent))
			.on('fileupload.fileapi fileprogress.fileapi filecomplete.fileapi', _bind(this, this._onFileUploadEvent))
			.on('click', '['+_dataAttr+']', _bind(this, this._onActionClick))
		;


		// Controls
		var ctrl = options.elements.ctrl;
		if( ctrl ){
			this._listen('click', ctrl.reset, _bind(this, this._onReset));
			this._listen('click', ctrl.upload, _bind(this, this._onSubmit));
			this._listen('click', ctrl.abort, _bind(this, this._onAbort));
		}

		// Drag'n'Drop
		var dnd = FileAPI.support.dnd;
		this.$elem('dnd.el', true).toggle(dnd);
		this.$elem('dnd.fallback').toggle(!dnd);

		if( dnd ){
			this.$elem('dnd.el', true).dnd(_bind(this, this._onDropHover), _bind(this, this._onDrop));
		}


		this.$progress = this.$elem('progress');

		if( options.clearOnSelect === void 0 ){
			options.clearOnSelect = !options.multiple;
		}

		this.clear();

		if( $.isArray(options.files) ){
			this.files = $.map(options.files, function (file){
				if( $.type(file) === 'string' ){
					file = {
						  src: file
						, name: file.split('/').pop()
						// @todo: use FileAPI.getMimeType (v2.1+)
						, type: /jpe?g|png|bmp|git|tiff?/i.test(file) && 'image/'+file.split('.').pop()
						, size: 0
					};
				}
				file.complete = true;
				return file;
			});

			this._redraw();
		}
	};


	Plugin.prototype = {
		constructor: Plugin,

		_throw: function (msg){
			throw "jquery.fileapi: " + msg;
		},

		_getFiles: function (evt, fn){
			var
				  opts = this.options
				, maxSize = opts.maxSize
				, maxFiles = opts.maxFiles
				, filterFn = opts.filterFn
				, countFiles = this.files.length
				, files = api.getFiles(evt)
				, data = {
					  all: files
					, files: []
					, other: []
					, duplicate: opts.duplicate ? [] : this._extractDuplicateFiles(files)
				}
				, imageSize = opts.imageSize
				, _this = this
			;

			if( imageSize || filterFn ){
				api.filterFiles(files, function (file, info){
					if( info && imageSize ){
						_checkFileByCriteria(file, 'minWidth', imageSize.minWidth, info.width);
						_checkFileByCriteria(file, 'minHeight', imageSize.minHeight, info.height);
						_checkFileByCriteria(file, 'maxWidth', imageSize.maxWidth, info.width);
						_checkFileByCriteria(file, 'maxHeight', imageSize.maxHeight, info.height);
					}

					_checkFileByCriteria(file, 'maxSize', maxSize, file.size);

					return	!file.errors && (!filterFn || filterFn(file, info));
				}, function (success, rejected){
					_extractFilesOverLimit(maxFiles, countFiles, success, rejected);

					data.other = rejected;
					data.files = success;

					fn.call(_this, data);
				});
			} else {
				_each(files, function (file){
					_checkFileByCriteria(file, 'maxSize', maxSize, file.size);
					data[file.errors ? 'other' : 'files'].push(file);
				});

				_extractFilesOverLimit(maxFiles, countFiles, data.files, data.other);
				fn.call(_this, data);
			}
		},

		_extractDuplicateFiles: function (list/**Array*/){
			var duplicates = [], i = list.length, files = this.files, j;

			while( i-- ){
				j = files.length;
				while( j-- ){
					if( this._fileCompare(list[i], files[j]) ){
						duplicates.push( list.splice(i, 1) );
						break;
					}
				}
			}

			return	duplicates;
		},

		_fileCompare: function (A/**File*/, B/**File*/){
			return (A.size == B.size) && (A.name == B.name);
		},

		_getFormatedSize: function (size){
			var opts = this.options, postfix = 'B';

			if( size >= api.TB ){
				size /= api[postfix = 'TB'];
			}
			else if( size >= api.GB ){
				size /= api[postfix = 'GB'];
			}
			else if( size >= api.MB ){
				size /= api[postfix = 'MB'];
			}
			else if( size >= api.KB ){
				size /= api[postfix = 'KB'];
			}

			return	opts.sizeFormat.replace(/^\d+([^\d]+)(\d*)/, function (_, separator, fix){
				size = size.toFixed(fix.length);
				return	(size + '').replace('.', separator) +' '+ opts.lang[postfix];
			});
		},

		_onSelect: function (evt){
			if( this.options.clearOnSelect ){
				this.queue = [];
				this.files = [];
			}

			this._getFiles(evt, _bind(this, function (data){
				if( data.all.length && this.emit('select', data) !== false ){
					this.add(data.files);
				}

				// Reset input
				FileAPI.reset(evt.target);
			}));
		},

		_onActionClick: function (evt){
			var
				  el = evt.currentTarget
				, act = $.attr(el, _dataAttr)
				, uid = $(el).closest('['+_dataFileId+']', this.$el).attr(_dataFileId)
				, file = this._getFile(uid)
				, prevent = true
			;

			if( !this.$file(uid).attr('disabled') ){
				if( 'file.remove' == act ){
					if( file && this.emit('fileRemove' + (file.complete ? 'Completed' : ''), file) ){
						this.remove(uid);
					}
				}
				else if( /^file\.rotate/.test(act) ){
					this.rotate(uid, (/ccw/.test(act) ? '-=90' : '+=90'));
				}
				else {
					prevent = false;
				}
			}

			if( prevent ){
				evt.preventDefault();
			}
		},

		_listen: function (name, selector, fn){
			selector && _each($.trim(selector).split(','), function (selector){
				selector = $.trim(selector);

				if( _isID(selector) ){
					$(selector).on(name+'.fileapi', fn);
				} else {
					this.$el.on(name+'.fileapi', selector, fn);
				}
			}, this);
		},

		_onSubmit: function (evt){
			evt.preventDefault();
			this.upload();
		},

		_onReset: function (evt){
			evt.preventDefault();
			this.clear();
		},

		_onAbort: function (evt){
			evt.preventDefault();
			this.abort();
		},

		_onDrop: function (files){
			this._getFiles(files, function (data){
				if( this.emit('drop', data) !== false ){
					this.add(data.files);
				}
			});
		},

		_onDropHover: function (state, evt){
			if( this.emit('dropHover', { state: state, event: evt }) !== false ){
				var hover = this.option('elements.dnd.hover');
				if( hover ){
					$(evt.currentTarget).toggleClass(hover, state);
				}
			}
		},

		_getFile: function (uid){
			return api.filter(this.files, function (file){ return api.uid(file) == uid; })[0];
		},

		_getUploadEvent: function (xhr, extra){
			var evt = {
				  xhr: xhr
				, file: this.xhr.currentFile
				, files: this.xhr.files
				, widget: this
			};
			return	_extend(evt, extra);
		},

		_emitUploadEvent: function (prefix, file, xhr){
			var evt = this._getUploadEvent(xhr);
			this.emit(prefix+'Upload', evt);
		},

		_emitProgressEvent: function (prefix, event, file, xhr){
			var evt = this._getUploadEvent(xhr, event);
			this.emit(prefix+'Progress', evt);
		},

		_emitCompleteEvent: function (prefix, err, xhr, file){
			var evt = this._getUploadEvent(xhr, {
				  error: err
				, status: xhr.status
				, statusText: xhr.statusText
				, result: xhr.responseText
			});

			if( prefix == 'file' ){
				file.complete = true;
			}

			if( !err && (this.options.dataType == 'json') ){
				try {
					evt.result = $.parseJSON(evt.result);
				} catch (err){
					evt.error = err;
				}
			}

			this.emit(prefix+'Complete', evt);
		},

		_onUploadEvent: function (evt, ui){
			var _this = this, $progress = _this.$progress, type = evt.type;

			if( type == 'progress' ){
				$progress.stop().animate({ width: ui.loaded/ui.total*100 + '%' }, 300);
			}
			else if( type == 'upload' ){
				// Начало загрузки
				$progress.width(0);
			}
			else {
				// Завершение загрузки
				var fn = function (){
					$progress.dequeue();
					_this[_this.options.clearOnComplete ? 'clear' : 'dequeue']();
				};

				this.xhr = null;
				this.active = false;

				if( $progress.length ){
					$progress.queue(fn);
				} else {
					fn();
				}
			}
		},

		_onFileUploadPrepare: function (file, opts){
			var
				  uid	= api.uid(file)
				, deg	= this._rotate[uid]
				, crop	= this._crop[uid]
				, resize = this._resize[uid]
				, evt = this._getUploadEvent(this.xhr)
			;

			if( deg || crop ){
				var trans = $.extend(true, {}, opts.imageTransform || {});
				deg = deg || (this.options.imageAutoOrientation ? 'auto' : void 0);

				if( $.isEmptyObject(trans) || _isOriginTransform(trans) ){
					_extend(trans, resize);

					trans.crop		= crop;
					trans.rotate	= deg;
				}
				else {
					_each(trans, function (opts){
						opts.crop	= crop;
						opts.rotate	= deg;
					});
				}

				opts.imageTransform = trans;
			}

			evt.file = file;
			evt.options = opts;

			this.emit('filePrepare', evt);
		},

		_onFileUploadEvent: function (evt, ui){
			var
				  _this = this
				, type = evt.type.substr(4)
				, uid = api.uid(ui.file)
				, $file = this.$file(uid)
				, $progress = this._$fileprogress
				, opts = this.options
			;

			if( this.__fileId !== uid ){
				this.__fileId = uid;
				this._$fileprogress = $progress = this.$elem('file.progress', $file);
			}

			if( type == 'progress' ){
				$progress.stop().animate({ width: ui.loaded/ui.total*100 + '%' }, 300);
			}
			else if( type == 'upload' || type == 'complete' ){
				var fn = function (){
					var
						  elem = 'file.'+ type
						, $remove = _this.$elem('file.remove', $file)
					;

					if( type == 'upload' ){
						$remove.hide();
						$progress.width(0);
					} else if( opts.onRemoveCompleted ){
						$remove.show();
					}

					$progress.dequeue();

					_this.$elem(elem + '.show', $file).show();
					_this.$elem(elem + '.hide', $file).hide();
				};

				if( $progress.length ){
					$progress.queue(fn);
				} else {
					fn();
				}

				if( type == 'complete' ){
					this.uploaded.push(ui.file);
					delete this._rotate[uid];
				}
			}
		},

		_redraw: function (clear/**Boolean*/){
			var
				  files = this.files
				, active = !!this.active
				, empty = !files.length && !active
				, emptyQueue = !this.queue.length && !active
				, name = []
				, size = 0
				, $files = this.$files
				, offset = $files.children().length
				, preview = this.option('elements.file.preview')
			;

			if( clear ){
				this.$files.empty();
			}

			_each(files, function (file, i){
				var uid = api.uid(file);

				name.push(file.name);
				size += file.complete ? 0 : file.size;

				if( $files.length && !this.$file(uid).length ){
					var
						html = this.itemTplFn({
							  $idx: offset + i
							, uid:  uid
							, name: file.name
							, type: file.type
							, size: file.size
							, sizeText: this._getFormatedSize(file.size)
						})

						, $file = $(html).attr(_dataFileId, uid)
					;

					file.$el = $file;
					$files.append( $file );

					if( file.complete ){
						this.$elem('file.upload.hide', $file).hide();
						this.$elem('file.complete.hide', $file).hide();
					}

					if( preview.el ){
						this._makeFilePreview(uid, file, preview);
					}
				}
			}, this);


			this.$elem('name').text( name.join(', ') );
			this.$elem('size').text( !emptyQueue ? this._getFormatedSize(size) : '' );


			this.$elem('empty.show').toggle( empty );
			this.$elem('empty.hide').toggle( !empty );


			this.$elem('emptyQueue.show').toggle( emptyQueue );
			this.$elem('emptyQueue.hide').toggle( !emptyQueue );


			this.$elem('active.show').toggle( active );
			this.$elem('active.hide').toggle( !active );


			this.$('.js-fileapi-wrapper,:file')
				[active ? 'attr' : 'removeAttr']('aria-disabled', active)
				[propFn]('disabled', active)
			;

			// Upload control
			this._disableElem('ctrl.upload', emptyQueue || active);

			// Reset control
			this._disableElem('ctrl.reset', emptyQueue || active);

			// Abort control
			this._disableElem('ctrl.abort', !active);
		},

		_disableElem: function (name, state){
			this.$elem(name)
				[state ? 'attr' : 'removeAttr']('aria-disabled', 'disabled')
				[propFn]('disabled', state)
			;
		},

		_makeFilePreview: function (uid, file, opts, global){
			var
				  _this = this
				, $el = global ? _this.$(opts.el) : _this.$file(uid).find(opts.el)
			;

			if( !_this._crop[uid] ){
				if( /^image/.test(file.type) ){
					var
						  image = api.Image(file.src || file)
						, doneFn = function (){
							image.get(function (err, img){
								if( !_this._crop[uid] ){
									if( err ){
										opts.get && opts.get($el, file);
										_this.emit('previewError', [err, file]);
									} else {
										$el.html(img);
									}
								}
							});
						}
					;

					if( opts.width ){
						image.preview(opts.width, opts.height);
					}

					if( opts.rotate ){
						image.rotate('auto');
					}

					if( opts.processing ){
						opts.processing(file, image, doneFn);
					} else {
						doneFn();
					}
				}
				else {
					opts.get && opts.get($el, file);
				}
			}
		},

		emit: function (name, arg){
			var opts = this.options, evt = $.Event(name.toLowerCase()), res;
			evt.widget = this;
			name = $.camelCase('on-'+name);
			if( $.isFunction(opts[name]) ){
				res = opts[name].call(this.el, evt, arg);
			}
			this.$el.triggerHandler(evt, arg);
			return	(res !== false) && !evt.isDefaultPrevented();
		},

		/**
		 * Add files to queue
		 * @param  {Array}    files
		 * @param  {Boolean}  [clear]
		 */
		add: function (files, clear){
			files = [].concat(files);

			if( files.length ){
				var
					  opts = this.options
					, sortFn = opts.sortFn
					, preview = opts.elements.preview
				;

				if( sortFn ){
					files.sort(sortFn);
				}

				if( preview && preview.el ){
					_each(files, function (file){
						this._makeFilePreview(api.uid(file), file, preview, true);
					}, this);
				}

				if( this.xhr ){
					this.xhr.append(files);
				}

				this.queue = clear ? files : this.queue.concat(files);
				this.files = clear ? files : this.files.concat(files);

				if( this.active ){
					this.xhr.append(files);
					this._redraw(clear);
				}
				else {
					this._redraw(clear);
					if( this.options.autoUpload ){
						this.upload();
					}
				}
			}
		},

		/**
		 * Find element
		 * @param	{String}	sel
		 * @param	{jQuery}	[ctx]
		 * @return	{jQuery}
		 */
		$: function (sel, ctx){
			if( typeof sel === 'string' ){
				sel	= /^#/.test(sel) ? sel : (ctx ? $(ctx) : this.$el).find(sel);
			}
			return	$(sel);
		},

		/**
		 * @param  {String}   name
		 * @param  {Boolean|jQuery}  [up]
		 * @param  {jQuery}   [ctx]
		 * @return {jQuery}
		 */
		$elem: function (name, up, ctx){
			if( up && up.jquery ){
				ctx = up;
				up = false;
			}

			var sel = this.option('elements.'+name);
			if( sel === void 0 && up ){
				sel = this.option('elements.'+name.substr(0, name.lastIndexOf('.')));
			}

			return	this.$($.type(sel) != 'string' && $.isEmptyObject(sel) ? [] : sel, ctx);
		},

		/**
		 * @param  {String}  uid
		 * @return {jQuery}
		 */
		$file: function (uid){
			return	this.$('['+_dataFileId+'="'+uid+'"]');
		},

		/**
		 * Get/set options
		 * @param {String} name
		 * @param {*} [value]
		 * @return {*}
		 */
		option: function (name, value){
			if( value !== void 0 && $.isPlainObject(value) ){
				_each(value, function (val, key){
					this.option(name+'.'+key, val);
				}, this);

				return	this;
			}

			var opts = this.options, val = opts[name], i = 0, len, part;

			if( name.indexOf('.') != -1 ){
				val  = opts;
				name = name.split('.');
				len  = name.length;

				for( ; i < len; i++ ){
					part = name[i];

					if( (value !== void 0) && (len - i === 1) ){
						val[part] = value;
						break;
					}
					else if( !val[part] ){
						val[part] = {};
					}

					val = val[part];
				}
			}
			else if( value !== void 0 ){
				opts[name] = value;
			}

			if( value !== void 0 ){
				this._setOption(name, value, this._options[name]);
				this._options[name] = value;
			}

			return	value !== void 0 ? value : val;
		},

		_setOption: function (name, nVal){
			switch( name ){
				case 'accept':
				case 'multiple':
				case 'paramName':
						if( name == 'paramName' ){ name = 'name'; }
						if( nVal ){
							this.$(':file')[propFn](name, nVal);
						}
					break;
			}
		},

		serialize: function (){
			var obj = {}, val;

			this.$el.find(':input').each(function(name, node){
				if(
					   (name = node.name) && !node.disabled
					&& (node.checked || /select|textarea|input/i.test(node.nodeName) && !/checkbox|radio|file/i.test(node.type))
				){
					val	= $(node).val();
					if( obj[name] !== void 0 ){
						if( !obj[name].push ){
							obj[name] = [obj[name]];
						}

						obj[name].push(val);
					} else {
						obj[name] = val;
					}
				}
			});

			return	obj;
		},

		upload: function (){
			if( !this.active && this.emit('beforeUpload', { widget: this, files: this.queue }) ){
				this.active = true;

				var
					  $el = this.$el
					, opts = this.options
					, files = {}
					, uploadOpts = {
						  url: opts.url
						, data: _extend({}, this.serialize(), opts.data)
						, headers: opts.headers
						, files: files

						, uploadRetry: 0
						, networkDownRetryTimeout: 5000
						, chunkSize: 0
						, chunkUploadRetry: 3
						, chunkNetworkDownRetryTimeout: 2000

						, prepare: _bind(this, this._onFileUploadPrepare)
						, imageOriginal: opts.imageOriginal
						, imageTransform: opts.imageTransform
					}
				;

				// Set files
				files[$el.find(':file').attr('name') || 'files[]'] = this.queue;

				// Add event listeners
				_each(['Upload', 'Progress', 'Complete'], function (name){
					var lowerName = name.toLowerCase();
					uploadOpts[lowerName] = _bind(this, this['_emit'+name+'Event'], '');
					uploadOpts['file'+lowerName] = _bind(this, this['_emit'+name+'Event'], 'file');
				}, this);

				// Start uploading
				this.xhr = api.upload(uploadOpts);
				this._redraw();
			}
		},

		abort: function (text){
			if( this.active && this.xhr ){
				this.xhr.abort(text);
			}
		},

		crop: function (file, coords){
			var
				  uid = api.uid(file)
				, opts = this.options
				, preview = opts.multiple ? this.option('elements.file.preview') : opts.elements.preview
				, $el = (opts.multiple ? this.$file(uid) : this.$el).find(preview && preview.el)
			;

			if( $el.length ){
				api.getInfo(file, _bind(this, function (err, info){
					if( err ){
						this.emit('previewError', [err, file]);
					} else {
						if( !$el.find('div>div').length ){
							$el.html(
								$('<div><div></div></div>')
									.css(preview)
									.css('overflow', 'hidden')
							);
						}

						if( this.__cropFile !== file ){
							this.__cropFile = file;
							api.Image(file).rotate(opts.imageAutoOrientation ? 'auto' : 0).get(function (err, img){
								$el.find('>div>div').html($(img).width('100%').height('100%'));
							}, 'exactFit');
						}


						var
							  pw = preview.width, ph = preview.height
							, mx = pw, my = ph
							, rx = pw/coords.rw, ry = ph/coords.rh
						;

						if( preview.keepAspectRatio ){
							if (rx > 1 && ry > 1){ // image is smaller than preview (no scale)
								rx = ry = 1;
								my = coords.h;
								mx = coords.w;

							} else { // image is bigger than preview (scale)
								if( rx < ry ){
									ry = rx;
									my = pw * coords.rh / coords.rw;
								} else {
									rx = ry;
									mx = ph * coords.rw / coords.rh;
								}
							}
						}

						$el.find('>div>div').css({
							  width:	Math.round(rx * info[coords.flip ? 'height' : 'width'])
							, height:	Math.round(ry * info[coords.flip ? 'width' : 'height'])
							, marginLeft:	-Math.round(rx * coords.rx)
							, marginTop:	-Math.round(ry * coords.ry)
						});

						if( preview.keepAspectRatio ){ // create side gaps
							$el.find('>div').css({
								  width:	Math.round(mx)
								, height:	Math.round(my)
								, marginLeft:	mx < pw  ? Math.round((pw - mx) / 2)  : 0
								, marginTop:	my < ph ? Math.round((ph - my) / 2) : 0
							});
						}
					}
				}));
			}

			this._crop[uid] = coords;
		},

		resize: function (file, width, height, type){
			this._resize[api.uid(file)] = {
				  type: type
				, width: width
				, height: height
			};
		},

		rotate: function (file, deg){
			var
				  uid = $.type(file) == 'string' ? file : api.uid(file)
				, opts = this.options
				, preview = opts.multiple ? this.option('elements.file.preview') : opts.elements.preview
				, $el = (opts.multiple ? this.$file(uid) : this.$el).find(preview && preview.el)
				, _rotate = this._rotate
			;

			if( /([+-])=/.test(deg) ){
				_rotate[uid] = deg = (_rotate[uid] || 0) + (RegExp.$1 == '+' ? 1 : -1) * deg.substr(2);
			} else {
				_rotate[uid] = deg;
			}

			this._getFile(uid).rotate = deg;

			$el.css({
				  '-webkit-transform': 'rotate('+deg+'deg)'
				, '-moz-transform': 'rotate('+deg+'deg)'
				, 'transform': 'rotate('+deg+'deg)'
			});
		},

		remove: function (file){
			var uid = typeof file == 'object' ? api.uid(file) : file;

			this.$file(uid).remove();
			this.queue = api.filter(this.queue, function (file){ return api.uid(file) != uid; });
			this.files = api.filter(this.files, function (file){ return api.uid(file) != uid; });
			this._redraw();
		},

		clear: function (){
			this._crop		= {};
			this._resize	= {};
			this._rotate	= {}; // rotate deg

			this.queue		= [];
			this.files		= []; // all files
			this.uploaded	= []; // uploaded files

			this.$files.empty();
			this._redraw();
		},

		dequeue: function (){
			this.queue = [];
			this._redraw();
		},

		widget: function (){
			return	this;
		},

		toString: function (){
			return	'[jQuery.FileAPI object]';
		},

		destroy: function (){
			this.$files.empty().append(this.$fileTpl);

			this.$el
				.off('.fileapi')
				.removeData('fileapi')
			;

			_each(this.options.elements.ctrl, function (selector){
				_isID(selector) && $(selector).off('click.fileapi');
			});
		}
	};


	function _isOriginTransform(trans){
		var key;
		for( key in trans ){
			if( trans.hasOwnProperty(key) ){
				if( !(trans[key] instanceof Object || key === 'overlay') ){
					return	true;
				}
			}
		}
		return	false;
	}


	function _checkFileByCriteria(file, name, excepted, actual){
		if( excepted ){
			var val = excepted - actual, isMax = /max/.test(name);
			if( (isMax && val < 0) || (!isMax && val > 0) ){
				if( !file.errors ){
					file.errors = {};
				}
				file.errors[name] = Math.abs(val);
			}
		}
	}


	function _extractFilesOverLimit(limit, countFiles, files, other){
		if( limit ){
			var delta = files.length - (limit - countFiles);
			if( delta > 0 ){
				_each(files.splice(0, delta), function (file, i){
					_checkFileByCriteria(file, 'maxFiles', -1, i);
					other.push(file);
				});
			}
		}
	}





	/**
	 * @export
	 * @param	{Object}	options
	 * @param	{String}	[value]
	 */
	$.fn.fileapi = function (options, value){
		var plugin = this.data('fileapi');

		if( plugin ){
			if( options === 'widget' ){
				return	plugin;
			}

			if( typeof options == 'string' ){
				var fn = plugin[options], res;

				if( $.isFunction(fn) ){
					res = fn.apply(plugin, _slice.call(arguments, 1));
				}
				else if( fn === void 0 ){
					res = plugin.option(options, value);
				}
				else if( options === 'files' ){
					res = fn;
				}

				return	res === void 0 ? this : res;
			}
		} else if( options == null || typeof options == 'object' ){
			this.data('fileapi', new Plugin(this, options));
		}

		return	this;
	};


	$.fn.fileapi.version = '0.4.1';
	$.fn.fileapi.tpl = function (text){
		var index = 0;
		var source = "__b+='";

		text.replace(/(?:&lt;|<)%([-=])?([\s\S]+?)%(?:&gt;|>)|$/g, function (match, mode, expr, offset){
			source += text.slice(index, offset).replace(/[\r\n"']/g, function (match){ return '\\'+match; });

			if( expr ){
				if( mode ){
					source	+= "'+\n((__x=("+ expr +"))==null?'':" + (mode == "-" ? "__esc(__x)" : "__x")+")\n+'";
				} else {
					source	+= "';\n"+ expr +"\n__b+='";
				}
			}

			index = offset + match.length;
			return match;
		});

		return new Function("ctx", "var __x,__b=''," +
			"__esc=function(val){return typeof val=='string'?val.replace(/</g,'&lt;').replace(/\"/g,'&quot;'):val;};" +
			"with(ctx||{}){\n"+ source +"';\n}return __b;");
	};


	/**
	 * FileAPI.Camera wrapper
	 * @param  {Object|String}  options
	 * @returns {jQuery}
	 */
	$.fn.webcam = function (options){
		var el = this, ret = el, $el = $(el), key = 'fileapi-camera', inst = $el.data(key);

		if( inst === true ){
			api.log("[webcam.warn] not ready.");
			ret = null;
		}
		else if( options === 'widget' ){
			ret	= inst;
		}
		else if( options === 'destroy' ){
			inst.stop();
			$el.empty();
		}
		else if( inst ){
			ret	= inst[options]();
		}
		else if( inst === false ){
			api.log("[webcam.error] does not work.");
			ret = null;
		}
		else {
			$el.data(key, true);
			options = _extend({ success: noop, error: noop }, options);

			FileAPI.Camera.publish($el, options, function (err, cam){
				$el.data(key, err ? false : cam);
				options[err ? 'error' : 'success'].call(el, err || cam);
			});
		}

		return	ret;
	};


	/**
	 * Wrapper for JCrop
	 */
	$.fn.cropper = function (opts){
		var $el = this, file = opts.file;

		if( typeof opts === 'string' ){
			$el.first().Jcrop.apply($el, arguments);
		}
		else {
			var
				minSize = opts.minSize || [0, 0],
				ratio = (opts.aspectRatio || minSize[0]/minSize[1])
			;

			if( $.isArray(opts.minSize) && opts.aspectRatio === void 0 && ratio > 0 ){
				opts.aspectRatio = ratio;
			}

			api.getInfo(file, function (err, info){
				var
					  Image = api.Image(file)
					, maxSize = opts.maxSize
					, deg = file.rotate
				;

				if( maxSize ){
					Image.resize(
						  Math.max(maxSize[0], minSize[0])
						, Math.max(maxSize[1], minSize[1])
						, 'max'
					);
				}

				Image.rotate(deg === void 0 ? 'auto' : deg).get(function (err, img){
					var
						  selection = opts.selection
						, minSide = Math.min(img.width, img.height)

						, selWidth = minSide
						, selHeight = minSide / ratio

						, deg = FileAPI.Image.exifOrientation[info.exif && info.exif.Orientation] || 0
					;

					if( selection ){
						if( /%/.test(selection) || (selection > 0 && selection < 1) ){
							selection	 = parseFloat(selection, 10) / (selection > 0 ? 1 : 100);
							selWidth	*= selection;
							selHeight	*= selection;
						}

						var
							  selLeft = (img.width - selWidth)/2
							, selTop = (img.height - selHeight)/2
						;

						opts.setSelect = [selLeft|0, selTop|0, (selLeft + selWidth)|0, (selTop + selHeight)|0];
					}

					_each(['onSelect', 'onChange'], function (name, fn){
						if( fn = opts[name] ){
							opts[name] = function (coords){
								var
									  flip = deg % 180
									, ow = info.width
									, oh = info.height
									, fx = coords.x/img.width
									, fy = coords.y/img.height
									, fw = coords.w/img.width
									, fh = coords.h/img.height
									, x = ow * (flip ?  fy : fx)
									, y = oh * (flip ? 1 - (coords.x + coords.w)/img.width : fy)
									, w = ow * (flip ? fh : fw)
									, h = oh * (flip ? fw : fh)
								;


								fn({
									  x: x
									, y: y
									, w: w
									, h: h
									, rx: fx * (flip ? oh : ow)
									, ry: fy * (flip ? ow : oh)
									, rw: fw * (flip ? oh : ow)
									, rh: fh * (flip ? ow : oh)
									, lx: coords.x // local coords
									, ly: coords.y
									, lw: coords.w
									, lh: coords.h
									, lx2: coords.x2
									, ly2: coords.y2
									, deg: deg
									, flip: flip
								});
							};
						}
					});

					var $inner = $('<div/>').css('lineHeight', 0).append( $(img).css('margin', 0) );
					$el.html($inner);
					$inner.Jcrop(opts).trigger('resize');
				});
			});
		}

		return	$el;
	};
})(jQuery, FileAPI);
