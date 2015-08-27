module('FileAPI');

(function (){
	if( !Function.prototype.bind ){
		Function.prototype.bind = function (ctx){
			if( !ctx ) {
				return this;
			}
			var fn = this;
			return function (){
				return fn.apply(ctx, arguments);
			};
		};
	}


	var controllerUrl = 'http://127.0.0.1:8000/upload';
	var uploadForm = document.forms.upload;
	var base64_1px_gif = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
	var browser = (navigator.userAgent.match(/(phantomjs|safari|firefox|chrome)/i) || ['', 'chrome'])[1].toLowerCase();

	QUnit.config.autostart = browser == 'phantomjs';




	FileAPI.event.on(startBtn, 'click', function (){
		QUnit.start();
	});


	function checkFile(file, name, type, size){
		equal(file.name, name, 'name');
		equal(file.type, type, 'type');
		equal(file.size, size, 'size');
	}


	function loadImage(src, fn){
		if( src.file ){
			fn(src.file);
		}
		else {
			var img = document.createElement('img');
			img.onload = function (){
				fn(img);
			};
			img.src = src;
		}
	}


	function toCanvas(img){
		var canvas = document.createElement('canvas');
		if( img ){
			canvas.width = img.width || img.videoWidth;
			canvas.height = img.height || img.videoHeight;
			var ctx = canvas.getContext('2d');
			try {
				ctx.drawImage(img, 0, 0);
			} catch (err){
				console.log(err.toString());
				console.log(err.stack);
			}
		}
		return	canvas;
	}


	function imageEqual(left, right, text, callback, delta){
		loadImage(left, function (left){
			left.setAttribute('style', 'border: 2px solid red; padding: 2px;');
			document.body.appendChild(left.cloneNode());

			loadImage(right, function (right){
				right.setAttribute('style', 'border: 2px solid blue; padding: 2px;');
				document.body.appendChild(right);

				left = toCanvas(left);
				right = toCanvas(right);

				if( left.width != right.width ){
					ok(false, text + ' (width: '+left.width+' != '+right.width+')');
				}
				else if( left.height != right.height ){
					ok(false, text + ' (height: '+left.height+' != '+right.height+')');
				}
				else {
					var state = true, pixels = 0, failPixels = 0;
					var leftData = left.getContext('2d').getImageData(0, 0, left.width, left.height);
					var rightData = right.getContext('2d').getImageData(0, 0, left.width, left.height);

					check: for( var y = 0; y < leftData.height; y++ ){
						for( var x = 0; x < leftData.width; x++ ){
							var idx = (x + y * leftData.width) * 4;
							pixels++;
							if( !pixelEqual(leftData.data, rightData.data, idx) ){
								failPixels++;
	//							break check;
							}
						}
					}

					ok(failPixels/pixels < (delta || .01), text + ' (fail pixels: '+ (failPixels/pixels) +')');
				}

				callback();
			});
		});
	}


	function pixelEqual(left, right, idx){
		var dt = 3;
		return	(Math.abs(left[idx] - right[idx]) < dt) && (Math.abs(left[idx+1] - right[idx+1]) < dt) && (Math.abs(left[idx+2] - right[idx+2]) < dt);
	}


	function _checkProgressEvent(evt){
		var fail = false;

		if( isNaN(evt.loaded / evt.total) ){
			fail = true;
			ok(false, "progress: evt.loaded/evt.total - is NaN");
		}

		if( isNaN(evt.loaded) ){
			fail = true;
			ok(false, "progress: evt.loaded - is NaN");
		}

		if( isNaN(evt.total) ){
			fail = true;
			ok(false, "progress: evt.total - is NaN");
		}

		return fail;
	}

	console.log('\nStart testing\n');

	test('1px.gif', function (){
		var file = FileAPI.getFiles(uploadForm['1px_gif'])[0];

		// File
		checkFile(file, '1px.gif', 'image/gif', 34);

		// File info
		stop();
		FileAPI.getInfo(file, function (err, info){
			start();
			ok(!err);
			equal(info.width, 1, 'getInfo.width');
			equal(info.height, 1, 'getInfo.height');
		});


		if( FileAPI.html5 ){
			// Read as data
			stop();
			FileAPI.readAsDataURL(file, function (evt){
				if( evt.type == 'load' ){
					start();
					equal(evt.result, 'data:image/gif;base64,'+base64_1px_gif, 'dataURL');
				}
			});

			// Read as binaryString
			stop();
			FileAPI.readAsBinaryString(file, function (evt){
				if( evt.type == 'load' ){
					start();
					equal(evt.result, FileAPI.toBinaryString(base64_1px_gif), 'dataURL');
				}
			});

			// Read as image
			stop();
			FileAPI.readAsImage(file, function (evt){
				if( evt.type == 'load' ){
					start();
					equal(evt.result.width, 1, 'readAsImage.width');
					equal(evt.result.height, 1, 'readAsImage.height');
				}
			});
		}
	});

    test('big.jpg', function (){
        console.log('Entering big.jpg');
   		var file	= FileAPI.getFiles(uploadForm['big.jpg'])[0];

   		// File
        console.log('[big.jpg] before check file');
   		checkFile(file, 'big.jpg', 'image/jpeg', 71674475);
        console.log('[big.jpg] after check file');

   		// File info
   		stop();
        console.log('[big.jpg] before getInfo');
   		FileAPI.getInfo(file, function (err, info){
            console.log('[big.jpg] after getInfo');
   			start();
   			ok(!err);
   			equal(info.width, 10000, 'getInfo.width');
   			equal(info.height, 10000, 'getInfo.height');
   		});

        stop();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: file },
			imageTransform: {
				width: 1024,
				height: 768,
				type: 'image/jpeg'
			},
			complete: function (err, res){
				start();
			}
		});
   	});

	test('hello.txt', function (){
		var file	= FileAPI.getFiles(uploadForm['hello.txt'])[0];

		checkFile(file, 'hello.txt', 'text/plain', 15);

		if( FileAPI.html5 ){
			stop();
			FileAPI.readAsText(file, function (evt){
				if( evt.type == 'load' ){
					start();
					equal(evt.result, 'Hello FileAPI!\n');
				}
			});
		}
	});

	test('image.jpg', function (){
		var file	= FileAPI.getFiles(uploadForm['image.jpg'])[0];

		checkFile(file, 'image.jpg', 'image/jpeg', 108338);

		// Check exif
		stop();
		FileAPI.getInfo(file, function (err, info){
			start();
			equal(info.width, 632, 'width');
			equal(info.height, 448, 'height');
			equal(info.exif.Orientation, 6, 'Orientation');

			if( FileAPI.html5 && FileAPI.support.html5 ){
				equal(info.exif.Artist, 'FileAPI');
				equal(info.exif.Copyright, 'BSD');
			}
		});
	});

	test('filterFiles', function (){
		var files	= FileAPI.getFiles(uploadForm['multiple']);

		// Filer files
		stop();
		FileAPI.filterFiles(files, function (file, info){
			if( /^image/.test(file.type) ){
				return	file.type == 'image/png';
			}
			else {
				return	file.size > 128;
			}
		}, function (files, ignor){
			start();
			equal(files.length, 2, 'files');
			equal(ignor.length, 3, 'ignor');
		})
	});

	test('upload without files', function (){
		stop();

		FileAPI.upload({
			url: controllerUrl,
			data: { str: 'foo', num: 1, array: [1, 2, 3], object: { foo: 'bar' } },
			headers: { 'x-foo': 'bar' },
			complete: function (err, xhr){
				var res = err ? {} : FileAPI.parseJSON(xhr.responseText).data._REQUEST;
				var headers = err ? err : FileAPI.parseJSON(xhr.responseText).data.HEADERS;

				start();
				ok(!err, 'upload done');
				equal(res.str, 'foo', 'string');
				equal(res.num, '1', 'number');
				equal(headers['x-foo'], 'bar', 'headers.x-foo');

				if( !FileAPI.html5 || !FileAPI.support.html5 ){
					deepEqual(res.array, { "0": '1', "1": '2', "2": '3' }, 'array');
				}
				else {
					deepEqual(res.array, ['1', '2', '3'], 'array');
				}

				deepEqual(res.object, { foo: 'bar' }, 'object');
			}
		})
	});

	test('upload input', function (){
		var rnd = Math.random();
		expect(15);

		stop();
		FileAPI.upload({
			url: controllerUrl,
			data: { foo: 'bar' },
			headers: { 'x-foo': 'bar', 'x-rnd': rnd },
			files: uploadForm['1px_gif'],
			upload: function (){
				ok(true, 'upload event');
			},
			prepare: function (file, options){
				options.data.bar = 'qux';
			},
			fileupload: function (file/**Object*/, xhr/**Object*/, options/**Object*/){
				equal(file.name, '1px.gif', 'name');
				equal(options.data.foo, 'bar', 'data.foo');
				equal(options.data.bar, 'qux', 'data.qux');
			},
			filecomplete: function (err, xhr){
				var res = FileAPI.parseJSON(xhr.responseText);

				equal(res.data._REQUEST.foo, 'bar');
				equal(res.data._REQUEST.bar, 'qux');
				equal(res.data.HEADERS['x-foo'], 'bar', 'headers.x-foo');
				equal(res.data.HEADERS['x-rnd'], rnd, 'headers.x-rnd');

				if( res.data._FILES['1px_gif'] ){
					var type = res.data._FILES['1px_gif'].type;
					equal(res.data._FILES['1px_gif'].name, '1px.gif', 'file.name');
					equal(type, /application/.test(type) ? 'application/octet-stream' : 'image/gif', 'file.type');
				} else {
					ok(false, "res.data._FILES['1px_gif'] not found");
				}

				if( res.images['1px_gif'] ){
					equal(res.images['1px_gif'].dataURL, 'data:image/gif;base64,' + base64_1px_gif, 'dataURL');
					equal(res.images['1px_gif'].mime, 'image/gif', 'mime');
					equal(res.images['1px_gif'].width, 1, 'width');
					equal(res.images['1px_gif'].height, 1, 'height');
				} else {
					ok(false, "res.images['1px_gif'] not found");
				}
			},
			complete: function (err, xhr){
				ok(true, 'complete event');
				start();
			}
		});
	});

	test('upload file', function (){
		var _progressFail = false, _progress = 0;
		stop();

		FileAPI.upload({
			url: controllerUrl,
			files: { text: FileAPI.getFiles(uploadForm['hello.txt']) },
			progress: function (evt){
				_progressFail = _progressFail || _checkProgressEvent(evt);
				if( !_progressFail && (_progress >= evt.loaded) ){
					_progressFail = true;
					ok(false, 'progress evt.loaded: '+_progress+' -> '+evt.loaded);
				}
				_progress = evt.loaded;
			},
			complete: function (err, res){
				start();
				var res = FileAPI.parseJSON(res.responseText).data._FILES['text'];
				equal(res.name, 'hello.txt', 'file.name');
				equal(res.size, 15, 'file.size');
				equal(res.type, /application/.test(res.type) ? 'application/octet-stream' : 'text/plain', 'file.type');
			}
		});
	});

	test('multiupload', function (){
		stop();
		var
			  _start = 0
			, _complete = 0
			, _progress = 0
			, _progressFail = false
			, _files = {}
		;

		FileAPI.upload({
			url: controllerUrl,
			files: uploadForm['multiple'],
			fileupload: function (){
				_start++;
			},
			filecomplete: function (err, xhr){
				var file = FileAPI.parseJSON(xhr.responseText).data._FILES.multiple;
				_complete++;
				_files[file.name] = file;
			},
			progress: function (evt){
				_progressFail = _progressFail || _checkProgressEvent(evt);
				if( !_progressFail && (_progress >= evt.loaded) ){
					_progressFail = true;
					ok(false, 'progress evt.loaded: '+_progress+' -> '+evt.loaded);
				}
				_progress = evt.loaded;
			},
			complete: function (err, xhr){
				start();

				equal(_start, _complete, 'uploaded');

				checkFile(_files['1px.gif'], '1px.gif', 'image/gif', 34);
				checkFile(_files['dino.png'], 'dino.png', 'image/png', 461003);
				checkFile(_files['hello.txt'], 'hello.txt', 'text/plain', 15);
				checkFile(_files['image.jpg'], 'image.jpg', 'image/jpeg', 108338);
//				checkFile(_files['lebowski.json'], 'lebowski.json', 'application/json', 5392);
			}
		});
	});

	FileAPI.html5 && test('upload FileAPI.Image', function (){
		var file = FileAPI.getFiles(uploadForm['dino.png'])[0];
		var image = FileAPI.Image(file).rotate(90+360).preview(100);
		var _progressFail = false,
			_progress = 0,
			_fileprogress = 0,
			_filecomplete,
			_filecompleteErr
		;

		stop();
		FileAPI.upload({
			url: controllerUrl,
			headers: { 'x-foo': 'bar' },
			files: { image: image },
			progress: function (evt){
				_progressFail = _progressFail || _checkProgressEvent(evt);

				if( !_progressFail && (_progress >= evt.loaded) ){
					_progressFail = true;
					ok(false, 'progress evt.loaded: '+_progress+' -> '+evt.loaded);
				}
				_progress = evt.loaded;
			},
			fileprogress: function (evt) {
				if (_fileprogress < evt.loaded) {
					_fileprogress = evt.loaded;
				}
			},
			filecomplete: function (err, res){
				_filecomplete = res.responseText;
				_filecompleteErr = err;
			},
			complete: function (err, res){
				var json = FileAPI.parseJSON(res.responseText);

				ok(_progress > 0, 'progress event');
				ok(_fileprogress > 0, 'fileprogress event');

				equal(err, _filecompleteErr, 'filecomplete.err');
				equal(res.responseText, _filecomplete, 'filecomplete.response');

				equal(json.data.HEADERS['x-foo'], 'bar', 'x-foo');

				imageEqual(json.images.image.dataURL, 'files/samples/'+browser+'-dino-90deg-100x100.png?1', 'dino 90deg 100x100', function (){
					start();
				});
			}
		});
	});

	FileAPI.html5 && test('upload + imageTransform (min, max, preview)', function (){
		var file = FileAPI.getFiles(uploadForm['image.jpg'])[0];
		var queue = FileAPI.queue(start);

		stop();

		// strategy: 'min'
		queue.inc();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: file },
			imageTransform: { width: 100, height: 100, strategy: 'min' },
			complete: function (err, res){
				queue.next();
				var res = FileAPI.parseJSON(res.responseText);
				equal(res.images['image'].width, 141, 'min.width');
				equal(res.images['image'].height, 100, 'min.height');
			}
		});

		// strategy: 'max'
		queue.inc();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: file },
			imageTransform: { width: 100, height: 100, strategy: 'max' },
			complete: function (err, res){
				queue.next();
				var res = FileAPI.parseJSON(res.responseText);
				equal(res.images['image'].width, 100, 'max.width');
				equal(res.images['image'].height, 71, 'max.height');
			}
		});

		// strategy: 'height'
		queue.inc();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: file },
			imageTransform: { width: 100, height: 100, strategy: 'height' },
			complete: function (err, res){
				queue.next();
				var res = FileAPI.parseJSON(res.responseText);
				equal(res.images['image'].width,  141, 'height.width');
				equal(res.images['image'].height, 100, 'height.height');
			}
		});

		// strategy: 'width'
		queue.inc();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: file },
			imageTransform: { width: 100, height: 100, strategy: 'width' },
			complete: function (err, res){
				queue.next();
				var res = FileAPI.parseJSON(res.responseText);
				equal(res.images['image'].width, 100, 'width.width');
				equal(res.images['image'].height, 70, 'width.height');
			}
		});

		// preview
		queue.inc();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: file },
			imageTransform: { width: 100, height: 100, rotate: 'auto', preview: true },
			complete: function (err, res){
				var res = FileAPI.parseJSON(res.responseText);

				imageEqual(res.images.image.dataURL, 'files/samples/'+browser+'-image-auto-100x100.jpeg', 'image auto 100x100.png', function (){
					queue.next();
				});
			}
		});
	});

	test('upload + autoOrientation', function (){
		var file = FileAPI.getFiles(uploadForm['image.jpg'])[0];
		var queue = FileAPI.queue(start);
		var check = function (err, res){
			var res = FileAPI.parseJSON(res.responseText);
			equal(res.images.image.width, 448, this+'.width');
			equal(res.images.image.height, 632, this+'.height');
			queue.next();
		};

		stop();

		queue.inc();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: file },
			imageAutoOrientation: true,
			complete: check.bind('imageAutoOrientation')
		});

		queue.inc();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: file },
			imageTransform: { rotate: 'auto' },
			complete: check.bind('imageTransform.rotate.auto')
		});

		queue.inc();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: FileAPI.Image(file).rotate('auto') },
			complete: check.bind('FileAPI.Image.fn.rotate.auto')
		});
	});

	FileAPI.html5 && test('upload + CamanJS', function (){
		stop();
		FileAPI.Image(FileAPI.getFiles(uploadForm['dino.png'])[0])
			.preview(50, 30)
			.filter('vintage')
			.get(function (err, canvas){
				equal(canvas.nodeName.toLowerCase(), 'canvas');

				FileAPI.upload({
					url: controllerUrl,
					files: {
						image: {
							name: 'my-file',
							blob: canvas
						}
					},
					complete: function (err, xhr){
						var res = FileAPI.parseJSON(xhr.responseText);
						imageEqual(res.images['image'].dataURL, 'files/samples/'+browser+'-vintage.png', 'caman vintage', function (){
							start();
						}, .9);
					}
				})
			})
		;
	});

	0 && FileAPI.html5 && test('upload + multi imageTransform', function (){
		var file = FileAPI.getFiles(uploadForm['dino.png'])[0];

		stop();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: file },
			imageTransform: {
				'jpeg': {
					width: 50,
					height: 50,
					type: 'image/jpeg'
				},
				'180deg': {
					width: 50,
					height: 50,
					rotate: 180
				},
				'custom': function (img, trans){
					trans.crop(100, 100, 200, 200).resize(20, 20);
				}
			},
			complete: function (err, res){
				var res = FileAPI.parseJSON(res.responseText);

				imageEqual(res.images['jpeg'].dataURL, 'files/samples/'+browser+'-dino-50x50.jpeg', 'dino jpeg', function (){
					imageEqual(res.images['180deg'].dataURL, 'files/samples/'+browser+'-dino-180deg-50x50.png', 'dino 180 deg', function (){
						imageEqual(res.images['custom'].dataURL, 'files/samples/'+browser+'-dino-custom.png', 'dino custom', function (){
							start();
						});
					});
				});
			}
		});
	});

	FileAPI.html5 && test('upload + imageTransform with postName', function (){
		var file = FileAPI.getFiles(uploadForm['dino.png'])[0];

		stop();
		FileAPI.upload({
			url: controllerUrl,
			files: { image: file },
			imageTransform: {
				'180deg': {
					postName: '180deg',
					width: 50,
					height: 50,
					rotate: 180
				}
			},
			complete: function (err, res){
				var res = FileAPI.parseJSON(res.responseText);
				ok('image' in res.data._FILES);
				ok('180deg' in res.data._FILES);
				equal(res.data._FILES['image'].name, 'dino.png');
				equal(res.data._FILES['180deg'].name, 'dino.png');
				start();
			}
		});
	});

	0 && test('iframe', function (){
		var html5 = FileAPI.support.html5;
		var queue = FileAPI.queue(function (){
			start();
			FileAPI.support.html5 = html5;
		});

		stop();
		FileAPI.support.html5 = false;

		// default callback
		queue.inc();
		FileAPI.upload({
			url: controllerUrl,
			complete: function (err, xhr){
				var json = FileAPI.parseJSON(xhr.responseText);
				equal(json.jsonp, 'callback', 'default');
				queue.next();
			}
		});

		// callback in GET
		queue.inc();
		FileAPI.upload({
			url: 'http://rubaxa.org/FileAPI/server/ctrl.php?fn=?',
			complete: function (err, xhr){
				var json = FileAPI.parseJSON(xhr.responseText);
				equal(json.jsonp, 'fn', 'custom');
				queue.next();
			}
		});

		// 302: redirect
		queue.inc();
		FileAPI.upload({
			url: 'http://rubaxa.org/FileAPI/server/redirect.php?page=json.html',
			complete: function (err, xhr){
				equal(xhr.responseText, 'done', '302');
				queue.next();
			}
		});
	});

	FileAPI.html5 && test('WebCam', function (){
		stop();
		FileAPI.Camera.publish(document.getElementById('web-cam'), function (err, cam){
			if( err ){
				ok(browser, 'phantomjs');
				start();
			}
			else {
				var shot = cam.shot();

				FileAPI.upload({
					url: controllerUrl,
					files: { shot: shot },
					complete: function (err, res){
						var res = FileAPI.parseJSON(res.responseText);

						imageEqual(res.images.shot.dataURL, shot, 'shot', function (){
							start();
						});
					}
				});
			}
		});
	});

})();
