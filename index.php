<?php
	include	'./FileAPI.class.php';

	if( !empty($_SERVER['HTTP_ORIGIN']) ){
		header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
		header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
		header('Access-Control-Allow-Headers: Origin, X-Requested-With');
	}


	if( $_SERVER['REQUEST_METHOD'] == 'OPTIONS' ){
		exit;
	}


	if( strtoupper($_SERVER['REQUEST_METHOD']) == 'POST' ){
		header('HTTP/1.1 201 Created');

		$files	= FileAPI::getFiles();
		$images = array();
		fetchImages($files, $images);

		$jsonp	= isset($_REQUEST['callback']) ? trim($_REQUEST['callback']) : null;
		$json	= json_encode(array(
					  'images'	=> $images
					, 'data'	=> print_r(array(
									  '_REQUEST'	=> $_REQUEST
									, '_FILES'		=> FileAPI::getFiles()
								), true)
				));

		if( empty($jsonp) ){
			echo  $json;
		}
		else {
			echo  '<script type="text/javascript">'
				. '(function(ctx,jsonp){'
				. 	'if(ctx&&ctx[jsonp]){'
				.		'ctx[jsonp](200, "OK", "'.addslashes($json).'")'
				.	'}'
				. '})(this.parent, "'.$jsonp.'")'
				. '</script>'
			;
		}
		exit;
	}





	function fetchImages($files, &$images, $name = 'file'){
		if( isset($files['tmp_name']) ){
			$filename	= $files['tmp_name'];
			list($mime)	= explode(';', @mime_content_type($filename));

			if( strpos($mime, 'image') !== false ){
				$content = file_get_contents($filename);
				$images[$name] = 'data:'. $mime .';base64,'. base64_encode($content);
			}
		}
		else {
			foreach( $files as $name => $file ){
				fetchImages($file, $images, $name);
			}
		}
	}
