(function (api, window, document){
	api.support.flash = (function (){
		var nav	= window.navigator, mime = nav.mimeTypes, has = false;

		if( nav.plugins && typeof nav.plugins['Shockwave Flash'] == 'object' ){
			has	= nav.plugins['Shockwave Flash'].description && !(mime && mime['application/x-shockwave-flash'] && !mime['application/x-shockwave-flash'].enabledPlugin);
		}
		else {
			try {
				has	= !!(window.ActiveXObject && new ActiveXObject('ShockwaveFlash.ShockwaveFlash'));
			}
			catch(er){ /*__*/ }
		}

		return	has;
	})();



	if( (0 || !api.support.html5) && api.support.flash ) (function (){
		var
			  _attr  = api.expando
			, _retry = 0
			, _files = {}
			, _toInt = function (val){ return parseInt(val, 10); }

			, flash = {
				_fn: {},


				/**
				 * Initialization & preload flash object
				 */
				init: function (){
					var child = document.body && document.body.firstChild;

					if( child ){
						do {
							if( child.nodeType == 1 ){
								api.log('FlashAPI.Flash.inited');

								var dummy = document.createElement('div');

								_css(dummy, {
									  top: 1
									, left: 1
									, width: 5
									, height: 5
									, position: 'absolute'
								});

								child.parentNode.insertBefore(dummy, child);

								flash.pingUrl = flash.pingUrl || (location.protocol+'//'+location.host);
								flash.publish(dummy, api.expando);

								return;
							}
						}
						while( child = child.nextSibling )
					}

					if( _retry < 10 ){
						setTimeout(flash.init, ++_retry*50);
					}
				},


				/**
				 * Publish flash-object
				 *
				 * @param {HTMLElement} el
				 * @param {String} id
				 */
				publish: function (el, id){
					var vars = {
						  id: id
						, src: './FileAPI.flash.swf?r=' + api.build
						, flashVars: 'callback=FileAPI.Flash.event'
							+ '&flashId='+ id
							+ '&storeKey='+ navigator.userAgent.match(/\d/ig).join('') +'_'+ api.build
							+ (flash.isReady || !flash.pingUrl ? '' : '&ping='+flash.pingUrl)
					};

					el.innerHTML = ('<object id="#id#" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%">'
									+ '<param name="movie" value="#src#" />'
									+ '<param name="flashvars" value="#flashVars#" />'
									+ '<param name="swliveconnect" value="true" />'
									+ '<param name="allowscriptaccess" value="always" />'
									+ '<param name="allownetworking" value="all" />'
									+ '<param name="wmode" value="transparent" />'
									+ '<param name="menu" value="false" />'
									+ '<embed flashvars="#flashVars#" swliveconnect="true" allownetworking="all" allowscriptaccess="always" name="#id#" src="#src#"  width="100%" height="100%" menu="false" wmode="transparent" type="application/x-shockwave-flash"></embed>'
									+ '</object>').replace(/#(\w+)#/ig, function (a, name){ return vars[name]; })
								;
				},


				ready: function (){
					flash.ready = api.F;
					flash.isReady = true;
					flash.patch();

					api.event.on(document, 'mouseover', flash.mouseover);
					api.event.on(document, 'click', function (evt){
						if( flash.mouseover(evt) ){
							evt.preventDefault
								? evt.preventDefault()
								: (evt.returnValue = true)
							;
						}
					});
				},


				mouseover: function (evt){
					var target = api.event.fix(evt).target;

					if( /input/i.test(target.nodeName) && target.type == 'file' ){
						if( target.getAttribute(_attr) != 'y' ){
							target.setAttribute(_attr, 'y');

							var
								  top = target.offsetTop
								, left = target.offsetLeft
								, wrapper = document.createElement('div')
								, computed
							;

							if( window.getComputedStyle ){
								computed = getComputedStyle(target, null);
								top  = _toInt(computed.top) + _toInt(computed.marginTop);
								left = _toInt(computed.left) + _toInt(computed.marginLeft);
							}

							_css(wrapper, {
								  top:    top
								, left:   left
								, width:  target.offsetWidth
								, height: target.offsetHeight
								, position: 'absolute'
							});

							target.parentNode.appendChild(wrapper);
							flash.publish(wrapper, api.uid());
						}

						return	true;
					}
				},

				event: function (evt){
					var type = evt.type;

					if( type == 'ready' ){
						api.log('Flash.event.'+evt.type+':', evt);
						flash.ready();
						setTimeout(function (){ flash.mouseenter(evt); }, 50);
						return	true;
					}
					else if( type === 'ping' ){
						api.log('(flash -> js).ping:', [evt.status, evt.savedStatus], evt.error);
					}
					else if( type === 'log' ){
						api.log('(flash -> js).log:', evt.target);
					}
					else if( type in flash ) setTimeout(function (){
						api.log('Flash.event.'+evt.type+':', evt);
						flash[type](evt);
					}, 1);
				},

				mouseenter: function (evt){
					var node = flash.getInput(evt.flashId);
					if( node ){
						// Set multiple mode
						flash.cmd(evt, 'multiple', node.getAttribute('multiple') !== null);

						// Set files filter
						flash.cmd(evt, 'accept', (node.getAttribute('accept') || '*').replace(/\./g, ''));
					}
				},

				get: function (id){
					return	document[id] || window[id] || document.embeds[id];
				},

				getInput: function (id){
					var node = flash.get(id);

					if( /embed/i.test(node.nodeName) ){
						node = node.parentNode;
					}

					return node.parentNode.parentNode.getElementsByTagName('input')[0];
				},

				select: function (evt){
					var
						  inp = flash.getInput(evt.flashId)
						, uid = api.uid(inp)
						, files = evt.target.files
						, event
					;

					api.each(files, function (file){
						api.checkFileObj(file);
					});

					_files[uid] = files;

					if( document.createEvent ){
						event = document.createEvent('Event');
						event.initEvent ('change', true, false);
						inp.dispatchEvent(event)
					}
					else if( document.createEventObject ){
						event = document.createEventObject();
						inp.fireEvent('onchange', event)
					}
				},


				cmd: function (id, name, data, last){
					try {
						api.log('(js -> flash).'+name+':', data);
						return flash.get(id.flashId || id).cmd(name, data);
					} catch (e){
						api.log('(js -> flash).onError:', e);
						if( !last ){
							// try again
							setTimeout(function (){ flash.cmd(id, name, data, true); }, 50);
						}
					}
				},


				patch: function (){
					api.flashEngine =
					api.support.transform = true;

					// FileAPI
					_inherit(api, {
						getFiles: function (input, filter, callback){
							if( callback ){
								api.filterFiles(api.getFiles(input), filter, callback);
								return null;
							}


							var
								  files = api.isArray(input) ? input : _files[api.uid(input.target || input.srcElement || input)]
								, args  = arguments
							;



							if( !files ){
								// Файлов нету, вызываем родительский метод
								return	this.parent.apply(this, arguments);
							}


							if( filter ){
								filter	= api.getFilesFilter(filter);
								files	= api.filter(files, function (file){ return filter.test(file.name); });
							}

							return	files;
						},


						getInfo: function (file, fn){
							if( _isHtmlFile(file) ){
								this.parent.apply(this, arguments);
							}
							else if( file.info ){
								fn(false, file.info);
							}
							else {
								flash.cmd(file, 'getFileInfo', {
									  id: file.id
									, callback: _wrap(function _(err, info){
										_unwrap(_);
										fn(err, file.info = info);
									})
								});
							}
						}
					});


					// FileAPI.Image
					api.support.transform = true;
					_inherit(FileAPI.Image.prototype, {
						_load: function (file, fn){
							if( _isHtmlFile(file) ){
								this.parent.apply(this, arguments);
							}
							else {
								api.log('_load:', file);

								var _this = this;
								api.getInfo(file, function (err, info){
									fn.call(_this, err, file);
								});
							}
						},

						_apply: function (file, fn){
							if( _isHtmlFile(file) ){
								this.parent.apply(this, arguments);
							}
							else {
								api.log('_apply:', file);

								flash.cmd(file, 'imageTransform', {
									  id: file.id
									, matrix: this.getMatrix(file.info)
									, callback: _wrap(function _(err, dataURL){
										_unwrap(_);

										if( err ){
											fn(err);
										}
										else {
											var image = new Image;
											image.src = 'data:'+ file.type +';base64,'+ dataURL;

											fn(false, image);
										}
									})
								});
							}
						},

						toData: function (fn){
							var data = this.data;

							if( _isHtmlFile(data) ){
								this.parent.apply(this, arguments);
							}
							else {
								fn.call(this, !data.info, {
									  id:		data.id
									, name:		data.name
									, type:		data.type
									, flashId:	data.flashId
									, matrix:	this.getMatrix(data.info)
								});
							}
						}
					});


					// FileAPI.Form
					_inherit(api.Form.prototype, {
						toData: function (fn){
							var items = this.items, i = items.length;

							for( ; i--; ){
								if( items[i].file && _isHtmlFile(items[i].blob) ){
									return this.parent.apply(this, arguments);
								}
							}

							api.log('flash.Form.toData');
							fn(items);
						}
					});


					// FileAPI.XHR
					_inherit(api.XHR.prototype, {
						_send: function (options, formData){
							if(
								   formData.nodeName
								|| formData.append && api.support.html5
								|| api.isArray(formData) && (typeof formData[0] === 'string')
							){
								// HTML5, Multipart or IFrame
								return	this.parent.apply(this, arguments);
							}


							var
								  data = {}
								, files = {}
								, _this = this
								, flashId
								, fileId
							;

							api.each(formData, function (item){
								if( item.file ){
									files[item.name] = item = item.blob;
									fileId  = item.id;
									flashId = item.flashId;
								}
								else {
									data[item.name] = item.blob;
								}
							});

							api.log('flash.XHR._send:', flashId, fileId, files);

							this.xhr = {
								headers: {},
								abort: function (){ flash.cmd(flashId, 'abort', fileId); },
								getResponseHeader: function (name){ return this.headers[name]; },
								getAllResponseHeaders: function (){ return this.headers; }
							};


							flash.cmd(flashId, 'upload', {
								  url: _getUrl(options.url)
								, data: data
								, files: files
								, headers: options.headers
								, callback: _wrap(function upload(evt){
									var type = evt.type, result = evt.result;

									api.log('flash.upload.'+type+':', evt);

									if( type == 'progress' ){
										evt.lengthComputable = true;
										options.progress(evt);
									}
									else if( type == 'complete' ){
										_unwrap(upload);

										if( typeof result == 'string' ){
											_this.responseText	= result.replace(/%22/g, "\"").replace(/%5c/g, "\\").replace(/%26/g, "&").replace(/%25/g, "%");
										}

										_this.end(evt.status);
									}
									else if( type == 'abort' || type == 'error' ){
										this.end(0, evt.message);
										_unwrap(upload);
									}
								})
							});
						}
					});
				}
			}
		;


		function _css(el, css){
			if( el && el.style ){
				var key, val;
				for( key in css ){
					val = css[key];
					if( typeof val == 'number' ) val += 'px';
					try { el.style[key] = val; } catch (e) {}
				}
			}
		}


		function _inherit(obj, methods){
			api.each(methods, function (fn, name){
				var prev = obj[name];
				obj[name] = function (){
					this.parent = prev;
					return fn.apply(this, arguments);
				};
			});
		}

		function _isHtmlFile(file){
			return	file && !file.flashId;
		}

		function _wrap(fn){
			var id = fn.wid = api.uid();
			flash._fn[id] = fn;
			return	'FileAPI.Flash._fn.'+id;
		}


		function _unwrap(fn){
			delete	flash._fn[fn.wid];
		}


		function _getUrl(url){
			var a  = document.createElement('a');
			a.href = url;
			return a.href;
		}


		// @export
		api.Flash = flash;
		flash.init();
	})();
})(FileAPI, this, document);
