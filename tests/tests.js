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


	var serverUrl = 'http://rubaxa.org/FileAPI/server/ctrl.php';
	var uploadForm = document.forms.upload;
	var base64_1px_gif = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
	var dataURL_1px_gif = 'data:image/gif;base64,'+base64_1px_gif;
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


	test('defer', function (){
		expect(4);
		FileAPI.defer().resolve("resolve").done(function (val){ equal(val, "resolve") });
		FileAPI.defer().reject("reject").fail(function (val){ equal(val, "reject") });

		FileAPI.defer().then(function (val){ equal(val, "resolve") }).resolve("resolve");
		FileAPI.defer().then(null, function (val){ equal(val, "reject") }).reject("reject");
	});


	test('defer.progress', function (){
		var log = [];
		var defer = FileAPI.defer();
		defer.progress(function (a, b, c){ log.push((a|0) + (b|0) + (c|0)); });
		defer.notify();
		defer.notify(1);
		defer.notify(1, 2);
		defer.notify(1, 2, 3);
		equal(log.join('->'), '0->1->3->6');
	});


	test('getMimeType', function (){
		equal(FileAPI.getMimeType('image.jpg'), 'image/jpeg');
		equal(FileAPI.getMimeType('image.jpeg'), 'image/jpeg');
		equal(FileAPI.getMimeType({ name: 'image.jpg' }), 'image/jpeg');
		equal(FileAPI.getMimeType({ name: 'image.jpeg', type: '' }), 'image/jpeg');
		equal(FileAPI.getMimeType({ name: 'image', type: 'jpg' }), 'image/jpeg');
		equal(FileAPI.getMimeType({ name: 'image', type: 'jpeg' }), 'image/jpeg');
		equal(FileAPI.getMimeType('file.txt'), 'text/plain');
		equal(FileAPI.getMimeType('audio.flac'), 'audio/flac');
		equal(FileAPI.getMimeType('paint.bmp'), 'image/bmp');
	});


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


	test('1px.gif', function (){
		var file = FileAPI.getFiles(uploadForm['1px.gif'])[0];
		var queue = FileAPI.queue(start);

		stop();

		// File
		checkFile(file, '1px.gif', 'image/gif', 34);

		// File info
		queue.inc();
		FileAPI.getInfo(file, function (err, info){
			queue.next();

			ok(!err);
			equal(info.width, 1, 'getInfo.width');
			equal(info.height, 1, 'getInfo.height');
		});


		// Read as data
		queue.inc();
		FileAPI.readAsDataURL(file, function (evt){
			queue.next();

			if( evt.type == 'load' ){
				equal(evt.result, dataURL_1px_gif, 'readAsDataURL');
			} else if( evt.type != 'progress' ){
				ok(false, 'readAsDataURL: '+evt.error)
			}
		});

		// Read as binaryString
		queue.inc();
		FileAPI.readAsBinaryString(file, function (evt){
			queue.next();

			if( evt.type == 'load' ){
				equal(evt.result, FileAPI.toBinaryString(base64_1px_gif), 'readAsBinaryString');
			} else if( evt.type != 'progress' ){
				ok(false, 'readAsBinaryString: '+evt.error)
			}
		});

		if( FileAPI.html5 ){
			// Read as image
			queue.inc();
			FileAPI.readAsImage(file, function (evt){
				queue.next();

				if( evt.type == 'load' ){
					equal(evt.result.width, 1, 'readAsImage.width');
					equal(evt.result.height, 1, 'readAsImage.height');
				} else {
					ok(false, 'readAsImage')
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
      			url: 'http://rubaxa.org/FileAPI/server/ctrl.php',
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

		stop();
		checkFile(file, 'hello.txt', 'text/plain', 15);

		FileAPI.readAsText(file, function (evt){
			if( evt.type != 'progress' ){
				start();

				if( evt.type == 'load' ){
					equal(evt.result, 'Hello FileAPI!\n');
				} else {
					ok(false, 'readAsText: '+evt.error);
				}
			}
		});
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
			url: serverUrl,
			data: { str: 'foo', num: 1, array: [1, 2, 3], object: { foo: 'bar' } },
			headers: { 'x-foo': 'bar' },
			complete: function (err, xhr){
				var res = FileAPI.parseJSON(xhr.responseText).data._REQUEST;
				var headers = FileAPI.parseJSON(xhr.responseText).data.HEADERS;

				start();
				equal(res.str, 'foo', 'string');
				equal(res.num, '1', 'number');
				equal(headers['X-Foo'], 'bar', 'headers.X-Foo');

				if( !FileAPI.html5 || !FileAPI.support.html5 ){
					deepEqual(res.array, { "0": '1', "1": '2', "2": '3' }, 'array');
				}
				else {
					deepEqual(res.array, ['1', '2', '3'], 'array');
				}

				deepEqual(res.object, { foo: 'bar' }, 'object');
			}
		});
	});


	test('upload without files (II)', function (){
		var queue = FileAPI.queue(function (){
			start();
		});
		var doneFn = function (xhr){
			var res = FileAPI.parseJSON(xhr.responseText).data._REQUEST;
			equal(res.foo, 'bar');
			queue.next();
		};

		stop();
		queue.inc();
		queue.inc();

		FileAPI.upload(serverUrl+'?foo=bar').always(doneFn);
		FileAPI.upload(serverUrl+'?foo=bar', []).always(doneFn);
	});


	test('upload (short)', function (){
		stop();
		FileAPI.upload(serverUrl, FileAPI.getFiles(uploadForm['1px.gif'])).always(function (xhr){
			var res = FileAPI.parseJSON(xhr.responseText);
			equal(res.data._FILES['files'].name, '1px.gif', 'file.name');
			start();
		});
	});


	test('upload (short + postName)', function (){
		stop();
		FileAPI.upload(serverUrl, FileAPI.getFiles(uploadForm['1px.gif'])[0], { postName: "foo" }).always(function (xhr){
			var res = FileAPI.parseJSON(xhr.responseText);
			equal(res.data._FILES['foo'].name, '1px.gif', 'file.name');
			start();
		});
	});


	test('upload + postName (default)', function (){
		stop();

		FileAPI.upload({
			url: serverUrl,
			files: FileAPI.getFiles(uploadForm['1px.gif'])[0],
			complete: function (err, xhr){
				var res = FileAPI.parseJSON(xhr.responseText);
				equal(res.data._FILES['files'].name, '1px.gif', 'file.name');
				start();
			}
		});
	});


	test('upload + postName (gif)', function (){
		stop();
		FileAPI.upload({
			url: serverUrl,
			files: FileAPI.getFiles(uploadForm['1px.gif']),
			postName: 'gif',
			complete: function (err, xhr){
				var res = FileAPI.parseJSON(xhr.responseText);
				equal(res.data._FILES['gif'].name, '1px.gif', 'file.name');
				start();
			}
		});
	});


	test('upload input', function (){
		var rnd = Math.random(), events = [];
		expect(14);
		stop();

		var xhr = FileAPI.upload({
			url: serverUrl,
			data: { foo: 'bar' },
			headers: { 'x-foo': 'bar', 'x-rnd': rnd },
			files: uploadForm['1px.gif'],
			prepare: function (file, options){
				options.data.bar = 'qux';
				events.push('prepare');
			},
			upload: function (){
				events.push('upload');
			},
			fileupload: function (file/**Object*/, xhr/**Object*/, options/**Object*/){
				events.push('fileupload');
				equal(file.name, '1px.gif', 'name');
				equal(options.data.foo, 'bar', 'data.foo');
				equal(options.data.bar, 'qux', 'data.qux');
			},
			fileprogress: function (evt){
				if( evt.loaded == evt.total ){
					events.push('fileprogress');
				}
			},
			filecomplete: function (err, xhr){
				var res = FileAPI.parseJSON(xhr.responseText);

				events.push('filecomplete');
				equal(res.data._REQUEST.foo, 'bar');
				equal(res.data._REQUEST.bar, 'qux');
				equal(res.data.HEADERS['X-Foo'], 'bar', 'headers.X-Foo');
				equal(res.data.HEADERS['X-Rnd'], rnd, 'headers.X-Rnd');

				if( res.data._FILES['1px_gif'] ){
					var type = res.data._FILES['1px_gif'].type;
					equal(res.data._FILES['1px_gif'].name, '1px.gif', 'file.name');
					equal(type, /application/.test(type) ? 'application/octet-stream' : 'image/gif', 'file.type');
				}
				else {
					ok(false, '1px_gif files');
				}

				if( res.images['1px_gif'] ){
					equal(res.images['1px_gif'].dataURL, dataURL_1px_gif, 'dataURL');
					equal(res.images['1px_gif'].mime, 'image/gif', 'mime');
					equal(res.images['1px_gif'].width, 1, 'width');
					equal(res.images['1px_gif'].height, 1, 'height');
				}
				else {
					ok(false, '1px_gif images');
				}
			},
			complete: function (err, xhr){
				events.push('complete');
				equal(events.join('->'), 'prepare->upload->fileupload->fileprogress->filecomplete->success->complete');
				start();
			}
		});

		xhr.success(function (xhr){
			events.push('success');
		});
	});


	test('upload file', function (){
		var _progressFail = false, _progress = 0;
		stop();

		FileAPI.upload({
			url: serverUrl,
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


	test('multiupload (serial: true)', function (){
		stop();
		var
			  _start = 0
			, _complete = 0
			, _progress = 0
			, _progressFail = false
			, _files = {}
			, _events = []
		;

		FileAPI.upload({
			url: serverUrl,
			files: uploadForm['multiple'],
			upload: function (){ _events.push('upload'); },
			fileupload: function (){
				_start++;
				_events.push('fileupload');
			},
			filecomplete: function (err, xhr){
				var file = FileAPI.parseJSON(xhr.responseText).data._FILES.multiple;
				_complete++;
				_files[file.name] = file;
				_events.push('fileucomplete');
			},
			progress: function (evt){
				_progressFail = _progressFail || _checkProgressEvent(evt);
				if( !_progressFail && (_progress >= evt.loaded) ){
					_progressFail = true;
					ok(false, 'progress: '+_progress + ' > '+evt.loaded+', total: '+evt.total);
				}
				_progress = evt.loaded;
			},
			complete: function (err, xhr){
				start();

				equal(_start, _complete, 'uploaded');
				equal(_progressFail, false, 'progress > evt.total');
				equal(_events.join('->'), 'upload->fileupload->fileucomplete->fileupload->fileucomplete->fileupload->fileucomplete->fileupload->fileucomplete->fileupload->fileucomplete');

				checkMultiuploadFiles(_files);
			}
		});
	});


	test('multiupload (serial: false)', function (){
		stop();
		var
			  bytesLoaded = -1
			, _events = []
			, _start = 0
			, _complete = 0
		;

		FileAPI.upload({
			url: serverUrl,
			files: FileAPI.getFiles(uploadForm['multiple']),
			serial: false,
			upload: function (){ _events.push('upload'); },
			fileupload: function (){
				_start++;
				_events.push('fileupload');
			},
			filecomplet: function (){
				_complete++;
				_events.push('fileucomplete');
			},
			progress: function (evt, files){
				equal(files.length, 5);
				bytesLoaded = evt.loaded > bytesLoaded ? evt.loaded : -1;
			},
			complete: function (err, xhr){
				var files = FileAPI.parseJSON(xhr.responseText).data._FILES.files;
				FileAPI.each(files, function (file){ files[file.name] = file; });
				checkMultiuploadFiles(files);

				equal(_start, 0, 'start == 0');
				equal(_start, _complete, 'uploaded');

				equal(xhr.total, 574782, 'total');
				equal(xhr.total, bytesLoaded, xhr.total+' total === '+bytesLoaded+' loaded');

				equal(_events.join('->'), 'upload');
				start();
			}
		});
	});


	test('multiupload (parallel: true)', function (){
		var
			  max = 3
			, cnt = 0
			, active = 0
			, progress = 0
		;

		stop();
		FileAPI.upload(serverUrl, uploadForm['multiple'], {
			parallel: max,
			fileupload: function (){
				cnt++;
				(cnt > max) && ok(false, 'fileupload: '+cnt+' > '+max);
			},
			filecomplete: function (err, xhr){
				(cnt > max) && ok(false, 'filecomplete: '+cnt+' > '+max);

				if( cnt == max ){
					active = cnt;
					equal(xhr.activeFiles.length, max-1, 'activeFiles.length == max')
				}

				cnt--;
			},
			progress: function (evt){
				if( progress > evt.loaded ){
					ok(false, 'progress: '+progress+' > '+evt.loaded+', total: '+evt.total);
				}
				progress = evt.loaded;
			},
			complete: function (){
				equal(active, max, 'active: '+active+' == '+max);
				start();
			}
		})
	});


	FileAPI.html5 && test('upload FileAPI.Image', function (){
		var file = FileAPI.getFiles(uploadForm['dino.png'])[0];
		var image = FileAPI.Image(file).rotate(90+360).preview(100);
		var _progressFail = false, _progress = 0;

		stop();
		FileAPI.upload({
			url: serverUrl,
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
			complete: function (err, res){
				var res = FileAPI.parseJSON(res.responseText);

				ok(_progress > 0, 'progress event');
				equal(res.data.HEADERS['X-Foo'], 'bar', 'X-Foo');

				imageEqual(res.images.image.dataURL, 'files/samples/'+browser+'-dino-90deg-100x100.png?1', 'dino 90deg 100x100', function (){
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
			url: serverUrl,
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
			url: 'http://rubaxa.org/FileAPI/server/ctrl.php',
			files: { image: file },
			imageTransform: { width: 100, height: 100, strategy: 'max' },
			complete: function (err, res){
				queue.next();
				var res = FileAPI.parseJSON(res.responseText);
				equal(res.images['image'].width, 100, 'max.width');
				equal(res.images['image'].height, 71, 'max.height');
			}
		});

		// preview
		queue.inc();
		FileAPI.upload({
			url: 'http://rubaxa.org/FileAPI/server/ctrl.php',
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
			url: 'http://rubaxa.org/FileAPI/server/ctrl.php',
			files: { image: file },
			imageAutoOrientation: true,
			complete: check.bind('imageAutoOrientation')
		});

		queue.inc();
		FileAPI.upload({
			url: 'http://rubaxa.org/FileAPI/server/ctrl.php',
			files: { image: file },
			imageTransform: { rotate: 'auto' },
			complete: check.bind('imageTransform.rotate.auto')
		});

		queue.inc();
		FileAPI.upload({
			url: 'http://rubaxa.org/FileAPI/server/ctrl.php',
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
				equal(canvas.nodeName.toLowerCase(), 'canvas', 'upload canvas');

				FileAPI.upload({
					url: serverUrl,
					files: {
						image: {
							name: 'my-file',
							blob: canvas
						}
					},
					complete: function (err, xhr){
						var res = FileAPI.parseJSON(xhr.responseText);
						if( res.images['image'] ){
							imageEqual(res.images['image'].dataURL, 'files/samples/'+browser+'-vintage.png', 'caman vintage', function (){
								start();
							}, .9);
						}
						else {
							ok(false, 'upload failed');
							start();
						}
					}
				})
			})
		;
	});


	FileAPI.html5 && test('upload + multi imageTransform', function (){
		var file = FileAPI.getFiles(uploadForm['dino.png'])[0];

		stop();
		FileAPI.upload({
			url: serverUrl,
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
			url: serverUrl,
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


	test('iframe', function (){
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
			url: serverUrl,
			complete: function (err, xhr){
				var json = FileAPI.parseJSON(xhr.responseText);
				equal(json.jsonp, 'callback', 'default');
				queue.next();
			}
		});

		// callback in GET
		queue.inc();
		FileAPI.upload({
			url: serverUrl + '?fn=?',
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
					url: serverUrl,
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


	!isPhantomJS && FileAPI.html5 && test('load remote file', function (){
		var queue = FileAPI.queue(function (){ start(); });
		var progress = {};

		stop();
		queue.inc();
		queue.inc();
		queue.inc();

		// Success
		FileAPI.load('./files/1px.gif')
			.progress(function (evt){
				progress = evt;
			})
			.done(function (blob){
				equal(progress.loaded, 34, 'loaded == 34');
				equal(progress.loaded, progress.total, 'loaded === total');

				equal(blob.type, 'image/gif');
				equal(blob.size, progress.total, 'size === total');

				FileAPI.readAsDataURL(blob, function (evt){
					if( evt.type !== 'progress' ){
						equal(evt.result, dataURL_1px_gif, 'dataURL');
						queue.next();
					}
				});
			})
			.fail(function (){
				ok(false, '1px.gif — response not Blob');
				start();
			})
		;

		// Fail
		FileAPI.load('./fail.txt').fail(function (statusText, xhr){
			equal(xhr.status, 404, '404 status');
			queue.next();
		});

		// Abort
		var xhr = FileAPI.load('./files/dino.png').fail(function (statusText){
			equal(statusText, 'abort');
			queue.next();
		});

		xhr.abort();
	});


	!isPhantomJS && test('saveAs', function (){
		var progress = {};
		stop();

		FileAPI.saveAs('./files/dino.png', 'test.png')
			.progress(function (evt){
				progress = evt;
			})
			.then(function (){
				equal(progress.loaded, 461003, 'loaded');
				start();
			}, function (err){
				equal(err, null);
			})
		;
	});


	function checkMultiuploadFiles(files){
		checkFile(files['1px.gif'], '1px.gif', 'image/gif', 34);
		checkFile(files['dino.png'], 'dino.png', 'image/png', 461003);
		checkFile(files['hello.txt'], 'hello.txt', 'text/plain', 15);
		checkFile(files['image.jpg'], 'image.jpg', 'image/jpeg', 108338);

		// @todo: Сейчас через phantom "application/octet-stream"
//		checkFile(_files['lebowski.json'], 'lebowski.json', 'application/json', 5392);
	}
})();