?>
<!DOCTYPE html>
<html>
<head>

	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title>FileAPI :: TEST</title>

	<script>var FileAPI = { debug: true };</script>
	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>

	<script src="./FileAPI.js" type="text/javascript"></script>
	<script src="./lib/canvas-to-blob.js" type="text/javascript"></script>
	<script src="./lib/FileAPI.core.js" type="text/javascript"></script>
	<script src="./lib/FileAPI.XHR.js" type="text/javascript"></script>
	<script src="./lib/FileAPI.Form.js" type="text/javascript"></script>
	<script src="./lib/FileAPI.Image.js" type="text/javascript"></script>
	<script src="./lib/FileAPI.Flash.js" type="text/javascript"></script>
	<script src="./FileAPI.exif.js" type="text/javascript"></script>
	<script src="./FileAPI.id3.js" type="text/javascript"></script>

	<style>
		body {
			font-size: 15px;
			font-family: "Helvetica Neue";
		}

		.b-button {
			display: inline-block;
			*display: inline;
			*zoom: 1;
			position: relative;
			overflow: hidden;
			cursor: pointer;
			padding: 4px 15px;
			vertical-align: middle;
			border: 1px solid #ccc;
			border-radius: 3px;
			background-color: #f5f5f5;
			background: -moz-linear-gradient(top, #fff 0%, #f5f5f5 49%, #ececec 50%, #eee 100%); /* FF3.6+ */
			background: -webkit-linear-gradient(top, #fff 0%,#f5f5f5 49%,#ececec 50%,#eee 100%); /* Chrome10+,Safari5.1+ */
			background: -o-linear-gradient(top, #fff 0%,#f5f5f5 49%,#ececec 50%,#eee 100%); /* Opera 11.10+ */
			background: -ms-linear-gradient(top, #fff 0%,#f5f5f5 49%,#ececec 50%,#eee 100%); /* IE10+ */
			background: linear-gradient(to bottom, #fff 0%,#f5f5f5 49%,#ececec 50%,#eee 100%); /* W3C */
			-webkit-user-select: none;
			-moz-user-select: none;
			user-select: none;
		}
			.b-button:hover {
				border-color: #fa0;
				box-shadow: 0 0 2px #fa0;
			}

			.b-button__text {
			}

			.b-button__input {
				cursor: pointer;
				opacity: 0;
				filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);
				top: -10px;
				right: -40px;
				font-size: 50px;
				position: absolute;
			}
	</style>

</head>
<body>
	<div style="margin: 50px;">

		<div class="b-button js-fileapi-wrapper">
			<div class="b-button__text">Upload one file</div>
			<input name="files" class="b-button__input" type="file" />
		</div>

		<span style="padding: 0 10px">,</span>

		<div class="b-button js-fileapi-wrapper">
			<div class="b-button__text">Multiple</div>
			<input name="files" class="b-button__input" type="file" multiple />
		</div>

		<span style="padding: 0 30px">or</span>

		<div class="b-button js-fileapi-wrapper">
			<div class="b-button__text">gif, jpeg, png & etc.</div>
			<input name="files" class="b-button__input" type="file" accept="image/*" multiple />
		</div>

	</div>


	<div id="drop-zone" style="display: none; width: 200px; height: 100px; margin: 20px; border: 3px dashed #06c; line-height: 100px; font-size: 30px; text-align: center;">
		Drag'n'Drop
	</div>

	<div id="Log" style="margin: 10px; padding: 10px; border: 1px solid green;"></div>
	<div id="Preview" style="margin: 10px; padding: 10px; border: 1px solid red;"></div>

	<div id="__console" style="font-size: 12px; color: #333;"></div>

	<script type="text/javascript">
		if( !window.console ){
			window.console = {
				_div: document.getElementById('__console'),
				log: function (){
					this._div.innerHTML += [].join.call(arguments, ' ') + '<br/>';
				},
				error: function (){
					this._div.innerHTML += '<span style="color: red">';
					this.log.apply(this, arguments);
					this._div.innerHTML += '</span>';
				}
			};
		}


		jQuery(function ($){
			if( FileAPI.support.dnd ){
				$('#drop-zone').show().dnd(function (over){
					$(this).css({
						  fontSize: over ? '35px' : '30px'
						, backgroundColor: over ? '#BAFFFA' : ''
					});
				}, function (files){
					console.log('dropFiles:', files);
					onFiles(files);
				});
			}



			$('input[type="file"]').on('change', function (evt){
				var files = FileAPI.getFiles(evt);
				FileAPI.log('onChange:', evt);
				onFiles(files);
				FileAPI.reset(evt.currentTarget);
			});


			function onFiles(files){
				FileAPI.log('files:', files.length);

				FileAPI.filterFiles(files, function (file, info){
					// filter function
					if( /image/.test(file.type) && info ){
						return	info.width > 100 || info.height > 100;
					}
					else {
						return	file.size > 512 || !file.size;
					}
				}, function (files, deleted){
					// result function
					FileAPI.log('filterFiles:', files.length, deleted.length);

					/* Preview */
					FileAPI.each(files, function (file){
						/*
						FileAPI.each(['DataURL', 'BinaryString', 'ArrayBuffer'], function (type){
							FileAPI['readAs'+type](file, function (evt){
								if( evt.type == 'error' ){
									FileAPI.log('FileAPI.readAs'+type+' -- fail');
								}
								else if( evt.type == 'load' ){
									FileAPI.log('FileAPI.readAs'+type+' -- ok');
								}
							});
						});
						*/


						if( /image/.test(file.type) ){
							FileAPI.log('FileAPI.Image:', file);
							FileAPI.Image(file)
								.preview(150, 200)
								.rotate('auto')
								.get(function (err, image){
									FileAPI.log('preview:', err ? 'error' : 'ok');

									if( !err ){
										$(image)
											.prependTo('#Preview')
											.css({ opacity: 0 })
											.animate({ opacity: 1 }, 'fast')
										;
									}
								})
							;
						}
					});
					/**/


					/* Upload file */
					var xhr = FileAPI.upload({
						url: 'index.php',
						data: {
							  num: 10
							, str: "foo"
						},
						files: {
							  photos: FileAPI.filter(files, function (file){ return /^image/.test(file.type) })
							, other:  FileAPI.filter(files, function (file){ return !/^image/.test(file.type) })
						},
						imageOriginal: false,
						imageAutoOrientation: true,
						_imageTransform: {
							  maxWidth: 320
							, maxHeight: 240
							, rotate: 90
						},
						imageTransform: {
							'max600': {
								// resize by max side
								  maxWidth: 600
								, maxHeight: 500
							},
							'400x400': {
								// resize image
								  width: 400
								, height: 400
							},
							'preview': {
								// create preview
								  width: 100
								, height: 100
								, preview: true
							},
							'custom': function (image, transform){
								if( image.width > 150 ){
									transform
										.crop(100, 150, 200, 200)
										.resize(150)
										.rotate(90)
									;
								}
							}
						},

						prepare: function (file, options){
							options.data[FileAPI.uid()] = 1;
						},

						beforeupload: function (){
							FileAPI.log('beforeupload:', arguments);
						},

						upload: function (){
							FileAPI.log('upload:', arguments);
						},

						fileupload: function (file, xhr){
							FileAPI.log('fileupload:', file.name);
						},

						fileprogress: function (evt, file){
							FileAPI.log('fileprogress:', file.name, '--', evt.loaded/evt.total*100);
						},

						filecomplete: function (err, xhr, file){
							FileAPI.log('filecomplete:', err, file.name);

							if( !err ){
								try {
									var result = FileAPI.parseJSON(xhr.responseText);
								} catch (er){
									FileAPI.log('PARSE ERROR:', er.message);
								}

								FileAPI.each(result.images, function (dataURL, name){
									$('<div/>')
										.append('<div><b>'+name+'</b></div>')
										.append($(new Image).attr('src', dataURL))
										.css({ margin: 5, border: '1px dotted #666', padding: 5 })
										.appendTo('body')
									;
								});

								document.getElementById('Log').innerHTML += '<pre style="font-size: 11px;">'+xhr.responseText.substr(0, 200)+'</pre>';
							}
						},

						progress: function (evt, file){
							FileAPI.log('progress:', evt.loaded/evt.total*100, '('+file.name+')');
						},

						complete: function (err, xhr){
							FileAPI.log('complete:', err, xhr);
						}
					});
					/**/
				});
			}


		});
	</script>

</body>
</html>
