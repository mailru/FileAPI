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

	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>

	<script src="./FileAPI.js" type="text/javascript"></script>
	<script src="./lib/canvas-to-blob.js" type="text/javascript"></script>
	<script src="./lib/FileAPI.html.js" type="text/javascript"></script>
	<script src="./lib/FileAPI.XHR.js" type="text/javascript"></script>
	<script src="./lib/FileAPI.Form.js" type="text/javascript"></script>
	<script src="./lib/FileAPI.Image.js" type="text/javascript"></script>
	<script src="./lib/FileAPI.Flash.js" type="text/javascript"></script>

	<style>
		body {
			font-size: 15px;
			font-family: "Helvetica Neue";
		}

		.b-button {
			zoom: 1;
			display: inline-block;
			*display: inline;
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
				top: -40px;
				left: -100px;
				font-size: 50px;
				position: absolute;
			}
	</style>

</head>
<body>
	<div style="margin: 50px;">

		<div class="b-button">
			<div class="b-button__text">Upload one file</div>
			<span style="position: relative;"><input class="b-button__input" type="file" /></span>
		</div>

		<span style="padding: 0 10px">,</span>

		<div class="b-button">
			<div class="b-button__text">Multiple</div>
			<span style="position: relative;"><input class="b-button__input" type="file" multiple /></span>
		</div>

		<span style="padding: 0 30px">or</span>

		<div class="b-button">
			<div class="b-button__text">jpg, jpeg & gif</div>
			<span style="position: relative;"><input class="b-button__input" type="file" accept=".jpg,.jpeg,.gif" multiple /></span>
		</div>

	</div>


	<div id="drop-zone" style="display: none; width: 200px; height: 100px; margin: 20px; border: 3px dashed #06c; line-height: 100px; font-size: 30px; text-align: center;">
		Drag'n'Drop
	</div>

	<div id="Log" style="margin: 10px; padding: 10px; border: 1px solid green;"></div>
	<div id="Preview" style="margin: 10px; padding: 10px; border: 1px solid red;"></div>

	<script type="text/javascript">
		jQuery(function ($){
			if( FileAPI.support.html5 ){
				$('#drop-zone').show();
			}

			$(document).on('drop dragover', false);


			$('#drop-zone').on('dragenter dragleave dragover', function (evt){
				var over = evt.type != 'dragleave';
				$(this).css({ backgroundColor: over ? '#BAFFFA' : '', fontSize: over ? '35px' : '30px' });
				evt.preventDefault();
			});


			$('#drop-zone')
				.on('drop', function (evt){
					evt.preventDefault();
					$(this).trigger('dragleave');
					onFiles(evt);
				})
			;


			$('input[type="file"]').on('change', function (evt){
				onFiles(evt);
			});

			function onFiles(evt){
				var input = evt.target, files = FileAPI.getFiles(evt);

				FileAPI.log('onChange:', evt, files);

				FileAPI.getFiles(files, function (file, info){
					// filter function
					if( /image/.test(file.type) && info ){
						return	info.width > 100 || info.height > 100;
					}
					else {
						return	file.size > 512;
					}
				}, function (files, deleted){
					// result function
					FileAPI.log('filterFiles:', files, deleted);

					/* Preview */
					FileAPI.each(files, function (file){
						if( /image/.test(file.type) ){
							FileAPI.log('FileAPI.Image:', file);
							FileAPI.Image(file)
								.preview(150)
//								.rotate(90)
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
						url: '//www.local.git/FileAPI/index.php',
						data: {
							  num: 10
							, str: "foo"
						},
						files: {
							  photos: FileAPI.filter(files, function (file){ return /^image/.test(file.type) })
							, other:  FileAPI.filter(files, function (file){ return !/^image/.test(file.type) })
						},
						imageOriginal: false,
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
						beforeupload: function (){ FileAPI.log('beforeupload:', arguments) },
						upload: function (){ FileAPI.log('upload:', arguments) },
						fileupload: function (){ FileAPI.log('fileupload:', arguments) },
						fileprogress: function (){ FileAPI.log('fileprogress:', arguments) },
						filecomplete: function (err, xhr){
							FileAPI.log('filecomplete:', err, xhr);

							if( !err ){
								var result = FileAPI.parseJSON(xhr.responseText);

								FileAPI.each(result.images, function (dataURL, name){
									$('<div/>')
										.append('<div><b>'+name+'</b></div>')
										.append($(new Image).attr('src', dataURL))
										.css({ margin: 5, border: '1px dotted #666', padding: 5 })
										.appendTo('body')
									;
								});
								document.getElementById('Log').innerHTML += '<pre style="font-size: 11px;">'+result.data+'</pre>';
							}
						},

						progress: function (){ FileAPI.log('progress:', arguments) },
						complete: function (status, xhr){
							FileAPI.log('complete:', status, xhr);
						}
					});
					/**/
				});

				FileAPI.reset(input);
			}


		});
	</script>

</body>
</html>
