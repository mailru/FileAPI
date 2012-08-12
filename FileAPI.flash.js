(function (api, window, document, undef){
	api.support.flash = 1 && (function (){
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



	if( api.support.flash ) (function (){
		var
			  _retry = 0
			, _files = {}
			, _input
			, _mime	= {     // default extensions by mime
				  'image':	'png|jpg|jpeg|bmp|gif|ico|tif|tiff|tga|pcx|cbz|cbr'
				, 'audio':	'm4a|flac|aac|rm|mpa|wav|wma|ogg|mp3|mp2|m3u|mod|amf|dmf|dsm|far|gdm|imf|it|m15|med|okt|s3m|stm|sfx|ult|uni|xm|sid|ac3|dts|cue|aif|aiff|wpl|ape|mac|mpc|mpp|shn|wv|nsf|spc|gym|adplug|adx|dsp|adp|ymf|ast|afc|hps|xsp'
				, 'video':	'm4v|3gp|nsv|ts|ty|strm|rm|rmvb|m3u|ifo|mov|qt|divx|xvid|bivx|vob|nrg|img|iso|pva|wmv|asf|asx|ogm|m2v|avi|bin|dat|dvr-ms|mpg|mpeg|mp4|mkv|avc|vp3|svq3|nuv|viv|dv|fli|flv|wpl'
			}
			, _rmime = {}


			, flash = {
				_fn: {},

				init: function (){
					var wrapper = document.getElementById('__FileAPI__');
					if( wrapper ){
						flash.publish(flash.wrapper = wrapper);
					}
					else if( _retry < 10 ){
						setTimeout(flash.init, ++_retry*50);
					}
				},

				publish: function (el){
					var vars = { id: api.expando, src: './FileAPI.flash.swf', flashVars: 'callback=FileAPI.Flash.event' };

					el.innerHTML = ('<object id="#id#" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%">'
									+ '<param name="movie" value="#src#" />'
									+ '<param name="flashvars" value="#flashVars#" />'
									+ '<param name="swliveconnect" value="true" />'
									+ '<param name="allowScriptAccess" value="always" />'
									+ '<param name="wmode" value="transparent" />'
									+ '<param name="menu" value="false" />'
									+ '<embed flashvars="#flashVars#" swliveconnect="true" allowScriptAccess="always" name="#id#" src="#src#"  width="100%" height="100%" menu="false" wmode="transparent" type="application/x-shockwave-flash"></embed>'
									+ '</object>').replace(/#(\w+)#/ig, function (a, name){ return vars[name]; })
								;
				},

				ready: function (){
					flash.ready = api.F;
					flash.patch();

					api.each(_mime, function (val, key){ _rmime[key] = new RegExp('('+val+')$', 'i'); });
					api.event.on(document, 'mouseover', flash.mouseover);
					api.event.on(document, 'mousedown', function (evt){
						if( flash.mouseover(evt) ){
							evt.preventDefault
								? evt.preventDefault()
								: (evt.returnValue = true)
							;
						}
					});
				},

				mouseover: function (evt){
					evt = api.event.fix(window.event || evt);
					var target = evt.target;

					if( /input/i.test(target.nodeName) && target.type == 'file' ){
						target.parentNode.insertBefore(flash.wrapper, target);
						_input = target;
						_css(flash.wrapper, {
							  width: target.offsetWidth
							, height: target.offsetHeight
							, top: target.offsetTop
						});
						return	true;
					}
					else if( target.name != api.expando ){
						flash.mouseout();
					}
				},

				mouseout: function (){
					if( flash.wrapper.parentNode !== document.body ){
						document.body.appendChild(flash.wrapper);
						_css(flash.wrapper, {
							  top:		0
							, left:		0
							, width:	1
							, height:	1
						});
					}
				},

				event: function (evt){
					var type = evt.type;

					if( type == 'ready' ){
						console.log('Flash.ready');
						setTimeout(flash[type], 30);
						return	true;
					}
					else if( type in flash ){
						console.log(evt);
						flash[type](evt.target);
					}
				},

				select: function (data){
					var uid = api.uid(_input), event;

					api.each(data.files, function (file){
						api.each(_rmime, function (regexp, type){
							if( regexp.test(file.type) ){
								file.type	= type +'/'+ file.type;
							}
						});
					});

					_files[uid] = data.files;

					if( document.createEvent ){
						event = document.createEvent('Event');
						event.initEvent ('change', true, false);
						_input.dispatchEvent(event)
					}
					else if( document.createEventObject ){
						event = document.createEventObject();
						_input.fireEvent('onchange', event)
					}
				},


				cmd: function (name, data){
					var id = api.expando, engine = document[id] || window[id] || document.embeds[id];
					try {
						return engine.cmd(name, data);
					} catch (e){ }
				},


				patch: function (){
					// FileAPI
					api.extend(api, {
						getFiles: function (input){
							var
								  files = api.isArray(input) ? input : _files[api.uid(input.target || input.srcElement || input)]
								, args  = arguments
							;

							if( args.length == 3 ){
								args[0] = files;
								api.filterFiles.apply(api, args);
							}
							else {
								return	files;
							}
						},

						getFileInfo: function (file, fn){
							// @todo
							fn(false);
						}
					});


					// FileAPI.Image
					api.extend(FileAPI.Image.prototype, {
						_load: function (file, fn){
							var _this = this;
							if( _this.trans.resize == 'preview' ){
								api.getFileInfo(file, function (info){
									if( info ){
										api.extend(file, info);
									}
									fn.call(_this, false, file);
								});
							}
							else {
								fn.call(_this, 'flash_resize_not_support');
							}
						},

						_trans: function (file, fn){
							flash.cmd('setResize', {
								  type: 'preview'
								, enable: true
								, resizeSize: this.trans.dw
							});

							flash.cmd('loadAsDataURL', {
								  id: file.uid
								, callback: _wrap(function load(evt){
									if( evt.type == 'load' ){
										if( evt.target.type ) file.type = evt.target.type;
										var image = new Image;
										image.src = 'data:'+file.type+';base64,'+evt.target.result;
										fn(true, image);
										_unwrap(load);
									}
									else if( evt.type == 'error' ){
										fn('flash_resize_error');
										_unwrap(load);
									}
								})
							});
						}
					});


					// FileAPI.Form
					api.extend(api.Form.prototype, {
						toData: function (fn){
							console.log('flash.Form.toData');
							fn(this._items);
						}
					});


					// FileAPI.XHR
					api.extend(api.XHR.prototype, {
						_sendData: function (options, formData){
							var data = {}, uid, file, _this = this;

							api.each(formData, function (item){
								if( item.file ){
									uid  = item.blob.uid;
									file = item;
								}
								else {
									data[item.name] = item.blob;
								}
							});

							console.log('flash._sendData:', file, data);

							this.xhr = {
								headers: {},
								abort: function (){ flash.cmd('abort', { id: uid }); },
								getResponseHeader: function (name){ return this.headers[name]; },
								getAllResponseHeaders: function (){ return this.headers; }
							};


							flash.cmd('upload', {
								  id: uid
								, url: options.url
								, name: file.name
								, data: data
								, headers: options.headers
								, callback: _wrap(function upload(evt){
									console.log(evt);

									var type = evt.type, target = evt.target;
									if( type == 'progress' ){
										evt.lengthComputable = true;
										options.progress(evt);
									}
									else if( type == 'error' || type == 'upload' ){
										_unwrap(upload);
										_this.xhr.headers	= evt.headers || {};
										_this.responseText	= target && String(target.result).replace(/%22/g, "\"").replace(/%5c/g, "\\").replace(/%26/g, "&").replace(/%25/g, "%");
										_this.end(type == 'error' ? 500 : 200);
									}
									else if( type == 'abort' ){
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
					el.style[key] = val;
				}
			}
		}


		function _wrap(fn){
			var id = api.uid();
			fn.uid = id;
			flash._fn[id] = fn;
			return	'FileAPI.Flash._fn.'+id;
		}


		function _unwrap(fn){
			delete	flash._fn[fn.uid];
		}


		// @export
		api.Flash = flash;
		flash.init();
	})();
})(FileAPI, this, document);
