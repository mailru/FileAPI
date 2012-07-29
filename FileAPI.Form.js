(function (api, window, document, undef){
	var
		encode = window.encodeURIComponent,
		FormData = window.FormData,
		Form = function (){
			this._items = [];
			this.size	= 0;
		}
	;


	Form.prototype = {

		append: function (name, blob, file, type){
			this._items.push({
				  name: name
				, blob: blob
				, file: file || blob.name
				, type:	type || blob.type
			});
		},

		each: function (fn){
			var i = 0, n = this._items.length;
			for( ; i < n; i++ ){
				fn.call(this, this._items[i]);
			}
		},

		toData: function (fn){
			if( !api.support.html5 ){
				console.log('toHtmlData')
				this.toHtmlData(fn);
			}
			else if( this.multipart ){
				console.log('toMultipartData')
				this.toMultipartData(fn);
			}
			else {
				console.log('toFormData')
				this.toFormData(fn);
			}
		},

		_to: function (data, complete, arg, next){
			var queue = api.queue(function (){
				complete(data);
			});

			if( next === undef ){
				next = arg;
				arg  = undef;
			}

			this.each(function (file){
				next(file, data, queue, arg);
			});

			queue.check();
		},


		toHtmlData: function (fn){
			this._to(document.createDocumentFragment(), fn, function (file){
				api.reset(file.blob);
				data.appendChild(file.blob);
			});
		},


		toFormData: function (fn){
			this._to(new FormData, fn, function (file, data, queue){
				if( file.file ){
					data.append('_'+file.name, file.file);
				}

				if( file.blob.toBlob ){
					queue.inc();
					file.blob.toBlob(function (blob){
						data.append(file.name, blob, file.file);
						queue.next();
					}, 'image/png');
				}
				else if( file.file ){
					data.append(file.name, file.blob, file.file);
				}
				else {
					data.append(file.name, file.blob);
				}
			});
		},


		toMultipartData: function (fn){
			this._to([], fn, api.expando, function (file, data, queue, boundary){
				data.push(
					  '--_' + boundary + ('\r\nContent-Disposition: form-data; name="'+ file.name +'"'+ (file.file ? '; filename="'+ encode(file.file) +'"' : '')
					+ (file.file ? '\r\nContent-Type: '+ (file.type || 'application/octet-stream') : '')
					+ '\r\n'
					+ '\r\n'+ (file.file ? file.blob : encode(file.blob))
					+ '\r\n')
				);
			});
		}
	};


	// @export
	api.Form = Form;
})(FileAPI, this, document);
