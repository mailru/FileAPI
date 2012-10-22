(function (api, window, document){
	var
		encode = window.encodeURIComponent,
		FormData = window.FormData,
		Form = function (){
			this.items = [];
		}
	;


	Form.prototype = {

		append: function (name, blob, file, type){
			this.items.push({
				  name: name
				, blob: blob && blob.blob || blob
				, file: file || blob.name
				, type:	type || blob.type
			});
		},

		each: function (fn){
			var i = 0, n = this.items.length;
			for( ; i < n; i++ ){
				fn.call(this, this.items[i]);
			}
		},

		toData: function (fn){
			if( !api.support.html5 ){
				api.log('tFileAPI.Form.toHtmlData');
				this.toHtmlData(fn);
			}
			else if( this.multipart ){
				api.log('FileAPI.Form.toMultipartData');
				this.toMultipartData(fn);
			}
			else {
				api.log('FileAPI.Form.toFormData');
				this.toFormData(fn);
			}
		},

		_to: function (data, complete, next, arg){
			var queue = api.queue(function (){
				complete(data);
			});

			this.each(function (file){
				next(file, data, queue, arg);
			});

			queue.check();
		},


		toHtmlData: function (fn){
			this._to(document.createDocumentFragment(), fn, function (file, data/**DocumentFragment*/){
				var blob = file.blob, hidden;

				if( file.file ){
					api.reset(blob);
					// set new name
					blob.name = file.name;
					data.appendChild(blob);
				}
				else {
					hidden = document.createElement('input');
					hidden.name  = file.name;
					hidden.type  = 'hidden';
					hidden.value = blob;
					data.appendChild(hidden);
				}
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
			this._to([], fn, function (file, data, queue, boundary){
				data.push(
					  '--_' + boundary + ('\r\nContent-Disposition: form-data; name="'+ file.name +'"'+ (file.file ? '; filename="'+ encode(file.file) +'"' : '')
					+ (file.file ? '\r\nContent-Type: '+ (file.type || 'application/octet-stream') : '')
					+ '\r\n'
					+ '\r\n'+ (file.file ? file.blob : encode(file.blob))
					+ '\r\n')
				);
			}, api.expando);
		}
	};


	// @export
	api.Form = Form;
})(FileAPI, window, document);
