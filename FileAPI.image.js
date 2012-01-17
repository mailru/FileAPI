(function (api, document){
	var
		min = Math.min,

		support = !!(function(){
					var canvas = document.createElement('Canvas'), support = canvas.getContext && ~canvas.toDataURL("image/png").indexOf("data:image/png");
					canvas = null;
					return support;
				})(),

		notSupport = support ? false : function (img){ return img; }
	;

	api.extend({

		canvas: support,

		rotate: notSupport || function (img, deg){
			var width = img.width, height = img.height;

			return  Canvas(!(deg % 180) ? width : height, (deg % 180) ? width : height)
						.rotate(deg)
						.draw(img, (deg == 180 || deg == 270 ? -width : 0), (deg == 90 || deg == 180 ? -height : 0), width, height)
						.ok()
					;
		},

		crop: notSupport || function (img, x, y, w, h){
			return  Canvas(w, h).draw(img, x, y, w, h, 0, 0, w, h).ok();
		},

		resize: notSupport || function (img, width, height){
			return  Canvas(width, height).draw(img, 0, 0, width, height).ok();
		},

		resizeByMax: notSupport || function (img, width, height){
			if( !height ) height = width;

			var
				  srcW = img.width
				, srcH = img.height
				, srcF = srcW / srcH
				, dstF = width / height
			;

			if( srcF >= dstF ){
				width   = min(srcW, width);
				height  = width / srcF;
			} else {
				height  = min(srcH, height);
				width   = height * srcF;
			}

			return  Canvas(width, height).draw(img).ok();
		}

	});


	// @private
	function Canvas(w, h){
		if( !(this instanceof Canvas) ) return new Canvas(w, h);
		this.canvas = document.createElement('canvas');
		this.ctx    = this.canvas.getContext('2d');
		this.width  = this.canvas.width = w;
		this.height = this.canvas.height = h;
	}
	Canvas.prototype = {
		constructor: Canvas,

		draw: function (img, sx, sy, sw, sh, dx, dy, dw, dh){
			var width = this.width, height = this.height;
			if( typeof dx !== 'undefined' )
				this.ctx.drawImage(img, sx||0, sy||0, sw||width, sh||height, dx||0, dy||0, dw||width, dh||height);
			else
				this.ctx.drawImage(img, sx||0, sy||0, sw||width, sh||height);
			return  this;
		},

		rotate: function (deg){
			this.ctx.rotate(deg * Math.PI / 180);
			return  this;
		},

		ok: function (){
			this.ctx = null;
			return  this.canvas;
		}
	};
})(FileAPI, document);
