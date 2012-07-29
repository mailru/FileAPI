(function (api, document, undef){
	'use strict';

	var
		min = Math.min,
		round = Math.round,
		support = !!(function(){
					var canvas = document.createElement('canvas'), support = canvas.toDataURL && ~canvas.toDataURL("image/png").indexOf("data:image/png");
					canvas = null;
					return support;
				})()
	;


	function Image(data){
		if( !(this instanceof Image) ){
			return	new Image(data);
		}

		this.setData(data);

		this.trans	= {
			sx: 0,
			sy: 0,
			sw: 0,
			sh: 0,
			dx: 0,
			dy: 0,
			dw: 0,
			dh: 0,
			resize: 0, // min, max OR preview
			deg: 0
		};
	}
	Image.support = support;
	Image.prototype = {
		constructor: Image,

		set: function (attrs){
			api.extend(this.trans, attrs);
			return	this;
		},

		setData: function (data){
			this.data = data;
			return	this;
		},

		crop: function (x, y, w, h){
			if( w === undef ){
				w	= x;
				h	= y;
				x = y = 0;
			}
			return	this.set({ sx: x, sy: y, sw: w, sh: h });
		},

		resize: function (w, h, type){
			if( typeof h !== 'number' ){
				type = type || h;
				h = w;
			}

			return	this.set({ dw: w, dh: h, resize: type });
		},

		preview: function (w, h){
			return	this.set({ dw: w, dh: h || w, resize: 'preview' });
		},

		rotate: function (deg){
			return	this.set({ deg: deg });
		},

		_load: function (image, fn){
			var self = this;
			api.readAsImage(image, function (evt){
				fn.call(self, evt.type != 'load', evt.result);
			});
		},

		_trans: function (image, fn){
			var
				  canvas = document.createElement('canvas')
				, t = this.transform(image)
				, ctx = canvas.getContext('2d')
				, deg = t.deg
				, dw = t.dw
				, dh = t.dh
			;

			canvas.width  = !(deg % 180) ? dw : dh;
			canvas.height =  (deg % 180) ? dw : dh;

			ctx.rotate(deg * Math.PI / 180);
			ctx.drawImage(image, t.sx, t.sy, t.sw, t.sh, (deg == 180 || deg == 270 ? -dw : 0), (deg == 90 || deg == 180 ? -dh : 0), dw, dh);

			fn.call(this, false, canvas);
		},

		transform: function (image){
			var
				  t  = api.extend({}, this.trans)
				, sw = t.sw = t.sw || image.width
				, sh = t.sh = t.sh || image.height
				, dw = t.dw = t.dw || t.sw
				, dh = t.dh = t.dh || t.sh
				, sf = sw/sh, df = dw/dh
				, type = t.resize
			;

			if( type == 'preview' ){
				if( dw != sw || dh != sh ){
					// Make preview
					var w, h;

					if( df >= sf ){
						w	= sw;
						h	= w / df;
					} else {
						h	= sh;
						w	= h * df;
					}

					if( w != sw || h != sh ){
						t.sx	= ~~((sw - w)/2);
						t.sy	= ~~((sh - h)/2);
						sw		= w;
						sh		= h;
					}
				}
			}
			else if( type ){
				if( type == 'min' ){
					dw = round(sf < df ? min(sw, dw) : dh*sf);
					dh = round(sf < df ? dw/sf : min(sh, dh));
				}
				else {
					dw = round(sf >= df ? min(sw, dw) : dh*sf);
					dh = round(sf >= df ? dw/sf : min(sh, dh));
				}
			}

			t.sw = sw;
			t.sh = sh;
			t.dw = dw;
			t.dh = dh;

			return	t;
		},

		get: function (fn){
			if( Image.support ){
				this._load(this.data, function (err, image){
					if( err ){
						fn(err);
					}
					else {
						this._trans(image, fn);
					}
				});
			}
			else {
				fn('not_support');
			}
		},

		toData: function (fn){
			this.get(fn);
		}

	};


	Image.transform = function (file, transform, fn){
		api.getFileInfo(file, function (evt){
			var
				  images = {}
				, img = evt.result
				, queue = api.queue(function (err){
					fn(err, images);
				})
			;

			if( evt.type == 'load' ){
				api.each(transform, function (params, name){
					if( !queue.isFail() ){
						var Trans = Image(img);

						if( typeof params == 'function' ){
							params(img, Trans);
						}
						else if( params.width ){
							Trans[params.preview ? 'preview' : 'resize'](params.width, params.height, params.type);
						}
						else {
							if( params.maxWidth && (img.width > params.maxWidth || img.height > params.maxHeight) ){
								Trans.resize(params.maxWidth, params.maxHeight, 'max');
							}
							else if( params.minWidth && (img.width < params.minWidth || img.height < params.minHeight) ){
								Trans.resize(params.minWidth, params.minHeight, 'min');
							}
						}


						queue.inc();
						Trans.toData(function (err, image){
							if( err ){
								queue.fail();
							}
							else {
								images[name] = image;
								queue.next();
							}
						});
					}
				});
			}
			else {
				queue.fail();
			}
		});
	};


	// @export
	api.support.transform = support;
	api.Image = Image;
})(FileAPI, document);
