module('FileAPI');

(function (){
	var serverUrl = 'http://rubaxa.org/FileAPI/server/ctrl.php';
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


	function imageEqual(left, right, text, callback){
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

					ok(failPixels/pixels < .01, text + ' (fail pixels: '+ (failPixels/pixels) +')');
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


	test('1px.gif', function (){
		var file	= FileAPI.getFiles(uploadForm['1px.gif'])[0];

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
			url: serverUrl,
			data: { str: 'foo', num: 1, array: [1, 2, 3], object: { foo: 'bar' } },
			complete: function (err, xhr){
				var res = FileAPI.parseJSON(xhr.responseText).data._REQUEST;

				start();
				equal(res.str, 'foo');
				equal(res.num, '1');

				if( !FileAPI.html5 ){
					deepEqual(res.array, { "0": '1', "1": '2', "2": '3' });
				}
				else {
					deepEqual(res.array, ['1', '2', '3']);
				}

				deepEqual(res.object, { foo: 'bar' });
			}
		})
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
		stop();

		var events = [];
		expect(12);

		var xhr = FileAPI.upload({
			url: serverUrl,
			data: { foo: 'bar' },
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

				if( res.data._FILES['1px_gif'] ){
					var type = res.data._FILES['1px_gif'].type;
					equal(res.data._FILES['1px_gif'].name, '1px.gif', 'file.name');
					equal(type, /application/.test(type) ? 'application/octet-stream' : 'image/gif', 'file.type');
				}
				else {
					ok(false, '1px_gif files');
				}

				if( res.images['1px_gif'] ){
					equal(res.images['1px_gif'].dataURL, 'data:image/gif;base64,' + base64_1px_gif, 'dataURL');
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
		stop();
		FileAPI.upload({
			url: serverUrl,
			files: { text: FileAPI.getFiles(uploadForm['hello.txt']) },
			complete: function (err, res){
				start();
				var res = FileAPI.parseJSON(res.responseText).data._FILES['text'];
				equal(res.name, 'hello.txt', 'file.name');
				equal(res.size, 15, 'file.size');
				equal(res.type, /application/.test(res.type) ? 'application/octet-stream' : 'text/plain', 'file.type');
			}
		});
	});


	test('multiupload (serial)', function (){
		stop();
		var
			  _start = 0
			, _complete = 0
			, _progress = 0
			, _progressFail = false
			, _files = {}
		;

		FileAPI.upload({
			url: serverUrl,
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
				if( _progress > evt.loaded ){
					_progressFail = true;
				}
				_progress = evt.loaded;
			},
			complete: function (err, xhr){
				start();

				equal(_start, _complete, 'uploaded');
				equal(_progressFail, false, 'progress');

				checkMultiuploadFiles(_files);
			}
		});
	});


	test('multiupload (one piece)', function (){
		stop();
		var bytesLoaded = -1;

		FileAPI.upload({
			url: serverUrl,
			files: FileAPI.getFiles(uploadForm['multiple']),
			serial: false,
			progress: function (evt, files){
				equal(files.length, 5);
				bytesLoaded = evt.loaded > bytesLoaded ? evt.loaded : -1;
			},
			complete: function (err, xhr){
				var files = FileAPI.parseJSON(xhr.responseText).data._FILES.files;
				FileAPI.each(files, function (file){ files[file.name] = file; });
				checkMultiuploadFiles(files);
				equal(xhr.total, bytesLoaded);
				start();
			}
		});
	});


	FileAPI.html5 && test('upload FileAPI.Image', function (){
		var file = FileAPI.getFiles(uploadForm['dino.png'])[0];
		var image = FileAPI.Image(file).rotate(90).preview(100);

		stop();
		FileAPI.upload({
			url: serverUrl,
			files: { image: image },
			complete: function (err, res){
				var res = FileAPI.parseJSON(res.responseText);

				imageEqual(res.images.image.dataURL, 'files/samples/'+browser+'-dino-90deg-100x100.png?1', 'dino 90deg 100x100', function (){
					start();
				});
			}
		});
	});


	FileAPI.html5 && test('upload + imageTransform', function (){
		var file = FileAPI.getFiles(uploadForm['image.jpg'])[0];

		stop();
		FileAPI.upload({
			url: serverUrl,
			files: { image: file },
			imageTransform: {
				width: 100,
				height: 100,
				rotate: 'auto',
				preview: true
			},
			complete: function (err, res){
				var res = FileAPI.parseJSON(res.responseText);

				imageEqual(res.images.image.dataURL, 'files/samples/'+browser+'-image-auto-100x100.jpeg', 'image auto 100x100.png', function (){
					start();
				});
			}
		});
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


	function checkMultiuploadFiles(files){
		checkFile(files['1px.gif'], '1px.gif', 'image/gif', 34);
		checkFile(files['dino.png'], 'dino.png', 'image/png', 461003);
		checkFile(files['hello.txt'], 'hello.txt', 'text/plain', 15);
		checkFile(files['image.jpg'], 'image.jpg', 'image/jpeg', 108338);

		// @todo: Сейчас через phantom "application/octet-stream"
//		checkFile(_files['lebowski.json'], 'lebowski.json', 'application/json', 5392);
	}
})();
